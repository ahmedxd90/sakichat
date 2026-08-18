// @ts-nocheck
import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// ── أيقونة ميكروفون SVG حقيقية للمضيف ──
function MicSvg({ size = 14, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id={`micGrad_${color.replace("#","")}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <rect x="9" y="2" width="6" height="12" rx="3"
        fill={`url(#micGrad_${color.replace("#","")})`}
        stroke={color} strokeWidth="0.8" />
      <path d="M5 10a7 7 0 0014 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12" y2="21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="9" y1="21" x2="15" y2="21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// ── أيقونة تاج SVG حقيقية لمالك الوكالة ──
function CrownSvg({ size = 14, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id={`crownGrad_${color.replace("#","")}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <path d="M3 18h18M5 18L3 8l5 4 4-6 4 6 5-4-2 10H5z"
        fill={`url(#crownGrad_${color.replace("#","")})`}
        stroke={color} strokeWidth="1" strokeLinejoin="round" />
      <circle cx="3" cy="8" r="1.5" fill={color} />
      <circle cx="12" cy="5" r="1.5" fill={color} />
      <circle cx="21" cy="8" r="1.5" fill={color} />
    </svg>
  );
}

// ── الإعدادات حسب الدور ──
function getBadgeConfig(role: string) {
  if (role === "owner") {
    return {
      label: "وكيل مضيفين",
      sublabel: "مالك الوكالة",
      gradient: "linear-gradient(135deg, #f59e0b, #d97706, #b45309)",
      glowColor: "rgba(245,158,11,0.7)",
      borderColor: "rgba(245,158,11,0.8)",
      textColor: "#fef3c7",
      shimmerColor: "rgba(255,255,255,0.25)",
      icon: (size: number) => <CrownSvg size={size} color="#fef3c7" />,
    };
  }
  // host / admin
  return {
    label: "مضيف",
    sublabel: "وكالة مضيفين",
    gradient: "linear-gradient(135deg, #7c3aed, #a855f7, #c084fc)",
    glowColor: "rgba(168,85,247,0.7)",
    borderColor: "rgba(168,85,247,0.8)",
    textColor: "#f3e8ff",
    shimmerColor: "rgba(255,255,255,0.2)",
    icon: (size: number) => <MicSvg size={size} color="#f3e8ff" />,
  };
}

// ── Badge Inline (صغير - للشريط بجانب الاسم) ──
export function HostAgencyBadgeInline({
  userId,
  size = "sm",
}: {
  userId: Id<"users">;
  size?: "sm" | "md";
}) {
  const badge = useQuery(api.hostAgency.getAgencyBadgeByUserId, { userId });
  if (!badge) return null;

  const cfg = getBadgeConfig(badge.role);
  const iconSize = size === "sm" ? 11 : 13;
  const fontSize = size === "sm" ? 9 : 10;
  const px = size === "sm" ? "5px" : "7px";
  const py = size === "sm" ? "2px" : "3px";

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full font-black"
      style={{
        background: cfg.gradient,
        border: `1px solid ${cfg.borderColor}`,
        color: cfg.textColor,
        boxShadow: `0 0 8px ${cfg.glowColor}, inset 0 1px 0 rgba(255,255,255,0.15)`,
        padding: `${py} ${px}`,
        fontSize,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* shimmer */}
      <span
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(105deg, transparent 30%, ${cfg.shimmerColor} 50%, transparent 70%)`,
          backgroundSize: "200% 100%",
          animation: "host-badge-shimmer 2.5s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 3 }}>
        {cfg.icon(iconSize)}
        {cfg.label}
      </span>
      <style>{`
        @keyframes host-badge-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </span>
  );
}

// ── Badge Card (كبير - لصفحة الأوسمة) ──
export function HostAgencyBadgeCard({ userId }: { userId: Id<"users"> }) {
  const badge = useQuery(api.hostAgency.getAgencyBadgeByUserId, { userId });
  if (!badge) return null;

  const cfg = getBadgeConfig(badge.role);

  return (
    <div
      className="relative rounded-2xl flex flex-col items-center overflow-hidden"
      style={{
        background: cfg.gradient,
        border: `1.5px solid ${cfg.borderColor}`,
        boxShadow: `0 0 20px ${cfg.glowColor}, inset 0 1px 0 rgba(255,255,255,0.15)`,
        padding: "14px 10px",
        gap: 6,
      }}
    >
      {/* shimmer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(105deg, transparent 40%, ${cfg.shimmerColor} 50%, transparent 60%)`,
          backgroundSize: "200% 100%",
          animation: "host-badge-shimmer 2.5s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      {/* pulse dot */}
      <div
        className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ background: cfg.textColor, boxShadow: `0 0 4px ${cfg.glowColor}` }}
      />
      {/* icon */}
      <div style={{ filter: `drop-shadow(0 0 6px ${cfg.glowColor})`, position: "relative", zIndex: 1 }}>
        {cfg.icon(30)}
      </div>
      {/* text */}
      <div className="text-center" style={{ position: "relative", zIndex: 1 }}>
        <div className="font-black leading-tight" style={{ fontSize: 11, color: cfg.textColor, textShadow: `0 0 8px ${cfg.glowColor}` }}>
          {cfg.label}
        </div>
        <div className="leading-tight" style={{ fontSize: 9, color: `${cfg.textColor}90`, marginTop: 1 }}>
          {badge.agencyName}
        </div>
      </div>
      <style>{`
        @keyframes host-badge-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

// ── Section Card (بطاقة كاملة في صفحة الملف الشخصي) ──
export function HostAgencyBadgeSection({ userId }: { userId: Id<"users"> }) {
  const badge = useQuery(api.hostAgency.getAgencyBadgeByUserId, { userId });
  if (!badge) return null;

  const cfg = getBadgeConfig(badge.role);

  return (
    <div
      className="relative rounded-2xl p-3 flex items-center gap-3 overflow-hidden"
      style={{
        background: cfg.gradient,
        border: `1.5px solid ${cfg.borderColor}`,
        boxShadow: `0 4px 20px ${cfg.glowColor}`,
      }}
    >
      {/* shimmer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(105deg, transparent 30%, ${cfg.shimmerColor} 50%, transparent 70%)`,
          backgroundSize: "200% 100%",
          animation: "host-badge-shimmer 2.5s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      {/* icon circle */}
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full"
        style={{
          width: 44,
          height: 44,
          background: "rgba(0,0,0,0.25)",
          border: `1.5px solid ${cfg.borderColor}`,
          filter: `drop-shadow(0 0 8px ${cfg.glowColor})`,
          position: "relative",
          zIndex: 1,
        }}
      >
        {cfg.icon(22)}
      </div>
      {/* text */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <p className="font-black text-sm" style={{ color: cfg.textColor, textShadow: `0 0 8px ${cfg.glowColor}` }}>
          {cfg.label}
        </p>
        <p className="text-xs font-bold" style={{ color: `${cfg.textColor}90` }}>
          {badge.agencyName}
        </p>
      </div>
      <style>{`
        @keyframes host-badge-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
