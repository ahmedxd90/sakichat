// @ts-nocheck
import { useState } from "react";
import { formatNumber } from "../../lib/formatNumber";

interface RoomHeaderProps {
  room: any;
  isCp: boolean;
  isMusic: boolean;
  isAstronomy: boolean;
  isDesert: boolean;
  isRadio?: boolean;
  isOwner: boolean;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  totalCoinsSpent: number;
  memberCount: number;
  members?: any[];
  activeMusicName?: string;
  onLeaveRoom: () => void;
  onBackgroundLeave?: () => void;
  onShowLeaderboard: () => void;
  onShowMembers: () => void;
  onShowRoomInfo: () => void;
  onShowSettings: () => void;
  onShowMusic?: () => void;
}

export default function RoomHeader({
  room, isCp, isMusic, isAstronomy, isDesert, isRadio = false, isOwner, isAdmin = false, isSuperAdmin = false,
  isConnected, isConnecting, totalCoinsSpent, memberCount, members = [],
  activeMusicName,
  onLeaveRoom, onBackgroundLeave, onShowLeaderboard,
  onShowMembers, onShowRoomInfo, onShowSettings, onShowMusic,
}: RoomHeaderProps) {
  const [showExitModal, setShowExitModal] = useState(false);
  const onlineMembers = (members ?? []).slice(0, 5);
  const musicColor = isCp ? "#ff85a1" : "#c084fc";

  return (
    <>
      {/* ── FLOATING HEADER BAR ── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-3 pt-3 pb-1"
        style={{ minHeight: "50px" }}
      >
        {/* LEFT: room cover + name + id */}
        <button
          onClick={onShowRoomInfo}
          className="flex items-center gap-2 active:opacity-80 transition-opacity"
          style={{
            background: "rgba(0,0,0,0.45)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "12px",
            padding: "4px 8px 4px 5px",
          }}
        >
          {/* Room cover */}
          <div
            className="w-[32px] h-[32px] rounded-[8px] overflow-hidden flex-shrink-0"
            style={{ border: "1.5px solid rgba(255,255,255,0.25)", background: "#222" }}
          >
            {room?.coverUrl ? (
              <img src={room.coverUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#5c0a1a,#1a0202)" }}>
                <span className="text-xs">🏠</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-white font-bold text-xs leading-tight">{room?.name ?? "..."}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {room?.roomNumericId && (
                <span className="text-[9px] font-mono text-white/45">ID: {room.roomNumericId}</span>
              )}
              <div className="flex items-center gap-1">
                {isConnecting
                  ? <div className="w-1.5 h-1.5 border border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  : <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-gray-500"}`} />
                }
                <span className={`text-[9px] font-bold ${isConnected ? "text-green-400" : isConnecting ? "text-yellow-400" : "text-gray-500"}`}>
                  {isConnected ? "مباشر" : isConnecting ? "جارٍ..." : "غير متصل"}
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* RIGHT: music icon + exit button */}
        <div className="flex items-center gap-2">
          {/* ── Music floating icon — circular animated, shown when music is playing ── */}
          {activeMusicName && (
            <button
              onClick={onShowMusic}
              className="flex items-center justify-center active:scale-90 transition-transform"
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(0,0,0,0.45)",
                border: `1.5px solid ${musicColor}66`,
              }}
              title={activeMusicName}
            >
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: `radial-gradient(circle, ${musicColor}33 0%, ${musicColor}11 100%)`,
                border: `1.5px solid ${musicColor}88`,
                display: "flex", alignItems: "center", justifyContent: "center",
                animation: "musicDiscSpin 3s linear infinite",
              }}>
                <div style={{ display: "flex", gap: "1.5px", alignItems: "flex-end", height: 9 }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{
                      width: 2, borderRadius: 2, background: musicColor,
                      height: `${3 + i * 2}px`,
                      animation: `musicWaveH${i} ${0.4 + i * 0.15}s ease-in-out infinite alternate`,
                    }} />
                  ))}
                </div>
              </div>
            </button>
          )}

          {/* Exit button */}
          <button
            onClick={() => setShowExitModal(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(244,67,54,0.4)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f44336" strokeWidth="2.2">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── SECOND ROW: Trophy (left) + Members strip (right) ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 pb-1">

        {/* LEFT: Trophy */}
        <button
          onClick={onShowLeaderboard}
          className="flex items-center gap-1 active:opacity-70 px-2 py-1 rounded-xl"
          style={{
            background: "rgba(0,0,0,0.28)",
            border: "1px solid rgba(255,215,0,0.25)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <span className="text-[14px]">🏆</span>
          <span className="text-yellow-300 text-[10px] font-bold">{formatNumber(totalCoinsSpent)}</span>
        </button>

        {/* RIGHT: Members strip */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl"
          style={{
            background: "rgba(0,0,0,0.22)",
            border: "1px solid rgba(255,255,255,0.07)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
              {onlineMembers.map((m: any, idx: number) => (
            <div
              key={m.id ?? idx}
              className="w-[20px] h-[20px] rounded-full overflow-hidden flex-shrink-0"
              style={{ border: "1.5px solid rgba(255,255,255,0.18)", background: "#333" }}
            >
              {m.profile?.avatarUrl
                ? <img src={m.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-[7px] text-white/50">{(m.profile?.name ?? "?")[0]}</div>
              }
            </div>
          ))}

          {onlineMembers.length > 0 && <div className="w-px h-3.5 bg-white/10" />}

          <button onClick={onShowMembers} className="flex items-center gap-1 active:opacity-70">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
            <span className="text-[10px] text-white/55 font-semibold">{memberCount}</span>
          </button>
        </div>
      </div>

      {/* ── EXIT MODAL ── */}
      {showExitModal && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }}
          onClick={() => setShowExitModal(false)}
        >
          <div className="flex gap-7" onClick={(e) => e.stopPropagation()}>
            {/* Share */}
            <button
              onClick={() => setShowExitModal(false)}
              className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2196f3" strokeWidth="2.2">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </div>
              <span className="text-white text-xs font-semibold">مشاركة</span>
            </button>

            {/* Background */}
            <button
              onClick={() => { setShowExitModal(false); onBackgroundLeave?.(); }}
              className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#757575" strokeWidth="2.2">
                  <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
                </svg>
              </div>
              <span className="text-white text-xs font-semibold">احتفظ</span>
            </button>

            {/* Settings — owner only */}
            {isOwner && (
              <button
                onClick={() => { setShowExitModal(false); onShowSettings(); }}
                className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9c27b0" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                  </svg>
                </div>
                <span className="text-white text-xs font-semibold">إعدادات</span>
              </button>
            )}

            {/* Leave */}
            <button
              onClick={() => { setShowExitModal(false); onLeaveRoom(); }}
              className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f44336" strokeWidth="2.2">
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                  <line x1="12" y1="2" x2="12" y2="12" />
                </svg>
              </div>
              <span className="text-white text-xs font-semibold">خروج</span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes musicDiscSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes musicWaveH1 { from{height:3px} to{height:7px} }
        @keyframes musicWaveH2 { from{height:5px} to{height:9px} }
        @keyframes musicWaveH3 { from{height:4px} to{height:6px} }
      `}</style>
    </>
  );
}
