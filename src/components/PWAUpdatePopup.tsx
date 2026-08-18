import { useState, useEffect, useRef } from "react";

interface PWAUpdatePopupProps {
  registration: ServiceWorkerRegistration;
  onDismiss: () => void;
}

export default function PWAUpdatePopup({ registration, onDismiss }: PWAUpdatePopupProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"idle" | "updating" | "done">("idle");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animate progress bar when updating
  useEffect(() => {
    if (phase !== "updating") return;
    setProgress(0);
    let p = 0;
    intervalRef.current = setInterval(() => {
      p += Math.random() * 18 + 5;
      if (p >= 95) {
        p = 95;
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      setProgress(Math.min(p, 95));
    }, 120);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase]);

  const handleUpdate = () => {
    setPhase("updating");

    const sw = registration.waiting;
    if (!sw) {
      // No waiting SW — just reload
      setTimeout(() => {
        setProgress(100);
        setTimeout(() => window.location.reload(), 400);
      }, 800);
      return;
    }

    // Listen for the new SW to take control
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      setProgress(100);
      setTimeout(() => window.location.reload(), 400);
    });

    // Tell the waiting SW to skip waiting
    sw.postMessage({ type: "SKIP_WAITING" });

    // Fallback: reload after 4s if controllerchange doesn't fire
    setTimeout(() => {
      setProgress(100);
      setTimeout(() => window.location.reload(), 400);
    }, 4000);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center pb-8 px-4"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          pointerEvents: "auto",
          background: "linear-gradient(135deg,#1a0a2e 0%,#0d0520 60%,#150030 100%)",
          border: "1.5px solid rgba(139,92,246,0.5)",
          boxShadow: "0 0 40px rgba(139,92,246,0.3), 0 20px 60px rgba(0,0,0,0.6)",
          animation: "slideUpPWA 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        }}
        dir="rtl"
      >
        {/* Top glow line */}
        <div style={{
          height: 3,
          background: "linear-gradient(90deg,transparent,#8b5cf6,#a78bfa,#8b5cf6,transparent)",
        }} />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-14 h-14 rounded-2xl flex-shrink-0 relative overflow-hidden"
              style={{ boxShadow: "0 0 20px rgba(124,58,237,0.5)" }}
            >
              <img
                src="https://j.top4top.io/p_37559m1p51.jpg"
                alt="ساكي"
                className="w-full h-full object-cover"
                style={{ borderRadius: 16 }}
              />
              {phase === "updating" && (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.55)", borderRadius: 16 }}>
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white border-t-transparent"
                    style={{ animation: "spin 0.8s linear infinite" }}
                  />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-base leading-tight">
                {phase === "updating" ? "جارٍ التحديث..." : "🎉 تحديث جديد متاح!"}
              </p>
              <p className="text-purple-300 text-xs mt-0.5">
                {phase === "updating" ? "يرجى الانتظار لحظة..." : "تحسينات وميزات جديدة في انتظارك"}
              </p>
            </div>
            {phase === "idle" && (
              <button
                onClick={onDismiss}
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div
            className="rounded-full overflow-hidden mb-4"
            style={{ height: 6, background: "rgba(255,255,255,0.08)" }}
          >
            <div
              style={{
                height: "100%",
                width: `${phase === "idle" ? 0 : progress}%`,
                background: "linear-gradient(90deg,#7c3aed,#a78bfa,#7c3aed)",
                backgroundSize: "200% 100%",
                borderRadius: 999,
                transition: "width 0.15s ease",
                animation: phase === "updating" ? "shimmer 1.5s linear infinite" : "none",
              }}
            />
          </div>

          {/* Features list */}
          {phase === "idle" && (
            <div
              className="rounded-2xl p-3 mb-4 flex flex-col gap-1.5"
              style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}
            >
              {["✨ تحسينات في الأداء", "🐛 إصلاح مشاكل", "🚀 ميزات جديدة"].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                  <span className="text-purple-200 text-xs">{f}</span>
                </div>
              ))}
            </div>
          )}

          {/* Buttons */}
          {phase === "idle" && (
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="flex-1 py-3 rounded-2xl font-black text-sm text-white active:scale-95 transition-transform"
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#5b21b6)",
                  boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
                }}
              >
                🔄 تحديث الآن
              </button>
              <button
                onClick={onDismiss}
                className="px-4 py-3 rounded-2xl font-bold text-xs active:scale-95 transition-transform"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#9ca3af",
                }}
              >
                لاحقاً
              </button>
            </div>
          )}

          {phase === "updating" && (
            <div className="text-center py-1">
              <span className="text-purple-300 text-xs font-bold">{Math.round(progress)}%</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUpPWA {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
