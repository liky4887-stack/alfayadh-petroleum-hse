import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { strings, type Language, type StringKey } from '@/i18n/strings';

const LANG_KEY = 'hse_language';

interface I18nCtx {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: StringKey) => string;
  isRTL: boolean;
}

const Ctx = createContext<I18nCtx>({
  lang: 'en',
  setLang: () => {},
  t: (k) => strings.en[k] ?? k,
  isRTL: false,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((v) => {
      if (v === 'en' || v === 'ar') {
        setLangState(v);
        I18nManager.forceRTL(v === 'ar');
      }
    });
  }, []);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    AsyncStorage.setItem(LANG_KEY, l);
    I18nManager.forceRTL(l === 'ar');
  }, []);

  const t = useCallback((key: StringKey): string => {
    return strings[lang][key] ?? strings.en[key] ?? key;
  }, [lang]);

  return (
    <Ctx.Provider value={{ lang, setLang, t, isRTL: lang === 'ar' }}>
      {children}
    </Ctx.Provider>
  );
}

export function useT() {
  const ctx = useContext(Ctx);
  return ctx.t;
}

export function useLanguage() {
  const ctx = useContext(Ctx);
  return { lang: ctx.lang, setLang: ctx.setLang, isRTL: ctx.isRTL };
}
