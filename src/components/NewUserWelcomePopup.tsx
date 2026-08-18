import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "../lib/toast";
import confetti from "canvas-confetti";

interface NewUserWelcomePopupProps {
  onClose: () => void;
}

type Reward = {
  id: string;
  title: string;
  sub: string;
  badge: string;
  color: string;
  image?: string;
  kind?: "coins";
};

const rewards: Reward[] = [
  {
    id: "coins",
    title: "30,000 عملة",
    sub: "رصيد ذهبي ترحيبي",
    badge: "30K",
    color: "#d97706",
    kind: "coins",
  },
  {
    id: "frame",
    title: "إطار مستخدم جديد",
    sub: "إطار الملف الشخصي لمدة 7 أيام",
    badge: "7 أيام",
    color: "#0891b2",
    image: "/assets/new-user/new-user-frame.svg",
  },
  {
    id: "badge",
    title: "وسام مستخدم جديد",
    sub: "يظهر في ملفك لمدة 7 أيام",
    badge: "7 أيام",
    color: "#db2777",
    image: "/assets/new-user/new-user-badge.svg",
  },
  {
    id: "general",
    title: "الأرستقراطية: الجنرال",
    sub: "رتبة مؤقتة لمدة 3 أيام",
    badge: "3 أيام",
    color: "#2563eb",
    image: "/assets/aristocracy/general.svg",
  },
  {
    id: "entry",
    title: "دخولية سيارة السباق",
    sub: "تُفعّل من الحقيبة لمدة 7 أيام",
    badge: "7 أيام",
    color: "#dc2626",
    image: "/assets/new-user/racing-entry-thumbnail.jpg",
  },
];

function RewardVisual({ reward }: { reward: Reward }) {
  if (reward.image) {
    return (
      <img
        src={reward.image}
        alt={reward.title}
        className="h-full w-full object-contain p-1.5"
        draggable={false}
      />
    );
  }

  if (reward.kind === "coins") {
    return (
      <svg width="34" height="34" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="18" fill="#FBBF24" stroke="#92400E" strokeWidth="2" />
        <circle cx="24" cy="24" r="12" stroke="#FFF7D6" strokeWidth="2" opacity=".9" />
        <path d="M28 16h-6.2c-2.1 0-3.8 1.5-3.8 3.4 0 2 1.7 3.3 3.8 3.6l4.4.6c2 .3 3.8 1.6 3.8 3.6 0 1.9-1.7 3.4-3.8 3.4H20" stroke="#78350F" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M24 14v20" stroke="#78350F" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg width="34" height="34" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="m24 5 4.8 9.7 10.7 1.6-7.7 7.5 1.8 10.6L24 29.4l-9.6 5 1.8-10.6-7.7-7.5 10.7-1.6L24 5Z" fill="#FDE68A" stroke="#7C3AED" strokeWidth="2.2" />
      <path d="M14 34h20M17 39h14" stroke="#6D28D9" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function RewardCard({ reward, claimed }: { reward: Reward; claimed: boolean }) {
  return (
    <div
      className="min-w-0 rounded-2xl p-2.5 transition-all"
      style={{
        background: claimed ? `${reward.color}0d` : "#f8fafc",
        border: `1px solid ${reward.color}${claimed ? "45" : "28"}`,
      }}
    >
      <div
        className="mx-auto mb-2 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl"
        style={{
          background: `${reward.color}14`,
          border: `1px solid ${reward.color}48`,
          boxShadow: `0 5px 18px ${reward.color}22`,
        }}
      >
        <RewardVisual reward={reward} />
      </div>
      <p className="truncate text-center text-[11px] font-black text-slate-800">{reward.title}</p>
      <p className="mt-1 line-clamp-2 min-h-[28px] text-center text-[9px] leading-3 text-slate-500">{reward.sub}</p>
      <div
        className="mx-auto mt-2 w-fit rounded-full px-2 py-0.5 text-[9px] font-black"
        style={{ background: `${reward.color}14`, color: reward.color, border: `1px solid ${reward.color}35` }}
      >
        {reward.badge}
      </div>
    </div>
  );
}

export default function NewUserWelcomePopup({ onClose }: NewUserWelcomePopupProps) {
  const claimNewUserReward = useMutation(api.newUserRewards.claimNewUserReward);
  const [claiming, setClaiming] = useState(false);
  const [closing, setClosing] = useState(false);
  const [phase, setPhase] = useState<"welcome" | "claimed">("welcome");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      confetti({ particleCount: 45, spread: 55, origin: { y: 0.3 }, colors: ["#06b6d4", "#8b5cf6", "#ec4899", "#fbbf24"] });
    }, 450);
    return () => window.clearTimeout(timer);
  }, []);

  const handleClaim = async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      await claimNewUserReward();
      confetti({ particleCount: 130, spread: 80, origin: { y: 0.58 }, colors: ["#06b6d4", "#8b5cf6", "#ec4899", "#fbbf24"] });
      setPhase("claimed");
      toast.success("تم استلام مكافآت المستخدم الجديد");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "تعذر استلام المكافأة");
    } finally {
      setClaiming(false);
    }
  };

  const handleClose = () => {
    setClosing(true);
    window.setTimeout(onClose, 260);
  };

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-slate-950/70 px-4" dir="rtl">
      <div
        className="relative max-h-[90vh] w-full max-w-[390px] overflow-y-auto rounded-[28px] bg-white shadow-[0_24px_90px_rgba(15,23,42,.35)]"
        style={{ animation: closing ? "newUserPopupOut .26s ease-in forwards" : "newUserPopupIn .42s cubic-bezier(.34,1.42,.64,1) forwards" }}
      >
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#06b6d4,#8b5cf6,#ec4899,#f59e0b)" }} />

        <div className="px-5 pb-5 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black tracking-[.18em] text-cyan-600">SAKI WELCOME</p>
              <h2 className="mt-1 text-xl font-black text-slate-900">مرحباً بك في ساكي</h2>
            </div>
            <button onClick={handleClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500" aria-label="إغلاق">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m7 7 10 10M17 7 7 17" strokeLinecap="round" /></svg>
            </button>
          </div>

          <div className="mb-4 rounded-2xl border border-cyan-100 bg-gradient-to-l from-cyan-50 via-white to-violet-50 p-3 text-center">
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-200 bg-white shadow-sm">
              <img src="/assets/new-user/new-user-badge.svg" alt="وسام المستخدم الجديد" className="h-14 w-14 object-contain" />
            </div>
            <p className="text-sm font-black text-slate-800">هدية ترحيبية خاصة للمستخدم الجديد</p>
            <p className="mt-1 text-[10px] text-slate-500">استلم المكافآت ثم فعّل الإطار والدخولية من حقيبتك.</p>
          </div>

          {phase === "welcome" ? (
            <>
              <div className="mb-4 grid grid-cols-2 gap-2.5">
                {rewards.map((reward) => <RewardCard key={reward.id} reward={reward} claimed={false} />)}
              </div>
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl py-3.5 text-sm font-black text-white shadow-lg transition active:scale-[.98] disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#0891b2,#7c3aed 55%,#db2777)" }}
              >
                {claiming ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> جارٍ الاستلام...</>
                ) : (
                  <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 3v12M7 10l5 5 5-5M4 20h16" strokeLinecap="round" strokeLinejoin="round" /></svg> استلم المكافآت الآن</>
                )}
              </button>
            </>
          ) : (
            <>
              <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-center">
                <p className="text-sm font-black text-emerald-700">تمت إضافة المكافآت إلى حسابك</p>
                <p className="mt-1 text-[10px] text-emerald-600">يمكنك تفعيل الإطار والدخولية من المتجر ثم الحقيبة.</p>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-2.5">
                {rewards.map((reward) => <RewardCard key={reward.id} reward={reward} claimed />)}
              </div>
              <button onClick={handleClose} className="w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-black text-white transition active:scale-[.98]">ابدأ رحلتك</button>
            </>
          )}
        </div>
      </div>
      <style>{`
        @keyframes newUserPopupIn { from { opacity: 0; transform: scale(.84) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes newUserPopupOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(.9) translateY(12px); } }
      `}</style>
    </div>
  );
}
