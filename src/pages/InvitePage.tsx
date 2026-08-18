// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "../lib/toast";
import { formatNumber } from "../lib/formatNumber";

interface InvitePageProps {
  onBack: () => void;
}

export default function InvitePage({ onBack }: InvitePageProps) {
  const referralInfo = useQuery(api.referrals.getMyReferralInfo);
  const generateCode = useMutation(api.referrals.generateMyReferralCode);
  const applyCode = useMutation(api.referrals.applyReferralCode);
  const claimAmbassador = useMutation(api.referrals.claimAmbassadorReward);
  const profile = useQuery(api.profiles.getMyProfile);

  const [applyInput, setApplyInput] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateCode = async () => {
    try {
      await generateCode({});
      toast.success("تم توليد كود الدعوة!");
    } catch (e: any) {
      toast.error(e.message ?? "حدث خطأ");
    }
  };

  const handleCopy = () => {
    if (!referralInfo?.referralCode) return;
    navigator.clipboard.writeText(referralInfo.referralCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleApply = async () => {
    if (!applyInput.trim()) return toast.error("أدخل كود الدعوة");
    setApplyLoading(true);
    try {
      const res = await applyCode({ referralCode: applyInput.trim() });
      toast.success(`تم تطبيق كود دعوة ${res.referrerName} بنجاح! 🎉`);
      setApplyInput("");
    } catch (e: any) {
      toast.error(e.message ?? "كود غير صحيح");
    } finally {
      setApplyLoading(false);
    }
  };

  const handleClaimAmbassador = async () => {
    setClaimLoading(true);
    try {
      await claimAmbassador({});
      toast.success("🌟 مبروك! أصبحت سفير ساكي! حصلت على 100,000 عملة + إطار حصري");
    } catch (e: any) {
      toast.error(e.message ?? "حدث خطأ");
    } finally {
      setClaimLoading(false);
    }
  };

  const isAmbassador = referralInfo?.isSakiAmbassador ?? false;
  const canClaim = referralInfo?.canClaimAmbassador ?? false;
  const referralCount = referralInfo?.referralCount ?? 0;
  const progress = Math.min((referralCount / 10) * 100, 100);
  const alreadyUsedCode = !!referralInfo?.referredByCode;

  const createdAt = profile?.createdAt ?? Date.now();
  const isNewUser = Date.now() - createdAt < 7 * 24 * 60 * 60 * 1000;
  const canAddCode = isNewUser && !alreadyUsedCode;

  return (
    <div className="fixed inset-0 z-[400] flex flex-col" dir="rtl"
      style={{ background: "linear-gradient(180deg,#0f0f1a 0%,#1a0a2e 50%,#0f0f1a 100%)" }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
          style={{ background: "rgba(255,255,255,0.08)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="flex-1">
          <h2 className="font-black text-lg text-white">دعوة الأصدقاء 🎁</h2>
          <p className="text-xs" style={{ color: "#aaa" }}>ادعُ أصدقاءك واكسب مكافآت</p>
        </div>
        {isAmbassador && (
          <div className="px-3 py-1.5 rounded-full text-xs font-black"
            style={{ background: "linear-gradient(135deg,#ffd700,#ff8c00,#ff4500,#ff8c00,#ffd700)", backgroundSize: "300% 100%", animation: "ambassador-shimmer 2s linear infinite", color: "#000", boxShadow: "0 0 20px rgba(255,215,0,0.6)" }}>
            🌟 سفير ساكي
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-8">

        {/* ── صندوق استلام مكافأة السفير ── */}
        {canClaim && (
          <div className="mx-4 mt-4 rounded-3xl p-5 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,#1a1200,#2d1f00,#1a1200)", border: "2px solid rgba(255,215,0,0.6)", boxShadow: "0 0 40px rgba(255,215,0,0.3)" }}>
            {/* Glow bg */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
              style={{ background: "radial-gradient(circle at 50% 50%,#ffd700 0%,transparent 70%)" }} />
            <div className="relative">
              {/* Icon */}
              <div className="flex justify-center mb-3">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                  style={{ background: "linear-gradient(135deg,#ffd700,#ff8c00)", boxShadow: "0 0 30px rgba(255,215,0,0.7)", animation: "ambassador-pulse 1.5s ease-in-out infinite" }}>
                  🌟
                </div>
              </div>
              <h3 className="text-center font-black text-xl mb-1"
                style={{ background: "linear-gradient(135deg,#ffd700,#ff8c00)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                مكافأة السفير جاهزة!
              </h3>
              <p className="text-center text-sm mb-4" style={{ color: "#ccc" }}>
                وصلت إلى 10 دعوات! استلم مكافأتك الآن
              </p>
              {/* Rewards list */}
              <div className="space-y-2 mb-4">
                {[
                  { icon: "🪙", label: "100,000 عملة ذهبية" },
                  { icon: "🌟", label: "لقب سفير ساكي الرسمي" },
                  { icon: "🖼️", label: "إطار سفير ساكي الحصري" },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                    style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.2)" }}>
                    <span className="text-xl">{r.icon}</span>
                    <span className="text-sm font-bold text-white">{r.label}</span>
                    <span className="mr-auto text-green-400 text-xs font-bold">✓</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleClaimAmbassador}
                disabled={claimLoading}
                className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#ffd700,#ff8c00,#ffd700)", backgroundSize: "200% 100%", animation: "ambassador-shimmer 2s linear infinite", color: "#000", boxShadow: "0 4px 24px rgba(255,215,0,0.5)" }}>
                {claimLoading
                  ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  : <span>🎁 استلم المكافأة الآن</span>
                }
              </button>
            </div>
          </div>
        )}

        {/* Ambassador Banner (after claim) */}
        {isAmbassador && (
          <div className="mx-4 mt-4 rounded-2xl p-4 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,#1a1200,#2d1f00)", border: "1px solid rgba(255,215,0,0.4)", boxShadow: "0 0 30px rgba(255,215,0,0.2)" }}>
            <div className="absolute inset-0 opacity-10"
              style={{ background: "radial-gradient(circle at 30% 50%,#ffd700 0%,transparent 60%)" }} />
            <div className="relative flex items-center gap-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-3xl"
                style={{ background: "linear-gradient(135deg,#ffd700,#ff8c00)", boxShadow: "0 0 20px rgba(255,215,0,0.5)", animation: "ambassador-pulse 2s ease-in-out infinite" }}>
                🌟
              </div>
              <div>
                <div className="font-black text-base"
                  style={{ background: "linear-gradient(135deg,#ffd700,#ff8c00)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  سفير ساكي الرسمي
                </div>
                <div className="text-xs mt-0.5" style={{ color: "#aaa" }}>
                  دعوت {referralCount} صديق · أرباح الشحن: {formatNumber(referralInfo?.totalChargeEarnings ?? 0)} 🪙
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Referral Code */}
        <div className="mx-4 mt-4 rounded-2xl p-4"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="text-sm font-bold text-white mb-3">كود الدعوة الخاص بك</div>
          {referralInfo?.referralCode ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 text-center py-3 rounded-xl font-black text-2xl tracking-widest"
                style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.2),rgba(236,72,153,0.2))", border: "2px dashed rgba(168,85,247,0.5)", color: "#e879f9", letterSpacing: "0.2em" }}>
                {referralInfo.referralCode}
              </div>
              <button onClick={handleCopy}
                className="w-12 h-12 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: copied ? "rgba(34,197,94,0.2)" : "rgba(168,85,247,0.2)", border: `1px solid ${copied ? "rgba(34,197,94,0.5)" : "rgba(168,85,247,0.5)"}` }}>
                {copied ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e879f9" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                )}
              </button>
            </div>
          ) : (
            <button onClick={handleGenerateCode}
              className="w-full py-3 rounded-xl font-bold text-sm active:scale-95 transition-transform"
              style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)", color: "white" }}>
              🎲 توليد كود الدعوة
            </button>
          )}
        </div>

        {/* Progress to Ambassador */}
        {!isAmbassador && !canClaim && (
          <div className="mx-4 mt-3 rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-white">التقدم نحو سفير ساكي 🌟</span>
              <span className="text-xs font-bold" style={{ color: "#a855f7" }}>{referralCount}/10</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: "linear-gradient(90deg,#a855f7,#ec4899,#ffd700)", boxShadow: "0 0 10px rgba(168,85,247,0.5)" }} />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs" style={{ color: "#888" }}>ادعُ {10 - referralCount} صديق إضافي</span>
              <span className="text-xs" style={{ color: "#ffd700" }}>🎁 100,000 عملة + إطار سفير</span>
            </div>
          </div>
        )}

        {/* Rewards Info */}
        <div className="mx-4 mt-3 rounded-2xl p-4"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="text-sm font-bold text-white mb-3">🎁 مكافآت الدعوة</div>
          <div className="space-y-2.5">
            {[
              { icon: "🪙", title: "30% من شحن المدعو", desc: "تحصل على 30% من كل شحن عملات ذهبية يقوم به صديقك عبر وكيل شحن" },
              { icon: "💰", title: "100,000 عملة ذهبية", desc: "عند دعوة 10 أصدقاء يحصل الداعي على 100,000 عملة" },
              { icon: "🌟", title: "لقب سفير ساكي", desc: "يظهر في ملفك الشخصي مع أيقونة لامعة متحركة" },
              { icon: "🖼️", title: "إطار سفير ساكي", desc: "إطار ذهبي حصري يظهر حول صورتك في كل مكان" },
            ].map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)" }}>
                <span className="text-xl flex-shrink-0">{r.icon}</span>
                <div>
                  <div className="text-sm font-bold text-white">{r.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#888" }}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Referral Code (new users only) */}
        {canAddCode && (
          <div className="mx-4 mt-3 rounded-2xl p-4"
            style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.25)" }}>
            <div className="text-sm font-bold text-white mb-1">🎟️ أضف كود دعوة صديق</div>
            <div className="text-xs mb-3" style={{ color: "#aaa" }}>
              متاح فقط للمستخدمين الجدد (أقل من 7 أيام) · مرة واحدة فقط
            </div>
            <div className="flex gap-2">
              <input
                value={applyInput}
                onChange={(e) => setApplyInput(e.target.value.toUpperCase())}
                placeholder="أدخل كود الدعوة"
                maxLength={12}
                className="flex-1 px-3 py-2.5 rounded-xl text-sm font-bold text-white placeholder-gray-500 focus:outline-none"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,215,0,0.3)", letterSpacing: "0.1em" }}
              />
              <button onClick={handleApply} disabled={applyLoading || !applyInput.trim()}
                className="px-4 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-transform disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#ffd700,#ff8c00)", color: "#000" }}>
                {applyLoading ? "..." : "تطبيق"}
              </button>
            </div>
          </div>
        )}

        {alreadyUsedCode && (
          <div className="mx-4 mt-3 rounded-2xl p-3 flex items-center gap-2"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <span className="text-green-400 text-lg">✅</span>
            <div>
              <div className="text-sm font-bold text-green-400">تم تطبيق كود الدعوة</div>
              <div className="text-xs" style={{ color: "#888" }}>كود: {referralInfo?.referredByCode}</div>
            </div>
          </div>
        )}

        {/* Referrals List */}
        {referralCount > 0 && (
          <div className="mx-4 mt-3 mb-6 rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="text-sm font-bold text-white">المدعوون ({referralCount})</span>
              <span className="text-xs" style={{ color: "#a855f7" }}>إجمالي الأرباح: {formatNumber(referralInfo?.totalChargeEarnings ?? 0)} 🪙</span>
            </div>
            {referralInfo?.referrals?.slice(0, 20).map((r: any, i: number) => (
              <div key={r._id} className="flex items-center gap-3 px-4 py-3"
                style={i < (referralInfo.referrals.length - 1) ? { borderBottom: "1px solid rgba(255,255,255,0.05)" } : {}}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)", color: "white" }}>
                  {r.referredName?.[0] ?? "؟"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{r.referredName}</div>
                  <div className="text-xs" style={{ color: "#888" }}>ID: {r.referredSakiId}</div>
                </div>
                {(r.chargeEarnings ?? 0) > 0 && (
                  <div className="text-xs font-bold" style={{ color: "#ffd700" }}>
                    +{formatNumber(r.chargeEarnings)} 🪙
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes ambassador-shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes ambassador-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(255,215,0,0.5); }
          50% { box-shadow: 0 0 40px rgba(255,215,0,0.9); }
        }
      `}</style>
    </div>
  );
}
