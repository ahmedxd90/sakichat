// @ts-nocheck
import React from "react";

export function Badge3D({ rank, size = 96 }: { rank: any; size?: number }) {
  const l = rank.level;

  if (l === 1) return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 0 12px rgba(96,165,250,0.9)) drop-shadow(0 4px 8px rgba(0,0,0,0.8))` }}>
      <defs>
        <linearGradient id="b1a" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93c5fd"/>
          <stop offset="50%" stopColor="#3b82f6"/>
          <stop offset="100%" stopColor="#1d4ed8"/>
        </linearGradient>
        <linearGradient id="b1b" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#1e40af" stopOpacity="0.2"/>
        </linearGradient>
        <filter id="b1s"><feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#1d4ed8" floodOpacity="0.8"/></filter>
      </defs>
      <path d="M50 8 L82 22 L82 52 Q82 75 50 92 Q18 75 18 52 L18 22 Z" fill="url(#b1a)" filter="url(#b1s)"/>
      <path d="M50 12 L78 25 L78 52 Q78 72 50 87" fill="none" stroke="url(#b1b)" strokeWidth="3" strokeLinecap="round"/>
      <path d="M50 20 L72 30 L72 52 Q72 67 50 80 Q28 67 28 52 L28 30 Z" fill="rgba(255,255,255,0.12)" stroke="rgba(147,197,253,0.5)" strokeWidth="1"/>
      <rect x="46" y="32" width="8" height="28" rx="2" fill="rgba(255,255,255,0.9)"/>
      <rect x="36" y="44" width="28" height="8" rx="2" fill="rgba(255,255,255,0.9)"/>
      <ellipse cx="38" cy="28" rx="8" ry="5" fill="rgba(255,255,255,0.3)" transform="rotate(-20,38,28)"/>
    </svg>
  );

  if (l === 2) return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 0 14px rgba(52,211,153,0.9)) drop-shadow(0 4px 8px rgba(0,0,0,0.8))` }}>
      <defs>
        <linearGradient id="b2a" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6ee7b7"/>
          <stop offset="50%" stopColor="#10b981"/>
          <stop offset="100%" stopColor="#065f46"/>
        </linearGradient>
        <linearGradient id="b2b" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a7f3d0"/>
          <stop offset="100%" stopColor="#059669"/>
        </linearGradient>
        <filter id="b2s"><feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#059669" floodOpacity="0.8"/></filter>
      </defs>
      <polygon points="50,8 85,28 85,72 50,92 15,72 15,28" fill="url(#b2a)" filter="url(#b2s)"/>
      <polygon points="50,14 79,31 79,69 50,86 21,69 21,31" fill="rgba(255,255,255,0.08)" stroke="rgba(110,231,183,0.5)" strokeWidth="1.5"/>
      <rect x="47" y="18" width="6" height="45" rx="3" fill="url(#b2b)"/>
      <rect x="47" y="18" width="6" height="45" rx="3" fill="rgba(255,255,255,0.3)"/>
      <rect x="34" y="55" width="32" height="7" rx="3.5" fill="#34d399"/>
      <rect x="34" y="55" width="32" height="3" rx="1.5" fill="rgba(255,255,255,0.4)"/>
      <rect x="46" y="62" width="8" height="16" rx="4" fill="#065f46"/>
      <rect x="46" y="62" width="8" height="6" rx="3" fill="rgba(255,255,255,0.2)"/>
      <polygon points="50,14 47,22 53,22" fill="#a7f3d0"/>
      <ellipse cx="44" cy="30" rx="3" ry="10" fill="rgba(255,255,255,0.35)" transform="rotate(-10,44,30)"/>
    </svg>
  );

  if (l === 3) return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 0 16px rgba(244,114,182,0.95)) drop-shadow(0 4px 8px rgba(0,0,0,0.8))` }}>
      <defs>
        <radialGradient id="b3a" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fbcfe8"/>
          <stop offset="50%" stopColor="#ec4899"/>
          <stop offset="100%" stopColor="#9d174d"/>
        </radialGradient>
        <linearGradient id="b3b" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fce7f3"/>
          <stop offset="100%" stopColor="#db2777"/>
        </linearGradient>
        <filter id="b3s"><feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#db2777" floodOpacity="0.9"/></filter>
      </defs>
      <circle cx="50" cy="50" r="42" fill="url(#b3a)" filter="url(#b3s)"/>
      <circle cx="50" cy="50" r="38" fill="rgba(255,255,255,0.06)" stroke="rgba(251,207,232,0.5)" strokeWidth="1.5"/>
      <ellipse cx="50" cy="32" rx="10" ry="14" fill="#f472b6" opacity="0.9"/>
      <ellipse cx="50" cy="32" rx="10" ry="14" fill="rgba(255,255,255,0.2)"/>
      <ellipse cx="36" cy="40" rx="10" ry="14" fill="#ec4899" opacity="0.9" transform="rotate(-45,36,40)"/>
      <ellipse cx="64" cy="40" rx="10" ry="14" fill="#ec4899" opacity="0.9" transform="rotate(45,64,40)"/>
      <ellipse cx="32" cy="54" rx="10" ry="14" fill="#f472b6" opacity="0.8" transform="rotate(-70,32,54)"/>
      <ellipse cx="68" cy="54" rx="10" ry="14" fill="#f472b6" opacity="0.8" transform="rotate(70,68,54)"/>
      <circle cx="50" cy="48" r="12" fill="url(#b3b)"/>
      <circle cx="50" cy="48" r="8" fill="#fce7f3"/>
      <circle cx="50" cy="48" r="5" fill="#db2777"/>
      <circle cx="50" cy="48" r="2" fill="#fce7f3"/>
      <ellipse cx="42" cy="36" rx="6" ry="4" fill="rgba(255,255,255,0.4)" transform="rotate(-30,42,36)"/>
    </svg>
  );

  if (l === 4) return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 0 18px rgba(167,139,250,1)) drop-shadow(0 4px 10px rgba(0,0,0,0.9))` }}>
      <defs>
        <linearGradient id="b4a" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c4b5fd"/>
          <stop offset="50%" stopColor="#7c3aed"/>
          <stop offset="100%" stopColor="#4c1d95"/>
        </linearGradient>
        <linearGradient id="b4b" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ede9fe"/>
          <stop offset="100%" stopColor="#6d28d9"/>
        </linearGradient>
        <filter id="b4s"><feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#7c3aed" floodOpacity="0.9"/></filter>
      </defs>
      <path d="M15 65 L15 40 L30 55 L50 20 L70 55 L85 40 L85 65 Z" fill="url(#b4a)" filter="url(#b4s)"/>
      <path d="M15 65 L85 65 L80 75 L20 75 Z" fill="#4c1d95"/>
      <path d="M15 65 L85 65 L80 75 L20 75 Z" fill="rgba(196,181,253,0.3)"/>
      <circle cx="50" cy="20" r="7" fill="#a78bfa"/>
      <circle cx="50" cy="20" r="5" fill="#ede9fe"/>
      <circle cx="50" cy="20" r="3" fill="#7c3aed"/>
      <circle cx="15" cy="40" r="5" fill="#a78bfa"/>
      <circle cx="15" cy="40" r="3" fill="#ede9fe"/>
      <circle cx="85" cy="40" r="5" fill="#a78bfa"/>
      <circle cx="85" cy="40" r="3" fill="#ede9fe"/>
      <circle cx="35" cy="68" r="4" fill="#c4b5fd"/>
      <circle cx="50" cy="68" r="5" fill="#a78bfa"/>
      <circle cx="50" cy="68" r="3" fill="#ede9fe"/>
      <circle cx="65" cy="68" r="4" fill="#c4b5fd"/>
      <path d="M20 45 L25 42 L22 55" fill="rgba(255,255,255,0.25)"/>
      <ellipse cx="38" cy="35" rx="5" ry="3" fill="rgba(255,255,255,0.3)" transform="rotate(-20,38,35)"/>
    </svg>
  );

  if (l === 5) return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 0 20px rgba(251,191,36,1)) drop-shadow(0 4px 12px rgba(0,0,0,0.9))` }}>
      <defs>
        <linearGradient id="b5a" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde68a"/>
          <stop offset="40%" stopColor="#f59e0b"/>
          <stop offset="100%" stopColor="#92400e"/>
        </linearGradient>
        <linearGradient id="b5b" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7"/>
          <stop offset="100%" stopColor="#d97706"/>
        </linearGradient>
        <filter id="b5s"><feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#f59e0b" floodOpacity="1"/></filter>
      </defs>
      <polygon points="50,8 61,35 90,35 67,54 76,82 50,65 24,82 33,54 10,35 39,35" fill="url(#b5a)" filter="url(#b5s)"/>
      <polygon points="50,14 59,37 86,37 65,54 73,78 50,63 27,78 35,54 14,37 41,37" fill="rgba(255,255,255,0.1)" stroke="rgba(253,230,138,0.6)" strokeWidth="1"/>
      <rect x="47" y="30" width="6" height="38" rx="3" fill="url(#b5b)"/>
      <path d="M38 30 L38 42 Q38 48 44 48 L44 30 Z" fill="#fbbf24"/>
      <path d="M62 30 L62 42 Q62 48 56 48 L56 30 Z" fill="#fbbf24"/>
      <path d="M38 30 L38 42 Q38 48 44 48 L44 30 Z" fill="rgba(255,255,255,0.3)"/>
      <path d="M62 30 L62 42 Q62 48 56 48 L56 30 Z" fill="rgba(255,255,255,0.3)"/>
      <circle cx="50" cy="52" r="7" fill="#fde68a"/>
      <circle cx="50" cy="52" r="5" fill="#fbbf24"/>
      <circle cx="50" cy="52" r="3" fill="#fef3c7"/>
      <ellipse cx="40" cy="22" rx="5" ry="3" fill="rgba(255,255,255,0.4)" transform="rotate(-30,40,22)"/>
    </svg>
  );

  if (l === 6) return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 0 22px rgba(249,115,22,1)) drop-shadow(0 4px 12px rgba(0,0,0,0.9))` }}>
      <defs>
        <linearGradient id="b6a" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24"/>
          <stop offset="40%" stopColor="#f97316"/>
          <stop offset="100%" stopColor="#7c2d12"/>
        </linearGradient>
        <linearGradient id="b6b" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#dc2626"/>
          <stop offset="50%" stopColor="#f97316"/>
          <stop offset="100%" stopColor="#fbbf24"/>
        </linearGradient>
        <filter id="b6s"><feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#f97316" floodOpacity="1"/></filter>
      </defs>
      <path d="M12 68 L12 42 L28 58 L50 18 L72 58 L88 42 L88 68 Z" fill="url(#b6a)" filter="url(#b6s)"/>
      <path d="M12 68 L88 68 L83 78 L17 78 Z" fill="#7c2d12"/>
      <path d="M12 68 L88 68 L83 78 L17 78 Z" fill="rgba(251,191,36,0.25)"/>
      <path d="M50 8 Q44 14 46 22 Q40 16 42 26 Q36 20 40 32 L50 18 L60 32 Q64 20 58 26 Q60 16 54 22 Q56 14 50 8Z" fill="url(#b6b)" opacity="0.9"/>
      <path d="M28 48 Q22 52 24 60 Q18 54 22 64 L28 58 Z" fill="url(#b6b)" opacity="0.8"/>
      <path d="M72 48 Q78 52 76 60 Q82 54 78 64 L72 58 Z" fill="url(#b6b)" opacity="0.8"/>
      <circle cx="50" cy="18" r="7" fill="#fbbf24"/>
      <circle cx="50" cy="18" r="5" fill="#fef3c7"/>
      <circle cx="50" cy="18" r="3" fill="#f97316"/>
      <circle cx="12" cy="42" r="5" fill="#fb923c"/>
      <circle cx="88" cy="42" r="5" fill="#fb923c"/>
      <circle cx="50" cy="71" r="5" fill="#fbbf24"/>
      <circle cx="50" cy="71" r="3" fill="#fef3c7"/>
      <ellipse cx="36" cy="38" rx="5" ry="3" fill="rgba(255,255,255,0.35)" transform="rotate(-25,36,38)"/>
    </svg>
  );

  if (l === 7) return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 0 25px rgba(255,215,0,1)) drop-shadow(0 0 50px rgba(255,140,0,0.6)) drop-shadow(0 4px 12px rgba(0,0,0,0.9))` }}>
      <defs>
        <linearGradient id="b7a" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7"/>
          <stop offset="30%" stopColor="#ffd700"/>
          <stop offset="60%" stopColor="#f59e0b"/>
          <stop offset="100%" stopColor="#78350f"/>
        </linearGradient>
        <linearGradient id="b7b" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff6347"/>
          <stop offset="50%" stopColor="#ffd700"/>
          <stop offset="100%" stopColor="#ff8c00"/>
        </linearGradient>
        <radialGradient id="b7c" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fef9c3"/>
          <stop offset="100%" stopColor="#d97706"/>
        </radialGradient>
        <filter id="b7s"><feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#ffd700" floodOpacity="1"/></filter>
      </defs>
      <circle cx="50" cy="50" r="44" fill="none" stroke="url(#b7b)" strokeWidth="3" opacity="0.7"/>
      <path d="M10 70 L10 40 L26 58 L50 12 L74 58 L90 40 L90 70 Z" fill="url(#b7a)" filter="url(#b7s)"/>
      <path d="M10 70 L90 70 L85 80 L15 80 Z" fill="#78350f"/>
      <path d="M10 70 L90 70 L85 80 L15 80 Z" fill="rgba(255,215,0,0.3)"/>
      <path d="M50 12 L52 6 L50 2 L48 6 Z" fill="#ffd700"/>
      <path d="M50 12 L56 8 L58 4 L52 6 Z" fill="#ffd700" opacity="0.7"/>
      <path d="M50 12 L44 8 L42 4 L48 6 Z" fill="#ffd700" opacity="0.7"/>
      <path d="M50 4 Q45 10 47 18 Q41 12 44 22 L50 12 L56 22 Q59 12 53 18 Q55 10 50 4Z" fill="url(#b7b)" opacity="0.95"/>
      <path d="M26 48 Q20 53 22 62 Q16 56 20 66 L26 58 Z" fill="url(#b7b)" opacity="0.85"/>
      <path d="M74 48 Q80 53 78 62 Q84 56 80 66 L74 58 Z" fill="url(#b7b)" opacity="0.85"/>
      <circle cx="50" cy="12" r="9" fill="url(#b7c)"/>
      <circle cx="50" cy="12" r="6" fill="#fef9c3"/>
      <circle cx="50" cy="12" r="4" fill="#ffd700"/>
      <circle cx="50" cy="12" r="2" fill="white"/>
      <circle cx="10" cy="40" r="6" fill="#fbbf24"/>
      <circle cx="10" cy="40" r="4" fill="#fef3c7"/>
      <circle cx="90" cy="40" r="6" fill="#fbbf24"/>
      <circle cx="90" cy="40" r="4" fill="#fef3c7"/>
      <circle cx="30" cy="73" r="4" fill="#fbbf24"/>
      <circle cx="50" cy="73" r="6" fill="#ffd700"/>
      <circle cx="50" cy="73" r="4" fill="#fef9c3"/>
      <circle cx="70" cy="73" r="4" fill="#fbbf24"/>
      <ellipse cx="34" cy="36" rx="6" ry="4" fill="rgba(255,255,255,0.45)" transform="rotate(-25,34,36)"/>
      <ellipse cx="50" cy="55" rx="15" ry="4" fill="rgba(255,255,255,0.1)"/>
    </svg>
  );

  if (l === 8) return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 0 25px rgba(240,171,252,1)) drop-shadow(0 0 50px rgba(192,38,211,0.6)) drop-shadow(0 4px 12px rgba(0,0,0,0.9))` }}>
      <defs>
        <linearGradient id="b8a" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fae8ff"/>
          <stop offset="30%" stopColor="#e879f9"/>
          <stop offset="60%" stopColor="#a21caf"/>
          <stop offset="100%" stopColor="#4a044e"/>
        </linearGradient>
        <linearGradient id="b8b" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#c026d3"/>
          <stop offset="50%" stopColor="#f0abfc"/>
          <stop offset="100%" stopColor="#e879f9"/>
        </linearGradient>
        <radialGradient id="b8c" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fdf4ff"/>
          <stop offset="100%" stopColor="#c026d3"/>
        </radialGradient>
        <filter id="b8s"><feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#e879f9" floodOpacity="1"/></filter>
      </defs>
      <circle cx="50" cy="50" r="44" fill="none" stroke="url(#b8b)" strokeWidth="3" opacity="0.7"/>
      <path d="M10 70 L10 40 L26 58 L50 12 L74 58 L90 40 L90 70 Z" fill="url(#b8a)" filter="url(#b8s)"/>
      <path d="M10 70 L90 70 L85 80 L15 80 Z" fill="#4a044e"/>
      <path d="M10 70 L90 70 L85 80 L15 80 Z" fill="rgba(240,171,252,0.3)"/>
      <circle cx="50" cy="12" r="9" fill="#e879f9"/>
      <circle cx="50" cy="12" r="6" fill="#fdf4ff"/>
      <circle cx="50" cy="12" r="4" fill="#c026d3"/>
      <circle cx="50" cy="12" r="2" fill="white"/>
      <ellipse cx="50" cy="4" rx="3" ry="5" fill="#f0abfc" opacity="0.9"/>
      <ellipse cx="57" cy="7" rx="3" ry="5" fill="#f0abfc" opacity="0.9" transform="rotate(45,57,7)"/>
      <ellipse cx="43" cy="7" rx="3" ry="5" fill="#f0abfc" opacity="0.9" transform="rotate(-45,43,7)"/>
      <ellipse cx="58" cy="14" rx="3" ry="5" fill="#f0abfc" opacity="0.8" transform="rotate(90,58,14)"/>
      <ellipse cx="42" cy="14" rx="3" ry="5" fill="#f0abfc" opacity="0.8" transform="rotate(90,42,14)"/>
      <circle cx="10" cy="40" r="6" fill="#e879f9"/>
      <circle cx="10" cy="40" r="4" fill="#fdf4ff"/>
      <circle cx="90" cy="40" r="6" fill="#e879f9"/>
      <circle cx="90" cy="40" r="4" fill="#fdf4ff"/>
      <circle cx="30" cy="73" r="4" fill="#e879f9"/>
      <circle cx="50" cy="73" r="6" fill="#c026d3"/>
      <circle cx="50" cy="73" r="4" fill="#fdf4ff"/>
      <circle cx="70" cy="73" r="4" fill="#e879f9"/>
      <path d="M26 48 Q20 53 22 62 Q16 56 20 66 L26 58 Z" fill="url(#b8b)" opacity="0.85"/>
      <path d="M74 48 Q80 53 78 62 Q84 56 80 66 L74 58 Z" fill="url(#b8b)" opacity="0.85"/>
      <ellipse cx="34" cy="36" rx="6" ry="4" fill="rgba(255,255,255,0.45)" transform="rotate(-25,34,36)"/>
    </svg>
  );

  return <span style={{ fontSize: size * 0.5 }}>{rank.icon}</span>;
}

export function RankName({ rank, size = "base" }: { rank: any; size?: "sm" | "base" | "lg" | "xl" }) {
  const sizeClass = size === "xl" ? "text-3xl" : size === "lg" ? "text-2xl" : size === "sm" ? "text-xs" : "text-base";
  const l = rank.level;
  if (l === 8) return (
    <span className={`font-black ${sizeClass}`} style={{
      background: "linear-gradient(90deg,#c026d3,#e879f9,#f0abfc,#e879f9,#c026d3)",
      backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      backgroundClip: "text", animation: "emperor-flow 2s linear infinite",
      filter: "drop-shadow(0 0 8px rgba(240,171,252,0.9))",
    }}>{rank.nameAr}</span>
  );
  if (l === 7) return (
    <span className={`font-black ${sizeClass}`} style={{
      background: "linear-gradient(90deg,#ff8c00,#ffd700,#ff6347,#ffd700,#ff8c00)",
      backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      backgroundClip: "text", animation: "emperor-flow 2s linear infinite",
      filter: "drop-shadow(0 0 8px rgba(255,215,0,0.8))",
    }}>{rank.nameAr}</span>
  );
  if (l === 6) return (
    <span className={`font-black ${sizeClass}`} style={{
      background: "linear-gradient(90deg,#ea580c,#f97316,#fbbf24,#f97316,#ea580c)",
      backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      backgroundClip: "text", animation: "emperor-flow 2.5s linear infinite",
      filter: "drop-shadow(0 0 6px rgba(249,115,22,0.8))",
    }}>{rank.nameAr}</span>
  );
  if (l >= 4) return (
    <span className={`font-black ${sizeClass}`} style={{
      background: rank.gradient, backgroundSize: "200% auto",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      backgroundClip: "text", animation: "shimmer-flow 3s linear infinite",
      filter: `drop-shadow(0 0 6px ${rank.glowColor})`,
    }}>{rank.nameAr}</span>
  );
  return (
    <span className={`font-black ${sizeClass}`} style={{
      background: rank.gradient, WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent", backgroundClip: "text",
      filter: `drop-shadow(0 0 4px ${rank.glowColor})`,
    }}>{rank.nameAr}</span>
  );
}
