// @ts-nocheck
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "../../lib/toast";
import { WITHDRAW_TIERS } from "./familyUtils";

interface Props {
  myDiamonds: number;
  onBack: () => void;
}

export default function FamilyWithdraw({ myDiamonds, onBack }: Props) {
  const agentsList  = useQuery(api.families.listAgentsForFamily);
  const wdHistory   = useQuery(api.families.getMyWithdrawalHistory);
  const withdrawMut = useMutation(api.families.withdrawDiamondsToAgent);

  const [wAgent, setWAgent] = useState("");
  const [wAmt, setWAmt]     = useState(0);
  const [step, setStep]     = useState<"form"|"confirm"|"done">("form");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<any>(null);

  const confirm = async () => {
    setLoading(true);
    try {
      const r = await withdrawMut({ agentSakiId: wAgent.trim(), diamonds: wAmt });
      setResult(r); setStep("done");
    } catch (e: any) { toast.error(e.message); setStep("form"); }
    finally { setLoading(false); }
  };

  const reset = () => { setStep("form"); setWAgent(""); setWAmt(0); setResult(null); };

  return (
    <div className="flex flex-col h-full bg-[#0a0a14] overflow-hidden" dir="rtl">
      <div className="sticky top-0 z-40 bg-[#0a0a14]/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center active:scale-95">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          <h2 className="text-white font-bold text-base">💸 سحب الماس لوكيل الشحن</h2>
          <div className="w-9"/>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-10">
        {step === "done" ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center"><span className="text-5xl">✅</span></div>
            <h3 className="text-white font-black text-xl">تم الإرسال بنجاح!</h3>
            <p className="text-gray-400 text-sm text-center px-4">تم إرسال <span className="text-green-400 font-bold">{wAmt.toLocaleString()} ماسة</span> للوكيل <span className="text-purple-400 font-bold">{result?.agentName}</span></p>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 w-full">
              <p className="text-yellow-400 font-bold text-sm mb-2">⚠️ تنبيه مهم جداً</p>
              <div className="space-y-1.5">
                <p className="text-gray-400 text-xs">• هذه العملية تمت بينك وبين الوكيل مباشرة</p>
                <p className="text-gray-400 text-xs">• التطبيق يسجل العملية فقط لمنع النصب والاحتيال</p>
                <p className="text-gray-400 text-xs">• تأكد من التعامل مع وكلاء موثوقين فقط</p>
              </div>
            </div>
            <button onClick={reset} className="w-full py-3.5 rounded-2xl bg-white/5 text-gray-400 font-bold text-sm">سحب مرة أخرى</button>
          </div>
        ) : step === "confirm" ? (
          <div className="space-y-4">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
              <p className="text-orange-400 font-bold text-sm mb-3">⚠️ تأكيد العملية النهائي</p>
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center bg-white/5 rounded-xl px-3 py-2.5"><span className="text-gray-400 text-sm">الوكيل (SAKI ID)</span><span className="text-white font-bold text-sm font-mono">#{wAgent}</span></div>
                <div className="flex justify-between items-center bg-white/5 rounded-xl px-3 py-2.5"><span className="text-gray-400 text-sm">الكمية</span><span className="text-purple-400 font-bold text-sm">{wAmt.toLocaleString()} 💎</span></div>
                <div className="flex justify-between items-center bg-white/5 rounded-xl px-3 py-2.5"><span className="text-gray-400 text-sm">القيمة</span><span className="text-green-400 font-bold text-sm">${(wAmt/120000*10).toFixed(0)}</span></div>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-red-400 text-xs font-bold mb-1">🚨 تحذير</p>
                <p className="text-gray-400 text-[11px] leading-relaxed">ما يحدث بينك وبين الوكيل هو مسؤوليتك الشخصية. التطبيق يسجل العملية فقط لمنع الاحتيال. لا يمكن التراجع.</p>
              </div>
            </div>
            <button onClick={confirm} disabled={loading} className="w-full py-4 rounded-2xl text-white font-black disabled:opacity-40 flex items-center justify-center gap-2" style={{background:"linear-gradient(135deg,#f97316,#ef4444)"}}>
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> : "✅ تأكيد السحب النهائي"}
            </button>
            <button onClick={() => setStep("form")} className="w-full py-3 rounded-2xl bg-white/5 text-gray-400 font-medium text-sm">إلغاء</button>
          </div>
        ) : (
          <>
            <div className="rounded-2xl p-4" style={{background:"linear-gradient(135deg,#4c1d95,#831843)"}}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">💎</div>
                <div><p className="text-white/70 text-xs">ماسي المتاح للسحب</p><p className="text-white font-black text-2xl">{myDiamonds.toLocaleString()}</p></div>
              </div>
            </div>
            {WITHDRAW_TIERS.filter(t => myDiamonds >= t).length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                <span className="text-4xl">⏳</span>
                <p className="text-gray-400 text-sm mt-2 font-bold">لا يمكنك السحب بعد</p>
                <p className="text-gray-600 text-xs mt-1">تحتاج {(120000-myDiamonds).toLocaleString()} ماسة إضافية</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-gray-400 text-xs font-bold">اختر كمية السحب</p>
                  <div className="grid grid-cols-3 gap-2">
                    {WITHDRAW_TIERS.map((t, i) => {
                      const av = myDiamonds >= t; const sel = wAmt === t;
                      return (
                        <button key={t} onClick={() => av && setWAmt(t)} disabled={!av}
                          className={`rounded-2xl p-3 text-center transition-all active:scale-95 ${sel?"border-2 border-purple-500":"border border-white/10"} ${av?"":"opacity-30"}`}
                          style={sel?{background:"rgba(168,85,247,0.2)"}:{background:"rgba(255,255,255,0.05)"}}>
                          <p className={`text-xs font-black ${av?"text-white":"text-gray-600"}`}>{(t/1000).toFixed(0)}k 💎</p>
                          <p className={`text-[11px] font-bold mt-0.5 ${av?"text-green-400":"text-gray-600"}`}>${(i+1)*10}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-gray-400 text-xs font-bold">SAKI ID للوكيل فقط</p>
                  <input value={wAgent} onChange={e => setWAgent(e.target.value)} placeholder="أدخل SAKI ID للوكيل..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-purple-500 font-mono"/>
                  <p className="text-red-400/70 text-[10px]">⚠️ تأكد من إدخال SAKI ID الوكيل الصحيح فقط. لا يمكن التراجع.</p>
                </div>
                {agentsList && agentsList.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-gray-400 text-xs font-bold">الوكلاء المتاحون</p>
                    {agentsList.map(ag => (
                      <button key={ag._id} onClick={() => setWAgent(ag.sakiId)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all active:scale-[0.98] ${wAgent===ag.sakiId?"border-2 border-purple-500 bg-purple-500/10":"bg-white/5 border border-white/10"}`}>
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center flex-shrink-0">
                          {ag.avatarUrl ? <img src={ag.avatarUrl} alt="" className="w-full h-full object-cover"/> : <span className="text-white font-bold">{ag.name?.[0]}</span>}
                        </div>
                        <div className="flex-1 text-right"><p className="text-white text-sm font-bold">{ag.name}</p><p className="text-gray-500 text-xs font-mono">#{ag.sakiId}</p></div>
                        <span className="text-[10px] bg-green-500/20 border border-green-500/30 text-green-400 px-2 py-0.5 rounded-full font-bold flex-shrink-0">وكيل</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3">
                  <p className="text-red-400 text-xs font-bold mb-1">🚨 تحذير مهم</p>
                  <p className="text-gray-400 text-[11px] leading-relaxed">العملية تتم مباشرة بينك وبين الوكيل. التطبيق يسجل العملية فقط لمنع النصب والاحتيال.</p>
                </div>
                <button onClick={() => { if(!wAmt){toast.error("اختر كمية الماس");return;} if(!wAgent.trim()){toast.error("أدخل SAKI ID للوكيل");return;} setStep("confirm"); }}
                  disabled={!wAmt||!wAgent.trim()} className="w-full py-4 rounded-2xl text-white font-black disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98]" style={{background:"linear-gradient(135deg,#a855f7,#ec4899)"}}>
                  💸 متابعة السحب
                </button>
              </>
            )}
            {wdHistory && wdHistory.length > 0 && (
              <div className="space-y-2">
                <p className="text-gray-400 text-xs font-bold">📋 سجل السحب</p>
                {wdHistory.slice(0,5).map(w => (
                  <div key={w._id} className="bg-white/5 border border-white/8 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0"><span className="text-sm">💎</span></div>
                    <div className="flex-1 min-w-0"><p className="text-white text-xs font-bold">{w.diamonds.toLocaleString()} ماسة → {w.agentName}</p><p className="text-gray-500 text-[10px]">{new Date(w.createdAt).toLocaleDateString("ar")}</p></div>
                    <p className="text-green-400 text-xs font-bold">${(w.diamonds/120000*10).toFixed(0)}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
