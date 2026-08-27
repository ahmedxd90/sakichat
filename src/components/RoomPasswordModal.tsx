import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";

interface RoomPasswordModalProps {
  roomId: string;
  roomName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RoomPasswordModal({ roomId, roomName, onSuccess, onCancel }: RoomPasswordModalProps) {
  const verifyPassword = async (args: any) => {
    const { data } = await supabase.from('rooms').select('password').eq('id', args.roomId).single();
    if (data?.password !== args.password) throw new Error("Incorrect password");
  };
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (password.length !== 4) return;
    setLoading(true);
    setError("");
    try {
      await verifyPassword({ roomId, password });
      onSuccess();
    } catch (e: any) {
      setError("كلمة المرور غير صحيحة ❌");
      setPassword("");
    }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" dir="rtl">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onCancel} />
      <div className="relative w-80 rounded-3xl p-6 mx-4"
        style={{ background: "linear-gradient(180deg,#1a1200 0%,#0d0a00 100%)", border: "1px solid rgba(251,191,36,0.3)" }}>
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">🔒</div>
          <h3 className="text-white font-bold text-lg">غرفة مقفلة</h3>
          <p className="text-gray-400 text-sm mt-1 truncate">{roomName}</p>
          <p className="text-yellow-400/70 text-xs mt-1">أدخل كلمة المرور للدخول</p>
        </div>

        {/* PIN display */}
        <div className="flex gap-3 justify-center mb-4">
          {[0,1,2,3].map((i) => (
            <div key={i} className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white"
              style={{ background: password[i] ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.05)", border: `2px solid ${password[i] ? "rgba(251,191,36,0.6)" : "rgba(255,255,255,0.1)"}` }}>
              {password[i] ? "●" : ""}
            </div>
          ))}
        </div>

        {error && <p className="text-red-400 text-xs text-center mb-3 font-bold">{error}</p>}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k, idx) => (
            <button key={idx}
              onClick={() => {
                if (k === "⌫") { setPassword(p => p.slice(0,-1)); setError(""); }
                else if (k !== "" && password.length < 4) {
                  const newPass = password + String(k);
                  setPassword(newPass);
                  if (newPass.length === 4) {
                    // Auto-verify
                    setLoading(true);
                    setError("");
                    verifyPassword({ roomId, password: newPass })
                      .then(() => onSuccess())
                      .catch(() => { setError("كلمة المرور غير صحيحة ❌"); setPassword(""); setLoading(false); });
                  }
                }
              }}
              disabled={k === "" || loading}
              className={`h-12 rounded-2xl text-lg font-bold transition-all active:scale-95 disabled:opacity-50 ${k === "" ? "opacity-0 pointer-events-none" : k === "⌫" ? "text-red-400" : "text-white"}`}
              style={k !== "" ? { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" } : {}}>
              {loading && k !== "⌫" && k !== "" ? "" : k}
            </button>
          ))}
        </div>

        <button onClick={onCancel} className="w-full py-2.5 rounded-2xl bg-white/5 text-gray-400 text-sm font-medium">
          إلغاء
        </button>
      </div>
    </div>
  );
}
