import { useState, useEffect } from "react";

const APP_ICON = "https://c.top4top.io/p_3738imzif1.jpg";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallScreen() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Listen for install prompt (Android/Desktop)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
      }
    } catch {
      // ignore
    }
    setIsInstalling(false);
    setDeferredPrompt(null);
  };

  if (installed) {
    return (
      <div
        className="fixed inset-0 z-[99999] flex flex-col items-center justify-center"
        style={{ background: "linear-gradient(160deg, #07071a 0%, #130a2e 40%, #0f0f1a 100%)" }}
        dir="rtl"
      >
        <div className="flex flex-col items-center gap-6 px-8 text-center">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold text-white">تم التثبيت بنجاح!</h2>
          <p className="text-purple-300 text-sm">افتح التطبيق من شاشتك الرئيسية</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(160deg, #07071a 0%, #130a2e 50%, #0f0f1a 100%)" }}
      dir="rtl"
    >
      {/* Stars */}
      {[...Array(25)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: `${1 + (i % 3)}px`,
            height: `${1 + (i % 3)}px`,
            background: "rgba(255,255,255,0.6)",
            left: `${(i * 17 + 5) % 95}%`,
            top: `${(i * 13 + 8) % 90}%`,
            animation: `twinklePWA ${2 + (i % 3) * 0.7}s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}

      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(168,85,247,0.2) 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        {/* App Icon */}
        <div className="relative">
          <div
            className="absolute pointer-events-none"
            style={{
              inset: "-20px",
              background: "radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)",
              borderRadius: "50%",
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              inset: "-8px",
              borderRadius: "38px",
              border: "2px solid transparent",
              background:
                "linear-gradient(#0f0f1a, #0f0f1a) padding-box, linear-gradient(135deg, rgba(168,85,247,0.9), rgba(236,72,153,0.7), rgba(168,85,247,0.3)) border-box",
              animation: "rotatePWA 3s linear infinite",
            }}
          />
          <img
            src={APP_ICON}
            alt="ساكي"
            style={{
              width: "110px",
              height: "110px",
              borderRadius: "30px",
              border: "3px solid rgba(168,85,247,0.8)",
              objectFit: "cover",
              position: "relative",
            }}
          />
        </div>

        {/* App Name */}
        <div className="text-center flex flex-col items-center gap-2">
          <h1
            className="font-black text-white"
            style={{
              fontSize: "46px",
              letterSpacing: "0.15em",
              textShadow: "0 0 30px rgba(168,85,247,0.9), 0 0 60px rgba(168,85,247,0.4)",
              lineHeight: 1,
            }}
          >
            ساكي
          </h1>
          <div className="flex items-center gap-2" style={{ color: "rgba(196,148,255,0.8)" }}>
            <span className="text-xs font-semibold tracking-widest">تواصل</span>
            <div className="w-1 h-1 rounded-full bg-purple-400 opacity-60" />
            <span className="text-xs font-semibold tracking-widest">ترفيه</span>
            <div className="w-1 h-1 rounded-full bg-purple-400 opacity-60" />
            <span className="text-xs font-semibold tracking-widest">مجتمع</span>
          </div>
        </div>

        {/* Features */}
        <div className="flex gap-4 w-full max-w-xs">
          {[
            { icon: "⚡", label: "سريع" },
            { icon: "📴", label: "بدون إنترنت" },
            { icon: "🔔", label: "إشعارات" },
          ].map((f) => (
            <div
              key={f.label}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl"
              style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}
            >
              <span className="text-xl">{f.icon}</span>
              <span className="text-xs text-purple-300 font-medium">{f.label}</span>
            </div>
          ))}
        </div>

        {/* Install Button - Android/Desktop */}
        {!isIOS && (
          <div className="w-full max-w-xs flex flex-col gap-3">
            {deferredPrompt ? (
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="w-full py-4 rounded-2xl font-bold text-white text-lg relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #a855f7, #ec4899)",
                  boxShadow: "0 0 30px rgba(168,85,247,0.5), 0 4px 20px rgba(0,0,0,0.3)",
                }}
              >
                {isInstalling ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري التثبيت...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-xl">📲</span>
                    تثبيت التطبيق
                  </span>
                )}
              </button>
            ) : (
              <div
                className="w-full py-4 rounded-2xl text-center"
                style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)" }}
              >
                <p className="text-purple-300 text-sm font-medium">
                  افتح هذا الرابط في متصفح Chrome للتثبيت
                </p>
              </div>
            )}
            <p className="text-center text-xs" style={{ color: "rgba(168,85,247,0.5)" }}>
              مجاني • بدون متجر تطبيقات • يعمل على جميع الأجهزة
            </p>
          </div>
        )}

        {/* iOS Instructions */}
        {isIOS && (
          <div className="w-full max-w-xs flex flex-col gap-3">
            <button
              onClick={() => setShowIOSGuide(!showIOSGuide)}
              className="w-full py-4 rounded-2xl font-bold text-white text-lg"
              style={{
                background: "linear-gradient(135deg, #a855f7, #ec4899)",
                boxShadow: "0 0 30px rgba(168,85,247,0.5)",
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <span className="text-xl">📲</span>
                كيفية التثبيت على iPhone
              </span>
            </button>

            {showIOSGuide && (
              <div
                className="rounded-2xl p-4 flex flex-col gap-3"
                style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)" }}
              >
                <p className="text-white font-bold text-sm text-center mb-1">خطوات التثبيت على iOS</p>
                {[
                  { num: "١", text: 'اضغط على زر "مشاركة" في أسفل Safari', icon: "⬆️" },
                  { num: "٢", text: 'اختر "إضافة إلى الشاشة الرئيسية"', icon: "➕" },
                  { num: "٣", text: 'اضغط "إضافة" في الأعلى', icon: "✅" },
                ].map((step) => (
                  <div key={step.num} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                      style={{ background: "rgba(168,85,247,0.3)", color: "#c084fc" }}
                    >
                      {step.num}
                    </div>
                    <span className="text-xs text-purple-200 flex-1">{step.text}</span>
                    <span className="text-lg">{step.icon}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom wave decoration */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: "180px",
          background: "linear-gradient(to top, rgba(168,85,247,0.06), transparent)",
        }}
      />

      <style>{`
        @keyframes twinklePWA {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.5); }
        }
        @keyframes rotatePWA {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
