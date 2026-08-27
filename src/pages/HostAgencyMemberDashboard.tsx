// @ts-nocheck
import { supabase } from "../lib/supabaseClient";
import { useEffect } from "react";
import { useState } from "react";
import { toast } from "../lib/toast";

interface Props { onBack: () => void; }

type Tab = "overview" | "wallet" | "withdraw" | "history";

// التارجتات الجديدة
const WITHDRAWAL_TIERS = [
  { diamonds: 1200000,  usd: 10,  level: 1 },
  { diamonds: 2400000,  usd: 20,  level: 2 },
  { diamonds: 3600000,  usd: 30,  level: 3 },
  { diamonds: 4800000,  usd: 40,  level: 4 },
  { diamonds: 6000000,  usd: 50,  level: 5 },
  { diamonds: 7200000,  usd: 60,  level: 6 },
  { diamonds: 8400000,  usd: 70,  level: 7 },
  { diamonds: 9600000,  usd: 80,  level: 8 },
  { diamonds: 10800000, usd: 90,  level: 9 },
  { diamonds: 12000000, usd: 100, level: 10 },
];

export default function HostAgencyMemberDashboard({ onBack }: Props) {
  const [myAgency, setMyAgency] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);
  const [myWithdrawals, setMyWithdrawals] = useState<any[]>([]);
  const [mySales, setMySales] = useState<any[]>([]);
  const [approvedAgents, setApprovedAgents] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: mem } = await supabase.from('host_agency_members').select('*, host_agencies(*)').eq('user_id', user.id).single();
        setMembership(mem);
        setMyAgency(mem?.host_agencies);
        const { data: withs } = await supabase.from('host_agency_withdrawals').select('*').eq('user_id', user.id);
        setMyWithdrawals(withs || []);
        const { data: sales } = await supabase.from('host_agency_diamond_sales').select('*').eq('seller_id', user.id);
        setMySales(sales || []);
        const { data: ags } = await supabase.from('charge_agents').select('*').eq('status', 'approved');
        setApprovedAgents(ags || []);
      }
    };
    fetchData();
  }, []);

  const requestWithdrawal = async (args: any) => {
    await supabase.from('host_agency_withdrawals').insert({
      user_id: membership.user_id,
      diamonds: args.diamonds,
      method: args.method,
      account_info: args.accountInfo,
      whatsapp: args.whatsapp
    });
  };
  const convertDiamonds = async (args: any) => {
    // Logic for converting diamonds
    return { coins: args.diamonds * 0.1 };
  };
  const leaveAgency = async () => {
    await supabase.from('host_agency_members').delete().eq('id', membership.id);
  };
  const sellDiamonds = async (args: any) => {
    await supabase.from('host_agency_diamond_sales').insert({
      seller_id: membership.user_id,
      agent_saki_id: args.agentSakiId,
      diamonds: args.diamonds
    });
  };

  const [tab, setTab] = useState<Tab>("overview");

  // Withdraw form
  const [selectedTier, setSelectedTier] = useState<typeof WITHDRAWAL_TIERS[0] | null>(null);
  const [method, setMethod] = useState("وكيل شحن");
  const [accountInfo, setAccountInfo] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawAgents, setShowWithdrawAgents] = useState(false);
  const [showWalletAgents, setShowWalletAgents] = useState(false);

  // Convert
  const [convertAmount, setConvertAmount] = useState("");
  const [converting, setConverting] = useState(false);

  // Sell to agent
  const [agentSakiId, setAgentSakiId] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [selling, setSelling] = useState(false);
  const [agentResult, setAgentResult] = useState<any>(null);
  useEffect(() => {
    if (agentSakiId.trim().length >= 4) {
      supabase.from('charge_agents').select('*').eq('saki_id', agentSakiId.trim()).single().then(({ data }) => setAgentResult(data));
    } else {
      setAgentResult(null);
    }
  }, [agentSakiId]);

  if (!myAgency || !membership) return (
    <div className="flex-1 flex items-center justify-center" style={{ background: "#f8fafc" }}>
      <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const pendingDiamonds = membership.pendingDiamonds ?? 0;
  const totalDiamonds = membership.totalDiamonds ?? 0;
  const withdrawnDiamonds = membership.withdrawnDiamonds ?? 0;
  const isOwner = membership.role === "owner";

  // Current tier progress
  const currentTier = [...WITHDRAWAL_TIERS].reverse().find(t => totalDiamonds >= t.diamonds);
  const nextTier = WITHDRAWAL_TIERS.find(t => t.diamonds > totalDiamonds) ?? WITHDRAWAL_TIERS[WITHDRAWAL_TIERS.length - 1];
  const prevTierDiamonds = currentTier?.diamonds ?? 0;
  const progress = nextTier.diamonds > prevTierDiamonds
    ? Math.min(100, ((totalDiamonds - prevTierDiamonds) / (nextTier.diamonds - prevTierDiamonds)) * 100)
    : 100;

  const handleWithdraw = async () => {
    if (!selectedTier) { toast.error("اختر مستوى السحب"); return; }
    if (!method.trim()) { toast.error("اختر طريقة الدفع"); return; }
    if (!accountInfo.trim()) { toast.error("أدخل معلومات الحساب"); return; }
    setWithdrawing(true);
    try {
      if (method === "وكيل شحن") {
        const selectedAgent = approvedAgents?.find((agent: any) => agent.sakiId === accountInfo.trim());
        if (!selectedAgent) { toast.error("اختر وكيلاً معتمداً من القائمة"); return; }
        await sellDiamonds({ agentSakiId: selectedAgent.sakiId, diamonds: selectedTier.diamonds });
        toast.success(`تم إرسال ${formatDiamonds(selectedTier.diamonds)} ألماس إلى ${selectedAgent.name} ✅`);
      } else {
        await requestWithdrawal({
          diamonds: selectedTier.diamonds,
          method: method.trim(),
          accountInfo: accountInfo.trim(),
          whatsapp: whatsapp.trim() || undefined,
        });
        toast.success("تم إرسال طلب السحب ✅");
      }
      setSelectedTier(null); setMethod("وكيل شحن"); setAccountInfo(""); setWhatsapp(""); setShowWithdrawAgents(false);
    } catch (e: any) { toast.error(e.message ?? "فشل إرسال الطلب"); }
    finally { setWithdrawing(false); }
  };

  const handleConvert = async () => {
    const amount = parseInt(convertAmount);
    if (!amount || amount <= 0) { toast.error("أدخل كمية صحيحة"); return; }
    setConverting(true);
    try {
      const result = await convertDiamonds({ diamonds: amount });
      toast.success(`تم تحويل ${formatDiamonds(amount)} ألماس إلى ${result.coins} كوين 🪙`);
      setConvertAmount("");
    } catch (e: any) { toast.error(e.message ?? "فشل التحويل"); }
    finally { setConverting(false); }
  };

  const handleSell = async () => {
    const amount = parseInt(sellAmount);
    if (!agentSakiId.trim()) { toast.error("أدخل معرف الوكيل"); return; }
    if (!amount || amount <= 0) { toast.error("أدخل كمية صحيحة"); return; }
    if (!agentResult) { toast.error("الوكيل غير موجود"); return; }
    setSelling(true);
    try {
      await sellDiamonds({ agentSakiId: agentSakiId.trim(), diamonds: amount });
      toast.success(`تم إرسال ${formatDiamonds(amount)} ألماس إلى ${agentResult.name} ✅`);
      setSellAmount(""); setAgentSakiId("");
    } catch (e: any) { toast.error(e.message ?? "فشل الإرسال"); }
    finally { setSelling(false); }
  };

  const handleLeave = async () => {
    if (!confirm("هل تريد مغادرة الوكالة؟")) return;
    try { await leaveAgency(); toast.success("تم مغادرة الوكالة"); }
    catch (e: any) { toast.error(e.message); }
  };

  const myProfile = myAgency.members?.find((m: any) => m.user_id === membership.user_id);

  return (
    <div className="flex flex-col h-full" dir="rtl"
      style={{ background: "#f8fafc", fontFamily: "'Cairo', sans-serif" }}>

      {/* ── PROFILE HEADER ── */}
      <div style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        padding: "20px 20px 0",
        flexShrink: 0,
      }}>
        {/* Back + Leave */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90"
            style={{ background: "rgba(15,23,42,0.05)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {!isOwner && (
            <button onClick={handleLeave}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold active:scale-95"
              style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              مغادرة الوكالة
            </button>
          )}
        </div>

        {/* Profile */}
        <div className="flex flex-col items-center text-center pb-5">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full overflow-hidden"
              style={{ border: "3px solid #fbbf24", padding: 2, background: "rgba(251,191,36,0.1)" }}>
              {myProfile?.profile?.avatar_url
                ? <img src={myProfile.profile.avatarUrl} className="w-full h-full object-cover rounded-full" />
                : <div className="w-full h-full rounded-full flex items-center justify-center text-3xl"
                    style={{ background: "rgba(251,191,36,0.2)" }}>
                    {myProfile?.profile?.name?.[0] ?? "🎙️"}
                  </div>
              }
            </div>
            {/* Level badge */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-black"
              style={{ background: "#fbbf24", color: "#000" }}>
              LV.{currentTier?.level ?? 0}
            </div>
          </div>

          <h2 className="text-slate-900 font-black text-base">{myProfile?.profile?.name ?? "مضيف"}</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            ID: {myProfile?.profile?.saki_id ?? "—"} | {myAgency.name}
          </p>
          <div className="mt-2">
            <RoleBadge role={membership.role} />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 pb-4">
          <div className="rounded-2xl p-3"
            style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.06)" }}>
            <div className="text-blue-400 text-xl mb-1">💎</div>
            <div className="text-slate-900 font-black text-lg">{formatDiamonds(pendingDiamonds)}</div>
            <div className="text-slate-500 text-[10px]">رصيد الألماس الحالي</div>
          </div>
          <div className="rounded-2xl p-3"
            style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.06)" }}>
            <div className="text-green-400 text-xl mb-1">⏱️</div>
            <div className="text-slate-900 font-black text-lg">{formatDiamonds(totalDiamonds)}</div>
            <div className="text-slate-500 text-[10px]">إجمالي الألماس المكتسب</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
          {[
            { id: "overview" as Tab, label: "إحصائياتي", icon: "📊" },
            { id: "wallet" as Tab, label: "محفظتي", icon: "💰" },
            { id: "withdraw" as Tab, label: "سحب", icon: "💸" },
            { id: "history" as Tab, label: "السجل", icon: "📋" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold whitespace-nowrap flex-shrink-0 active:scale-95 transition-all"
              style={{
                background: tab === t.id ? "linear-gradient(135deg,#f59e0b,#fbbf24)" : "rgba(15,23,42,0.08)",
                color: tab === t.id ? "#000" : "#64748b",
                border: tab === t.id ? "none" : "1px solid rgba(15,23,42,0.05)",
              }}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4 pt-4">

        {/* ── إحصائياتي ── */}
        {tab === "overview" && (
          <>
            {/* Target progress */}
            <div className="rounded-2xl p-4"
              style={{ background: "#ffffff", borderRight: "4px solid #ec4899", border: "1px solid rgba(15,23,42,0.08)" }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-slate-900 font-black text-sm">تارجت الشهر 🎯</h3>
                <span className="text-pink-400 text-xs font-bold">{Math.round(progress)}% مكتمل</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                <span>💎 {formatDiamonds(totalDiamonds)}</span>
                <span>الهدف: {formatDiamonds(nextTier.diamonds)}</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: "#e2e8f0" }}>
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%`, background: "linear-gradient(90deg,#ec4899,#f43f5e)" }} />
              </div>
              <p className="text-slate-400 text-[11px] mt-2">
                بقي {formatDiamonds(Math.max(0, nextTier.diamonds - totalDiamonds))} ألماسة للوصول إلى ${nextTier.usd}
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "إجمالي الألماس", value: formatDiamonds(totalDiamonds), icon: "💎", color: "#60a5fa" },
                { label: "ألماس متاح", value: formatDiamonds(pendingDiamonds), icon: "✨", color: "#22c55e" },
                { label: "تم سحبه", value: formatDiamonds(withdrawnDiamonds), icon: "📤", color: "#f59e0b" },
                { label: "المستوى الحالي", value: `LV.${currentTier?.level ?? 0}`, icon: "🏆", color: "#ec4899" },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl p-4"
                  style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.06)" }}>
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className="font-black text-xl" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-slate-500 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="rounded-2xl p-4"
              style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.06)" }}>
              <h3 className="text-slate-900 font-black text-sm mb-3">📋 كيف يعمل النظام</h3>
              <div className="space-y-2">
                {[
                  "تحصل على 70% من قيمة الهدايا التي تستقبلها في الغرفة كألماس",
                  "يمكنك سحب الألماس نقداً وفق جدول التارجتات",
                  "أو تحويل الألماس إلى كوين (1 ألماس = 0.1 كوين)",
                  "أو بيع الألماس لوكيل شحن مباشرة",
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5 flex-shrink-0">•</span>
                    <p className="text-slate-600 text-xs">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tiers table */}
            <div className="rounded-2xl p-4"
              style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.06)" }}>
              <h3 className="text-slate-900 font-black text-sm mb-3">جدول التارجتات 💸</h3>
              <div className="space-y-2">
                {WITHDRAWAL_TIERS.map((tier) => {
                  const reached = totalDiamonds >= tier.diamonds;
                  const canAfford = pendingDiamonds >= tier.diamonds;
                  return (
                    <div key={tier.level} className="flex items-center justify-between py-2 px-3 rounded-xl"
                      style={{
                        background: reached ? "rgba(251,191,36,0.1)" : "rgba(15,23,42,0.04)",
                        border: reached ? "1px solid rgba(251,191,36,0.3)" : "1px solid transparent",
                      }}>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-400 text-xs font-black">LV.{tier.level}</span>
                        <span className="text-blue-300 text-xs font-bold">💎 {formatDiamonds(tier.diamonds)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 text-xs font-black">${tier.usd}</span>
                        {reached && <span className="text-yellow-400 text-xs">✅</span>}
                        {canAfford && !reached && <span className="text-green-400 text-[10px]">متاح</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── محفظتي ── */}
        {tab === "wallet" && (
          <>
            {/* Balance card */}
            <div className="rounded-2xl p-5"
              style={{ background: "linear-gradient(135deg,#1e1b4b,#2e1065)", border: "1px solid rgba(251,191,36,0.3)" }}>
              <p className="text-yellow-300 text-xs mb-1">رصيدك القابل للسحب</p>
              <p className="text-slate-900 font-black text-3xl">💎 {formatDiamonds(pendingDiamonds)}</p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="rounded-xl p-3 text-center" style={{ background: "rgba(251,191,36,0.15)" }}>
                  <p className="text-yellow-300 text-xs">إجمالي مكتسب</p>
                  <p className="text-slate-900 font-black">💎 {formatDiamonds(totalDiamonds)}</p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: "rgba(16,185,129,0.15)" }}>
                  <p className="text-green-300 text-xs">تم سحبه</p>
                  <p className="text-slate-900 font-black">💎 {formatDiamonds(withdrawnDiamonds)}</p>
                </div>
              </div>
            </div>

            {/* Convert to coins */}
            <div className="rounded-2xl p-4"
              style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.06)" }}>
              <h3 className="text-slate-900 font-black text-sm mb-3">🪙 تحويل ألماس إلى كوين</h3>
              <div className="rounded-xl p-3 mb-3"
                style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}>
                <p className="text-purple-300 text-xs">معدل التحويل: 1 ألماس 💎 = 0.1 كوين 🪙</p>
              </div>
              <input type="number" value={convertAmount} onChange={e => setConvertAmount(e.target.value)}
                placeholder="أدخل كمية الألماس..."
                className="w-full px-4 py-3 rounded-xl text-slate-900 text-sm outline-none mb-3"
                style={{ background: "rgba(15,23,42,0.08)", border: "1px solid rgba(255,255,255,0.1)" }} />
              {convertAmount && parseInt(convertAmount) > 0 && (
                <div className="rounded-xl p-3 mb-3"
                  style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">ستحصل على:</span>
                    <span className="text-green-400 font-black">🪙 {Math.floor(parseInt(convertAmount) * 0.1)} كوين</span>
                  </div>
                </div>
              )}
              <button onClick={handleConvert} disabled={converting}
                className="w-full py-3 rounded-xl font-black text-slate-900 text-sm active:scale-95"
                style={{ background: converting ? "#e2e8f0" : "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
                {converting ? "جاري التحويل..." : "تحويل الآن 🪙"}
              </button>
            </div>

            {/* Sell to agent */}
            <div className="rounded-2xl p-4"
              style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.06)" }}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-slate-900 font-black text-sm">🤝 إرسال ألماس لوكيل شحن</h3>
                <button onClick={() => setShowWalletAgents(v => !v)}
                  className="px-3 py-2 rounded-xl text-[11px] font-black active:scale-95"
                  style={{ background: "rgba(245,158,11,0.12)", color: "#b45309", border: "1px solid rgba(245,158,11,0.25)" }}>
                  وكلاء معتمدون
                </button>
              </div>
              {showWalletAgents && (
                <div className="rounded-2xl p-2 mb-3 space-y-2" style={{ background: "#fff7ed", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <p className="text-slate-500 text-[11px] font-bold px-2">اختر وكيل الشحن الذي سيستلم الألماس</p>
                  {approvedAgents === undefined ? (
                    <div className="text-center text-slate-400 text-xs py-3">جاري تحميل الوكلاء...</div>
                  ) : approvedAgents.length === 0 ? (
                    <div className="text-center text-slate-400 text-xs py-3">لا يوجد وكلاء شحن معتمدون حالياً</div>
                  ) : approvedAgents.map((agent: any) => (
                    <button key={agent.sakiId} onClick={() => { setAgentSakiId(agent.sakiId); setShowWalletAgents(false); }}
                      className="w-full flex items-center gap-3 rounded-xl p-2 text-right active:scale-[0.99]"
                      style={{ background: agentSakiId === agent.sakiId ? "rgba(16,185,129,0.12)" : "#ffffff", border: agentSakiId === agent.sakiId ? "1px solid rgba(16,185,129,0.35)" : "1px solid rgba(15,23,42,0.06)" }}>
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
              <input value={agentSakiId} onChange={e => setAgentSakiId(e.target.value)}
                placeholder="أدخل Saki ID للوكيل..."
                className="w-full px-4 py-3 rounded-xl text-slate-900 text-sm outline-none mb-2"
                style={{ background: "rgba(15,23,42,0.08)", border: "1px solid rgba(255,255,255,0.1)" }} />
              {agentSakiId.trim().length >= 4 && (
                <div className="mb-3">
                  {agentResult === undefined ? (
                    <div className="rounded-xl p-2 flex items-center gap-2" style={{ background: "rgba(15,23,42,0.04)" }}>
                      <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-slate-500 text-xs">جاري البحث...</span>
                    </div>
                  ) : agentResult ? (
                    <div className="rounded-xl p-3 flex items-center gap-3"
                      style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
                      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0"
                        style={{ background: "rgba(124,58,237,0.3)" }}>
                        {agentResult.avatarUrl
                          ? <img src={agentResult.avatarUrl} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center">👤</div>
                        }
                      </div>
                      <div>
                        <p className="text-slate-900 font-bold text-sm">{agentResult.name}</p>
                        <p className="text-green-400 text-xs">✅ وكيل معتمد</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl p-2" style={{ background: "rgba(239,68,68,0.1)" }}>
                      <p className="text-red-400 text-xs">❌ الوكيل غير موجود</p>
                    </div>
                  )}
                </div>
              )}
              <input type="number" value={sellAmount} onChange={e => setSellAmount(e.target.value)}
                placeholder="كمية الألماس..."
                className="w-full px-4 py-3 rounded-xl text-slate-900 text-sm outline-none mb-3"
                style={{ background: "rgba(15,23,42,0.08)", border: "1px solid rgba(255,255,255,0.1)" }} />
              <button onClick={handleSell} disabled={selling || !agentResult}
                className="w-full py-3 rounded-xl font-black text-slate-900 text-sm active:scale-95"
                style={{ background: selling || !agentResult ? "#e2e8f0" : "linear-gradient(135deg,#f59e0b,#d97706)" }}>
                {selling ? "جاري الإرسال..." : "إرسال للوكيل 🤝"}
              </button>
            </div>
          </>
        )}

        {/* ── سحب نقدي ── */}
        {tab === "withdraw" && (
          <>
            {/* Balance */}
            <div className="rounded-2xl p-4 text-center"
              style={{ background: "linear-gradient(135deg,#1e1b4b,#2e1065)", border: "1px solid rgba(251,191,36,0.3)" }}>
              <p className="text-yellow-300 text-xs mb-1">رصيدك القابل للسحب</p>
              <p className="text-slate-900 font-black text-2xl">💎 {formatDiamonds(pendingDiamonds)}</p>
            </div>

            {/* Tier selector */}
            <div className="rounded-2xl p-4"
              style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.06)" }}>
              <h3 className="text-slate-900 font-black text-sm mb-3">اختر مستوى السحب</h3>
              <div className="grid grid-cols-2 gap-2">
                {WITHDRAWAL_TIERS.map((tier) => {
                  const canAfford = pendingDiamonds >= tier.diamonds;
                  const selected = selectedTier?.diamonds === tier.diamonds;
                  return (
                    <button key={tier.level}
                      onClick={() => canAfford && setSelectedTier(tier)}
                      disabled={!canAfford}
                      className="py-3 rounded-xl text-xs font-bold active:scale-95 transition-all"
                      style={{
                        background: selected ? "linear-gradient(135deg,#f59e0b,#fbbf24)" : "rgba(15,23,42,0.08)",
                        color: selected ? "#000" : canAfford ? "#64748b" : "#475569",
                        border: selected ? "none" : "1px solid rgba(15,23,42,0.05)",
                        opacity: canAfford ? 1 : 0.5,
                      }}>
                      <div className="font-black text-[10px] mb-0.5">LV.{tier.level}</div>
                      <div>💎 {formatDiamonds(tier.diamonds)}</div>
                      <div style={{ color: selected ? "#000" : "#22c55e", fontWeight: 900 }}>${tier.usd}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedTier && (
              <div className="rounded-2xl p-4 space-y-3"
                style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.06)" }}>
                <h3 className="text-slate-900 font-black text-sm">تفاصيل السحب</h3>

                {/* Method */}
                <div>
                  <label className="text-slate-500 text-xs mb-2 block">طريقة الاستلام</label>
                  <div className="flex gap-2">
                    {["وكيل شحن", "تحويل بنكي"].map((m) => (
                      <button key={m} onClick={() => { setMethod(m); if (m !== "وكيل شحن") setShowWithdrawAgents(false); }}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold active:scale-95"
                        style={{
                          background: method === m ? "linear-gradient(135deg,#f59e0b,#fbbf24)" : "rgba(15,23,42,0.08)",
                          color: method === m ? "#000" : "#64748b",
                          border: method === m ? "none" : "1px solid rgba(15,23,42,0.05)",
                        }}>
                        {m === "وكيل شحن" ? "🏪 " : "🏦 "}{m}
                      </button>
                    ))}
                  </div>
                </div>

                {method === "وكيل شحن" && (
                  <div className="rounded-2xl p-3" style={{ background: "#fff7ed", border: "1px solid rgba(245,158,11,0.22)" }}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div>
                        <p className="text-slate-900 text-xs font-black">وكيل الشحن المستلم</p>
                        <p className="text-slate-500 text-[10px]">يتم إرسال الألماس مباشرة إلى وكيل معتمد</p>
                      </div>
                      <button onClick={() => setShowWithdrawAgents(v => !v)}
                        className="px-3 py-2 rounded-xl text-[11px] font-black active:scale-95"
                        style={{ background: "#f59e0b", color: "#fff" }}>
                        وكلاء الشحن
                      </button>
                    </div>
                    {accountInfo && (
                      <div className="rounded-xl px-3 py-2" style={{ background: "rgba(16,185,129,0.1)" }}>
                        <p className="text-green-700 text-xs font-black">تم اختيار: {approvedAgents?.find((agent: any) => agent.sakiId === accountInfo)?.name ?? accountInfo}</p>
                        <p className="text-green-700 text-[10px] font-mono">{accountInfo}</p>
                      </div>
                    )}
                    {showWithdrawAgents && (
                      <div className="mt-2 space-y-2">
                        {approvedAgents === undefined ? (
                          <div className="text-center text-slate-400 text-xs py-3">جاري تحميل الوكلاء...</div>
                        ) : approvedAgents.length === 0 ? (
                          <div className="text-center text-slate-400 text-xs py-3">لا يوجد وكلاء شحن معتمدون حالياً</div>
                        ) : approvedAgents.map((agent: any) => (
                          <button key={agent.sakiId} onClick={() => { setAccountInfo(agent.sakiId); setShowWithdrawAgents(false); }}
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
                )}

                <div>
                  <label className="text-slate-500 text-xs mb-1 block">
                    {method === "وكيل شحن" ? "معرف وكيل الشحن / اسمه" : "رقم الحساب البنكي / IBAN"}
                  </label>
                  <input value={accountInfo} onChange={e => setAccountInfo(e.target.value)}
                    placeholder={method === "وكيل شحن" ? "مثال: وكيل أحمد - 0501234567" : "مثال: SA0380000000608010167519"}
                    className="w-full px-4 py-3 rounded-xl text-slate-900 text-sm outline-none"
                    style={{ background: "rgba(15,23,42,0.08)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>

                <div>
                  <label className="text-slate-500 text-xs mb-1 block">رقم واتساب (اختياري)</label>
                  <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                    placeholder="+966501234567"
                    className="w-full px-4 py-3 rounded-xl text-slate-900 text-sm outline-none"
                    style={{ background: "rgba(15,23,42,0.08)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>

                {/* Summary */}
                <div className="rounded-xl p-3"
                  style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">ستسحب:</span>
                    <span className="text-slate-900 font-black">💎 {formatDiamonds(selectedTier.diamonds)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate-500">ستستلم:</span>
                    <span className="text-green-400 font-black">${selectedTier.usd}</span>
                  </div>
                </div>

                <button onClick={handleWithdraw} disabled={withdrawing}
                  className="w-full py-4 rounded-2xl font-black text-base active:scale-[0.98]"
                  style={{ background: withdrawing ? "#e2e8f0" : "linear-gradient(135deg,#f59e0b,#fbbf24)", color: "#000" }}>
                  {withdrawing ? "جاري الإرسال..." : "💰 إرسال طلب السحب"}
                </button>
              </div>
            )}
          </>
        )}

        {/* ── السجل ── */}
        {tab === "history" && (
          <div className="space-y-3">
            {(myWithdrawals ?? []).length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">📋</div>
                <p className="text-slate-500">لا يوجد سجل سحوبات بعد</p>
              </div>
            ) : (myWithdrawals ?? []).map((w: any) => (
              <div key={w.id} className="rounded-2xl p-4"
                style={{ background: "#ffffff", border: "1px solid rgba(15,23,42,0.06)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-900 font-bold text-sm">طلب سحب</p>
                  <WithdrawalStatusBadge status={w.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="rounded-xl p-2 text-center" style={{ background: "rgba(168,85,247,0.15)" }}>
                    <p className="text-purple-300 text-xs">الألماس</p>
                    <p className="text-slate-900 font-black text-sm">💎 {formatDiamonds(w.diamonds)}</p>
                  </div>
                  <div className="rounded-xl p-2 text-center" style={{ background: "rgba(16,185,129,0.15)" }}>
                    <p className="text-green-300 text-xs">المبلغ</p>
                    <p className="text-slate-900 font-black text-sm">💵 ${w.usdAmount}</p>
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  <span>طريقة: </span><span className="text-slate-900">{w.method}</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(w.createdAt).toLocaleDateString("ar")}</span>
                </div>
                {w.agentName && (
                  <div className="mt-2 rounded-xl px-3 py-2" style={{ background: "rgba(245,158,11,0.1)" }}>
                    <p className="text-amber-700 text-xs font-black">وكيل الشحن: {w.agentName}</p>
                    <p className="text-amber-700 text-[10px] font-mono">Saki ID: {w.agentSakiId}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    owner: { label: "المالك 👑", color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
    admin: { label: "أدمن", color: "#60a5fa", bg: "rgba(96,165,250,0.15)" },
    host: { label: "مضيف 🎙️", color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
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
