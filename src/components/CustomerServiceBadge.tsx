// @ts-nocheck
import React from "react";

/**
 * لقب "خـدمـة الـعـمـلاء" - بنفسجي لامع متحرك مع أيقونة سماعة
 */
export function CustomerServiceBadge({ size = "sm" }: { size?: "xs" | "sm" | "md" | "lg" }) {
  const sizes = {
    xs: { px: "px-1.5 py-0.5", text: "text-[9px]", icon: 10, gap: "gap-0.5" },
    sm: { px: "px-2 py-0.5", text: "text-[10px]", icon: 12, gap: "gap-1" },
    md: { px: "px-2.5 py-1", text: "text-xs", icon: 14, gap: "gap-1" },
    lg: { px: "px-3 py-1.5", text: "text-sm", icon: 16, gap: "gap-1.5" },
  };
  const s = sizes[size];

  return (
    <>
      <span
        className={`inline-flex items-center ${s.gap} ${s.px} ${s.text} rounded-full font-black select-none flex-shrink-0`}
        style={{
          background: "linear-gradient(90deg,#7c3aed,#a855f7,#c084fc,#a855f7,#7c3aed)",
          backgroundSize: "300% 100%",
          animation: "cs-shimmer 2.5s linear infinite",
          color: "#fff",
          boxShadow: "0 0 10px rgba(168,85,247,0.7), 0 0 20px rgba(168,85,247,0.4)",
          border: "1px solid rgba(192,132,252,0.6)",
          textShadow: "0 0 8px rgba(255,255,255,0.8)",
          letterSpacing: "0.02em",
        }}
      >
        {/* Headset icon */}
        <svg width={s.icon} height={s.icon} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <path d="M3 18v-6a9 9 0 0118 0v6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>خـدمـة الـعـمـلاء</span>
      </span>
      <style>{`
        @keyframes cs-shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 300% center; }
        }
      `}</style>
    </>
  );
}

export default CustomerServiceBadge;
