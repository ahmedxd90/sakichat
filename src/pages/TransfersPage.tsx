// @ts-nocheck
import { supabase } from "../lib/supabaseClient";
import { useState, useEffect } from "react";
import { toast } from "../lib/toast";

interface TransfersPageProps {
  onBack: () => void;
}

const DIAMOND_TIERS = [1200000, 2400000, 3600000, 4800000, 6000000, 12000000];

type TransferType = "diamonds_to_agent" | "coins_to_agent";
type TabType = "send" | "history";

export default function TransfersPage({ onBack }: TransfersPageProps) {
  const [myProfile, setMyProfile] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [myHistory, setMyHistory] = useState<any[]>([]);
  const [agentReceived, setAgentReceived] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: me } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
        setMyProfile(me);
        const { data: ag } = await supabase.from('profiles').select('*').eq('is_agent', true);
        setAgents(ag || []);
        const { data: hist } = await supabase.from('transfers').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', { ascending: false });
        setMyHistory(hist || []);
      }
    };
    fetchData();
  }, []);

  const transferDiamonds = async (args: any) => ({ coinsReceived: 0 });
  const transferCoins = async (args: any) => {};

  const [tab, setTab] = useState<TabType>("send");
  const [transferType, setTransferType] = useState<TransferType>("diamonds_to_agent");
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [agentSakiId, setAgentSakiId] = useState("");
  const [coinsAmount, setCoinsAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isAgent = myProfile?.isAgent || myProfile?.isSuperAdmin;
  const myDiamonds = myProfile?.diamonds ?? 0;
  const myCoins = myProfile?.goldCoins ?? 0;

  const handleTransferDiamonds = async () => {
    if (!selectedTier) { toast.error("اختر كمية الماس"); return; }
    if (!agentSakiId.trim()) { toast.error("أدخل SAKI ID الوكيل"); return; }
    setShowConfirm(true);
  };

  const confirmTransferDiamonds = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      const result = await transferDiamonds({ agentSakiId: agentSakiId.trim(), diamonds: selectedTier! });
      toast.success(`تم تحويل ${selectedTier!.toLocaleString()} ماسة وحصلت على ${result.coinsReceived.toLocaleString()} عملة`);
      setSelectedTier(null); setAgentSakiId("");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleTransferCoins = async () => {
    const amount = parseInt(coinsAmount);
    if (!amount || amount <= 0) { toast.error("أدخل كمية صحيحة"); return; }
    if (!agentSakiId.trim()) { toast.error("أدخل SAKI ID الوكيل"); return; }
    setLoading(true);
    try {
      await transferCoins({ agentSakiId: agentSakiId.trim(), coins: amount });
      toast.success(`تم تحويل ${amount.toLocaleString()} عملة للوكيل`);
      setCoinsAmount(""); setAgentSakiId("");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const coinsFromSelected = selectedTier ? Math.floor(selectedTier * 0.5) : 0;

  return (
    <div className="flex flex-col h-full bg-[#080810]" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-2xl border-b border-white/6" style={{ background: "rgba(8,8,16,0.97)" }}>
        <div className="flex items-center justify-between px-4 py-3.5">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <h2 className="text-white font-black text-lg tracking-wide">التحويلات</h2>
          <div className="w-10" />
        </div>

        {/* Tabs */}
        <div className="flex px-4 pb-3 gap-2">
          <button
            onClick={() => setTab("send")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl transition-all active:scale-95"
            style={tab === "send"
              ? { background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(236,72,153,0.1))", border: "1px solid rgba(168,85,247,0.4)" }
              : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tab === "send" ? "#a855f7" : "#6b7280"} strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
            <span className={`text-sm font-bold ${tab === "send" ? "text-purple-400" : "text-gray-500"}`}>إرسال</span>
          </button>
          <button
            onClick={() => setTab("history")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl transition-all active:scale-95"
            style={tab === "history"
              ? { background: "linear-gradient(135deg, rgba(96,165,250,0.2), rgba(59,130,246,0.1))", border: "1px solid rgba(96,165,250,0.4)" }
              : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tab === "history" ? "#60a5fa" : "#6b7280"} strokeWidth="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-sm font-bold ${tab === "history" ? "text-blue-400" : "text-gray-500"}`}>السجل</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {tab === "send" ? (
          <div className="px-4 pt-5 space-y-4">
            {/* Balance Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Diamonds */}
              <div className="relative rounded-2xl p-4 overflow-hidden" style={{ background: "linear-gradient(135deg, #0c1a3a, #1e3a5f)", border: "1px solid rgba(96,165,250,0.25)" }}>
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-15 pointer-events-none" style={{ background: "radial-gradient(circle, #60a5fa, transparent)" }} />
                <div className="relative z-10">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="mb-2">
                    <path d="M12 2L2 9l10 13L22 9z" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1.2" />
                    <path d="M2 9h20M12 2L7 9l5 13 5-13z" stroke="#93c5fd" strokeWidth="0.8" />
                  </svg>
                  <p className="text-white font-black text-xl leading-none">{myDiamonds.toLocaleString()}</p>
                  <p className="text-blue-300/50 text-xs mt-1">ماسي</p>
                </div>
              </div>
              {/* Coins */}
              <div className="relative rounded-2xl p-4 overflow-hidden" style={{ background: "linear-gradient(135deg, #451a03, #78350f)", border: "1px solid rgba(251,191,36,0.25)" }}>
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-15 pointer-events-none" style={{ background: "radial-gradient(circle, #fbbf24, transparent)" }} />
                <div className="relative z-10">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="mb-2">
                    <circle cx="12" cy="12" r="10" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
                    <circle cx="12" cy="12" r="7" fill="#fcd34d" />
                    <text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#92400e">$</text>
                  </svg>
                  <p className="text-white font-black text-xl leading-none">{myCoins.toLocaleString()}</p>
                  <p className="text-yellow-200/50 text-xs mt-1">عملاتي</p>
                </div>
              </div>
            </div>

            {/* Transfer Type Selector */}
            <div className="space-y-2.5">
              <p className="text-gray-500 text-xs font-bold px-1">نوع التحويل</p>
              {/* Diamonds to Agent */}
              <button
                onClick={() => { setTransferType("diamonds_to_agent"); setSelectedTier(null); setAgentSakiId(""); }}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl active:scale-[0.98] transition-all"
                style={transferType === "diamonds_to_agent"
                  ? { background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(96,165,250,0.08))", border: "1px solid rgba(168,85,247,0.4)" }
                  : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 9l10 13L22 9z" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1.2" />
                    <path d="M2 9h20M12 2L7 9l5 13 5-13z" stroke="#93c5fd" strokeWidth="0.8" />
                  </svg>
                </div>
                <div className="flex-1 text-right">
                  <p className={`font-black text-sm ${transferType === "diamonds_to_agent" ? "text-purple-300" : "text-white"}`}>تحويل ماس لوكيل شحن</p>
                  <p className="text-gray-500 text-xs mt-0.5">1,200,000 ماسة = 600,000 عملة ذهبية</p>
                </div>
                {transferType === "diamonds_to_agent" && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(168,85,247,0.8)" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                  </div>
                )}
              </button>

              {/* Coins to Agent */}
              <button
                onClick={() => { setTransferType("coins_to_agent"); setSelectedTier(null); setAgentSakiId(""); setCoinsAmount(""); }}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl active:scale-[0.98] transition-all"
                style={transferType === "coins_to_agent"
                  ? { background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.08))", border: "1px solid rgba(251,191,36,0.4)" }
                  : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
                    <circle cx="12" cy="12" r="7" fill="#fcd34d" />
                    <text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#92400e">$</text>
                  </svg>
                </div>
                <div className="flex-1 text-right">
                  <p className={`font-black text-sm ${transferType === "coins_to_agent" ? "text-yellow-300" : "text-white"}`}>تحويل عملات لوكيل شحن</p>
                  <p className="text-gray-500 text-xs mt-0.5">شحن عملات ذهبية للوكيل</p>
                </div>
                {transferType === "coins_to_agent" && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(251,191,36,0.8)" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                  </div>
                )}
              </button>
            </div>

            {/* ── Diamonds to Agent Form ── */}
            {transferType === "diamonds_to_agent" && (
              <div className="rounded-3xl p-4 space-y-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-white font-bold text-sm">اختر كمية الماس</p>
                <div className="grid grid-cols-3 gap-2">
                  {DIAMOND_TIERS.map((tier, i) => {
                    const coinsGet = Math.floor(tier * 0.5);
                    const canAfford = myDiamonds >= tier;
                    const isSelected = selectedTier === tier;
                    return (
                      <button
                        key={tier}
                        onClick={() => canAfford && setSelectedTier(tier)}
                        disabled={!canAfford}
                        className="py-3 rounded-2xl text-xs font-bold active:scale-95 transition-all disabled:opacity-25 flex flex-col items-center gap-1"
                        style={isSelected
                          ? { background: "linear-gradient(135deg, rgba(96,165,250,0.3), rgba(59,130,246,0.2))", border: "1px solid rgba(96,165,250,0.6)", color: "#60a5fa" }
                          : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2L2 9l10 13L22 9z" fill={isSelected ? "#60a5fa" : "#4b5563"} />
                        </svg>
                        <span>{tier >= 1000000 ? `${tier / 1000000}M` : tier >= 1000 ? `${tier / 1000}k` : tier}</span>
                        <span className="text-[9px]" style={{ color: isSelected ? "#fbbf24" : "#6b7280" }}>{coinsGet >= 1000000 ? `${coinsGet / 1000000}M` : coinsGet >= 1000 ? `${coinsGet / 1000}k` : coinsGet} 🪙</span>
                        <span className="text-[9px] font-black" style={{ color: isSelected ? "#34d399" : "#4b5563" }}>${(i + 1) * 10}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Preview */}
                {selectedTier && (
                  <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.2)" }}>
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 9l10 13L22 9z" fill="#60a5fa" /></svg>
                      <span className="text-blue-400 text-sm font-bold">{selectedTier.toLocaleString()}</span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="#fbbf24" />
                        <circle cx="12" cy="12" r="7" fill="#fcd34d" />
                        <text x="12" y="16" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#92400e">$</text>
                      </svg>
                      <span className="text-yellow-400 text-sm font-bold">{coinsFromSelected.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* SAKI ID Input */}
                <div>
                  <p className="text-gray-500 text-xs font-bold mb-2">SAKI ID الوكيل</p>
                  <input
                    value={agentSakiId}
                    onChange={(e) => setAgentSakiId(e.target.value)}
                    placeholder="أدخل SAKI ID الوكيل..."
                    className="w-full rounded-2xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none font-mono"
                    style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${agentSakiId ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.1)"}` }}
                  />
                </div>

                {/* Agents List */}
                {agents && agents.length > 0 && (
                  <AgentsList agents={agents} selectedId={agentSakiId} onSelect={setAgentSakiId} accentColor="purple" />
                )}

                <button
                  onClick={handleTransferDiamonds}
                  disabled={loading || !selectedTier || !agentSakiId.trim()}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "white", boxShadow: "0 4px 20px rgba(168,85,247,0.25)" }}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                      <span>تحويل الماس</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ── Coins to Agent Form ── */}
            {transferType === "coins_to_agent" && (
              <div className="rounded-3xl p-4 space-y-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-white font-bold text-sm">كمية العملات الذهبية</p>
                <div>
                  <input
                    value={coinsAmount}
                    onChange={(e) => setCoinsAmount(e.target.value)}
                    type="number"
                    placeholder="أدخل كمية العملات..."
                    className="w-full rounded-2xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${coinsAmount ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.1)"}` }}
                  />
                  <p className="text-gray-600 text-xs mt-2 px-1">رصيدك: <span className="text-yellow-500 font-bold">{myCoins.toLocaleString()}</span> عملة</p>
                </div>

                {/* SAKI ID Input */}
                <div>
                  <p className="text-gray-500 text-xs font-bold mb-2">SAKI ID الوكيل</p>
                  <input
                    value={agentSakiId}
                    onChange={(e) => setAgentSakiId(e.target.value)}
                    placeholder="أدخل SAKI ID الوكيل..."
                    className="w-full rounded-2xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none font-mono"
                    style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${agentSakiId ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.1)"}` }}
                  />
                </div>

                {/* Agents List */}
                {agents && agents.length > 0 && (
                  <AgentsList agents={agents} selectedId={agentSakiId} onSelect={setAgentSakiId} accentColor="yellow" />
                )}

                <button
                  onClick={handleTransferCoins}
                  disabled={loading || !coinsAmount || !agentSakiId.trim()}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)", color: "white", boxShadow: "0 4px 20px rgba(251,191,36,0.2)" }}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                      <span>تحويل العملات</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ── History Tab ── */
          <div className="px-4 pt-5 space-y-5">
            {/* Sent History */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.2)" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                </div>
                <p className="text-white font-bold text-sm">تحويلاتي المرسلة</p>
              </div>
              {!myHistory || myHistory.length === 0 ? (
                <EmptyState label="لا توجد تحويلات بعد" />
              ) : (
                <div className="space-y-2.5">
                  {myHistory.map((item) => (
                    <div key={item._id} className="flex items-center gap-3 rounded-2xl px-4 py-3.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2L2 9l10 13L22 9z" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1.2" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-bold truncate">إلى: {item.agentName}</p>
                        <p className="text-gray-500 text-xs font-mono">#{item.agentSakiId}</p>
                        <p className="text-gray-600 text-[10px] mt-0.5">{new Date(item.createdAt).toLocaleDateString("ar-SA")}</p>
                      </div>
                      <div className="text-left flex-shrink-0 space-y-0.5">
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-blue-400 text-xs font-bold">-{item.diamonds.toLocaleString()}</span>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 9l10 13L22 9z" fill="#60a5fa" /></svg>
                        </div>
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-green-400 text-xs font-bold">+{(item.coinsReceived ?? 0).toLocaleString()}</span>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" fill="#fbbf24" />
                            <circle cx="12" cy="12" r="7" fill="#fcd34d" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Agent Received */}
            {isAgent && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.2)" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
                      <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                  </div>
                  <p className="text-white font-bold text-sm">ما استقبلته كوكيل</p>
                </div>
                {!agentReceived || agentReceived.length === 0 ? (
                  <EmptyState label="لا توجد استقبالات بعد" />
                ) : (
                  <div className="space-y-2.5">
                    {agentReceived.map((item) => (
                      <div key={item._id} className="flex items-center gap-3 rounded-2xl px-4 py-3.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
                            <path d="M12 5v14M5 12l7 7 7-7" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-bold truncate">من: {item.sellerName}</p>
                          <p className="text-gray-500 text-xs font-mono">#{item.sellerSakiId}</p>
                          <p className="text-gray-600 text-[10px] mt-0.5">{new Date(item.createdAt).toLocaleDateString("ar-SA")}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-blue-400 text-sm font-bold">+{item.diamonds.toLocaleString()}</span>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L2 9l10 13L22 9z" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1.2" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center px-6" onClick={() => setShowConfirm(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative rounded-3xl p-6 w-full max-w-sm"
            style={{ background: "#12121f", border: "1px solid rgba(168,85,247,0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 9l10 13L22 9z" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1.2" />
                  <path d="M2 9h20M12 2L7 9l5 13 5-13z" stroke="#93c5fd" strokeWidth="0.8" />
                </svg>
              </div>
            </div>
            <h3 className="text-white font-black text-lg text-center mb-1">تأكيد التحويل</h3>
            <p className="text-gray-400 text-sm text-center mb-5">
              سيتم تحويل <span className="text-blue-400 font-bold">{selectedTier?.toLocaleString()} ماسة</span> وستحصل على <span className="text-yellow-400 font-bold">{coinsFromSelected.toLocaleString()} عملة</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-2xl text-gray-400 font-bold text-sm"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                إلغاء
              </button>
              <button
                onClick={confirmTransferDiamonds}
                className="flex-1 py-3 rounded-2xl text-white font-bold text-sm"
                style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AgentsList({ agents, selectedId, onSelect, accentColor }: {
  agents: any[];
  selectedId: string;
  onSelect: (id: string) => void;
  accentColor: "purple" | "yellow";
}) {
  const colors = {
    purple: { bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.3)", text: "#a855f7" },
    yellow: { bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)", text: "#fbbf24" },
  };
  const c = colors[accentColor];
  return (
    <div>
      <p className="text-gray-500 text-xs font-bold mb-2">وكلاء الشحن</p>
      <div className="space-y-2">
        {agents.map((agent) => {
          const isSelected = selectedId === agent.sakiId;
          return (
            <button
              key={agent._id}
              onClick={() => onSelect(agent.sakiId)}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl active:scale-[0.98] transition-all"
              style={isSelected
                ? { background: c.bg, border: `1px solid ${c.border}` }
                : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2" style={{ ringColor: "rgba(52,211,153,0.25)" }}>
                {agent.avatarUrl
                  ? <img src={agent.avatarUrl} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{agent.name[0]}</span>
                    </div>}
              </div>
              <div className="flex-1 text-right min-w-0">
                <p className="text-white text-sm font-bold truncate">{agent.name}</p>
                <p className="text-gray-500 text-xs font-mono">#{agent.sakiId}</p>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0" style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)", color: "#34d399" }}>وكيل</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p className="text-gray-500 text-sm">{label}</p>
    </div>
  );
}
