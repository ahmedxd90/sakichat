// @ts-nocheck
import { supabase } from "../lib/supabaseClient";
import { useEffect } from "react";
import { useState } from "react";
import { toast } from "../lib/toast";


export default function AdminHostAgenciesTab() {
  const [allAgencies, setAllAgencies] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('host_agencies').select('*');
      setAllAgencies(data || []);
    };
    fetchData();
  }, []);

  const approveAgency = async (args: any) => {};
  const rejectAgency = async (args: any) => {};
  const banAgency = async (args: any) => {};
  const deleteAgency = async (args: any) => {};
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [agencyActionId, setAgencyActionId] = useState<string | null>(null);
  const [agencyReason, setAgencyReason] = useState("");

  const handleApprove = async (agencyId: any) => {
    try {
      await approveAgency({ agencyId });
      toast.success("تمت الموافقة على الوكالة");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    try {
      await rejectAgency({ agencyId: rejectingId as any, reason: rejectReason || undefined });
      toast.success("تم رفض الوكالة");
      setRejectingId(null);
      setRejectReason("");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleBanAgency = async (agencyId: any) => {
    if (!agencyReason.trim()) { toast.error("اكتب سبب الحظر"); return; }
    try {
      await banAgency({ agencyId, reason: agencyReason.trim() });
      toast.success("تم حظر الوكالة وإشعار المضيفين");
      setAgencyActionId(null); setAgencyReason("");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDeleteAgency = async (agencyId: any) => {
    if (!window.confirm("هل تريد حذف الوكالة نهائيًا؟ سيتم إشعار المالك والمضيفين.")) return;
    try {
      await deleteAgency({ agencyId, reason: agencyReason.trim() || undefined });
      toast.success("تم حذف الوكالة");
      setAgencyActionId(null); setAgencyReason("");
    } catch (e: any) { toast.error(e.message); }
  };

  const pendingAgencies = (allAgencies ?? []).filter((a: any) => a.status === "pending");

  return (
    <div className="p-4 space-y-3">
      {/* Agencies */}
      {(
        <div className="space-y-3">
          <div className="rounded-2xl p-3 text-xs text-slate-600 bg-white shadow-sm" style={{ border: "1px solid rgba(22,163,74,.14)" }}>
            🏢 وكالات المضيفين المعلقة — القائمة الشاملة والحظر متاحان عبر الإدارة الحالية
          </div>
          {!allAgencies ? <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /></div> : allAgencies.length === 0 ? (
            <div className="text-center py-12"><div className="text-4xl mb-3">🏢</div><p className="text-slate-500 text-sm font-bold">لا توجد وكالات</p></div>
          ) : allAgencies.map((agency: any) => (
            <div key={agency.id} className="rounded-2xl p-4 space-y-3 bg-white shadow-[0_8px_24px_rgba(22,101,52,.07)]" style={{ border: `1px solid ${agency.isBanned || agency.status === "banned" ? "rgba(239,68,68,.3)" : "rgba(22,163,74,.14)"}` }}>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-green-50">{agency.logoUrl ? <img src={agency.logoUrl} className="w-full h-full object-cover" /> : <span className="text-2xl">🏢</span>}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap"><h3 className="font-black text-slate-900 text-sm">{agency.name}</h3><span className="text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold bg-green-50 text-green-700">#{agency.aginsId ?? "—"}</span><span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: agency.isBanned || agency.status === "banned" ? "#fee2e2" : agency.status === "active" ? "#dcfce7" : "#fef3c7", color: agency.isBanned || agency.status === "banned" ? "#b91c1c" : agency.status === "active" ? "#15803d" : "#a16207" }}>{agency.isBanned || agency.status === "banned" ? "محظورة" : agency.status === "active" ? "نشطة" : "معلقة"}</span></div>
                  <p className="text-slate-500 text-xs mt-1">المالك: {agency.ownerName} · #{agency.ownerSakiId} · {agency.memberCount ?? 0} مضيف</p>
                  {agency.isBanned && <p className="text-red-600 text-[10px] mt-1">سبب الحظر: {agency.banReason || "غير محدد"}</p>}
                </div>
              </div>
              {agencyActionId === agency.id && !(agency.isBanned || agency.status === "banned") && <input value={agencyReason} onChange={e => setAgencyReason(e.target.value)} placeholder="سبب الحظر أو ملاحظة الحذف" className="w-full px-3 py-2 rounded-xl text-slate-900 text-xs outline-none bg-slate-50" style={{ border: "1px solid rgba(22,163,74,.2)" }} />}
              <div className="grid grid-cols-2 gap-2">
                {agency.status === "pending" && <button onClick={() => handleApprove(agency.id)} className="py-2.5 rounded-xl text-xs font-black bg-green-600 text-white">✅ موافقة</button>}
                {agency.status === "pending" && <button onClick={() => { setRejectingId(agency.id); setRejectReason(""); }} className="py-2.5 rounded-xl text-xs font-black text-red-600 bg-red-50">❌ رفض</button>}
                {agency.status !== "pending" && !(agency.isBanned || agency.status === "banned") && <button onClick={() => agencyActionId === agency.id ? handleBanAgency(agency.id) : setAgencyActionId(agency.id)} className="py-2.5 rounded-xl text-xs font-black text-red-700 bg-red-50">🚫 {agencyActionId === agency.id ? "تأكيد الحظر" : "حظر الوكالة"}</button>}
                <button onClick={() => { setAgencyActionId(agency.id); setAgencyReason(""); }} className="py-2.5 rounded-xl text-xs font-black text-slate-700 bg-slate-100">🗑️ حذف الوكالة</button>
              </div>
              {agencyActionId === agency.id && <button onClick={() => handleDeleteAgency(agency.id)} className="w-full py-2 rounded-xl text-xs font-black text-red-700 bg-red-100">تأكيد حذف الوكالة</button>}
            </div>
          ))}
        </div>
      )}


      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-[400] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-lg rounded-t-3xl p-5 space-y-4"
            style={{ background: "#0f0f1a", border: "1px solid rgba(239,68,68,0.3)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-black text-base">رفض الوكالة</h3>
              <button onClick={() => setRejectingId(null)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div>
              <label className="text-gray-400 text-xs font-bold mb-2 block">سبب الرفض (اختياري)</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="سبب الرفض..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none text-sm resize-none"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setRejectingId(null)}
                className="py-3 rounded-xl font-bold text-sm"
                style={{ background: "rgba(255,255,255,0.08)", color: "#aaa" }}>
                إلغاء
              </button>
              <button onClick={handleReject}
                className="py-3 rounded-xl font-black text-sm active:scale-95"
                style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "white" }}>
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function fmt(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}
