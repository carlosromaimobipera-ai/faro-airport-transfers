import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext({ lang: 'en', setLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const stored = localStorage.getItem('lang');
    // Detect browser language
    if (!stored) {
      const browser = navigator.language?.slice(0, 2);
      const supported = ['pt', 'en', 'es', 'fr', 'de', 'nl'];
      return supported.includes(browser) ? browser : 'en';
    }
    return stored;
  });

  const changeLang = (code) => {
    setLang(code);
    localStorage.setItem('lang', code);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}