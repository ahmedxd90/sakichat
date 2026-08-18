import { useState } from "react";
import { useLang } from "../hooks/useLang";
import { Lang } from "../lib/i18n";

const LANGUAGES: { code: Lang; nameAr: string; nameEn: string; flag: string }[] = [
  { code: "ar", nameAr: "العربية", nameEn: "Arabic", flag: "🇸🇦" },
  { code: "en", nameAr: "الإنجليزية", nameEn: "English", flag: "🇺🇸" },
];

export function getCurrentLanguage(): string {
  return localStorage.getItem("app_language") || "ar";
}

interface LanguagePageProps {
  onBack: () => void;
}

export default function LanguagePage({ onBack }: LanguagePageProps) {
  const { lang, changeLang, tr } = useLang();
  const [selected, setSelected] = useState<Lang>(lang);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    changeLang(selected);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onBack();
    }, 900);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      dir={lang === "ar" ? "rtl" : "ltr"}
      style={{ background: "#f5f5f5", fontFamily: "'Tajawal','Cairo',sans-serif" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-4 flex-shrink-0"
        style={{ background: "white", borderBottom: "1px solid #f0f0f0" }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
          style={{ background: "#f5f5f5", border: "1px solid #e0e0e0" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5">
            {lang === "ar"
              ? <path d="M19 12H5M12 5l-7 7 7 7" />
              : <path d="M5 12h14M12 5l7 7-7 7" />
            }
          </svg>
        </button>
        <div className="flex-1">
          <h2 className="font-black text-lg" style={{ color: "#222" }}>
            {lang === "ar" ? "اللغة / Language" : "Language / اللغة"}
          </h2>
          <p className="text-xs" style={{ color: "#888" }}>
            {lang === "ar" ? "اختر لغة التطبيق" : "Choose your app language"}
          </p>
        </div>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(168,85,247,0.08)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <circle cx="12" cy="12" r="10" stroke="#a855f7" strokeWidth="2" />
            <line x1="2" y1="12" x2="22" y2="12" stroke="#a855f7" strokeWidth="2" />
            <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="#a855f7" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <p className="text-sm font-bold mb-5" style={{ color: "#666" }}>
          {lang === "ar"
            ? "اختر اللغة المفضلة / Choose your preferred language"
            : "Choose your preferred language / اختر اللغة المفضلة"}
        </p>

        <div className="space-y-3">
          {LANGUAGES.map((l) => {
            const isSelected = selected === l.code;
            return (
              <button
                key={l.code}
                onClick={() => setSelected(l.code)}
                className="w-full flex items-center gap-4 px-5 py-5 rounded-2xl active:scale-[0.98] transition-all"
                style={{
                  background: isSelected ? "linear-gradient(135deg,#f5f0ff,#fdf4ff)" : "white",
                  border: isSelected ? "2px solid #a855f7" : "1.5px solid #f0f0f0",
                  boxShadow: isSelected ? "0 4px 20px rgba(168,85,247,0.18)" : "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <span style={{ fontSize: 36, lineHeight: 1 }}>{l.flag}</span>
                <div className="flex-1" style={{ textAlign: lang === "ar" ? "right" : "left" }}>
                  <p className="font-black text-lg leading-tight" style={{ color: isSelected ? "#7c3aed" : "#222" }}>
                    {l.nameAr}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: isSelected ? "#a855f7" : "#aaa" }}>
                    {l.nameEn}
                  </p>
                </div>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    background: isSelected ? "#a855f7" : "transparent",
                    border: isSelected ? "none" : "2.5px solid #d0d0d0",
                    boxShadow: isSelected ? "0 0 12px rgba(168,85,247,0.4)" : "none",
                  }}
                >
                  {isSelected && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-6 p-4 rounded-2xl" style={{ background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.12)" }}>
          <div className="flex items-center gap-2 mb-2">
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
              <circle cx="12" cy="12" r="10" stroke="#a855f7" strokeWidth="2" />
              <line x1="12" y1="8" x2="12" y2="12" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="16" r="0.5" fill="#a855f7" stroke="#a855f7" strokeWidth="1" />
            </svg>
            <p className="text-xs font-bold" style={{ color: "#a855f7" }}>
              {lang === "ar" ? "ملاحظة / Note" : "Note / ملاحظة"}
            </p>
          </div>
          <p className="text-xs" style={{ color: "#888" }}>
            {lang === "ar"
              ? "سيتم تطبيق اللغة فور الضغط على حفظ"
              : "Language will be applied immediately after saving"}
          </p>
        </div>
      </div>

      {/* Save button */}
      <div
        className="px-4 pt-3 flex-shrink-0"
        style={{
          background: "white",
          borderTop: "1px solid #f0f0f0",
          paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
        }}
      >
        <button
          onClick={handleSave}
          className="w-full py-4 rounded-2xl font-black text-base text-white active:scale-[0.98] transition-all"
          style={{
            background: saved ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#a855f7,#7c3aed)",
            boxShadow: saved ? "0 4px 20px rgba(34,197,94,0.3)" : "0 4px 20px rgba(168,85,247,0.3)",
            transition: "all 0.3s ease",
          }}
        >
          {saved ? (
            <span className="flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {lang === "ar" ? "تم الحفظ!" : "Saved!"}
            </span>
          ) : (
            lang === "ar" ? "حفظ / Save" : "Save / حفظ"
          )}
        </button>
      </div>
    </div>
  );
}
