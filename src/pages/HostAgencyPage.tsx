// @ts-nocheck
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef } from "react";
import { toast } from "../lib/toast";
import HostAgencyOwnerDashboard from "./HostAgencyOwnerDashboard";
import HostAgencyMemberDashboard from "./HostAgencyMemberDashboard";

interface Props { onBack: () => void; }

export default function HostAgencyPage({ onBack }: Props) {
  const myAgency = useQuery(api.hostAgency.getMyAgency);
  const membership = useQuery(api.hostAgency.getMyMembership);
  const agencies = useQuery(api.hostAgency.listAgencies, { search: undefined });
  const createAgency = useMutation(api.hostAgency.createAgency);
  const requestJoin = useMutation(api.hostAgency.requestJoinAgency);
  const generateUploadUrl = useMutation(api.hostAgency.generateUploadUrl);

  const [view, setView] = useState<"list" | "create">("list");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [creating, setCreating] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  const filteredAgencies = (agencies ?? []).filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.ownerName.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!createName.trim()) { toast.error("أدخل اسم الوكالة"); return; }
    setCreating(true);
    try {
      let logoStorageId: any;
      if (logoFile) {
        const url = await generateUploadUrl();
        const res = await fetch(url, { method: "POST", headers: { "Content-Type": logoFile.type }, body: logoFile });
        const { storageId } = await res.json();
        logoStorageId = storageId;
      }
      await createAgency({ name: createName.trim(), description: createDesc.trim() || undefined, logoStorageId });
      toast.success("تم إرسال طلب إنشاء الوكالة! ⏳ بانتظار موافقة الإدارة");
      setView("list");
    } catch (e: any) {
      toast.error(e.message ?? "فشل إنشاء الوكالة");
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (agencyId: any) => {
    try {
      await requestJoin({ agencyId });
      toast.success("تم إرسال طلب الانضمام ✅");
    } catch (e: any) {
      toast.error(e.message ?? "فشل إرسال الطلب");
    }
  };

  // أثناء التحميل
  if (myAgency === undefined || membership === undefined) {
    return (
      <div className="flex flex-col h-full items-center justify-center" dir="rtl"
        style={{ background: "linear-gradient(180deg,#fff7ed 0%,#f8fafc 100%)" }}>
        <div className="w-10 h-10 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-slate-500 text-sm">جاري التحميل...</p>
      </div>
    );
  }
  if (myAgency && (myAgency.isBanned || myAgency.status === "banned")) return <BannedAgencyScreen agency={myAgency} onBack={onBack} />;
  if (myAgency && myAgency.status === "pending") return <PendingAgencyScreen agency={myAgency} onBack={onBack} />;
  if (myAgency && myAgency.status === "rejected") return <RejectedAgencyScreen agency={myAgency} onBack={onBack} />;
  if (myAgency && membership) {
    if (membership.role === "owner" || membership.role === "admin") return <HostAgencyOwnerDashboard onBack={onBack} />;
    return <HostAgencyMemberDashboard onBack={onBack} />;
  }

  return (
    <div className="flex flex-col h-full" dir="rtl"
      style={{ background: "linear-gradient(180deg,#fff7ed 0%,#f8fafc 100%)", fontFamily: "'Cairo', sans-serif" }}>

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3"
        style={{ background: "rgba(15,23,42,0.04)", borderBottom: "1px solid rgba(15,23,42,0.05)" }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90"
            style={{ background: "rgba(15,23,42,0.05)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="font-black text-lg text-slate-900">وكالة المضيفين</h1>
            <p className="text-xs" style={{ color: "#aaa" }}>{filteredAgencies.length} وكالة مسجلة</p>
          </div>
          <button onClick={() => setShowSearch(!showSearch)}
            className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90"
            style={{ background: "rgba(15,23,42,0.05)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          </button>
          <button onClick={() => setView(view === "create" ? "list" : "create")}
            className="px-4 py-2 rounded-xl font-bold text-sm active:scale-95"
            style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "white" }}>
            {view === "create" ? "إلغاء" : "+ إنشاء"}
          </button>
        </div>

        {showSearch && (
          <div className="relative">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن وكالة..."
              className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-900 placeholder-gray-500 outline-none"
              style={{ background: "rgba(15,23,42,0.05)", border: "1px solid rgba(15,23,42,0.08)" }}
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── نموذج الإنشاء ── */}
        {view === "create" && (
          <div className="p-4 space-y-4">
            <div className="rounded-2xl p-4 space-y-4"
              style={{ background: "rgba(15,23,42,0.06)", border: "1px solid rgba(15,23,42,0.08)" }}>
              <h2 className="font-black text-slate-900 text-base">إنشاء وكالة مضيفين جديدة</h2>

              {/* شعار الوكالة */}
              <div className="flex items-center gap-4">
                <button onClick={() => logoRef.current?.click()}
                  className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden active:scale-95"
                  style={{ background: "rgba(15,23,42,0.05)", border: "2px dashed rgba(15,23,42,0.05)" }}>
                  {logoPreview ? (
                    <img src={logoPreview} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <div className="text-2xl">🏢</div>
                      <div className="text-[10px] text-slate-500 mt-1">الشعار</div>
                    </div>
                  )}
                </button>
                <input ref={logoRef} type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }
                  }} />
                <div className="flex-1">
                  <p className="text-slate-900 text-sm font-bold">شعار الوكالة</p>
                  <p className="text-slate-500 text-xs mt-1">اضغط لرفع صورة الشعار</p>
                </div>
              </div>

              <div>
                <label className="text-slate-600 text-sm font-bold block mb-1.5">اسم الوكالة *</label>
                <input
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  placeholder="أدخل اسم الوكالة"
                  className="w-full px-4 py-3 rounded-xl text-slate-900 placeholder-gray-500 outline-none text-sm"
                  style={{ background: "rgba(15,23,42,0.05)", border: "1px solid rgba(15,23,42,0.08)" }}
                />
              </div>

              <div>
                <label className="text-slate-600 text-sm font-bold block mb-1.5">وصف الوكالة</label>
                <textarea
                  value={createDesc}
                  onChange={e => setCreateDesc(e.target.value)}
                  placeholder="أدخل وصفاً للوكالة..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-slate-900 placeholder-gray-500 outline-none text-sm resize-none"
                  style={{ background: "rgba(15,23,42,0.05)", border: "1px solid rgba(15,23,42,0.08)" }}
                />
              </div>

              {/* تنبيه المراجعة */}
              <div className="rounded-xl p-3 space-y-1.5"
                style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)" }}>
                <p className="text-yellow-400 text-xs font-bold">⏳ ملاحظة مهمة</p>
                <p className="text-slate-600 text-xs">سيتم مراجعة طلبك من قِبل الإدارة قبل تفعيل الوكالة</p>
                <p className="text-slate-600 text-xs">سيتم إشعارك فور الموافقة أو الرفض</p>
              </div>

              {/* معلومات النظام */}
              <div className="rounded-xl p-3 space-y-2"
                style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}>
                <p className="text-purple-300 text-xs font-bold">📋 معلومات نظام المضيفين</p>
                <p className="text-slate-600 text-xs">• المضيف يحصل على 70% من قيمة الهدايا كألماس</p>
                <p className="text-slate-600 text-xs">• يمكن سحب الألماس نقداً أو تحويله لكوين</p>
                <p className="text-slate-600 text-xs">• كل وكالة تحصل على معرف فريد مكون من 5 أرقام</p>
              </div>

              <button onClick={handleCreate} disabled={creating}
                className="w-full py-3.5 rounded-xl font-black text-white active:scale-95 transition-transform"
                style={{ background: creating ? "#555" : "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
                {creating ? "جاري الإرسال..." : "إرسال طلب الإنشاء 🚀"}
              </button>
            </div>
          </div>
        )}

        {/* ── قائمة الوكالات ── */}
        {view === "list" && (
          <div className="p-4 space-y-3">
            {agencies === undefined ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredAgencies.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🏢</div>
                <p className="text-slate-900 font-bold text-lg">لا توجد وكالات</p>
                <p className="text-slate-500 text-sm mt-2">كن أول من ينشئ وكالة مضيفين!</p>
              </div>
            ) : (
              filteredAgencies.map(agency => (
                <AgencyCard key={agency._id} agency={agency} onJoin={() => handleJoin(agency._id)} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BannedAgencyScreen({ agency, onBack }: { agency: any; onBack: () => void }) {
  return (
    <div className="flex flex-col h-full items-center justify-center p-6 text-center" dir="rtl" style={{ background: "linear-gradient(180deg,#fff1f2 0%,#f8fafc 100%)", fontFamily: "'Cairo', sans-serif" }}>
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-5" style={{ background: "#fee2e2", border: "1px solid #fecaca" }}>🚫</div>
      <h1 className="text-slate-900 text-xl font-black mb-2">تم حظر وكالة المضيفين</h1>
      <p className="text-slate-600 text-sm leading-7">تم إيقاف وكالة <strong>{agency.name}</strong> من قبل الإدارة، لذلك لا يمكن استخدام لوحة الوكالة أو استقبال طلبات جديدة.</p>
      {agency.banReason && <div className="w-full max-w-sm mt-5 rounded-2xl p-4 text-right" style={{ background: "#fff", border: "1px solid #fecaca" }}><p className="text-red-700 text-xs font-black mb-1">سبب الحظر</p><p className="text-slate-600 text-sm">{agency.banReason}</p></div>}
      <button onClick={onBack} className="mt-7 px-8 py-3 rounded-2xl text-white font-black text-sm" style={{ background: "#16a34a" }}>العودة</button>
    </div>
  );
}

function PendingAgencyScreen({ agency, onBack }: { agency: any; onBack: () => void }) {
  return (
    <div className="flex flex-col h-full relative" dir="rtl"
      style={{ background: "linear-gradient(180deg,#fff7ed 0%,#f8fafc 100%)", fontFamily: "'Cairo', sans-serif" }}>
      <button onClick={onBack} className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center z-10"
        style={{ background: "rgba(15,23,42,0.05)" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
      </button>
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-7xl mb-5 animate-pulse">⏳</div>
        <h2 className="text-slate-900 font-black text-2xl mb-2">طلبك قيد المراجعة</h2>
        <p className="text-slate-500 text-sm text-center mb-6 leading-relaxed">
          تم إرسال طلب إنشاء وكالة<br/>
          <span className="text-purple-400 font-bold">"{agency.name}"</span><br/>
          وهو الآن بانتظار موافقة الإدارة
        </p>
        <div className="rounded-2xl p-4 w-full max-w-sm space-y-3"
          style={{ background: "rgba(15,23,42,0.06)", border: "1px solid rgba(15,23,42,0.08)" }}>
          {agency.logoUrl && (
            <div className="flex justify-center mb-2">
              <img src={agency.logoUrl} className="w-16 h-16 rounded-2xl object-cover" />
            </div>
          )}
          <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "rgba(15,23,42,0.05)" }}>
            <span className="text-slate-500 text-xs">اسم الوكالة</span>
            <span className="text-slate-900 text-xs font-bold">{agency.name}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "rgba(15,23,42,0.05)" }}>
            <span className="text-slate-500 text-xs">معرف الوكالة</span>
            <span className="text-yellow-400 text-xs font-mono font-bold">#{agency.aginsId}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-slate-500 text-xs">الحالة</span>
            <span className="text-orange-400 text-xs font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse inline-block" />
              قيد المراجعة
            </span>
          </div>
        </div>
        <p className="text-slate-400 text-xs mt-5 text-center">سيتم إشعارك فور الموافقة أو الرفض</p>
      </div>
    </div>
  );
}

function RejectedAgencyScreen({ agency, onBack }: { agency: any; onBack: () => void }) {
  return (
    <div className="flex flex-col h-full relative" dir="rtl"
      style={{ background: "linear-gradient(180deg,#fff7ed 0%,#f8fafc 100%)", fontFamily: "'Cairo', sans-serif" }}>
      <button onClick={onBack} className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center z-10"
        style={{ background: "rgba(15,23,42,0.05)" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
      </button>
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-7xl mb-5">❌</div>
        <h2 className="text-slate-900 font-black text-2xl mb-2">تم رفض طلبك</h2>
        <p className="text-slate-500 text-sm text-center mb-6">
          تم رفض طلب إنشاء وكالة<br/>
          <span className="text-red-400 font-bold">"{agency.name}"</span>
        </p>
        {agency.rejectReason && (
          <div className="rounded-2xl p-4 w-full max-w-sm mb-4"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <p className="text-red-400 text-xs font-bold mb-1">سبب الرفض:</p>
            <p className="text-slate-600 text-sm">{agency.rejectReason}</p>
          </div>
        )}
        <p className="text-slate-400 text-xs text-center">يمكنك التواصل مع الدعم لمزيد من المعلومات</p>
      </div>
    </div>
  );
}

function AgencyCard({ agency, onJoin }: { agency: any; onJoin: () => void }) {
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    setJoining(true);
    try { await onJoin(); } finally { setJoining(false); }
  };

  return (
    <div className="rounded-2xl p-4"
      style={{ background: "rgba(15,23,42,0.06)", border: "1px solid rgba(15,23,42,0.08)" }}>
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{ background: "rgba(124,58,237,0.2)" }}>
          {agency.logoUrl ? (
            <img src={agency.logoUrl} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">🏢</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-slate-900 text-sm truncate">{agency.name}</h3>
            {agency.aginsId && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold flex-shrink-0"
                style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
                #{agency.aginsId}
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs mt-0.5">المالك: {agency.ownerName}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-purple-300">👥 {agency.memberCount} عضو</span>
            <span className="text-xs text-blue-300">💎 {formatDiamonds(agency.totalDiamonds ?? 0)}</span>
          </div>
        </div>
        <button onClick={handleJoin} disabled={joining}
          className="px-3 py-2 rounded-xl text-xs font-bold active:scale-95"
          style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "white" }}>
          {joining ? "..." : "انضمام"}
        </button>
      </div>
      {agency.description && (
        <p className="text-slate-500 text-xs mt-2 line-clamp-2">{agency.description}</p>
      )}
    </div>
  );
}

function formatDiamonds(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}
