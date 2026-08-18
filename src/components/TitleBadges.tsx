// مكوّن الألقاب الاحترافية - أيقونات SVG حقيقية بدون إيموجي
import React from "react";

// ── أيقونة تاج ملكي (ملك اللحظات) ──
function CrownSvg({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M3 18h18M5 18L3 8l5 4 4-6 4 6 5-4-2 10H5z"
        stroke={color} strokeWidth="1.8" strokeLinejoin="round"
        fill={`${color}30`}
      />
      <circle cx="3" cy="8" r="1.5" fill={color} />
      <circle cx="12" cy="5" r="1.5" fill={color} />
      <circle cx="21" cy="8" r="1.5" fill={color} />
    </svg>
  );
}

// ── أيقونة عملة ذهبية (المليونير) ──
function GoldCoinSvg({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" fill={`${color}20`} />
      <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="1.2" fill={`${color}15`} />
      <path
        d="M12 8v1.5M12 14.5V16M10 10.5h2.5a1.5 1.5 0 010 3H11a1.5 1.5 0 000 3H14"
        stroke={color} strokeWidth="1.5" strokeLinecap="round"
      />
    </svg>
  );
}

// ── أيقونة قلم كتابة (كاتب منشور) ──
function PenSvg({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M17 3a2.828 2.828 0 114 4L7.5 20.5 3 21l.5-4.5L17 3z"
        stroke={color} strokeWidth="1.8" strokeLinejoin="round"
        fill={`${color}20`}
      />
      <path d="M15 5l4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3 21h18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── أيقونة فيلم/ريلز (ملك الريلز) ──
function FilmSvg({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="1.8" fill={`${color}20`} />
      <path d="M2 9h20M2 15h20M7 5v4M7 15v4M17 5v4M17 15v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill={color} />
    </svg>
  );
}

// ── تعريف الألقاب ──
interface TitleBadgeDef {
  key: string;
  label: string;
  sublabel: string;
  icon: (color: string) => React.ReactNode;
  gradient: string;
  border: string;
  textColor: string;
  glow: string;
  shimmerColor: string;
  accentColor: string;
}

const TITLE_BADGES: TitleBadgeDef[] = [
  {
    key: "isMomentsKing",
    label: "ملك اللحظات",
    sublabel: "100 إعجاب",
    icon: (c) => <CrownSvg color={c} size={13} />,
    gradient: "linear-gradient(135deg, #7f1d1d 0%, #be123c 40%, #f43f5e 70%, #fb7185 100%)",
    border: "rgba(244,63,94,0.8)",
    textColor: "#fecdd3",
    glow: "rgba(244,63,94,0.6)",
    shimmerColor: "rgba(255,180,190,0.25)",
    accentColor: "#f43f5e",
  },
  {
    key: "isMillionaireTitle",
    label: "المليونير",
    sublabel: "100M عملة",
    icon: (c) => <GoldCoinSvg color={c} size={13} />,
    gradient: "linear-gradient(135deg, #78350f 0%, #b45309 35%, #d97706 65%, #fbbf24 100%)",
    border: "rgba(234,179,8,0.9)",
    textColor: "#fef9c3",
    glow: "rgba(234,179,8,0.7)",
    shimmerColor: "rgba(255,240,100,0.3)",
    accentColor: "#eab308",
  },
  {
    key: "isMomentWriter",
    label: "كاتب منشور",
    sublabel: "100 منشور",
    icon: (c) => <PenSvg color={c} size={13} />,
    gradient: "linear-gradient(135deg, #164e63 0%, #0e7490 35%, #06b6d4 65%, #67e8f9 100%)",
    border: "rgba(6,182,212,0.8)",
    textColor: "#cffafe",
    glow: "rgba(6,182,212,0.6)",
    shimmerColor: "rgba(100,230,255,0.25)",
    accentColor: "#06b6d4",
  },
  {
    key: "isReelsKing",
    label: "ملك الريلز",
    sublabel: "100 إعجاب",
    icon: (c) => <FilmSvg color={c} size={13} />,
    gradient: "linear-gradient(135deg, #3b0764 0%, #7e22ce 35%, #a855f7 65%, #d8b4fe 100%)",
    border: "rgba(168,85,247,0.9)",
    textColor: "#f3e8ff",
    glow: "rgba(168,85,247,0.7)",
    shimmerColor: "rgba(200,150,255,0.3)",
    accentColor: "#a855f7",
  },
];

interface TitleBadgesProps {
  profile: any;
  size?: "sm" | "md";
}

export function TitleBadges({ profile, size = "sm" }: TitleBadgesProps) {
  if (!profile) return null;
  const active = TITLE_BADGES.filter((b) => profile[b.key]);
  if (active.length === 0) return null;

  const isSm = size === "sm";

  return (
    <>
      <style>{`
        @keyframes titleGlow {
          0%, 100% { box-shadow: 0 0 6px var(--title-glow), 0 0 12px var(--title-glow); }
          50% { box-shadow: 0 0 10px var(--title-glow), 0 0 20px var(--title-glow), 0 0 30px var(--title-glow); }
        }
        @keyframes titleShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes titlePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(0.97); }
        }
        .title-badge-shine::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%);
          background-size: 200% 100%;
          animation: titleShimmer 2.5s ease-in-out infinite;
          border-radius: inherit;
          pointer-events: none;
        }
      `}</style>
      {active.map((b) => (
        <span
          key={b.key}
          className="title-badge-shine"
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            gap: isSm ? 3 : 5,
            borderRadius: 999,
            padding: isSm ? "2px 7px 2px 5px" : "3px 10px 3px 7px",
            background: b.gradient,
            border: `1px solid ${b.border}`,
            color: b.textColor,
            fontSize: isSm ? 9 : 11,
            fontWeight: 900,
            letterSpacing: "0.02em",
            "--title-glow": b.glow,
            animation: "titleGlow 2.5s ease-in-out infinite, titlePulse 3s ease-in-out infinite",
            boxShadow: `0 0 8px ${b.glow}, 0 2px 8px rgba(0,0,0,0.4)`,
            overflow: "hidden",
            whiteSpace: "nowrap",
            flexShrink: 0,
          } as React.CSSProperties}
        >
          {/* أيقونة SVG */}
          <span style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            filter: `drop-shadow(0 0 3px ${b.accentColor})`,
          }}>
            {b.icon(b.textColor)}
          </span>

          {/* النص */}
          <span style={{
            background: `linear-gradient(90deg, ${b.textColor}, white, ${b.textColor})`,
            backgroundSize: "200% 100%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "titleShimmer 3s ease-in-out infinite",
            fontWeight: 900,
          }}>
            {b.label}
          </span>

          {/* نقطة متوهجة */}
          <span style={{
            width: isSm ? 4 : 5,
            height: isSm ? 4 : 5,
            borderRadius: "50%",
            background: b.accentColor,
            boxShadow: `0 0 4px ${b.accentColor}, 0 0 8px ${b.accentColor}`,
            flexShrink: 0,
            animation: "titlePulse 1.5s ease-in-out infinite",
          }} />
        </span>
      ))}
    </>
  );
}
