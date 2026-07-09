'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'agrishield-language';
const SUPPORTED_LANGUAGES = ['en', 'hi', 'te'];

const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
});

function getInitialLanguage() {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (SUPPORTED_LANGUAGES.includes(stored)) {
    return stored;
  }

  const browserLanguage = window.navigator.language?.slice(0, 2);
  return SUPPORTED_LANGUAGES.includes(browserLanguage) ? browserLanguage : 'en';
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    setLang(getInitialLanguage());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
