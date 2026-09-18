import React, { useState } from 'react';
import { formatINR } from '../utils/formatters';
import { emiMonthly } from '../utils/shop';
import { CreditCard } from 'lucide-react';

// No-cost EMI explorer. Flat division, no interest math surprises.
export default function EmiCalculator({ priceInr, compact = false }) {
  const [downPct, setDownPct] = useState(20);
  const [months, setMonths] = useState(12);
  const monthly = emiMonthly(priceInr, downPct, months);
  const down = Math.round((Number(priceInr) || 0) * (downPct / 100));

  return (
    <div className="emi-card" style={compact ? { padding: '1rem' } : undefined}>
      <div className="emi-head">
        <CreditCard size={16} />
        <span>EMI planner · no-cost</span>
      </div>
      <div className="emi-monthly">{formatINR(monthly)}<span>/mo</span></div>
      <div className="emi-sub">
        {formatINR(priceInr)} total · {formatINR(down)} down ({downPct}%) · {months} months
      </div>
      <div className="emi-controls">
        <label>
          Down payment
          <select value={downPct} onChange={(e) => setDownPct(Number(e.target.value))} aria-label="Down payment percent">
            {[0, 10, 20, 30, 50].map((d) => (
              <option key={d} value={d}>{d}%</option>
            ))}
          </select>
        </label>
        <label>
          Tenure
          <select value={months} onChange={(e) => setMonths(Number(e.target.value))} aria-label="EMI tenure in months">
            {[3, 6, 9, 12, 18, 24].map((m) => (
              <option key={m} value={m}>{m} mo</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
