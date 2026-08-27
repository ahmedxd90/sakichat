// @ts-nocheck
import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { supabase } from "../../lib/supabaseClient";

interface Heart {
  id: string;
  color: string;
  x: number;
  size: number;
  duration: number;
  delay: number;
  swing: number;
  userName: string;
  isLocal?: boolean;
}

const HEART_COLORS = [
  "#ff4d6d", "#ff6b9d", "#ff85a1", "#ff0a54",
  "#c77dff", "#9d4edd", "#7b2d8b",
  "#ff6b35", "#ff9f1c",
  "#06d6a0", "#00b4d8",
  "#ffd60a", "#ffb703",
];

export interface RoomHeartsOverlayRef {
  triggerHeart: (x?: number) => void;
}

const RoomHeartsOverlay = forwardRef<RoomHeartsOverlayRef, { roomId: any; myUserId?: string }>(
  function RoomHeartsOverlay({ roomId, myUserId }, ref) {
    const [hearts, setHearts] = useState<Heart[]>([]);
    const lastHeartIds = useRef<Set<string>>(new Set());
    const [heartsCount, setHeartsCount] = useState(0);
    const [latestHearts, setLatestHearts] = useState<any[]>([]);

    useEffect(() => {
      const fetchData = async () => {
        const { count } = await supabase.from('room_hearts').select('*', { count: 'exact', head: true }).eq('room_id', roomId);
        setHeartsCount(count || 0);
        const { data } = await supabase.from('room_hearts').select('*').eq('room_id', roomId).order('created_at', { ascending: false }).limit(10);
        setLatestHearts(data || []);
      };
      fetchData();
    }, [roomId]);

    const sendHeart = async (args: any) => {};

    useEffect(() => {
      if (!latestHearts) return;
      const newHearts: Heart[] = [];
      for (const h of latestHearts) {
        const hid = h.id || h._id;
        if (!lastHeartIds.current.has(hid)) {
          lastHeartIds.current.add(hid);
          newHearts.push({
            id: hid + "_" + Math.random(),
            color: h.color,
            x: h.x,
            size: 18 + Math.random() * 20,
            duration: 2.5 + Math.random() * 2,
            delay: Math.random() * 0.3,
            swing: 20 + Math.random() * 40,
            userName: h.user_name || h.userName,
          });
        }
      }
      if (newHearts.length > 0) {
        setHearts((prev) => [...prev.slice(-40), ...newHearts]);
        setTimeout(() => {
          setHearts((prev) => prev.slice(-20));
        }, 6000);
      }
    }, [latestHearts]);

    const triggerHeart = useCallback(async (x?: number) => {
      const xRatio = x ?? (0.3 + Math.random() * 0.4);
      const color = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];

      const localId = "local_" + Date.now() + "_" + Math.random();
      setHearts((prev) => [...prev.slice(-40), {
        id: localId,
        color,
        x: xRatio,
        size: 20 + Math.random() * 18,
        duration: 2.5 + Math.random() * 2,
        delay: 0,
        swing: 25 + Math.random() * 35,
        userName: "",
        isLocal: true,
      }]);

      try {
        await sendHeart({ roomId, color, x: xRatio });
      } catch (_) {}
    }, [roomId]);

    useImperativeHandle(ref, () => ({ triggerHeart }), [triggerHeart]);

    return (
      <>
        {(heartsCount ?? 0) > 0 && (
          <div className="fixed z-[60] pointer-events-none" style={{ bottom: 80, left: 12 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(8px)",
              borderRadius: 20,
              padding: "4px 10px",
              border: "1px solid rgba(255,100,130,0.35)",
            }}>
              <span style={{ fontSize: 14 }}>❤️</span>
              <span style={{
                color: "#ff6b9d", fontWeight: 700, fontSize: 12,
                textShadow: "0 0 8px rgba(255,107,157,0.8)",
              }}>
                {(heartsCount ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <div className="fixed inset-0 z-[55] pointer-events-none overflow-hidden">
          {hearts.map((heart) => (
            <FloatingHeart key={heart.id} heart={heart} />
          ))}
        </div>

        <style>{`
          @keyframes heart-float {
            0% { transform: translateY(0) scale(0.3) rotate(-10deg); opacity: 0; }
            10% { opacity: 1; transform: translateY(-5vh) scale(1.1) rotate(5deg); }
            30% { transform: translateY(-25vh) scale(1) rotate(-8deg); }
            60% { transform: translateY(-55vh) scale(0.9) rotate(6deg); opacity: 0.8; }
            100% { transform: translateY(-90vh) scale(0.5) rotate(-5deg); opacity: 0; }
          }
          @keyframes heart-swing {
            0%, 100% { margin-left: 0; }
            25% { margin-left: var(--swing-px); }
            75% { margin-left: calc(var(--swing-px) * -1); }
          }
        `}</style>
      </>
    );
  }
);

export default RoomHeartsOverlay;

function FloatingHeart({ heart }: { heart: Heart }) {
  return (
    <div style={{
      position: "absolute",
      left: `${heart.x * 100}%`,
      bottom: "15%",
      animation: `heart-float ${heart.duration}s ${heart.delay}s ease-out forwards`,
    }}>
      <div style={{
        animation: `heart-swing ${heart.duration * 0.6}s ${heart.delay}s ease-in-out infinite`,
        "--swing-px": `${heart.swing}px`,
      } as any}>
        <svg width={heart.size} height={heart.size} viewBox="0 0 24 24"
          style={{ filter: `drop-shadow(0 0 ${heart.size * 0.3}px ${heart.color})`, display: "block" }}>
          <path
            d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"
            fill={heart.color}
          />
        </svg>
        {heart.userName && !heart.isLocal && (
          <div style={{
            position: "absolute", top: -16, left: "50%",
            transform: "translateX(-50%)",
            fontSize: 9, color: heart.color, whiteSpace: "nowrap",
            fontWeight: 700, textShadow: "0 1px 3px rgba(0,0,0,0.8)",
            maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {heart.userName}
          </div>
        )}
      </div>
    </div>
  );
}
