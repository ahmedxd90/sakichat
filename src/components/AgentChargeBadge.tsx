// @ts-nocheck
import React from "react";
import "./AgentChargeBadge.css";

// ── أيقونة برق/شحن متحركة SVG ──
function BoltSvg({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="boltGradAgent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <path
        d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z"
        fill="url(#boltGradAgent)"
        stroke="#fde68a"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── أيقونة عملة ساكي ──
function SakiCoinSvg({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="url(#sakiGradBadgeA)" stroke="#b45309" strokeWidth="1" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="900" fill="#7c2d12" fontFamily="Arial">S</text>
      <defs>
        <radialGradient id="sakiGradBadgeA" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// ── نجمة صغيرة ──
function StarSvg({ size = 8 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#fde68a">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

interface AgentChargeBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
  style?: React.CSSProperties;
}

export function AgentChargeBadge({
  size = "sm",
  showLabel = true,
  animated = true,
  style,
}: AgentChargeBadgeProps) {
  const sizeMap = {
    xs: { fontSize: 8, padding: "1px 5px 1px 4px", gap: 2, iconSize: 10, dotSize: 3 },
    sm: { fontSize: 9, padding: "2px 7px 2px 5px", gap: 3, iconSize: 13, dotSize: 4 },
    md: { fontSize: 11, padding: "3px 10px 3px 7px", gap: 5, iconSize: 15, dotSize: 5 },
    lg: { fontSize: 13, padding: "4px 13px 4px 9px", gap: 6, iconSize: 17, dotSize: 6 },
  };

  const s = sizeMap[size];
  const gradient = "linear-gradient(135deg, #451a03 0%, #78350f 20%, #b45309 45%, #d97706 65%, #f59e0b 80%, #fbbf24 100%)";
  const border = "rgba(251,191,36,0.9)";
  const textColor = "#fef3c7";
  const accentColor = "#f59e0b";

  return (
    <span
      className="agent-badge-shine"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        borderRadius: 999,
        padding: s.padding,
        background: gradient,
        border: `1.5px solid ${border}`,
        color: textColor,
        fontSize: s.fontSize,
        fontWeight: 900,
        letterSpacing: "0.02em",
        animation: animated
          ? `agentGlow 2s ease-in-out infinite, agentPulse 3s ease-in-out infinite`
          : undefined,
        boxShadow: `0 0 10px rgba(245,158,11,0.75), 0 2px 10px rgba(0,0,0,0.5)`,
        whiteSpace: "nowrap",
        flexShrink: 0,
        direction: "rtl",
        ...style,
      }}
    >
      {/* نجمة صغيرة متحركة */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          animation: animated ? "agentStarSpin 3s linear infinite" : undefined,
        }}
      >
        <StarSvg size={s.iconSize - 4} />
      </span>

      {/* أيقونة البرق المتحركة */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          animation: animated ? "agentBoltSpin 2.5s ease-in-out infinite" : undefined,
        }}
      >
        <BoltSvg size={s.iconSize} />
      </span>

      {/* النص المتغير اللون */}
      {showLabel && (
        <span
          style={{
            background: `linear-gradient(90deg, #fef3c7, #ffffff, #fbbf24, #ffffff, #fef3c7)`,
            backgroundSize: "300% 100%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: animated ? "agentShimmer 2.5s ease-in-out infinite" : undefined,
            fontWeight: 900,
          }}
        >
          وكـيـل الـشـحـن
        </span>
      )}

      {/* عملة ساكي */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          filter: `drop-shadow(0 0 3px ${accentColor})`,
        }}
      >
        <SakiCoinSvg size={s.iconSize - 2} />
      </span>

      {/* نقطة متوهجة */}
      <span
        style={{
          width: s.dotSize,
          height: s.dotSize,
          borderRadius: "50%",
          background: accentColor,
          boxShadow: `0 0 4px ${accentColor}, 0 0 8px ${accentColor}`,
          flexShrink: 0,
          animation: animated ? "agentDotPulse 1.5s ease-in-out infinite" : undefined,
        }}
      />
    </span>
  );
}

// ── مكوّن مدمج يعرض الشارة فقط إذا كان المستخدم وكيل شحن ──
interface AgentChargeBadgeIfProps {
  profile: any;
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
  style?: React.CSSProperties;
}

export function AgentChargeBadgeIf({
  profile,
  size = "sm",
  showLabel = true,
  animated = true,
  style,
}: AgentChargeBadgeIfProps) {
  if (!profile?.isAgent) return null;
  return (
    <AgentChargeBadge
      size={size}
      showLabel={showLabel}
      animated={animated}
      style={style}
    />
  );
}

// ── أيقونة صغيرة للمقاعد (بدون نص) ──
export function AgentSeatIcon({ size = 11 }: { size?: number }) {
  return (
    <div
      style={{
        animation: "agentBoltSpin 2.5s ease-in-out infinite",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="agentSeatGradX" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>
        <path
          d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z"
          fill="url(#agentSeatGradX)"
          stroke="#fde68a"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default AgentChargeBadge;
