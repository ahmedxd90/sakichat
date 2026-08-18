// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { formatNumber } from "../../lib/formatNumber";

interface PKResultsOverlayProps {
  pkId: Id<"pkBattles">;
  roomId: Id<"rooms">;
  onClose: () => void;
}

function FireworkBurst({ x, y }: { x: number; y: number }) {
  const colors = ["#fbbf24", "#f97316", "#ef4444", "#a855f7", "#3b82f6", "#22c55e"];
  return (
    <>
      {Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * 360;
        const dist = 20 + Math.random() * 40;
        const tx = Math.cos((angle * Math.PI) / 180) * dist;
        const ty = Math.sin((angle * Math.PI) / 180) * dist;
        return (
          <div key={i} className="absolute w-2 h-2 rounded-full pointer-events-none"
            style={{
              left: x, top: y, background: colors[i % colors.length],
              "--tx": `${tx}px`, "--ty": `${ty}px`,
              animation: `pk-firework ${0.5 + Math.random() * 0.5}s ease-out forwards`,
            } as any} />
        );
      })}
    </>
  );
}

function TrophySVG({ color, size = 40 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <path d="M6 9H4.5a2.5 2.5 0 010-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 000-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0012 0V2z"/>
    </svg>
  );
}

function GiftSVG({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <polyline points="20 12 20 22 4 22 4 12"/>
      <rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
    </svg>
  );
}

function MedalSVG({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="15" r="6"/>
      <path d="M8.56 2.9A7 7 0 0 1 16 2.9"/>
      <path d="M8.56 2.9L6 8"/>
      <path d="M16 2.9L18 8"/>
    </svg>
  );
}

export default function PKResultsOverlay({ pkId, roomId, onClose }: PKResultsOverlayProps) {
  const pk = useQuery(api.pk.getPKBattle, { pkId });
  const room1Contribs = useQuery(api.pk.getPKContributors, { pkId, roomId: pk?.room1Id ?? roomId });
  const room2Contribs = useQuery(api.pk.getPKContributors, { pkId, roomId: pk?.room2Id ?? roomId });
  const [fireworks, setFireworks] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const fwRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"room1" | "room2">("room1");

  useEffect(() => {
    const colors = ["#fbbf24", "#f97316", "#ef4444", "#a855f7", "#3b82f6", "#22c55e"];
    const t = setInterval(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = rect.width * (0.1 + Math.random() * 0.8);
      const y = rect.height * (0.1 + Math.random() * 0.5);
      const id = ++fwRef.current;
      setFireworks((prev) => [...prev.slice(-10), { id, x, y }]);
      setTimeout(() => setFireworks((prev) => prev.filter((f) => f.id !== id)), 1000);
    }, 600);
    return () => clearInterval(t);
  }, []);

  if (!pk) return null;

  const isRoom1Winner = pk.winnerId === pk.room1Id;
  const isRoom2Winner = pk.winnerId === pk.room2Id;
  const isDraw = !pk.winnerId;
  const isMyRoom1 = pk.room1Id === roomId;
  const myRoomWon = isMyRoom1 ? isRoom1Winner : isRoom2Winner;

  const blueColor = "#3b82f6";
  const redColor = "#ef4444";

  const displayContribs = tab === "room1" ? (room1Contribs ?? []) : (room2Contribs ?? []);
  const tabColor = tab === "room1" ? blueColor : redColor;
  const tabName = tab === "room1" ? pk.room1Name : pk.room2Name;
  const tabTeam = tab === "room1" ? "🐯 النمور" : "🦁 الأسود";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.88)" }}>
      <div ref={containerRef}
        className="relative w-full max-w-sm mx-4 rounded-3xl overflow-hidden animate-pk-results"
        style={{
          background: "linear-gradient(180deg, #050015 0%, #0a0005 50%, #050015 100%)",
          border: "1px solid rgba(249,115,22,0.4)",
          boxShadow: "0 0 60px rgba(249,115,22,0.2)",
          maxHeight: "85vh",
        }}>
        {fireworks.map((fw) => <FireworkBurst key={fw.id} x={fw.x} y={fw.y} />)}

        <div className="relative z-10 overflow-y-auto" style={{ maxHeight: "85vh" }}>
          {/* Header */}
          <div className="text-center pt-6 pb-4 px-4">
            <div className="flex justify-center mb-3">
              {isDraw
                ? <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                : myRoomWon
                  ? <TrophySVG color="#fbbf24" size={48} />
                  : <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              }
            </div>
            <h2 className="text-white font-black text-xl mb-1">
              {isDraw ? "تعادل!" : myRoomWon ? "فزت! 🎉" : "انتهت المعركة"}
            </h2>
            <p className="text-gray-400 text-sm">
              {isDraw ? "تعادلت الغرفتان" : `الفائز: ${isRoom1Winner ? pk.room1Name : pk.room2Name}`}
            </p>
          </div>

          {/* Score */}
          <div className="mx-4 mb-4 rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-xs font-black truncate" style={{ color: blueColor }}>{pk.room1Name}</p>
                <p className="text-[9px] mb-1" style={{ color: blueColor }}>🐯 النمور</p>
                <div className="flex items-center justify-center gap-1">
                  <GiftSVG color="#fbbf24" size={11} />
                  <p className="text-yellow-400 font-black text-lg">{formatNumber(pk.room1Coins ?? 0)}</p>
                </div>
                {isRoom1Winner && (
                  <div className="flex justify-center mt-1">
                    <TrophySVG color="#fbbf24" size={18} />
                  </div>
                )}
              </div>
              <div className="text-orange-400 font-black text-xl px-2">VS</div>
              <div className="text-center flex-1">
                <p className="text-xs font-black truncate" style={{ color: redColor }}>{pk.room2Name}</p>
                <p className="text-[9px] mb-1" style={{ color: redColor }}>🦁 الأسود</p>
                <div className="flex items-center justify-center gap-1">
                  <GiftSVG color="#fbbf24" size={11} />
                  <p className="text-yellow-400 font-black text-lg">{formatNumber(pk.room2Coins ?? 0)}</p>
                </div>
                {isRoom2Winner && (
                  <div className="flex justify-center mt-1">
                    <TrophySVG color="#fbbf24" size={18} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tab selector */}
          <div className="flex gap-2 mx-4 mb-3">
            <button onClick={() => setTab("room1")}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={tab === "room1"
                ? { background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.5)", color: blueColor }
                : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#6b7280" }}>
              🐯 {pk.room1Name}
            </button>
            <button onClick={() => setTab("room2")}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={tab === "room2"
                ? { background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.5)", color: redColor }
                : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#6b7280" }}>
              🦁 {pk.room2Name}
            </button>
          </div>

          {/* Contributors list */}
          <div className="mx-4 mb-4 rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="px-3 py-2 border-b flex items-center gap-2"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <MedalSVG color={tabColor} size={12} />
              <p className="text-xs font-bold" style={{ color: tabColor }}>
                {tabTeam} — {tabName} — أكثر مرسلي الهدايا
              </p>
            </div>
            {displayContribs.length === 0 ? (
              <div className="py-6 text-center">
                <GiftSVG color="#4b5563" size={24} />
                <p className="text-gray-500 text-xs mt-2">لا توجد هدايا مرسلة</p>
              </div>
            ) : (
              displayContribs.slice(0, 10).map((c, i) => (
                <div key={c._id} className="flex items-center gap-3 px-3 py-2 border-b last:border-0"
                  style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{
                      background: i === 0 ? "linear-gradient(135deg,#fbbf24,#f59e0b)"
                        : i === 1 ? "linear-gradient(135deg,#9ca3af,#6b7280)"
                        : i === 2 ? "linear-gradient(135deg,#cd7c2f,#b45309)"
                        : "rgba(255,255,255,0.1)",
                      color: i < 3 ? "#000" : "#9ca3af",
                    }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold truncate">{c.userName ?? "مجهول"}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <GiftSVG color="#fbbf24" size={10} />
                    <span className="text-yellow-400 text-xs font-black">{formatNumber(c.coins)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Close button */}
          <div className="px-4 pb-6">
            <button onClick={onClose}
              className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", color: "white" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
