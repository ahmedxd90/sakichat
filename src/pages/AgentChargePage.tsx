// @ts-nocheck
import { supabase } from "../lib/supabaseClient";
import { useState, useEffect } from "react";
import { toast } from "../lib/toast";
import SubAgentsTab from "./SubAgentsTab";
import { AgentChargeBadge } from "../components/AgentChargeBadge";
import SakiIdDisplay from "../components/SakiIdDisplay";

interface AgentChargePageProps {
  onBack: () => void;
}

function SakiCoinIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="19" fill="url(#sakiGrad)" stroke="#b45309" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="15" fill="none" stroke="#fde68a" strokeWidth="0.8" opacity="0.5" />
      <text x="20" y="25" textAnchor="middle" fontSize="16" fontWeight="900" fill="#7c2d12" fontFamily="Arial">S</text>
      <defs>
        <radialGradient id="sakiGrad" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
      </defs>
    </svg>
  );
}

const SAKI_TO_COINS = 60000;

export default function AgentChargePage({ onBack }: AgentChargePageProps) {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isSubAgent, setIsSubAgent] = useState(false);
  const [searchUser, setSearchUser] = useState<any>(null);

  const [tab, setTab] = useState<"charge" | "history" | "subagents">("charge");
  const [sakiId, setSakiId] = useState("");
  const [sakiAmount, setSakiAmount] = useState("");
  const [dollars, setDollars] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: w } = await supabase.from('saki_wallets').select('*').eq('user_id', user.id).single();
        setWallet(w);
        const { data: tx } = await supabase.from('saki_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        setTransactions(tx || []);
        const { data: sa } = await supabase.from('sub_agents').select('*').eq('user_id', user.id).single();
        setIsSubAgent(!!sa);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (sakiId.trim().length >= 1) {
      supabase.from('profiles').select('*').eq('saki_id', sakiId.trim()).single().then(({ data }) => setSearchUser(data));
    } else {
      setSearchUser(null);
    }
  }, [sakiId]);

  const chargeUser = async (args: any) => ({ coinsAdded: 0, targetName: "" });

  const sakiBal = wallet?.sakiBalance ?? 0;
  const coinsPreview = sakiAmount ? Number(sakiAmount) * SAKI_TO_COINS : 0;

  const handleCharge = async () => {
    if (!sakiId.trim()) { toast.error("ادخل SAKI ID"); return; }
    if (!sakiAmount || Number(sakiAmount) <= 0) { toast.error("ادخل كمية ساكي صحيحة"); return; }
    if (!searchUser) { toast.error("المستخدم غير موجود"); return; }
    if (Number(sakiAmount) > sakiBal) { toast.error(`رصيد ساكي غير كافٍ. لديك ${sakiBal} ساكي`); return; }
    setLoading(true);
    try {
      const result = await chargeUser({
        targetSakiId: sakiId.trim(),
        sakiAmount: Number(sakiAmount),
        dollars: dollars ? Number(dollars) : undefined,
        note: note || undefined,
      });
      toast.success(`تم شحن ${result.coinsAdded.toLocaleString()} عملة لـ ${result.targetName}`);
      setSakiId(""); setSakiAmount(""); setDollars(""); setNote("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#0a0a1a" }} dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/5"
        style={{ background: "rgba(10,10,26,0.97)" }}>
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <SakiCoinIcon size={22} />
            <h2 className="text-white font-black text-lg">محفظة ساكي</h2>
            <AgentChargeBadge size="xs" showLabel={false} />
          </div>
          <div className="w-9" />
        </div>
      </div>

      {/* Wallet Balance Card */}
      <div className="px-4 pt-4 pb-2">
        <div className="rounded-2xl p-4 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#78350f,#92400e,#b45309)", border: "1px solid #f59e0b40" }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -translate-y-8 translate-x-8"
            style={{ background: "#fde68a" }} />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-200 text-xs font-bold mb-1">رصيد ساكي الخاص بك</p>
              <div className="flex items-center gap-2">
                <SakiCoinIcon size={28} />
                <span className="text-white font-black text-3xl">{sakiBal.toLocaleString()}</span>
                <span className="text-amber-300 text-sm font-bold">SAKI</span>
              </div>
              <p className="text-amber-200/70 text-xs mt-1">
                = {(sakiBal * SAKI_TO_COINS).toLocaleString()} عملة ذهبية
              </p>
            </div>
            <div className="text-right">
              <div className="bg-black/20 rounded-xl px-3 py-2 text-center">
                <p className="text-amber-300 text-[10px] font-bold">معدل التحويل</p>
                <p className="text-white font-black text-sm">1 ساكي</p>
                <p className="text-amber-200 text-[10px]">= {SAKI_TO_COINS.toLocaleString()} عملة</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-black/20 rounded-xl px-3 py-2 text-center">
              <p className="text-amber-300 text-[10px] font-bold">اجمالي المضاف</p>
              <p className="text-white font-bold text-sm">{(wallet?.totalSakiAdded ?? 0).toLocaleString()}</p>
            </div>
            <div className="bg-black/20 rounded-xl px-3 py-2 text-center">
              <p className="text-amber-300 text-[10px] font-bold">اجمالي المستخدم</p>
              <p className="text-white font-bold text-sm">{(wallet?.totalSakiUsed ?? 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-2">
        <div className="flex gap-2 bg-white/5 rounded-2xl p-1">
          {[
            { id: "charge", label: "شحن مستخدم", icon: "⚡" },
            { id: "history", label: "السجل", icon: "📋" },
            ...(!isSubAgent ? [{ id: "subagents", label: "الفرعيين", icon: "👥" }] : []),
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-3">

        {tab === "charge" && (
          <>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <h3 className="text-white font-bold text-sm">🔍 البحث عن مستخدم</h3>
              <input
                value={sakiId}
                onChange={(e) => setSakiId(e.target.value)}
                placeholder="ادخل SAKI ID للمستخدم..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-500 font-mono"
              />
              {sakiId.trim().length >= 1 && (
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
                        <SakiIdDisplay
                          sakiId={searchUser.sakiId}
                          profile={searchUser}
                          fontSize={11}
                          iconSize={13}
                        />
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs">🪙</span>
                          <span className="text-yellow-400 text-xs font-bold">{(searchUser.goldCoins ?? 0).toLocaleString()}</span>
                        </div>
                      </div>
                      <span className="text-green-400 text-xs font-bold bg-green-500/20 px-2 py-1 rounded-lg">موجود</span>
                    </div>
                  ) : (
                    <p className="text-red-400 text-sm text-center">لم يتم العثور على المستخدم</p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <SakiCoinIcon size={16} /> كمية ساكي للشحن
              </h3>
              <input
                type="number"
                value={sakiAmount}
                onChange={(e) => setSakiAmount(e.target.value)}
                placeholder="عدد وحدات ساكي..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-500"
              />
              <div className="grid grid-cols-4 gap-2">
                {[1, 5, 10, 50].map((v) => (
                  <button key={v} onClick={() => setSakiAmount(String(v))}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${sakiAmount === String(v) ? "bg-amber-500/20 border-amber-500/50 text-amber-300" : "bg-white/5 border-white/10 text-gray-400"}`}>
                    {v} ساكي
                  </button>
                ))}
              </div>
              {sakiAmount && Number(sakiAmount) > 0 && (
                <div className="rounded-xl p-3 border border-amber-500/20 bg-amber-500/5">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs">ستضاف للمستخدم:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs">🪙</span>
                      <span className="text-amber-400 font-black text-sm">{coinsPreview.toLocaleString()}</span>
                      <span className="text-gray-400 text-xs">عملة</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-gray-400 text-xs">سيخصم من رصيدك:</span>
                    <div className="flex items-center gap-1">
                      <SakiCoinIcon size={12} />
                      <span className="text-red-400 font-black text-sm">{Number(sakiAmount).toLocaleString()}</span>
                      <span className="text-gray-400 text-xs">ساكي</span>
                    </div>
                  </div>
                  {Number(sakiAmount) > sakiBal && (
                    <p className="text-red-400 text-xs mt-1 font-bold">رصيد ساكي غير كافٍ!</p>
                  )}
                </div>
              )}
              <div>
                <p className="mb-1.5 text-xs font-bold text-amber-200">قيمة الشحن بالدولار لمكافآت الشحن</p>
                <input type="number" min="0" step="0.01" value={dollars} onChange={(e) => setDollars(e.target.value)} placeholder="مثال: 100" className="w-full bg-white/5 border border-amber-500/25 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-500" />
                <p className="mt-1 text-[10px] text-amber-200/65">تُحدّث هدية الشحن للمستخدم تلقائيًا بعد نجاح شحن الوكيل.</p>
              </div>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ملاحظة (اختياري)..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              onClick={handleCharge}
              disabled={loading || !searchUser || !sakiAmount || Number(sakiAmount) <= 0 || Number(sakiAmount) > sakiBal}
              className="w-full py-4 rounded-2xl text-white font-black text-base disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#f59e0b,#b45309)", boxShadow: "0 4px 20px rgba(245,158,11,0.3)" }}>
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <SakiCoinIcon size={20} />}
              <span>{loading ? "جارٍ الشحن..." : `شحن ${sakiAmount ? Number(sakiAmount).toLocaleString() : "0"} ساكي`}</span>
            </button>
          </>
        )}

        {tab === "history" && (
          <>
            {!transactions ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">📋</div>
                <p className="text-gray-500 text-sm">لا توجد معاملات بعد</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx: any) => {
                  const isCharge = tx.type === "charge";
                  const isAdd = tx.type === "admin_add";
                  const color = isCharge ? "#ef4444" : isAdd ? "#10b981" : "#f97316";
                  const icon = isCharge ? "⚡" : isAdd ? "+" : "-";
                  const label = isCharge ? "شحن مستخدم" : isAdd ? "اضافة ادارية" : "خصم اداري";
                  return (
                    <div key={tx.id} className="rounded-xl px-4 py-3 flex items-center justify-between"
                      style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: `${color}15` }}>
                          {icon}
                        </div>
                        <div>
                          <p className="text-white text-sm font-bold">{label}</p>
                          {tx.targetName && <p className="text-gray-400 text-xs">{tx.targetName} #{tx.targetSakiId}</p>}
                          <p className="text-gray-500 text-[10px]">{new Date(tx.createdAt).toLocaleString("ar")}</p>
                          {tx.note && <p className="text-gray-400 text-[10px] mt-0.5">{tx.note}</p>}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-1 justify-end">
                          <SakiCoinIcon size={14} />
                          <span className="font-black text-sm" style={{ color }}>
                            {isCharge ? "-" : "+"}{tx.sakiAmount.toLocaleString()}
                          </span>
                        </div>
                        {tx.coinsAmount && (
                          <p className="text-gray-500 text-[10px] text-right">
                            {tx.coinsAmount.toLocaleString()} 🪙
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {false && tab === "leaderboard" && (
          <>
            <div className="rounded-2xl p-3 mb-2"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <p className="text-amber-400 text-xs font-bold text-center">ترتيب الوكلاء حسب اجمالي الشحن</p>
            </div>
            {!leaderboard ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">🏆</div>
                <p className="text-gray-500 text-sm">لا توجد بيانات بعد</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((agent: any, i: number) => (
                  <div key={agent._id} className="rounded-2xl p-3 flex items-center gap-3"
                    style={{
                      background: i < 3 ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.04)",
                      border: i < 3 ? "1px solid rgba(245,158,11,0.2)" : "1px solid rgba(255,255,255,0.08)",
                    }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                      style={{
                        background: i === 0 ? "linear-gradient(135deg,#fbbf24,#f59e0b)" : i === 1 ? "rgba(192,192,192,0.3)" : i === 2 ? "rgba(205,127,50,0.3)" : "rgba(255,255,255,0.08)",
                        color: i < 3 ? "#000" : "#9ca3af",
                      }}>
                      {i === 0 ? "1" : i === 1 ? "2" : i === 2 ? "3" : `${i + 1}`}
                    </div>
                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center">
                      {agent.avatarUrl
                        ? <img src={agent.avatarUrl} className="w-full h-full object-cover" />
                        : <span className="text-white font-bold text-sm">{agent.name?.[0]}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{agent.name}</p>
                      <p className="text-gray-500 text-xs font-mono">#{agent.sakiId}</p>
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1 justify-end">
                        <SakiCoinIcon size={14} />
                        <span className="text-amber-400 font-black text-sm">{(agent.totalSakiUsed ?? 0).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-500 text-[10px] text-right">رصيد: {(agent.sakiBalance ?? 0).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "subagents" && !isSubAgent && (
          <SubAgentsTab sakiBal={sakiBal} />
        )}
      </div>
    </div>
  );
}
