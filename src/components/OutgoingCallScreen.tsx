// @ts-nocheck
import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface Props {
  callId: Id<"videoCalls">;
  receiverName: string;
  receiverAvatarUrl?: string;
  onCancel: () => void;
}

export default function OutgoingCallScreen({ callId, receiverName, receiverAvatarUrl, onCancel }: Props) {
  const declineCall = useMutation(api.videoCalls.declineCall);

  useEffect(() => {
    // صوت اتصال
    try {
      const ctx = new AudioContext();
      const playDial = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      };
      playDial();
      const interval = setInterval(playDial, 2000);
      return () => { clearInterval(interval); ctx.close(); };
    } catch (_) {}
  }, []);

  const handleCancel = async () => {
    try { await declineCall({ callId }); } catch (_) {}
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-[500] flex flex-col items-center justify-between py-20"
      style={{ background: "linear-gradient(180deg,#0d0020 0%,#1a0035 50%,#0d0020 100%)" }}
      dir="rtl">
      {/* Top */}
      <div className="text-center">
        <p className="text-purple-300 text-sm font-bold animate-pulse">جارٍ الاتصال...</p>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          {/* Ripple rings */}
          {[1, 2, 3].map(i => (
            <div key={i} className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping"
              style={{ animationDelay: `${i * 0.4}s`, animationDuration: "2s", transform: `scale(${1 + i * 0.3})` }} />
          ))}
          <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-purple-500/60 relative z-10"
            style={{ boxShadow: "0 0 50px rgba(168,85,247,0.5)" }}>
            {receiverAvatarUrl
              ? <img src={receiverAvatarUrl} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-6xl font-black">{receiverName?.[0]}</div>
            }
          </div>
        </div>
        <div className="text-center">
          <p className="text-white font-black text-2xl">{receiverName}</p>
          <p className="text-gray-400 text-sm mt-1">مكالمة فيديو 📹</p>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0s" }} />
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      </div>

      {/* Cancel button */}
      <button onClick={handleCancel}
        className="w-20 h-20 rounded-full flex items-center justify-center active:scale-90 transition-all"
        style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: "0 0 30px rgba(239,68,68,0.6)" }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7 2 2 0 011.72 2v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.42 19.42 0 013.43 9.65 19.79 19.79 0 01.36 1a2 2 0 012-2.18h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.34 6.68" />
          <line x1="23" y1="1" x2="1" y2="23" />
        </svg>
      </button>
    </div>
  );
}
