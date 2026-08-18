// ألوان اسم المستخدم وشارات الاستقراطية: مصدر واحد لجميع الغرف والدردشة والملفات والمنشورات واللحظات والبث.
// كل رتبة من 1 إلى 6 تستخدم التدرج والوهج الحقيقيين من convex/aristocracy.ts.
// @ts-nocheck
import React from "react";
import { ARISTOCRACY_RANKS } from "../../convex/aristocracy";

const LOCAL_RANK_ICONS: Record<number, string> = {
  1: "/assets/aristocracy/general.png",
  2: "/assets/aristocracy/archduke.png",
  3: "/assets/aristocracy/marquis.png",
  4: "/assets/aristocracy/duke.png",
  5: "/assets/aristocracy/king.png",
  6: "/assets/aristocracy/emperor.png",
};

export function getAristocracyConfig(level?: number | null) {
  if (!level || level < 1 || level > 6) return null;
  const rank = ARISTOCRACY_RANKS.find((rank) => rank.level === level) ?? null;
  return rank ? { ...rank, iconUrl: LOCAL_RANK_ICONS[rank.level] ?? rank.iconUrl } : null;
}

export function getAristocracyChatBubbleStyle(level?: number | null) {
  const cfg = getAristocracyConfig(level);
  if (!cfg) return { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" };
  return { background: `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}08)`, border: `1px solid ${cfg.color}70`, boxShadow: `0 0 12px ${cfg.glowColor}` };
}

export function AristocracyName({ name, level, children, className = "" }: { name?: string; level?: number | null; children?: React.ReactNode; className?: string; dbName?: string | null }) {
  const cfg = getAristocracyConfig(level);
  const displayName = name || children;
  if (!cfg) return <span className={`text-gray-300 ${className}`}>{displayName}</span>;
  return <span className={`font-black ${className}`} style={{ background: cfg.gradient, backgroundSize: "260% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "aristo-name-flow 2.8s linear infinite", filter: `drop-shadow(0 0 6px ${cfg.glowColor})` }}>{displayName}</span>;
}

export function AristocracyBadge({ level, size = "sm", dbName }: { level?: number | null; size?: "xs" | "sm" | "md"; dbName?: string | null }) {
  const cfg = getAristocracyConfig(level);
  if (!cfg) return null;
  const displayName = dbName || cfg.nameAr;
  return <span className="inline-flex items-center gap-1 rounded-full font-black" style={{ background: cfg.gradient, color: "#081018", fontSize: size === "xs" ? 7 : size === "sm" ? 9 : 11, padding: size === "xs" ? "1px 3px" : size === "sm" ? "2px 6px" : "3px 8px", boxShadow: `0 0 12px ${cfg.glowColor}`, animation: "aristo-badge-flow 2.2s ease-in-out infinite", whiteSpace: "nowrap" }}><img src={cfg.iconUrl} alt="" className="h-4 w-4 object-contain" onError={(event) => { event.currentTarget.style.display = "none"; }} />{displayName}</span>;
}

export function AristocracyFrame({ children, level }: { children: React.ReactNode; level?: number | null }) {
  const cfg = getAristocracyConfig(level);
  if (!cfg) return <>{children}</>;
  const isHighRank = Boolean(level && level >= 5);
  return <div className="relative" style={{ overflow: "visible", padding: 2, borderRadius: "50%", background: cfg.gradient, boxShadow: `0 0 ${isHighRank ? 24 : 14}px ${cfg.glowColor}`, animation: isHighRank ? "aristo-frame-flow 2.4s linear infinite" : undefined }}><div className="pointer-events-none absolute inset-0 rounded-full" style={{ boxShadow: `inset 0 0 0 1px rgba(255,255,255,.65), 0 0 12px ${cfg.glowColor}` }} />{children}</div>;
}

if (typeof document !== "undefined") {
  const styleId = "aristo-animations";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style"); style.id = styleId; style.textContent = `@keyframes aristo-name-flow{0%{background-position:0% center}100%{background-position:260% center}}@keyframes aristo-badge-flow{0%,100%{filter:brightness(1);transform:translateY(0)}50%{filter:brightness(1.18);transform:translateY(-1px)}}@keyframes aristo-frame-flow{0%{filter:hue-rotate(0deg)}50%{filter:hue-rotate(18deg) brightness(1.12)}100%{filter:hue-rotate(0deg)}}`; document.head.appendChild(style);
  }
}
