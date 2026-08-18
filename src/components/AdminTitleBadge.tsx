// @ts-nocheck
import React from "react";

export const ADMIN_TITLE_BG_PRESETS = [
  { id: "gold", label: "ذهبي", gradient: "linear-gradient(135deg,rgba(255,215,0,0.22),rgba(255,140,0,0.14))", border: "rgba(255,215,0,0.55)", glow: "rgba(255,215,0,0.45)" },
  { id: "purple", label: "بنفسجي", gradient: "linear-gradient(135deg,rgba(168,85,247,0.22),rgba(124,58,237,0.14))", border: "rgba(168,85,247,0.55)", glow: "rgba(168,85,247,0.45)" },
  { id: "red", label: "أحمر", gradient: "linear-gradient(135deg,rgba(255,71,87,0.22),rgba(192,57,43,0.14))", border: "rgba(255,71,87,0.55)", glow: "rgba(255,71,87,0.45)" },
  { id: "blue", label: "أزرق", gradient: "linear-gradient(135deg,rgba(59,130,246,0.22),rgba(29,78,216,0.14))", border: "rgba(59,130,246,0.55)", glow: "rgba(59,130,246,0.45)" },
  { id: "pink", label: "وردي", gradient: "linear-gradient(135deg,rgba(236,72,153,0.22),rgba(219,39,119,0.14))", border: "rgba(236,72,153,0.55)", glow: "rgba(236,72,153,0.45)" },
  { id: "green", label: "أخضر", gradient: "linear-gradient(135deg,rgba(16,185,129,0.22),rgba(5,150,105,0.14))", border: "rgba(16,185,129,0.55)", glow: "rgba(16,185,129,0.45)" },
  { id: "cyan", label: "سماوي", gradient: "linear-gradient(135deg,rgba(6,182,212,0.22),rgba(14,116,144,0.14))", border: "rgba(6,182,212,0.55)", glow: "rgba(6,182,212,0.45)" },
  { id: "rainbow", label: "قوس قزح", gradient: "linear-gradient(135deg,rgba(255,71,87,0.18),rgba(168,85,247,0.18),rgba(59,130,246,0.18))", border: "rgba(168,85,247,0.5)", glow: "rgba(168,85,247,0.4)" },
  { id: "orange", label: "برتقالي", gradient: "linear-gradient(135deg,rgba(249,115,22,0.22),rgba(234,88,12,0.14))", border: "rgba(249,115,22,0.55)", glow: "rgba(249,115,22,0.45)" },
  { id: "dark", label: "داكن", gradient: "linear-gradient(135deg,rgba(30,30,50,0.85),rgba(15,15,30,0.9))", border: "rgba(255,255,255,0.15)", glow: "rgba(255,255,255,0.1)" },
];

export function getAdminTitleBgPreset(id?: string) {
  return ADMIN_TITLE_BG_PRESETS.find(p => p.id === id) ?? ADMIN_TITLE_BG_PRESETS[0];
}

interface AdminTitleBadgeProps {
  title: string;
  color1?: string;
  color2?: string;
  iconUrl?: string;
  bgPresetId?: string;
  size?: "xs" | "sm" | "md";
}

export default function AdminTitleBadge({
  title,
  color1 = "#ffd700",
  color2 = "#ff8c00",
  iconUrl,
  bgPresetId,
  size = "sm",
}: AdminTitleBadgeProps) {
  const preset = getAdminTitleBgPreset(bgPresetId);
  const imgSize = size === "xs" ? 12 : size === "sm" ? 15 : 20;
  const pad = size === "xs" ? "1px 5px 1px 2px" : size === "sm" ? "2px 7px 2px 3px" : "3px 10px 3px 4px";
  const fs = size === "xs" ? "9px" : size === "sm" ? "11px" : "13px";

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full font-black relative overflow-hidden"
      style={{
        background: preset.gradient,
        border: `1px solid ${preset.border}`,
        boxShadow: `0 0 10px ${preset.glow}`,
        padding: pad,
        fontSize: fs,
      }}
    >
      {/* shimmer */}
      <span
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.12) 50%,transparent 60%)",
          backgroundSize: "200% 100%",
          animation: "atb-shim 2.2s ease-in-out infinite",
        }}
      />
      {iconUrl && (
        <img
          src={iconUrl}
          alt=""
          style={{
            width: imgSize,
            height: imgSize,
            objectFit: "contain",
            flexShrink: 0,
            borderRadius: "50%",
            position: "relative",
            zIndex: 1,
          }}
        />
      )}
      <span
        style={{
          background: `linear-gradient(90deg,${color1},${color2},${color1})`,
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          animation: "atb-flow 2s linear infinite",
          fontWeight: 900,
          position: "relative",
          zIndex: 1,
        }}
      >
        {title}
      </span>
      <style>{`
        @keyframes atb-flow { 0%{background-position:0% center} 100%{background-position:200% center} }
        @keyframes atb-shim { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      `}</style>
    </span>
  );
}
