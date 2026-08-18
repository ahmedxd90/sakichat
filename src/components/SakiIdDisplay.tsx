// @ts-nocheck
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "../lib/toast";

// ── Gradient presets ──────────────────────────────────────────────────────
export const SAKI_GRADIENTS: Record<string, { colors: string[]; label: string }> = {
  gold:    { colors: ["#FFD700", "#FFA500", "#FFD700"], label: "ذهبي" },
  rainbow: { colors: ["#ff0080", "#ff8c00", "#40e0d0", "#8a2be2"], label: "قوس قزح" },
  fire:    { colors: ["#ff4500", "#ff8c00", "#ffd700"], label: "ناري" },
  ocean:   { colors: ["#00bfff", "#1e90ff", "#00ced1"], label: "محيطي" },
  purple:  { colors: ["#9b59b6", "#e91e8c", "#c0392b"], label: "بنفسجي" },
  green:   { colors: ["#00ff87", "#60efff", "#00b4d8"], label: "زمردي" },
  silver:  { colors: ["#c0c0c0", "#e8e8e8", "#a0a0a0"], label: "فضي" },
  rose:    { colors: ["#ff6b9d", "#ff8e53", "#fe3752"], label: "وردي" },
};

function getGradientStyle(
  gradient?: string | null,
  color1?: string | null,
  color2?: string | null
): string {
  if (gradient === "custom" && color1 && color2) {
    return `linear-gradient(90deg, ${color1}, ${color2}, ${color1})`;
  }
  if (gradient && SAKI_GRADIENTS[gradient]) {
    const cols = SAKI_GRADIENTS[gradient].colors;
    return `linear-gradient(90deg, ${cols.join(", ")}, ${cols[0]})`;
  }
  return "";
}

// ── Default ID icon (SVG) ─────────────────────────────────────────────────
function DefaultIdIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="idGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="50%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
      <rect x="2" y="5" width="20" height="14" rx="3" fill="url(#idGrad)" opacity="0.9" />
      <rect x="4" y="8" width="6" height="5" rx="1" fill="white" opacity="0.9" />
      <rect x="12" y="9" width="7" height="1.5" rx="0.75" fill="white" opacity="0.8" />
      <rect x="12" y="12" width="5" height="1.5" rx="0.75" fill="white" opacity="0.6" />
    </svg>
  );
}

// ── Main SakiIdDisplay component ──────────────────────────────────────────
interface SakiIdDisplayProps {
  sakiId: string | number;
  profile?: {
    sakiIdIconUrl?: string | null;
    sakiIdGradient?: string | null;
    sakiIdCustomColor1?: string | null;
    sakiIdCustomColor2?: string | null;
  } | null;
  fontSize?: number;
  iconSize?: number;
  showCopy?: boolean;
  className?: string;
}

export default function SakiIdDisplay({
  sakiId,
  profile,
  fontSize = 11,
  iconSize = 14,
  showCopy = true,
  className = "",
}: SakiIdDisplayProps) {
  const [copied, setCopied] = useState(false);

  const gradientCss = getGradientStyle(
    profile?.sakiIdGradient,
    profile?.sakiIdCustomColor1,
    profile?.sakiIdCustomColor2
  );

  const hasStyle = !!gradientCss;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = String(sakiId);
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).catch(() => {});
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      style={{ cursor: showCopy ? "pointer" : "default" }}
      onClick={showCopy ? handleCopy : undefined}
    >
      {/* Icon */}
      {profile?.sakiIdIconUrl ? (
        <img
          src={profile.sakiIdIconUrl}
          alt="id-icon"
          style={{ width: iconSize, height: iconSize, objectFit: "contain", flexShrink: 0 }}
        />
      ) : (
        <DefaultIdIcon size={iconSize} />
      )}

      {/* ID text */}
      {hasStyle ? (
        <>
          <style>{`
            @keyframes sakiIdShimmer {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            .saki-id-animated {
              background-size: 200% auto;
              animation: sakiIdShimmer 2.5s ease infinite;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
          `}</style>
          <span
            className="saki-id-animated font-mono font-bold"
            style={{
              fontSize,
              backgroundImage: gradientCss,
            }}
          >
            #{sakiId}
          </span>
        </>
      ) : (
        <span
          className="font-mono"
          style={{ fontSize, color: "rgba(255,255,255,0.65)" }}
        >
          #{sakiId}
        </span>
      )}

      {/* Copy indicator */}
      {showCopy && (
        copied ? (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        )
      )}
    </span>
  );
}

// ── Hook to get saki id style ─────────────────────────────────────────────
export function useSakiIdStyle(userId?: string | null) {
  const style = useQuery(
    api.sakiIdStyle.getSakiIdStyleByUserId,
    userId ? { userId: userId as any } : "skip"
  );
  return style;
}
