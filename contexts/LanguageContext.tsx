
import React, { createContext, useState, useEffect, ReactNode, useMemo } from 'react';

export type Language = 'en' | 'bn';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const storedLang = localStorage.getItem('language') as Language;
      return storedLang === 'en' || storedLang === 'bn' ? storedLang : 'en';
    } catch (error) {
      console.error("Could not access localStorage, defaulting to English.", error);
      return 'en';
    }
  });

  useEffect(() => {
    try {
        localStorage.setItem('language', language);
    } catch (error) {
        console.error("Failed to save language to localStorage", error);
    }
    
    const root = window.document.documentElement;
    if (language === 'bn') {
      root.style.setProperty('--font-sans', "'Noto Serif Bengali'");
      root.style.setProperty('--font-serif', "'Noto Serif Bengali'");
    } else {
      root.style.setProperty('--font-sans', "'Noto Sans'");
      root.style.setProperty('--font-serif', "'Merriweather'");
    }
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};