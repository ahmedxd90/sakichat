import { useState, useEffect } from "react";
import { getStoredLang, setStoredLang, t, Lang, TranslationKey } from "../lib/i18n";

/**
 * Reactive hook that returns the current language and a translator function.
 * When the language changes, all components using this hook will re-render.
 */
export function useLang() {
  const [lang, setLang] = useState<Lang>(getStoredLang);

  useEffect(() => {
    // Listen for language changes from other components
    const handler = () => setLang(getStoredLang());
    window.addEventListener("lang-change", handler);
    return () => window.removeEventListener("lang-change", handler);
  }, []);

  const changeLang = (newLang: Lang) => {
    setStoredLang(newLang);
    setLang(newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLang;
    window.dispatchEvent(new Event("lang-change"));
  };

  const tr = (key: TranslationKey) => t(key, lang);

  return { lang, changeLang, tr, isRtl: lang === "ar" };
}
