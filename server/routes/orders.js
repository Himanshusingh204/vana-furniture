const express = require('express');
const router = express.Router();
const db = require('../db/database');
const events = require('../utils/events');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { orderLimiter } = require('../middleware/security');
const { isEmail, isPhone, validateOrderItems } = require('../utils/validate');
const asyncHandler = require('../utils/asyncHandler');
const dbQueue = require('../utils/dbQueue');
const { ok, fail } = require('../utils/respond');

const STAGES = ['CAD & Timber Verification','Kiln & Cutting','CNC Milling','Hand Joinery & Assembly','Finishing & Oil Rubbing','Ready for Dispatch','Dispatched'];

function isValidStage(stage) {
  return STAGES.includes(stage);
}

// Create new order (Public checkout)
router.post('/', orderLimiter, asyncHandler(async (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      items,
      payment_structure // '50% Production Deposit' | '100% Full Payment'
    } = req.body;

    if (!customer_name || !customer_email || !customer_phone || !items || !items.length) {
      return fail(res, 400, 'Customer details and items are required.');
    }

    if (!isEmail(String(customer_email))) {
      return fail(res, 400, 'Invalid customer_email format.', 'INVALID_EMAIL');
    }
    if (!isPhone(String(customer_phone))) {
      return fail(res, 400, 'Invalid customer_phone format.', 'INVALID_PHONE');
    }

    const checked = validateOrderItems(items);
    if (checked.error) {
      return res.status(400).json({ error: checked.error, code: 'INVALID_ITEMS' });
    }

    // Calculate financials — DB price_inr ONLY. Unknown product_id => 400.
    let subtotal = 0;
    const validatedItems = [];
    for (const norm of checked.value) {
      const raw = items.find((it) => it && String(it.product_id).trim() === norm.product_id) || {};
      const prod = db.getProductById(norm.product_id);
      if (!prod) {
        return fail(res, 400, `Unknown product_id: ${norm.product_id}`, 'UNKNOWN_PRODUCT');
      }
      const unitPrice = Number(prod.price_inr);
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        return res.status(400).json({ error: `Invalid DB price for product_id: ${norm.product_id}`, code: 'INVALID_PRICE' });
      }
      const qty = norm.quantity;
      subtotal += unitPrice * qty;
      validatedItems.push({
        product_id: norm.product_id,
        product_name: prod.name,
        finish_selected: raw.finish_selected || 'Standard Artisan Oil Finish',
        quantity: qty,
        unit_price_inr: unitPrice
      });
    }

    const gstRate = 0.18; // 18% GST for luxury woodwork in India
    const taxGst = Math.round(subtotal * gstRate);
    const shipping = subtotal > 150000 ? 0 : 6500; // Free white-glove shipping on high-value orders
    const grandTotal = subtotal + taxGst + shipping;

    const isDeposit = payment_structure === '50% Production Deposit';
    const depositPaid = isDeposit ? Math.round(grandTotal * 0.5) : grandTotal;
    const balanceDue = grandTotal - depositPaid;

    const orderData = {
      customer_name: customer_name.trim(),
      customer_email: customer_email.trim(),
      customer_phone: customer_phone.trim(),
      shipping_address: shipping_address || {
        street: 'Commercial / Residential Delivery',
        city: 'Jodhpur',
        state: 'Rajasthan',
        postal_code: '342005',
        country: 'India'
      },
      items: validatedItems,
      subtotal_inr: subtotal,
      tax_gst_inr: taxGst,
      shipping_inr: shipping,
      total_inr: grandTotal,
      payment_structure: payment_structure || 'Factory Commission Contract',
      deposit_paid_inr: depositPaid,
      balance_due_inr: balanceDue,
      payment_status: isDeposit ? 'Deposit Paid' : 'Factory Direct Contract'
    };

    const newOrder = await dbQueue.run(() => db.createOrder(orderData));

    // Broadcast real-time event to Admin Console
    events.emit('ORDER_PLACED', {
      order: {
        id: newOrder.id,
        order_number: newOrder.order_number,
        customer_name: newOrder.customer_name,
        total_inr: newOrder.total_inr,
        deposit_paid_inr: newOrder.deposit_paid_inr,
        created_at: newOrder.created_at
      },
      message: `New order ${newOrder.order_number} confirmed! Value: INR ${newOrder.total_inr.toLocaleString('en-IN')}`
    });

    res.status(201).json({
      success: true,
      message: 'Your bespoke order has been confirmed with our Basni factory manufacturing floor.',
      data: newOrder,
      order: newOrder
    });
  } catch (err) {
    console.error('Order creation error:', err);
    return fail(res, 500, 'Failed to process order');
  }
}));

// Admin: Get all orders
router.get('/', requireAuth, (req, res) => {
  try {
    const orders = db.getOrders();
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

// Get order by ID or Order Number (Public / Client Tracking)
router.get('/:id', (req, res) => {
  try {
    const order = db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    // Scrub sensitive customer contact details for public queries
    // (financials included: needed for buyer GST invoice + EMI math; no PII)
    const sanitizedOrder = {
      order_number: order.order_number,
      manufacturing_stage: order.manufacturing_stage,
      items: order.items,
      subtotal_inr: order.subtotal_inr,
      tax_gst_inr: order.tax_gst_inr,
      shipping_inr: order.shipping_inr,
      total_inr: order.total_inr,
      deposit_paid_inr: order.deposit_paid_inr,
      balance_due_inr: order.balance_due_inr,
      payment_status: order.payment_status,
      created_at: order.created_at
    };

    res.json({ success: true, data: sanitizedOrder });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve order' });
  }
});

// Admin: Update order manufacturing stage
router.patch('/:id/stage', requireAuth, requireRole('editor', 'admin'), asyncHandler(async (req, res) => {
  try {
    const { stage } = req.body;
    if (!stage) return fail(res, 400, 'Manufacturing stage is required');
    if (!isValidStage(stage)) {
      return res.status(400).json({ error: 'Unknown manufacturing stage.', code: 'INVALID_STAGE', allowed: STAGES });
    }

    const updated = await dbQueue.run(() => db.updateOrderStage(req.params.id, stage));
    if (!updated) return fail(res, 404, 'Order not found');

    events.emit('ORDER_STAGE_UPDATED', {
      order_id: updated.id,
      order_number: updated.order_number,
      manufacturing_stage: updated.manufacturing_stage,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    return fail(res, 500, 'Failed to update order stage');
  }
}));

module.exports = router;
// Exposed for security wiring asserts
module.exports.STAGES = STAGES;
module.exports.isValidStage = isValidStage;
