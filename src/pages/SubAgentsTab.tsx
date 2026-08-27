// @ts-nocheck
import { supabase } from "../lib/supabaseClient";
import { useState, useEffect } from "react";
import { toast } from "../lib/toast";
import { AgentChargeBadge } from "../components/AgentChargeBadge";
import CopySakiId from "../components/CopySakiId";

function SakiCoinIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="19" fill="url(#sakiGradSub)" stroke="#b45309" strokeWidth="1.5" />
      <text x="20" y="25" textAnchor="middle" fontSize="16" fontWeight="900" fill="#7c2d12" fontFamily="Arial">S</text>
      <defs>
        <radialGradient id="sakiGradSub" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
      </defs>
    </svg>
  );
}

interface SubAgentsTabProps {
  sakiBal: number;
}

export default function SubAgentsTab({ sakiBal }: SubAgentsTabProps) {
  const [subAgents, setSubAgents] = useState<any[]>([]);
  const [searchUser, setSearchUser] = useState<any>(null);

  const [view, setView] = useState<"list" | "add" | "transfer">("list");
  const [addSakiId, setAddSakiId] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('sub_agents').select('*, profile:profiles(*)').eq('agent_id', user.id);
        setSubAgents(data || []);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (addSakiId.trim().length >= 6) {
      supabase.from('profiles').select('*').eq('saki_id', addSakiId.trim()).single().then(({ data }) => setSearchUser(data));
    } else {
      setSearchUser(null);
    }
  }, [addSakiId]);

  const addSubAgent = async (args: any) => ({ targetName: "" });
  const removeSubAgent = async (args: any) => {};
  const transferSaki = async (args: any) => ({ targetName: "" });

  const handleAdd = async () => {
    if (!addSakiId.trim()) { toast.error("ادخل SAKI ID"); return; }
    if (!searchUser) { toast.error("المستخدم غير موجود"); return; }
    setAddLoading(true);
    try {
      const r = await addSubAgent({ targetSakiId: addSakiId.trim() });
      toast.success(`تمت إضافة ${r.targetName} كوكيل فرعي`);
      setAddSakiId("");
      setView("list");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemove = async (subAgentUserId: string, name: string) => {
    if (!confirm(`هل تريد حذف ${name} من الوكلاء الفرعيين؟`)) return;
    try {
      await removeSubAgent({ subAgentUserId });
      toast.success("تم حذف الوكيل الفرعي");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleTransfer = async () => {
    if (!selectedAgent) return;
    if (!transferAmount || Number(transferAmount) <= 0) { toast.error("ادخل كمية صحيحة"); return; }
    if (Number(transferAmount) > sakiBal) { toast.error("رصيد ساكي غير كافٍ"); return; }
    setTransferLoading(true);
    try {
      const r = await transferSaki({
        subAgentUserId: selectedAgent.subAgentId,
        sakiAmount: Number(transferAmount),
        note: transferNote || undefined,
      });
      toast.success(`تم تحويل ${transferAmount} ساكي لـ ${r.targetName}`);
      setTransferAmount("");
      setTransferNote("");
      setSelectedAgent(null);
      setView("list");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setTransferLoading(false);
    }
  };

  // ── Add View ──
  if (view === "add") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => { setView("list"); setAddSakiId(""); }}
            className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h3 className="text-white font-bold text-sm">إضافة وكيل فرعي</h3>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
          <input
            value={addSakiId}
            onChange={(e) => setAddSakiId(e.target.value)}
            placeholder="ادخل SAKI ID للوكيل الفرعي..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-500 font-mono"
          />
          {addSakiId.length >= 6 && (
            <div className={`rounded-xl p-3 border transition-all ${searchUser ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}>
              {searchUser ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                    {searchUser.avatarUrl
                      ? <img src={searchUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                      : <span className="text-white font-bold">{searchUser.name[0]}</span>}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold text-sm">{searchUser.name}</p>
                    <p className="text-gray-400 text-xs font-mono">#{searchUser.sakiId}</p>
                  </div>
                  <span className="text-green-400 text-xs font-bold bg-green-500/20 px-2 py-1 rounded-lg">موجود</span>
                </div>
              ) : (
                <p className="text-red-400 text-sm text-center">لم يتم العثور على المستخدم</p>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleAdd}
          disabled={addLoading || !searchUser}
          className="w-full py-4 rounded-2xl text-white font-black text-base disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#f59e0b,#b45309)" }}>
          {addLoading
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <span>👥</span>}
          <span>{addLoading ? "جارٍ الإضافة..." : "إضافة كوكيل فرعي"}</span>
        </button>
      </div>
    );
  }

  // ── Transfer View ──
  if (view === "transfer" && selectedAgent) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => { setView("list"); setSelectedAgent(null); setTransferAmount(""); }}
            className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h3 className="text-white font-bold text-sm">تحويل ساكي لوكيل فرعي</h3>
        </div>

        {/* Target Agent Card */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center flex-shrink-0">
            {selectedAgent.avatarUrl
              ? <img src={selectedAgent.avatarUrl} className="w-full h-full object-cover" />
              : <span className="text-white font-bold">{selectedAgent.name?.[0]}</span>}
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">{selectedAgent.name}</p>
            <CopySakiId sakiId={selectedAgent.sakiId} color="#9ca3af" fontSize={11} />
            <p className="text-amber-300 text-xs">رصيده: {(selectedAgent.sakiBalance ?? 0).toLocaleString()} ساكي</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <SakiCoinIcon size={16} />
            <span className="text-white font-bold text-sm">كمية ساكي للتحويل</span>
          </div>
          <input
            type="number"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            placeholder="عدد وحدات ساكي..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-500"
          />
          <div className="grid grid-cols-4 gap-2">
            {[1, 5, 10, 50].map((v) => (
              <button key={v} onClick={() => setTransferAmount(String(v))}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${transferAmount === String(v) ? "bg-amber-500/20 border-amber-500/50 text-amber-300" : "bg-white/5 border-white/10 text-gray-400"}`}>
                {v} ساكي
              </button>
            ))}
          </div>
          {transferAmount && Number(transferAmount) > 0 && (
            <div className="rounded-xl p-3 border border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs">سيخصم من رصيدك:</span>
                <div className="flex items-center gap-1">
                  <SakiCoinIcon size={12} />
                  <span className={`font-black text-sm ${Number(transferAmount) > sakiBal ? "text-red-400" : "text-amber-400"}`}>
                    {Number(transferAmount).toLocaleString()}
                  </span>
                  <span className="text-gray-400 text-xs">ساكي</span>
                </div>
              </div>
              {Number(transferAmount) > sakiBal && (
                <p className="text-red-400 text-xs mt-1 font-bold">رصيد ساكي غير كافٍ!</p>
              )}
            </div>
          )}
          <input
            value={transferNote}
            onChange={(e) => setTransferNote(e.target.value)}
            placeholder="ملاحظة (اختياري)..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          onClick={handleTransfer}
          disabled={transferLoading || !transferAmount || Number(transferAmount) <= 0 || Number(transferAmount) > sakiBal}
          className="w-full py-4 rounded-2xl text-white font-black text-base disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#f59e0b,#b45309)", boxShadow: "0 4px 20px rgba(245,158,11,0.3)" }}>
          {transferLoading
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <SakiCoinIcon size={20} />}
          <span>{transferLoading ? "جارٍ التحويل..." : `تحويل ${transferAmount || "0"} ساكي`}</span>
        </button>
      </div>
    );
  }

  // ── List View ──
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="rounded-xl px-3 py-2 text-center"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <p className="text-amber-400 text-xs font-bold">
            👥 الوكلاء الفرعيين ({subAgents?.length ?? 0})
          </p>
        </div>
        <button
          onClick={() => setView("add")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg,#f59e0b,#b45309)" }}>
          <span>+</span>
          <span>إضافة وكيل</span>
        </button>
      </div>

      {!subAgents ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : subAgents.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">👥</div>
          <p className="text-gray-500 text-sm">لا يوجد وكلاء فرعيين بعد</p>
          <p className="text-gray-600 text-xs mt-1">أضف وكلاء فرعيين لتوزيع رصيد الساكي</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subAgents.map((agent: any) => (
            <div key={agent.id} className="rounded-2xl p-3"
              style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center">
                  {agent.avatarUrl
                    ? <img src={agent.avatarUrl} className="w-full h-full object-cover" />
                    : <span className="text-white font-bold text-sm">{agent.name?.[0]}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-white font-bold text-sm truncate">{agent.name}</p>
                    <AgentChargeBadge size="xs" showLabel={false} />
                  </div>
                  <CopySakiId sakiId={agent.sakiId} color="#9ca3af" fontSize={11} />
                  <div className="flex items-center gap-3 mt-0.5">
                    <div className="flex items-center gap-1">
                      <SakiCoinIcon size={11} />
                      <span className="text-amber-400 text-xs font-bold">{(agent.sakiBalance ?? 0).toLocaleString()}</span>
                    </div>
                    <span className="text-gray-600 text-[10px]">استخدم: {(agent.totalSakiUsed ?? 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => { setSelectedAgent(agent); setView("transfer"); }}
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white flex items-center gap-1"
                    style={{ background: "linear-gradient(135deg,#f59e0b,#b45309)" }}>
                    <SakiCoinIcon size={10} />
                    <span>تحويل</span>
                  </button>
                  <button
                    onClick={() => handleRemove(agent.subAgentId, agent.name)}
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20">
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
