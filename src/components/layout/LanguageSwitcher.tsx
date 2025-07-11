import React from "react";
import { useTranslation } from "../../hooks/useTranslation";

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "bn" : "en");
  };

  return (
    <button
      onClick={toggleLanguage}
      className="p-2 rounded-full font-bold text-sm border-2 border-primary dark:border-green-400 text-primary dark:text-green-400 hover:bg-primary/10 dark:hover:bg-green-400/10 transition-colors w-10 h-10 flex items-center justify-center"
      aria-label={t("languageSwitcher.toggle")}
    >
      {language === "en" ? t("language.bn") : t("language.en")}
    </button>
  );
};
