// @ts-nocheck
import { useState } from "react";
import GreedyCatGame from "../pages/GreedyCatGame";
import FruitPartyGame from "../pages/FruitPartyGame";

interface RoomActivitiesSheetProps {
  onClose: () => void;
}

function GIcon({ id, size = 28 }: { id: string; size?: number }) {
  const s = size;
  if (id === "saki-party") return (
    <svg viewBox="0 0 24 24" fill="none" width={s} height={s}>
      <path d="M4 8.5h16v9.2A2.3 2.3 0 0 1 17.7 20H6.3A2.3 2.3 0 0 1 4 17.7V8.5Z" fill="#7c3aed" stroke="#f3d46f" strokeWidth="1.2"/>
      <path d="M7 8.5V6.8a5 5 0 0 1 10 0v1.7" stroke="#f3d46f" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="9" cy="13" r="1.4" fill="#fbbf24"/><circle cx="15" cy="13" r="1.4" fill="#fbbf24"/>
      <path d="M8 16h8" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
  if (id === "greedy-cat") return (
    <svg viewBox="0 0 24 24" fill="none" width={s} height={s}>
      <path d="M5 11c0-3.9 3.1-7 7-7s7 3.1 7 7v3c0 2.2-1.8 4-4 4H9c-2.2 0-4-1.8-4-4v-3z" fill="#ff6b35" opacity="0.9"/>
      <path d="M5 11L3 8l3.5 1.5" fill="#ef4444"/>
      <path d="M19 11l2-3-3.5 1.5" fill="#ef4444"/>
      <circle cx="9.5" cy="12" r="1" fill="white"/>
      <circle cx="14.5" cy="12" r="1" fill="white"/>
      <path d="M10 15c.5.5 1 .8 2 .8s1.5-.3 2-.8" stroke="white" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );
  return null;
}

const GAMES = [
  {
    id: "saki-party",
    nameAr: "حفلة ساكي",
    gradient: "linear-gradient(135deg,#6d28d9,#3b0764)",
    glow: "rgba(168,85,247,0.55)",
    border: "rgba(243,212,111,0.65)",
    badge: "رهان",
    available: true,
  },
  {
    id: "greedy-cat",
    nameAr: "القط الشجع",
    gradient: "linear-gradient(135deg,#ff6b35,#ef4444)",
    glow: "rgba(255,107,53,0.5)",
    border: "rgba(255,107,53,0.4)",
    badge: "العب",
    available: true,
  },
];

export default function RoomActivitiesSheet({ onClose }: RoomActivitiesSheetProps) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  if (selectedGame) {
    return (
      <GamePanel
        gameId={selectedGame}
        onClose={() => setSelectedGame(null)}
      />
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[80] flex flex-col justify-end"
        onClick={onClose}
        dir="rtl"
      >
        <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
        <div
          className="relative rounded-t-3xl border-t border-white/10 flex flex-col"
          style={{
            background: "linear-gradient(180deg,#0d0d1f 0%,#080812 100%)",
            maxHeight: "60vh",
            animation: "ra-slide-up 0.35s cubic-bezier(0.32,0.72,0,1) forwards",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1.5 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-2.5 flex-shrink-0">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                <rect x="2" y="6" width="20" height="12" rx="3" fill="#7c3aed" opacity="0.8"/>
                <circle cx="7" cy="12" r="2" fill="white" opacity="0.7"/>
                <circle cx="17" cy="12" r="2" fill="white" opacity="0.7"/>
                <rect x="11" y="10" width="2" height="4" rx="1" fill="white" opacity="0.5"/>
                <rect x="9" y="12" width="6" height="2" rx="1" fill="white" opacity="0.5"/>
              </svg>
              <div>
                <h2 className="text-white font-black text-base leading-none">الأنشطة</h2>
                <p className="text-gray-500 text-[10px] mt-0.5">العاب ومسابقات</p>
              </div>
            </div>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)" }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-[10px] font-black">مباشر</span>
            </div>
          </div>

          {/* Games Grid */}
          <div className="flex-1 overflow-y-auto px-4 pb-3">
            <div className="flex justify-center">
              {GAMES.map((game) => (
                <button
                  key={game.id}
                  onClick={() => game.available && setSelectedGame(game.id)}
                  className="relative rounded-2xl overflow-hidden active:scale-95 transition-all flex flex-col items-center"
                  style={{
                    background: game.gradient,
                    boxShadow: `0 4px 24px ${game.glow}`,
                    border: `1px solid ${game.border}`,
                    width: "100px",
                    aspectRatio: "1/1.1",
                  }}
                >
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.12) 50%,transparent 70%)",
                      animation: "ra-shimmer 3s ease-in-out infinite",
                    }}
                  />
                  <div className="relative z-10 flex flex-col items-center justify-center h-full gap-1 p-2">
                    <GIcon id={game.id} size={32} />
                    <span className="text-white font-black text-[10px] text-center leading-tight">{game.nameAr}</span>
                    <div
                      className="px-1.5 py-0.5 rounded-full text-[8px] font-black mt-0.5"
                      style={{
                        background: "rgba(0,0,0,0.35)",
                        color: "#fff",
                        border: `1px solid ${game.border}`,
                      }}
                    >
                      {game.badge}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Close */}
          <div className="px-4 pb-4 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 font-medium text-sm active:scale-95 transition-transform"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ra-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes ra-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
      `}</style>
    </>
  );
}

// ── Game Panel ────────────────────────────────────────────────────────────────
function GamePanel({ gameId, onClose }: { gameId: string; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-[200] flex flex-col justify-end" dir="rtl">
        <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
        <div
          className="relative rounded-t-3xl border-t border-white/10 flex flex-col"
          style={{
            height: "88vh",
            background: "linear-gradient(180deg,#06060f 0%,#0a0a1a 100%)",
            animation: "ra-game-up 0.3s cubic-bezier(0.32,0.72,0,1) forwards",
            zIndex: 1,
            overflow: "hidden",
            willChange: "transform",
          }}
        >
          {/* Top bar */}
          <div className="flex items-center px-4 py-2 flex-shrink-0 border-b border-white/5">
            <div className="flex-1 flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-white/20" />
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Game content */}
          <div
            className="flex-1 overflow-hidden relative"
            style={{ isolation: "isolate" }}
          >
            {gameId === "saki-party" && <FruitPartyGame onBack={onClose} />}
            {gameId === "greedy-cat" && <GreedyCatGame onBack={onClose} />}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ra-game-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </>
  );
}
