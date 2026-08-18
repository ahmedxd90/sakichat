interface EntryEffectOverlayProps {
  /** Active store-bag entry media shown to everyone in the room. */
  mediaUrl?: string;
  mediaType?: "gif" | "mp4" | "svga";
  userName: string;
  userAvatarUrl?: string;
  proLevel?: number;
  aristocracyLevel?: number;
  frameUrl?: string;
  frameMediaType?: string;
  onDone: () => void;
}

import { useEffect, useMemo, useState } from "react";
import SVGAPlayer from "./SVGAPlayer";

/**
 * شريط دخول الغرفة: مستطيل نحيل بلمعان ملكي يتغير حسب مستوى PRO.
 * إطار الملف الشخصي يوضع فوق الصورة في طبقة مستقلة حتى يظهر أمامها.
 */
export default function EntryEffectOverlay({
  mediaUrl,
  mediaType,
  userName,
  userAvatarUrl,
  proLevel = 0,
  aristocracyLevel = 0,
  frameUrl,
  onDone,
}: EntryEffectOverlayProps) {
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("enter");
  const duration = mediaUrl ? 8000 : 4500;
  const exitAt = mediaUrl ? 7300 : 3800;
  const transparentMedia = mediaType === "svga" || mediaType === "gif";

  useEffect(() => {
    const showTimer = window.setTimeout(() => setPhase("show"), 70);
    const exitTimer = window.setTimeout(() => setPhase("exit"), exitAt);
    const doneTimer = window.setTimeout(onDone, duration);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  const proStyle = useMemo(() => {
    const level = Math.max(0, Math.min(6, Math.floor(Number(aristocracyLevel) > 0 ? Number(aristocracyLevel) : Number(proLevel) || 0)));
    const styles = [
      { gradient: "linear-gradient(105deg,#172033,#475569,#cbd5e1,#1e293b,#0f172a)", accent: "#cbd5e1", glow: "rgba(203,213,225,.34)", border: "#94a3b8" },
      { gradient: "linear-gradient(105deg,#052e16,#15803d,#86efac,#166534,#052e16)", accent: "#86efac", glow: "rgba(134,239,172,.62)", border: "#4ade80" },
      { gradient: "linear-gradient(105deg,#082f49,#0369a1,#38bdf8,#1d4ed8,#082f49)", accent: "#7dd3fc", glow: "rgba(56,189,248,.68)", border: "#38bdf8" },
      { gradient: "linear-gradient(105deg,#3b0764,#7e22ce,#e879f9,#c026d3,#3b0764)", accent: "#f5d0fe", glow: "rgba(232,121,249,.75)", border: "#e879f9" },
      { gradient: "linear-gradient(105deg,#451a03,#b45309,#facc15,#60a5fa,#451a03)", accent: "#fde68a", glow: "rgba(250,204,21,.82)", border: "#fbbf24" },
      { gradient: "linear-gradient(105deg,#450a0a,#b91c1c,#facc15,#fef08a,#7f1d1d)", accent: "#fef08a", glow: "rgba(250,204,21,.9)", border: "#f59e0b" },
      { gradient: "linear-gradient(105deg,#211000,#b45309,#facc15,#fff7ae,#ef4444,#211000)", accent: "#fff7ae", glow: "rgba(255,215,64,1)", border: "#facc15" },
    ];
    return styles[level];
  }, [aristocracyLevel, proLevel]);

  const transform = phase === "enter"
    ? "translate3d(110vw,0,0)"
    : phase === "show"
      ? "translate3d(0,0,0)"
      : "translate3d(-110vw,0,0)";

  return (
    <>
      {mediaUrl && (
        <div className={`pointer-events-none fixed inset-0 z-[255] flex items-center justify-center p-0 ${transparentMedia ? "bg-transparent" : "bg-black/80"}`} dir="rtl" aria-live="polite">
          <div className={`relative flex h-full max-h-[100svh] w-full items-center justify-center overflow-hidden ${transparentMedia ? "bg-transparent" : "bg-black/95"}`}>
            {mediaType === "mp4" ? (
              <video
                src={mediaUrl}
                autoPlay
                playsInline
                muted
                onEnded={() => setPhase("exit")}
                onError={() => setPhase("exit")}
                className="h-full max-h-[100svh] w-full object-contain"
              />
            ) : mediaType === "svga" ? (
              <SVGAPlayer
                src={mediaUrl}
                width={Math.max(320, window.innerWidth)}
                height={Math.max(568, window.innerHeight)}
                loop={false}
                onFinish={() => setPhase("exit")}
                className="h-full max-h-[100svh] w-full object-contain"
                style={{ width: "100vw", height: "100svh" }}
              />
            ) : (
              <img src={mediaUrl} alt="" className="h-full max-h-[100svh] w-full object-contain" onError={() => setPhase("exit")} />
            )}
            <div className="absolute inset-x-4 bottom-5 mx-auto flex max-w-xl items-center gap-3 rounded-2xl bg-black/60 px-3 py-2 text-white backdrop-blur-sm">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white/80 bg-slate-800">
                {userAvatarUrl ? <img src={userAvatarUrl} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center font-black">{userName?.[0] ?? "؟"}</span>}
              </div>
              <div className="min-w-0 text-right">
                <div className="truncate text-sm font-black">{userName}</div>
                <div className="text-[11px] font-bold text-amber-200">انضم إلى الغرفة</div>
              </div>
            </div>
          </div>
        </div>
      )}
      {!mediaUrl && (
      <div
      className="pointer-events-none fixed inset-x-0 top-[16%] z-[260] flex justify-end overflow-hidden px-3 sm:px-5"
      style={{
        opacity: phase === "exit" ? 0 : 1,
        transform,
        transition: phase === "enter"
          ? "opacity .14s ease-out, transform .65s cubic-bezier(.22,1,.36,1)"
          : "opacity .45s ease, transform .62s cubic-bezier(.22,1,.36,1)",
      }}
      aria-live="polite"
    >
      <div
        className="relative flex h-[62px] w-[min(350px,calc(100vw-24px))] items-center gap-2.5 overflow-hidden rounded-xl px-2.5"
        dir="rtl"
        style={{
          background: proStyle.gradient,
          backgroundSize: "240% 100%",
          border: `1px solid ${proStyle.border ?? proStyle.accent}`,
          boxShadow: `0 10px 28px rgba(0,0,0,.34), 0 0 18px ${proStyle.glow}, inset 0 0 18px rgba(255,255,255,.1)`,
          animation: "room-entry-royal-flow 3.8s linear infinite",
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_18%,rgba(255,255,255,.3)_42%,transparent_64%)]" style={{ animation: "room-entry-sheen 1.7s ease-in-out infinite" }} aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-4 top-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${proStyle.accent},#fff,${proStyle.accent},transparent)` }} aria-hidden="true" />

        <div className="relative z-10 h-12 w-12 shrink-0 rounded-full p-[2px]" style={{ background: `linear-gradient(135deg,#fff,${proStyle.accent},#fff,${proStyle.accent})`, boxShadow: `0 0 12px ${proStyle.glow}` }}>
          <div className="relative h-full w-full overflow-visible rounded-full bg-[#191633]">
            <div className="h-full w-full overflow-hidden rounded-full">
              {userAvatarUrl ? (
                <img src={userAvatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-base font-black text-white">{userName?.[0] ?? "؟"}</span>
              )}
            </div>
            {frameUrl && (
              <img src={frameUrl} alt="" className="pointer-events-none absolute -inset-[7px] z-20 h-[calc(100%+14px)] w-[calc(100%+14px)] object-contain" style={{ filter: `drop-shadow(0 0 5px ${proStyle.accent})`, animation: "room-entry-frame-pulse 2.2s ease-in-out infinite" }} />
            )}
          </div>
        </div>

        <div className="relative z-10 min-w-0 flex-1 text-right">
          <div className="truncate text-[13px] font-black leading-5 text-white" style={{ textShadow: `0 0 8px ${proStyle.glow}` }}>{userName}</div>
          <div className="flex items-center justify-end gap-1.5 truncate text-[11px] font-bold leading-4" style={{ color: proStyle.accent }}>
            <span className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_7px_currentColor]" />
            <span>انضم إلى الغرفة</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes room-entry-royal-flow { 0% { background-position: 0% 50%; filter: saturate(1); } 50% { background-position: 100% 50%; filter: saturate(1.35); } 100% { background-position: 0% 50%; filter: saturate(1); } }
        @keyframes room-entry-sheen { 0% { transform: translateX(-120%); opacity: 0; } 35% { opacity: 1; } 70%,100% { transform: translateX(220%); opacity: 0; } }
        @keyframes room-entry-frame-pulse { 0%,100% { transform: scale(1); opacity: .92; } 50% { transform: scale(1.045); opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .pointer-events-none { transition: opacity .2s linear !important; } }
      `}      </style>
      </div>
      )}
    </>
  );
}
