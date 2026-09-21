import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import fr from './translations/fr.json';
import ar from './translations/ar.json';
import en from './translations/en.json';

const dictionaries = { fr, ar, en };

const I18nContext = createContext({
  language: 'fr',
  setLanguage: () => {},
  t: (key) => key,
  dir: 'ltr',
  isRTL: false,
});

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('gmao_language') || 'fr';
    } catch {
      return 'fr';
    }
  });

  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const isRTL = language === 'ar';

  useEffect(() => {
    try {
      localStorage.setItem('gmao_language', language);
    } catch {
      /* ignore */
    }
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language, dir]);

  const setLanguage = useCallback((newLang) => {
    if (dictionaries[newLang]) {
      setLanguageState(newLang);
    }
  }, []);

  const t = useCallback((path, params = {}) => {
    const keys = path.split('.');
    let current = dictionaries[language];

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to French if key missing in target language
        let fallback = dictionaries.fr;
        for (const fKey of keys) {
          if (fallback && typeof fallback === 'object' && fKey in fallback) {
            fallback = fallback[fKey];
          } else {
            return path;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current === 'string') {
      let result = current;
      for (const [paramKey, paramVal] of Object.entries(params)) {
        result = result.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramVal));
      }
      return result;
    }

    return path;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    dir,
    isRTL,
    availableLanguages: [
      { code: 'fr', label: 'Français', flag: 'FR' },
      { code: 'ar', label: 'العربية', flag: 'AR' },
      { code: 'en', label: 'English', flag: 'EN' },
    ],
  }), [language, setLanguage, t, dir, isRTL]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
