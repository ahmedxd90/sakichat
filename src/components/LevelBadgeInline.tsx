// @ts-nocheck
import React, { useState } from "react";
import { getLevelAsset, getLevelColor, getLevelTierLabel, getLevelTier } from "../lib/levelSystem";

interface LevelBadgeInlineProps {
  wealthLevel?: number | null;
  charismaLevel?: number | null;
  size?: "xs" | "sm" | "md";
}

function FallbackLevelShape({ level, type, size, colors }: any) {
  const tier = getLevelTier(level);
  const shapes = [
    <path d="M12 1.8l3.1 6.3 6.9 1-5 4.9 1.2 6.9-6.2-3.3-6.2 3.3L7 14 2 9.1l6.9-1L12 1.8z" fill={colors.primary} />,
    <path d="M12 2L4 6v6c0 5.3 3.5 10.2 8 11.5C16.5 22.2 20 17.3 20 12V6l-8-4z" fill={colors.primary} />,
    <path d="M12 2l10 10-10 10L2 12 12 2z" fill={colors.primary} />,
    <path d="M2 7l5 5 5-7 5 7 5-5v12H2V7z" fill={colors.primary} />,
    <path d="M12 2c-4 0-7 6-7 12l2 2h10l2-2c0-6-3-12-7-12zM9 18l1 4h4l1-4H9z" fill={colors.primary} />,
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ filter: `drop-shadow(0 0 ${size / 5}px ${colors.glow})` }}>
      <defs>
        <linearGradient id={`fallback-${type}-${tier}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".42" />
          <stop offset=".42" stopColor={colors.primary} />
          <stop offset="1" stopColor={colors.secondary} />
        </linearGradient>
      </defs>
      {React.cloneElement(shapes[Math.min(tier - 1, shapes.length - 1)], { fill: `url(#fallback-${type}-${tier})`, stroke: colors.secondary, strokeWidth: .55 })}
    </svg>
  );
}

export function LevelIconSvg({ level, type, size }: { level: number; type: "wealth" | "charisma"; size: number }) {
  const [fallback, setFallback] = useState(false);
  if (level <= 0) return null;
  const colors = getLevelColor(level);
  const asset = getLevelAsset(level, type);
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }} title={`${type === "wealth" ? "الثروة" : "الكاريزما"} ${getLevelTierLabel(level)}`}>
      {!fallback ? (
        <img
          src={asset}
          alt=""
          draggable={false}
          onError={() => setFallback(true)}
          className="w-full h-full object-contain"
          style={{ filter: `drop-shadow(0 0 ${size / 5}px ${colors.glow}) drop-shadow(0 0 ${size / 3}px ${colors.primary}55)` }}
        />
      ) : <FallbackLevelShape level={level} type={type} size={size} colors={colors} />}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingTop: size * .05 }}>
        <span className="font-black leading-none" style={{ fontSize: Math.max(7, size * .25), color: "#fff", textShadow: `0 1px 3px rgba(0,0,0,.85), 0 0 6px ${colors.glow}` }}>{level}</span>
      </div>
    </div>
  );
}

export function LevelPillBadge({ level, type, size = "sm" }: { level: number; type: "wealth" | "charisma"; size?: "xs" | "sm" | "md" }) {
  if (!level || level <= 0) return null;
  const colors = getLevelColor(level);
  const iconSize = size === "xs" ? 14 : size === "sm" ? 19 : 24;
  const fontSize = size === "xs" ? 7 : size === "sm" ? 9 : 11;
  const px = size === "xs" ? "px-1 py-0.5" : size === "sm" ? "px-1.5 py-0.5" : "px-2 py-1";
  return (
    <div className={`inline-flex items-center gap-0.5 rounded-full flex-shrink-0`}>
      <LevelIconSvg level={level} type={type} size={iconSize + 4} />
    </div>
  );
}

export function LevelBadgeInline({ wealthLevel, charismaLevel, size = "sm" }: LevelBadgeInlineProps) {
  if ((!wealthLevel || wealthLevel <= 0) && (!charismaLevel || charismaLevel <= 0)) return null;
  return <div className="flex items-center gap-1">{wealthLevel && wealthLevel > 0 && <LevelPillBadge level={wealthLevel} type="wealth" size={size} />}{charismaLevel && charismaLevel > 0 && <LevelPillBadge level={charismaLevel} type="charisma" size={size} />}</div>;
}

export default LevelBadgeInline;
