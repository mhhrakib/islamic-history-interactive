
import { useContext, useState, useEffect } from 'react';
import { LanguageContext, Language } from '../contexts/LanguageContext';

export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }

    const { language, setLanguage } = context;
    const [translations, setTranslations] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const loadTranslations = async (lang: Language) => {
            setIsLoading(true);
            try {
                const response = await fetch(`/locales/${lang}.json`);
                if (!response.ok) throw new Error(`Failed to load translations for ${lang}`);
                const data = await response.json();
                if (isMounted) {
                    setTranslations(data);
                }
            } catch (error) {
                console.error(`Could not load translations for ${lang}`, error);
                // Fallback to English if the selected language fails to load
                if (lang !== 'en') {
                   try {
                     const fallbackResponse = await fetch(`/locales/en.json`);
                     if(fallbackResponse.ok){
                        const fallbackData = await fallbackResponse.json();
                        if (isMounted) {
                           setTranslations(fallbackData);
                        }
                     }
                   } catch (fallbackError) {
                       console.error('Could not load fallback English translations.', fallbackError);
                       if(isMounted) setTranslations({}); // Set to empty if all fails
                   }
                } else if(isMounted) {
                    setTranslations({}); // Set to empty if english fails
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };
        
        loadTranslations(language);

        return () => {
            isMounted = false;
        };
    }, [language]);
    
    const t = (key: string, params?: Record<string, string | number>): string => {
        if (isLoading) return '...'; // Or some other loading indicator
        
        let translation = translations[key] || key;
        
        if (params) {
            Object.keys(params).forEach(paramKey => {
                translation = translation.replace(`{${paramKey}}`, String(params[paramKey]));
            });
        }
        
        return translation;
    };

    return { language, setLanguage, t, isLoading };
};
