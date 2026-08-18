// @ts-nocheck
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "../lib/toast";

interface Props { onBack: () => void; }

type Tab = "overview" | "members" | "requests" | "withdrawals" | "settings";

const WITHDRAWAL_TIERS = [
  { diamonds: 600000, usd: 10 },
  { diamonds: 1200000, usd: 20 },
  { diamonds: 1800000, usd: 30 },
  { diamonds: 2400000, usd: 40 },
  { diamonds: 3000000, usd: 50 },
  { diamonds: 6000000, usd: 60 },
];

export default function HostAgencyOwnerDashboard({ onBack }: Props) {
  const myAgency = useQuery(api.hostAgency.getMyAgency);
  const stats = useQuery(api.hostAgency.getAgencyStats);
  const pendingRequests = useQuery(api.hostAgency.getPendingJoinRequests);
  const withdrawals = useQuery(api.hostAgency.getAgencyWithdrawals);
  const myWithdrawals = useQuery(api.hostAgency.getMyWithdrawals);
  const approvedAgents = useQuery(api.hostAgencyExtra.listApprovedChargeAgents);

  const respondToRequest = useMutation(api.hostAgency.respondToJoinRequest);
  const removeMember = useMutation(api.hostAgency.removeMember);
  const setRole = useMutation(api.hostAgency.setMemberRole);
  const processWithdrawal = useMutation(api.hostAgency.processWithdrawal);
  const requestWithdrawal = useMutation(api.hostAgency.requestWithdrawal);
  const sellDiamonds = useMutation(api.hostAgencyExtra.sellAgencyDiamondsToAgent);
  const updateAgency = useMutation(api.hostAgency.updateAgency);

  const [tab, setTab] = useState<Tab>("overview");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    diamonds: 600000,
    method: "وكيل شحن",
    accountInfo: "",
    whatsapp: "",
    agentSakiId: "",
  });
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [showAgentPicker, setShowAgentPicker] = useState(false);

  if (!myAgency) return (
    <div className="flex-1 flex items-center justify-center" style={{ background: "#f8fafc" }}>
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const ownerMembership = myAgency.members?.find((m: any) => m.role === "owner");
  const ownerDiamonds = ownerMembership?.totalDiamonds ?? myAgency.myDiamonds ?? 0;
  const ownerPendingDiamonds = ownerMembership?.pendingDiamonds ?? myAgency.myPendingDiamonds ?? 0;

  const handleRespond = async (requestId: any, approve: boolean) => {
    try {
      await respondToRequest({ requestId, approve });
      toast.success(approve ? "تم قبول الطلب ✅" : "تم رفض الطلب");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleRemove = async (memberId: any) => {
    if (!confirm("هل تريد إزالة هذا العضو؟")) return;
    try {
      await removeMember({ memberId });
      toast.success("تم إزالة العضو");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleProcessWithdrawal = async (id: any, approve: boolean) => {
    setProcessingId(id);
    try {
      await processWithdrawal({ withdrawalId: id, approve });
      toast.success(approve ? "تم قبول طلب السحب ✅" : "تم رفض طلب السحب");
    } catch (e: any) { toast.error(e.message); }
    finally { setProcessingId(null); }
  };

  const handleOwnerWithdraw = async () => {
    if (!withdrawForm.accountInfo.trim()) { toast.error("اختر وكيل الشحن أو أدخل معلومات الحساب"); return; }
    try {
      if (withdrawForm.method === "وكيل شحن") {
        const selectedAgent = approvedAgents?.find((agent: any) => agent.sakiId === withdrawForm.accountInfo.trim());
        if (!selectedAgent) { toast.error("اختر وكيلاً معتمداً من القائمة"); return; }
        await sellDiamonds({ agentSakiId: selectedAgent.sakiId, diamonds: withdrawForm.diamonds });
        toast.success(`تم إرسال ${formatDiamonds(withdrawForm.diamonds)} ألماس إلى ${selectedAgent.name} ✅`);
      } else {
        await requestWithdrawal({
          diamonds: withdrawForm.diamonds,
          method: withdrawForm.method,
          accountInfo: withdrawForm.accountInfo,
          whatsapp: withdrawForm.whatsapp || undefined,
        });
        toast.success("تم إرسال طلب السحب ✅");
      }
      setShowWithdrawModal(false);
      setShowAgentPicker(false);
      setWithdrawForm(f => ({ ...f, accountInfo: "", agentSakiId: "", whatsapp: "" }));
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await updateAgency({
        name: editName || undefined,
        description: editDesc || undefined,
      });
      toast.success("تم حفظ الإعدادات ✅");
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingSettings(false); }
  };

  const tabs: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: "overview", label: "الرئيسية", icon: "🏠" },
    { id: "members", label: "المضيفين", icon: "👥", badge: myAgency.members?.length },
    { id: "requests", label: "الطلبات", icon: "📩", badge: myAgency.pendingCount },
    { id: "withdrawals", label: "السحوبات", icon: "💸", badge: stats?.pendingWithdrawals },
    { id: "settings", label: "الإعدادات", icon: "⚙️" },
  ];

  // Progress to next tier
  const totalDiamonds = myAgency.totalDiamonds ?? 0;
  const maxTier = WITHDRAWAL_TIERS[WITHDRAWAL_TIERS.length - 1];
  const nextTier = WITHDRAWAL_TIERS.find(t => t.diamonds > totalDiamonds) ?? maxTier;
  const prevTierDiamonds = WITHDRAWAL_TIERS.find(t => t.diamonds <= totalDiamonds)?.diamonds ?? 0;
  const progress = nextTier.diamonds > prevTierDiamonds
    ? Math.min(100, ((totalDiamonds - prevTierDiamonds) / (nextTier.diamonds - prevTierDiamonds)) * 100)
    : 100;

  return (
    <div className="flex flex-col h-full" dir="rtl"
      style={{ background: "#f8fafc", fontFamily: "'Cairo', sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{
        background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)",
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        padding: "16px 16px 20px",
        boxShadow: "0 10px 30px rgba(244,114,182,0.12)",
        flexShrink: 0,
      }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90"
            style={{ background: "rgba(15,23,42,0.05)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0"
              style={{ border: "2px solid rgba(15,23,42,0.08)", background: "rgba(15,23,42,0.05)" }}>
              {myAgency.logoUrl
                ? <img src={myAgency.logoUrl} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl">🏢</div>
              }
            </div>
            <div>
              <p className="text-slate-900/80 text-xs">مرحباً، مالك الوكالة 👑</p>
              <h1 className="text-slate-900 font-black text-base leading-tight">{myAgency.name}</h1>
              {myAgency.aginsId && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(15,23,42,0.05)", color: "#0f172a" }}>
                  #{myAgency.aginsId}
                </span>
              )}
            </div>
          </div>

          {/* Withdraw button */}
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black active:scale-95"
            style={{ background: "rgba(15,23,42,0.05)", color: "#0f172a", border: "1px solid rgba(15,23,42,0.1)" }}
          >
            <span>💰</span>
            <span>سحب</span>
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "ألماس الوكالة", value: formatDiamonds(totalDiamonds), icon: "💎" },
            { label: "المضيفين", value: `${stats?.memberCount ?? myAgency.members?.length ?? 0}`, icon: "👥" },
            { label: "ألماسي", value: formatDiamonds(ownerPendingDiamonds), icon: "🏆" },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-3 text-center"
              style={{ background: "rgba(15,23,42,0.04)", backdropFilter: "blur(10px)" }}>
              <div className="text-lg mb-0.5">{s.icon}</div>
              <div className="text-slate-900 font-black text-sm">{s.value}</div>
              <div className="text-slate-900/70 text-[10px]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold whitespace-nowrap flex-shrink-0 relative active:scale-95 transition-all"
              style={{
                background: tab === t.id
                  ? "linear-gradient(135deg,#6366f1,#a855f7)"
                  : "rgba(15,23,42,0.08)",
                color: tab === t.id ? "white" : "#64748b",
                border: tab === t.id ? "none" : "1px solid rgba(15,23,42,0.05)",
              }}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {t.badge !== undefined && t.badge > 0 && (
                <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-red-500 text-slate-900 text-[9px] font-black flex items-center justify-center">
                  {t.badge > 9 ? "9+" : t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">

        {/* ── نظرة عامة ── */}
        {tab === "overview" && (
          <>
            {/* Progress bar */}
            <div className="rounded-2xl p-4"
              style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.08)" }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-slate-900 font-black text-sm">تارجت الوكالة 🎯</h3>
                <span className="text-purple-400 text-xs font-bold">{Math.round(progress)}%</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                <span>💎 {formatDiamonds(totalDiamonds)}</span>
                <span>الهدف: {formatDiamonds(nextTier.diamonds)}</span>
              </div>
              <div className="w-full h-3 rounded-full" style={{ background: "#e2e8f0" }}>
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #8b5cf6, #d946ef)",
                  }} />
              </div>
              <p className="text-slate-400 text-[11px] mt-2">
                بقي {formatDiamonds(Math.max(0, nextTier.diamonds - totalDiamonds))} ألماسة للوصول إلى ${nextTier.usd}
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "إجمالي الألماس", value: formatDiamonds(totalDiamonds), icon: "💎", color: "#a855f7" },
                { label: "عدد الأعضاء", value: stats?.memberCount ?? 0, icon: "👥", color: "#3b82f6" },
                { label: "سحوبات معلقة", value: stats?.pendingWithdrawals ?? 0, icon: "⏳", color: "#f59e0b" },
                { label: "إجمالي المدفوع", value: `$${stats?.totalPaidUsd ?? 0}`, icon: "💵", color: "#10b981" },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl p-4"
                  style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.08)" }}>
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className="font-black text-xl" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-slate-500 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* My diamonds card */}
            <div className="rounded-2xl p-4"
              style={{ background: "linear-gradient(135deg,#fff7ed,#fff1f2)", border: "1px solid rgba(139,92,246,0.3)" }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-slate-900 font-black text-sm">محفظتي 💰</h3>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-black active:scale-95"
                  style={{ background: "linear-gradient(135deg,#8b5cf6,#d946ef)", color: "#fff" }}
                >
                  سحب الآن
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3 text-center" style={{ background: "rgba(139,92,246,0.2)" }}>
                  <p className="text-purple-300 text-xs mb-1">إجمالي ألماسي</p>
                  <p className="text-slate-900 font-black text-lg">💎 {formatDiamonds(ownerDiamonds)}</p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: "rgba(16,185,129,0.2)" }}>
                  <p className="text-green-300 text-xs mb-1">قابل للسحب</p>
                  <p className="text-slate-900 font-black text-lg">💎 {formatDiamonds(ownerPendingDiamonds)}</p>
                </div>
              </div>
            </div>

            {/* Withdrawal tiers */}
            <div className="rounded-2xl p-4"
              style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.08)" }}>
              <h3 className="text-slate-900 font-black text-sm mb-3">جدول مستويات السحب 💸</h3>
              <div className="space-y-2">
                {WITHDRAWAL_TIERS.map((tier, i) => {
                  const reached = totalDiamonds >= tier.diamonds;
                  return (
                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl"
                      style={{
                        background: reached ? "rgba(139,92,246,0.15)" : "rgba(15,23,42,0.04)",
                        border: reached ? "1px solid rgba(139,92,246,0.3)" : "1px solid transparent",
                      }}>
                      <div className="flex items-center gap-2">
                        {reached && <span className="text-green-400 text-xs">✅</span>}
                        <span className="text-purple-300 text-sm font-bold">💎 {formatDiamonds(tier.diamonds)}</span>
                      </div>
                      <span className="text-green-400 text-sm font-black">${tier.usd}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* My withdrawals history */}
            {(myWithdrawals ?? []).length > 0 && (
              <div className="rounded-2xl p-4"
                style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.08)" }}>
                <h3 className="text-slate-900 font-black text-sm mb-3">سجل سحوباتي</h3>
                <div className="space-y-2">
                  {(myWithdrawals ?? []).slice(0, 5).map((w: any) => (
                    <div key={w._id} className="flex items-center justify-between py-2 px-3 rounded-xl"
                      style={{ background: "rgba(15,23,42,0.04)" }}>
                      <div>
                        <p className="text-slate-900 text-xs font-bold">💎 {formatDiamonds(w.diamonds)} → ${w.usdAmount}</p>
                        <p className="text-slate-400 text-[10px]">{w.method} • {new Date(w.createdAt).toLocaleDateString("ar")}</p>
                      </div>
                      <WithdrawalStatusBadge status={w.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── المضيفين ── */}
        {tab === "members" && (
          <div className="space-y-3">
            {(myAgency.members ?? []).length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">👥</div>
                <p className="text-slate-500">لا يوجد أعضاء بعد</p>
              </div>
            ) : (myAgency.members ?? []).map((member: any) => (
              <div key={member._id} className="rounded-2xl p-4"
                style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.08)" }}>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0"
                      style={{ background: "rgba(99,102,241,0.2)" }}>
                      {member.profile?.avatarUrl
                        ? <img src={member.profile.avatarUrl} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-lg font-black text-slate-900">
                            {member.profile?.name?.[0] ?? "؟"}
                          </div>
                      }
                    </div>
                    {/* Online dot */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500"
                      style={{ border: "2px solid #ffffff" }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-slate-900 text-sm truncate">{member.profile?.name ?? "مجهول"}</span>
                      <RoleBadge role={member.role} />
                    </div>
                    <p className="text-slate-500 text-xs">ID: {member.profile?.sakiId ?? ""}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-purple-300 text-xs">💎 {formatDiamonds(member.totalDiamonds ?? 0)}</span>
                      {member.pendingDiamonds > 0 && (
                        <span className="text-yellow-400 text-xs">⏳ {formatDiamonds(member.pendingDiamonds)}</span>
                      )}
                    </div>
                  </div>

                  {member.role !== "owner" && (
                    <div className="flex flex-col gap-1.5">
                      <button onClick={() => setRole({ memberId: member.userId, role: member.role === "admin" ? "host" : "admin" })}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold active:scale-95"
                        style={{ background: "rgba(59,130,246,0.2)", color: "#60a5fa" }}>
                        {member.role === "admin" ? "إلغاء أدمن" : "أدمن"}
                      </button>
                      <button onClick={() => handleRemove(member.userId)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold active:scale-95"
                        style={{ background: "rgba(239,68,68,0.2)", color: "#f87171" }}>
                        إزالة
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── الطلبات ── */}
        {tab === "requests" && (
          <div className="space-y-3">
            {(pendingRequests ?? []).length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-slate-500">لا توجد طلبات انضمام معلقة</p>
              </div>
            ) : (pendingRequests ?? []).map((req: any) => (
              <div key={req._id} className="rounded-2xl p-4"
                style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.08)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0"
                    style={{ background: "rgba(99,102,241,0.2)" }}>
                    {req.profile?.avatarUrl
                      ? <img src={req.profile.avatarUrl} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-lg font-black text-slate-900">
                          {req.userName?.[0] ?? "؟"}
                        </div>
                    }
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 text-sm">{req.userName}</p>
                    <p className="text-slate-500 text-xs">ID: {req.userSakiId}</p>
                    <p className="text-slate-400 text-xs">{new Date(req.createdAt).toLocaleDateString("ar")}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleRespond(req._id, true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95"
                      style={{ background: "rgba(16,185,129,0.2)", color: "#34d399" }}>
                      ✅ قبول
                    </button>
                    <button onClick={() => handleRespond(req._id, false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95"
                      style={{ background: "rgba(239,68,68,0.2)", color: "#f87171" }}>
                      ❌ رفض
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── السحوبات ── */}
        {tab === "withdrawals" && (
          <div className="space-y-3">
            {/* Owner withdraw button */}
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="w-full py-3 rounded-2xl font-black text-sm active:scale-[0.98] transition-all"
              style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "#fff" }}
            >
              💰 سحب نسبتي كمالك الوكالة
            </button>

            {(withdrawals ?? []).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">💸</div>
                <p className="text-slate-500">لا توجد طلبات سحب من المضيفين</p>
              </div>
            ) : (withdrawals ?? []).map((w: any) => (
              <div key={w._id} className="rounded-2xl p-4"
                style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.08)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{w.userName}</p>
                    <p className="text-slate-500 text-xs">ID: {w.userSakiId}</p>
                  </div>
                  <WithdrawalStatusBadge status={w.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="rounded-xl p-2 text-center" style={{ background: "rgba(168,85,247,0.15)" }}>
                    <p className="text-purple-300 text-xs">الألماس</p>
                    <p className="text-slate-900 font-black text-sm">💎 {formatDiamonds(w.diamonds)}</p>
                  </div>
                  <div className="rounded-xl p-2 text-center" style={{ background: "rgba(16,185,129,0.15)" }}>
                    <p className="text-green-300 text-xs">المبلغ</p>
                    <p className="text-slate-900 font-black text-sm">💵 ${w.usdAmount}</p>
                  </div>
                </div>
                <div className="text-xs text-slate-500 mb-1">
                  <span>طريقة الدفع: </span><span className="text-slate-900">{w.method}</span>
                </div>
                <div className="text-xs text-slate-500 mb-3">
                  <span>معلومات الحساب: </span><span className="text-slate-900">{w.accountInfo}</span>
                </div>
                {w.agentName && (
                  <div className="mb-3 rounded-xl px-3 py-2" style={{ background: "rgba(245,158,11,0.1)" }}>
                    <p className="text-amber-700 text-xs font-black">وكيل الشحن: {w.agentName}</p>
                    <p className="text-amber-700 text-[10px] font-mono">Saki ID: {w.agentSakiId}</p>
                  </div>
                )}
                {w.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => handleProcessWithdrawal(w._id, true)}
                      disabled={processingId === w._id}
                      className="flex-1 py-2 rounded-xl text-xs font-bold active:scale-95"
                      style={{ background: "rgba(16,185,129,0.2)", color: "#34d399" }}>
                      {processingId === w._id ? "..." : "✅ قبول"}
                    </button>
                    <button onClick={() => handleProcessWithdrawal(w._id, false)}
                      disabled={processingId === w._id}
                      className="flex-1 py-2 rounded-xl text-xs font-bold active:scale-95"
                      style={{ background: "rgba(239,68,68,0.2)", color: "#f87171" }}>
                      ❌ رفض
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── الإعدادات ── */}
        {tab === "settings" && (
          <div className="space-y-4">
            <div className="rounded-2xl p-4"
              style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.08)" }}>
              <h3 className="text-slate-900 font-black text-sm mb-4">إعدادات الوكالة ⚙️</h3>

              <div className="space-y-3">
                <div>
                  <label className="text-slate-500 text-xs mb-1 block">اسم الوكالة</label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder={myAgency.name}
                    className="w-full px-4 py-3 rounded-xl text-slate-900 text-sm outline-none"
                    style={{ background: "rgba(15,23,42,0.08)", border: "1px solid rgba(15,23,42,0.08)" }}
                  />
                </div>
                <div>
                  <label className="text-slate-500 text-xs mb-1 block">وصف الوكالة</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder={myAgency.description ?? "أضف وصفاً للوكالة..."}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-slate-900 text-sm outline-none resize-none"
                    style={{ background: "rgba(15,23,42,0.08)", border: "1px solid rgba(15,23,42,0.08)" }}
                  />
                </div>
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="w-full py-3 rounded-xl font-black text-sm active:scale-95"
                  style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "#fff" }}
                >
                  {savingSettings ? "جاري الحفظ..." : "💾 حفظ الإعدادات"}
                </button>
              </div>
            </div>

            {/* Agency info */}
            <div className="rounded-2xl p-4"
              style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.08)" }}>
              <h3 className="text-slate-900 font-black text-sm mb-3">معلومات الوكالة</h3>
              <div className="space-y-2">
                {[
                  { label: "الاسم", value: myAgency.name },
                  { label: "معرف الوكالة", value: `#${myAgency.aginsId ?? "—"}` },
                  { label: "الدولة", value: myAgency.country ?? "—" },
                  { label: "تاريخ الإنشاء", value: new Date(myAgency.createdAt).toLocaleDateString("ar") },
                  { label: "الحالة", value: myAgency.status === "active" ? "✅ نشطة" : "⏳ معلقة" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 px-3 rounded-xl"
                    style={{ background: "rgba(15,23,42,0.04)" }}>
                    <span className="text-slate-500 text-xs">{item.label}</span>
                    <span className="text-slate-900 text-xs font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── WITHDRAW MODAL ── */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[500] flex items-end justify-center" dir="rtl"
          onClick={() => setShowWithdrawModal(false)}>
          <div className="absolute inset-0 bg-black/70" />
          <div
            className="relative w-full rounded-t-3xl p-6 space-y-4"
            style={{ background: "#ffffff", maxHeight: "85vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center mb-2">
              <div className="w-10 h-1.5 rounded-full bg-white/20" />
            </div>

            <h2 className="text-slate-900 font-black text-lg text-center">💰 سحب نسبتي</h2>

            {/* Balance */}
            <div className="rounded-2xl p-4 text-center"
              style={{ background: "linear-gradient(135deg,#fff7ed,#fff1f2)", border: "1px solid rgba(139,92,246,0.3)" }}>
              <p className="text-purple-300 text-xs mb-1">رصيدك القابل للسحب</p>
              <p className="text-slate-900 font-black text-2xl">💎 {formatDiamonds(ownerPendingDiamonds)}</p>
            </div>

            {/* Tier selector */}
            <div>
              <label className="text-slate-500 text-xs mb-2 block">اختر مستوى السحب</label>
              <div className="grid grid-cols-2 gap-2">
                {WITHDRAWAL_TIERS.map((tier) => {
                  const canWithdraw = ownerPendingDiamonds >= tier.diamonds;
                  const selected = withdrawForm.diamonds === tier.diamonds;
                  return (
                    <button
                      key={tier.diamonds}
                      onClick={() => canWithdraw && setWithdrawForm(f => ({ ...f, diamonds: tier.diamonds }))}
                      disabled={!canWithdraw}
                      className="py-3 rounded-xl text-xs font-bold active:scale-95 transition-all"
                      style={{
                        background: selected ? "linear-gradient(135deg,#6366f1,#a855f7)" : "rgba(15,23,42,0.08)",
                        color: selected ? "#fff" : canWithdraw ? "#64748b" : "#475569",
                        border: selected ? "none" : "1px solid rgba(15,23,42,0.05)",
                        opacity: canWithdraw ? 1 : 0.5,
                      }}
                    >
                      <div>💎 {formatDiamonds(tier.diamonds)}</div>
                      <div style={{ color: selected ? "#fff" : "#10b981" }}>${tier.usd}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Method */}
            <div>
              <label className="text-slate-500 text-xs mb-2 block">طريقة الاستلام</label>
              <div className="flex gap-2">
                {["وكيل شحن", "تحويل بنكي"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setWithdrawForm(f => ({ ...f, method: m }))}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold active:scale-95"
                    style={{
                      background: withdrawForm.method === m ? "linear-gradient(135deg,#6366f1,#a855f7)" : "rgba(15,23,42,0.08)",
                      color: withdrawForm.method === m ? "#fff" : "#64748b",
                      border: withdrawForm.method === m ? "none" : "1px solid rgba(15,23,42,0.05)",
                    }}
                  >
                    {m === "وكيل شحن" ? "🏪 " : "🏦 "}{m}
                  </button>
                ))}
              </div>
            </div>

            {withdrawForm.method === "وكيل شحن" ? (
              <div className="rounded-2xl p-3" style={{ background: "#fff7ed", border: "1px solid rgba(245,158,11,0.22)" }}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div>
                    <p className="text-slate-900 text-xs font-black">وكيل الشحن المستلم</p>
                    <p className="text-slate-500 text-[10px]">لا يمكن الإرسال إلا إلى وكيل معتمد</p>
                  </div>
                  <button onClick={() => setShowAgentPicker(v => !v)}
                    className="px-3 py-2 rounded-xl text-[11px] font-black active:scale-95"
                    style={{ background: "#f59e0b", color: "#fff" }}>
                    وكلاء الشحن
                  </button>
                </div>
                {withdrawForm.accountInfo && (
                  <div className="rounded-xl px-3 py-2" style={{ background: "rgba(16,185,129,0.1)" }}>
                    <p className="text-green-700 text-xs font-black">تم اختيار: {approvedAgents?.find((agent: any) => agent.sakiId === withdrawForm.accountInfo)?.name ?? withdrawForm.accountInfo}</p>
                    <p className="text-green-700 text-[10px] font-mono">{withdrawForm.accountInfo}</p>
                  </div>
                )}
                {showAgentPicker && (
                  <div className="mt-2 space-y-2">
                    {approvedAgents === undefined ? (
                      <div className="text-center text-slate-400 text-xs py-3">جاري تحميل الوكلاء...</div>
                    ) : approvedAgents.length === 0 ? (
                      <div className="text-center text-slate-400 text-xs py-3">لا يوجد وكلاء شحن معتمدون حالياً</div>
                    ) : approvedAgents.map((agent: any) => (
                      <button key={agent.sakiId}
                        onClick={() => { setWithdrawForm(f => ({ ...f, accountInfo: agent.sakiId, agentSakiId: agent.sakiId })); setShowAgentPicker(false); }}
                        className="w-full flex items-center gap-3 rounded-xl p-2 text-right active:scale-[0.99]"
                        style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.06)" }}>
                        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0" style={{ background: "#f1f5f9" }}>
                          {agent.avatarUrl ? <img src={agent.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">👤</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-900 text-xs font-black truncate">{agent.name}</p>
                          <p className="text-slate-500 text-[10px] font-mono">Saki ID: {agent.sakiId}</p>
                        </div>
                        <span className="text-green-600 text-[10px] font-black">معتمد</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="text-slate-500 text-xs mb-1 block">رقم الحساب البنكي / IBAN</label>
                <input
                  value={withdrawForm.accountInfo}
                  onChange={(e) => setWithdrawForm(f => ({ ...f, accountInfo: e.target.value }))}
                  placeholder="مثال: SA0380000000608010167519"
                  className="w-full px-4 py-3 rounded-xl text-slate-900 text-sm outline-none"
                  style={{ background: "rgba(15,23,42,0.08)", border: "1px solid rgba(15,23,42,0.08)" }}
                />
              </div>
            )}

            {/* WhatsApp */}
            <div>
              <label className="text-slate-500 text-xs mb-1 block">رقم واتساب (اختياري)</label>
              <input
                value={withdrawForm.whatsapp}
                onChange={(e) => setWithdrawForm(f => ({ ...f, whatsapp: e.target.value }))}
                placeholder="مثال: +966501234567"
                className="w-full px-4 py-3 rounded-xl text-slate-900 text-sm outline-none"
                style={{ background: "rgba(15,23,42,0.08)", border: "1px solid rgba(15,23,42,0.08)" }}
              />
            </div>

            {/* Summary */}
            <div className="rounded-xl p-3" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">ستسحب:</span>
                <span className="text-slate-900 font-black">💎 {formatDiamonds(withdrawForm.diamonds)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-slate-500">ستستلم:</span>
                <span className="text-green-400 font-black">${WITHDRAWAL_TIERS.find(t => t.diamonds === withdrawForm.diamonds)?.usd ?? 0}</span>
              </div>
            </div>

            <button
              onClick={handleOwnerWithdraw}
              className="w-full py-4 rounded-2xl font-black text-base active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "#fff" }}
            >
              💰 إرسال طلب السحب
            </button>

            <button
              onClick={() => setShowWithdrawModal(false)}
              className="w-full py-3 rounded-2xl font-bold text-sm"
              style={{ background: "rgba(15,23,42,0.08)", color: "#64748b" }}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    owner: { label: "المالك 👑", color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
    admin: { label: "أدمن", color: "#60a5fa", bg: "rgba(96,165,250,0.15)" },
    host: { label: "مضيف", color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
  };
  const c = config[role] ?? config.host;
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
      style={{ background: c.bg, color: c.color }}>{c.label}</span>
  );
}

function WithdrawalStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "⏳ معلق", color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
    sent_to_agent: { label: "✅ تم التحويل للوكيل", color: "#047857", bg: "rgba(16,185,129,0.12)" },
    approved: { label: "✅ مقبول", color: "#34d399", bg: "rgba(52,211,153,0.15)" },
    rejected: { label: "❌ مرفوض", color: "#f87171", bg: "rgba(248,113,113,0.15)" },
  };
  const c = config[status] ?? config.pending;
  return (
    <span className="text-xs px-2 py-1 rounded-full font-bold"
      style={{ background: c.bg, color: c.color }}>{c.label}</span>
  );
}

function formatDiamonds(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}
