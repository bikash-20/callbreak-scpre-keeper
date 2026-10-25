import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { formatNumber, translate, type Language } from './lib/i18n';

const STORAGE_KEY = 'cb_language';

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (message: string, values?: Record<string, string | number>) => string;
  number: (value: number) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readLanguage(): Language {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'bn' ? 'bn' : 'en';
  } catch {
    return 'en';
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(readLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = translate('Callbreak Scorekeeper', language);
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Language remains active for this session if browser storage is unavailable.
    }
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage((current) => (current === 'en' ? 'bn' : 'en'));
  }, []);
  const t = useCallback(
    (message: string, values?: Record<string, string | number>) =>
      translate(message, language, values),
    [language],
  );
  const number = useCallback(
    (value: number) => formatNumber(value, language),
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t, number }),
    [language, toggleLanguage, t, number],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside a LanguageProvider');
  }
  return context;
}

export function LanguageToggle() {
  const { language, toggleLanguage, t } = useLanguage();
  const nextLanguage = language === 'en' ? 'bn' : 'en';
  return (
    <button
      type="button"
      className="language-toggle"
      onClick={toggleLanguage}
      aria-label={t(nextLanguage === 'bn' ? 'Language: Bengali' : 'Language: English')}
    >
      {nextLanguage === 'bn' ? t('Bengali') : t('English')}
    </button>
  );
}
