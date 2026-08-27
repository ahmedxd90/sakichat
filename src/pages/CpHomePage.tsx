// @ts-nocheck
import { supabase } from "../lib/supabaseClient";
import { useProfile } from "../components/ProfileManager";
import { useState, useEffect } from "react";
import { toast } from "../lib/toast";
import CpRingFriendsSheet from "../components/CpRingFriendsSheet";

interface CpHomePageProps {
  userId: string;
  onBack: () => void;
  onMessage?: (userId: string) => void;
  onProfile?: (userId: string) => void;
}

const LEVEL_THRESHOLDS = [0, 5000000, 10000000, 15000000, 20000000, 30000000];
const LEVEL_NAMES = ["بيت صغير", "بيت مريح", "بيت جميل", "قصر صغير", "قصر فاخر"];
const LEVEL_ICONS = ["🏠", "🏡", "🏘️", "🏰", "👑"];
const LEVEL_COLORS = ["#6b7280", "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"];

const GIFTS = [
  { type: "rose", emoji: "🌹", name: "وردة", cost: 50 },
  { type: "star", emoji: "⭐", name: "نجمة", cost: 150 },
  { type: "cake", emoji: "🎂", name: "كعكة", cost: 100 },
  { type: "diamond", emoji: "💎", name: "ماسة", cost: 200 },
  { type: "ring", emoji: "💍", name: "خاتم", cost: 300 },
  { type: "crown", emoji: "👑", name: "تاج", cost: 500 },
];

function FloatingHeart({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute pointer-events-none select-none animate-bounce"
      style={{ fontSize: 18, opacity: 0.6, ...style }}
    >
      💕
    </div>
  );
}

function LevelProgressBar({ current, threshold, nextThreshold, level }: any) {
  const color = LEVEL_COLORS[level - 1] ?? "#a855f7";
  const progress = nextThreshold
    ? Math.min(100, ((current - threshold) / (nextThreshold - threshold)) * 100)
    : 100;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold" style={{ color }}>{LEVEL_ICONS[level - 1]} {LEVEL_NAMES[level - 1]}</span>
        {nextThreshold && (
          <span className="text-xs text-gray-400">{current.toLocaleString()} / {nextThreshold.toLocaleString()}</span>
        )}
      </div>
      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)`, boxShadow: `0 0 8px ${color}80` }}
        />
      </div>
    </div>
  );
}

function PetCard({ name, emoji, isOwned, onRename }: { name: string; emoji: string; isOwned: boolean; onRename: () => void }) {
  return (
    <div
      className="flex-1 rounded-2xl p-3 flex flex-col items-center gap-2 relative overflow-hidden"
      style={{
        background: isOwned ? "rgba(255,20,147,0.1)" : "rgba(255,255,255,0.04)",
        border: isOwned ? "1px solid rgba(255,20,147,0.3)" : "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <span className="text-3xl">{emoji}</span>
      <p className="text-white text-xs font-bold text-center">{isOwned ? name : "غير مملوك"}</p>
      {isOwned && (
        <button
          onClick={onRename}
          className="text-[10px] px-2 py-0.5 rounded-full font-bold"
          style={{ background: "rgba(255,20,147,0.2)", color: "#ff69b4", border: "1px solid rgba(255,20,147,0.3)" }}
        >
          تغيير الاسم
        </button>
      )}
    </div>
  );
}

export default function CpHomePage({ userId, onBack, onMessage, onProfile }: CpHomePageProps) {
  const { profile: myProfile } = useProfile();
  const [home, setHome] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('cp_homes').select('*').or(`owner_user_id.eq.${userId},partner_user_id.eq.${userId}`).maybeSingle();
      setHome(data);
    };
    fetchData();
  }, [userId]);

  const sendGift = async (args: any) => ({ level: 1 });
  const pendingMarriage = null;
  const acceptMarriageRequest = async (args: any) => {};
  const rejectMarriageRequest = async (args: any) => {};
  const setPetName = async (args: any) => {};
  const updateMarriageStart = async (args: any) => {};
  const divorceCp = async (args: any) => {};

  const [sendingGift, setSendingGift] = useState<string | null>(null);
  const [showGiftSheet, setShowGiftSheet] = useState(false);
  const [showPetSheet, setShowPetSheet] = useState<"cat" | "dog" | null>(null);
  const [petNameInput, setPetNameInput] = useState("");
  const [petLoading, setPetLoading] = useState(false);
  const [showMarriageSheet, setShowMarriageSheet] = useState(false);
  const [showMarriageDateSheet, setShowMarriageDateSheet] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDivorceConfirm, setShowDivorceConfirm] = useState(false);
  const [divorceLoading, setDivorceLoading] = useState(false);
  const [marriageDateInput, setMarriageDateInput] = useState("");
  const [marriageLoading, setMarriageLoading] = useState(false);
  const [hearts, setHearts] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);

  const isMe = myProfile?.user_id === userId;


  // Floating hearts animation
  useEffect(() => {
    const interval = setInterval(() => {
      const id = Date.now();
      setHearts((prev) => [
        ...prev.slice(-6),
        {
          id,
          style: {
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 60}%`,
            animationDuration: `${1.5 + Math.random()}s`,
          },
        },
      ]);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const handleSendGift = async (giftType: string) => {
    setSendingGift(giftType);
    try {
      const result = await sendGift({ homeUserId: userId, giftType: giftType as any });
      toast.success(`تم إرسال الهدية! 🎁 المستوى: ${result.level}`);
      setShowGiftSheet(false);
    } catch (e: any) {
      toast.error(e.message ?? "فشل إرسال الهدية");
    } finally {
      setSendingGift(null);
    }
  };

  const handleSetPetName = async () => {
    if (!showPetSheet || !petNameInput.trim()) return;
    setPetLoading(true);
    try {
      await setPetName({ petType: showPetSheet, name: petNameInput.trim() });
      toast.success("تم تغيير اسم الحيوان الأليف ✅");
      setShowPetSheet(null);
      setPetNameInput("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPetLoading(false);
    }
  };

  const handleUpdateMarriage = async () => {
    if (!marriageDateInput) return;
    setMarriageLoading(true);
    try {
      const ts = new Date(marriageDateInput).getTime();
      await updateMarriageStart({ startDate: ts });
      toast.success("تم تحديث تاريخ الزواج ✅");
      setShowMarriageDateSheet(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setMarriageLoading(false);
    }
  };

  const getMarriageDays = () => {
    if (!home?.marriage_day_start) return 0;
    return Math.floor((Date.now() - home.marriageDayStart) / (1000 * 60 * 60 * 24));
  };

  if (home === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d002a" }}>
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (home === null) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: "radial-gradient(circle at 50% 25%,#3b124d,#0d002a 65%)" }} dir="rtl">
        <button onClick={onBack} className="absolute left-4 top-10 h-10 w-10 rounded-full bg-white/10 text-2xl text-white">‹</button>
        <div className="relative"><div className="text-8xl opacity-80 grayscale">🏠</div><span className="absolute -right-4 -top-3 text-4xl grayscale">💔</span></div>
        <p className="text-xl font-black text-white">أنت لست مرتبطًا بعد</p>
        <p className="max-w-xs text-sm leading-6 text-pink-200">أنشئ بيت حب جميلًا مع شخص مميز، وابدأ رحلة CP والهدايا والمستويات.</p>
        <button onClick={() => setShowMarriageSheet(true)} className="rounded-full px-8 py-4 font-black text-white shadow-xl" style={{ background: "linear-gradient(135deg,#ff4d8d,#a855f7)" }}>💍 إضافة CP</button>
        {pendingMarriage && <div className="mt-3 w-full max-w-sm rounded-3xl border border-pink-300/30 bg-white/10 p-4 text-white backdrop-blur"><p className="font-black">{pendingMarriage.sender.name} يريد الزواج منك 💍</p><p className="mt-1 text-xs text-pink-100">هل أنت موافق؟ سيُخصم 300,000 من المرسل عند القبول.</p><div className="mt-3 flex gap-2"><button onClick={async () => { try { await acceptMarriageRequest({ requestId: pendingMarriage._id }); toast.success("تم الزواج! مبروك لكما 💍"); } catch (e: any) { toast.error(e.message); } }} className="flex-1 rounded-full bg-pink-500 py-2 font-black text-white">موافق</button><button onClick={async () => { try { await rejectMarriageRequest({ requestId: pendingMarriage._id }); toast.success("تم رفض الطلب"); } catch (e: any) { toast.error(e.message); } }} className="flex-1 rounded-full bg-white/10 py-2 font-bold text-white">رفض</button></div></div>}
        {showMarriageSheet && <CpRingFriendsSheet onClose={() => setShowMarriageSheet(false)} onSent={() => setShowMarriageSheet(false)} />}
      </div>
    );
  }

  const level = home?.level ?? 1;
  const levelColor = LEVEL_COLORS[level - 1] ?? "#a855f7";
  const levelIcon = LEVEL_ICONS[level - 1] ?? "🏠";
  const marriageDays = getMarriageDays();

  return (
    <div
      className="relative flex flex-col min-h-screen"
      dir="rtl"
      style={{
        background: "linear-gradient(180deg, #1a0030 0%, #0d001f 50%, #0a0015 100%)",
        backgroundImage: "linear-gradient(180deg, rgba(26,0,48,0.78), rgba(13,0,31,0.92)), url('/assets/cp-love-home-preview.png')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >

      <div className="fixed inset-x-0 top-0 z-[300] flex h-[72px] items-center justify-between border-b border-pink-300/20 bg-[#16002b]/95 px-4 shadow-xl backdrop-blur-xl">
        <button onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white" aria-label="رجوع"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg></button>
        <h1 className="text-base font-black text-white">🏠 منزل CP</h1>
        <button onClick={() => setShowSettings(true)} className="flex h-11 w-11 items-center justify-center rounded-full border border-pink-300/40 bg-pink-500/20 text-xl text-white shadow-lg shadow-pink-500/20 active:scale-90" aria-label="إعدادات بيت الحب">⚙️</button>
      </div>
      {/* ── HEADER ── */}
      <div className="relative overflow-hidden flex-shrink-0 pt-[72px]" style={{ minHeight: 200 }}>
        {/* Animated background */}
                  <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, rgba(255,20,147,0.25) 0%, rgba(168,85,247,0.2) 50%, rgba(255,20,147,0.1) 100%)`,
            }}
          />

        {/* Floating hearts */}
        {hearts.map((h) => (
          <FloatingHeart key={h.id} style={h.style} />
        ))}
        {/* Decorative circles */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute rounded-full animate-pulse pointer-events-none"
            style={{
              width: 80 + i * 60,
              height: 80 + i * 60,
              border: `1px solid rgba(255,20,147,${0.15 - i * 0.04})`,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              animationDuration: `${2 + i * 0.5}s`,
            }}
          />
        ))}


        {/* Avatars */}
        <div className="flex items-center justify-center gap-6 pt-16 pb-4 relative z-10">
          {/* Owner */}
          <div className="flex flex-col items-center gap-1">
            <button onClick={() => onProfile?.(userId)}>
              <div
                className="rounded-full p-[3px]"
                style={{ background: "linear-gradient(135deg,#ff4d6d,#ff85a1)", boxShadow: "0 0 20px rgba(255,77,109,0.5)" }}
              >
                <div className="rounded-full overflow-hidden" style={{ width: 72, height: 72 }}>
                  {home?.ownerAvatarUrl ? (
                    <img src={home.ownerAvatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-black text-2xl">{home?.ownerName?.[0]}</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
            <span className="text-white text-xs font-bold max-w-[70px] truncate text-center">{home?.ownerName}</span>
          </div>

          {/* Heart center */}
          <div className="flex flex-col items-center gap-1 relative">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <img src="/assets/cp-love-ring.svg" alt="خاتم الحب" className="absolute h-14 w-14 object-contain opacity-90 animate-pulse" />
              <span className="text-3xl animate-bounce" style={{ animationDuration: "0.8s" }}>💗</span>
              <span className="absolute text-lg animate-ping opacity-40" style={{ animationDuration: "1.5s" }}>💕</span>
            </div>
            <span className="text-pink-300 text-[10px] font-black tracking-widest">CP</span>
          </div>

          {/* Partner */}
          {home?.partnerUserId ? (
            <div className="flex flex-col items-center gap-1">
              <button onClick={() => home.partner_user_id && onProfile?.(home.partner_user_id)}>
                <div
                  className="rounded-full p-[3px]"
                  style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)", boxShadow: "0 0 20px rgba(168,85,247,0.5)" }}
                >
                  <div className="rounded-full overflow-hidden" style={{ width: 72, height: 72 }}>
                    {home.partnerAvatarUrl ? (
                      <img src={home.partnerAvatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                        <span className="text-white font-black text-2xl">{home.partnerName?.[0]}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
              <span className="text-white text-xs font-bold max-w-[70px] truncate text-center">{home.partnerName}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div
                className="rounded-full flex items-center justify-center"
                style={{ width: 72, height: 72, background: "rgba(255,255,255,0.05)", border: "2px dashed rgba(255,255,255,0.2)" }}
              >
                <span className="text-2xl opacity-40">💑</span>
              </div>
              <span className="text-gray-500 text-xs">لا يوجد شريك</span>
            </div>
          )}
        </div>
      </div>

      {/* ── MARRIAGE DAYS ── */}
      <div className="mx-4 mt-2">
        <div
          className="rounded-2xl p-4 flex items-center justify-between"
          style={{ background: "rgba(255,20,147,0.08)", border: "1px solid rgba(255,20,147,0.2)" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">💍</span>
            <div>
              <p className="text-white font-black text-base">{marriageDays} يوم</p>
              <p className="text-pink-300/70 text-xs">معاً منذ الزواج</p>
            </div>
          </div>
          {isMe && (
            <button
              onClick={() => setShowMarriageDateSheet(true)}
              className="text-xs px-3 py-1.5 rounded-xl font-bold"
              style={{ background: "rgba(255,20,147,0.15)", color: "#ff69b4", border: "1px solid rgba(255,20,147,0.3)" }}
            >
              تعديل
            </button>
          )}
        </div>
      </div>

      {/* ── LEVEL CARD ── */}
      <div className="mx-4 mt-3">
        <div
          className="rounded-2xl p-4"
          style={{ background: `${levelColor}12`, border: `1px solid ${levelColor}40` }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: `${levelColor}20` }}
            >
              {levelIcon}
            </div>
            <div className="flex-1">
              <p className="text-white font-black text-base">{LEVEL_NAMES[level - 1]}</p>
              <p className="text-gray-400 text-xs">المستوى {level} من 5</p>
            </div>
            <div className="text-right">
              <p className="font-black text-lg" style={{ color: levelColor }}>{(home?.totalGiftsReceived ?? 0).toLocaleString()}</p>
              <p className="text-gray-500 text-[10px]">عملة مُهداة · الهدف {home?.nextThreshold ? home.nextThreshold.toLocaleString() : "مكتمل"}</p>
            </div>
          </div>
          <LevelProgressBar
            current={home?.totalGiftsReceived ?? 0}
            threshold={home?.currentThreshold ?? 0}
            nextThreshold={home?.nextThreshold ?? null}
            level={level}
          />
          {!home?.nextThreshold && (
            <p className="text-center text-xs mt-2 font-bold" style={{ color: levelColor }}>🏆 أعلى مستوى!</p>
          )}
        </div>
      </div>

      {/* ── PETS ── */}
      <div className="mx-4 mt-3">
        <p className="text-gray-400 text-xs font-bold mb-2 px-1">🐾 الحيوانات الأليفة</p>
        <div className="flex gap-3">
          <PetCard
            name={home?.catName ?? "ميمي"}
            emoji="🐱"
            isOwned={home?.hasCat ?? false}
            onRename={() => { setShowPetSheet("cat"); setPetNameInput(home?.catName ?? ""); }}
          />
          <PetCard
            name={home?.dogName ?? "بوبي"}
            emoji="🐶"
            isOwned={home?.hasDog ?? false}
            onRename={() => { setShowPetSheet("dog"); setPetNameInput(home?.dogName ?? ""); }}
          />
        </div>
      </div>

      {/* ── RECENT GIFTS ── */}
      {(home?.recentGifts?.length ?? 0) > 0 && (
        <div className="mx-4 mt-3">
          <p className="text-gray-400 text-xs font-bold mb-2 px-1">🎁 آخر الهدايا</p>
          <div className="space-y-2">
            {home!.recentGifts.slice(0, 5).map((gift: any) => {
              const giftInfo = GIFTS.find((g) => g.type === gift.giftType);
              return (
                <div
                  key={gift._id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <span className="text-xl">{giftInfo?.emoji ?? "🎁"}</span>
                  <div className="flex-1">
                    <p className="text-white text-xs font-bold">{gift.senderName}</p>
                    {gift.message && <p className="text-gray-400 text-[10px] mt-0.5 line-clamp-1">{gift.message}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 text-xs font-bold">+{gift.coins} 🪙</p>
                    <p className="text-gray-600 text-[10px]">{new Date(gift.createdAt).toLocaleDateString("ar")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ACTION BUTTONS ── */}
      <div className="mx-4 mt-4 mb-10 flex flex-col gap-3">
        {!isMe && (
          <button
            onClick={() => setShowGiftSheet(true)}
            className="w-full py-4 rounded-2xl text-white font-black text-base active:scale-[0.98] transition-all"
            style={{
              background: "linear-gradient(135deg, #ff4d6d, #ff85a1, #a855f7)",
              boxShadow: "0 6px 20px rgba(255,77,109,0.4)",
            }}
          >
            🎁 أرسل هدية للمنزل
          </button>
        )}
        {!isMe && onMessage && home?.partnerUserId === undefined && (
          <button
            onClick={() => onMessage(userId)}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm active:scale-[0.98]"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            💬 مراسلة صاحب المنزل
          </button>
        )}
        {isMe && (
          <div
            className="rounded-2xl p-4 text-center"
            style={{ background: "rgba(255,20,147,0.06)", border: "1px solid rgba(255,20,147,0.15)" }}
          >
            <p className="text-pink-300 text-sm font-bold">🏠 هذا منزلك</p>
            <p className="text-gray-500 text-xs mt-1">يمكن للآخرين إرسال هدايا لمنزلك لرفع مستواه</p>
          </div>
        )}
      </div>

      {/* ── GIFT SHEET ── */}
      {showGiftSheet && (
        <div className="fixed inset-0 z-[200] flex items-end" onClick={() => setShowGiftSheet(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full rounded-t-3xl p-6 pb-10"
            style={{ background: "#0d002a", border: "1px solid rgba(255,20,147,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "rgba(255,20,147,0.4)" }} />
            <h3 className="text-white font-black text-lg mb-1 text-center">🎁 أرسل هدية</h3>
            <p className="text-gray-400 text-xs text-center mb-5">
              رصيدك: <span className="text-yellow-400 font-bold">{(myProfile?.goldCoins ?? 0).toLocaleString()} 🪙</span>
            </p>
            <div className="grid grid-cols-3 gap-3">
              {GIFTS.map((gift) => (
                <button
                  key={gift.type}
                  onClick={() => handleSendGift(gift.type)}
                  disabled={sendingGift !== null || (myProfile?.goldCoins ?? 0) < gift.cost}
                  className="flex flex-col items-center gap-2 rounded-2xl p-3 active:scale-95 transition-all disabled:opacity-40"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  {sendingGift === gift.type ? (
                    <div className="w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-3xl">{gift.emoji}</span>
                  )}
                  <span className="text-white text-xs font-bold">{gift.name}</span>
                  <span className="text-yellow-400 text-[10px] font-bold">{gift.cost} 🪙</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PET NAME SHEET ── */}
      {showPetSheet && (
        <div className="fixed inset-0 z-[200] flex items-end" onClick={() => setShowPetSheet(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full rounded-t-3xl p-6 pb-10"
            style={{ background: "#0d002a", border: "1px solid rgba(255,20,147,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "rgba(255,20,147,0.4)" }} />
            <h3 className="text-white font-black text-lg mb-4 text-center">
              {showPetSheet === "cat" ? "🐱 اسم القطة" : "🐶 اسم الكلب"}
            </h3>
            <input
              value={petNameInput}
              onChange={(e) => setPetNameInput(e.target.value)}
              placeholder="أدخل الاسم..."
              className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none mb-4"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
              maxLength={20}
            />
            <button
              onClick={handleSetPetName}
              disabled={petLoading || !petNameInput.trim()}
              className="w-full py-4 rounded-2xl text-white font-black text-base disabled:opacity-40 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #ff4d6d, #a855f7)", boxShadow: "0 4px 15px rgba(255,77,109,0.4)" }}
            >
              {petLoading ? "جارٍ الحفظ..." : "حفظ الاسم"}
            </button>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[500] flex flex-col bg-[#0d002a]" dir="rtl">
          <header className="flex items-center justify-between border-b border-pink-400/20 px-4 pb-4 pt-10 text-white">
            <button onClick={() => setShowSettings(false)} className="h-10 w-10 rounded-full bg-white/10 text-2xl">‹</button>
            <h2 className="font-black text-lg">إعدادات بيت الحب</h2><span className="w-10" />
          </header>
          <main className="flex-1 p-5">
            <div className="rounded-3xl border border-red-300/20 bg-red-950/20 p-5">
              <div className="flex items-center gap-3"><span className="text-3xl">💔</span><div><h3 className="font-black text-white">فك ارتباط CP</h3><p className="mt-1 text-xs leading-5 text-red-200/70">سيتم هدم بيت الحب وإزالة الارتباط من الطرفين.</p></div></div>
              <button onClick={() => setShowDivorceConfirm(true)} className="mt-5 w-full rounded-full border border-red-300/30 bg-red-500/20 py-3 font-black text-red-100">طلاق / فك الارتباط</button>
            </div>
          </main>
        </div>
      )}

      {showDivorceConfirm && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/70 px-6" dir="rtl">
          <div className="w-full max-w-sm rounded-3xl border border-pink-200/20 bg-[#1d092b] p-6 text-center shadow-2xl">
            <div className="text-5xl">💔</div><h3 className="mt-3 text-lg font-black text-white">هل تريد فك ارتباط CP؟</h3>
            <p className="mt-2 text-sm leading-6 text-pink-100/70">سيتم هدم بيت الحب وإنهاء الزواج للطرفين. تكلفة الانفصال هي <b className="text-amber-300">150,000 عملة ذهبية</b>.</p>
            <div className="mt-5 flex gap-3"><button onClick={() => setShowDivorceConfirm(false)} className="flex-1 rounded-full bg-white/10 py-3 font-bold text-white">لا</button><button disabled={divorceLoading} onClick={async () => { setDivorceLoading(true); try { await divorceCp(); toast.success("تم فك ارتباط CP وهدم بيت الحب"); setShowDivorceConfirm(false); setShowSettings(false); onBack(); } catch (e: any) { toast.error(e.message ?? "تعذر إتمام الطلاق"); } finally { setDivorceLoading(false); } }} className="flex-1 rounded-full bg-gradient-to-r from-red-500 to-pink-500 py-3 font-black text-white disabled:opacity-60">{divorceLoading ? "جارٍ التنفيذ..." : "موافق 150K"}</button></div>
          </div>
        </div>
      )}

      {/* ── MARRIAGE DATE SHEET ── */}
      {showMarriageDateSheet && (
        <div className="fixed inset-0 z-[200] flex items-end" onClick={() => setShowMarriageDateSheet(false)} >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full rounded-t-3xl p-6 pb-10"
            style={{ background: "#0d002a", border: "1px solid rgba(255,20,147,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "rgba(255,20,147,0.4)" }} />
            <h3 className="text-white font-black text-lg mb-4 text-center">💍 تاريخ الزواج</h3>
            <input
              type="date"
              value={marriageDateInput}
              onChange={(e) => setMarriageDateInput(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none mb-4"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", colorScheme: "dark" }}
            />
            <button
              onClick={handleUpdateMarriage}
              disabled={marriageLoading || !marriageDateInput}
              className="w-full py-4 rounded-2xl text-white font-black text-base disabled:opacity-40 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #ff4d6d, #a855f7)", boxShadow: "0 4px 15px rgba(255,77,109,0.4)" }}
            >
              {marriageLoading ? "جارٍ الحفظ..." : "حفظ التاريخ"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
