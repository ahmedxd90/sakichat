// @ts-nocheck
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useEffect, useRef } from "react";

interface Props {
  callId: Id<"videoCalls">;
  callerName: string;
  callerAvatarUrl?: string;
  onAccept: (channelName: string) => void;
  onDecline: () => void;
}

export default function IncomingCallPopup({ callId, callerName, callerAvatarUrl, onAccept, onDecline }: Props) {
  const acceptCall = useMutation(api.videoCalls.acceptCall);
  const declineCall = useMutation(api.videoCalls.declineCall);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // صوت رنين
    try {
      const ctx = new AudioContext();
      const playRing = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      };
      playRing();
      const interval = setInterval(playRing, 1500);
      return () => { clearInterval(interval); ctx.close(); };
    } catch (_) {}
  }, []);

  const handleAccept = async () => {
    try {
      const result = await acceptCall({ callId });
      onAccept(result.channelName);
    } catch (e: any) {
      console.error(e);
      onDecline();
    }
  };

  const handleDecline = async () => {
    try { await declineCall({ callId }); } catch (_) {}
    onDecline();
  };

  return (
    <div className="fixed inset-x-0 top-0 z-[600] flex justify-center pt-safe pt-4 px-4" dir="rtl">
      <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-slide-down"
        style={{
          background: "linear-gradient(135deg,#0d0020,#1a0035)",
          border: "1px solid rgba(168,85,247,0.4)",
          boxShadow: "0 0 40px rgba(168,85,247,0.3), 0 20px 60px rgba(0,0,0,0.8)",
        }}>
        {/* Animated border */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#7c3aed,#ec4899,#7c3aed)", backgroundSize: "200% 100%", animation: "shimmer 2s linear infinite" }} />

        <div className="p-5">
          <div className="flex items-center gap-4">
            {/* Avatar with pulse */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-full animate-ping opacity-30"
                style={{ background: "rgba(168,85,247,0.5)", transform: "scale(1.3)" }} />
              <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-purple-500 relative"
                style={{ border: "3px solid #a855f7" }}>
                {callerAvatarUrl
                  ? <img src={callerAvatarUrl} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl font-black">{callerName?.[0]}</div>
                }
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-gray-400 text-xs mb-0.5">مكالمة فيديو واردة 📹</p>
              <p className="text-white font-black text-lg truncate">{callerName}</p>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0s" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.15s" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.3s" }} />
                <span className="text-purple-300 text-xs mr-1">يتصل بك...</span>
              </div>
            </div>
          </div>

          {/* Cost info */}
          <div className="mt-3 px-3 py-2 rounded-xl text-center"
            style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
            <p className="text-yellow-400 text-xs">💰 سعر المكالمة: <span className="font-black">2,000 عملة/دقيقة</span></p>
            <p className="text-gray-500 text-[10px] mt-0.5">ستحصل على 70% كماس في حسابك</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-4">
            {/* Decline */}
            <button onClick={handleDecline}
              className="flex-1 py-3.5 rounded-2xl font-black text-white text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: "0 0 20px rgba(239,68,68,0.4)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7 2 2 0 011.72 2v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.42 19.42 0 013.43 9.65 19.79 19.79 0 01.36 1a2 2 0 012-2.18h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.34 6.68" />
                <line x1="23" y1="1" x2="1" y2="23" />
              </svg>
              رفض
            </button>

            {/* Accept */}
            <button onClick={handleAccept}
              className="flex-1 py-3.5 rounded-2xl font-black text-white text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", boxShadow: "0 0 20px rgba(34,197,94,0.4)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.34 8.9a16 16 0 006.77 6.77l.9-.9a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              </svg>
              رد
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-down {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-down { animation: slide-down 0.4s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
