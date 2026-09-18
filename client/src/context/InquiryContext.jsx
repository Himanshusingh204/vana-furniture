import React, { createContext, useContext, useState, useEffect } from 'react';

const InquiryContext = createContext();

const INQUIRY_KEY = 'vana_inquiry_list';
const LEGACY_INQUIRY_KEY = 'jodhpur_inquiry_list';

function readInitialItems() {
  try {
    const saved = localStorage.getItem(INQUIRY_KEY);
    if (saved) return JSON.parse(saved);
    // One-time migration from the legacy key.
    const legacy = localStorage.getItem(LEGACY_INQUIRY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      try {
        localStorage.setItem(INQUIRY_KEY, JSON.stringify(parsed));
        localStorage.removeItem(LEGACY_INQUIRY_KEY);
      } catch (e) {
        // ignore persistence failure during migration
      }
      return Array.isArray(parsed) ? parsed : [];
    }
    return [];
  } catch (e) {
    return [];
  }
}

export function InquiryProvider({ children }) {
  const [items, setItems] = useState(readInitialItems);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(INQUIRY_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Could not persist inquiry items', e);
    }
  }, [items]);

  // Adds `quantity` units in a single state update (no loop-add from callers).
  // Signature is backwards-compatible: 3rd arg may be (customNotes, quantity)
  // or a legacy numeric quantity.
  const addPieceToInquiry = (product, finish, customNotes = '', quantity = 1) => {
    let notes = customNotes;
    let qty = quantity;
    if (typeof customNotes === 'number') {
      qty = customNotes;
      notes = '';
    }
    const count = Math.max(1, Math.floor(Number(qty) || 1));
    setItems(prev => {
      const existingIdx = prev.findIndex(
        i => i.product_id === product.id && i.finish_selected === finish
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + count
        };
        return updated;
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          wood_type: product.wood_type,
          finish_selected: finish,
          price_estimate_inr: product.price_inr,
          quantity: count,
          custom_notes: notes || ''
        }
      ];
    });
    setIsDrawerOpen(true);
  };

  // Explicit bulk-add alias used by PDP quantity selectors.
  const addMany = (product, finish, qty = 1, customNotes = '') => {
    addPieceToInquiry(product, finish, customNotes, qty);
  };

  const removePiece = (index) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateQuantity = (index, delta) => {
    setItems(prev => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) return prev.filter((_, idx) => idx !== index);
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const clearInquiry = () => {
    setItems([]);
  };

  const totalEstimate = items.reduce((sum, i) => sum + (i.price_estimate_inr * i.quantity), 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <InquiryContext.Provider
      value={{
        items,
        addPieceToInquiry,
        addMany,
        removePiece,
        updateQuantity,
        clearInquiry,
        totalEstimate,
        itemCount,
        isDrawerOpen,
        setIsDrawerOpen
      }}
    >
      {children}
    </InquiryContext.Provider>
  );
}

export function useInquiry() {
  const ctx = useContext(InquiryContext);
  if (!ctx) {
    return {
      items: [],
      addPieceToInquiry: () => {},
      addMany: () => {},
      removePiece: () => {},
      updateQuantity: () => {},
      clearInquiry: () => {},
      totalEstimate: 0,
      itemCount: 0,
      isDrawerOpen: false,
      setIsDrawerOpen: () => {}
    };
  }
  return ctx;
}
