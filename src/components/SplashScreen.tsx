import { useState, useEffect } from "react";

interface SplashScreenProps {
  onDone: () => void;
}

const APP_ICON = "https://c.top4top.io/p_3738imzif1.jpg";

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Phase transitions
    const t1 = setTimeout(() => setPhase("hold"), 200);
    const t2 = setTimeout(() => setPhase("out"), 2400);
    const t3 = setTimeout(() => onDone(), 2850);

    // Progress bar animation
    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 8 + 3;
      if (prog >= 100) {
        prog = 100;
        clearInterval(interval);
      }
      setProgress(prog);
    }, 80);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none"
      style={{
        background: "linear-gradient(160deg, #07071a 0%, #130a2e 40%, #0f0f1a 100%)",
        opacity: phase === "out" ? 0 : 1,
        transition: phase === "out" ? "opacity 0.45s ease-in-out" : "none",
        pointerEvents: phase === "out" ? "none" : "all",
      }}
    >
      {/* Background stars */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: `${1 + (i % 3)}px`,
            height: `${1 + (i % 3)}px`,
            background: "rgba(255,255,255,0.6)",
            left: `${(i * 17 + 5) % 95}%`,
            top: `${(i * 13 + 8) % 90}%`,
            animation: `twinkle ${2 + (i % 3) * 0.7}s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}

      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 50% at 50% 45%, rgba(168,85,247,0.18) 0%, transparent 70%)",
        }}
      />

      {/* Bottom glow */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: "200px",
          background: "linear-gradient(to top, rgba(168,85,247,0.08), transparent)",
        }}
      />

      {/* Main content */}
      <div
        className="relative flex flex-col items-center gap-7"
        style={{
          transform:
            phase === "in"
              ? "scale(0.75) translateY(30px)"
              : "scale(1) translateY(0)",
          opacity: phase === "in" ? 0 : 1,
          transition:
            "transform 0.55s cubic-bezier(0.34,1.56,0.64,1), opacity 0.45s ease-out",
        }}
      >
        {/* App Icon */}
        <div className="relative">
          {/* Outer glow */}
          <div
            className="absolute pointer-events-none"
            style={{
              inset: "-16px",
              background: "radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)",
              borderRadius: "50%",
            }}
          />
          {/* Rotating ring */}
          <div
            className="absolute pointer-events-none"
            style={{
              inset: "-6px",
              borderRadius: "34px",
              border: "1.5px solid transparent",
              background: "linear-gradient(#0f0f1a, #0f0f1a) padding-box, linear-gradient(135deg, rgba(168,85,247,0.8), rgba(236,72,153,0.6), rgba(168,85,247,0.2)) border-box",
              animation: "rotateBorder 3s linear infinite",
            }}
          />
          {/* Pulse ring */}
          <div
            className="absolute pointer-events-none"
            style={{
              inset: "-10px",
              borderRadius: "38px",
              border: "1px solid rgba(168,85,247,0.3)",
              animation: "pulseRing 2s ease-in-out infinite",
            }}
          />
          {/* Icon image */}
          <img
            src={APP_ICON}
            alt="ساكي"
            className="relative shadow-2xl"
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "28px",
              border: "2.5px solid rgba(168,85,247,0.7)",
              objectFit: "cover",
            }}
          />
          {/* Shine effect */}
          <div
            className="absolute pointer-events-none overflow-hidden"
            style={{
              inset: 0,
              borderRadius: "28px",
              background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)",
            }}
          />
        </div>

        {/* App name */}
        <div className="text-center flex flex-col items-center gap-2">
          <h1
            className="font-black text-white"
            style={{
              fontSize: "42px",
              letterSpacing: "0.15em",
              textShadow: "0 0 30px rgba(168,85,247,0.8), 0 0 60px rgba(168,85,247,0.4)",
              lineHeight: 1,
            }}
          >
            ساكي
          </h1>
          <div
            className="flex items-center gap-2"
            style={{ color: "rgba(196,148,255,0.75)" }}
          >
            <span className="text-xs font-semibold tracking-widest">تواصل</span>
            <div className="w-1 h-1 rounded-full bg-purple-400 opacity-60" />
            <span className="text-xs font-semibold tracking-widest">ترفيه</span>
            <div className="w-1 h-1 rounded-full bg-purple-400 opacity-60" />
            <span className="text-xs font-semibold tracking-widest">مجتمع</span>
          </div>
        </div>

        {/* Wave loader */}
        <div className="flex items-end gap-1.5" style={{ height: "28px" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-1.5 rounded-full"
              style={{
                height: "100%",
                background: "linear-gradient(to top, #a855f7, #ec4899)",
                animation: `splashWave 1.1s ease-in-out ${i * 0.13}s infinite`,
                transformOrigin: "bottom",
                boxShadow: "0 0 6px rgba(168,85,247,0.5)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Progress bar at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          opacity: phase === "in" ? 0 : 1,
          transition: "opacity 0.3s ease",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div
          className="mx-auto mb-10"
          style={{
            width: "160px",
            height: "3px",
            background: "rgba(255,255,255,0.08)",
            borderRadius: "99px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #a855f7, #ec4899)",
              borderRadius: "99px",
              transition: "width 0.1s ease",
              boxShadow: "0 0 8px rgba(168,85,247,0.6)",
            }}
          />
        </div>
        <p
          className="text-center text-xs mb-6"
          style={{ color: "rgba(168,85,247,0.5)", letterSpacing: "0.05em" }}
        >
          جاري التحميل...
        </p>
      </div>

      <style>{`
        @keyframes splashWave {
          0%, 100% { transform: scaleY(0.15); opacity: 0.4; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        @keyframes pulseRing {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes rotateBorder {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
}
