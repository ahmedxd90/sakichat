// @ts-nocheck
import React from "react";

// ── Ocean Speaking Waves ──
// Shown for ALL users when speaking (visible to everyone in the room)
// VIP 9-12 get special ocean waves with animated wings

interface OceanSpeakingWavesProps {
  vipLevel?: number | null;
  size?: number;
  isSpeaking?: boolean;
}

// Wing component for VIP 9-12
function OceanWing({ side, vipLevel, size }: { side: "left" | "right"; vipLevel: number; size: number }) {
  const flip = side === "right" ? "scaleX(-1)" : "scaleX(1)";
  const wingW = size * 1.1;
  const wingH = size * 1.0;

  // Wing colors based on VIP level
  const wingColors = {
    9:  { c1: "#ff6347", c2: "#ff4500", c3: "#dc143c", glow: "rgba(255,69,0,0.9)" },
    10: { c1: "#ffa500", c2: "#ff8c00", c3: "#ff7f50", glow: "rgba(255,165,0,0.9)" },
    11: { c1: "#00ffff", c2: "#00ced1", c3: "#20b2aa", glow: "rgba(0,255,255,0.9)" },
    12: { c1: "#ffd700", c2: "#ff69b4", c3: "#00ffff", glow: "rgba(255,255,255,0.9)" },
  };
  const wc = wingColors[Math.min(vipLevel, 12) as keyof typeof wingColors] || wingColors[9];

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        [side === "left" ? "right" : "left"]: "96%",
        top: "50%",
        transform: `translateY(-50%) ${flip}`,
        width: wingW,
        height: wingH,
        animation: `ocean-wing-flap ${0.9 + (vipLevel - 9) * 0.1}s ease-in-out infinite`,
        transformOrigin: side === "left" ? "right center" : "left center",
        filter: `drop-shadow(0 0 ${size * 0.18}px ${wc.glow})`,
        zIndex: 1,
      }}
    >
      <svg width={wingW} height={wingH} viewBox="0 0 70 80" fill="none">
        <defs>
          <linearGradient id={`ocean-wing-${side}-${vipLevel}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={wc.c1} stopOpacity="0.95" />
            <stop offset="40%" stopColor={wc.c2} stopOpacity="0.85" />
            <stop offset="100%" stopColor={wc.c3} stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id={`ocean-wing-shine-${side}-${vipLevel}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          {vipLevel >= 12 && (
            <linearGradient id={`ocean-wing-rainbow-${side}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffd700" stopOpacity="0.95" />
              <stop offset="25%" stopColor="#ff69b4" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#00ffff" stopOpacity="0.85" />
              <stop offset="75%" stopColor="#ff1493" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffd700" stopOpacity="0.7" />
            </linearGradient>
          )}
        </defs>
        {/* Main wing body */}
        <path
          d="M65 40 C52 8, 22 3, 5 22 C18 25, 30 30, 36 40 C30 50, 18 55, 5 58 C22 77, 52 72, 65 40Z"
          fill={vipLevel >= 12 ? `url(#ocean-wing-rainbow-${side})` : `url(#ocean-wing-${side}-${vipLevel})`}
          opacity="0.92"
        />
        {/* Feather lines */}
        <path d="M65 40 C48 32, 24 26, 5 22" stroke={wc.c1} strokeWidth="1" opacity="0.6" fill="none" />
        <path d="M62 34 C46 28, 22 24, 5 26" stroke={wc.c2} strokeWidth="0.8" opacity="0.5" fill="none" />
        <path d="M60 46 C44 44, 22 44, 5 46" stroke={wc.c1} strokeWidth="0.8" opacity="0.5" fill="none" />
        <path d="M62 52 C46 52, 24 54, 5 56" stroke={wc.c2} strokeWidth="0.7" opacity="0.4" fill="none" />
        {/* Shine */}
        <path
          d="M65 40 C52 8, 22 3, 5 22 C18 25, 30 30, 36 40Z"
          fill={`url(#ocean-wing-shine-${side}-${vipLevel})`}
          opacity="0.35"
        />
        {/* Sparkles */}
        <circle cx="22" cy="18" r="2" fill="white" opacity="0.85" />
        <circle cx="40" cy="12" r="1.5" fill="white" opacity="0.7" />
        <circle cx="52" cy="24" r="1.8" fill={wc.c1} opacity="0.95" />
        <circle cx="30" cy="10" r="1" fill="white" opacity="0.6" />
        {/* Extra sparkle for VIP 12 */}
        {vipLevel >= 12 && (
          <>
            <circle cx="15" cy="30" r="1.5" fill="#ffd700" opacity="0.9" />
            <circle cx="45" cy="16" r="1.2" fill="#00ffff" opacity="0.8" />
          </>
        )}
      </svg>
    </div>
  );
}

// Ocean wave bars
function OceanWaveBars({ colors, glow, barCount, animation, size, side }: any) {
  const barHeights = Array.from({ length: barCount }, (_, i) => {
    const mid = (barCount - 1) / 2;
    const dist = Math.abs(i - mid);
    return size * (0.22 + (1 - dist / Math.max(mid, 1)) * 0.5);
  });

  return (
    <div
      className="absolute flex items-center gap-0.5"
      style={{
        [side === "left" ? "right" : "left"]: "100%",
        top: "50%",
        transform: "translateY(-50%)",
        paddingRight: side === "left" ? 3 : 0,
        paddingLeft: side === "right" ? 3 : 0,
        flexDirection: side === "left" ? "row-reverse" : "row",
      }}
    >
      {barHeights.map((h, i) => (
        <div
          key={i}
          className="rounded-full flex-shrink-0"
          style={{
            width: Math.max(2.5, size * 0.055),
            height: h,
            background: `linear-gradient(180deg, ${colors[0]}, ${colors[1] || colors[0]})`,
            boxShadow: `0 0 ${size * 0.12}px ${glow}`,
            animation: `${animation} ${0.35 + i * 0.1}s ease-in-out infinite alternate`,
            opacity: 0.9,
          }}
        />
      ))}
    </div>
  );
}

export default function OceanSpeakingWaves({ vipLevel, size = 48, isSpeaking = true }: OceanSpeakingWavesProps) {
  if (!isSpeaking) return null;

  const hasWings = vipLevel && vipLevel >= 9;

  // Ocean wave config based on VIP level
  const getOceanConfig = (level?: number | null) => {
    if (!level || level < 1) return {
      colors: ["#22c55e", "#16a34a"],
      glow: "rgba(34,197,94,0.7)",
      barCount: 3,
      animation: "ocean-wave-basic",
      ringColor: "#22c55e",
    };
    if (level >= 12) return {
      colors: ["#ffd700", "#ff69b4", "#00ffff"],
      glow: "rgba(255,255,255,0.9)",
      barCount: 7,
      animation: "ocean-wave-divine",
      ringColor: "#ffd700",
    };
    if (level >= 11) return {
      colors: ["#00ffff", "#20b2aa"],
      glow: "rgba(0,255,255,0.9)",
      barCount: 7,
      animation: "ocean-wave-eternal",
      ringColor: "#00ffff",
    };
    if (level >= 10) return {
      colors: ["#ffa500", "#ff7f50"],
      glow: "rgba(255,165,0,0.9)",
      barCount: 6,
      animation: "ocean-wave-legend",
      ringColor: "#ffa500",
    };
    if (level >= 9) return {
      colors: ["#ff6347", "#dc143c"],
      glow: "rgba(255,69,0,0.9)",
      barCount: 6,
      animation: "ocean-wave-emperor",
      ringColor: "#ff4500",
    };
    if (level >= 8) return {
      colors: ["#9370db", "#4b0082"],
      glow: "rgba(147,112,219,0.9)",
      barCount: 5,
      animation: "ocean-wave-royal",
      ringColor: "#9370db",
    };
    if (level >= 7) return {
      colors: ["#ff1493", "#c71585"],
      glow: "rgba(255,20,147,0.8)",
      barCount: 5,
      animation: "ocean-wave-ruby",
      ringColor: "#ff1493",
    };
    if (level >= 6) return {
      colors: ["#50c878", "#2e8b57"],
      glow: "rgba(80,200,120,0.8)",
      barCount: 5,
      animation: "ocean-wave-emerald",
      ringColor: "#50c878",
    };
    if (level >= 5) return {
      colors: ["#00d4ff", "#0099cc"],
      glow: "rgba(0,212,255,0.8)",
      barCount: 4,
      animation: "ocean-wave-diamond",
      ringColor: "#00d4ff",
    };
    if (level >= 4) return {
      colors: ["#e5e4e2", "#b8b8b8"],
      glow: "rgba(229,228,226,0.7)",
      barCount: 4,
      animation: "ocean-wave-platinum",
      ringColor: "#e5e4e2",
    };
    if (level >= 3) return {
      colors: ["#ffd700", "#ffa500"],
      glow: "rgba(255,215,0,0.7)",
      barCount: 3,
      animation: "ocean-wave-gold",
      ringColor: "#ffd700",
    };
    if (level >= 2) return {
      colors: ["#e8e8e8", "#c0c0c0"],
      glow: "rgba(232,232,232,0.6)",
      barCount: 3,
      animation: "ocean-wave-silver",
      ringColor: "#c0c0c0",
    };
    return {
      colors: ["#ff8c42", "#ff6b35"],
      glow: "rgba(255,140,66,0.5)",
      barCount: 3,
      animation: "ocean-wave-bronze",
      ringColor: "#ff8c42",
    };
  };

  const config = getOceanConfig(vipLevel);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none"
      style={{ overflow: "visible" }}
    >
      {/* Wings for VIP 9-12 */}
      {hasWings && (
        <>
          <OceanWing side="left" vipLevel={vipLevel!} size={size} />
          <OceanWing side="right" vipLevel={vipLevel!} size={size} />
        </>
      )}

      {/* Glowing ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: `2px solid ${config.ringColor}`,
          boxShadow: `0 0 ${size * 0.3}px ${config.glow}, 0 0 ${size * 0.6}px ${config.glow}40, inset 0 0 ${size * 0.2}px ${config.glow}20`,
          animation: "ocean-ring-pulse 1.4s ease-in-out infinite",
        }}
      />

      {/* Left wave bars */}
      <OceanWaveBars
        colors={config.colors}
        glow={config.glow}
        barCount={Math.ceil(config.barCount / 2)}
        animation={config.animation}
        size={size}
        side="left"
      />

      {/* Right wave bars */}
      <OceanWaveBars
        colors={config.colors}
        glow={config.glow}
        barCount={Math.ceil(config.barCount / 2)}
        animation={config.animation}
        size={size}
        side="right"
      />

      {/* Rainbow conic for VIP 12 */}
      {vipLevel && vipLevel >= 12 && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: "conic-gradient(from 0deg, #ffd70040, #ff69b440, #00ffff40, #ff149340, #ffd70040)",
            animation: "ocean-rainbow-spin 3s linear infinite",
          }}
        />
      )}

      <style>{`
        @keyframes ocean-wing-flap {
          0% { transform: translateY(-50%) scaleY(1) rotate(-4deg); }
          50% { transform: translateY(-50%) scaleY(0.8) rotate(7deg); }
          100% { transform: translateY(-50%) scaleY(1) rotate(-4deg); }
        }
        @keyframes ocean-ring-pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.06); }
        }
        @keyframes ocean-rainbow-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ocean-wave-basic {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
        @keyframes ocean-wave-bronze {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
        @keyframes ocean-wave-silver {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
        @keyframes ocean-wave-gold {
          0% { transform: scaleY(0.25); }
          100% { transform: scaleY(1); }
        }
        @keyframes ocean-wave-platinum {
          0% { transform: scaleY(0.2); }
          100% { transform: scaleY(1.05); }
        }
        @keyframes ocean-wave-diamond {
          0% { transform: scaleY(0.2); }
          100% { transform: scaleY(1.1); }
        }
        @keyframes ocean-wave-emerald {
          0% { transform: scaleY(0.15); }
          100% { transform: scaleY(1.15); }
        }
        @keyframes ocean-wave-ruby {
          0% { transform: scaleY(0.15); }
          100% { transform: scaleY(1.2); }
        }
        @keyframes ocean-wave-royal {
          0% { transform: scaleY(0.1); }
          100% { transform: scaleY(1.25); }
        }
        @keyframes ocean-wave-emperor {
          0% { transform: scaleY(0.1); opacity: 0.6; }
          100% { transform: scaleY(1.3); opacity: 1; }
        }
        @keyframes ocean-wave-legend {
          0% { transform: scaleY(0.1); opacity: 0.5; }
          100% { transform: scaleY(1.35); opacity: 1; }
        }
        @keyframes ocean-wave-eternal {
          0%, 100% { transform: scaleY(0.1); opacity: 0.5; }
          50% { transform: scaleY(1.4); opacity: 1; }
        }
        @keyframes ocean-wave-divine {
          0%, 100% { transform: scaleY(0.1); opacity: 0.4; }
          50% { transform: scaleY(1.5); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
