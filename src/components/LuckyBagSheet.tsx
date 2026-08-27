// @ts-nocheck
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "../lib/toast";

interface LuckyBagSheetProps {
  roomId: string;
  myCoins: number;
  onClose: () => void;
}

const NORMAL_AMOUNTS = [10_000, 50_000, 150_000];
const NORMAL_RECIPIENTS = [5, 10, 20, 50, 100];
const SUPER_AMOUNTS = [100_000, 200_000, 500_000, 1_000_000];
const SUPER_RECIPIENTS = [10, 50, 100, 200];

function formatCoins(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

// Normal bag card
function NormalBagCard() {
  return (
    <div className="relative rounded-3xl overflow-hidden" style={{
      background: "linear-gradient(135deg,#1a0030 0%,#2d0050 50%,#1a0030 100%)",
      border: "1.5px solid rgba(168,85,247,0.5)",
      boxShadow: "0 8px 32px rgba(168,85,247,0.25)",
    }}>
      {/* Stars */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className="absolute rounded-full animate-pulse"
          style={{
            width: `${2 + Math.random() * 3}px`, height: `${2 + Math.random() * 3}px`,
            left: `${10 + i * 11}%`, top: `${15 + (i % 3) * 25}%`,
            background: "#a855f7", opacity: 0.5,
            animationDelay: `${i * 0.2}s`,
          }} />
      ))}
      <div className="relative z-10 p-5 flex items-center gap-4">
        {/* Bag icon */}
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(168,85,247,0.2)", border: "1.5px solid rgba(168,85,247,0.4)" }}>
          <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
            <rect x="6" y="18" width="36" height="26" rx="6" fill="#a855f7" opacity="0.9"/>
            <rect x="6" y="18" width="36" height="26" rx="6" fill="url(#nbg1)"/>
            <path d="M16 18 Q16 8 24 8 Q32 8 32 18" stroke="#c084fc" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <circle cx="24" cy="30" r="5" fill="#7c3aed" opacity="0.8"/>
            <path d="M21 30 Q24 33 27 30" stroke="#e9d5ff" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <defs>
              <linearGradient id="nbg1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.2)"/>
                <stop offset="100%" stopColor="rgba(0,0,0,0.2)"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-white font-black text-lg">حقيبة الحظ العادية</p>
          <p className="text-purple-300 text-xs mt-1">يتقاسم 5 أشخاص العملات بشكل عشوائي</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: "rgba(168,85,247,0.3)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.4)" }}>
              🎁 داخل الغرفة فقط
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Super bag card
function SuperBagCard() {
  return (
    <div className="relative rounded-3xl overflow-hidden" style={{
      background: "linear-gradient(135deg,#1a0e00 0%,#2d1a00 50%,#1a0e00 100%)",
      border: "1.5px solid rgba(251,191,36,0.6)",
      boxShadow: "0 8px 40px rgba(251,191,36,0.3), 0 0 60px rgba(251,191,36,0.1)",
    }}>
      {/* Sparkles */}
      {["✨","⭐","💫","🌟","✨","⭐"].map((s, i) => (
        <div key={i} className="absolute text-sm opacity-40 animate-pulse"
          style={{ top: `${10 + i * 14}%`, left: `${5 + i * 16}%`, animationDelay: `${i * 0.25}s` }}>
          {s}
        </div>
      ))}
      <div className="relative z-10 p-5 flex items-center gap-4">
        {/* Bag icon */}
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 relative"
          style={{ background: "rgba(251,191,36,0.2)", border: "1.5px solid rgba(251,191,36,0.5)" }}>
          <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
            <rect x="6" y="18" width="36" height="26" rx="6" fill="#fbbf24" opacity="0.95"/>
            <rect x="6" y="18" width="36" height="26" rx="6" fill="url(#sbg1)"/>
            <path d="M16 18 Q16 8 24 8 Q32 8 32 18" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <circle cx="24" cy="30" r="5" fill="#92400e" opacity="0.8"/>
            <path d="M21 30 Q24 33 27 30" stroke="#fde68a" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <circle cx="36" cy="12" r="4" fill="#fbbf24" className="animate-ping" opacity="0.6"/>
            <defs>
              <linearGradient id="sbg1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.25)"/>
                <stop offset="100%" stopColor="rgba(0,0,0,0.15)"/>
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}>
            <span className="text-[9px] font-black text-black">S</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-yellow-300 font-black text-lg">حقيبة الحظ السوبر</p>
          <p className="text-yellow-200/70 text-xs mt-1">شريط عالمي + صفحة كاملة + علاء الدين!</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: "rgba(251,191,36,0.3)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.4)" }}>
              🌍 يظهر لجميع المستخدمين
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LuckyBagSheet({ roomId, myCoins, onClose }: LuckyBagSheetProps) {
  const [tab, setTab] = useState<"normal" | "super">("normal");
  const [normalAmount, setNormalAmount] = useState(10_000);
  const [normalRecipients, setNormalRecipients] = useState(5);
  const [superAmount, setSuperAmount] = useState(100_000);
  const [superRecipients, setSuperRecipients] = useState(10);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const amount = tab === "normal" ? normalAmount : superAmount;
    const recipients = tab === "normal" ? normalRecipients : superRecipients;

    if (myCoins < amount) {
      toast.error("رصيدك غير كافٍ 💰");
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("يجب تسجيل الدخول");

      const { error } = await supabase.from('lucky_bags').insert({
        room_id: roomId,
        creator_id: user.id,
        bag_type: tab,
        total_coins: amount,
        max_recipients: recipients,
        remaining_coins: amount,
        remaining_recipients: recipients,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      });
      
      if (error) throw error;

      await supabase.rpc('deduct_coins', { amount_to_deduct: amount });

      toast.success(tab === "super" ? "🎉 تم إرسال حقيبة الحظ السوبر!" : "🎁 تم إرسال حقيبة الحظ!");
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const isNormal = tab === "normal";
  const amount = isNormal ? normalAmount : superAmount;
  const recipients = isNormal ? normalRecipients : superRecipients;
  const canAfford = myCoins >= amount;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div
        className="relative rounded-t-3xl border-t border-white/10 flex flex-col overflow-hidden animate-slide-up-sheet"
        style={{
          background: "linear-gradient(180deg, #0a0015 0%, #12001f 60%, #0a0a15 100%)",
          maxHeight: "88vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <h2 className="text-white font-black text-lg">🎁 حقيبة الحظ</h2>
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl" style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" }}>
            <span className="text-sm">🪙</span>
            <span className="text-yellow-300 text-xs font-bold">{formatCoins(myCoins)}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4 pb-3 flex-shrink-0">
          <button
            onClick={() => setTab("normal")}
            className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2"
            style={tab === "normal"
              ? { background: "linear-gradient(135deg,#a855f7,#ec4899)", color: "white", boxShadow: "0 4px 20px rgba(168,85,247,0.4)" }
              : { background: "rgba(255,255,255,0.07)", color: "#9ca3af" }
            }
          >
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="12" width="24" height="17" rx="4" fill="currentColor" opacity="0.8"/>
              <path d="M11 12 Q11 6 16 6 Q21 6 21 12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            </svg>
            عادية
          </button>
          <button
            onClick={() => setTab("super")}
            className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2"
            style={tab === "super"
              ? { background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#000", boxShadow: "0 4px 20px rgba(251,191,36,0.4)" }
              : { background: "rgba(255,255,255,0.07)", color: "#9ca3af" }
            }
          >
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="12" width="24" height="17" rx="4" fill="currentColor" opacity="0.8"/>
              <path d="M11 12 Q11 6 16 6 Q21 6 21 12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <circle cx="24" cy="8" r="4" fill="currentColor" opacity="0.9"/>
            </svg>
            سوبر ⭐
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
          {/* Card */}
          {isNormal ? <NormalBagCard /> : <SuperBagCard />}

          {/* Amount */}
          <div>
            <label className="text-gray-400 text-xs font-bold mb-2 block">💰 عدد العملات الذهبية</label>
            {isNormal ? (
              <div className="grid grid-cols-5 gap-2">
                {NORMAL_AMOUNTS.map((a) => (
                  <button key={a} onClick={() => setNormalAmount(a)}
                    className="py-2.5 rounded-xl text-xs font-bold transition-all"
                    style={normalAmount === a
                      ? { background: "linear-gradient(135deg,#a855f7,#ec4899)", color: "white", boxShadow: "0 4px 12px rgba(168,85,247,0.4)" }
                      : { background: "rgba(255,255,255,0.07)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.1)" }
                    }>
                    {formatCoins(a)}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {SUPER_AMOUNTS.map((a) => (
                  <button key={a} onClick={() => setSuperAmount(a)}
                    className="py-4 rounded-2xl text-sm font-bold transition-all relative overflow-hidden"
                    style={superAmount === a
                      ? { background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#000", boxShadow: "0 4px 20px rgba(251,191,36,0.5)" }
                      : { background: "rgba(255,255,255,0.07)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.1)" }
                    }>
                    {superAmount === a && (
                      <div className="absolute inset-0 opacity-20"
                        style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)", animation: "shimmer 1.5s infinite" }} />
                    )}
                    <span className="relative z-10">{formatCoins(a)} 🪙</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* المستفيدون: عددهم قابل للتحديد في الحقيبة العادية والسوبر */}
          {isNormal && (
            <div>
              <label className="text-gray-400 text-xs font-bold mb-2 block">👥 عدد الأشخاص في الغرفة</label>
              <div className="grid grid-cols-5 gap-2">
                {NORMAL_RECIPIENTS.map((r) => (
                  <button key={r} onClick={() => setNormalRecipients(r)}
                    className="py-2.5 rounded-xl text-xs font-bold transition-all"
                    style={normalRecipients === r
                      ? { background: "linear-gradient(135deg,#a855f7,#ec4899)", color: "white", boxShadow: "0 4px 12px rgba(168,85,247,0.4)" }
                      : { background: "rgba(255,255,255,0.07)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isNormal && (
            <div>
              <label className="text-gray-400 text-xs font-bold mb-2 block">👥 عدد المستلمين</label>
              <div className="grid grid-cols-5 gap-2">
                {SUPER_RECIPIENTS.map((r) => (
                  <button key={r} onClick={() => setSuperRecipients(r)}
                    className="py-2.5 rounded-xl text-xs font-bold transition-all"
                    style={superRecipients === r
                      ? { background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#000", boxShadow: "0 4px 12px rgba(251,191,36,0.4)" }
                      : { background: "rgba(255,255,255,0.07)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.1)" }
                    }>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Normal recipients info */}
          {isNormal && (
            <div className="rounded-2xl p-3 flex items-center gap-3"
              style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}>
              <span className="text-2xl">👥</span>
              <div>
                <p className="text-purple-300 font-bold text-sm">{normalRecipients} أشخاص</p>
                <p className="text-gray-500 text-xs">أول المستفيدين في الغرفة يفتحون الصندوق</p>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="rounded-2xl p-4" style={{
            background: isNormal ? "rgba(168,85,247,0.1)" : "rgba(251,191,36,0.1)",
            border: `1px solid ${isNormal ? "rgba(168,85,247,0.25)" : "rgba(251,191,36,0.25)"}`,
          }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">إجمالي العملات</span>
              <span className="font-bold" style={{ color: isNormal ? "#c084fc" : "#fbbf24" }}>{formatCoins(amount)} 🪙</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">عدد المستلمين</span>
              <span className="font-bold" style={{ color: isNormal ? "#c084fc" : "#fbbf24" }}>{recipients} شخص</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">متوسط نصيب كل شخص</span>
              <span className="text-yellow-300 font-bold">~{formatCoins(Math.floor(amount / recipients))} 🪙</span>
            </div>
            {!canAfford && (
              <div className="mt-3 text-center text-red-400 text-xs font-bold">⚠️ رصيدك غير كافٍ</div>
            )}
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending || !canAfford}
            className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: isNormal
                ? "linear-gradient(135deg,#a855f7,#ec4899)"
                : "linear-gradient(135deg,#fbbf24,#f59e0b)",
              color: isNormal ? "white" : "#000",
              boxShadow: isNormal
                ? "0 8px 30px rgba(168,85,247,0.4)"
                : "0 8px 30px rgba(251,191,36,0.4)",
            }}
          >
            {sending ? "⏳ جارٍ الإرسال..." : isNormal ? "🎁 أرسل حقيبة الحظ" : "⭐ أرسل حقيبة الحظ السوبر"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
      `}</style>
    </div>
  );
}
