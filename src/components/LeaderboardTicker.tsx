// تصميم Saki: شريط متصدرين ملكي مستوحى من المرجع، بتدرجات متحركة، صور حقيقية من Supabase، وبدون بيانات تجريبية.
// يعرض الشريط أسفل الإذاعة بشكل غير ثابت، وتفتح البطاقات صفحة لوحة المتصدرين عند الضغط.
// يحترم prefers-reduced-motion عبر CSS.
// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const MODES = [
  { key: "wealth", label: "ترتيب الثروة", icon: "▣", className: "wealth" },
  { key: "charisma", label: "ترتيب الكاريزما", icon: "✦", className: "charisma" },
  { key: "rooms", label: "ترتيب الغرف", icon: "⌂", className: "rooms" },
] as const;

function Avatar({ src, name, rank }: { src?: string; name?: string; rank: number }) {
  const initials = (name ?? "؟").trim().slice(0, 1);
  return (
    <div className={`leader-avatar leader-avatar-${rank}`}>
      {src ? <img src={src} alt={name ?? ""} /> : <span>{initials}</span>}
      <b>{rank}</b>
    </div>
  );
}

export default function LeaderboardTicker({ onOpen, onUserSelect, onRoomSelect }: { onOpen: () => void; onUserSelect: (id: any) => void; onRoomSelect: (id: any) => void }) {
  const [modeIndex, setModeIndex] = useState(0);
  const [wealth, setWealth] = useState<any[]>([]);
  const [charisma, setCharisma] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: wealthData } = await supabase.from('profiles').select('user_id, name, avatar_url, gold_coins').order('gold_coins', { ascending: false }).limit(3);
      setWealth(wealthData?.map(d => ({ userId: d.user_id, name: d.name, avatarUrl: d.avatar_url, total: d.gold_coins })) || []);
      
      const { data: charismaData } = await supabase.from('profiles').select('user_id, name, avatar_url, charisma_level').order('charisma_level', { ascending: false }).limit(3);
      setCharisma(charismaData?.map(d => ({ userId: d.user_id, name: d.name, avatarUrl: d.avatar_url, total: d.charisma_level })) || []);

      const { data: roomsData } = await supabase.from('rooms').select('id, name, cover_url').limit(3);
      setRooms(roomsData?.map(d => ({ roomId: d.id, name: d.name, coverUrl: d.cover_url, total: 0 })) || []);
      setLoading(false);
    };
    fetchData();
    const timer = window.setInterval(() => setModeIndex((value) => (value + 1) % MODES.length), 10000);
    return () => window.clearInterval(timer);
  }, []);

  const mode = MODES[modeIndex];
  const rows = mode.key === "wealth" ? wealth : mode.key === "charisma" ? charisma : rooms;
  const top = useMemo(() => rows.slice(0, 3), [rows]);

  const activate = (item: any) => {
    if (mode.key === "rooms" && item?.roomId) onRoomSelect(item.roomId);
    else if (item?.userId) onUserSelect(item.userId);
  };

  return (
    <section className={`leaderboard-ticker leaderboard-ticker-${mode.className}`} aria-label="تحديث جديد للمتصدرين">
      <style>{`
        .leaderboard-ticker { position:relative; margin:0 16px 14px; overflow:hidden; border-radius:18px; color:#fff; background-size:300% 300%; animation:leaderGradient 7s ease infinite; box-shadow:0 8px 22px rgba(15,23,42,.18), inset 0 1px 5px rgba(255,255,255,.25); border:1px solid rgba(255,255,255,.2); }
        .leaderboard-ticker::after { content:""; position:absolute; inset:-80% -35%; pointer-events:none; background:linear-gradient(60deg,transparent 38%,rgba(255,255,255,.22) 50%,transparent 62%); animation:leaderShimmer 4s linear infinite; }
        .leaderboard-ticker-wealth { background-image:linear-gradient(125deg,#7f1d1d,#dc2626,#b45309,#dc2626,#7f1d1d); }
        .leaderboard-ticker-charisma { background-image:linear-gradient(125deg,#831843,#be123c,#c026d3,#e11d48,#831843); }
        .leaderboard-ticker-rooms { background-image:linear-gradient(125deg,#1e1b4b,#991b1b,#0891b2,#dc2626,#1e1b4b); }
        .leaderboard-ticker-head { position:relative; z-index:1; display:flex; align-items:center; justify-content:space-between; gap:8px; padding:9px 12px 2px; }
        .leaderboard-ticker-title { display:flex; align-items:center; gap:7px; font-size:11px; font-weight:900; }
        .leaderboard-ticker-icon { display:flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:50%; color:#fde68a; background:rgba(0,0,0,.3); border:1px solid rgba(255,255,255,.25); font-size:18px; }
        .leaderboard-ticker-link { border:0; color:#fef3c7; background:rgba(0,0,0,.25); border-radius:999px; padding:5px 9px; font:900 9px Cairo,sans-serif; }
        .leaderboard-ticker-body { position:relative; z-index:1; display:flex; align-items:flex-start; justify-content:center; gap:18px; padding:4px 12px 11px; min-height:79px; }
        .leaderboard-ticker-card { border:0; background:transparent; color:#fff; display:flex; flex-direction:column; align-items:center; min-width:65px; padding:0; font-family:Cairo,sans-serif; }
        .leaderboard-ticker-card:active { transform:scale(.94); }
        .leader-avatar { position:relative; display:flex; align-items:center; justify-content:center; width:38px; height:38px; border-radius:50%; overflow:visible; border:2px solid #e2e8f0; background:rgba(15,23,42,.55); box-shadow:0 0 9px rgba(226,232,240,.55); }
        .leader-avatar img { width:100%; height:100%; object-fit:cover; border-radius:50%; display:block; }
        .leader-avatar span { font-size:16px; font-weight:900; color:#fff; }
        .leader-avatar-1 { width:46px; height:46px; border-color:#fbbf24; box-shadow:0 0 14px rgba(251,191,36,.9); transform:translateY(-3px); }
        .leader-avatar-3 { border-color:#d97706; box-shadow:0 0 9px rgba(217,119,6,.75); }
        .leader-avatar b { position:absolute; right:-3px; bottom:-3px; display:flex; align-items:center; justify-content:center; width:16px; height:16px; border-radius:50%; color:#111827; background:linear-gradient(135deg,#fff7a8,#d97706); border:1px solid #111827; font-size:9px; }
        .leader-avatar-2 b { background:linear-gradient(135deg,#fff,#94a3b8); }
        .leader-avatar-3 b { color:#fff; background:linear-gradient(135deg,#fcd34d,#78350f); }
        .leader-name { max-width:83px; margin-top:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:10px; font-weight:800; }
        .leader-value { max-width:90px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#fde68a; font-size:8px; font-weight:700; }
        .leader-empty { position:relative; z-index:1; padding:18px; text-align:center; color:rgba(255,255,255,.78); font-size:10px; font-weight:800; }
        @keyframes leaderGradient { 0%,100%{background-position:0% 50%}50%{background-position:100% 50%} }
        @keyframes leaderShimmer { 0%{transform:translateX(-35%) rotate(30deg)}100%{transform:translateX(35%) rotate(30deg)} }
        @media (prefers-reduced-motion:reduce) { .leaderboard-ticker,.leaderboard-ticker::after{animation:none} }
      `}</style>
      <div className="leaderboard-ticker-head">
        <div className="leaderboard-ticker-title"><span className="leaderboard-ticker-icon">{mode.icon}</span><span>{mode.label}</span></div>
        <button type="button" className="leaderboard-ticker-link" onClick={onOpen}>عرض الكل</button>
      </div>
      {loading ? <div className="leader-empty">جارٍ تحميل الترتيب الحقيقي...</div> : top.length === 0 ? <div className="leader-empty">لا توجد نتائج متاحة حاليًا</div> : (
        <div className="leaderboard-ticker-body">
          {top.map((item: any, index: number) => {
            const rank = index + 1;
            const name = mode.key === "rooms" ? item.name : item.name;
            const image = mode.key === "rooms" ? item.coverUrl : item.avatarUrl;
            const value = item.total != null ? `${Number(item.total).toLocaleString("ar-EG")} ذهبية` : "";
            return <button key={`${mode.key}-${item.userId ?? item.roomId ?? rank}`} type="button" className="leaderboard-ticker-card" onClick={() => activate(item)} aria-label={`${name} المركز ${rank}`}><Avatar src={image} name={name} rank={rank} /><span className="leader-name">{name || "مجهول"}</span><span className="leader-value">{value}</span></button>;
          })}
        </div>
      )}
    </section>
  );
}
