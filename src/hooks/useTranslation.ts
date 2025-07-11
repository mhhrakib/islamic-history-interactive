
import { useContext, useState, useEffect, useMemo } from 'react';
import { LanguageContext, Language } from '../contexts/LanguageContext';

// Global cache for translations to avoid multiple requests
const translationCache: Record<Language, Record<string, string>> = {
    en: {},
    bn: {}
};

// Global loading state to prevent multiple simultaneous requests
let isLoadingTranslations = false;
let loadingPromise: Promise<void> | null = null;

// Initialize cache from sessionStorage if available
const initializeCacheFromStorage = () => {
    try {
        ['en', 'bn'].forEach((lang) => {
            const stored = sessionStorage.getItem(`translations_${lang}`);
            if (stored) {
                const data = JSON.parse(stored);
                translationCache[lang as Language] = data;
                console.log(`Loaded ${Object.keys(data).length} cached translations for ${lang}`);
            }
        });
    } catch (error) {
        console.warn('Failed to load cached translations:', error);
    }
};

// Initialize cache on module load
initializeCacheFromStorage();

export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }

    const { language, setLanguage } = context;
    const [translations, setTranslations] = useState<Record<string, string>>(translationCache[language] || {});
    const [isLoading, setIsLoading] = useState(Object.keys(translationCache[language]).length === 0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        
        const loadTranslations = async (lang: Language) => {
            // If already cached, use immediately
            if (Object.keys(translationCache[lang]).length > 0) {
                if (isMounted) {
                    setTranslations(translationCache[lang]);
                    setIsLoading(false);
                    setError(null);
                }
                return;
            }

            // Check sessionStorage for preloaded translations
            try {
                const stored = sessionStorage.getItem(`translations_${lang}`);
                if (stored) {
                    const data = JSON.parse(stored);
                    translationCache[lang] = data;
                    if (isMounted) {
                        setTranslations(data);
                        setIsLoading(false);
                        setError(null);
                    }
                    return;
                }
            } catch (error) {
                console.warn(`Failed to load cached translations for ${lang}:`, error);
            }

            // If already loading, wait for the existing promise
            if (isLoadingTranslations && loadingPromise) {
                try {
                    await loadingPromise;
                    if (isMounted) {
                        setTranslations(translationCache[lang]);
                        setIsLoading(false);
                        setError(null);
                    }
                } catch (error) {
                    if (isMounted) {
                        setError(error instanceof Error ? error.message : 'Unknown error');
                        setIsLoading(false);
                    }
                }
                return;
            }

            // Start new loading process
            isLoadingTranslations = true;
            setIsLoading(true);
            setError(null);

            loadingPromise = (async () => {
                try {
                    console.log(`Loading translations for language: ${lang}`);
                    const response = await fetch(`/locales/${lang}.json`, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                        },
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: Failed to load translations for ${lang}`);
                    }
                    
                    const data = await response.json();
                    console.log(`Loaded ${Object.keys(data).length} translations for ${lang}`);
                    
                    // Cache the translations globally and in sessionStorage
                    translationCache[lang] = data;
                    try {
                        sessionStorage.setItem(`translations_${lang}`, JSON.stringify(data));
                    } catch (storageError) {
                        console.warn('Failed to cache translations in sessionStorage:', storageError);
                    }
                    
                    if (isMounted) {
                        setTranslations(data);
                        setIsLoading(false);
                    }
                } catch (error) {
                    console.error(`Could not load translations for ${lang}`, error);
                    
                    // Fallback to English if the selected language fails to load
                    if (lang !== 'en') {
                        console.log('Attempting fallback to English translations...');
                        try {
                            // Check if English is already cached
                            if (Object.keys(translationCache.en).length > 0) {
                                translationCache[lang] = translationCache.en;
                                if (isMounted) {
                                    setTranslations(translationCache.en);
                                    setIsLoading(false);
                                }
                                return;
                            }

                            const fallbackResponse = await fetch(`/locales/en.json`, {
                                method: 'GET',
                                headers: {
                                    'Accept': 'application/json',
                                },
                            });
                            
                            if (fallbackResponse.ok) {
                                const fallbackData = await fallbackResponse.json();
                                console.log(`Loaded ${Object.keys(fallbackData).length} fallback English translations`);
                                translationCache.en = fallbackData;
                                translationCache[lang] = fallbackData;
                                try {
                                    sessionStorage.setItem(`translations_en`, JSON.stringify(fallbackData));
                                    sessionStorage.setItem(`translations_${lang}`, JSON.stringify(fallbackData));
                                } catch (storageError) {
                                    console.warn('Failed to cache fallback translations:', storageError);
                                }
                                if (isMounted) {
                                    setTranslations(fallbackData);
                                    setIsLoading(false);
                                }
                            } else {
                                throw new Error(`Fallback failed: HTTP ${fallbackResponse.status}`);
                            }
                        } catch (fallbackError) {
                            console.error('Could not load fallback English translations.', fallbackError);
                            if (isMounted) {
                                setTranslations({});
                                setIsLoading(false);
                            }
                        }
                    } else if (isMounted) {
                        setTranslations({});
                        setIsLoading(false);
                    }
                } finally {
                    isLoadingTranslations = false;
                    loadingPromise = null;
                }
            })();

            try {
                await loadingPromise;
            } catch (error) {
                if (isMounted) {
                    setError(error instanceof Error ? error.message : 'Unknown error');
                    setIsLoading(false);
                }
            }
        };
        
        loadTranslations(language);

        return () => {
            isMounted = false;
        };
    }, [language]);
    
    const t = useMemo(() => {
        return (key: string, params?: Record<string, string | number>): string => {
            // If still loading, show a subtle loading indicator
            if (isLoading) {
                // Return a subtle loading state that's less jarring than "..."
                // For titles and important text, show a skeleton-like placeholder
                if (key.includes('title') || key.includes('subtitle') || key.includes('main')) {
                    return 'Loading...';
                }
                // For other text, show a minimal loading indicator
                return '...';
            }
            
            // If there's an error or no translations loaded, show the key
            if (error || Object.keys(translations).length === 0) {
                return key;
            }
            
            // Get the translation
            let translation = translations[key];
            
            // If translation doesn't exist, show the key
            if (!translation) {
                return key;
            }
            
            // Replace parameters if provided
            if (params) {
                Object.keys(params).forEach(paramKey => {
                    translation = translation.replace(`{${paramKey}}`, String(params[paramKey]));
                });
            }
            
            return translation;
        };
    }, [translations, isLoading, error]);

    return { language, setLanguage, t, isLoading, error };
};
