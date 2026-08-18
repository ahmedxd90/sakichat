// @ts-nocheck
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { getVipConfig, VIP_LEVELS, VIP_DAILY_REWARDS } from "../components/VipBadge";

interface VipFeaturesPageProps { onBack: () => void; }

function VipNamePreview({ name, level }: { name: string; level: number }) {
  const cfg = getVipConfig(level);
  if (!cfg) return <span className="text-white font-black text-lg">{name}</span>;
  if (level <= 5) {
    return (
      <span className="font-black text-lg" style={{
        background: cfg.frameGradient, WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent", backgroundClip: "text",
        filter: `drop-shadow(0 0 6px ${cfg.glowColor})`,
      }}>{name}</span>
    );
  }
  if (level >= 6 && level <= 10) {
    return (
      <span className="font-black text-lg" style={{
        background: cfg.frameGradient, backgroundSize: "200% auto",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        filter: `drop-shadow(0 0 8px ${cfg.glowColor})`,
        animation: "vip-name-flow 2s linear infinite",
      }}>{name}</span>
    );
  }
  return (
    <span className="font-black text-lg" style={{
      background: level === 12
        ? "linear-gradient(90deg, #ffd700, #ff69b4, #00ffff, #ff1493, #a855f7, #ffd700)"
        : "linear-gradient(90deg, #00ffff, #00ced1, #7fffd4, #00ffff, #20b2aa, #00ffff)",
      backgroundSize: "300% auto",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
      filter: `drop-shadow(0 0 12px ${cfg.glowColor}) drop-shadow(0 0 24px ${cfg.glowColor}80)`,
      animation: "vip-name-royal 1.5s linear infinite",
    }}>{name}</span>
  );
}

function ToggleSwitch({ enabled, onToggle, loading, color }: { enabled: boolean; onToggle: () => void; loading: boolean; color: string }) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className="relative w-12 h-6 rounded-full transition-all flex-shrink-0 disabled:opacity-50 active:scale-95"
      style={{ background: enabled ? `linear-gradient(135deg, ${color}, ${color}cc)` : "rgba(255,255,255,0.1)" }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200"
        style={{ right: enabled ? "2px" : "auto", left: enabled ? "auto" : "2px" }}
      />
    </button>
  );
}

export default function VipFeaturesPage({ onBack }: VipFeaturesPageProps) {
  const myProfile = useQuery(api.profiles.getMyProfile);
  const myVipInfo = useQuery(api.vip.getMyVipInfo);
  const toggleHideRoom = useMutation(api.vip.toggleHideRoomPresence);
  const togglePrivate = useMutation(api.vip.togglePrivateProfile);
  const claimDaily = useMutation(api.vip.claimDailyVipReward);

  const [loadingHide, setLoadingHide] = useState(false);
  const [loadingPrivate, setLoadingPrivate] = useState(false);
  const [loadingClaim, setLoadingClaim] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "privacy" | "perks">("overview");

  const isVip = myProfile?.isVip ?? false;
  const vipLevel = myProfile?.vipLevel ?? 0;
  const vipConfig = getVipConfig(vipLevel);
  const accentColor = vipConfig?.nameColor || "#a855f7";

  const hideRoom = myProfile?.hideRoomPresence ?? false;
  const isPrivate = myProfile?.isPrivateProfile ?? false;

  const vipExpiresAt = myProfile?.vipExpiresAt;
  const daysLeft = vipExpiresAt
    ? Math.max(0, Math.floor((vipExpiresAt - Date.now()) / 86400000))
    : null;

  const handleToggleHide = async () => {
    setLoadingHide(true);
    try {
      await toggleHideRoom({ hide: !hideRoom });
      toast.success(!hideRoom ? "✅ تم إخفاء حضورك في الغرف" : "✅ تم إظهار حضورك في الغرف");
    } catch (e: any) { toast.error(e.message); } finally { setLoadingHide(false); }
  };

  const handleTogglePrivate = async () => {
    setLoadingPrivate(true);
    try {
      await togglePrivate({ isPrivate: !isPrivate });
      toast.success(!isPrivate ? "✅ تم تفعيل الملف الخاص" : "✅ تم إلغاء الملف الخاص");
    } catch (e: any) { toast.error(e.message); } finally { setLoadingPrivate(false); }
  };

  const handleClaimDaily = async () => {
    setLoadingClaim(true);
    try {
      const result = await claimDaily();
      toast.success(`🎁 تم استلام ${result?.reward?.toLocaleString()} عملة!`);
    } catch (e: any) { toast.error(e.message); } finally { setLoadingClaim(false); }
  };

  if (!isVip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" dir="rtl"
        style={{ background: "linear-gradient(180deg, #0a0015 0%, #12001f 60%, #0a0a15 100%)" }}>
        <div className="text-7xl mb-4" style={{ animation: "vip-crown-float 2.5s ease-in-out infinite" }}>👑</div>
        <h2 className="text-white font-black text-2xl mb-2">مميزات VIP</h2>
        <p className="text-gray-400 text-sm text-center mb-8 leading-relaxed">
          اشترك في VIP للوصول إلى مميزات حصرية<br />مثل الاسم الملون والمكافآت اليومية
        </p>
        <button onClick={onBack}
          className="px-8 py-3 rounded-2xl text-black font-black text-base active:scale-95"
          style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)", boxShadow: "0 0 20px rgba(251,191,36,0.5)" }}>
          اشترك الآن 👑
        </button>
        <style>{`@keyframes vip-crown-float { 0%,100% { transform: translateY(0) rotate(-5deg); } 50% { transform: translateY(-8px) rotate(5deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" dir="rtl"
      style={{ background: vipConfig?.bgGradient || "linear-gradient(180deg, #0a0015 0%, #12001f 60%, #0a0a15 100%)" }}>

      {/* Top glow */}
      <div className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${accentColor}30 0%, transparent 70%)` }} />

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b flex-shrink-0"
        style={{ background: "rgba(10,0,21,0.9)", borderColor: `${accentColor}20` }}>
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <h2 className="text-white font-black text-base flex-1">مميزات VIP</h2>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}40` }}>
            <span className="text-sm">{vipConfig?.badge}</span>
            <span className="text-xs font-black" style={{ color: accentColor }}>VIP {vipLevel}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">

        {/* ── VIP HERO CARD ── */}
        <div className="relative mx-4 mt-4 rounded-3xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${accentColor}20, rgba(0,0,0,0.7))`,
            border: `1.5px solid ${accentColor}40`,
            boxShadow: `0 0 40px ${accentColor}20`,
          }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(circle at 20% 50%, ${accentColor}15, transparent 70%)` }} />

          <div className="relative p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{
                  background: vipConfig?.frameGradient,
                  boxShadow: `0 0 20px ${accentColor}`,
                  animation: vipLevel >= 11 ? "vip-badge-rainbow 3s linear infinite" : "vip-pulse 2s ease-in-out infinite",
                }}>
                {vipConfig?.badge}
              </div>
              <div className="flex-1 min-w-0">
                <VipNamePreview name={myProfile?.name ?? "مستخدم"} level={vipLevel} />
                <p className="text-gray-400 text-xs mt-0.5">
                  {daysLeft !== null ? `⏳ متبقي ${daysLeft} يوم` : "♾️ عضوية دائمة"}
                </p>
                <p className="text-xs font-bold mt-0.5" style={{ color: accentColor }}>
                  {VIP_LEVELS[vipLevel as keyof typeof VIP_LEVELS]?.name}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "المستوى", value: `VIP ${vipLevel}`, icon: "👑" },
                { label: "مكافأة يومية", value: `+${(VIP_DAILY_REWARDS[vipLevel] ?? 0).toLocaleString()}`, icon: "🪙" },
                { label: "الرصيد", value: (myProfile?.goldCoins ?? 0) >= 1000000 ? `${((myProfile?.goldCoins ?? 0) / 1000000).toFixed(1)}M` : `${((myProfile?.goldCoins ?? 0) / 1000).toFixed(0)}K`, icon: "💰" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl p-2.5 text-center"
                  style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}20` }}>
                  <div className="text-lg mb-0.5">{stat.icon}</div>
                  <p className="font-black text-sm" style={{ color: accentColor }}>{stat.value}</p>
                  <p className="text-gray-500 text-[9px]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── DAILY REWARD ── */}
        <div className="mx-4 mt-3 rounded-2xl overflow-hidden"
          style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)" }}>
          <div className="flex items-center gap-3 p-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: "rgba(251,191,36,0.15)", animation: "vip-pulse 2s ease-in-out infinite" }}>
              🎁
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">المكافأة اليومية</p>
              <p className="text-yellow-400 text-xs">
                +{(VIP_DAILY_REWARDS[vipLevel] ?? myVipInfo?.config?.dailyCoinsReward ?? 0).toLocaleString()} عملة ذهبية
              </p>
            </div>
            <button
              onClick={handleClaimDaily}
              disabled={loadingClaim}
              className="px-4 py-2.5 rounded-xl text-xs font-black text-black disabled:opacity-50 active:scale-95 transition-all"
              style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)", boxShadow: "0 0 15px rgba(251,191,36,0.4)" }}>
              {loadingClaim ? "⏳" : "استلام 🎁"}
            </button>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="mx-4 mt-3">
          <div className="flex gap-1.5 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)" }}>
            {[
              { id: "overview", label: "📊 نظرة عامة" },
              { id: "privacy", label: "🔒 الخصوصية" },
              { id: "perks", label: "✨ المميزات" },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className="flex-1 py-2 rounded-xl text-[10px] font-black transition-all"
                style={activeTab === tab.id
                  ? { background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)`, color: accentColor, border: `1px solid ${accentColor}40` }
                  : { color: "#6b7280" }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── TAB CONTENT ── */}
        <div className="mx-4 mt-3 space-y-3">

          {activeTab === "overview" && (
            <>
              {/* Name color preview - NO frame */}
              <div className="rounded-2xl p-4"
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${accentColor}20` }}>
                <p className="text-gray-500 text-xs font-bold mb-3">🎨 معاينة الاسم</p>
                <div className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "rgba(0,0,0,0.3)" }}>
                  {/* Avatar - no frame */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center flex-shrink-0">
                    {myProfile?.avatarUrl
                      ? <img src={myProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
                      : <span className="text-white font-black text-lg">{myProfile?.name?.[0] ?? "?"}</span>
                    }
                  </div>
                  <div>
                    <VipNamePreview name={myProfile?.name ?? "اسمك"} level={vipLevel} />
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black"
                        style={{ background: vipConfig?.frameGradient, color: "#000" }}>VIP{vipLevel}</span>
                      <span className="text-gray-500 text-[9px]">{vipConfig?.tier}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  {[
                    { range: "VIP 1-5", desc: "ألوان ثابتة مميزة (برونزي → ماسي)", active: vipLevel >= 1 && vipLevel <= 5 },
                    { range: "VIP 6-10", desc: "shimmer متحرك — الألوان تتدفق وتلمع", active: vipLevel >= 6 && vipLevel <= 10 },
                    { range: "VIP 11-12", desc: "قوس قزح ملكي يتحرك بقوة مبهرة", active: vipLevel >= 11 },
                  ].map((item) => (
                    <div key={item.range} className="flex items-center gap-2 rounded-xl px-3 py-2"
                      style={{
                        background: item.active ? `${accentColor}15` : "rgba(255,255,255,0.02)",
                        border: `1px solid ${item.active ? accentColor + "40" : "rgba(255,255,255,0.05)"}`,
                      }}>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: item.active ? accentColor : "#4b5563" }} />
                      <span className="text-[10px] font-black" style={{ color: item.active ? accentColor : "#6b7280" }}>{item.range}</span>
                      <span className="text-gray-500 text-[10px] flex-1">{item.desc}</span>
                      {item.active && <span className="text-[9px] font-black" style={{ color: accentColor }}>✓ أنت هنا</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily rewards table */}
              <div className="rounded-2xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(251,191,36,0.15)" }}>
                <div className="px-4 py-3 flex items-center gap-2"
                  style={{ borderBottom: "1px solid rgba(251,191,36,0.1)", background: "rgba(251,191,36,0.05)" }}>
                  <div className="w-1 h-5 rounded-full bg-yellow-400" />
                  <p className="text-white font-bold text-sm">🪙 جدول المكافآت اليومية</p>
                </div>
                <div className="p-3 grid grid-cols-2 gap-2">
                  {Object.entries(VIP_DAILY_REWARDS).map(([lvl, reward]) => {
                    const cfg = getVipConfig(Number(lvl));
                    const isMyLevel = Number(lvl) === vipLevel;
                    return (
                      <div key={lvl} className="flex items-center gap-2 rounded-xl px-3 py-2"
                        style={{
                          background: isMyLevel ? `${cfg?.nameColor}20` : "rgba(255,255,255,0.02)",
                          border: `1px solid ${isMyLevel ? cfg?.nameColor + "50" : "rgba(255,255,255,0.05)"}`,
                        }}>
                        <span className="text-sm">{cfg?.badge}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-black" style={{ color: cfg?.nameColor }}>VIP{lvl}</p>
                          <p className="text-yellow-400 text-[10px] font-bold">+{reward.toLocaleString()}</p>
                        </div>
                        {isMyLevel && <span className="text-[8px] font-black text-green-400">أنت</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === "privacy" && (
            <div className="space-y-3">
              {/* Hide room toggle */}
              <div className="rounded-2xl p-4"
                style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: "rgba(168,85,247,0.15)" }}>
                    {hideRoom ? "🙈" : "👁️"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">إخفاء الحضور في الغرف</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {hideRoom ? "✅ مفعّل — لا يرى أحد أنك في غرفة" : "لن يظهر للآخرين أنك في غرفة"}
                    </p>
                  </div>
                  <ToggleSwitch enabled={hideRoom} onToggle={handleToggleHide} loading={loadingHide} color="#a855f7" />
                </div>
              </div>

              {/* Private profile toggle */}
              <div className="rounded-2xl p-4"
                style={{ background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.25)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: "rgba(236,72,153,0.15)" }}>
                    {isPrivate ? "🔒" : "👤"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">الملف الشخصي الخاص</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {isPrivate ? "✅ مفعّل — يرى ملفك الأصدقاء فقط" : "يرى ملفك الأصدقاء فقط"}
                    </p>
                  </div>
                  <ToggleSwitch enabled={isPrivate} onToggle={handleTogglePrivate} loading={loadingPrivate} color="#ec4899" />
                </div>
              </div>

              {/* Privacy features info */}
              <div className="rounded-2xl p-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-gray-400 text-xs font-bold mb-3">🔐 مميزات الخصوصية حسب المستوى</p>
                {[
                  { icon: "🙈", label: "إخفاء الغرفة", minLevel: 1, color: "#a855f7" },
                  { icon: "👤", label: "ملف خاص", minLevel: 1, color: "#ec4899" },
                  { icon: "⏰", label: "إخفاء آخر ظهور", minLevel: 3, color: "#06b6d4" },
                  { icon: "🔍", label: "ظهور مميز في البحث", minLevel: 5, color: "#22c55e" },
                  { icon: "🏆", label: "لوحة الشرف", minLevel: 10, color: "#fbbf24" },
                ].map((item) => {
                  const unlocked = vipLevel >= item.minLevel;
                  return (
                    <div key={item.label} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: unlocked ? `${item.color}20` : "rgba(255,255,255,0.05)" }}>
                        {unlocked ? item.icon : "🔒"}
                      </div>
                      <span className="text-sm flex-1" style={{ color: unlocked ? "white" : "#6b7280" }}>{item.label}</span>
                      {unlocked
                        ? <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: item.color }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                          </div>
                        : <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                            style={{ background: `${item.color}20`, color: item.color }}>VIP{item.minLevel}</span>
                      }
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "perks" && (
            <div className="space-y-3">
              {myVipInfo?.config && (
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${accentColor}20` }}>
                  <div className="px-4 py-3 flex items-center gap-2"
                    style={{ borderBottom: `1px solid ${accentColor}15`, background: `${accentColor}08` }}>
                    <div className="w-1 h-5 rounded-full" style={{ background: accentColor }} />
                    <p className="text-white font-bold text-sm">✨ مميزاتك المفعّلة</p>
                  </div>
                  <div className="p-3 space-y-2">
                    {[
                      { label: "اسم لامع ملون", enabled: myVipInfo.config.hasShinyName, icon: "✏️", color: "#a855f7" },
                      { label: "معرف مخصص", enabled: myVipInfo.config.hasCustomSakiId, icon: "🆔", color: "#06b6d4" },
                      { label: "صورة GIF متحركة", enabled: myVipInfo.config.hasGifAvatar, icon: "🎭", color: "#22c55e" },
                      { label: "تأثير دخول مخصص", enabled: myVipInfo.config.hasCustomEntry, icon: "🚪", color: "#f97316" },
                      { label: "بطاقة لحظة مخصصة", enabled: myVipInfo.config.hasCustomMomentCard, icon: "📸", color: "#fbbf24" },
                      { label: "إخفاء آخر ظهور", enabled: myVipInfo.config.canHideLastSeen, icon: "⏰", color: "#8b5cf6" },
                      { label: "تأثيرات صوتية", enabled: myVipInfo.config.hasVoiceEffects, icon: "🎙️", color: "#ef4444" },
                      { label: "إخفاء الحضور في الغرف", enabled: myVipInfo.config.canHideRoomPresence ?? false, icon: "👁️", color: "#a855f7" },
                      { label: "ملف شخصي خاص", enabled: myVipInfo.config.canPrivateProfile ?? false, icon: "🔒", color: "#ec4899" },
                      { label: "امتلاك غرفة VIP", enabled: myVipInfo.config.canOwnVipRoom, icon: "🏠", color: "#fbbf24" },
                    ].map((perk) => (
                      <div key={perk.label} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                        style={{
                          background: perk.enabled ? `${perk.color}10` : "rgba(255,255,255,0.02)",
                          border: `1px solid ${perk.enabled ? perk.color + "30" : "rgba(255,255,255,0.05)"}`,
                        }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                          style={{ background: perk.enabled ? `${perk.color}20` : "rgba(255,255,255,0.05)" }}>
                          {perk.icon}
                        </div>
                        <span className="text-sm flex-1" style={{ color: perk.enabled ? "white" : "#6b7280" }}>
                          {perk.label}
                        </span>
                        {perk.enabled
                          ? <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: perk.color }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                            </div>
                          : <span className="text-gray-600 text-xs">✗</span>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Room features */}
              <div className="rounded-2xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <div className="px-4 py-3 flex items-center gap-2"
                  style={{ borderBottom: "1px solid rgba(34,197,94,0.1)", background: "rgba(34,197,94,0.05)" }}>
                  <div className="w-1 h-5 rounded-full bg-green-400" />
                  <p className="text-white font-bold text-sm">🎙️ مميزات الغرفة</p>
                </div>
                <div className="p-3 space-y-2">
                  {[
                    { icon: "🎵", label: "موجات كلام مميزة", desc: "موجات ملونة عند الكلام", minLevel: 1 },
                    { icon: "📢", label: "أولوية الميكروفون", desc: "أولوية في الحصول على مقعد", minLevel: 4 },
                    { icon: "🛡️", label: "حماية من الطرد", desc: "لا يمكن طردك من الغرفة", minLevel: 7 },
                    { icon: "🔥", label: "أجنحة عند الكلام", desc: "VIP 9-12: أجنحة تتحرك بجانب الصورة", minLevel: 9 },
                    { icon: "🔓", label: "دخول الغرف المقفلة", desc: "ادخل أي غرفة مقفلة", minLevel: 9 },
                    { icon: "🏠", label: "غرفة VIP خاصة", desc: "أنشئ غرفة VIP حصرية", minLevel: 10 },
                  ].map((item) => {
                    const unlocked = vipLevel >= item.minLevel;
                    return (
                      <div key={item.label} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                        style={{
                          background: unlocked ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${unlocked ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.05)"}`,
                        }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                          style={{ background: unlocked ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)" }}>
                          {unlocked ? item.icon : "🔒"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm" style={{ color: unlocked ? "white" : "#6b7280" }}>{item.label}</p>
                          <p className="text-gray-600 text-[10px]">{item.desc}</p>
                        </div>
                        {unlocked
                          ? <div className="w-5 h-5 rounded-full flex items-center justify-center bg-green-500">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                            </div>
                          : <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                              style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>VIP{item.minLevel}</span>
                        }
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes vip-name-flow { 0% { background-position: 0% center; } 100% { background-position: 200% center; } }
        @keyframes vip-name-royal { 0% { background-position: 0% center; } 100% { background-position: 300% center; } }
        @keyframes vip-badge-rainbow { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }
        @keyframes vip-pulse { 0%,100% { opacity: 0.85; } 50% { opacity: 1; } }
        @keyframes vip-crown-float { 0%,100% { transform: translateY(0) rotate(-5deg); } 50% { transform: translateY(-8px) rotate(5deg); } }
      `}</style>
    </div>
  );
}
