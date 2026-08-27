// @ts-nocheck
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "../../lib/toast";
import { formatNumber } from "../../lib/formatNumber";

interface InRoomPKSheetProps {
  roomId: string;
  isOwner: boolean;
  isAdmin: boolean;
  myProfile: any;
  onClose: () => void;
}

export default function InRoomPKSheet({ roomId, isOwner, isAdmin, myProfile, onClose }: InRoomPKSheetProps) {
  const [activePK, setActivePK] = useState<any>(null);
  const [lastFinished, setLastFinished] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [contributors, setContributors] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [myTeam, setMyTeam] = useState<string | null>(null);

  const [tab, setTab] = useState<"battle" | "history">("battle");

  useEffect(() => {
    const fetchPKData = async () => {
      const { data: active } = await supabase.from('in_room_pks').select('*').eq('room_id', roomId).eq('status', 'active').order('created_at', { ascending: false }).limit(1).single();
      setActivePK(active);
      
      if (active) {
        const { data: contribs } = await supabase.from('pk_contributors').select('*, profiles(name, avatar_url)').eq('pk_id', active.id);
        setContributors(contribs || []);
        
        const { data: mems } = await supabase.from('pk_members').select('*, profiles(name, avatar_url)').eq('pk_id', active.id);
        setMembers(mems || []);
        
        const { data: myT } = await supabase.from('pk_members').select('team').eq('pk_id', active.id).eq('user_id', myProfile?.user_id).single();
        setMyTeam(myT?.team || null);
      }

      const { data: last } = await supabase.from('in_room_pks').select('*').eq('room_id', roomId).eq('status', 'finished').order('created_at', { ascending: false }).limit(1).single();
      setLastFinished(last);

      const { data: hist } = await supabase.from('in_room_pks').select('*').eq('room_id', roomId).eq('status', 'finished').order('created_at', { ascending: false }).limit(20);
      setHistory(hist || []);
    };
    fetchPKData();
    const sub = supabase.channel(`pk_room_${roomId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'in_room_pks' }, fetchPKData).subscribe();
    return () => { sub.unsubscribe(); };
  }, [roomId, myProfile?.user_id]);
  const [duration, setDuration] = useState(10);
  const [team1Name, setTeam1Name] = useState("الفريق الأحمر 🔴");
  const [team2Name, setTeam2Name] = useState("الفريق الأزرق 🔵");
  const [loading, setLoading] = useState(false);
  const [showStart, setShowStart] = useState(false);

  const canManage = isOwner || isAdmin;

  const handleStart = async () => {
    setLoading(true);
    try {
      const endsAt = new Date(Date.now() + duration * 60000).toISOString();
      const { error } = await supabase.from('in_room_pks').insert({
        room_id: roomId,
        duration_minutes: duration,
        team1_name: team1Name,
        team2_name: team2Name,
        ends_at: endsAt,
        status: 'active'
      });
      if (error) throw error;
      setShowStart(false);
      toast.success("🔥 بدأ تحدي PK!");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleEnd = async () => {
    if (!activePK) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('in_room_pks').update({ status: 'finished' }).eq('id', activePK.id);
      if (error) throw error;
      toast.success("انتهى التحدي");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleJoin = async (team: "team1" | "team2") => {
    if (!activePK) return;
    try {
      const { error } = await supabase.from('pk_members').upsert({
        pk_id: activePK.id,
        user_id: myProfile.user_id,
        team
      });
      if (error) throw error;
      toast.success(team === "team1" ? `انضممت لـ ${activePK.team1_name}` : `انضممت لـ ${activePK.team2_name}`);
    } catch (e: any) { toast.error(e.message); }
  };

  const team1Members = members?.filter((m: any) => m.team === "team1") ?? [];
  const team2Members = members?.filter((m: any) => m.team === "team2") ?? [];
  const team1Contribs = contributors?.filter((c: any) => c.team === "team1") ?? [];
  const team2Contribs = contributors?.filter((c: any) => c.team === "team2") ?? [];

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }}>
      <div className="flex-1 flex flex-col max-h-full overflow-hidden" style={{ marginTop: "auto", maxHeight: "90vh" }}>
        <div className="rounded-t-3xl overflow-hidden flex flex-col"
          style={{ background: "linear-gradient(180deg,#0a0020 0%,#050010 100%)", border: "1px solid rgba(251,146,60,0.3)", maxHeight: "90vh" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(251,146,60,0.15)" }}>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90"
              style={{ background: "rgba(255,255,255,0.08)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl">⚔️</span>
              <span className="text-white font-black text-base">تحدي PK الغرفة</span>
            </div>
            <div className="w-8" />
          </div>

          {/* Tabs */}
          <div className="flex px-4 pt-3 gap-2 flex-shrink-0">
            {(["battle", "history"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-xl text-xs font-black transition-all"
                style={tab === t
                  ? { background: "linear-gradient(135deg,#ef4444,#3b82f6)", color: "white" }
                  : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                {t === "battle" ? "⚔️ المعركة" : "📜 السجل"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {tab === "battle" && (
              <>
                {/* No active PK */}
                {!activePK && (
                  <div className="flex flex-col items-center gap-4">
                    {/* Last result */}
                    {lastFinished && (
                      <PKResultCard pk={lastFinished} />
                    )}

                    {canManage && !showStart && (
                      <button onClick={() => setShowStart(true)}
                        className="w-full py-3 rounded-2xl font-black text-sm active:scale-95 transition-transform"
                        style={{ background: "linear-gradient(135deg,#ef4444,#f97316,#3b82f6)", color: "white", boxShadow: "0 4px 20px rgba(239,68,68,0.4)" }}>
                        ⚔️ بدء تحدي PK جديد
                      </button>
                    )}

                    {canManage && showStart && (
                      <div className="w-full rounded-2xl p-4 flex flex-col gap-3"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(251,146,60,0.2)" }}>
                        <p className="text-white font-black text-sm text-center">⚙️ إعداد التحدي</p>

                        {/* Duration */}
                        <div>
                          <p className="text-white/60 text-xs mb-2">المدة</p>
                          <div className="flex gap-2">
                            {[5, 10, 15, 20].map((d) => (
                              <button key={d} onClick={() => setDuration(d)}
                                className="flex-1 py-2 rounded-xl text-xs font-black transition-all"
                                style={duration === d
                                  ? { background: "linear-gradient(135deg,#ef4444,#3b82f6)", color: "white" }
                                  : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                                {d}د
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Team names */}
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <p className="text-red-400 text-xs mb-1">الفريق الأحمر</p>
                            <input value={team1Name} onChange={(e) => setTeam1Name(e.target.value)}
                              className="w-full rounded-xl px-3 py-2 text-xs text-white outline-none"
                              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }} />
                          </div>
                          <div className="flex-1">
                            <p className="text-blue-400 text-xs mb-1">الفريق الأزرق</p>
                            <input value={team2Name} onChange={(e) => setTeam2Name(e.target.value)}
                              className="w-full rounded-xl px-3 py-2 text-xs text-white outline-none"
                              style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)" }} />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button onClick={() => setShowStart(false)}
                            className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                            إلغاء
                          </button>
                          <button onClick={handleStart} disabled={loading}
                            className="flex-1 py-2.5 rounded-xl text-xs font-black active:scale-95 transition-transform"
                            style={{ background: "linear-gradient(135deg,#ef4444,#3b82f6)", color: "white" }}>
                            {loading ? "جارٍ البدء..." : "🔥 ابدأ الآن"}
                          </button>
                        </div>
                      </div>
                    )}

                    {!canManage && (
                      <div className="text-center py-8">
                        <span className="text-4xl">⚔️</span>
                        <p className="text-white/50 text-sm mt-2">لا يوجد تحدي PK نشط حالياً</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Active PK */}
                {activePK && (
                  <div className="flex flex-col gap-3">
                    {/* Live battle display */}
                    <ActivePKDisplay pk={activePK} />

                    {/* Join team */}
                    <div className="flex gap-2">
                      <button onClick={() => handleJoin("team1")}
                        className="flex-1 py-2.5 rounded-xl text-xs font-black active:scale-95 transition-transform"
                        style={{
                          background: myTeam === "team1" ? "linear-gradient(135deg,#dc2626,#ef4444)" : "rgba(239,68,68,0.1)",
                          border: "1px solid rgba(239,68,68,0.4)",
                          color: myTeam === "team1" ? "white" : "#ef4444",
                          boxShadow: myTeam === "team1" ? "0 0 12px rgba(239,68,68,0.4)" : "none",
                        }}>
                        {myTeam === "team1" ? "✅ " : ""}{activePK.team1Name}
                      </button>
                      <button onClick={() => handleJoin("team2")}
                        className="flex-1 py-2.5 rounded-xl text-xs font-black active:scale-95 transition-transform"
                        style={{
                          background: myTeam === "team2" ? "linear-gradient(135deg,#2563eb,#3b82f6)" : "rgba(59,130,246,0.1)",
                          border: "1px solid rgba(59,130,246,0.4)",
                          color: myTeam === "team2" ? "white" : "#3b82f6",
                          boxShadow: myTeam === "team2" ? "0 0 12px rgba(59,130,246,0.4)" : "none",
                        }}>
                        {myTeam === "team2" ? "✅ " : ""}{activePK.team2Name}
                      </button>
                    </div>

                    {/* Contributors */}
                    <div className="grid grid-cols-2 gap-2">
                      <ContribList title={activePK.team1Name} color="#ef4444" contribs={team1Contribs} />
                      <ContribList title={activePK.team2Name} color="#3b82f6" contribs={team2Contribs} />
                    </div>

                    {/* Members */}
                    {(team1Members.length > 0 || team2Members.length > 0) && (
                      <div className="grid grid-cols-2 gap-2">
                        <MemberList title={activePK.team1Name} color="#ef4444" members={team1Members} />
                        <MemberList title={activePK.team2Name} color="#3b82f6" members={team2Members} />
                      </div>
                    )}

                    {/* End early */}
                    {canManage && (
                      <button onClick={handleEnd} disabled={loading}
                        className="w-full py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform"
                        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
                        ⏹ إنهاء التحدي مبكراً
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {tab === "history" && (
              <div className="flex flex-col gap-2">
                {!history || history.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-3xl">📜</span>
                    <p className="text-white/40 text-sm mt-2">لا يوجد سجل بعد</p>
                  </div>
                ) : (
                  history.map((pk: any) => <PKResultCard key={pk._id} pk={pk} />)
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivePKDisplay({ pk }: { pk: any }) {
  const [now, setNow] = useState(() => Date.now());
  useState(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  });

  const timeLeft = Math.max(0, new Date(pk.ends_at).getTime() - now);
  const mins = Math.floor(timeLeft / 60000);
  const secs = Math.floor((timeLeft % 60000) / 1000);
  const total = (pk.team1_coins ?? 0) + (pk.team2_coins ?? 0);
  const t1Pct = total > 0 ? ((pk.team1_coins ?? 0) / total) * 100 : 50;
  const t2Pct = 100 - t1Pct;

  return (
    <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(251,146,60,0.2)" }}>
      {pk.is_fever_time && (
        <div className="text-center text-[10px] font-black py-1 rounded-xl mb-2"
          style={{ background: "linear-gradient(90deg,#ef4444,#f97316,#fbbf24)", color: "#000" }}>
          🔥 FEVER TIME × 2
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/60 text-xs">⚔️ معركة نشطة</span>
        <span className="font-black text-sm tabular-nums" style={{ color: timeLeft < 60000 ? "#ef4444" : "#fb923c" }}>
          ⏱ {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </span>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 text-center">
          <p className="text-[10px] font-black truncate" style={{ color: "#ef4444" }}>{pk.team1_name}</p>
          <p className="text-lg font-black" style={{ color: "#ef4444" }}>{formatNumber(pk.team1_coins ?? 0)}</p>
          <p className="text-[9px] text-white/40">🎁 عملة</p>
        </div>
        <div className="text-center">
          <span className="text-2xl">⚔️</span>
          <p className="text-xs font-black" style={{ color: "#fbbf24" }}>VS</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-[10px] font-black truncate" style={{ color: "#3b82f6" }}>{pk.team2Name}</p>
          <p className="text-lg font-black" style={{ color: "#3b82f6" }}>{formatNumber(pk.team2Coins ?? 0)}</p>
          <p className="text-[9px] text-white/40">🎁 عملة</p>
        </div>
      </div>
      <div className="h-3 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full transition-all duration-700" style={{ width: `${t1Pct}%`, background: "linear-gradient(90deg,#dc2626,#ef4444)" }} />
        <div className="h-full transition-all duration-700" style={{ width: `${t2Pct}%`, background: "linear-gradient(90deg,#2563eb,#3b82f6)" }} />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] font-black" style={{ color: "#ef4444" }}>{t1Pct.toFixed(0)}%</span>
        <span className="text-[9px] text-white/30">{formatNumber(total)} إجمالي</span>
        <span className="text-[9px] font-black" style={{ color: "#3b82f6" }}>{t2Pct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

function PKResultCard({ pk }: { pk: any }) {
  const winner = pk.winnerTeam === "team1" ? pk.team1Name : pk.winnerTeam === "team2" ? pk.team2Name : null;
  const isDraw = pk.winnerTeam === "draw";

  return (
    <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-white/40">
          {pk.finishedAt ? new Date(pk.finishedAt).toLocaleDateString("ar") : ""}
        </span>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
          style={{ background: isDraw ? "rgba(255,255,255,0.1)" : "rgba(251,191,36,0.2)", color: isDraw ? "white" : "#fbbf24" }}>
          {isDraw ? "تعادل" : `🏆 ${winner}`}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 text-center">
          <p className="text-[10px] truncate" style={{ color: "#ef4444" }}>{pk.team1Name}</p>
          <p className="text-sm font-black" style={{ color: "#ef4444" }}>{formatNumber(pk.team1Coins ?? 0)}</p>
        </div>
        <span className="text-white/30 text-xs">VS</span>
        <div className="flex-1 text-center">
          <p className="text-[10px] truncate" style={{ color: "#3b82f6" }}>{pk.team2Name}</p>
          <p className="text-sm font-black" style={{ color: "#3b82f6" }}>{formatNumber(pk.team2Coins ?? 0)}</p>
        </div>
      </div>
    </div>
  );
}

function ContribList({ title, color, contribs }: { title: string; color: string; contribs: any[] }) {
  return (
    <div className="rounded-xl p-2.5" style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
      <p className="text-[10px] font-black mb-2 truncate" style={{ color }}>{title}</p>
      {contribs.length === 0 ? (
        <p className="text-[9px] text-white/30 text-center py-2">لا توجد مساهمات</p>
      ) : (
        contribs.slice(0, 5).map((c: any, i: number) => (
          <div key={c._id} className="flex items-center justify-between py-0.5">
            <span className="text-[9px] text-white/60 truncate max-w-[70px]">{i + 1}. {c.userName}</span>
            <span className="text-[9px] font-black" style={{ color }}>{formatNumber(c.coins)}</span>
          </div>
        ))
      )}
    </div>
  );
}

function MemberList({ title, color, members }: { title: string; color: string; members: any[] }) {
  return (
    <div className="rounded-xl p-2.5" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
      <p className="text-[10px] font-black mb-2 truncate" style={{ color }}>{title} ({members.length})</p>
      <div className="flex flex-wrap gap-1">
        {members.slice(0, 8).map((m: any) => (
          <div key={m._id} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
            style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
            {m.userAvatarUrl
              ? <img src={m.userAvatarUrl} alt="" className="w-3 h-3 rounded-full object-cover" />
              : <div className="w-3 h-3 rounded-full flex items-center justify-center text-[6px] text-white" style={{ background: color }}>{m.userName?.[0]}</div>
            }
            <span className="text-[8px] text-white/70 truncate max-w-[40px]">{m.userName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
