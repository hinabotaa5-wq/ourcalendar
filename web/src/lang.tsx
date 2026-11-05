import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { langFromStorage, tr as translate, type Strings } from "../../shared/i18n.js";
import type { Lang } from "../../shared/types.js";
import { api } from "./api.js";

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof Strings, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<LangState>({ lang: "en", setLang: () => {}, t: (k) => translate("en", k) });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => langFromStorage((k) => localStorage.getItem(k)));

  useEffect(() => {
    if (localStorage.getItem("oc-lang")) return;
    api
      .language()
      .then((r) => setLangState(r.language))
      .catch(() => {});
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("oc-lang", l);
    } catch {
      /* private mode: keep language in memory only */
    }
    api.setLanguage(l).catch(() => {});
  }, []);

  const t = useCallback((key: keyof Strings, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useLang(): LangState {
  return useContext(Ctx);
}

export function langOptions(): { value: Lang; label: string }[] {
  return [
    { value: "en", label: "English" },
    { value: "ja", label: "日本語" },
    { value: "pl", label: "polski" },
  ];
}
