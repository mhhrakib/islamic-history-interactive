import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from "react";

export type Language = "en" | "bn";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// Preload translations for better performance
const preloadTranslations = async (lang: Language) => {
  try {
    const response = await fetch(`/locales/${lang}.json`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      // Store in sessionStorage for immediate access
      sessionStorage.setItem(`translations_${lang}`, JSON.stringify(data));
      console.log(
        `Preloaded ${Object.keys(data).length} translations for ${lang}`
      );
    }
  } catch (error) {
    console.warn(`Failed to preload translations for ${lang}:`, error);
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const storedLang = localStorage.getItem("language") as Language;
      return storedLang === "en" || storedLang === "bn" ? storedLang : "en";
    } catch (error) {
      console.error(
        "Could not access localStorage, defaulting to English.",
        error
      );
      return "en";
    }
  });

  // Preload translations on mount
  useEffect(() => {
    // Preload current language
    preloadTranslations(language);

    // Also preload the other language for faster switching
    const otherLang = language === "en" ? "bn" : "en";
    preloadTranslations(otherLang);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("language", language);
    } catch (error) {
      console.error("Failed to save language to localStorage", error);
    }

    const root = window.document.documentElement;
    if (language === "bn") {
      root.style.setProperty("--font-sans", "'Noto Serif Bengali'");
      root.style.setProperty("--font-serif", "'Noto Serif Bengali'");
    } else {
      root.style.setProperty("--font-sans", "'Noto Sans'");
      root.style.setProperty("--font-serif", "'Merriweather'");
    }
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
