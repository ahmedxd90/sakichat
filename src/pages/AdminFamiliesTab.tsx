// @ts-nocheck
import { supabase } from "../lib/supabaseClient";
import { useState, useEffect } from "react";
import { toast } from "../lib/toast";

export default function AdminFamiliesTab() {
  const [requests, setRequests] = useState<any[]>([]);
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('family_creation_requests').select('*').eq('status', 'pending');
      setRequests(data || []);
    };
    fetchData();
  }, []);

  const respond = async (args: any) => {};

  const handleRespond = async (requestId: string, approve: boolean) => {
    setLoading(requestId);
    try {
      await respond({
        requestId,
        approve,
        note: approve ? undefined : (rejectNote[requestId] || undefined),
      });
      toast.success(approve ? "✅ تمت الموافقة وإنشاء العائلة" : "تم رفض الطلب");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(null); }
  };

  return (
    <div className="p-4 space-y-4" dir="rtl">
      <div className="rounded-2xl p-3 text-xs text-gray-400"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        طلبات إنشاء العائلات تحتاج موافقتك قبل الإنشاء. الإنشاء مجاني بدون أي تكلفة.
      </div>
      {!requests ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">👨‍👩‍👧‍👦</p>
          <p className="text-gray-500 text-sm">لا توجد طلبات معلقة</p>
          <p className="text-gray-600 text-xs mt-1">ستظهر هنا طلبات إنشاء العائلات الجديدة</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-white font-bold text-sm">{requests.length} طلب معلق</p>
          {requests.map((req) => (
            <div key={req.id} className="rounded-2xl p-4 space-y-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-pink-600 to-purple-700 flex items-center justify-center">
                  {req.avatarUrl
                    ? <img src={req.avatarUrl} alt="" className="w-full h-full object-cover" />
                    : <span className="text-2xl">👨‍👩‍👧‍👦</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-base truncate">{req.name}</p>
                  {req.description && <p className="text-gray-400 text-xs truncate mt-0.5">{req.description}</p>}
                  <p className="text-purple-400 text-xs mt-1">
                    طلب من: <span className="font-bold text-white">{req.requesterName}</span>
                    <span className="font-mono text-gray-500 mr-1">#{req.requesterSakiId}</span>
                  </p>
                  <p className="text-gray-600 text-[10px] mt-0.5">{new Date(req.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}</p>
                </div>
              </div>
              <input
                value={rejectNote[req.id] || ""}
                onChange={(e) => setRejectNote(prev => ({ ...prev, [req.id]: e.target.value }))}
                placeholder="سبب الرفض (اختياري للرفض)..."
                className="w-full px-3 py-2 rounded-xl text-white text-xs outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleRespond(req.id as string, true)}
                  disabled={loading === req.id}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 transition-all"
                  style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }}>
                  {loading === req.id
                    ? <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                    : "✅ موافقة وإنشاء"}
                </button>
                <button
                  onClick={() => handleRespond(req.id as string, false)}
                  disabled={loading === req.id}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 transition-all"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
                  ❌ رفض
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
