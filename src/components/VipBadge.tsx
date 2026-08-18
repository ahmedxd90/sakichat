// @ts-nocheck
import React from "react";
import SVGADisplay from "./SVGADisplay";
import AdminTitleBadge from "./AdminTitleBadge";
export { AristocracyName, AristocracyBadge, getAristocracyConfig, getAristocracyChatBubbleStyle } from "./AristocracyBadge";

export const PRO1_BADGE_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663880508516/MbOLUMQIiNgrPZUy.png";
export const PRO2_BADGE_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663880508516/eFWeniGUWrZigXUD.png";
export const PRO3_BADGE_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663880508516/EbgsqPFpOeOdjyTs.png";
export const PRO4_BADGE_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663880508516/rzKXICCEIboqpTIo.png";
export const PRO5_BADGE_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663880508516/OzJlHyrhBOyiYwPC.png";

export const PRO1_FRAME_URL = "https://j.top4top.io/p_3750szhvw1.jpg";
export const SUPER_ADMIN_FRAME_URL = "https://h.top4top.io/p_3750wsw2o1.jpg";
export const SUPER_ADMIN_BADGE_URL = "https://c.top4top.io/p_375029up61.jpg";

export const PRO_FEATURES: Record<number, string[]> = {
  1: ["🏅 وسام PRO1 حقيقي", "🖼️ إطار صورة PRO1", "✏️ اسم برونزي ملون", "🎁 +50 عملة/يوم", "🙈 إخفاء الغرفة", "🔒 ملف خاص"],
  2: ["🖼️ إطار فضي لامع", "✏️ اسم فضي", "🎁 +100 عملة/يوم", "🙈 إخفاء الغرفة", "🔒 ملف خاص", "💬 فقاعة دردشة"],
  3: ["🏆 إطار ذهبي", "✏️ اسم ذهبي", "🎁 +200 عملة/يوم", "🚪 تأثير دخول", "💬 فقاعة مميزة", "📸 نشر لحظات"],
  4: ["💎 إطار بلاتيني", "✏️ اسم بلاتيني", "🎁 +400 عملة/يوم", "🚪 دخول مميز", "📢 أولوية الميكروفون", "🆔 معرف مخصص"],
  5: ["💠 إطار ماسي متوهج", "✏️ اسم ماسي لامع", "🎁 +700 عملة/يوم", "🚪 دخول ماسي", "📢 أولوية الميكروفون", "🔍 ظهور في البحث", "🎭 صورة GIF"],
  6: ["💚 إطار زمردي متحرك", "✏️ اسم زمردي shimmer", "🎁 +1000 عملة/يوم", "🚪 دخول زمردي", "📢 ميكروفون دائم", "🔍 ظهور مميز", "🎭 إيموجي حصري"],
  7: ["💖 إطار ياقوتي متحرك", "✏️ اسم ياقوتي shimmer", "🎁 +1500 عملة/يوم", "🚪 دخول ياقوتي", "📢 ميكروفون PRO", "🔍 أولوية البحث", "👑 شارة خاصة", "🛡️ حماية من الطرد"],
  8: ["👑 إطار ملكي دوار", "✏️ اسم ملكي shimmer", "🎁 +2000 عملة/يوم", "🚪 دخول ملكي", "📢 ميكروفون ملكي", "🔍 أولوية قصوى", "👑 تاج ملكي", "🌟 بث مميز"],
  9: ["🔥 إطار إمبراطوري + أجنحة", "✏️ اسم ناري shimmer", "🎁 +3000 عملة/يوم", "🚪 دخول ناري", "📢 ميكروفون إمبراطوري", "🛡️ حماية كاملة", "👑 تاج إمبراطوري", "🔓 دخول غرف مقفلة"],
  10: ["⭐ إطار أسطوري + أجنحة", "✏️ اسم أسطوري shimmer", "🎁 +5000 عملة/يوم", "🚪 دخول أسطوري", "📢 ميكروفون أسطوري", "🏆 لوحة الشرف", "🏠 غرفة PRO خاصة", "🔓 دخول أي غرفة"],
  11: ["✨ إطار خالد قوس قزح", "✏️ اسم سماوي rainbow", "🎁 +8000 عملة/يوم", "🚪 دخول سماوي", "📢 ميكروفون خالد", "🏆 لوحة الشرف", "🎪 غرفة PRO حصرية", "💫 تأثيرات سماوية"],
  12: ["🌟 إطار إلهي rainbow دوار", "✏️ اسم إلهي rainbow قوي", "🎁 +15000 عملة/يوم", "🚪 دخول إلهي", "📢 ميكروفون إلهي", "🏆 لوحة الشرف", "🎪 غرفة إلهية", "🔮 كل المميزات الحصرية"],
};

export const PRO_LEVELS = {
  1: { name: "PRO البرونزي", nameColor: "#ff8c42", frameGradient: "linear-gradient(135deg, #ff8c42, #ff6b35, #cd7f32)", glowColor: "rgba(255,140,66,0.6)", badge: "🏅", bgGradient: "linear-gradient(160deg, #1a0f00 0%, #2d1a00 30%, #1a0f00 60%, #ff8c4215 100%)", tier: "برونزي" },
  2: { name: "PRO الفضي", nameColor: "#e8e8e8", frameGradient: "linear-gradient(135deg, #e8e8e8, #c0c0c0, #a8a8a8)", glowColor: "rgba(232,232,232,0.7)", badge: "🥈", bgGradient: "linear-gradient(160deg, #0d0d0d 0%, #1a1a1a 30%, #0d0d0d 60%, #e8e8e815 100%)", tier: "فضي" },
  3: { name: "PRO الذهبي", nameColor: "#ffd700", frameGradient: "linear-gradient(135deg, #ffd700, #ffed4e, #ffa500)", glowColor: "rgba(255,215,0,0.8)", badge: "🥇", bgGradient: "linear-gradient(160deg, #1a1000 0%, #2d2000 30%, #1a1000 60%, #ffd70015 100%)", tier: "ذهبي" },
  4: { name: "PRO البلاتيني", nameColor: "#e5e4e2", frameGradient: "linear-gradient(135deg, #e5e4e2, #d4d4d4, #b8b8b8, #e5e4e2)", glowColor: "rgba(229,228,226,0.8)", badge: "💎", bgGradient: "linear-gradient(160deg, #0f0f0f 0%, #1f1f1f 30%, #0f0f0f 60%, #e5e4e215 100%)", tier: "بلاتيني" },
  5: { name: "PRO الماسي", nameColor: "#00d4ff", frameGradient: "linear-gradient(135deg, #b9f2ff, #00d4ff, #0099cc, #00d4ff)", glowColor: "rgba(0,212,255,0.9)", badge: "💠", bgGradient: "linear-gradient(160deg, #001a20 0%, #002d35 30%, #001a20 60%, #00d4ff15 100%)", tier: "ماسي" },
  6: { name: "PRO الزمردي", nameColor: "#50c878", frameGradient: "linear-gradient(135deg, #50c878, #3cb371, #2e8b57, #50c878)", glowColor: "rgba(80,200,120,0.9)", badge: "💚", bgGradient: "linear-gradient(160deg, #001a10 0%, #002d1a 30%, #001a10 60%, #50c87815 100%)", tier: "زمردي" },
  7: { name: "PRO الياقوتي", nameColor: "#ff1493", frameGradient: "linear-gradient(135deg, #ff1493, #e0115f, #c71585, #ff1493)", glowColor: "rgba(255,20,147,0.9)", badge: "💖", bgGradient: "linear-gradient(160deg, #1a0010 0%, #2d001a 30%, #1a0010 60%, #ff149315 100%)", tier: "ياقوتي" },
  8: { name: "PRO الملكي", nameColor: "#9370db", frameGradient: "linear-gradient(135deg, #9370db, #8a2be2, #4b0082, #9370db)", glowColor: "rgba(147,112,219,1)", badge: "👑", bgGradient: "linear-gradient(160deg, #0d0020 0%, #1a0035 30%, #0d0020 60%, #9370db15 100%)", tier: "ملكي" },
  9: { name: "PRO الإمبراطوري", nameColor: "#ff4500", frameGradient: "linear-gradient(135deg, #ff6347, #ff4500, #dc143c, #ff6347)", glowColor: "rgba(255,69,0,1)", badge: "🔥", bgGradient: "linear-gradient(160deg, #1a0500 0%, #2d0a00 30%, #1a0500 60%, #ff450015 100%)", tier: "إمبراطوري" },
  10: { name: "PRO الأسطوري", nameColor: "#ffa500", frameGradient: "linear-gradient(135deg, #ffa500, #ff8c00, #ff7f50, #ffa500)", glowColor: "rgba(255,165,0,1)", badge: "⭐", bgGradient: "linear-gradient(160deg, #1a0f00 0%, #2d1a00 30%, #1a0f00 60%, #ffa50015 100%)", tier: "أسطوري" },
  11: { name: "PRO الخالد", nameColor: "#00ffff", frameGradient: "linear-gradient(135deg, #00ffff, #00ced1, #20b2aa, #00ffff)", glowColor: "rgba(0,255,255,1)", badge: "✨", bgGradient: "linear-gradient(160deg, #001a1a 0%, #002d2d 30%, #001a1a 60%, #00ffff15 100%)", tier: "خالد" },
  12: { name: "PRO الإلهي", nameColor: "#ffffff", frameGradient: "linear-gradient(135deg, #ffd700, #ff69b4, #00ffff, #ff1493, #ffd700)", glowColor: "rgba(255,255,255,1)", badge: "🌟", bgGradient: "linear-gradient(160deg, #1a001a 0%, #2d0035 30%, #1a001a 60%, #ffffff15 100%)", tier: "إلهي" },
};

export const PRO_DAILY_REWARDS: Record<number, number> = {
  1: 50, 2: 100, 3: 200, 4: 400, 5: 700,
  6: 1000, 7: 1500, 8: 2000, 9: 3000, 10: 5000,
  11: 8000, 12: 15000,
};

// Compatibility exports for legacy internal imports; visible labels are PRO.
export const VIP1_BADGE_URL = PRO1_BADGE_URL;
export const VIP1_FRAME_URL = PRO1_FRAME_URL;
export const VIP_FEATURES = PRO_FEATURES;
export const VIP_LEVELS = PRO_LEVELS;
export const VIP_DAILY_REWARDS = PRO_DAILY_REWARDS;

export function getVipConfig(level?: number | null) {
  if (!level || level < 1 || level > 12) return null;
  return PRO_LEVELS[level as keyof typeof PRO_LEVELS];
}

export function getVipChatBubbleStyle(level?: number | null, chatBubbleUrl?: string | null) {
  if (chatBubbleUrl) {
    return {
      backgroundImage: `url(${chatBubbleUrl})`,
      backgroundSize: "100% 100%",
      backgroundRepeat: "no-repeat",
      border: "none",
    };
  }
  const config = getVipConfig(level);
  if (!config) return { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" };
  return {
    background: `linear-gradient(135deg, ${config.nameColor}15, ${config.nameColor}08)`,
    border: `1px solid ${config.nameColor}40`,
    boxShadow: `0 0 10px ${config.glowColor}`,
  };
}

export function VipName({ name, level, children, vipConfig }: { name?: string; level?: number | null; children?: React.ReactNode; vipConfig?: any }) {
  const config = getVipConfig(level);
  const displayName = name || children;
  const nameColor = vipConfig?.nameColor ?? config?.nameColor;
  const hasShiny = vipConfig?.hasShinyName ?? (level && level >= 6);

  if (!config && !vipConfig) return <span className="text-gray-300">{displayName}</span>;

  if (level && level >= 1 && level <= 5) {
    return (
      <span className={`pro-name-anim-${level}`}>
        {displayName}
      </span>
    );
  }

  if (hasShiny && nameColor) {
    return (
      <span className="font-black" style={{
        background: `linear-gradient(90deg, ${nameColor}, ${nameColor}cc, ${nameColor})`,
        backgroundSize: "200% auto",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        animation: "vip-name-flow 2s linear infinite",
        filter: `drop-shadow(0 0 6px ${nameColor}80)`,
      }}>
        {displayName}
      </span>
    );
  }

  if (nameColor) {
    return (
      <span className="font-black" style={{ color: nameColor, filter: `drop-shadow(0 0 4px ${nameColor}60)` }}>
        {displayName}
      </span>
    );
  }

  return <span className="font-black text-gray-300">{displayName}</span>;
}

// ── لقب PRO - يدعم SVGA ──
export function VipTitle({ level, vipConfig, size = "sm" }: { level?: number | null; vipConfig?: any; size?: "sm" | "md" }) {
  const titleUrl = vipConfig?.titleUrl;
  const titleMediaType = vipConfig?.titleMediaType;
  const imgH = size === "sm" ? 14 : 18;
  const svgaSize = size === "sm" ? 28 : 36;

  if (titleUrl) {
    const isSvga = titleMediaType === "svga" || titleUrl?.toLowerCase().includes(".svga");
    if (isSvga) {
      return (
        <span style={{ display: "inline-block", verticalAlign: "middle", width: svgaSize, height: svgaSize }}>
          <SVGADisplay src={titleUrl} width={svgaSize} height={svgaSize} loop />
        </span>
      );
    }
    return (
      <img
        src={titleUrl}
        alt="لقب PRO"
        style={{ height: imgH, objectFit: "contain", display: "inline-block", verticalAlign: "middle" }}
      />
    );
  }

  const config = getVipConfig(level);
  if (!config) return null;
  const badgeUrl = vipConfig?.badgeUrl;
  const badgeMediaType = vipConfig?.badgeMediaType;
  if (badgeUrl) {
    const isSvga = badgeMediaType === "svga" || badgeUrl?.toLowerCase().includes(".svga");
    if (isSvga) {
      return (
        <span style={{ display: "inline-block", verticalAlign: "middle", width: svgaSize, height: svgaSize }}>
          <SVGADisplay src={badgeUrl} width={svgaSize} height={svgaSize} loop />
        </span>
      );
    }
    return (
      <img
        src={badgeUrl}
        alt={`PRO${level}`}
        style={{ height: imgH, objectFit: "contain", display: "inline-block", verticalAlign: "middle" }}
      />
    );
  }
  return <VipBadge level={level} size={size} />;
}

// ── وسام PRO - يدعم SVGA ──
export function VipBadge({ size = "sm", level, vipConfig }: { size?: "sm" | "md" | "lg"; level?: number | null; vipConfig?: any }) {
  const config = getVipConfig(level);
  const sizes = { sm: "text-xs px-1.5 py-0.5", md: "text-sm px-2 py-1", lg: "text-base px-3 py-1.5" };
  const imgSize = size === "sm" ? 16 : size === "md" ? 22 : 28;

  const badgeUrl = vipConfig?.badgeUrl;
  const badgeMediaType = vipConfig?.badgeMediaType;

  if (badgeUrl) {
    const nameColor = vipConfig?.nameColor ?? config?.nameColor ?? "#fbbf24";
    const isSvga = badgeMediaType === "svga" || badgeUrl?.toLowerCase().includes(".svga");
    return (
      <span className={`inline-flex items-center gap-1 rounded-full font-black ${sizes[size]}`}
        style={{ background: `${nameColor}20`, border: `1px solid ${nameColor}50`, color: nameColor, boxShadow: `0 0 10px ${nameColor}40` }}>
        {isSvga ? (
          <SVGADisplay src={badgeUrl} width={imgSize} height={imgSize} loop style={{ flexShrink: 0 }} />
        ) : (
          <img src={badgeUrl} alt={`PRO${level}`} style={{ width: imgSize, height: imgSize, objectFit: "contain", flexShrink: 0 }} />
        )}
        PRO
      </span>
    );
  }

  if (!config) {
    return (
      <span className={`inline-flex items-center gap-0.5 rounded-full font-black text-white ${sizes[size]}`}
        style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)", boxShadow: "0 0 15px rgba(251,191,36,0.5)" }}>
        👑 PRO
      </span>
    );
  }
  if (level && level >= 1 && level <= 5) {
    const proBadgeUrl = [null, PRO1_BADGE_URL, PRO2_BADGE_URL, PRO3_BADGE_URL, PRO4_BADGE_URL, PRO5_BADGE_URL][level];
    return (
      <span className={`inline-flex items-center gap-1 rounded-full font-black ${sizes[size]}`}
        style={{ background: config.frameGradient, color: "#000", boxShadow: `0 0 15px ${config.glowColor}`, animation: "vip-pulse 2s ease-in-out infinite", padding: size === "sm" ? "2px 6px 2px 2px" : "3px 8px 3px 3px" }}>
        <img src={proBadgeUrl} alt={`PRO${level}`} style={{ width: imgSize, height: imgSize, objectFit: "contain", background: "transparent", flexShrink: 0 }} />
        PRO
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full font-black ${sizes[size]}`}
      style={{ background: config.frameGradient, color: "#000", boxShadow: `0 0 15px ${config.glowColor}`, animation: level && level >= 11 ? "vip-badge-rainbow 2s linear infinite" : "vip-pulse 2s ease-in-out infinite" }}>
      PRO
    </span>
  );
}

// ── Super Admin Badge ──
export function SuperAdminBadge({ size = "sm", title = "سوبر أدمن", badgeUrl, adminTitle, adminTitleColor1, adminTitleColor2, adminTitleIconUrl, adminTitleBg }: { size?: "sm" | "md" | "lg"; title?: string; badgeUrl?: string; adminTitle?: string; adminTitleColor1?: string; adminTitleColor2?: string; adminTitleIconUrl?: string; adminTitleBg?: string; }) {
  if (adminTitle) { const s = size === "lg" ? "md" : size === "md" ? "sm" : "xs"; return <AdminTitleBadge title={adminTitle} color1={adminTitleColor1} color2={adminTitleColor2} iconUrl={adminTitleIconUrl} bgPresetId={adminTitleBg} size={s as any} />; }
  const imgSize = size === "sm" ? 16 : size === "md" ? 22 : 28;
  const pad = size === "sm" ? "2px 6px 2px 2px" : "3px 8px 3px 3px";
  const fs = size === "sm" ? "11px" : size === "md" ? "13px" : "15px";
  const src = badgeUrl || SUPER_ADMIN_BADGE_URL;
  return (
    <span className="inline-flex items-center gap-1 rounded-full font-black relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#1a0a00,#2d1500,#1a0a00)", border: "1px solid rgba(255,215,0,0.5)", boxShadow: "0 0 14px rgba(255,140,0,0.5)", animation: "vip-pulse 2s ease-in-out infinite", padding: pad, fontSize: fs }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(105deg,transparent 40%,rgba(255,215,0,0.15) 50%,transparent 60%)", backgroundSize: "200% 100%", animation: "sa-shim-b 2s ease-in-out infinite" }} />
      <img src={src} alt="" style={{ width: imgSize, height: imgSize, objectFit: "contain", flexShrink: 0, borderRadius: "50%", position: "relative", zIndex: 1 }} />
      <span style={{ background: "linear-gradient(90deg,#ffd700,#ff8c00,#ffd700,#ff4500,#ffd700)", backgroundSize: "300% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "sa-gold-b 2s linear infinite", fontWeight: 900, position: "relative", zIndex: 1 }}>{title}</span>
      <style>{`@keyframes sa-gold-b{0%{background-position:0% center}100%{background-position:300% center}}@keyframes sa-shim-b{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </span>
  );
}

// ── PRO Frame overlay around an avatar ──
export function VipFrame({ frameUrl, size = 72, children }: { frameUrl?: string | null; size?: number; children?: React.ReactNode }) {
  if (!frameUrl) return <>{children}</>;
  return (
    <div style={{ position: "relative", width: size, height: size, display: "inline-block" }}>
      {children}
      <img
        src={frameUrl}
        alt="إطار PRO"
        style={{
          position: "absolute", top: 0, left: 0,
          width: size, height: size, zIndex: 10,
          objectFit: "contain", pointerEvents: "none",
        }}
      />
    </div>
  );
}

export function VipAvatarLabel({ level, size = "sm", vipConfig }: { level?: number | null; size?: "sm" | "md"; vipConfig?: any }) {
  const config = getVipConfig(level);
  if (!config && !vipConfig) return null;
  const nameColor = vipConfig?.nameColor ?? config?.nameColor ?? "#fbbf24";
  const badgeUrl = vipConfig?.badgeUrl;
  const badgeMediaType = vipConfig?.badgeMediaType;
  const imgSize = size === "sm" ? 14 : 18;

  if (badgeUrl) {
    const isSvga = badgeMediaType === "svga" || badgeUrl?.toLowerCase().includes(".svga");
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5"
        style={{ background: `${nameColor}20`, border: `1px solid ${nameColor}40` }}>
        {isSvga ? (
          <SVGADisplay src={badgeUrl} width={imgSize} height={imgSize} loop />
        ) : (
          <img src={badgeUrl} alt="" style={{ width: imgSize, height: imgSize, objectFit: "contain" }} />
        )}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-black"
      style={{ background: `${nameColor}20`, border: `1px solid ${nameColor}40`, color: nameColor }}>
      PRO
    </span>
  );
}

// ── ألقاب PRO الاحترافية ──
export function ProTitle({ level, size = "sm" }: { level?: number | null; size?: "sm" | "md" | "lg" }) {
  if (!level || level < 1 || level > 5) return null;
  
  const titles = [
    null,
    { name: "PRO", color: "#cd7f32", icon: PRO1_BADGE_URL },
    { name: "PRO", color: "#c0c0c0", icon: PRO2_BADGE_URL },
    { name: "PRO", color: "#ffd700", icon: PRO3_BADGE_URL },
    { name: "PRO", color: "#b9f2ff", icon: PRO4_BADGE_URL },
    { name: "PRO", color: "#f59e0b", icon: PRO5_BADGE_URL },
  ];
  
  const title = titles[level];
  if (!title) return null;
  
  const sizes = {
    sm: "h-5 px-2 text-[9px]",
    md: "h-6 px-3 text-[11px]",
    lg: "h-8 px-4 text-[13px]"
  };
  
  const iconSizes = { sm: 12, md: 16, lg: 20 };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-lg border font-black shadow-sm ${sizes[size]}`}
      style={{ 
        background: `linear-gradient(135deg, ${title.color}20, ${title.color}10)`, 
        borderColor: `${title.color}40`,
        color: title.color,
        boxShadow: `0 0 10px ${title.color}20`
      }}>
      <img src={title.icon} alt="" style={{ width: iconSizes[size], height: iconSizes[size], objectFit: "contain" }} />
      <span>{title.name}</span>
    </div>
  );
}
