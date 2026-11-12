import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { translations, Lang, TKey } from '@/lib/i18n';

const STORAGE_KEY = 'revise-language';

interface LanguageCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: TKey, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<LanguageCtx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'ar' ? 'ar' : 'en'; } catch { return 'en'; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const t = (key: TKey, vars?: Record<string, string | number>) => {
    let s: string = translations[lang][key] ?? translations.en[key];
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };

  return (
    <Ctx.Provider value={{ lang, setLang, toggle: () => setLang(lang === 'en' ? 'ar' : 'en'), t }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLanguage() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useLanguage must be used within LanguageProvider');
  return c;
}
