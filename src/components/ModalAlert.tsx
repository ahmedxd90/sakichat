// @ts-nocheck
import { useEffect } from "react";

export interface ModalAlertData {
  type: "success" | "error" | "warning" | "info" | "mute" | "chat_mute";
  title: string;
  message: string;
  icon?: string;
  color?: string;
  autoClose?: number; // ms
}

interface ModalAlertProps {
  alert: ModalAlertData;
  onClose: () => void;
}

const CONFIGS = {
  success: { color: "#34d399", bg: "rgba(52,211,153,0.15)", border: "rgba(52,211,153,0.4)", icon: "✅" },
  error:   { color: "#f87171", bg: "rgba(239,68,68,0.15)",  border: "rgba(239,68,68,0.4)",  icon: "❌" },
  warning: { color: "#fbbf24", bg: "rgba(251,191,36,0.15)", border: "rgba(251,191,36,0.4)", icon: "⚠️" },
  info:    { color: "#60a5fa", bg: "rgba(96,165,250,0.15)", border: "rgba(96,165,250,0.4)", icon: "ℹ️" },
  mute:    { color: "#facc15", bg: "rgba(234,179,8,0.15)",  border: "rgba(234,179,8,0.4)",  icon: "🔇" },
  chat_mute: { color: "#60a5fa", bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.4)", icon: "💬" },
};

export default function ModalAlert({ alert, onClose }: ModalAlertProps) {
  const cfg = CONFIGS[alert.type] ?? CONFIGS.info;
  const color = alert.color ?? cfg.color;
  const icon = alert.icon ?? cfg.icon;

  useEffect(() => {
    const ms = alert.autoClose ?? 3000;
    const t = setTimeout(onClose, ms);
    return () => clearTimeout(t);
  }, [alert]);

  return (
    <div
      className="fixed inset-0 z-[700] flex items-center justify-center pointer-events-none"
      style={{ direction: "rtl" }}
    >
      <div
        className="pointer-events-auto mx-6 rounded-3xl p-5 text-center animate-bounce-in max-w-xs w-full"
        style={{
          background: `linear-gradient(135deg, #1a1a2e, #0f0f1a)`,
          border: `1.5px solid ${color}50`,
          boxShadow: `0 0 40px ${color}25, 0 8px 32px rgba(0,0,0,0.6)`,
        }}
        onClick={onClose}
      >
        {/* Icon */}
        <div className="text-4xl mb-3">{icon}</div>

        {/* Title */}
        <h3 className="text-white font-black text-base mb-1.5" style={{ textShadow: `0 0 20px ${color}50` }}>
          {alert.title}
        </h3>

        {/* Message */}
        <p className="text-gray-300 text-sm leading-relaxed mb-4">{alert.message}</p>

        {/* Progress bar */}
        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${color}, ${color}80)`,
              animation: `modalProgress ${(alert.autoClose ?? 3000)}ms linear forwards`,
            }}
          />
        </div>

        <p className="text-gray-600 text-[10px] mt-2">اضغط للإغلاق</p>
      </div>

      <style>{`
        @keyframes modalProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
