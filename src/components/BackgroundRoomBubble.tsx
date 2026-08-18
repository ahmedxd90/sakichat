import { useEffect, useRef, useState, useCallback } from "react";
import { useBackgroundRoom } from "../contexts/BackgroundRoomContext";
import { getAgoraGlobalState, subscribeAgoraGlobal, toggleMuteGlobal } from "../lib/agoraGlobal";

const BUBBLE_SIZE = 60;
const EDGE_MARGIN = 8;

// ── Media Session API: يبقي الصوت شغالاً في الخلفية وشاشة القفل ──────────
function setupMediaSession(name: string, cover?: string) {
  if (!("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: name || "غرفة ساكي",
      artist: "ساكي - غرف الصوت العربية",
      album: "🎙️ جارٍ البث الصوتي",
      artwork: [
        { src: cover || "https://j.top4top.io/p_37559m1p51.jpg", sizes: "512x512", type: "image/jpeg" },
        { src: "https://j.top4top.io/p_37559m1p51.jpg", sizes: "192x192", type: "image/jpeg" },
      ],
    });
    navigator.mediaSession.playbackState = "playing";
    // منع إيقاف الصوت من شاشة القفل أو مركز التحكم
    navigator.mediaSession.setActionHandler("play", () => {
      navigator.mediaSession.playbackState = "playing";
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      // نبقي الصوت شغالاً
      navigator.mediaSession.playbackState = "playing";
    });
    navigator.mediaSession.setActionHandler("stop", null);
    navigator.mediaSession.setActionHandler("previoustrack", null);
    navigator.mediaSession.setActionHandler("nexttrack", null);
  } catch (_) {}
}

function clearMediaSession() {
  if (!("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = "none";
    ["play", "pause", "stop", "previoustrack", "nexttrack"].forEach((a) => {
      try { navigator.mediaSession.setActionHandler(a as any, null); } catch (_) {}
    });
  } catch (_) {}
}

export default function BackgroundRoomBubble() {
  const { bgRoom, returnToRoom } = useBackgroundRoom();
  const [waves, setWaves] = useState([0.3, 0.6, 0.9, 0.5, 0.4]);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [, forceUpdate] = useState(0);

  // Subscribe to Agora global state changes
  useEffect(() => {
    const unsub = subscribeAgoraGlobal(() => forceUpdate((n) => n + 1));
    return () => { unsub(); };
  }, []);

  const agoraState = getAgoraGlobalState();

  // ── Draggable state ──────────────────────────────────────────
  const [pos, setPos] = useState({ x: EDGE_MARGIN, y: window.innerHeight - 160 });
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0, moved: false });
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Animate sound waves
  useEffect(() => {
    if (!bgRoom) return;
    animRef.current = setInterval(() => {
      setWaves(Array.from({ length: 5 }, () => 0.2 + Math.random() * 0.8));
    }, 280);
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, [bgRoom]);

  // ── Media Session: تفعيل عند دخول الخلفية ──────────────────
  useEffect(() => {
    if (bgRoom) {
      setupMediaSession(bgRoom.roomName, bgRoom.coverUrl);
    } else {
      clearMediaSession();
    }
    return () => {
      if (!bgRoom) clearMediaSession();
    };
  }, [bgRoom?.roomId, bgRoom?.roomName, bgRoom?.coverUrl]);

  // Show tooltip briefly on mount
  useEffect(() => {
    if (!bgRoom) return;
    setShowTooltip(true);
    const t = setTimeout(() => setShowTooltip(false), 3000);
    return () => clearTimeout(t);
  }, [bgRoom]);

  // ── Snap to edge ─────────────────────────────────────────────
  const snapToEdge = useCallback((x: number, y: number) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const clampedY = Math.max(EDGE_MARGIN + 60, Math.min(vh - BUBBLE_SIZE - 80, y));
    const snapX = x + BUBBLE_SIZE / 2 < vw / 2 ? EDGE_MARGIN : vw - BUBBLE_SIZE - EDGE_MARGIN;
    return { x: snapX, y: clampedY };
  }, []);

  // ── Touch handlers ───────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
      moved: false,
    };
    setIsDragging(true);
    setShowTooltip(false);
  }, [pos]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    const dx = touch.clientX - dragRef.current.startX;
    const dy = touch.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      dragRef.current.moved = true;
    }
    const newX = dragRef.current.startPosX + dx;
    const newY = dragRef.current.startPosY + dy;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setPos({
      x: Math.max(-BUBBLE_SIZE / 2, Math.min(vw - BUBBLE_SIZE / 2, newX)),
      y: Math.max(60, Math.min(vh - BUBBLE_SIZE - 60, newY)),
    });
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (!dragRef.current.moved) {
      returnToRoom?.();
      return;
    }
    setPos((prev) => snapToEdge(prev.x, prev.y));
  }, [returnToRoom, snapToEdge]);

  // ── Mouse handlers (desktop) ─────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
      moved: false,
    };
    setIsDragging(true);
    setShowTooltip(false);

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragRef.current.moved = true;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setPos({
        x: Math.max(-BUBBLE_SIZE / 2, Math.min(vw - BUBBLE_SIZE / 2, dragRef.current.startPosX + dx)),
        y: Math.max(60, Math.min(vh - BUBBLE_SIZE - 60, dragRef.current.startPosY + dy)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (!dragRef.current.moved) {
        returnToRoom?.();
      } else {
        setPos((prev) => snapToEdge(prev.x, prev.y));
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [pos, returnToRoom, snapToEdge]);

  if (!bgRoom) return null;

  const isOnRight = pos.x > window.innerWidth / 2;

  return (
    <div
      ref={bubbleRef}
      className="fixed z-[9999] select-none"
      style={{
        left: pos.x,
        top: pos.y,
        width: BUBBLE_SIZE,
        height: BUBBLE_SIZE,
        cursor: isDragging ? "grabbing" : "grab",
        transition: isDragging ? "none" : "left 0.3s cubic-bezier(0.34,1.56,0.64,1), top 0.15s ease",
        touchAction: "none",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
    >
      {/* Pulse rings */}
      <div
        className="absolute inset-0 rounded-full animate-ping opacity-40 pointer-events-none"
        style={{ background: "rgba(168,85,247,0.7)", animationDuration: "1.4s" }}
      />
      <div
        className="absolute inset-0 rounded-full animate-ping opacity-25 pointer-events-none"
        style={{ background: "rgba(236,72,153,0.6)", animationDuration: "2s", animationDelay: "0.6s" }}
      />

      {/* Main bubble */}
      <div
        className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #7c3aed, #a855f7, #ec4899)",
          boxShadow: isDragging
            ? "0 0 30px rgba(168,85,247,0.9), 0 0 60px rgba(168,85,247,0.5)"
            : "0 0 20px rgba(168,85,247,0.7), 0 0 40px rgba(168,85,247,0.3)",
          border: "2.5px solid rgba(255,255,255,0.35)",
          transform: isDragging ? "scale(1.12)" : "scale(1)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
      >
        {bgRoom.coverUrl ? (
          <img src={bgRoom.coverUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">🎙️</span>
        )}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/25 pointer-events-none" />

        {/* Sound waves */}
        <div className="absolute bottom-1.5 left-0 right-0 flex items-end justify-center gap-0.5 px-2 pointer-events-none">
          {waves.map((h, i) => (
            <div
              key={i}
              className="rounded-full bg-white/90"
              style={{
                width: "3px",
                height: `${3 + h * 12}px`,
                transition: "height 0.28s ease",
              }}
            />
          ))}
        </div>
      </div>

      {/* LIVE badge */}
      <div
        className="absolute -top-1 -right-1 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 pointer-events-none"
        style={{ background: "rgba(239,68,68,0.95)", border: "1.5px solid rgba(255,255,255,0.4)" }}
      >
        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        <span className="text-white text-[8px] font-black">LIVE</span>
      </div>

      {agoraState.isOnSeat && (
        <button
          className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: agoraState.isMuted ? "rgba(239,68,68,0.95)" : "rgba(34,197,94,0.95)", border: "1.5px solid rgba(255,255,255,0.4)", zIndex: 10 }}
          onTouchEnd={(e) => { e.stopPropagation(); toggleMuteGlobal(); }}
          onClick={(e) => { e.stopPropagation(); toggleMuteGlobal(); }}
        >
          <span className="text-white text-[8px]">{agoraState.isMuted ? "🔇" : "🎙️"}</span>
        </button>
      )}

      {/* Tooltip */}
      {showTooltip && !isDragging && (
        <div
          className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl px-2.5 py-1.5 pointer-events-none animate-fade-in"
          style={{
            [isOnRight ? "right" : "left"]: BUBBLE_SIZE + 8,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}
        >
          <p className="text-white text-[11px] font-bold truncate max-w-[120px]">{bgRoom.roomName}</p>
          <p className="text-purple-300 text-[9px] mt-0.5">اضغط للعودة • اسحب للتحريك</p>
        </div>
      )}
    </div>
  );
}
