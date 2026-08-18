// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

interface SuperLuckyBagSideIconProps {
  bagId: Id<"luckyBags">;
  bagType?: "normal" | "super";
  expiresAt: number;
  totalCoins: number;
  senderName: string;
  onExpired: () => void;
  onClick: () => void;
}

function formatCoins(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export default function SuperLuckyBagSideIcon({
  bagId,
  bagType = "super",
  expiresAt,
  totalCoins,
  senderName,
  onExpired,
  onClick,
}: SuperLuckyBagSideIconProps) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
  );
  const [pulse, setPulse] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 10) setPulse(true);
      if (remaining === 0) {
        clearInterval(intervalRef.current!);
        onExpired();
      }
    }, 500);
    return () => clearInterval(intervalRef.current!);
  }, [expiresAt]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;
  const durationSeconds = bagType === "super" ? 120 : 30;
  const pct = Math.max(0, Math.min(100, (secondsLeft / durationSeconds) * 100));
  const isUrgent = bagType === "super" ? secondsLeft <= 30 : secondsLeft <= 10;

  return (
    <div
      className="fixed left-3 z-[180] flex flex-col items-center gap-1 cursor-pointer select-none"
      style={{ top: "50%", transform: "translateY(-50%)" }}
      onClick={onClick}
    >
      {/* Bag icon container */}
      <div
        className="relative flex flex-col items-center"
        style={{
          animation: pulse ? "superBagPulse 0.6s ease-in-out infinite" : "superBagFloat 2s ease-in-out infinite",
          filter: isUrgent
            ? "drop-shadow(0 0 12px rgba(239,68,68,0.9)) drop-shadow(0 0 24px rgba(239,68,68,0.5))"
            : "drop-shadow(0 0 10px rgba(251,191,36,0.8)) drop-shadow(0 0 20px rgba(251,191,36,0.4))",
        }}
      >
        {/* Red money bag SVG */}
        <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
          {/* Bag body */}
          <ellipse cx="32" cy="42" rx="22" ry="18" fill="#dc2626"/>
          <ellipse cx="32" cy="42" rx="22" ry="18" fill="url(#bagBodyGrad)"/>
          {/* Bag neck */}
          <rect x="24" y="24" width="16" height="10" rx="4" fill="#b91c1c"/>
          {/* Bag knot */}
          <ellipse cx="32" cy="24" rx="8" ry="5" fill="#991b1b"/>
          <ellipse cx="32" cy="24" rx="6" ry="3.5" fill="#dc2626"/>
          {/* Shine */}
          <ellipse cx="24" cy="36" rx="6" ry="4" fill="rgba(255,255,255,0.2)" transform="rotate(-20 24 36)"/>
          {/* Gold coin symbol */}
          <circle cx="32" cy="44" r="9" fill="#fbbf24"/>
          <circle cx="32" cy="44" r="7" fill="#f59e0b"/>
          <text x="32" y="48" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#92400e">🪙</text>
          {/* Sparkles */}
          <circle cx="48" cy="30" r="2" fill="#fbbf24" opacity="0.8"/>
          <circle cx="14" cy="35" r="1.5" fill="#fbbf24" opacity="0.6"/>
          <circle cx="50" cy="50" r="1.5" fill="#fbbf24" opacity="0.7"/>
          <defs>
            <linearGradient id="bagBodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,100,100,0.3)"/>
              <stop offset="100%" stopColor="rgba(0,0,0,0.3)"/>
            </linearGradient>
          </defs>
        </svg>

        {/* نوع الحقيبة */}
        <div
          className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[9px] font-black"
          style={{
            background: bagType === "super" ? "linear-gradient(135deg,#fbbf24,#f59e0b)" : "linear-gradient(135deg,#a855f7,#ec4899)",
            color: bagType === "super" ? "#000" : "#fff",
            boxShadow: bagType === "super" ? "0 2px 8px rgba(251,191,36,0.7)" : "0 2px 8px rgba(168,85,247,0.7)",
          }}
        >
          {bagType === "super" ? "SUPER" : "عادية"}
        </div>
      </div>

      {/* Coins amount */}
      <div
        className="text-[10px] font-black px-2 py-0.5 rounded-full"
        style={{
          background: "rgba(0,0,0,0.7)",
          color: "#fbbf24",
          border: "1px solid rgba(251,191,36,0.4)",
        }}
      >
        {formatCoins(totalCoins)} 🪙
      </div>

      {/* Circular countdown */}
      <div className="relative w-12 h-12">
        <svg width="48" height="48" viewBox="0 0 48 48" className="absolute inset-0">
          {/* Background circle */}
          <circle cx="24" cy="24" r="20" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>
          {/* Progress arc */}
          <circle
            cx="24" cy="24" r="20"
            fill="none"
            stroke={isUrgent ? "#ef4444" : "#fbbf24"}
            strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 20}`}
            strokeDashoffset={`${2 * Math.PI * 20 * (1 - pct / 100)}`}
            strokeLinecap="round"
            transform="rotate(-90 24 24)"
            style={{ transition: "stroke-dashoffset 0.5s linear, stroke 0.3s" }}
          />
        </svg>
        {/* Time text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-black text-[11px]"
            style={{ color: isUrgent ? "#ef4444" : "#fbbf24" }}
          >
            {timeStr}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes superBagFloat {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-6px) rotate(3deg); }
        }
        @keyframes superBagPulse {
          0%, 100% { transform: scale(1) rotate(-3deg); }
          50% { transform: scale(1.15) rotate(3deg); }
        }
      `}</style>
    </div>
  );
}
