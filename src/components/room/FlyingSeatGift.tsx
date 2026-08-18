// @ts-nocheck
import { useEffect, useRef, useState } from "react";

interface FlyingSeatGiftProps {
  giftImageUrl: string;
  giftName: string;
  soundUrl?: string;
  toPos: { x: number; y: number } | null;
  onDone: () => void;
}

export default function FlyingSeatGift({
  giftImageUrl, giftName, soundUrl, toPos, onDone,
}: FlyingSeatGiftProps) {
  const [phase, setPhase] = useState<"idle" | "flying" | "landed" | "fading" | "done">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Start from center of screen
  const centerX = typeof window !== "undefined" ? window.innerWidth / 2 : 200;
  const centerY = typeof window !== "undefined" ? window.innerHeight / 2 : 300;

  useEffect(() => {
    if (!toPos) { onDone(); return; }

    // Small delay so the element mounts at center first
    const t0 = setTimeout(() => setPhase("flying"), 50);

    if (soundUrl) {
      try {
        const audio = new Audio(soundUrl);
        audio.volume = 0.85;
        audio.play().catch(() => {});
        audioRef.current = audio;
      } catch (e) {}
    }

    // After 900ms flight → land
    const t1 = setTimeout(() => setPhase("landed"), 950);
    // After 3s at seat → start fading
    const t2 = setTimeout(() => setPhase("fading"), 3200);
    // After 4s total → done
    const t3 = setTimeout(() => { setPhase("done"); onDone(); }, 4000);

    return () => {
      clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      audioRef.current?.pause();
    };
  }, []);

  if (!toPos || phase === "done") return null;

  const isFlying = phase === "flying";
  const isLanded = phase === "landed";
  const isFading = phase === "fading";
  const isIdle = phase === "idle";

  // Position: idle/fading = center, flying = animate to seat, landed = seat
  const x = (isIdle || isFading) ? centerX : isFlying ? toPos.x : toPos.x;
  const y = (isIdle || isFading) ? centerY : isFlying ? toPos.y : toPos.y;

  const size = isLanded ? 60 : 48;

  return (
    <div
      className="fixed pointer-events-none z-[90]"
      style={{
        left: isIdle ? centerX : x,
        top: isIdle ? centerY : y,
        transform: "translate(-50%, -50%)",
        transition: isFlying
          ? "left 0.9s cubic-bezier(0.25,0.46,0.45,0.94), top 0.9s cubic-bezier(0.25,0.46,0.45,0.94)"
          : "none",
        opacity: isFading ? 0 : 1,
        transition2: isFading ? "opacity 0.8s ease-out" : undefined,
        width: size,
        height: size,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          animation: isLanded
            ? "giftBounce 0.35s ease-out forwards, giftWiggle 0.7s ease-in-out 0.35s 3"
            : isFlying
            ? "giftSpin 0.9s ease-in-out"
            : "none",
          filter: isLanded
            ? "drop-shadow(0 0 16px rgba(251,191,36,1)) drop-shadow(0 0 32px rgba(251,191,36,0.7))"
            : "drop-shadow(0 0 8px rgba(251,191,36,0.6))",
          opacity: isFading ? 0 : 1,
          transition: isFading ? "opacity 0.8s ease-out" : "none",
        }}
      >
        <img
          src={giftImageUrl}
          alt={giftName}
          className="w-full h-full object-contain rounded-xl"
        />

        {/* Sparkles when landed */}
        {isLanded && [...Array(8)].map((_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: 4 + (i % 3) * 2,
              height: 4 + (i % 3) * 2,
              background: ["#fbbf24","#f97316","#ec4899","#a855f7","#34d399","#60a5fa","#fde68a","#f472b6"][i],
              top: "50%", left: "50%",
              animation: `fsg-sparkle${i} 0.7s ease-out forwards`,
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
      </div>

      {/* Name label when landed */}
      {isLanded && (
        <div
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-black"
          style={{
            background: "rgba(0,0,0,0.9)",
            color: "#fbbf24",
            border: "1px solid rgba(251,191,36,0.6)",
            boxShadow: "0 0 8px rgba(251,191,36,0.4)",
          }}
        >
          {giftName}
        </div>
      )}

      <style>{`
        @keyframes giftSpin {
          0% { transform: scale(0.4) rotate(-30deg); opacity: 0.6; }
          50% { transform: scale(1.15) rotate(15deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes giftBounce {
          0% { transform: scale(0.4); }
          55% { transform: scale(1.5); }
          80% { transform: scale(0.88); }
          100% { transform: scale(1); }
        }
        @keyframes giftWiggle {
          0%, 100% { transform: rotate(-12deg) scale(1); }
          25% { transform: rotate(12deg) scale(1.1); }
          50% { transform: rotate(-7deg) scale(1); }
          75% { transform: rotate(7deg) scale(1.1); }
        }
        @keyframes fsg-sparkle0 { 0%{transform:translate(0,0);opacity:1} 100%{transform:translate(-24px,-24px) scale(0);opacity:0} }
        @keyframes fsg-sparkle1 { 0%{transform:translate(0,0);opacity:1} 100%{transform:translate(24px,-24px) scale(0);opacity:0} }
        @keyframes fsg-sparkle2 { 0%{transform:translate(0,0);opacity:1} 100%{transform:translate(-30px,12px) scale(0);opacity:0} }
        @keyframes fsg-sparkle3 { 0%{transform:translate(0,0);opacity:1} 100%{transform:translate(30px,12px) scale(0);opacity:0} }
        @keyframes fsg-sparkle4 { 0%{transform:translate(0,0);opacity:1} 100%{transform:translate(0,-32px) scale(0);opacity:0} }
        @keyframes fsg-sparkle5 { 0%{transform:translate(0,0);opacity:1} 100%{transform:translate(0,32px) scale(0);opacity:0} }
        @keyframes fsg-sparkle6 { 0%{transform:translate(0,0);opacity:1} 100%{transform:translate(-18px,26px) scale(0);opacity:0} }
        @keyframes fsg-sparkle7 { 0%{transform:translate(0,0);opacity:1} 100%{transform:translate(18px,26px) scale(0);opacity:0} }
      `}</style>
    </div>
  );
}
