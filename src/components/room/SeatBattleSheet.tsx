// @ts-nocheck
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "../../lib/toast";
import { formatNumber } from "../../lib/formatNumber";

interface SeatBattleSheetProps {
  roomId: string;
  isOwner: boolean;
  isAdmin?: boolean;
  myCoins: number;
  myUserId?: string;
  onClose: () => void;
}

const DURATIONS = [
  { label: "5 دقائق", value: 5 },
  { label: "10 دقائق", value: 10 },
  { label: "15 دقائق", value: 15 },
  { label: "30 دقائق", value: 30 },
];

export default function SeatBattleSheet({
  roomId, isOwner, isAdmin = false, myCoins, myUserId, onClose,
}: SeatBattleSheetProps) {
  const canManage = isOwner || isAdmin;
  const [tab, setTab] = useState<"active" | "setup">("active");
  const [duration, setDuration] = useState(10);
  const [lionTeam, setLionTeam] = useState<string[]>([]);
  const [tigerTeam, setTigerTeam] = useState<string[]>([]);
  const [contributeAmount, setContributeAmount] = useState(100);
  const [selectedTeam, setSelectedTeam] = useState<"lion" | "tiger">("lion");
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const [activeBattle, setActiveBattle] = useState<any>(null);
  const [seatedMembers, setSeatedMembers] = useState<any[]>([]);
  const [contributions, setContributions] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: battle } = await supabase.from('seat_battles').select('*').eq('room_id', roomId).eq('status', 'active').single();
      setActiveBattle(battle);
      if (battle) {
        const { data: contribs } = await supabase.from('seat_battle_contributions').select('*').eq('battle_id', battle.id);
        setContributions(contribs || []);
      }
      const { data: members } = await supabase.from('room_members').select('*, profiles(*)').eq('room_id', roomId).not('seat_index', 'is', null);
      setSeatedMembers(members || []);
    };
    fetchData();
  }, [roomId]);

  const createBattle = async (args: any) => {};
  const contribute = async (args: any) => {};
  const endEarly = async (args: any) => {};

  useEffect(() => {
    if (!activeBattle || activeBattle.status !== "active") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [activeBattle?.status]);

  const timeLeft = activeBattle?.ends_at ? Math.max(0, activeBattle.ends_at - now) : 0;
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  const totalCoins = (activeBattle?.lion_coins ?? 0) + (activeBattle?.tiger_coins ?? 0);
  const lionPct = totalCoins > 0 ? ((activeBattle?.lion_coins ?? 0) / totalCoins) * 100 : 50;
  const tigerPct = 100 - lionPct;

  const toggleMember = (userId: string, team: "lion" | "tiger") => {
    if (team === "lion") {
      if (lionTeam.includes(userId)) {
        setLionTeam((p) => p.filter((id) => id !== userId));
      } else {
        setTigerTeam((p) => p.filter((id) => id !== userId));
        setLionTeam((p) => [...p, userId]);
      }
    } else {
      if (tigerTeam.includes(userId)) {
        setTigerTeam((p) => p.filter((id) => id !== userId));
      } else {
        setLionTeam((p) => p.filter((id) => id !== userId));
        setTigerTeam((p) => [...p, userId]);
      }
    }
  };

  const handleCreate = async () => {
    if (lionTeam.length === 0 || tigerTeam.length === 0) {
      toast.error("يجب إضافة عضو واحد على الأقل في كل فريق");
      return;
    }
    setLoading(true);
    try {
      await createBattle({ roomId, durationMinutes: duration, lionTeam, tigerTeam });
      toast.success("تم بدء تحدي المقاعد! 🦁🐯");
      setTab("active");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContribute = async () => {
    if (!activeBattle) return;
    if (contributeAmount <= 0) { toast.error("أدخل مبلغاً صحيحاً"); return; }
    if (myCoins < contributeAmount) { toast.error("رصيدك غير كافٍ"); return; }
    setLoading(true);
    try {
      await contribute({ battleId: activeBattle.id, team: selectedTeam, coins: contributeAmount });
      toast.success(`دعمت فريق ${selectedTeam === "lion" ? "الأسد 🦁" : "النمر 🐯"} بـ ${formatNumber(contributeAmount)} 🪙`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndEarly = async () => {
    if (!activeBattle) return;
    setLoading(true);
    try {
      await endEarly({ battleId: activeBattle.id });
      toast.success("تم إنهاء التحدي");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Determine my team
  const myTeam = activeBattle?.lion_team?.includes(myUserId)
    ? "lion"
    : activeBattle?.tiger_team?.includes(myUserId)
      ? "tiger"
      : null;

  const lionContribs = contributions?.filter((c) => c.team === "lion") ?? [];
  const tigerContribs = contributions?.filter((c) => c.team === "tiger") ?? [];

  return (
    <div className="fixed inset-0 z-[65] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative rounded-t-3xl border-t border-yellow-500/30 animate-slide-up-sheet max-h-[88vh] overflow-hidden flex flex-col"
        style={{ background: "linear-gradient(180deg,#0d0a00 0%,#080600 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦁🐯</span>
            <div>
              <h2 className="text-white font-black text-base">تحدي المقاعد</h2>
              <p className="text-yellow-400/70 text-xs">تحدي داخلي بين أعضاء الغرفة</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        {canManage && (
          <div className="flex gap-1.5 px-5 mb-3 flex-shrink-0">
            {[
              { id: "active", label: "التحدي الحالي" },
              { id: "setup", label: "إنشاء تحدي جديد" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                style={tab === t.id
                  ? { background: "rgba(234,179,8,0.25)", border: "1px solid rgba(234,179,8,0.5)", color: "#eab308" }
                  : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#6b7280" }
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 pb-6">

          {/* ── SETUP TAB ── */}
          {tab === "setup" && canManage && (
            <div className="space-y-4">
              {/* Duration */}
              <div>
                <p className="text-gray-400 text-xs mb-2 font-medium">مدة التحدي</p>
                <div className="grid grid-cols-4 gap-2">
                  {DURATIONS.map((d) => (
                    <button key={d.value} onClick={() => setDuration(d.value)}
                      className="py-2.5 rounded-xl text-xs font-bold transition-all"
                      style={duration === d.value
                        ? { background: "rgba(234,179,8,0.25)", border: "1px solid rgba(234,179,8,0.5)", color: "#eab308" }
                        : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#6b7280" }
                      }>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Members assignment */}
              <div>
                <p className="text-gray-400 text-xs mb-3 font-medium">
                  توزيع الأعضاء على الفريقين ({seatedMembers?.length ?? 0} على المقاعد)
                </p>

                {/* Team headers */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="rounded-xl p-2 text-center"
                    style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)" }}>
                    <span className="text-lg">🦁</span>
                    <p className="text-blue-400 text-xs font-bold mt-0.5">فريق الأسد ({lionTeam.length})</p>
                  </div>
                  <div className="rounded-xl p-2 text-center"
                    style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                    <span className="text-lg">🐯</span>
                    <p className="text-red-400 text-xs font-bold mt-0.5">فريق النمر ({tigerTeam.length})</p>
                  </div>
                </div>

                {!seatedMembers ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : seatedMembers.length === 0 ? (
                  <div className="rounded-2xl p-4 text-center"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-gray-500 text-sm">لا يوجد أعضاء على المقاعد حالياً</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {seatedMembers.map((m) => {
                      const inLion = lionTeam.includes(m.userId);
                      const inTiger = tigerTeam.includes(m.userId);
                      return (
                        <div key={m.userId} className="flex items-center gap-3 p-2.5 rounded-2xl"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                            {m.avatarUrl
                              ? <img src={m.avatarUrl} alt="" className="w-full h-full object-cover" />
                              : <span className="text-sm">👤</span>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-bold truncate">{m.name}</p>
                            <p className="text-gray-500 text-[10px]">مقعد {(m.seatIndex ?? 0) + 1}</p>
                          </div>
                          {/* Team buttons */}
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => toggleMember(m.userId, "lion")}
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all"
                              style={inLion
                                ? { background: "rgba(59,130,246,0.4)", border: "1.5px solid #3b82f6" }
                                : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }
                              }
                            >
                              🦁
                            </button>
                            <button
                              onClick={() => toggleMember(m.userId, "tiger")}
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all"
                              style={inTiger
                                ? { background: "rgba(239,68,68,0.4)", border: "1.5px solid #ef4444" }
                                : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }
                              }
                            >
                              🐯
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Summary */}
              {(lionTeam.length > 0 || tigerTeam.length > 0) && (
                <div className="rounded-2xl p-3"
                  style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-400 font-bold">🦁 الأسد: {lionTeam.length} عضو</span>
                    <span className="text-red-400 font-bold">🐯 النمر: {tigerTeam.length} عضو</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={loading || lionTeam.length === 0 || tigerTeam.length === 0}
                className="w-full py-4 rounded-2xl font-black text-base transition-all disabled:opacity-50"
                style={{
                  background: (lionTeam.length > 0 && tigerTeam.length > 0)
                    ? "linear-gradient(135deg,#eab308,#ca8a04)"
                    : "rgba(255,255,255,0.08)",
                  color: "white",
                }}
              >
                {loading ? "جارٍ البدء..." : "🚀 ابدأ التحدي"}
              </button>
            </div>
          )}

          {/* ── ACTIVE TAB ── */}
          {tab === "active" && (
            <div className="space-y-4">
              {!activeBattle ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                    style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)" }}>
                    <span className="text-4xl">🦁🐯</span>
                  </div>
                  <p className="text-gray-400 text-sm text-center">لا يوجد تحدي مقاعد نشط حالياً</p>
                  {canManage && (
                    <button onClick={() => setTab("setup")}
                      className="px-5 py-2.5 rounded-xl font-bold text-sm"
                      style={{ background: "linear-gradient(135deg,#eab308,#ca8a04)", color: "white" }}>
                      إنشاء تحدي جديد 🚀
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Timer */}
                  <div className="rounded-2xl p-3 text-center"
                    style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.25)" }}>
                    <p className="text-yellow-400 text-xs mb-1">الوقت المتبقي</p>
                    <p className="text-white font-black text-2xl tabular-nums">
                      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="rounded-2xl p-4"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-center flex-1">
                        <div className="text-2xl mb-1">🦁</div>
                        <p className="text-blue-400 font-black text-sm">فريق الأسد</p>
                        <p className="text-yellow-400 font-bold text-lg">{formatNumber(activeBattle.lion_coins)}</p>
                        <p className="text-gray-500 text-xs">🪙</p>
                      </div>
                      <div className="text-yellow-400 font-black text-xl px-3">VS</div>
                      <div className="text-center flex-1">
                        <div className="text-2xl mb-1">🐯</div>
                        <p className="text-red-400 font-black text-sm">فريق النمر</p>
                        <p className="text-yellow-400 font-bold text-lg">{formatNumber(activeBattle.tiger_coins)}</p>
                        <p className="text-gray-500 text-xs">🪙</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-3 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div className="h-full transition-all duration-500"
                        style={{ width: `${lionPct}%`, background: "linear-gradient(90deg,#3b82f6,#60a5fa)" }} />
                      <div className="h-full transition-all duration-500"
                        style={{ width: `${tigerPct}%`, background: "linear-gradient(90deg,#ef4444,#f87171)" }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-blue-400 text-xs font-bold">{lionPct.toFixed(0)}%</span>
                      <span className="text-red-400 text-xs font-bold">{tigerPct.toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Teams display */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl p-3"
                      style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
                      <p className="text-blue-400 text-xs font-bold mb-2">🦁 فريق الأسد</p>
                      {activeBattle.lion_team.map((uid) => {
                        const m = seatedMembers?.find((s) => s.userId === uid);
                        return (
                          <p key={uid} className="text-white text-xs truncate mb-1">
                            {m?.name ?? "..."}
                          </p>
                        );
                      })}
                    </div>
                    <div className="rounded-xl p-3"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <p className="text-red-400 text-xs font-bold mb-2">🐯 فريق النمر</p>
                      {activeBattle.tiger_team.map((uid) => {
                        const m = seatedMembers?.find((s) => s.userId === uid);
                        return (
                          <p key={uid} className="text-white text-xs truncate mb-1">
                            {m?.name ?? "..."}
                          </p>
                        );
                      })}
                    </div>
                  </div>

                  {/* Contribute */}
                  <div className="rounded-2xl p-4 space-y-3"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-white font-bold text-sm">ادعم فريقك 🪙</p>

                    {/* Team selector */}
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setSelectedTeam("lion")}
                        className="py-2.5 rounded-xl text-sm font-bold transition-all"
                        style={selectedTeam === "lion"
                          ? { background: "rgba(59,130,246,0.3)", border: "1.5px solid #3b82f6", color: "#93c5fd" }
                          : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#6b7280" }
                        }>
                        🦁 الأسد
                      </button>
                      <button onClick={() => setSelectedTeam("tiger")}
                        className="py-2.5 rounded-xl text-sm font-bold transition-all"
                        style={selectedTeam === "tiger"
                          ? { background: "rgba(239,68,68,0.3)", border: "1.5px solid #ef4444", color: "#fca5a5" }
                          : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#6b7280" }
                        }>
                        🐯 النمر
                      </button>
                    </div>

                    {/* Amount buttons */}
                    <div className="flex gap-2">
                      {[100, 500, 1000, 5000].map((amt) => (
                        <button key={amt} onClick={() => setContributeAmount(amt)}
                          className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                          style={contributeAmount === amt
                            ? { background: "rgba(234,179,8,0.25)", border: "1px solid rgba(234,179,8,0.5)", color: "#eab308" }
                            : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#6b7280" }
                          }>
                          {formatNumber(amt)}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={contributeAmount}
                        onChange={(e) => setContributeAmount(Math.max(1, parseInt(e.target.value) || 0))}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500/50"
                        placeholder="مبلغ مخصص"
                      />
                      <button onClick={handleContribute} disabled={loading || myCoins < contributeAmount}
                        className="px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 transition-all"
                        style={{
                          background: selectedTeam === "lion"
                            ? "linear-gradient(135deg,#3b82f6,#2563eb)"
                            : "linear-gradient(135deg,#ef4444,#dc2626)",
                          color: "white",
                        }}>
                        {loading ? "..." : "دعم"}
                      </button>
                    </div>
                    <p className="text-gray-500 text-xs">رصيدك: {formatNumber(myCoins)} 🪙</p>
                  </div>

                  {/* Top contributors */}
                  {contributions && contributions.length > 0 && (
                    <div className="rounded-2xl p-4"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <p className="text-white font-bold text-sm mb-3">أكبر المساهمين</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-blue-400 text-xs font-bold mb-2">🦁 الأسد</p>
                          {lionContribs.slice(0, 3).map((c, i) => (
                            <div key={c._id} className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                              <span className="text-white text-xs truncate flex-1">{c.userName}</span>
                              <span className="text-yellow-400 text-xs font-bold">{formatNumber(c.coins)}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="text-red-400 text-xs font-bold mb-2">🐯 النمر</p>
                          {tigerContribs.slice(0, 3).map((c, i) => (
                            <div key={c._id} className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                              <span className="text-white text-xs truncate flex-1">{c.userName}</span>
                              <span className="text-yellow-400 text-xs font-bold">{formatNumber(c.coins)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {canManage && (
                    <button onClick={handleEndEarly} disabled={loading}
                      className="w-full py-3 rounded-2xl font-bold text-sm bg-red-500/10 border border-red-500/25 text-red-400 disabled:opacity-50">
                      إنهاء التحدي مبكراً
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── FINISHED ── */}
          {activeBattle?.status === "finished" && tab === "active" && (
            <div className="rounded-3xl p-5 text-center mt-2"
              style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.25)" }}>
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="text-white font-black text-lg mb-2">انتهى التحدي!</h3>
              {activeBattle.winnerTeam ? (
                <p className="text-yellow-400 font-bold text-base">
                  {activeBattle.winnerTeam === "lion" ? "🦁 فريق الأسد فاز!" : "🐯 فريق النمر فاز!"}
                </p>
              ) : (
                <p className="text-gray-400 text-sm">تعادل! كلا الفريقين متساويان</p>
              )}
              <div className="flex justify-center gap-6 mt-3">
                <div className="text-center">
                  <p className="text-blue-400 text-xs">🦁 الأسد</p>
                  <p className="text-white font-bold">{formatNumber(activeBattle.lion_coins)} 🪙</p>
                </div>
                <div className="text-center">
                  <p className="text-red-400 text-xs">🐯 النمر</p>
                  <p className="text-white font-bold">{formatNumber(activeBattle.tiger_coins)} 🪙</p>
                </div>
              </div>
              {canManage && (
                <button onClick={() => setTab("setup")} className="mt-4 px-5 py-2.5 rounded-xl font-bold text-sm"
                  style={{ background: "linear-gradient(135deg,#eab308,#ca8a04)", color: "white" }}>
                  تحدي جديد 🚀
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
