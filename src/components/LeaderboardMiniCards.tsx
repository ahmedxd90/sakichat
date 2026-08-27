// @ts-nocheck
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

interface Props {
  onGoWealth: () => void;
  onGoCharisma: () => void;
  onGoRooms: () => void;
  onGoCp: () => void;
}

const CARDS = [
  {
    key: "wealth",
    label: "الثروة",
    bg: "linear-gradient(-45deg,#2c1f01,#8b6b10,#d4af37,#2c1f01)",
  },
  {
    key: "charisma",
    label: "الكاريزما",
    bg: "linear-gradient(-45deg,#1a012c,#5e108b,#a020f0,#1a012c)",
  },
  {
    key: "rooms",
    label: "الغرف",
    bg: "linear-gradient(-45deg,#2c0101,#8b1010,#ff3c3c,#2c0101)",
  },
  {
    key: "cp",
    label: "CP 💕",
    bg: "linear-gradient(-45deg,#01162c,#104e8b,#3ca0ff,#01162c)",
  },
];

const BORDERS = ["2px solid #c0c0c0", "2px solid #ffd700", "2px solid #cd7f32"];
const SHADOWS = ["none", "0 0 10px rgba(255,215,0,0.8)", "none"];
const SIZES = [34, 46, 34];
// display order: rank2(idx1), rank1(idx0), rank3(idx2)
const ORDER = [1, 0, 2];

function MiniCard({
  label, bg, top3, getImg, getName, onClick,
}: {
  label: string; bg: string; top3: any[];
  getImg: (u: any) => string | undefined;
  getName: (u: any) => string;
  onClick: () => void;
}) {
  const ordered = ORDER.map((i) => top3[i] ?? null);

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 active:scale-95 transition-transform"
      style={{
        width: 132, height: 112, borderRadius: 15,
        position: "relative", display: "flex", flexDirection: "column",
        justifyContent: "flex-end", alignItems: "center", paddingBottom: 9,
        border: "1px solid rgba(255,255,255,0.13)", overflow: "hidden",
        background: bg, backgroundSize: "300% 300%",
        animation: "lbshine 6s ease infinite",
        boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
      }}
    >
      {/* Label strip */}
      <div style={{
        position: "absolute", top: 0, left: "8%", right: "8%", height: 23,
        background: "rgba(255,255,255,0.2)", backdropFilter: "blur(6px)",
        borderBottomLeftRadius: 11, borderBottomRightRadius: 11,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 11, fontWeight: 900,
        boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
        letterSpacing: 0.3,
      }}>
        {label}
      </div>

      {/* Avatars row */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 5 }}>
        {ordered.map((user, pos) => {
          const isCenter = pos === 1;
          const imgSrc = user ? getImg(user) : null;
          const name = user ? getName(user) : "?";
          return (
            <div
              key={pos}
              style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              {isCenter && (
                <span style={{
                  position: "absolute", top: -14, fontSize: 14, lineHeight: 1,
                  filter: "drop-shadow(0 0 4px rgba(255,215,0,0.9))",
                }}>
                  👑
                </span>
              )}
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt=""
                  style={{
                    width: SIZES[pos], height: SIZES[pos], borderRadius: "50%",
                    objectFit: "cover", border: BORDERS[pos],
                    boxShadow: SHADOWS[pos], background: "#111",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div style={{
                  width: SIZES[pos], height: SIZES[pos], borderRadius: "50%",
                  background: "rgba(255,255,255,0.18)", border: BORDERS[pos],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: isCenter ? 15 : 12, color: "#fff", fontWeight: 900,
                  boxShadow: SHADOWS[pos],
                }}>
                  {name[0] ?? "?"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </button>
  );
}

export default function LeaderboardMiniCards({ onGoWealth, onGoCharisma, onGoRooms, onGoCp }: Props) {
  const [wealth, setWealth] = useState<any[]>([]);
  const [charisma, setCharisma] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [cp, setCp] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: w } = await supabase.from('profiles').select('*').order('gold_coins', { ascending: false }).limit(3);
      setWealth(w || []);
      const { data: c } = await supabase.from('profiles').select('*').order('charisma', { ascending: false }).limit(3);
      setCharisma(c || []);
      const { data: r } = await supabase.from('rooms').select('*').order('popularity', { ascending: false }).limit(3);
      setRooms(r || []);
      const { data: p } = await supabase.from('couples').select('*').order('points', { ascending: false }).limit(3);
      setCp(p || []);
    };
    fetchData();
  }, []);

  const wTop3 = wealth.slice(0, 3);
  const cTop3 = charisma.slice(0, 3);
  const rTop3 = rooms.slice(0, 3);
  const cpTop3 = cp.slice(0, 3);

  return (
    <div className="px-4 mt-2 mb-1">
      <div
        className="flex gap-2.5 overflow-x-auto"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        <MiniCard
          label={CARDS[0].label} bg={CARDS[0].bg} top3={wTop3}
          getImg={(u) => u?.avatar_url}
          getName={(u) => u?.name ?? "?"}
          onClick={onGoWealth}
        />
        <MiniCard
          label={CARDS[1].label} bg={CARDS[1].bg} top3={cTop3}
          getImg={(u) => u?.avatar_url}
          getName={(u) => u?.name ?? "?"}
          onClick={onGoCharisma}
        />
        <MiniCard
          label={CARDS[2].label} bg={CARDS[2].bg} top3={rTop3}
          getImg={(u) => u?.cover_url}
          getName={(u) => u?.name ?? "?"}
          onClick={onGoRooms}
        />
        <MiniCard
          label={CARDS[3].label} bg={CARDS[3].bg} top3={cpTop3}
          getImg={(u) => u?.user1_avatar_url ?? u?.user2_avatar_url}
          getName={(u) => u?.user1_name ?? u?.user2_name ?? "?"}
          onClick={onGoCp}
        />
      </div>
      <style>{`
        @keyframes lbshine {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
