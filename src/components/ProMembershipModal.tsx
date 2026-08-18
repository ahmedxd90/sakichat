import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "../lib/toast";

export default function ProMembershipModal({ profile, onClose }: { profile: any; onClose: () => void }) {
  const purchasePro = useMutation(api.adminExtra.purchasePro);
  const [durationDays, setDurationDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const isActive = Boolean(profile?.isPro && (profile?.proExpiresAt ?? 0) > Date.now());
  const balance = profile?.goldCoins ?? 0;
  const canBuy = balance >= 2_000_000;

  const purchase = async () => {
    setLoading(true);
    try {
      await purchasePro({ durationDays });
      toast.success("🚀 تم تفعيل عضوية PRO بنجاح");
      onClose();
    } catch (error: any) {
      toast.error(error?.message ?? "تعذر تفعيل PRO");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" dir="rtl">
      <button aria-label="إغلاق" onClick={onClose} className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-[32px]" style={{ background: "linear-gradient(160deg,#1a0711 0%,#120d1f 45%,#070b19 100%)", border: "1px solid rgba(251,191,36,0.36)", boxShadow: "0 30px 100px rgba(0,0,0,0.55), 0 0 60px rgba(239,68,68,0.16)" }}>
        <div className="relative h-44 overflow-hidden rounded-t-[32px]" style={{ background: "radial-gradient(circle at 50% 20%, rgba(251,191,36,0.28), transparent 35%), linear-gradient(135deg,#360713,#160b25 58%,#081427)" }}>
          <img src="/assets/pro/pro-lion-entry.png" alt="PRO Lion" className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-64 h-96 object-contain opacity-85" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 20%,#1a0711 100%)" }} />
          <button onClick={onClose} className="absolute top-4 left-4 w-9 h-9 rounded-full text-white/70 text-lg" style={{ background: "rgba(0,0,0,0.28)" }}>×</button>
          <div className="absolute top-5 right-5"><span className="px-3 py-1 rounded-full text-[10px] font-black" style={{ background: "linear-gradient(135deg,#fbbf24,#ef4444)", color: "#21040a" }}>PRO SAKI</span></div>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-center"><h2 className="text-white text-2xl font-black">عضوية PRO الملكية</h2><p className="text-gray-400 text-xs mt-1">هوية لامعة، حضور ملكي، وحماية خاصة داخل الغرف</p></div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl p-2 text-center" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}><img src="/assets/pro/pro-saki-frame.png" alt="PRO frame" className="mx-auto w-14 h-14 object-contain" /><p className="text-[10px] text-red-200 font-bold mt-1">إطار PRO</p></div>
            <div className="rounded-2xl p-2 text-center" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}><img src="/assets/pro/pro-saki-bubble.png" alt="PRO bubble" className="mx-auto w-14 h-10 object-contain mt-2" /><p className="text-[10px] text-amber-200 font-bold mt-3">فقاعة لامعة</p></div>
            <div className="rounded-2xl p-2 text-center" style={{ background: "rgba(30,64,175,0.16)", border: "1px solid rgba(59,130,246,0.25)" }}><div className="mx-auto w-14 h-14 flex items-center justify-center text-3xl">🛡️</div><p className="text-[10px] text-sky-200 font-bold mt-1">حماية PRO</p></div>
          </div>

          <div className="rounded-2xl p-4 space-y-2" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              "اسم مستخدم متدرج بالأحمر والذهبي",
              "إطار PRO SAKI وفقاعة دردشة حصرية",
              "دخولية الأسد الليلي عند دخول الغرفة",
              "لا يمكن طرد مستخدم PRO من الغرفة عبر أدوات الطرد العادية",
              "ملف شخصي خاص قابل للإخفاء من الإعدادات",
            ].map((item) => <div key={item} className="flex items-center gap-2 text-xs text-gray-300"><span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: "rgba(251,191,36,0.18)", color: "#fbbf24" }}>✓</span>{item}</div>)}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[7, 30, 90].map((days) => <button key={days} onClick={() => setDurationDays(days)} className="rounded-xl py-2 text-xs font-black" style={durationDays === days ? { background: "linear-gradient(135deg,#fbbf24,#ef4444)", color: "#25070d" } : { background: "rgba(255,255,255,0.06)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.08)" }}>{days} يوم</button>)}
          </div>

          <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.24)" }}><span className="text-amber-200 text-xs font-bold">السعر</span><span className="text-amber-300 text-lg font-black">2,000,000 🪙</span></div>
          <p className="text-center text-[10px] text-gray-500">رصيدك الحالي: {balance.toLocaleString()} عملة ذهبية</p>

          {isActive ? <div className="rounded-2xl py-3 text-center text-emerald-300 text-xs font-black" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>PRO مفعّلة حالياً — يمكنك تمديد المدة</div> : <button onClick={purchase} disabled={loading || !canBuy} className="w-full py-4 rounded-2xl font-black text-sm active:scale-95 disabled:opacity-50" style={{ background: canBuy ? "linear-gradient(135deg,#fbbf24,#ef4444)" : "rgba(255,255,255,0.08)", color: canBuy ? "#26060b" : "#6b7280", boxShadow: canBuy ? "0 12px 30px rgba(239,68,68,0.25)" : "none" }}>{loading ? "جاري التفعيل..." : canBuy ? `تفعيل PRO لمدة ${durationDays} يوم` : "الرصيد غير كافٍ"}</button>}
        </div>
      </div>
    </div>
  );
}
