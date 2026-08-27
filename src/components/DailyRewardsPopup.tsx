// @ts-nocheck
import { supabase } from "../lib/supabaseClient";
import { useState, useEffect } from "react";
import { toast } from "../lib/toast";
import confetti from "canvas-confetti";

const TYPE_COLORS: Record<string, string> = {
  coins: "#fbbf24", gift: "#f472b6", frame: "#60a5fa",
  entry: "#34d399", vip: "#a855f7", aristocracy: "#f97316",
};
const TYPE_ICONS: Record<string, string> = {
  coins: "🪙", gift: "🎁", frame: "🖼️", entry: "🚪", vip: "👑", aristocracy: "💎",
};
const   TYPE_LABELS: Record<string, string> = {
  coins: "عملات", gift: "هدية", frame: "إطار", entry: "دخولية", vip: "PRO", aristocracy: "استقراطية",
};

function useCountdown() {
  const [t, setT] = useState("");
  useEffect(() => {
    const upd = () => {
      const ms = 86400000 - (Date.now() % 86400000);
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setT(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    };
    upd(); const id = setInterval(upd, 1000); return () => clearInterval(id);
  }, []);
  return t;
}

function getRewardDisplay(reward: any) {
  if (!reward) return { icon: "🪙", label: "مكافأة", img: null, sub: "", type: "coins" };
  const type = reward.rewardType ?? "coins";
  const img = reward.giftImageUrl ?? reward.storeItemImageUrl ?? null;
  switch (type) {
    case "coins": return { icon: "🪙", label: `${(reward.coins ?? 0).toLocaleString()} عملة`, img: null, sub: "", type };
    case "gift": return { icon: "🎁", label: reward.giftName ?? "هدية", img, sub: "هدية مجانية", type };
    case "frame": return { icon: "🖼️", label: reward.storeItemName ?? "إطار", img, sub: "إطار حصري", type };
    case "entry": return { icon: "🚪", label: reward.storeItemName ?? "دخولية", img, sub: "دخولية حصرية", type };
    case "vip": return { icon: "👑", label: `VIP ${reward.vipLevel ?? 1}`, img: null, sub: `${reward.vipDays ?? 0} يوم`, type };
    case "aristocracy": return { icon: "💎", label: `استقراطية ${reward.aristocracyLevel ?? 1}`, img: null, sub: `${reward.aristocracyDays ?? 0} يوم`, type };
    default: return { icon: reward.icon ?? "🪙", label: `${(reward.coins ?? 0).toLocaleString()} عملة`, img: null, sub: "", type };
  }
}

// مكوّن الصورة المصغرة لكل يوم في الشبكة
function DayThumb({ reward, color, icon }: { reward: any; color: string; icon: string }) {
  const img = reward?.giftImageUrl ?? reward?.storeItemImageUrl ?? null;
  const type = reward?.rewardType ?? "coins";

  if (img) {
    return (
      <div className="relative w-9 h-9 rounded-lg overflow-hidden mx-auto flex-shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}40` }}>
        <img src={img} alt="" className="w-full h-full object-contain p-0.5" />
        {/* شارة صغيرة للنوع */}
        <div className="absolute bottom-0 inset-x-0 text-center"
          style={{ background: `${color}dd`, fontSize: 6, color: "#fff", fontWeight: 900, lineHeight: "10px" }}>
          {TYPE_LABELS[type] ?? type}
        </div>
      </div>
    );
  }

  return (
    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xl mx-auto"
      style={{ background: `${color}18` }}>
      {icon}
    </div>
  );
}

// مكوّن معاينة المكافأة الكبيرة
function RewardPreviewCard({ reward, color, icon, img, label, sub, dayIndex }: any) {
  return (
    <div className="mx-4 mb-3 rounded-2xl p-3 flex items-center gap-3"
      style={{ background: `${color}15`, border: `1px solid ${color}40` }}>
      {img ? (
        <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}50` }}>
          <img src={img} alt={label} className="w-full h-full object-contain p-1" />
          {/* شارة النوع */}
          <div className="absolute bottom-0 inset-x-0 text-center py-0.5"
            style={{ background: `${color}ee`, fontSize: 8, color: "#fff", fontWeight: 900 }}>
            {TYPE_LABELS[reward.rewardType] ?? ""}
          </div>
        </div>
      ) : (
        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
          style={{ background: `${color}20` }}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.55)" }}>
          مكافأة اليوم {dayIndex + 1}
        </p>
        <p className="text-white font-black text-base truncate">{label}</p>
        {sub && <p className="text-xs font-bold mt-0.5" style={{ color }}>{sub}</p>}
      </div>
    </div>
  );
}

interface DailyRewardsPopupProps { onClose: () => void; }

export default function DailyRewardsPopup({ onClose }: DailyRewardsPopupProps) {
  const [checkinStatus, setCheckinStatus] = useState<any>(null);
  const countdown = useCountdown();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Placeholder for checkin status
        setCheckinStatus({ checkedInToday: true, currentStreak: 1, nextDay: 2, rewards: [] });
      }
    };
    fetchData();
  }, []);

  const claimCheckin = async () => ({ reward: null });
  const [claiming, setClaiming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [claimedReward, setClaimedReward] = useState<any>(null);
  const [closing, setClosing] = useState(false);

  const handleClose = () => { setClosing(true); setTimeout(onClose, 300); };

  const handleClaim = async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      const result = await claimCheckin();
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.7 }, colors: ["#FFD700","#FFA500","#a855f7","#ec4899","#fff"] });
      setTimeout(() => confetti({ particleCount: 60, spread: 90, origin: { y: 0.5, x: 0.2 }, colors: ["#FFD700","#FFA500"] }), 300);
      setTimeout(() => confetti({ particleCount: 60, spread: 90, origin: { y: 0.5, x: 0.8 }, colors: ["#a855f7","#ec4899"] }), 500);
      setClaimedReward(result.reward);
      setShowSuccess(true);
      setTimeout(() => onClose(), 1200);
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ");
    } finally { setClaiming(false); }
  };

  if (!checkinStatus) return null;
  const { checkedInToday, currentStreak, nextDay, rewards } = checkinStatus;
  // بعد الاستلام لا تظهر النافذة مرة أخرى حتى يبدأ اليوم التالي.
  if (checkedInToday) return null;
  const todayDayIndex = checkedInToday ? (currentStreak - 1) % 7 : (nextDay - 1) % 7;

  return (
    <>
      <style>{`
        @keyframes slideUpPopup { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes slideDownPopup { from{transform:translateY(0);opacity:1} to{transform:translateY(100%);opacity:0} }
        @keyframes zoomInPopup { from{transform:scale(0.7);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes floatChest { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-8px) rotate(2deg)} }
      `}</style>

      <div className="fixed inset-0 z-[500] flex items-end justify-center"
        style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>

                  <div className="w-[calc(100%-32px)] max-w-[360px] mx-auto mb-6 rounded-3xl overflow-hidden"

          style={{
            background: "linear-gradient(180deg,#0f0a1e 0%,#1a0a2e 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 -20px 60px rgba(168,85,247,0.3)",
            animation: closing ? "zoomOutPopup 0.25s ease-in forwards" : "zoomInPopup 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards",
            fontFamily: "'Cairo', sans-serif",
          }} dir="rtl">

          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-2">
            <div>
              <h3 className="text-white font-black text-base">📅 تسجيل الدخول اليومي</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-xs font-mono" style={{ color: "#FFD700" }}>ينتهي خلال: <b>{countdown}</b></span>
              </div>
            </div>
            <button onClick={handleClose} className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Streak */}
          <div className="flex items-center justify-center gap-3 px-5 py-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" }}>
              <span className="text-yellow-400 font-black text-sm">🔥 {currentStreak}</span>
              <span className="text-yellow-400/60 text-xs">يوم متتالي</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)" }}>
              <span className="text-purple-400 font-black text-sm">📅 {nextDay}</span>
              <span className="text-purple-400/60 text-xs">اليوم القادم</span>
            </div>
          </div>

          {/* 7-day grid — صور مصغرة محسّنة */}
          <div className="px-3 pb-2">
            <div className="grid grid-cols-3 gap-2 px-1">
              {(rewards ?? []).map((reward: any, i: number) => {
                const dayNum = i + 1;
                const isPast = currentStreak >= dayNum;
                const isCurrent = !checkedInToday && todayDayIndex === i;
                const isToday = checkedInToday && (currentStreak - 1) % 7 === i;
                const type = reward.rewardType ?? "coins";
                const color = TYPE_COLORS[type] ?? "#fbbf24";
                const icon = TYPE_ICONS[type] ?? reward.icon ?? "🪙";
                const labelShort = type === "coins"
                  ? `${((reward.coins ?? 0) / 1000).toFixed(0)}k`
                  : type === "vip" ? `V${reward.vipLevel}`
                  : type === "aristocracy" ? `A${reward.aristocracyLevel}`
                  : TYPE_LABELS[type] ?? type;
                return (
                  <div key={i} className={`relative rounded-xl p-2 text-center flex flex-col items-center gap-1 ${dayNum === 7 ? "col-span-3 w-28 mx-auto" : ""}`}
                    style={{
                      background: dayNum === 7 ? "linear-gradient(135deg,rgba(245,158,11,.28),rgba(168,85,247,.22))" : isToday ? "rgba(34,197,94,0.2)" : isCurrent ? `${color}25` : isPast ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.03)",
                      border: dayNum === 7 ? "2px solid #f59e0b" : isToday ? "2px solid #22c55e" : isCurrent ? `2px solid ${color}` : "1px solid rgba(255,255,255,0.08)",
                      boxShadow: dayNum === 7 ? "0 0 18px rgba(245,158,11,.4)" : isCurrent ? `0 0 14px ${color}70` : isToday ? "0 0 14px rgba(34,197,94,0.6)" : "none",
                      opacity: isPast && !isToday ? 0.55 : 1,
                    }}>
                    {/* طبقة "تم الاستلام" */}
                    {isPast && !isToday && (
                      <div className="absolute inset-0 rounded-xl flex items-center justify-center z-10"
                        style={{ background: "rgba(0,0,0,0.45)" }}>
                        <span className="text-green-400 text-base font-black">✓</span>
                      </div>
                    )}
                    {/* رقم اليوم */}
                    <p className="text-[8px] font-bold leading-none"
                      style={{ color: isCurrent || isToday ? color : "rgba(255,255,255,0.35)" }}>
                      {dayNum}
                    </p>
                    {/* الصورة المصغرة */}
                    <DayThumb reward={reward} color={color} icon={icon} />
                    {/* النص */}
                    <p className="text-[7px] font-bold truncate w-full text-center leading-none"
                      style={{ color: isCurrent || isToday ? color : "rgba(255,255,255,0.4)" }}>
                      {labelShort}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* معاينة مكافأة اليوم */}
          {!checkedInToday && rewards && rewards[todayDayIndex] && (() => {
            const r = rewards[todayDayIndex];
            const { icon, label, img, sub, type } = getRewardDisplay(r);
            const color = TYPE_COLORS[type] ?? "#fbbf24";
            return (
              <RewardPreviewCard
                reward={r} color={color} icon={icon}
                img={img} label={label} sub={sub}
                dayIndex={todayDayIndex}
              />
            );
          })()}

          {/* زر الاستلام */}
          <div className="px-4 pb-6">
            {checkedInToday ? (
              <div className="w-full py-3.5 rounded-2xl text-center" style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)" }}>
                <p className="text-green-400 font-black text-sm">✅ تم استلام مكافأة اليوم!</p>
                <p className="text-green-400/50 text-xs mt-0.5">عد غداً بعد {countdown}</p>
              </div>
            ) : (
              <button onClick={handleClaim} disabled={claiming}
                className="w-full py-4 rounded-2xl font-black text-black text-base active:scale-[0.98] transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#FFD700,#FFA500)", boxShadow: "0 6px 25px rgba(255,165,0,0.5)" }}>
                {claiming ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    جارٍ الاستلام...
                  </span>
                ) : "✨ استلم مكافأتك الآن!"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* نافذة نجاح الاستلام */}
      {showSuccess && claimedReward && (() => {
        const { icon, label, img, sub, type } = getRewardDisplay(claimedReward);
        const color = TYPE_COLORS[type] ?? "#fbbf24";
        return (
          <div className="fixed inset-0 z-[600] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.75)" }}>
            <div className="rounded-3xl p-7 text-center mx-5 max-w-xs w-full"
              style={{
                background: "rgba(15,10,30,0.98)",
                border: `1px solid ${color}60`,
                boxShadow: `0 0 60px ${color}40`,
                animation: "zoomInPopup 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
                fontFamily: "'Cairo', sans-serif",
              }} dir="rtl">
              <div className="text-5xl mb-3" style={{ animation: "floatChest 2s ease-in-out infinite" }}>🎉</div>
              <h4 className="text-white font-black text-xl mb-1">تم الاستلام!</h4>
              <p className="text-gray-400 text-sm mb-4">مبروك! تمت إضافة الجائزة لحسابك</p>
              <div className="rounded-2xl p-4 mb-4 flex flex-col items-center gap-2"
                style={{ background: `${color}15`, border: `1px solid ${color}40` }}>
                {img ? (
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden"
                    style={{ background: `${color}18`, border: `1px solid ${color}50` }}>
                    <img src={img} alt={label} className="w-full h-full object-contain p-1.5" />
                    {/* شارة النوع */}
                    <div className="absolute bottom-0 inset-x-0 text-center py-0.5"
                      style={{ background: `${color}ee`, fontSize: 9, color: "#fff", fontWeight: 900 }}>
                      {TYPE_LABELS[claimedReward.rewardType] ?? ""}
                    </div>
                  </div>
                ) : (
                  <div className="text-5xl">{icon}</div>
                )}
                <p className="font-black text-xl" style={{ color }}>{label}</p>
                {sub && <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>{sub}</p>}
              </div>
              <button onClick={() => { setShowSuccess(false); handleClose(); }}
                className="w-full py-3.5 rounded-2xl font-black text-black text-base active:scale-95"
                style={{ background: `linear-gradient(135deg,${color},${color}cc)` }}>
                رائع! 🎊
              </button>
            </div>
          </div>
        );
      })()}
    </>
  );
}
