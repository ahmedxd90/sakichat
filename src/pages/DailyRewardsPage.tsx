// @ts-nocheck
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { toast } from "../lib/toast";

interface DailyRewardsPageProps {
  onBack: () => void;
  initialTab?: "checkin" | "tasks";
}

const TYPE_COLORS: Record<string, string> = {
  coins: "#fbbf24", gift: "#f472b6", frame: "#60a5fa",
  entry: "#34d399", vip: "#a855f7", aristocracy: "#f97316",
};
const TYPE_ICONS: Record<string, string> = {
  coins: "🪙", gift: "🎁", frame: "🖼️", entry: "🚪", vip: "👑", aristocracy: "💎",
};
const TYPE_LABELS: Record<string, string> = {
  coins: "عملات", gift: "هدية", frame: "إطار", entry: "دخولية", vip: "PRO", aristocracy: "استقراطية",
};

function getRewardDisplay(reward: any) {
  if (!reward) return { icon: "🪙", label: "مكافأة", img: null, sub: "", color: "#fbbf24" };
  const type = reward.rewardType ?? "coins";
  const color = TYPE_COLORS[type] ?? "#fbbf24";
  switch (type) {
    case "coins": return { icon: "🪙", label: `${(reward.coins ?? 0).toLocaleString()}`, img: null, sub: "عملة ذهبية", color };
    case "gift": return { icon: "🎁", label: reward.giftName ?? "هدية", img: reward.giftImageUrl, sub: "هدية مجانية", color };
    case "frame": return { icon: "🖼️", label: reward.storeItemName ?? "إطار", img: reward.storeItemImageUrl, sub: "إطار حصري", color };
    case "entry": return { icon: "🚪", label: reward.storeItemName ?? "دخولية", img: reward.storeItemImageUrl, sub: "دخولية حصرية", color };
    case "vip": return { icon: "👑", label: `PRO ${reward.vipLevel ?? 1}`, img: null, sub: `${reward.vipDays ?? 0} يوم`, color };
    case "aristocracy": return { icon: "💎", label: `استقراطية ${reward.aristocracyLevel ?? 1}`, img: null, sub: `${reward.aristocracyDays ?? 0} يوم`, color };
    default: return { icon: reward.icon ?? "🪙", label: `${(reward.coins ?? 0).toLocaleString()}`, img: null, sub: "عملة ذهبية", color };
  }
}

function useUtcCountdown() {
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

const CAT_COLORS: Record<string, string> = {
  room: "#60a5fa", gift: "#f472b6", content: "#a78bfa", social: "#34d399",
};

export default function DailyRewardsPage({ onBack, initialTab = "checkin" }: DailyRewardsPageProps) {
  const checkinStatus = useQuery(api.dailyRewards.getCheckinStatus);
  const tasksData = useQuery(api.dailyRewards.getDailyTasksStatus);
  const claimCheckin = useMutation(api.dailyRewards.claimDailyCheckin);
  const claimTask = useMutation(api.dailyRewards.claimTaskReward);

  const [tab, setTab] = useState<"checkin" | "tasks">(initialTab);
  const [claiming, setClaiming] = useState(false);
  const [claimingTask, setClaimingTask] = useState<string | null>(null);
  const [showRewardAnim, setShowRewardAnim] = useState(false);
  const [lastReward, setLastReward] = useState<any>(null);

  const countdown = useUtcCountdown();
  const tasksArr: any[] = tasksData?.tasks ?? [];
  const totalReady = tasksArr.filter((t) => t.completed && !t.rewardClaimed).length;
  const totalDone = tasksArr.filter((t) => t.completed).length;
  const totalTasks = tasksArr.length;

  const handleCheckin = async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      const result = await claimCheckin();
      setLastReward(result.reward);
      setShowRewardAnim(true);
      setTimeout(() => setShowRewardAnim(false), 3500);
      const r = result.reward;
      const type = r.rewardType ?? "coins";
      if (type === "coins") toast.success(`🎉 +${(r.coins ?? 0).toLocaleString()} عملة ذهبية!`);
      else if (type === "gift") toast.success(`🎁 حصلت على هدية: ${r.giftName}!`);
      else if (type === "frame") toast.success(`🖼️ حصلت على إطار: ${r.storeItemName}!`);
      else if (type === "entry") toast.success(`🚪 حصلت على دخولية: ${r.storeItemName}!`);
      else if (type === "vip") toast.success(`👑 حصلت على VIP${r.vipLevel} لمدة ${r.vipDays} يوم!`);
      else if (type === "aristocracy") toast.success(`💎 حصلت على استقراطية ${r.aristocracyLevel} لمدة ${r.aristocracyDays} يوم!`);
      else toast.success(`🎉 تم تسجيل الدخول!`);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setClaiming(false); }
  };

  const handleClaimTask = async (taskId: string) => {
    setClaimingTask(taskId);
    try {
      const result = await claimTask({ taskId });
      toast.success(`✅ +${result.reward.toLocaleString()} 🪙`);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setClaimingTask(null); }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 relative overflow-hidden" dir="rtl"
      style={{ background: "linear-gradient(180deg,#0d002a 0%,#1a0035 50%,#0d002a 100%)" }}>

      <style>{`
        @keyframes bounceIn { 0%{transform:scale(0) rotate(-10deg);opacity:0} 60%{transform:scale(1.2) rotate(5deg);opacity:1} 100%{transform:scale(1) rotate(0deg);opacity:1} }
        @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 20px rgba(245,158,11,0.4)} 50%{box-shadow:0 0 40px rgba(245,158,11,0.8)} }
        .glow-btn { animation: glowPulse 2s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10"
        style={{ background: "rgba(13,0,42,0.95)" }}>
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center active:scale-95">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          <div className="flex flex-col items-center">
            <h2 className="text-white font-black text-base">🏆 المكافآت اليومية</h2>
            <p className="text-green-400 text-[10px] font-bold font-mono">يتجدد بعد: {countdown}</p>
          </div>
          <div className="w-9" />
        </div>
        <div className="flex px-4 pb-3 gap-2">
          <button onClick={() => setTab("checkin")}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 relative"
            style={tab === "checkin"
              ? { background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "white", boxShadow: "0 4px 15px rgba(245,158,11,0.4)" }
              : { background: "rgba(255,255,255,0.06)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.1)" }}>
            📅 تسجيل الدخول
            {checkinStatus && !checkinStatus.checkedInToday && (
              <span className="absolute top-1 left-1 w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            )}
          </button>
          <button onClick={() => setTab("tasks")}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 relative"
            style={tab === "tasks"
              ? { background: "linear-gradient(135deg,#a855f7,#ec4899)", color: "white", boxShadow: "0 4px 15px rgba(168,85,247,0.4)" }
              : { background: "rgba(255,255,255,0.06)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.1)" }}>
            ✅ المهام اليومية
            {totalReady > 0 && (
              <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-green-500 text-white text-[9px] flex items-center justify-center font-black">{totalReady}</span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative z-10 pb-10">
        {tab === "checkin" ? (
          <CheckinTab status={checkinStatus} onClaim={handleCheckin} claiming={claiming} countdown={countdown} />
        ) : (
          <TasksTab tasks={tasksArr} onClaim={handleClaimTask} claimingTask={claimingTask} totalDone={totalDone} total={totalTasks} countdown={countdown} />
        )}
      </div>

      {/* Reward animation */}
      {showRewardAnim && lastReward && (() => {
        const { icon, label, img, sub, color } = getRewardDisplay(lastReward);
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-4" style={{ animation: "bounceIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards" }}>
              <div className="rounded-3xl px-8 py-6 text-center"
                style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)", border: `1px solid ${color}60`, boxShadow: `0 0 60px ${color}50` }}>
                {img ? (
                  <img src={img} alt={label} className="w-20 h-20 object-contain rounded-2xl mx-auto mb-3" />
                ) : (
                  <div className="text-6xl mb-3" style={{ animation: "floatUp 2s ease-in-out infinite" }}>{icon}</div>
                )}
                <p className="font-black text-2xl" style={{ color }}>{label}</p>
                {sub && <p className="text-white/70 text-sm mt-1">{sub}</p>}
                <p className="text-white/50 text-xs mt-2">مكافأة تسجيل الدخول! 🎉</p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function CheckinTab({ status, onClaim, claiming, countdown }: any) {
  if (!status) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  const { checkedInToday, currentStreak, nextDay, nextRewardIndex, rewards } = status;
  const todayIndex = checkedInToday ? (currentStreak - 1) % 7 : (nextDay - 1) % 7;
  const todayReward = rewards?.[todayIndex];
  const { icon: todayIcon, label: todayLabel, img: todayImg, sub: todaySub, color: todayColor } = getRewardDisplay(todayReward);

  return (
    <div className="p-4 space-y-4">
      {/* Streak card */}
      <div className="relative rounded-3xl overflow-hidden p-5 text-center"
        style={{ background: "linear-gradient(135deg,#1a0a00,#2d1500,#1a0a00)", border: "1px solid rgba(245,158,11,0.4)" }}>
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 50% 30%, rgba(245,158,11,0.6), transparent 70%)" }} />
        <div className="relative z-10">
          <div className="text-5xl mb-2" style={{ animation: "floatUp 2s ease-in-out infinite" }}>🏺</div>
          <h3 className="text-white font-black text-lg mb-1">صندوق الكنز اليومي</h3>
          <p className="text-yellow-400/70 text-xs mb-3">سجّل دخولك كل يوم واحصل على مكافآت!</p>
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="rounded-2xl px-3 py-1.5" style={{ background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.3)" }}>
              <p className="text-yellow-400 font-black text-xl">{currentStreak}</p>
              <p className="text-yellow-400/60 text-[10px]">يوم متتالي 🔥</p>
            </div>
            <div className="rounded-2xl px-3 py-1.5" style={{ background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.3)" }}>
              <p className="text-purple-400 font-black text-xl">{nextDay}</p>
              <p className="text-purple-400/60 text-[10px]">اليوم القادم</p>
            </div>
          </div>
          {checkedInToday ? (
            <div className="rounded-2xl px-4 py-2.5" style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}>
              <p className="text-green-400 font-bold text-sm">✅ سجّلت دخولك اليوم!</p>
              <p className="text-green-400/60 text-xs mt-0.5">عد غداً بعد {countdown}</p>
            </div>
          ) : (
            <button onClick={onClaim} disabled={claiming}
              className="w-full py-3.5 rounded-2xl text-black font-black text-sm disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] glow-btn"
              style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b,#d97706)" }}>
              {claiming ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <span className="text-lg">🏺</span>}
              <span>{claiming ? "جارٍ الاستلام..." : "استلم مكافأة اليوم!"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Today's reward highlight */}
      {!checkedInToday && todayReward && (
        <div className="rounded-2xl p-4 flex items-center gap-4"
          style={{ background: `${todayColor}12`, border: `1.5px solid ${todayColor}50`, boxShadow: `0 0 20px ${todayColor}20` }}>
          {todayImg ? (
            <img src={todayImg} alt={todayLabel} className="w-16 h-16 object-contain rounded-2xl flex-shrink-0" style={{ background: `${todayColor}15` }} />
          ) : (
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0" style={{ background: `${todayColor}20` }}>{todayIcon}</div>
          )}
          <div className="flex-1">
            <p className="text-xs font-bold mb-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>🎁 مكافأة اليوم {todayIndex + 1}</p>
            <p className="text-white font-black text-xl leading-tight">{todayLabel}</p>
            {todaySub && <p className="text-sm font-bold mt-0.5" style={{ color: todayColor }}>{todaySub}</p>}
            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${todayColor}20`, color: todayColor }}>
              {TYPE_LABELS[todayReward.rewardType ?? "coins"]}
            </span>
          </div>
        </div>
      )}

      {/* 7-day grid */}
      <div>
        <h3 className="text-white font-bold text-sm mb-3">📅 مكافآت الأسبوع</h3>
        <div className="grid grid-cols-7 gap-1.5">
          {(rewards ?? []).map((reward: any, i: number) => {
            const dayNum = i + 1;
            const isPast = currentStreak >= dayNum;
            const isCurrent = !checkedInToday && (currentStreak + 1) === dayNum;
            const isToday = checkedInToday && currentStreak === dayNum;
            const type = reward.rewardType ?? "coins";
            const color = TYPE_COLORS[type] ?? "#fbbf24";
            const img = reward.giftImageUrl ?? reward.storeItemImageUrl ?? null;
            const icon = TYPE_ICONS[type] ?? reward.icon ?? "🪙";
            return (
              <div key={i} className="relative rounded-2xl p-1.5 text-center"
                style={{
                  background: isToday ? "rgba(34,197,94,0.2)" : isCurrent ? `${color}20` : isPast ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.03)",
                  border: isToday ? "2px solid #22c55e" : isCurrent ? `2px solid ${color}` : isPast ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: isCurrent ? `0 0 12px ${color}50` : isToday ? "0 0 12px rgba(34,197,94,0.4)" : "none",
                }}>
                {isPast && !isToday && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl" style={{ background: "rgba(0,0,0,0.4)" }}>
                    <span className="text-green-400 text-base">✓</span>
                  </div>
                )}
                <p className="text-[8px] text-gray-500 mb-0.5">{dayNum}</p>
                {img ? (
                  <img src={img} alt="" className="w-5 h-5 object-contain mx-auto rounded" />
                ) : (
                  <p className="text-sm">{icon}</p>
                )}
                <p className="text-[7px] font-bold mt-0.5 truncate" style={{ color: isCurrent || isToday ? color : "#6b7280" }}>
                  {type === "coins" ? `${((reward.coins ?? 0) / 1000).toFixed(0)}k` :
                   type === "vip" ? `V${reward.vipLevel}` :
                   type === "aristocracy" ? `A${reward.aristocracyLevel}` :
                   type === "gift" ? "هدية" : type === "frame" ? "إطار" : "دخول"}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TasksTab({ tasks, onClaim, claimingTask, totalDone, total, countdown }: any) {
  if (!tasks || tasks.length === 0) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  const pct = total > 0 ? (totalDone / total) * 100 : 0;
  const pendingReward = tasks.reduce((s: number, t: any) => s + (t.completed && !t.rewardClaimed ? t.rewardCoins : 0), 0);

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-2xl px-4 py-3 flex items-center justify-between"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-gray-400 text-xs">تتجدد المهام (UTC)</span>
        </div>
        <span className="text-green-400 font-black text-sm font-mono">{countdown}</span>
      </div>

      <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.15),rgba(236,72,153,0.1))", border: "1px solid rgba(168,85,247,0.3)" }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-white font-bold text-sm">تقدم المهام اليومية</p>
          <div className="flex items-center gap-2">
            {pendingReward > 0 && <span className="text-yellow-400 text-xs font-black">{pendingReward.toLocaleString()} 🪙</span>}
            <p className="text-purple-400 font-black text-sm">{totalDone}/{total}</p>
          </div>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#a855f7,#ec4899)" }} />
        </div>
        {totalDone === total && total > 0 && <p className="text-green-400 text-xs mt-2 font-bold text-center">🎉 أكملت جميع المهام!</p>}
      </div>

      <div className="space-y-3">
        {tasks.map((task: any) => {
          const taskPct = task.target > 0 ? Math.min((task.progress / task.target) * 100, 100) : 0;
          const catColor = CAT_COLORS[task.category] ?? "#a855f7";
          return (
            <div key={task.id} className="rounded-2xl p-4 transition-all"
              style={{
                background: task.rewardClaimed ? "rgba(255,255,255,0.03)" : task.completed ? "linear-gradient(135deg,rgba(34,197,94,0.1),rgba(16,185,129,0.05))" : "rgba(255,255,255,0.04)",
                border: task.rewardClaimed ? "1px solid rgba(255,255,255,0.06)" : task.completed ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(255,255,255,0.08)",
                opacity: task.rewardClaimed ? 0.6 : 1,
              }}>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl"
                  style={{ background: task.rewardClaimed ? "rgba(255,255,255,0.05)" : task.completed ? "rgba(34,197,94,0.2)" : `${catColor}20`, border: `1px solid ${task.completed && !task.rewardClaimed ? "rgba(34,197,94,0.4)" : catColor + "40"}` }}>
                  {task.rewardClaimed ? "✅" : task.completed ? "✅" : task.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: task.rewardClaimed ? "#6b7280" : task.completed ? "#86efac" : "white" }}>{task.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{task.description}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {task.rewardCoins > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
                        +{task.rewardCoins} 🪙
                      </span>
                    )}
                  </div>
                  {task.target > 1 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                        <span>التقدم</span><span>{task.progress}/{task.target}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${taskPct}%`, background: `linear-gradient(90deg,${catColor},${catColor}cc)` }} />
                      </div>
                    </div>
                  )}
                </div>
                {task.completed && !task.rewardClaimed && (
                  <button onClick={() => onClaim(task.id)} disabled={claimingTask === task.id}
                    className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-black active:scale-95 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", boxShadow: "0 4px 12px rgba(34,197,94,0.4)" }}>
                    {claimingTask === task.id ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "استلام"}
                  </button>
                )}
                {task.rewardClaimed && (
                  <span className="flex-shrink-0 text-[10px] text-gray-500 font-bold">مكتمل ✓</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
