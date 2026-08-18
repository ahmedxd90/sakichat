// @ts-nocheck
import { WITHDRAW_TIERS } from "./familyUtils";

interface Props {
  myMemInfo: any;
  canWithdraw: boolean;
  onBack: () => void;
  onWithdraw: () => void;
}

export default function FamilyMyInfo({ myMemInfo, canWithdraw, onBack, onWithdraw }: Props) {
  const myD = myMemInfo?.diamonds ?? 0;
  const maxTIdx = WITHDRAW_TIERS.filter(t => myD >= t).length;
  const curTVal = maxTIdx * 10;
  const seatH = myMemInfo?.seatHours ?? 0;
  const actD = myMemInfo?.activeDays ?? 0;
  const joinAt = myMemInfo?.joinedAt ?? 0;
  const role = myMemInfo?.role ?? "member";
  const daysIn = joinAt ? Math.floor((Date.now() - joinAt) / (1000*60*60*24)) : 0;

  return (
    <div className="flex flex-col h-full bg-[#0a0a14] overflow-hidden" dir="rtl">
      <div className="sticky top-0 z-40 bg-[#0a0a14]/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center active:scale-95">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          <h2 className="text-white font-bold text-base">📊 معلوماتي في العائلة</h2>
          <div className="w-9"/>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-10">
        {/* بطاقة الماس */}
        <div className="rounded-3xl overflow-hidden relative" style={{background:"linear-gradient(135deg,#4c1d95,#831843,#1e1b4b)"}}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{background:"radial-gradient(circle,white,transparent)",transform:"translate(30%,-30%)"}}/>
          <div className="relative z-10 p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-4xl border border-white/20">💎</div>
              <div>
                <p className="text-white/70 text-sm">ماسي الكلي</p>
                <p className="text-white font-black text-3xl">{myD.toLocaleString()}</p>
                <span className="text-[10px] bg-white/15 text-white/80 px-2 py-0.5 rounded-full font-bold mt-1 inline-block">
                  {role==="owner"?"👑 مالك":role==="admin"?"🛡️ مشرف":"👤 عضو"}
                </span>
              </div>
            </div>
            {(role==="owner"||role==="admin") && (
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10"><p className="text-xl mb-1">⏱️</p><p className="text-white font-black text-base">{seatH.toLocaleString()}</p><p className="text-white/60 text-[10px]">ساعات المقعد</p></div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10"><p className="text-xl mb-1">📅</p><p className="text-white font-black text-base">{actD.toLocaleString()}</p><p className="text-white/60 text-[10px]">أيام الفعالية</p></div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10"><p className="text-xl mb-1">🗓️</p><p className="text-white font-black text-base">{daysIn}</p><p className="text-white/60 text-[10px]">يوم في العائلة</p></div>
              </div>
            )}
          </div>
        </div>

        {/* كيف يُحسب الماس */}
        <div className="rounded-2xl overflow-hidden" style={{background:"linear-gradient(135deg,rgba(168,85,247,0.1),rgba(236,72,153,0.08))",border:"1px solid rgba(168,85,247,0.2)"}}>
          <div className="p-4">
            <p className="text-purple-300 font-bold text-sm mb-3">💡 كيف يُحسب الماس؟</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-2.5"><div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0"><span className="text-base">🎁</span></div><div className="flex-1"><p className="text-white text-xs font-bold">هدايا عادية</p><p className="text-gray-400 text-[11px]">70% من قيمة الهدايا المستقبَلة</p></div><span className="text-purple-400 font-black text-sm">70%</span></div>
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-2.5"><div className="w-8 h-8 rounded-xl bg-pink-500/20 flex items-center justify-center flex-shrink-0"><span className="text-base">🎰</span></div><div className="flex-1"><p className="text-white text-xs font-bold">هدايا الحظ</p><p className="text-gray-400 text-[11px]">10% من هدايا الحظ فقط</p></div><span className="text-pink-400 font-black text-sm">10%</span></div>
              {role==="owner" && (<div className="flex items-center gap-3 bg-white/5 rounded-xl p-2.5"><div className="w-8 h-8 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0"><span className="text-base">👑</span></div><div className="flex-1"><p className="text-white text-xs font-bold">مكافأة المالك</p><p className="text-gray-400 text-[11px]">10% من ماس كل عضو</p></div><span className="text-yellow-400 font-black text-sm">+10%</span></div>)}
            </div>
          </div>
        </div>

        {/* سياسة السحب */}
        <div className="rounded-2xl overflow-hidden" style={{background:"linear-gradient(135deg,rgba(16,185,129,0.08),rgba(5,150,105,0.05))",border:"1px solid rgba(16,185,129,0.2)"}}>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3"><span className="text-lg">📊</span><p className="text-green-400 font-bold text-sm">سياسة السحب عبر وكيل الشحن</p></div>
            <p className="text-gray-400 text-xs mb-3">كل 120,000 ماسة = 10 دولار</p>
            <div className="grid grid-cols-3 gap-1.5">
              {WITHDRAW_TIERS.map((t, i) => (
                <div key={t} className={`rounded-xl p-2.5 text-center ${myD>=t?"bg-green-500/20 border border-green-500/30":"bg-white/5 border border-white/8"}`}>
                  <p className={`text-xs font-black ${myD>=t?"text-green-400":"text-gray-500"}`}>{(t/1000).toFixed(0)}k 💎</p>
                  <p className={`text-[11px] font-bold mt-0.5 ${myD>=t?"text-green-300":"text-gray-600"}`}>${(i+1)*10}</p>
                </div>
              ))}
            </div>
            {curTVal > 0 ? (
              <div className="mt-3 bg-green-500/15 border border-green-500/25 rounded-xl p-3 flex items-center gap-3"><span className="text-2xl">✅</span><div><p className="text-green-400 font-black text-base">يمكنك سحب ${curTVal}</p><p className="text-gray-500 text-xs">اضغط زر السحب أدناه</p></div></div>
            ) : (
              <div className="mt-3 bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3"><span className="text-2xl">⏳</span><div><p className="text-gray-400 text-sm font-bold">تحتاج {Math.max(0,120000-myD).toLocaleString()} ماسة إضافية</p><p className="text-gray-600 text-xs">للوصول لأول مستوى سحب (120k)</p></div></div>
            )}
          </div>
        </div>

        {canWithdraw && (
          <button onClick={onWithdraw} className="w-full py-4 rounded-2xl text-white font-black flex items-center justify-center gap-2 active:scale-[0.98]" style={{background:"linear-gradient(135deg,#a855f7,#ec4899)",boxShadow:"0 8px 24px rgba(168,85,247,0.3)"}}>
            💸 سحب الماس لوكيل الشحن
          </button>
        )}
      </div>
    </div>
  );
}
