// @ts-nocheck
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import SVGADisplay from "./SVGADisplay";

interface CustomBadgeCardProps {
  badge: {
    _id: string;
    name: string;
    description?: string;
    imageUrl?: string | null;
    svgaUrl?: string | null;
    mediaType?: string;
    glowColor?: string;
    bgColor?: string;
    textColor?: string;
  };
  size?: "sm" | "md" | "lg";
}

export function CustomBadgeCard({ badge, size = "md" }: CustomBadgeCardProps) {
  const glow = badge.glowColor || "#a855f7";
  const bg = badge.bgColor || "rgba(168,85,247,0.2)";
  const text = badge.textColor || "#e9d5ff";
  const isLg = size === "lg";
  const isSm = size === "sm";
  const imgSize = isLg ? 44 : isSm ? 24 : 36;
  const pad = isLg ? "20px 12px" : isSm ? "10px 8px" : "14px 10px";

  const isSvga = badge.mediaType === "svga" || !!badge.svgaUrl;
  const svgaUrl = badge.svgaUrl;

  return (
    <div
      className="relative rounded-2xl flex flex-col items-center overflow-hidden transition-all active:scale-95"
      style={{
        background: bg,
        border: `1px solid ${glow}50`,
        boxShadow: `0 0 ${isLg ? 25 : 15}px ${glow}30, inset 0 1px 0 rgba(255,255,255,0.08)`,
        padding: pad,
        gap: isLg ? 10 : 6,
      }}
    >
      {/* Shimmer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)",
          backgroundSize: "200% 100%",
          animation: "badge-shimmer 2.5s ease-in-out infinite",
        }}
      />

      {/* Media: SVGA or Image */}
      <div style={{ filter: `drop-shadow(0 0 ${isLg ? 10 : 6}px ${glow})` }}>
        {isSvga && svgaUrl ? (
          <SVGADisplay
            src={svgaUrl}
            width={imgSize}
            height={imgSize}
            loop={true}
            forceSvga={true}
            style={{ borderRadius: 6 }}
          />
        ) : badge.imageUrl ? (
          <img
            src={badge.imageUrl}
            alt={badge.name}
            style={{ width: imgSize, height: imgSize, objectFit: "contain" }}
          />
        ) : (
          <div
            style={{
              width: imgSize, height: imgSize,
              borderRadius: 8,
              background: `${glow}20`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: imgSize * 0.6,
            }}
          >🏅</div>
        )}
      </div>

      {/* Text */}
      <div className="text-center">
        <div
          className="font-black leading-tight"
          style={{
            fontSize: isLg ? 13 : isSm ? 9 : 11,
            color: text,
            textShadow: `0 0 8px ${glow}`,
          }}
        >
          {badge.name}
        </div>
        {badge.description && (
          <div
            className="leading-tight mt-0.5"
            style={{
              fontSize: isLg ? 10 : isSm ? 7 : 9,
              color: `${text}80`,
            }}
          >
            {badge.description}
          </div>
        )}
        {isSvga && (
          <div className="mt-0.5" style={{ fontSize: isSm ? 7 : 8, color: `${glow}cc` }}>✨ SVGA</div>
        )}
      </div>
    </div>
  );
}

// ── Hook to get user custom badges ────────────────────────────────────────
export function useUserCustomBadges(userId?: string | null) {
  const [badges, setBadges] = useState<any[]>([]);
  useEffect(() => {
    if (!userId) return;
    const fetchBadges = async () => {
      const { data } = await supabase.from('user_custom_badges').select('*, custom_badges(*)').eq('user_id', userId);
      setBadges(data?.map(d => d.custom_badges) || []);
    };
    fetchBadges();
  }, [userId]);
  return badges;
}

// ── Inline badge chip ─────────────────────────────────────────────────────
export function CustomBadgeChip({ badge }: { badge: any }) {
  const glow = badge.glowColor || "#a855f7";
  const bg = badge.bgColor || "rgba(168,85,247,0.2)";
  const text = badge.textColor || "#e9d5ff";
  const isSvga = badge.mediaType === "svga" || !!badge.svgaUrl;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: bg, border: `1px solid ${glow}40`, color: text, boxShadow: `0 0 6px ${glow}30` }}
    >
      {isSvga && badge.svgaUrl ? (
        <SVGADisplay src={badge.svgaUrl} width={12} height={12} loop={true} forceSvga={true} />
      ) : badge.imageUrl ? (
        <img src={badge.imageUrl} style={{ width: 12, height: 12, objectFit: "contain" }} />
      ) : null}
      {badge.name}
    </span>
  );
}
