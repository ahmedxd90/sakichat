// @ts-nocheck
import { Ban, LogOut } from "lucide-react";
export default function RoomAccessAlert({ access, onLeave }: { access: any; onLeave: () => void }) {
  const isBan = access.type === "ban";
  const color = isBan ? "#f87171" : "#fb923c";
  const grad = isBan ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#f97316,#ea580c)";
  const expiresAt = access.banExpiresAt ?? access.kickExpiresAt;
  const byName = isBan ? access.bannedByName : access.kickedByName;
  const durLabel = isBan
    ? (access.banDuration === "permanent" ? "دائم ♾️" : access.banDurationLabel ?? access.banDuration)
    : (access.kickDurationLabel ?? access.kickDuration);

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.92)" }}>
      <div
        className="w-[85vw] max-w-sm rounded-3xl p-6 text-center animate-bounce-in"
        style={{ background: "#1a1a2e", border: `1px solid ${color}50`, boxShadow: `0 0 40px ${color}20` }}
      >
        <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}45` }}>{isBan ? <Ban size={34} strokeWidth={1.8} style={{ color }} /> : <LogOut size={34} strokeWidth={1.8} style={{ color }} />}</div>
        <h3 className="text-white font-black text-lg mb-2">
          {isBan ? "تم حظرك من الغرفة" : "تم طردك من الغرفة"}
        </h3>
        <div className="bg-white/5 rounded-2xl p-3 mb-4 space-y-1.5">
          <p className="text-gray-300 text-sm">
            بواسطة: <span className="font-black" style={{ color }}>{byName ?? "مشرف"}</span>
          </p>
          <p className="text-gray-400 text-xs">
            المدة: <span className="font-bold text-white">{durLabel}</span>
          </p>
          {expiresAt && (
            <p className="text-gray-500 text-[10px]">
              ينتهي: {new Date(expiresAt).toLocaleString("ar-SA")}
            </p>
          )}
        </div>
        <button
          onClick={onLeave}
          className="w-full py-3 rounded-2xl text-white font-black active:scale-95 transition-transform"
          style={{ background: grad, boxShadow: `0 4px 20px ${color}40` }}
        >
          مغادرة الغرفة
        </button>
      </div>
    </div>
  );
}
