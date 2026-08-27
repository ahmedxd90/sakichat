// @ts-nocheck
import { supabase } from "../lib/supabaseClient";
import { useEffect } from "react";
import { useState } from "react";
import { toast } from "../lib/toast";

import VipTitleUpload from "../components/VipTitleUpload";
import SVGAPlayer, { isSvgaUrl } from "../components/SVGAPlayer";

interface VipPageProps { onBack: () => void; }

const DURATION_OPTIONS = [
  { days: 30, label: "30 يوم", mult: 1 },
  { days: 90, label: "90 يوم", mult: 2.5 },
  { days: 365, label: "365 يوم", mult: 8 },
];

function formatPrice(p: number) {
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1)}M`;
  if (p >= 1_000) return `${(p / 1_000).toFixed(0)}K`;
  return p.toLocaleString();
}

function getPrice(basePrice: number, days: number) {
  const opt = DURATION_OPTIONS.find(o => o.days === days);
  return Math.floor(basePrice * (opt?.mult ?? 1));
}

// ── Feature icons map ──
const FEATURE_ICONS: Record<string, string> = {
  hasShinyName: "✨",
  hasShinyFrame: "🖼️",
  hasCustomSakiId: "🆔",
  hasGifAvatar: "🎭",
  hasCustomEntry: "🚪",
  hasCustomMomentCard: "📸",
  canHideLastSeen: "⏰",
  hasVoiceEffects: "🎵",
  canHideRoomPresence: "🙈",
  canPrivateProfile: "🔒",
  canOwnVipRoom: "🏠",
  hasRoyalSeat: "👑",
  canKickProtection: "🛡️",
  canBanProtection: "🛡️",
  canMuteProtection: "🔇",
};

const FEATURE_LABELS: Record<string, string> = {
  hasShinyName: "اسم ملون لامع",
  hasShinyFrame: "إطار صورة ملكي",
  hasCustomSakiId: "معرف مخصص",
  hasGifAvatar: "صورة متحركة GIF",
  hasCustomEntry: "تأثير دخول مخصص",
  hasCustomMomentCard: "بطاقة منشورات ملكية",
  canHideLastSeen: "إخفاء آخر ظهور",
  hasVoiceEffects: "موجات صوتية ملونة",
  canHideRoomPresence: "إخفاء دخول الغرفة",
  canPrivateProfile: "ملف شخصي خاص",
  canOwnVipRoom: "غرفة VIP خاصة",
  hasRoyalSeat: "مقعد ملكي",
  canKickProtection: "حماية من الطرد",
  canBanProtection: "حماية من الحظر",
  canMuteProtection: "حماية من الكتم",
};

// ── VIP Badge Display — يدعم SVGA ──
function VipBadgeDisplay({ cfg, size = 80 }: { cfg: any; size?: number }) {
  if (cfg?.badgeUrl) {
    const isSvga = cfg.badgeMediaType === "svga" || isSvgaUrl(cfg.badgeUrl);
    if (isSvga) {
      return (
        <SVGAPlayer
          src={cfg.badgeUrl}
          width={size} height={size}
          loop
          style={{ background: "transparent" }}
        />
      );
    }
    return (
      <img
        src={cfg.badgeUrl}
        alt={cfg.name}
        style={{
          width: size, height: size, objectFit: "contain",
          filter: `drop-shadow(0 0 14px ${cfg.nameColor ?? "#fbbf24"})`,
          background: "transparent",
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: `linear-gradient(135deg, ${cfg?.nameColor ?? "#fbbf24"}, ${cfg?.frameColor ?? "#f59e0b"})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.4, fontWeight: 900, color: "#000",
        boxShadow: `0 0 20px ${cfg?.nameColor ?? "#fbbf24"}80`,
      }}
    >
      👑
    </div>
  );
}

// ── VIP Name with color ──
function VipName({ name, cfg }: { name: string; cfg: any }) {
  const color = cfg?.nameColor ?? "#fbbf24";
  const isShiny = cfg?.hasShinyName;
  if (isShiny) {
    return (
      <span
        style={{
          background: `linear-gradient(90deg, ${color}, ${color}cc, ${color})`,
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          animation: "vip-shimmer 2s linear infinite",
          fontWeight: 900,
        }}
      >
        {name}
      </span>
    );
  }
  return <span style={{ color, fontWeight: 900 }}>{name}</span>;
}

// ── Buy Sheet ──
function VipBuySheet({ cfg, selectedDuration, setSelectedDuration, myCoins, buying, onBuy, onClose }: any) {
  if (!cfg) return null;
  const basePrice = cfg.price ?? 0;
  const price = getPrice(basePrice, selectedDuration);
  const color = cfg.nameColor ?? "#fbbf24";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl p-5 space-y-4"
        style={{ background: "#0d0020", border: `1px solid ${color}30` }}
      >
        <div className="flex justify-center">
          <div className="w-10 h-1 rounded-full" style={{ background: "#333" }} />
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-black text-base">شراء <VipName name={cfg.name} cfg={cfg} /></h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xl" style={{ background: "#1a1a1a" }}>×</button>
        </div>

        <div className="flex items-center gap-4 rounded-2xl p-4" style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
          <VipBadgeDisplay cfg={cfg} size={56} />
          <div>
            <VipName name={cfg.name} cfg={cfg} />
            <p className="text-xs mt-1" style={{ color: "#888" }}>+{(cfg.dailyCoinsReward ?? 0).toLocaleString()} 🪙 يومياً</p>
          </div>
        </div>

        <div className="flex gap-2">
          {DURATION_OPTIONS.map((opt) => {
            const p = getPrice(basePrice, opt.days);
            return (
              <button
                key={opt.days}
                onClick={() => setSelectedDuration(opt.days)}
                className="flex-1 py-3 rounded-xl text-xs font-bold transition-all active:scale-95"
                style={selectedDuration === opt.days
                  ? { background: `${color}30`, color, border: `1.5px solid ${color}60` }
                  : { background: "#1a1a1a", color: "#555", border: "1px solid #333" }}
              >
                <div>{opt.label}</div>
                <div className="text-[10px] mt-0.5 opacity-80">{formatPrice(p)} 🪙</div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs" style={{ color: "#777" }}>السعر الإجمالي</div>
            <div className="flex items-center gap-1">
              <span className="text-white font-black text-2xl">{formatPrice(price)}</span>
              <span className="text-yellow-400 text-lg">🪙</span>
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: (myCoins ?? 0) >= price ? "#22c55e" : "#ef4444" }}>
              رصيدك: {formatPrice(myCoins ?? 0)} {(myCoins ?? 0) >= price ? "✓" : "✗"}
            </div>
          </div>
          <button
            onClick={() => onBuy(price)}
            disabled={buying || (myCoins ?? 0) < price}
            className="flex-1 py-4 rounded-2xl text-sm font-black text-black disabled:opacity-40 active:scale-[0.98] transition-transform"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 4px 20px ${color}40` }}
          >
            {buying ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>جارٍ الشراء...</span>
              </div>
            ) : `شراء ${cfg.name}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main VIP Page ──
export default function VipPage({ onBack }: VipPageProps) {
  const [vipLevels, setVipLevels] = useState<any[]>([]);
  const [myVipInfo, setMyVipInfo] = useState<any>(null);
  const [myProfile, setMyProfile] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: levels } = await supabase.from('vip_levels').select('*').order('level');
      setVipLevels(levels || []);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
        setMyProfile(p);
        const { data: v } = await supabase.from('user_vip').select('*').eq('user_id', user.id).maybeSingle();
        setMyVipInfo(v);
      }
    };
    fetchData();
  }, []);

  const purchaseVip = async (args: any) => {};
  const claimDaily = async () => ({ reward: 0 });
  const toggleHideRoom = async (args: any) => {};
  const togglePrivate = async (args: any) => {};

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [buying, setBuying] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showBuySheet, setShowBuySheet] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const isAdmin = myProfile?.isSuperAdmin ?? false;
  const myCoins = myProfile?.goldCoins ?? 0;
  const myLevel = myVipInfo?.level ?? 0;
  const isVip = myProfile?.isVip ?? false;

  const selectedCfg = vipLevels[selectedIdx] ?? null;
  const color = selectedCfg?.nameColor ?? "#fbbf24";
  const isMyLevel = isVip && myLevel === selectedCfg?.level;
  const daysLeft = isMyLevel && myVipInfo?.expiresAt
    ? Math.max(0, Math.ceil((myVipInfo.expiresAt - Date.now()) / 86400000))
    : 0;

  const now = Date.now();
  const lastClaim = myVipInfo?.lastVipDailyClaim ?? 0;
  const msIn24h = 24 * 60 * 60 * 1000;
  const canClaim = now - lastClaim >= msIn24h;
  const remainingMs = canClaim ? 0 : lastClaim + msIn24h - now;
  const remainHours = Math.floor(remainingMs / 3600000);
  const remainMins = Math.floor((remainingMs % 3600000) / 60000);

  const handleBuy = async (price: number) => {
    if (buying || !selectedCfg) return;
    setBuying(true);
    try {
      await purchaseVip({ vipLevel: selectedCfg.level, durationDays: selectedDuration });
      toast.success(`🎉 تهانينا! أصبحت ${selectedCfg.name}!`);
      setShowBuySheet(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBuying(false);
    }
  };

  const handleClaimDaily = async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      const result = await claimDaily();
      toast.success(`🪙 تم استلام ${result.reward.toLocaleString()} عملة!`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setClaiming(false);
    }
  };

  if (showAdminPanel) return <VipAdminPanel onBack={() => setShowAdminPanel(false)} />;

  // Loading state
  if (vipLevels === undefined) {
    return (
      <div className="flex flex-col h-full items-center justify-center" style={{ background: "#0d0020" }} dir="rtl">
        <div className="w-10 h-10 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm">جارٍ التحميل...</p>
      </div>
    );
  }

  // Empty state - no levels added yet
  if (vipLevels.length === 0) {
    return (
      <div className="flex flex-col h-full" style={{ background: "#0d0020" }} dir="rtl">
        <div className="sticky top-0 z-40 flex items-center justify-between px-5 py-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          <span className="text-white font-black text-base" style={{ background: "linear-gradient(90deg,#fde68a,#fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>نظام VIP 👑</span>
          {isAdmin ? (
            <button onClick={() => setShowAdminPanel(true)} className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#000" }}>⚙️ إدارة</button>
          ) : <div className="w-9" />}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <div className="text-6xl">👑</div>
          <h2 className="text-white font-black text-xl text-center">لا توجد مستويات VIP بعد</h2>
          <p className="text-gray-400 text-sm text-center">سيتم إضافة مستويات VIP قريباً من قِبل الإدارة</p>
          {isAdmin && (
            <button onClick={() => setShowAdminPanel(true)} className="mt-4 px-6 py-3 rounded-2xl font-black text-black text-sm"
              style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}>
              ⚙️ إضافة مستوى VIP
            </button>
          )}
        </div>
      </div>
    );
  }

  // Get active features for selected level
  const activeFeatures = selectedCfg ? Object.entries(FEATURE_LABELS).filter(([key]) => {
    const val = selectedCfg[key];
    return val === true;
  }) : [];

  const basePrice = selectedCfg?.price ?? 0;
  const currentPrice = getPrice(basePrice, selectedDuration);

  return (
    <div className="flex flex-col h-full relative" dir="rtl"
      style={{ background: `linear-gradient(180deg, #0a0015 0%, #12001f 60%, #0a0a15 100%)`, overflow: "hidden" }}>

      {/* ── Header ── */}
      <div className="sticky top-0 z-40"
        style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between px-5 py-4">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center active:scale-90 transition-transform">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          <span className="text-white font-black text-base" style={{ background: "linear-gradient(90deg,#fde68a,#fbbf24,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>نظام VIP 👑</span>
          {isAdmin ? (
            <button onClick={() => setShowAdminPanel(true)} className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#000" }}>⚙️ إدارة</button>
          ) : <div className="w-9 h-9" />}
        </div>

        {/* Level tabs */}
        <div className="flex overflow-x-auto px-4 pb-3 gap-3 scrollbar-hide">
          {vipLevels.map((lvl, idx) => {
            const c = lvl.nameColor ?? "#fbbf24";
            return (
              <button
                key={lvl.id}
                onClick={() => setSelectedIdx(idx)}
                className="flex-shrink-0 pb-1.5 text-sm font-bold transition-all relative flex items-center gap-1.5"
                style={selectedIdx === idx
                  ? { color: c, borderBottom: `2px solid ${c}` }
                  : { color: "#555" }}
              >
                {lvl.badgeUrl
                  ? <img src={lvl.badgeUrl} alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />
                  : <span style={{ fontSize: 13 }}>👑</span>
                }
                <span className="text-xs">{lvl.name}</span>
                {isVip && myLevel === lvl.level && (
                  <div className="w-1.5 h-1.5 rounded-full absolute -top-0.5 -right-0.5" style={{ background: c }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto pb-32 scrollbar-hide">

        {/* ── Hero ── */}
        <div className="relative text-center px-6 pt-10 pb-8 overflow-hidden"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${color}22 0%, transparent 70%)` }}>

          {/* Glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div style={{ width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`, animation: "vip-badge-pulse 3s ease-in-out infinite" }} />
          </div>

          {/* Badge */}
          <div className="relative mx-auto mb-5 flex items-center justify-center"
            style={{ width: 120, height: 120, filter: `drop-shadow(0 0 30px ${color})` }}>
            <VipBadgeDisplay cfg={selectedCfg} size={120} />
          </div>

          {/* Name */}
          <div className="mb-2 text-3xl">
            <VipName name={selectedCfg?.name ?? ""} cfg={selectedCfg} />
          </div>

          {/* Daily reward badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3"
            style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}>
            <span>+{(selectedCfg?.dailyCoinsReward ?? 0).toLocaleString()} 🪙 يومياً</span>
          </div>

          {/* Active status */}
          {isMyLevel && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold"
                style={{ background: `${color}20`, border: `1px solid ${color}50`, color }}>
                ✅ مستواك الحالي · {daysLeft} يوم متبقية
              </div>
              <button onClick={handleClaimDaily} disabled={claiming || !canClaim}
                className="px-3 py-2 rounded-full text-black text-xs font-black disabled:opacity-50 active:scale-95 transition-transform flex flex-col items-center"
                style={{ background: canClaim ? "linear-gradient(135deg,#fbbf24,#f59e0b)" : "rgba(255,255,255,0.1)", color: canClaim ? "#000" : "#888" }}>
                {claiming ? "..." : canClaim ? "🎁 استلم" : (
                  <span className="text-[10px] leading-tight text-center">
                    ⏳ {remainHours}س {remainMins}د
                  </span>
                )}
              </button>
            </div>
          )}

          {/* VIP toggles */}
          {isMyLevel && (
            <div className="mt-4 flex gap-2 justify-center flex-wrap">
              {selectedCfg?.canHideRoomPresence && (
                <button
                  onClick={async () => { try { await toggleHideRoom({ hide: !(myProfile?.hideRoomPresence) }); toast.success("تم التحديث"); } catch (e: any) { toast.error(e.message); } }}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-95"
                  style={{
                    background: myProfile?.hideRoomPresence ? `${color}25` : "rgba(255,255,255,0.06)",
                    border: `1px solid ${myProfile?.hideRoomPresence ? color : "rgba(255,255,255,0.15)"}40`,
                    color: myProfile?.hideRoomPresence ? color : "#9ca3af",
                  }}>
                  <span>{myProfile?.hideRoomPresence ? "🙈" : "👁️"}</span>
                  <span>إخفاء الغرفة</span>
                </button>
              )}
              {selectedCfg?.canPrivateProfile && (
                <button
                  onClick={async () => { try { await togglePrivate({ isPrivate: !(myProfile?.isPrivateProfile) }); toast.success("تم التحديث"); } catch (e: any) { toast.error(e.message); } }}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-95"
                  style={{
                    background: myProfile?.isPrivateProfile ? `${color}25` : "rgba(255,255,255,0.06)",
                    border: `1px solid ${myProfile?.isPrivateProfile ? color : "rgba(255,255,255,0.15)"}40`,
                    color: myProfile?.isPrivateProfile ? color : "#9ca3af",
                  }}>
                  <span>{myProfile?.isPrivateProfile ? "🔒" : "👤"}</span>
                  <span>ملف خاص</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Frame Preview ── */}
        {selectedCfg?.frameUrl && (
          <div className="px-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${color}40, transparent)` }} />
              <span className="text-xs font-bold" style={{ color }}>إطار الصورة الشخصية</span>
              <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${color}40)` }} />
            </div>
            <div className="flex items-center justify-center gap-6 rounded-2xl p-4"
              style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
              <div className="flex flex-col items-center gap-2">
                <div className="relative" style={{ width: 72, height: 72 }}>
                  <div className="rounded-full overflow-hidden flex items-center justify-center"
                    style={{ width: 52, height: 52, position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 1, background: "linear-gradient(135deg,#a855f7,#ec4899)" }}>
                    <span className="text-white font-bold text-xl">أ</span>
                  </div>
                  <img src={selectedCfg.frameUrl} alt="إطار VIP" style={{ position: "absolute", top: 0, left: 0, width: 72, height: 72, zIndex: 10, objectFit: "contain", pointerEvents: "none" }} />
                </div>
                <span className="text-xs font-bold" style={{ color }}>إطار {selectedCfg.name}</span>
              </div>
              <div className="text-xs text-gray-400 text-center">
                <p>يُضاف تلقائياً</p>
                <p>لحقيبتك 🎒</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Chat Bubble Preview ── */}
        {selectedCfg?.chatBubbleUrl && (
          <div className="px-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${color}40, transparent)` }} />
              <span className="text-xs font-bold" style={{ color }}>فقاعة الدردشة</span>
              <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${color}40)` }} />
            </div>
            <div className="flex items-center justify-center rounded-2xl p-4"
              style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
              <img src={selectedCfg.chatBubbleUrl} alt="فقاعة دردشة" style={{ maxHeight: 60, objectFit: "contain" }} />
            </div>
          </div>
        )}

        {/* ── Features ── */}
        {activeFeatures.length > 0 && (
          <div className="px-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${color}40, transparent)` }} />
              <span className="text-xs font-bold" style={{ color }}>المميزات الحصرية</span>
              <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${color}40)` }} />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {activeFeatures.map(([key, label]) => (
                <div key={key} className="rounded-2xl p-3.5 flex items-start gap-3 relative overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${color}12, ${color}06)`, border: `1px solid ${color}25` }}>
                  <div className="absolute top-0 right-0 w-12 h-12 pointer-events-none"
                    style={{ background: `radial-gradient(circle at top right, ${color}15, transparent)` }} />
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${color}30, ${color}15)`, border: `1px solid ${color}40` }}>
                    <span style={{ fontSize: 18 }}>{FEATURE_ICONS[key] ?? "✨"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold leading-tight">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Pricing ── */}
        <div className="px-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${color}40, transparent)` }} />
            <span className="text-xs font-bold" style={{ color }}>الأسعار</span>
            <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${color}40)` }} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {DURATION_OPTIONS.map((opt) => {
              const p = getPrice(basePrice, opt.days);
              const isSelected = selectedDuration === opt.days;
              return (
                <button key={opt.days} onClick={() => setSelectedDuration(opt.days)}
                  className="rounded-2xl p-3 text-center transition-all active:scale-95"
                  style={isSelected
                    ? { background: `${color}25`, border: `1.5px solid ${color}60`, boxShadow: `0 0 12px ${color}30` }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="text-xs font-bold mb-1" style={{ color: isSelected ? color : "#666" }}>{opt.label}</div>
                  <div className="text-sm font-black" style={{ color: isSelected ? "#fff" : "#888" }}>{formatPrice(p)}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: "#fbbf24" }}>🪙</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Compare Levels ── */}
        {vipLevels.length > 1 && (
          <div className="px-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${color}40, transparent)` }} />
              <span className="text-xs font-bold" style={{ color }}>مقارنة المستويات</span>
              <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${color}40)` }} />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {vipLevels.map((lvl, idx) => {
                const c = lvl.nameColor ?? "#fbbf24";
                return (
                  <button key={lvl.id} onClick={() => setSelectedIdx(idx)}
                    className="flex-shrink-0 rounded-2xl p-3 text-center transition-all active:scale-95 flex flex-col items-center gap-1.5"
                    style={{
                      width: 72,
                      background: selectedIdx === idx ? `${c}20` : "rgba(255,255,255,0.04)",
                      border: selectedIdx === idx ? `1.5px solid ${c}60` : "1px solid rgba(255,255,255,0.08)",
                      boxShadow: selectedIdx === idx ? `0 0 14px ${c}30` : "none",
                    }}>
                    <div style={{ width: 36, height: 36 }}>
                      <VipBadgeDisplay cfg={lvl} size={36} />
                    </div>
                    <p className="text-[9px] font-bold leading-tight" style={{ color: selectedIdx === idx ? c : "#555" }}>{lvl.name}</p>
                    {isVip && myLevel === lvl.level && (
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Bar ── */}
      <div className="flex-shrink-0 px-4 py-4 flex items-center gap-3"
        style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(12px)", borderTop: `1px solid ${color}20` }}>
        <button
          onClick={() => setShowBuySheet(true)}
          className="flex-1 py-3.5 rounded-2xl font-black text-sm active:scale-95 transition-transform text-black"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 4px 20px ${color}50` }}>
          شحن الآن · {formatPrice(currentPrice)} 🪙
        </button>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${color}30` }}>
          <span className="text-xl">👑</span>
        </div>
      </div>

      {/* ── Buy Sheet ── */}
      {showBuySheet && (
        <VipBuySheet
          cfg={selectedCfg}
          selectedDuration={selectedDuration}
          setSelectedDuration={setSelectedDuration}
          myCoins={myCoins}
          buying={buying}
          onBuy={handleBuy}
          onClose={() => setShowBuySheet(false)}
        />
      )}

      <style>{`
        @keyframes vip-shimmer { 0%{background-position:0% center} 100%{background-position:200% center} }
        @keyframes vip-badge-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.85;transform:scale(1.04)} }
      `}</style>
    </div>
  );
}

// ── Admin Panel ──
function VipAdminPanel({ onBack }: { onBack: () => void }) {
  const [vipLevels, setVipLevels] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('vip_levels').select('*').order('level').then(({ data }) => setVipLevels(data || []));
  }, []);
  const generateUploadUrl = async () => ({ url: '' });
  const upsertVipLevel = async (args: any) => {
    await supabase.from('vip_levels').upsert(args);
  };
  const deleteVipLevel = async (args: any) => {
    await supabase.from('vip_levels').delete().eq('id', args.id);
  };
  const upgradeUserVip = async (args: any) => {
    await supabase.from('user_vip').upsert({ user_id: args.userId, level: args.vipLevel });
  };

  const [mode, setMode] = useState<"create" | "upgrade" | "list">("list");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingLevel, setEditingLevel] = useState<any>(null);

  // Form state
  const [level, setLevel] = useState(1);
  const [name, setName] = useState("");
  const [price, setPrice] = useState(1_000_000);
  const [durationDays, setDurationDays] = useState(30);
  const [badgeStorageId, setBadgeStorageId] = useState<string | null>(null);
  const [frameStorageId, setFrameStorageId] = useState<string | null>(null);
  const [chatBubbleStorageId, setChatBubbleStorageId] = useState<string | null>(null);
  const [badgePreview, setBadgePreview] = useState<string | null>(null);
  const [framePreview, setFramePreview] = useState<string | null>(null);
  const [chatBubblePreview, setChatBubblePreview] = useState<string | null>(null);
  const [titleStorageId, setTitleStorageId] = useState<string | null>(null);
  const [titlePreview, setTitlePreview] = useState<string | null>(null);
  const [nameColor, setNameColor] = useState("#fbbf24");
  const [frameColor, setFrameColor] = useState("#fbbf24");
  const [voiceWaveColor, setVoiceWaveColor] = useState("#fbbf24");
  const [chatNameColor, setChatNameColor] = useState("#fbbf24");
  const [dailyCoinsReward, setDailyCoinsReward] = useState(1000);
  const [seatOrder, setSeatOrder] = useState(0);

  // Feature toggles
  const [hasShinyName, setHasShinyName] = useState(true);
  const [hasShinyFrame, setHasShinyFrame] = useState(false);
  const [hasCustomSakiId, setHasCustomSakiId] = useState(false);
  const [hasGifAvatar, setHasGifAvatar] = useState(false);
  const [hasCustomEntry, setHasCustomEntry] = useState(false);
  const [hasCustomMomentCard, setHasCustomMomentCard] = useState(false);
  const [canHideLastSeen, setCanHideLastSeen] = useState(false);
  const [hasVoiceEffects, setHasVoiceEffects] = useState(false);
  const [canHideRoomPresence, setCanHideRoomPresence] = useState(false);
  const [canPrivateProfile, setCanPrivateProfile] = useState(false);
  const [canOwnVipRoom, setCanOwnVipRoom] = useState(false);
  const [hasRoyalSeat, setHasRoyalSeat] = useState(false);
  const [canKickProtection, setCanKickProtection] = useState(false);
  const [canBanProtection, setCanBanProtection] = useState(false);
  const [canMuteProtection, setCanMuteProtection] = useState(false);

  // Upgrade state
  const [targetSakiId, setTargetSakiId] = useState("");
  const [upgradeLevel, setUpgradeLevel] = useState(1);
  const [upgradeDuration, setUpgradeDuration] = useState<number | undefined>(30);

  const resetForm = () => {
    setLevel(1); setName(""); setPrice(1_000_000); setDurationDays(30);
    setBadgeStorageId(null); setFrameStorageId(null); setChatBubbleStorageId(null);
    setBadgePreview(null); setFramePreview(null); setChatBubblePreview(null);
    setTitleStorageId(null); setTitlePreview(null);
    setNameColor("#fbbf24"); setFrameColor("#fbbf24"); setVoiceWaveColor("#fbbf24"); setChatNameColor("#fbbf24");
    setDailyCoinsReward(1000); setSeatOrder(0);
    setHasShinyName(true); setHasShinyFrame(false); setHasCustomSakiId(false);
    setHasGifAvatar(false); setHasCustomEntry(false); setHasCustomMomentCard(false);
    setCanHideLastSeen(false); setHasVoiceEffects(false); setCanHideRoomPresence(false);
    setCanPrivateProfile(false); setCanOwnVipRoom(false); setHasRoyalSeat(false);
    setCanKickProtection(false); setCanBanProtection(false); setCanMuteProtection(false);
    setEditingLevel(null);
  };

  const loadForEdit = (lvl: any) => {
    setLevel(lvl.level); setName(lvl.name); setPrice(lvl.price ?? 0); setDurationDays(lvl.durationDays ?? 30);
    setNameColor(lvl.nameColor ?? "#fbbf24"); setFrameColor(lvl.frameColor ?? "#fbbf24");
    setVoiceWaveColor(lvl.voiceWaveColor ?? "#fbbf24"); setChatNameColor(lvl.chatNameColor ?? "#fbbf24");
    setDailyCoinsReward(lvl.dailyCoinsReward ?? 0); setSeatOrder(lvl.seatOrder ?? 0);
    setHasShinyName(lvl.hasShinyName ?? false); setHasShinyFrame(lvl.hasShinyFrame ?? false);
    setHasCustomSakiId(lvl.hasCustomSakiId ?? false); setHasGifAvatar(lvl.hasGifAvatar ?? false);
    setHasCustomEntry(lvl.hasCustomEntry ?? false); setHasCustomMomentCard(lvl.hasCustomMomentCard ?? false);
    setCanHideLastSeen(lvl.canHideLastSeen ?? false); setHasVoiceEffects(lvl.hasVoiceEffects ?? false);
    setCanHideRoomPresence(lvl.canHideRoomPresence ?? false); setCanPrivateProfile(lvl.canPrivateProfile ?? false);
    setCanOwnVipRoom(lvl.canOwnVipRoom ?? false); setHasRoyalSeat(lvl.hasRoyalSeat ?? false);
    setCanKickProtection(lvl.canKickProtection ?? false); setCanBanProtection(lvl.canBanProtection ?? false);
    setCanMuteProtection(lvl.canMuteProtection ?? false);
    setBadgePreview(lvl.badgeUrl ?? null); setFramePreview(lvl.frameUrl ?? null); setChatBubblePreview(lvl.chatBubbleUrl ?? null);
    setTitlePreview(lvl.titleUrl ?? null);
    setBadgeStorageId(null); setFrameStorageId(null); setChatBubbleStorageId(null); setTitleStorageId(null);
    setEditingLevel(lvl);
    setMode("create");
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "badge" | "frame" | "bubble" | "title") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      if (!result.ok) throw new Error("فشل رفع الملف");
      const { storageId } = await result.json();
      const preview = URL.createObjectURL(file);
      if (type === "badge") { setBadgeStorageId(storageId); setBadgePreview(preview); }
      if (type === "frame") { setFrameStorageId(storageId); setFramePreview(preview); }
      if (type === "bubble") { setChatBubbleStorageId(storageId); setChatBubblePreview(preview); }
      if (type === "title") { setTitleStorageId(storageId); setTitlePreview(preview); }
      toast.success("تم رفع الملف");
    } catch (e: any) { toast.error(e.message); } finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("أدخل اسم المستوى"); return; }
    setSaving(true);
    try {
      await upsertVipLevel({
        level, name, price, durationDays,
        badgeStorageId: badgeStorageId ?? undefined,
        frameStorageId: frameStorageId ?? undefined,
        chatBubbleStorageId: chatBubbleStorageId ?? undefined,
        hasShinyName, hasShinyFrame, hasCustomSakiId, hasGifAvatar,
        hasCustomEntry, hasCustomMomentCard, canHideLastSeen, hasVoiceEffects,
        canHideRoomPresence, canPrivateProfile, dailyCoinsReward, canOwnVipRoom,
        nameColor, frameColor, voiceWaveColor, chatNameColor,
        hasRoyalSeat, canKickProtection, canBanProtection, canMuteProtection, seatOrder,
        titleStorageId: titleStorageId ?? undefined,
      });
      toast.success("تم حفظ المستوى ✅");
      resetForm();
      setMode("list");
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const handleDelete = async (lvl: number) => {
    if (!confirm(`هل تريد حذف VIP${lvl}؟`)) return;
    try {
      await deleteVipLevel({ level: lvl });
      toast.success("تم الحذف");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleUpgrade = async () => {
    if (!targetSakiId.trim()) { toast.error("أدخل SAKI ID"); return; }
    setSaving(true);
    try {
      await upgradeUserVip({ targetSakiId, vipLevel: upgradeLevel, durationDays: upgradeDuration });
      toast.success("تم ترقية المستخدم ✅");
      setTargetSakiId("");
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const features = [
    ["اسم ملون لامع", hasShinyName, setHasShinyName],
    ["إطار صورة ملكي", hasShinyFrame, setHasShinyFrame],
    ["معرف مخصص", hasCustomSakiId, setHasCustomSakiId],
    ["صورة متحركة GIF", hasGifAvatar, setHasGifAvatar],
    ["تأثير دخول مخصص", hasCustomEntry, setHasCustomEntry],
    ["بطاقة منشورات ملكية", hasCustomMomentCard, setHasCustomMomentCard],
    ["إخفاء آخر ظهور", canHideLastSeen, setCanHideLastSeen],
    ["موجات صوتية ملونة", hasVoiceEffects, setHasVoiceEffects],
    ["إخفاء دخول الغرفة", canHideRoomPresence, setCanHideRoomPresence],
    ["ملف شخصي خاص", canPrivateProfile, setCanPrivateProfile],
    ["غرفة VIP خاصة", canOwnVipRoom, setCanOwnVipRoom],
    ["مقعد ملكي", hasRoyalSeat, setHasRoyalSeat],
    ["حماية من الطرد", canKickProtection, setCanKickProtection],
    ["حماية من الحظر", canBanProtection, setCanBanProtection],
    ["حماية من الكتم", canMuteProtection, setCanMuteProtection],
  ];

  return (
    <div className="flex flex-col h-full" style={{ background: "linear-gradient(180deg,#0d0020,#1a0035,#0d0020)" }} dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b" style={{ background: "rgba(13,0,32,0.95)", borderColor: "rgba(251,191,36,0.2)" }}>
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          <h1 className="text-lg font-bold text-yellow-400">⚙️ إدارة VIP</h1>
        </div>
        <div className="flex gap-2 px-4 pb-3">
          {(["list", "create", "upgrade"] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); if (m !== "create") resetForm(); }}
              className="flex-1 py-2 rounded-xl font-bold text-xs transition-all"
              style={mode === m ? { background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#000" } : { background: "rgba(255,255,255,0.05)", color: "#888" }}>
              {m === "list" ? "📋 المستويات" : m === "create" ? "➕ إضافة/تعديل" : "⬆️ ترقية مستخدم"}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">

      {/* List Mode */}
      {mode === "list" && (
        <div className="p-4 space-y-3 pb-20">
          {vipLevels.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">👑</div>
              <p className="text-gray-400">لا توجد مستويات VIP بعد</p>
              <button onClick={() => setMode("create")} className="mt-4 px-6 py-2 rounded-xl font-bold text-black text-sm"
                style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}>إضافة أول مستوى</button>
            </div>
          )}
          {vipLevels.map((lvl) => (
            <div key={lvl.id} className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: `${lvl.nameColor ?? "#fbbf24"}12`, border: `1px solid ${lvl.nameColor ?? "#fbbf24"}30` }}>
              <div style={{ width: 48, height: 48, flexShrink: 0 }}>
                <VipBadgeDisplay cfg={lvl} size={48} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm" style={{ color: lvl.nameColor ?? "#fbbf24" }}>{lvl.name}</p>
                <p className="text-xs text-gray-400">+{(lvl.dailyCoinsReward ?? 0).toLocaleString()} 🪙/يوم · {(lvl.price ?? 0).toLocaleString()} عملة</p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {lvl.frameUrl && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${lvl.nameColor}20`, color: lvl.nameColor }}>إطار</span>}
                  {lvl.chatBubbleUrl && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${lvl.nameColor}20`, color: lvl.nameColor }}>فقاعة</span>}
                  {lvl.hasRoyalSeat && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${lvl.nameColor}20`, color: lvl.nameColor }}>مقعد ملكي</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => loadForEdit(lvl)} className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                  style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" }}>✏️</button>
                <button onClick={() => handleDelete(lvl.level)} className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                  style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>🗑️</button>
              </div>
            </div>
          ))}
          <button onClick={() => { resetForm(); setMode("create"); }}
            className="w-full py-3 rounded-2xl font-bold text-black text-sm mt-2"
            style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}>
            ➕ إضافة مستوى جديد
          </button>
        </div>
      )}

      {/* Create/Edit Mode */}
      {mode === "create" && (
        <div className="p-4 space-y-4 pb-20">
          <h2 className="text-yellow-400 font-black text-base">{editingLevel ? `تعديل: ${editingLevel.name}` : "إضافة مستوى جديد"}</h2>

          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">رقم المستوى</label>
              <input type="number" min="1" max="99" value={level} onChange={(e) => setLevel(+e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">اسم المستوى</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="VIP الذهبي"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">السعر (عملات)</label>
              <input type="number" min="0" value={price} onChange={(e) => setPrice(+e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">مكافأة يومية 🪙</label>
              <input type="number" min="0" value={dailyCoinsReward} onChange={(e) => setDailyCoinsReward(+e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm" />
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="text-gray-400 text-xs mb-2 block">الألوان</label>
            <div className="grid grid-cols-4 gap-2">
              {[["لون الاسم", nameColor, setNameColor], ["لون الإطار", frameColor, setFrameColor], ["لون الموجات", voiceWaveColor, setVoiceWaveColor], ["لون الدردشة", chatNameColor, setChatNameColor]].map(([label, val, setter]: any) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <label className="text-gray-400 text-[9px]">{label}</label>
                  <input type="color" value={val} onChange={(e) => setter(e.target.value)} className="w-full h-9 rounded-lg cursor-pointer" />
                </div>
              ))}
            </div>
          </div>

          {/* File uploads */}
          <div className="space-y-3">
            <label className="text-gray-400 text-xs block">الملفات</label>

            {/* Badge */}
            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.2)" }}>
                {badgePreview ? <img src={badgePreview} alt="" className="w-full h-full object-contain" /> : <span className="text-xl">🏅</span>}
              </div>
              <div className="flex-1">
                <p className="text-white text-xs font-bold mb-1">وسام المستوى</p>
                <label className="cursor-pointer">
                  <span className="text-[10px] px-2 py-1 rounded-lg" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>
                    {uploading ? "جارٍ الرفع..." : "اختر صورة"}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "badge")} disabled={uploading} />
                </label>
              </div>
            </div>

            {/* Frame */}
            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.2)" }}>
                {framePreview ? <img src={framePreview} alt="" className="w-full h-full object-contain" /> : <span className="text-xl">🖼️</span>}
              </div>
              <div className="flex-1">
                <p className="text-white text-xs font-bold mb-1">إطار الصورة الشخصية</p>
                <p className="text-gray-500 text-[9px] mb-1">يُضاف تلقائياً للحقيبة عند الشراء</p>
                <label className="cursor-pointer">
                  <span className="text-[10px] px-2 py-1 rounded-lg" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>
                    {uploading ? "جارٍ الرفع..." : "اختر صورة PNG"}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "frame")} disabled={uploading} />
                </label>
              </div>
            </div>

            {/* Chat Bubble */}
            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.2)" }}>
                {chatBubblePreview ? <img src={chatBubblePreview} alt="" className="w-full h-full object-contain" /> : <span className="text-xl">💬</span>}
              </div>
              <div className="flex-1">
                <p className="text-white text-xs font-bold mb-1">فقاعة الدردشة</p>
                <p className="text-gray-500 text-[9px] mb-1">تظهر خلف رسائل المستخدم في الدردشة</p>
                <label className="cursor-pointer">
                  <span className="text-[10px] px-2 py-1 rounded-lg" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>
                    {uploading ? "جارٍ الرفع..." : "اختر صورة"}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "bubble")} disabled={uploading} />
                </label>
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="text-gray-400 text-xs mb-2 block">المميزات</label>
            <div className="grid grid-cols-2 gap-2">
              {features.map(([label, val, setter]: any) => (
                <label key={label} className="flex items-center gap-2 bg-white/5 rounded-xl p-2.5 cursor-pointer">
                  <div onClick={() => setter(!val)}
                    className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: val ? "#fbbf24" : "rgba(255,255,255,0.1)", border: val ? "none" : "1px solid rgba(255,255,255,0.2)" }}>
                    {val && <span className="text-black text-xs font-black">✓</span>}
                  </div>
                  <span className="text-white text-xs">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Seat order */}
          <div>
            <label className="text-gray-400 text-xs mb-1 block">ترتيب المقعد في الغرفة (كلما كان أعلى = أولوية أكبر)</label>
            <input type="number" min="0" value={seatOrder} onChange={(e) => setSeatOrder(+e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm" />
          </div>

          {/* Title upload */}
          <VipTitleUpload titlePreview={titlePreview} uploading={uploading} onUpload={(e) => handleUpload(e, "title")} />

          <div className="flex gap-3">
            <button onClick={() => { resetForm(); setMode("list"); }} className="flex-1 py-3 rounded-xl font-bold text-gray-400 text-sm"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>إلغاء</button>
            <button onClick={handleSave} disabled={saving || uploading}
              className="flex-1 py-3 rounded-xl font-bold text-black disabled:opacity-50 text-sm"
              style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}>
              {saving ? "جارٍ الحفظ..." : editingLevel ? "💾 تحديث" : "💾 حفظ"}
            </button>
          </div>
        </div>
      )}

      {/* Upgrade Mode */}
      {mode === "upgrade" && (
        <div className="p-4 space-y-4 pb-20">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">SAKI ID للمستخدم</label>
            <input type="text" value={targetSakiId} onChange={(e) => setTargetSakiId(e.target.value)}
              placeholder="أدخل SAKI ID"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">مستوى VIP</label>
              <select value={upgradeLevel} onChange={(e) => setUpgradeLevel(+e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white">
                {vipLevels.map((lvl) => (
                  <option key={lvl.id} value={lvl.level} style={{ background: "#1a0035" }}>{lvl.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-2 block">المدة (أيام)</label>
              <input type="number" min="1" value={upgradeDuration ?? ""} onChange={(e) => setUpgradeDuration(e.target.value ? +e.target.value : undefined)}
                placeholder="دائم"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
            </div>
          </div>
          <button onClick={handleUpgrade} disabled={saving}
            className="w-full py-4 rounded-xl font-bold text-black disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}>
            {saving ? "جارٍ الترقية..." : "⬆️ ترقية المستخدم"}
          </button>
        </div>
      )}

      </div>{/* end scrollable */}
    </div>
  );
}
