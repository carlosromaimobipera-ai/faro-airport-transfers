import React from 'react';
import { useCurrency, CURRENCIES } from '@/lib/CurrencyContext';

export default function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      className="text-sm bg-transparent border border-border rounded-md px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring h-auto min-h-0 min-w-0"
    >
      {Object.entries(CURRENCIES).map(([code, { symbol, label }]) => (
        <option key={code} value={code}>
          {symbol} {code}
        </option>
      ))}
    </select>
  );
}