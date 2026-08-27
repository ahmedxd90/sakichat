// شاشة الإعلان الكاملة عند فتح التطبيق
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

interface SplashAdScreenProps {
  onDone: () => void;
}

export default function SplashAdScreen({ onDone }: SplashAdScreenProps) {
  const [ad, setAd] = useState<any>(undefined);
  const [countdown, setCountdown] = useState<number>(5);

  useEffect(() => {
    const fetchAd = async () => {
      const { data } = await supabase.from('splash_ads').select('*').eq('is_active', true).single();
      setAd(data || null);
    };
    fetchAd();
  }, []);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneCalledRef = useRef(false);

  const callDone = () => {
    if (doneCalledRef.current) return;
    doneCalledRef.current = true;
    setClosing(true);
    setTimeout(() => onDone(), 500);
  };

  // Timeout: إذا استغرق التحميل أكثر من 3 ثوانٍ، تجاوز الإعلان
  useEffect(() => {
    const timeout = setTimeout(() => {
      callDone();
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    // إذا لا يوجد إعلان أو تم تحميل البيانات ولا يوجد إعلان
    if (ad === null) {
      callDone();
      return;
    }
    if (ad === undefined) return; // لا تزال تحميل

    // يوجد إعلان - اعرضه
    setVisible(true);
    const duration = ad.duration_seconds ?? 5;
    setCountdown(duration);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          callDone();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [ad]);

  // إذا لا يزال يحمل - لا تعرض شيئاً (الـ timeout سيتولى الأمر)
  if (ad === undefined) {
    return null;
  }

  if (!ad || !visible) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col"
      style={{
        background: "#000",
        opacity: closing ? 0 : 1,
        transition: "opacity 0.5s ease",
      }}
    >
      {/* الصورة/GIF - شاشة كاملة */}
      <div className="relative flex-1 overflow-hidden">
        <img
          src={ad.image_url ?? ""}
          alt={ad.title ?? "إعلان"}
          className="w-full h-full object-cover"
          style={{ display: "block" }}
        />

        {/* تدرج سفلي */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: 120,
            background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
          }}
        />

        {/* زر التخطي + العداد */}
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-between px-4"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}
        >
          {/* شعار التطبيق */}
          <div className="flex items-center gap-2">
            <img
              src="https://j.top4top.io/p_37559m1p51.jpg"
              alt="ساكي"
              className="w-8 h-8 rounded-xl object-cover"
              style={{ border: "1.5px solid rgba(255,255,255,0.3)" }}
            />
            <span className="text-white font-black text-sm" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
              ساكي
            </span>
          </div>

          {/* زر التخطي مع عداد */}
          <button
            onClick={callDone}
            className="flex items-center gap-2 active:scale-95 transition-transform"
            style={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 999,
              padding: "6px 14px",
            }}
          >
            {/* عداد دائري */}
            <div className="relative w-6 h-6 flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" className="absolute inset-0 -rotate-90">
                <circle
                  cx="12" cy="12" r="10"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="2"
                />
                <circle
                  cx="12" cy="12" r="10"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray={`${2 * Math.PI * 10}`}
                  strokeDashoffset={`${2 * Math.PI * 10 * (1 - countdown / (ad.duration_seconds ?? 5))}`}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <span
                className="absolute inset-0 flex items-center justify-center text-white font-black"
                style={{ fontSize: 9 }}
              >
                {countdown}
              </span>
            </div>
            <span className="text-white font-bold text-xs">تخطي</span>
          </button>
        </div>

        {/* العنوان إذا وُجد */}
        {ad.title && (
          <div className="absolute bottom-6 left-4 right-4">
            <p
              className="text-white font-black text-lg text-center"
              style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}
            >
              {ad.title}
            </p>
          </div>
        )}
      </div>

      {/* شريط تقدم سفلي */}
      <div
        className="flex-shrink-0"
        style={{
          height: 3,
          background: "rgba(255,255,255,0.15)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div
          style={{
            height: "100%",
            background: "linear-gradient(90deg, #a855f7, #ec4899)",
            width: `${(1 - countdown / (ad.duration_seconds ?? 5)) * 100}%`,
            transition: "width 1s linear",
          }}
        />
      </div>
    </div>
  );
}
