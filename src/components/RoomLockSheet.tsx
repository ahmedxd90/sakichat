import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";

interface RoomLockSheetProps {
  roomId: string;
  isLocked: boolean;
  onClose: () => void;
}

export default function RoomLockSheet({ roomId, isLocked, onClose }: RoomLockSheetProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLock = async () => {
    if (!/^\d{4}$/.test(password)) { toast.error("كلمة المرور يجب أن تكون 4 أرقام فقط"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from('rooms').update({ password, is_locked: true }).eq('id', roomId);
      if (error) throw error;
      toast.success("تم قفل الغرفة 🔒");
      onClose();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleUnlock = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('rooms').update({ password: null, is_locked: false }).eq('id', roomId);
      if (error) throw error;
      toast.success("تم فتح الغرفة 🔓");
      onClose();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative rounded-t-3xl border-t border-yellow-500/30 animate-slide-up-sheet p-5"
        style={{ background: "linear-gradient(180deg,#1a1200 0%,#0d0a00 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 bg-yellow-500/30 rounded-full" />
        </div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" }}>
            {isLocked ? "🔒" : "🔓"}
          </div>
          <div>
            <h3 className="text-white font-bold text-base">{isLocked ? "الغرفة مقفلة" : "قفل الغرفة"}</h3>
            <p className="text-gray-400 text-xs mt-0.5">{isLocked ? "يمكنك فتح الغرفة أو تغيير كلمة المرور" : "ضع كلمة مرور من 4 أرقام"}</p>
          </div>
        </div>

        {/* Password input */}
        <div className="mb-4">
          <label className="text-gray-400 text-xs font-bold mb-2 block">
            {isLocked ? "كلمة المرور الجديدة (اختياري)" : "كلمة المرور (4 أرقام)"}
          </label>
          <div className="flex gap-3 justify-center">
            {[0,1,2,3].map((i) => (
              <div key={i} className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white"
                style={{ background: password[i] ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.05)", border: `2px solid ${password[i] ? "rgba(251,191,36,0.6)" : "rgba(255,255,255,0.1)"}` }}>
                {password[i] ? "●" : ""}
              </div>
            ))}
          </div>
          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k, idx) => (
              <button key={idx}
                onClick={() => {
                  if (k === "⌫") setPassword(p => p.slice(0,-1));
                  else if (k !== "" && password.length < 4) setPassword(p => p + String(k));
                }}
                disabled={k === ""}
                className={`h-12 rounded-2xl text-lg font-bold transition-all active:scale-95 ${k === "" ? "opacity-0 pointer-events-none" : k === "⌫" ? "text-red-400" : "text-white"}`}
                style={k !== "" ? { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" } : {}}>
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <button onClick={handleLock} disabled={loading || password.length !== 4}
            className="w-full py-3.5 rounded-2xl text-black font-bold text-base disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}>
            {loading ? "جارٍ..." : "🔒 قفل الغرفة"}
          </button>
          {isLocked && (
            <button onClick={handleUnlock} disabled={loading}
              className="w-full py-3 rounded-2xl text-green-400 font-bold text-sm disabled:opacity-50"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
              🔓 فتح الغرفة
            </button>
          )}
          <button onClick={onClose} className="w-full py-3 rounded-2xl bg-white/5 text-gray-400 font-medium text-sm">إلغاء</button>
        </div>
      </div>
    </div>
  );
}
