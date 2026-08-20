// @ts-nocheck
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "../lib/toast";
import UserAvatar from "../components/UserAvatar";

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-amber-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-t-amber-500 animate-spin" />
      </div>
    </div>
  );
}

function SakiCoinIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="19" fill="url(#sakiGradAdmin)" stroke="#b45309" strokeWidth="1.5" />
      <text x="20" y="25" textAnchor="middle" fontSize="16" fontWeight="900" fill="#7c2d12" fontFamily="Arial">S</text>
      <defs>
        <radialGradient id="sakiGradAdmin" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export default function AdminSakiWalletTab() {
  const agents = useQuery(api.sakiWallet.adminGetAllAgentsWithWallets);
  const allTxs = useQuery(api.sakiWallet.adminGetAllSakiTransactions);
  const addSaki = useMutation(api.sakiWallet.adminAddSakiBalance);
  const deductSaki = useMutation(api.sakiWallet.adminDeductSakiBalance);

  const [tab, setTab] = useState<"agents" | "transactions" | "recharge">("agents");
  const [rechargeSearch, setRechargeSearch] = useState("");
  const rechargeHistory = useQuery(api.adminRecharge.searchRechargeHistory, rechargeSearch.trim() ? { sakiId: rechargeSearch.trim() } : "skip");
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [modalMode, setModalMode] = useState<"add" | "deduct">("add");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const openModal = (agent: any, mode: "add" | "deduct") => {
    setSelectedAgent(agent);
    setModalMode(mode);
    setAmount("");
    setNote("");
  };

  const handleSubmit = async () => {
    if (!selectedAgent || !amount || Number(amount) <= 0) {
      toast.error("ادخل كمية صحيحة");
      return;
    }
    setLoading(true);
    try {
      if (modalMode === "add") {
        const res = await addSaki({
          targetUserId: selectedAgent.userId as Id<"users">,
          amount: Number(amount),
          note: note || undefined,
        });
        toast.success(`تم اضافة ${Number(amount).toLocaleString()} ساكي لـ ${res.targetName}`);
      } else {
        const res = await deductSaki({
          targetUserId: selectedAgent.userId as Id<"users">,
          amount: Number(amount),
          note: note || undefined,
        });
        toast.success(`تم خصم ${Number(amount).toLocaleString()} ساكي من ${res.targetName}`);
      }
      setSelectedAgent(null);
      setAmount("");
      setNote("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4" dir="rtl">
      <div className="flex items-center gap-3 px-1 pt-2 pb-1">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}>
          <SakiCoinIcon size={22} />
        </div>
        <div>
          <h2 className="text-white font-black text-base">محافظ ساكي</h2>
          <p className="text-xs text-gray-500">شحن، استهلاك، هدايا، ومصادر العملات حسب SAKI_ID</p>
        </div>
      </div>

      {agents && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "اجمالي الوكلاء", value: agents.length, color: "#f59e0b" },
            { label: "ساكي موزع", value: agents.reduce((s: number, a: any) => s + (a.totalSakiAdded ?? 0), 0).toLocaleString(), color: "#10b981" },
            { label: "ساكي مستخدم", value: agents.reduce((s: number, a: any) => s + (a.totalSakiUsed ?? 0), 0).toLocaleString(), color: "#6366f1" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-3 text-center"
              style={{ background: `${s.color}0d`, border: `1px solid ${s.color}20` }}>
              <p className="font-black text-base" style={{ color: s.color }}>{s.value}</p>
              <p className="text-gray-500 text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 bg-white/5 rounded-2xl p-1">
        {[
          { id: "agents", label: "الوكلاء", icon: "⚡" },
          { id: "transactions", label: "المعاملات", icon: "📋" },
          { id: "recharge", label: "تقارير المستخدم", icon: "💳" },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
            style={tab === t.id
              ? { background: "linear-gradient(135deg,#f59e0b,#b45309)", color: "white" }
              : { color: "#6b7280" }}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "agents" && (
        <>
          {!agents ? <LoadingSpinner /> : agents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">⚡</div>
              <p className="text-gray-500 text-sm">لا يوجد وكلاء</p>
            </div>
          ) : (
            <div className="space-y-2">
              {agents.map((agent: any) => (
                <div key={agent._id} className="rounded-2xl p-3"
                  style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <UserAvatar userId={agent.userId as Id<"users">} avatarUrl={agent.avatarUrl} name={agent.name} size={44} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-white font-bold text-sm truncate">{agent.name}</p>
                        {agent.isSuperAdmin && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black"
                            style={{ background: "rgba(168,85,247,0.2)", color: "#a855f7" }}>ادمن</span>
                        )}
                        {agent.isAgent && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: "rgba(52,211,153,0.2)", color: "#34d399" }}>وكيل</span>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs font-mono mt-0.5">#{agent.sakiId}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: "الرصيد الحالي", value: (agent.sakiBalance ?? 0).toLocaleString(), color: "#f59e0b" },
                      { label: "اجمالي المضاف", value: (agent.totalSakiAdded ?? 0).toLocaleString(), color: "#10b981" },
                      { label: "اجمالي المستخدم", value: (agent.totalSakiUsed ?? 0).toLocaleString(), color: "#6366f1" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl p-2 text-center"
                        style={{ background: `${s.color}0d`, border: `1px solid ${s.color}20` }}>
                        <p className="font-black text-xs" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-gray-600 text-[9px] mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => openModal(agent, "add")}
                      className="py-2 rounded-xl text-xs font-bold active:scale-95"
                      style={{ background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)" }}>
                      + اضافة ساكي
                    </button>
                    <button onClick={() => openModal(agent, "deduct")}
                      className="py-2 rounded-xl text-xs font-bold active:scale-95"
                      style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                      - خصم ساكي
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "recharge" && (
        <div className="space-y-4">
          <div className="rounded-2xl p-4" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <h3 className="text-white font-black text-sm">سجل شحن المستخدم</h3>
            <p className="text-gray-500 text-[11px] mt-1">ابحث بواسطة SAKI_ID لعرض الشحن من Google Play أو الوكيل، الاستهلاك، الهدايا المرسلة والمستلمة، وأرقام المعاملات الحقيقية.</p>
            <input
              value={rechargeSearch}
              onChange={(e) => setRechargeSearch(e.target.value)}
              placeholder="أدخل SAKI_ID أو Premium SAKI ID"
              className="mt-3 w-full rounded-xl px-3 py-3 text-sm text-white outline-none"
              style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(96,165,250,0.3)" }}
              dir="ltr"
            />
          </div>
          {rechargeSearch.trim() && !rechargeHistory ? <LoadingSpinner /> : rechargeHistory?.user === null ? (
            <div className="rounded-2xl p-8 text-center text-gray-500 text-sm">لم يتم العثور على مستخدم بهذا المعرّف.</div>
          ) : rechargeHistory?.user ? (
            <>
              <div className="rounded-2xl p-4" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <div className="flex items-center gap-3">
                  <UserAvatar userId={rechargeHistory.user.userId as Id<"users">} avatarUrl={rechargeHistory.user.avatarUrl} name={rechargeHistory.user.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-black text-sm truncate">{rechargeHistory.user.name}</p>
                    <p className="text-gray-500 text-[10px] font-mono">#{rechargeHistory.user.sakiId}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-amber-400 font-black text-sm">{rechargeHistory.user.goldCoins.toLocaleString()}</p>
                    <p className="text-gray-500 text-[10px]">الرصيد الحالي</p>
                  </div>
                </div>
              </div>
              {rechargeHistory.summary && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "شحن Google Play", value: rechargeHistory.summary.googleCoinsTotal, color: "#60a5fa" },
                    { label: "شحن وكيل", value: rechargeHistory.summary.agentCoinsTotal, color: "#34d399" },
                    { label: "استهلاك هدايا", value: rechargeHistory.summary.giftSentTotal, color: "#f472b6" },
                    { label: "رهان حفلة ساكي", value: rechargeHistory.summary.partyBetTotal, color: "#c084fc" },
                    { label: "هدايا مستلمة", value: rechargeHistory.summary.giftReceivedTotal, color: "#fbbf24" },
                    { label: "إجمالي الاستهلاك", value: rechargeHistory.summary.totalSpentCoins, color: "#fb7185" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl p-3" style={{ background: `${stat.color}0d`, border: `1px solid ${stat.color}25` }}>
                      <p className="text-gray-500 text-[10px]">{stat.label}</p>
                      <p className="mt-1 font-black text-sm" style={{ color: stat.color }}>{(stat.value ?? 0).toLocaleString()} ذهب</p>
                    </div>
                  ))}
                </div>
              )}
              {rechargeHistory.transactions.length === 0 ? (
                <div className="rounded-2xl p-8 text-center text-gray-500 text-sm">لا توجد عمليات شحن مسجلة لهذا المستخدم.</div>
              ) : rechargeHistory.transactions.map((tx: any) => (
                <div key={tx.id} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white text-xs font-black">{tx.sourceLabel}</p>
                      <p className="text-gray-500 text-[10px] mt-1">{new Date(tx.createdAt).toLocaleString("ar-SA")}</p>
                      <p className="text-gray-600 text-[10px] font-mono mt-1 break-all">رقم المعاملة: {tx.transactionId}</p>
                      {tx.productId && <p className="text-gray-600 text-[10px] font-mono">المنتج: {tx.productId}</p>}
                      {tx.agentName && <p className="text-gray-500 text-[10px]">الوكيل: {tx.agentName}</p>}
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-amber-400 font-black text-sm">{tx.coins.toLocaleString()} ذهب</p>
                      {tx.dollars !== undefined && <p className="text-emerald-400 text-[10px]">${tx.dollars}</p>}
                      <p className="text-emerald-400 text-[10px] mt-1">{tx.status === "verified" ? "متحقق من Google Play" : "مكتمل"}</p>
                    </div>
                  </div>
                </div>
              ))}
              {(rechargeHistory.giftsSent?.length > 0 || rechargeHistory.giftsReceived?.length > 0) && (
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-2xl p-3" style={{ background: "rgba(244,114,182,0.06)", border: "1px solid rgba(244,114,182,0.18)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-pink-300 font-black text-sm">الهدايا المرسلة</h3>
                      <span className="text-[10px] text-gray-500">{rechargeHistory.giftsSent?.length ?? 0} سجل</span>
                    </div>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {(rechargeHistory.giftsSent ?? []).slice(0, 50).map((gift: any) => (
                        <div key={gift.id} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2" style={{ background: "rgba(0,0,0,0.18)" }}>
                          <div className="min-w-0">
                            <p className="text-white text-xs font-bold truncate">{gift.giftName} → {gift.receiverName}</p>
                            <p className="text-gray-500 text-[10px]">{new Date(gift.createdAt).toLocaleString("ar-SA")}</p>
                          </div>
                          <span className="text-pink-300 text-xs font-black shrink-0">-{gift.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl p-3" style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-amber-300 font-black text-sm">الهدايا المستلمة</h3>
                      <span className="text-[10px] text-gray-500">{rechargeHistory.giftsReceived?.length ?? 0} سجل</span>
                    </div>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {(rechargeHistory.giftsReceived ?? []).slice(0, 50).map((gift: any) => (
                        <div key={gift.id} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2" style={{ background: "rgba(0,0,0,0.18)" }}>
                          <div className="min-w-0">
                            <p className="text-white text-xs font-bold truncate">{gift.giftName} ← {gift.senderName}</p>
                            <p className="text-gray-500 text-[10px]">{new Date(gift.createdAt).toLocaleString("ar-SA")}</p>
                          </div>
                          <span className="text-amber-300 text-xs font-black shrink-0">+{gift.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : <div className="rounded-2xl p-8 text-center text-gray-500 text-sm">أدخل SAKI_ID لبدء البحث.</div>}
        </div>
      )}

      {tab === "transactions" && (
        <>
          {!allTxs ? <LoadingSpinner /> : allTxs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-500 text-sm">لا توجد معاملات</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allTxs.map((tx: any) => {
                const isCharge = tx.type === "charge";
                const isAdd = tx.type === "admin_add";
                const color = isCharge ? "#6366f1" : isAdd ? "#10b981" : "#ef4444";
                const icon = isCharge ? "⚡" : isAdd ? "+" : "-";
                const label = isCharge ? "شحن مستخدم" : isAdd ? "اضافة ادارية" : "خصم اداري";
                return (
                  <div key={tx._id} className="rounded-xl px-4 py-3 flex items-center justify-between"
                    style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: `${color}15` }}>
                        {icon}
                      </div>
                      <div>
                        <p className="text-white text-xs font-bold">{label}</p>
                        {tx.targetName && <p className="text-gray-400 text-[10px]">{tx.targetName}</p>}
                        <p className="text-gray-600 text-[10px]">{new Date(tx.createdAt).toLocaleString("ar")}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1 justify-end">
                        <SakiCoinIcon size={12} />
                        <span className="font-black text-sm" style={{ color }}>
                          {isCharge ? "-" : "+"}{tx.sakiAmount.toLocaleString()}
                        </span>
                      </div>
                      {tx.coinsAmount && (
                        <p className="text-gray-500 text-[10px] text-right">{tx.coinsAmount.toLocaleString()} 🪙</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {selectedAgent && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.85)" }}>
          <div className="w-full max-w-lg rounded-t-3xl p-5 space-y-4"
            style={{ background: "#0a0a1f", border: "1px solid rgba(245,158,11,0.3)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-black text-base">
                {modalMode === "add" ? "+ اضافة ساكي" : "- خصم ساكي"}
              </h3>
              <button onClick={() => setSelectedAgent(null)} className="text-gray-400 text-xl">X</button>
            </div>
            <div className="rounded-xl p-3 flex items-center gap-3"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <UserAvatar userId={selectedAgent.userId as Id<"users">} avatarUrl={selectedAgent.avatarUrl} name={selectedAgent.name} size={40} />
              <div>
                <p className="text-white font-bold text-sm">{selectedAgent.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <SakiCoinIcon size={14} />
                  <span className="text-amber-400 font-bold text-sm">{(selectedAgent.sakiBalance ?? 0).toLocaleString()}</span>
                  <span className="text-gray-400 text-xs">ساكي حالياً</span>
                </div>
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-xs font-bold mb-2 block">الكمية (ساكي)</label>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="1"
                placeholder="0"
                className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(245,158,11,0.3)" }} dir="ltr" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[10, 50, 100, 500].map((v) => (
                <button key={v} onClick={() => setAmount(String(v))}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${amount === String(v) ? "bg-amber-500/20 border-amber-500/50 text-amber-300" : "bg-white/5 border-white/10 text-gray-400"}`}>
                  {v}
                </button>
              ))}
            </div>
            <div>
              <label className="text-gray-400 text-xs font-bold mb-2 block">ملاحظة (اختياري)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="سبب العملية..."
                className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />
            </div>
            <button onClick={handleSubmit} disabled={!amount || Number(amount) <= 0 || loading}
              className="w-full py-3 rounded-2xl text-white font-black text-sm active:scale-95 disabled:opacity-40"
              style={{
                background: modalMode === "add"
                  ? "linear-gradient(135deg,#10b981,#059669)"
                  : "linear-gradient(135deg,#ef4444,#dc2626)",
              }}>
              {loading
                ? "جاري التنفيذ..."
                : modalMode === "add"
                  ? `اضافة ${amount ? Number(amount).toLocaleString() : "0"} ساكي`
                  : `خصم ${amount ? Number(amount).toLocaleString() : "0"} ساكي`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
