// @ts-nocheck
import React from "react";

// ── أيقونة كاميرا/صانع محتوى ──
function CameraSvg({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={`${color}20`}
      />
      <circle cx="12" cy="13" r="4" stroke={color} strokeWidth="1.6" fill={`${color}15`} />
      <circle cx="12" cy="13" r="1.5" fill={color} />
    </svg>
  );
}

// ── أيقونة نجمة لامعة ──
function StarSvg({ color, size = 10 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

interface ContentCreatorBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
  style?: React.CSSProperties;
}

export function ContentCreatorBadge({
  size = "sm",
  showLabel = true,
  animated = true,
  style,
}: ContentCreatorBadgeProps) {
  const sizeMap = {
    xs: { fontSize: 8, padding: "1px 5px 1px 4px", gap: 2, iconSize: 10, dotSize: 3 },
    sm: { fontSize: 9, padding: "2px 7px 2px 5px", gap: 3, iconSize: 12, dotSize: 4 },
    md: { fontSize: 11, padding: "3px 10px 3px 7px", gap: 5, iconSize: 14, dotSize: 5 },
    lg: { fontSize: 13, padding: "4px 13px 4px 9px", gap: 6, iconSize: 16, dotSize: 6 },
  };

  const s = sizeMap[size];

  const gradient = "linear-gradient(135deg, #0f172a 0%, #1e3a5f 25%, #1d4ed8 55%, #3b82f6 80%, #60a5fa 100%)";
  const border = "rgba(96,165,250,0.85)";
  const textColor = "#dbeafe";
  const glow = "rgba(59,130,246,0.65)";
  const accentColor = "#3b82f6";

  return (
    <>
      <style>{`
        @keyframes ccGlow {
          0%, 100% { box-shadow: 0 0 6px ${glow}, 0 0 12px ${glow}; }
          50% { box-shadow: 0 0 12px ${glow}, 0 0 22px ${glow}, 0 0 32px ${glow}; }
        }
        @keyframes ccShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes ccPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(0.97); }
        }
        @keyframes ccDotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.7); }
        }
        @keyframes ccStarSpin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.2); }
          100% { transform: rotate(360deg) scale(1); }
        }
        .cc-badge-shine::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%);
          background-size: 200% 100%;
          animation: ccShimmer 2.5s ease-in-out infinite;
          border-radius: inherit;
          pointer-events: none;
        }
      `}</style>

      <span
        className="cc-badge-shine"
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          gap: s.gap,
          borderRadius: 999,
          padding: s.padding,
          background: gradient,
          border: `1px solid ${border}`,
          color: textColor,
          fontSize: s.fontSize,
          fontWeight: 900,
          letterSpacing: "0.02em",
          animation: animated
            ? `ccGlow 2.5s ease-in-out infinite, ccPulse 3s ease-in-out infinite`
            : undefined,
          boxShadow: `0 0 8px ${glow}, 0 2px 8px rgba(0,0,0,0.4)`,
          overflow: "hidden",
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
            animation: animated ? "ccStarSpin 4s linear infinite" : undefined,
            filter: `drop-shadow(0 0 3px ${accentColor})`,
          }}
        >
          <StarSvg color="#93c5fd" size={s.iconSize - 2} />
        </span>

        {/* أيقونة الكاميرا */}
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            filter: `drop-shadow(0 0 4px ${accentColor})`,
          }}
        >
          <CameraSvg color={textColor} size={s.iconSize} />
        </span>

        {/* النص */}
        {showLabel && (
          <span
            style={{
              background: `linear-gradient(90deg, ${textColor}, #ffffff, ${textColor})`,
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: animated ? "ccShimmer 3s ease-in-out infinite" : undefined,
              fontWeight: 900,
            }}
          >
            صانع محتوى
          </span>
        )}

        {/* نقطة متوهجة */}
        <span
          style={{
            width: s.dotSize,
            height: s.dotSize,
            borderRadius: "50%",
            background: accentColor,
            boxShadow: `0 0 4px ${accentColor}, 0 0 8px ${accentColor}`,
            flexShrink: 0,
            animation: animated ? "ccDotPulse 1.5s ease-in-out infinite" : undefined,
          }}
        />
      </span>
    </>
  );
}

// ── مكوّن مدمج يعرض الشارة فقط إذا كان المستخدم صانع محتوى ──
interface ContentCreatorBadgeIfProps {
  profile: any;
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
  style?: React.CSSProperties;
}

export function ContentCreatorBadgeIf({
  profile,
  size = "sm",
  showLabel = true,
  animated = true,
  style,
}: ContentCreatorBadgeIfProps) {
  if (!profile?.isContentCreator) return null;
  return (
    <ContentCreatorBadge
      size={size}
      showLabel={showLabel}
      animated={animated}
      style={style}
    />
  );
}

export default ContentCreatorBadge;
