import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, Translations, translations } from './translations';
import { saveUserPreferences } from '../services/storage/storageService';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: 'rtl' | 'ltr';
  t: (key: keyof Translations) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const explicit = localStorage.getItem('georoute_lang_explicit') as Language | null;
      if (explicit === 'ar' || explicit === 'en') {
        return explicit;
      }
    }
    return 'en';
  });

  const dir: 'rtl' | 'ltr' = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language, dir]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('georoute_lang_explicit', lang);
    }
    saveUserPreferences({ language: lang });
  };

  const t = (key: keyof Translations): string => {
    const langDict = translations[language] || translations.en;
    return langDict[key] || translations.en[key] || String(key);
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, dir, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
