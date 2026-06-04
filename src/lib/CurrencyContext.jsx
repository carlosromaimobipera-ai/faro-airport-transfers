import React, { createContext, useContext, useState, useEffect } from 'react';

export const CURRENCIES = {
  EUR: { symbol: '€', label: 'EUR — Euro', locale: 'pt-PT' },
  GBP: { symbol: '£', label: 'GBP — Pound', locale: 'en-GB' },
  USD: { symbol: '$', label: 'USD — Dollar', locale: 'en-US' },
  BRL: { symbol: 'R$', label: 'BRL — Real', locale: 'pt-BR' },
  CHF: { symbol: 'Fr', label: 'CHF — Franc', locale: 'de-CH' },
  SEK: { symbol: 'kr', label: 'SEK — Krona', locale: 'sv-SE' },
};

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(
    () => localStorage.getItem('selected_currency') || 'EUR'
  );
  const [rates, setRates] = useState({ EUR: 1, GBP: 0.85, USD: 1.09, BRL: 5.40, CHF: 0.97, SEK: 11.5 });

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/EUR')
      .then(res => res.json())
      .then(data => {
        if (data?.rates) setRates(data.rates);
      })
      .catch(() => {}); // silently use fallback rates
  }, []);

  const setCurrency = (code) => {
    setCurrencyState(code);
    localStorage.setItem('selected_currency', code);
  };

  const convert = (amountEUR) => {
    const rate = rates[currency] ?? 1;
    return amountEUR * rate;
  };

  const formatPrice = (amountEUR) => {
    const converted = convert(amountEUR);
    const details = CURRENCIES[currency] ?? CURRENCIES.EUR;
    return new Intl.NumberFormat(details.locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, formatPrice, rates }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);