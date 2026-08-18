// @ts-nocheck
import React from "react";

// ── VIP Speaking Waves Component ──
// Shows animated sound waves based on VIP level
// VIP 9-12: Special wings animation

interface VipSpeakingWavesProps {
  vipLevel?: number | null;
  size?: number;
  isSpeaking?: boolean;
  isMusic?: boolean; // music playing mode
}

// Get wave config based on VIP level
function getWaveConfig(level: number | null | undefined) {
  if (!level || level < 1) return null;
  if (level >= 12) return {
    colors: ["#ffd700", "#ff69b4", "#00ffff", "#ff1493", "#ffd700"],
    glow: "rgba(255,255,255,0.9)",
    hasWings: true,
    wingColor: ["#ffd700", "#ff69b4", "#00ffff"],
    barCount: 7,
    label: "إلهي",
    animation: "vip-wave-divine",
  };
  if (level >= 11) return {
    colors: ["#00ffff", "#00ced1", "#20b2aa"],
    glow: "rgba(0,255,255,0.9)",
    hasWings: true,
    wingColor: ["#00ffff", "#20b2aa"],
    barCount: 7,
    label: "خالد",
    animation: "vip-wave-eternal",
  };
  if (level >= 10) return {
    colors: ["#ffa500", "#ff8c00", "#ff7f50"],
    glow: "rgba(255,165,0,0.9)",
    hasWings: true,
    wingColor: ["#ffa500", "#ff7f50"],
    barCount: 6,
    label: "أسطوري",
    animation: "vip-wave-legend",
  };
  if (level >= 9) return {
    colors: ["#ff6347", "#ff4500", "#dc143c"],
    glow: "rgba(255,69,0,0.9)",
    hasWings: true,
    wingColor: ["#ff4500", "#dc143c"],
    barCount: 6,
    label: "إمبراطوري",
    animation: "vip-wave-emperor",
  };
  if (level >= 8) return {
    colors: ["#9370db", "#8a2be2", "#4b0082"],
    glow: "rgba(147,112,219,0.9)",
    hasWings: false,
    barCount: 5,
    label: "ملكي",
    animation: "vip-wave-royal",
  };
  if (level >= 7) return {
    colors: ["#ff1493", "#e0115f", "#c71585"],
    glow: "rgba(255,20,147,0.8)",
    hasWings: false,
    barCount: 5,
    label: "ياقوتي",
    animation: "vip-wave-ruby",
  };
  if (level >= 6) return {
    colors: ["#50c878", "#3cb371", "#2e8b57"],
    glow: "rgba(80,200,120,0.8)",
    hasWings: false,
    barCount: 5,
    label: "زمردي",
    animation: "vip-wave-emerald",
  };
  if (level >= 5) return {
    colors: ["#00d4ff", "#0099cc", "#b9f2ff"],
    glow: "rgba(0,212,255,0.8)",
    hasWings: false,
    barCount: 4,
    label: "ماسي",
    animation: "vip-wave-diamond",
  };
  if (level >= 4) return {
    colors: ["#e5e4e2", "#d4d4d4", "#b8b8b8"],
    glow: "rgba(229,228,226,0.7)",
    hasWings: false,
    barCount: 4,
    label: "بلاتيني",
    animation: "vip-wave-platinum",
  };
  if (level >= 3) return {
    colors: ["#ffd700", "#ffed4e", "#ffa500"],
    glow: "rgba(255,215,0,0.7)",
    hasWings: false,
    barCount: 3,
    label: "ذهبي",
    animation: "vip-wave-gold",
  };
  if (level >= 2) return {
    colors: ["#e8e8e8", "#c0c0c0"],
    glow: "rgba(232,232,232,0.6)",
    hasWings: false,
    barCount: 3,
    label: "فضي",
    animation: "vip-wave-silver",
  };
  return {
    colors: ["#ff8c42", "#ff6b35"],
    glow: "rgba(255,140,66,0.5)",
    hasWings: false,
    barCount: 3,
    label: "برونزي",
    animation: "vip-wave-bronze",
  };
}

// Wing SVG for VIP 9-12
function VipWing({ side, colors, size, glow }: { side: "left" | "right"; colors: string[]; size: number; glow: string }) {
  const flip = side === "right" ? "scaleX(-1)" : "scaleX(1)";
  const c1 = colors[0] || "#ffd700";
  const c2 = colors[1] || "#ff69b4";
  const c3 = colors[2] || c1;
  const wingW = size * 0.85;
  const wingH = size * 0.9;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        [side === "left" ? "right" : "left"]: "100%",
        top: "50%",
        transform: `translateY(-50%) ${flip}`,
        width: wingW,
        height: wingH,
        animation: `vip-wing-flap 1.2s ease-in-out infinite`,
        transformOrigin: side === "left" ? "right center" : "left center",
        filter: `drop-shadow(0 0 ${size * 0.15}px ${glow})`,
      }}
    >
      <svg width={wingW} height={wingH} viewBox="0 0 60 70" fill="none">
        <defs>
          <linearGradient id={`wing-grad-${side}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c1} stopOpacity="0.95" />
            <stop offset="50%" stopColor={c2} stopOpacity="0.8" />
            <stop offset="100%" stopColor={c3} stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id={`wing-shine-${side}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        {/* Main wing shape */}
        <path
          d="M55 35 C45 10, 20 5, 5 20 C15 22, 25 25, 30 35 C25 45, 15 48, 5 50 C20 65, 45 60, 55 35Z"
          fill={`url(#wing-grad-${side})`}
          opacity="0.9"
        />
        {/* Wing feather lines */}
        <path d="M55 35 C40 28, 20 22, 5 20" stroke={c1} strokeWidth="0.8" opacity="0.6" fill="none" />
        <path d="M52 30 C38 24, 18 20, 5 22" stroke={c2} strokeWidth="0.6" opacity="0.5" fill="none" />
        <path d="M50 40 C36 38, 18 38, 5 40" stroke={c1} strokeWidth="0.6" opacity="0.5" fill="none" />
        <path d="M52 45 C38 44, 20 46, 5 48" stroke={c2} strokeWidth="0.6" opacity="0.4" fill="none" />
        {/* Shine overlay */}
        <path
          d="M55 35 C45 10, 20 5, 5 20 C15 22, 25 25, 30 35Z"
          fill={`url(#wing-shine-${side})`}
          opacity="0.3"
        />
        {/* Sparkles on wing */}
        <circle cx="20" cy="18" r="1.5" fill="white" opacity="0.8" />
        <circle cx="35" cy="12" r="1" fill="white" opacity="0.6" />
        <circle cx="45" cy="22" r="1.2" fill={c1} opacity="0.9" />
      </svg>
    </div>
  );
}

// Main VIP Speaking Waves
export default function VipSpeakingWaves({ vipLevel, size = 48, isSpeaking = true, isMusic = false }: VipSpeakingWavesProps) {
  const config = getWaveConfig(vipLevel);
  if (!config) {
    // Default green speaking waves for non-VIP
    if (!isSpeaking && !isMusic) return null;
    return (
      <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-60 z-0" />
    );
  }

  const barCount = config.barCount;
  const barHeights = Array.from({ length: barCount }, (_, i) => {
    const mid = (barCount - 1) / 2;
    const dist = Math.abs(i - mid);
    return size * (0.25 + (1 - dist / mid) * 0.45);
  });

  const primaryColor = config.colors[0];
  const secondaryColor = config.colors[1] || config.colors[0];

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none"
      style={{ overflow: "visible" }}
    >
      {/* Wings for VIP 9-12 */}
      {config.hasWings && (
        <>
          <VipWing side="left" colors={config.wingColor || config.colors} size={size} glow={config.glow} />
          <VipWing side="right" colors={config.wingColor || config.colors} size={size} glow={config.glow} />
        </>
      )}

      {/* Outer glow ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: `2px solid ${primaryColor}`,
          boxShadow: `0 0 ${size * 0.3}px ${config.glow}, 0 0 ${size * 0.6}px ${config.glow}40, inset 0 0 ${size * 0.2}px ${config.glow}20`,
          animation: "vip-ring-pulse 1.5s ease-in-out infinite",
        }}
      />

      {/* Sound wave bars - positioned around the avatar */}
      {/* Left side bars */}
      <div
        className="absolute flex items-center gap-0.5"
        style={{
          right: "100%",
          top: "50%",
          transform: "translateY(-50%)",
          paddingRight: config.hasWings ? size * 0.7 : 2,
          flexDirection: "row-reverse",
        }}
      >
        {barHeights.slice(0, Math.ceil(barCount / 2)).map((h, i) => (
          <div
            key={i}
            className="rounded-full flex-shrink-0"
            style={{
              width: Math.max(2, size * 0.05),
              height: h,
              background: `linear-gradient(180deg, ${primaryColor}, ${secondaryColor})`,
              boxShadow: `0 0 ${size * 0.1}px ${config.glow}`,
              animation: `${config.animation} ${0.4 + i * 0.12}s ease-in-out infinite alternate`,
              opacity: 0.85,
            }}
          />
        ))}
      </div>

      {/* Right side bars */}
      <div
        className="absolute flex items-center gap-0.5"
        style={{
          left: "100%",
          top: "50%",
          transform: "translateY(-50%)",
          paddingLeft: config.hasWings ? size * 0.7 : 2,
        }}
      >
        {barHeights.slice(0, Math.ceil(barCount / 2)).map((h, i) => (
          <div
            key={i}
            className="rounded-full flex-shrink-0"
            style={{
              width: Math.max(2, size * 0.05),
              height: h,
              background: `linear-gradient(180deg, ${primaryColor}, ${secondaryColor})`,
              boxShadow: `0 0 ${size * 0.1}px ${config.glow}`,
              animation: `${config.animation} ${0.4 + i * 0.12}s ease-in-out infinite alternate`,
              opacity: 0.85,
            }}
          />
        ))}
      </div>

      {/* Rainbow shimmer for VIP 12 */}
      {vipLevel === 12 && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: "conic-gradient(from 0deg, #ffd70040, #ff69b440, #00ffff40, #ff149340, #ffd70040)",
            animation: "vip-rainbow-spin 3s linear infinite",
          }}
        />
      )}
    </div>
  );
}

// Export the config getter for use in other components
export { getWaveConfig };
