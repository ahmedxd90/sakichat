// @ts-nocheck
import { WITHDRAW_TIERS } from "./familyUtils";

interface Props {
  profitReport: any;
  onBack: () => void;
}

export default function FamilyRevenue({ profitReport, onBack }: Props) {
  return (
    <div className="flex flex-col h-full bg-[#0a0a14] overflow-hidden" dir="rtl">
      <div className="sticky top-0 z-40 bg-[#0a0a14]/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center active:scale-95">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          <h2 className="text-white font-bold text-base">💎 لوحة الإيرادات</h2>
          <div className="w-9"/>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-10">
        {!profitReport ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/></div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-2xl p-4 text-center"><p className="text-3xl mb-1">💎</p><p className="text-white font-black text-xl">{(profitReport.totalFamilyDiamonds??0).toLocaleString()}</p><p className="text-gray-400 text-xs mt-0.5">إجمالي ماس العائلة</p></div>
              <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border border-yellow-500/30 rounded-2xl p-4 text-center"><p className="text-3xl mb-1">👑</p><p className="text-white font-black text-xl">{(profitReport.ownerTotalDiamonds??0).toLocaleString()}</p><p className="text-gray-400 text-xs mt-0.5">ماسك الكلي</p></div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
              <span className="text-2xl">💰</span>
              <div><p className="text-green-400 font-bold text-base">{(profitReport.ownerDiamondsFromMembers??0).toLocaleString()} 💎</p><p className="text-gray-400 text-xs">أرباحك من الأعضاء (10%)</p></div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
              <p className="text-blue-400 font-bold text-sm mb-2">📊 سياسة السحب</p>
              <p className="text-gray-400 text-xs mb-3">كل 120,000 ماسة = 10 دولار</p>
              <div className="grid grid-cols-3 gap-1.5">
                {WITHDRAW_TIERS.map((t, i) => (
                  <div key={t} className={`rounded-xl p-2 text-center ${(profitReport.ownerTotalDiamonds??0)>=t?"bg-green-500/20 border border-green-500/30":"bg-white/5 border border-white/10"}`}>
                    <p className={`text-xs font-bold ${(profitReport.ownerTotalDiamonds??0)>=t?"text-green-400":"text-gray-500"}`}>{(t/1000).toFixed(0)}k 💎</p>
                    <p className={`text-[10px] font-bold mt-0.5 ${(profitReport.ownerTotalDiamonds??0)>=t?"text-green-300":"text-gray-600"}`}>${(i+1)*10}</p>
                  </div>
                ))}
              </div>
            </div>
            <h3 className="text-white font-bold text-sm">🏆 ترتيب الأعضاء</h3>
            <div className="space-y-2">
              {profitReport.members.map((m: any, i: number) => (
                <div key={m.sakiId} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${i===0?"bg-yellow-500/20 text-yellow-400":i===1?"bg-gray-400/20 text-gray-300":i===2?"bg-orange-500/20 text-orange-400":"bg-white/5 text-gray-500"}`}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}</div>
                  <div className="flex-1 min-w-0"><p className="text-white text-sm font-bold truncate">{m.name}</p><p className="text-gray-500 text-xs font-mono">#{m.sakiId}</p></div>
                  <div className="text-right"><p className="text-purple-400 text-sm font-bold">{m.diamonds.toLocaleString()} 💎</p><p className="text-green-400 text-xs">+{m.ownerShare.toLocaleString()} لك</p></div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
