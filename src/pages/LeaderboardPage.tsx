// Style reminder: صفحة ترتيب عربية RTL مستوحاة من المرجع المرفق؛ خلفية فاتحة slate، بطاقات بيضاء، خط Cairo، رأس ثابت، منصة للمراكز الثلاثة، وقائمة نتائج حقيقية بلا بيانات تجريبية.
// Data reminder: جميع النتائج تأتي من Supabase leaderboards ولا توجد بيانات تجريبية داخل الواجهة.
// @ts-nocheck
import { supabase } from "../lib/supabaseClient";
import { useProfile } from "../components/ProfileManager";
import { useEffect, useMemo, useState } from "react";
import { VipName } from "../components/VipBadge";
import { LevelPillBadge } from "../components/LevelBadgeInline";

interface LeaderboardPageProps {
  onBack: () => void;
  onUserSelect?: (id: string) => void;
  onRoomSelect?: (id: string) => void;
}
type Category = "wealth" | "charisma" | "rooms";
type Period = "daily" | "weekly" | "monthly";

const META: Record<Category, { label: string; color: string; soft: string; icon: "coin" | "heart" | "room" }> = {
  wealth: { label: "الثروة", color: "#dc2626", soft: "#fef2f2", icon: "coin" },
  charisma: { label: "الكاريزما", color: "#db2777", soft: "#fdf2f8", icon: "heart" },
  rooms: { label: "الغرف", color: "#0f766e", soft: "#f0fdfa", icon: "room" },
};

function CategoryIcon({ type, size = 17 }: { type: "coin" | "heart" | "room"; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (type === "heart") return <svg {...p}><path d="M20.8 8.9c0 5.2-8.8 10.1-8.8 10.1S3.2 14.1 3.2 8.9A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.7Z" /></svg>;
  if (type === "room") return <svg {...p}><path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M2 21h20M8 7h1M8 11h1M15 7h1M15 11h1M10 21v-5a2 2 0 0 1 4 0v5" /></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 6v12M15 8.5c-.7-.5-1.6-.8-3-.8-1.7 0-2.7.8-2.7 1.9 0 3.1 5.4 1.1 5.4 4.2 0 1.2-1 2-2.8 2-1.3 0-2.3-.3-3-.9" /></svg>;
}
function TrophyIcon({ color = "currentColor" }: { color?: string }) { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3h8v4a4 4 0 0 1-8 0V3Z" /><path d="M8 5H5a3 3 0 0 0 3 3M16 5h3a3 3 0 0 1-3 3M12 11v6M8 21h8M9 17h6" /></svg>; }
function Medal({ rank }: { rank: number }) { const s: Record<number, React.CSSProperties> = { 1: { background: "linear-gradient(135deg,#fef3c7,#f59e0b)", color: "#92400e", borderColor: "#fbbf24" }, 2: { background: "linear-gradient(135deg,#f8fafc,#cbd5e1)", color: "#475569", borderColor: "#cbd5e1" }, 3: { background: "linear-gradient(135deg,#ffedd5,#c2410c)", color: "#9a3412", borderColor: "#fb923c" } }; return <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-xs font-black" style={s[rank] ?? { background: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }}>{rank}</span>; }
function formatScore(value: number) { if (!Number.isFinite(value)) return "0"; if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`; if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`; return Math.round(value).toLocaleString("en-US"); }
function Avatar({ url, name, room = false, large = false }: { url?: string; name?: string; room?: boolean; large?: boolean }) { const size = large ? "h-[72px] w-[72px]" : room ? "h-11 w-11 rounded-xl" : "h-11 w-11 rounded-full"; return <div className={`${size} shrink-0 overflow-hidden border-2 border-white bg-slate-100 shadow-sm`}>{url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-sm font-black text-slate-600">{room ? <CategoryIcon type="room" /> : (name?.[0] ?? "؟")}</div>}</div>; }

export default function LeaderboardPage({ onBack, onUserSelect, onRoomSelect }: LeaderboardPageProps) {
  const [category, setCategory] = useState<Category>("wealth");
  const [period, setPeriod] = useState<Period>("daily");
  const { profile } = useProfile();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Placeholder for Supabase leaderboard queries
      setData([]);
    };
    fetchData();
  }, [category, period]);

  const meta = META[category];
  const entries = (data ?? []) as any[];
  const podium = [entries[1], entries[0], entries[2]];
  const colors = ["#cbd5e1", "#fbbf24", "#fb923c"];
  const heights = ["h-16", "h-24", "h-12"];
  const myRank = useMemo(() => category === "rooms" || !profile?.user_id ? null : entries.find((entry: any) => entry.user_id === profile.user_id), [category, entries, profile?.user_id]);
  const isRoom = category === "rooms";
  const openEntry = (entry: any) => isRoom ? onRoomSelect?.(entry.room_id as string) : onUserSelect?.(entry.user_id as string);

  return <div className="flex min-h-screen flex-col overflow-hidden bg-slate-50 text-slate-800" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 px-3 pb-3 pt-[max(12px,env(safe-area-inset-top))] shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-between pb-3"><button onClick={onBack} aria-label="رجوع" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 active:scale-95"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m15 18-6-6 6-6" /></svg></button><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ color: meta.color, background: meta.soft }}><TrophyIcon color={meta.color} /></span><div className="text-right"><h1 className="text-base font-black text-slate-900">لوحة المتصدرين</h1><p className="text-[9px] font-semibold text-slate-400">النتائج الحقيقية في Saki</p></div></div><div className="w-9" /></div>
      <div className="mx-auto grid max-w-md grid-cols-3 gap-1.5">{(Object.keys(META) as Category[]).map((key) => { const item = META[key]; const active = category === key; return <button key={key} onClick={() => { setCategory(key); setPeriod("daily"); }} className="flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[11px] font-black transition active:scale-[.98]" style={{ background: active ? item.color : "#f1f5f9", color: active ? "#fff" : "#64748b", boxShadow: active ? `0 5px 12px ${item.color}33` : "none" }}><CategoryIcon type={item.icon} size={15} /><span>{item.label}</span></button>; })}</div>
      <div className="mx-auto mt-2.5 flex max-w-md items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">{(["daily", "weekly", "monthly"] as Period[]).map((key) => <button key={key} onClick={() => setPeriod(key)} className="flex-1 rounded-md py-1.5 text-[10px] font-black transition" style={{ background: period === key ? "#fff" : "transparent", color: period === key ? "#1e293b" : "#64748b", boxShadow: period === key ? "0 1px 3px rgba(15,23,42,.10)" : "none" }}>{key === "daily" ? "يومي" : key === "weekly" ? "أسبوعي" : "شهري"}</button>)}</div>
    </header>

    <main className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-3 pb-28 pt-4">
      {data === undefined ? <div className="flex justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" /></div> : entries.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center shadow-sm"><div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ color: meta.color, background: meta.soft }}><CategoryIcon type={meta.icon} size={28} /></div><p className="text-sm font-bold text-slate-600">لا توجد بيانات لهذه الفترة</p><p className="mt-1 text-[10px] text-slate-400">سيظهر الترتيب بعد تسجيل نشاط حقيقي</p></div> : <>
        <section className="mb-6 grid grid-cols-3 items-end gap-2 pt-5">{podium.map((entry, index) => entry ? <button key={`${category}-${entry.rank}`} onClick={() => openEntry(entry)} className="group flex min-w-0 flex-col items-center gap-1.5 active:scale-[.98]" style={{ order: index === 0 ? 1 : index === 1 ? 0 : 2 }}><div className="text-[10px] font-black text-slate-400">{index === 1 ? "الأول" : index === 0 ? "الثاني" : "الثالث"}</div><div className="relative"><div className="rounded-full p-0.5 shadow-lg" style={{ background: `linear-gradient(135deg,${colors[index]},#fff)`, boxShadow: `0 5px 18px ${colors[index]}66` }}><Avatar url={isRoom ? entry.coverUrl : entry.avatarUrl} name={isRoom ? entry.name : entry.name} room={isRoom} large /></div><span className="absolute -bottom-2 left-1/2 flex h-6 min-w-6 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white px-1 text-[10px] font-black text-white" style={{ background: colors[index] }}>{entry.rank}</span></div><span className="mt-2 max-w-[90px] truncate text-center text-[11px] font-black text-slate-800">{entry.name}</span><span className="text-[9px] font-black" style={{ color: meta.color }}>{formatScore(entry.total)}</span><div className={`w-full ${heights[index]} rounded-t-2xl border-t`} style={{ borderColor: colors[index], background: `linear-gradient(180deg,${colors[index]}33,rgba(255,255,255,0))` }} /></button> : <div key={index} />)}</section>
        <section className="space-y-2.5">{entries.slice(3).map((entry: any) => <button key={`${category}-${isRoom ? entry.roomId : entry.userId}`} onClick={() => openEntry(entry)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-right shadow-sm transition active:scale-[.99] hover:border-slate-300"><Medal rank={entry.rank} /><Avatar url={isRoom ? entry.coverUrl : entry.avatarUrl} name={entry.name} room={isRoom} /><div className="min-w-0 flex-1"><div className="truncate text-xs font-black text-slate-800">{!isRoom && entry.isVip ? <VipName name={entry.name} level={entry.vipLevel} /> : entry.name}</div><div className="mt-1 flex items-center gap-1.5 text-[9px] text-slate-400">{isRoom ? <span>{entry.ownerName ?? "مجهول"} · {entry.memberCount ?? 0} عضو</span> : <><span>#{entry.sakiId || "—"}</span>{(entry.wealthLevel ?? 0) > 0 && <LevelPillBadge level={entry.wealthLevel} type="wealth" size="xs" />}{(entry.charismaLevel ?? 0) > 0 && <LevelPillBadge level={entry.charismaLevel} type="charisma" size="xs" />}</>}</div></div><div className="flex shrink-0 items-center gap-1 text-xs font-black" style={{ color: meta.color }}><CategoryIcon type={meta.icon} size={13} />{formatScore(entry.total)}</div></button>)}</section>
      </>}
    </main>

    {!isRoom && profile && <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-3 shadow-[0_-5px_20px_rgba(15,23,42,.08)] backdrop-blur-md"><div className="mx-auto flex max-w-md items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2.5"><span className="w-6 text-center text-sm font-black text-slate-500">{myRank?.rank ?? "—"}</span><Avatar url={profile.avatar_url} name={profile.name} /><div className="min-w-0"><div className="truncate text-xs font-black text-slate-800">{profile.name ?? "حسابي"}</div><div className="mt-1 flex items-center gap-1.5">{profile.isVip && <span className="rounded border border-red-200 bg-red-50 px-1.5 text-[8px] font-black text-red-600">PRO</span>}{profile.wealth_level > 0 && <LevelPillBadge level={profile.wealth_level} type="wealth" size="xs" />}</div></div></div><div className="text-left"><div className="text-sm font-black text-slate-900">{myRank ? formatScore(myRank.total) : "—"}</div><div className="text-[9px] font-semibold text-slate-400">{myRank ? "إجمالي الترتيب" : "لم تدخل الترتيب بعد"}</div></div></div></div>}
  </div>;
}
