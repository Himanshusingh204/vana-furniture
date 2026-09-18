import React from 'react';
import { formatINR } from '../utils/formatters';
import { Printer } from 'lucide-react';

// Printable GST invoice from a sanitized order payload (no PII required).
export default function GstInvoice({ order }) {
  if (!order) return null;
  const items = order.items || [];
  return (
    <div className="invoice-card">
      <div className="invoice-head">
        <div>
          <div className="invoice-title">Tax Invoice · VANA Architectural Woodcraft</div>
          <div className="invoice-sub">Basni Phase II, Jodhpur 342005 · GSTIN 08AAACJ1234F1Z8 · IEC-JOD-99214</div>
        </div>
        <button className="btn btn-secondary invoice-print" onClick={() => window.print()}>
          <Printer size={14} /> Print
        </button>
      </div>
      <div className="invoice-meta">
        <span>Order <strong>{order.order_number}</strong></span>
        <span>Placed {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN') : ''}</span>
        <span>Status <strong>{order.payment_status}</strong></span>
      </div>
      <table className="invoice-table">
        <thead>
          <tr><th>Item</th><th>Qty</th><th style={{ textAlign: 'right' }}>Amount</th></tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td>{it.product_name}<span className="invoice-finish">{it.finish_selected}</span></td>
              <td>{it.quantity}</td>
              <td style={{ textAlign: 'right' }}>{formatINR((it.unit_price_inr || 0) * (it.quantity || 1))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="invoice-totals">
        <div><span>Subtotal</span><span>{formatINR(order.subtotal_inr || 0)}</span></div>
        <div><span>GST 18%</span><span>{formatINR(order.tax_gst_inr || 0)}</span></div>
        <div><span>White-glove shipping</span><span>{(order.shipping_inr || 0) === 0 ? 'Free' : formatINR(order.shipping_inr)}</span></div>
        <div className="grand"><span>Grand total</span><span>{formatINR(order.total_inr || 0)}</span></div>
        <div><span>Paid</span><span>{formatINR(order.deposit_paid_inr || 0)}</span></div>
        <div><span>Balance due</span><span>{formatINR(order.balance_due_inr || 0)}</span></div>
      </div>
    </div>
  );
}
