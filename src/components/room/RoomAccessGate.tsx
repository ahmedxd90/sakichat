// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { toast } from "../../lib/toast";
import { Ban, LogOut, LockKeyhole, Mic2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

interface RoomAccessGateProps {
  roomId: string;
  onLeave: () => void;
  children: React.ReactNode;
}

function getDurationLabel(dur: string): string {
  if (dur === "1min") return "دقيقة واحدة";
  if (dur === "1h") return "ساعة واحدة";
  if (dur === "1d") return "يوم واحد";
  if (dur === "7d") return "7 أيام";
  if (dur === "1m") return "شهر واحد";
  if (dur === "1y") return "سنة واحدة";
  return "دائم ♾️";
}

// ── شاشة إدخال كلمة المرور ──
function PasswordScreen({ roomId, onSuccess, onLeave }: { roomId: string; onSuccess: () => void; onLeave: () => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tryVerify = async (pass: string) => {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase.from('rooms').select('password').eq('id', roomId).single();
      if (data?.password === pass) {
        onSuccess();
      } else {
        setError("كلمة المرور غير صحيحة ❌");
        setPassword("");
      }
    } catch {
      setError("كلمة المرور غير صحيحة ❌");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (k: number | string) => {
    if (loading) return;
    if (k === "⌫") {
      setPassword((p) => p.slice(0, -1));
      setError("");
      return;
    }
    if (k === "") return;
    const newPass = password + String(k);
    setPassword(newPass);
    if (newPass.length === 4) {
      tryVerify(newPass);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-6"
      style={{ background: "linear-gradient(180deg,#0f0f1a 0%,#1a1200 100%)" }}
      dir="rtl"
    >
      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 40%,rgba(251,191,36,0.1) 0%,transparent 70%)" }}
      />

      <div
        className="relative w-full max-w-sm rounded-3xl p-7 text-center"
        style={{
          background: "rgba(26,20,0,0.97)",
          border: "1.5px solid rgba(251,191,36,0.3)",
          boxShadow: "0 0 60px rgba(251,191,36,0.1), 0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{
            background: "rgba(251,191,36,0.12)",
            border: "2px solid rgba(251,191,36,0.35)",
            boxShadow: "0 0 30px rgba(251,191,36,0.2)",
          }}
        >
          <LockKeyhole size={38} strokeWidth={1.7} className="text-amber-300" />
        </div>

        <h2 className="text-white font-black text-xl mb-1">غرفة مقفلة</h2>
        <p className="text-gray-400 text-sm mb-5">أدخل كلمة المرور للدخول</p>

        {/* PIN dots */}
        <div className="flex gap-3 justify-center mb-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white transition-all"
              style={{
                background: password[i] ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.05)",
                border: `2px solid ${password[i] ? "rgba(251,191,36,0.7)" : "rgba(255,255,255,0.1)"}`,
                transform: password[i] ? "scale(1.05)" : "scale(1)",
              }}
            >
              {password[i] ? "●" : ""}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-xs font-bold mb-3 animate-pulse">{error}</p>
        )}
        {!error && <div className="h-5 mb-3" />}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((k, idx) => (
            <button
              key={idx}
              onClick={() => handleKey(k)}
              disabled={k === "" || loading}
              className={`h-13 py-3 rounded-2xl text-lg font-bold transition-all active:scale-90 disabled:opacity-40 ${
                k === "" ? "opacity-0 pointer-events-none" : k === "⌫" ? "text-red-400" : "text-white"
              }`}
              style={
                k !== ""
                  ? { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }
                  : {}
              }
            >
              {loading && typeof k === "number" ? "" : k}
            </button>
          ))}
        </div>

        {/* Leave */}
        <button
          onClick={onLeave}
          className="w-full py-3 rounded-2xl text-gray-400 text-sm font-medium"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          مغادرة
        </button>
      </div>
    </div>
  );
}

export default function RoomAccessGate({ roomId, onLeave, children }: RoomAccessGateProps) {
  const [roomAccess, setRoomAccess] = useState<any>({ allowed: true });
  const [lockStatus, setLockStatus] = useState<any>({ isLocked: false });
  const [isLoading, setIsLoading] = useState(true);
  const evictionHandledRef = useRef(false);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: room } = await supabase.from('rooms').select('*').eq('id', roomId).single();
      
      if (room) {
        setLockStatus({ isLocked: !!room.password, isOwner: room.owner_id === user?.id });
      }
      setIsLoading(false);
    };
    checkAccess();
  }, [roomId]);

  useEffect(() => {
    if (!roomAccess || roomAccess.allowed || evictionHandledRef.current) return;
    evictionHandledRef.current = true;
    const message = roomAccess.type === "ban" ? "تم حظرك من الغرفة وسيتم إخراجك الآن" : "تم طردك من الغرفة وسيتم إخراجك الآن";
    toast.error(message);
    const timer = window.setTimeout(() => onLeave(), 450);
    return () => window.clearTimeout(timer);
  }, [roomAccess, onLeave]);

  // نحفظ التحقق في sessionStorage حتى لا يُفقد عند العودة للغرفة
  const sessionKey = `room_pw_verified_${roomId}`;
  const [passwordVerified, setPasswordVerified] = useState(() => {
    return sessionStorage.getItem(sessionKey) === "1";
  });

  const handlePasswordSuccess = () => {
    sessionStorage.setItem(sessionKey, "1");
    setPasswordVerified(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl"
        style={{ background: "linear-gradient(180deg,#0a0a14,#1a1200)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#3B4D2E,#232F1A)", border: "2px solid rgba(212,175,55,0.4)" }}>
            <Mic2 size={26} strokeWidth={1.7} className="text-amber-300" />
          </div>
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "#D4AF37", borderTopColor: "transparent" }} />
          <p className="text-amber-400 text-sm font-bold">جارٍ التحقق...</p>
        </div>
      </div>
    );
  }

  // ── تحقق من الحظر/الطرد أولاً ──
  if (!roomAccess.allowed) {
    const isBan = roomAccess.type === "ban";
    const color = isBan ? "#f87171" : "#fb923c";
    const grad = isBan
      ? "linear-gradient(135deg,#ef4444,#dc2626)"
      : "linear-gradient(135deg,#f97316,#ea580c)";
    const expiresAt = roomAccess.banExpiresAt ?? roomAccess.kickExpiresAt;
    const byName = isBan ? roomAccess.bannedByName : roomAccess.kickedByName;
    const durLabel = isBan
      ? getDurationLabel(roomAccess.banDuration ?? "permanent")
      : getDurationLabel(roomAccess.kickDuration ?? "1d");

    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center px-6"
        style={{ background: "linear-gradient(180deg,#0f0f1a 0%,#1a0a0a 100%)" }}
        dir="rtl"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isBan
              ? "radial-gradient(ellipse at 50% 40%,rgba(239,68,68,0.12) 0%,transparent 70%)"
              : "radial-gradient(ellipse at 50% 40%,rgba(249,115,22,0.12) 0%,transparent 70%)",
          }}
        />
        <div
          className="relative w-full max-w-sm rounded-3xl p-7 text-center"
          style={{
            background: "rgba(26,26,46,0.95)",
            border: `1.5px solid ${color}40`,
            boxShadow: `0 0 60px ${color}20, 0 20px 60px rgba(0,0,0,0.5)`,
          }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: `${color}15`, border: `2px solid ${color}40`, boxShadow: `0 0 30px ${color}30` }}
          >
            {isBan ? <Ban size={38} strokeWidth={1.7} style={{ color }} /> : <LogOut size={38} strokeWidth={1.7} style={{ color }} />}
          </div>
          <h2 className="text-white font-black text-xl mb-1">
            {isBan ? "تم حظرك من الغرفة" : "تم طردك من الغرفة"}
          </h2>
          <p className="text-gray-400 text-sm mb-5">
            {isBan ? "لا يمكنك الدخول إلى هذه الغرفة" : "لا يمكنك العودة إلى هذه الغرفة حتى انتهاء المدة"}
          </p>
          <div
            className="rounded-2xl p-4 mb-5 space-y-2 text-right"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm" style={{ color }}>{byName ?? "مشرف"}</span>
              <span className="text-gray-500 text-xs">بواسطة</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white font-bold text-sm">{durLabel}</span>
              <span className="text-gray-500 text-xs">المدة</span>
            </div>
            {expiresAt && (
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-xs">{new Date(expiresAt).toLocaleString("ar-SA")}</span>
                <span className="text-gray-500 text-xs">ينتهي</span>
              </div>
            )}
            {!expiresAt && isBan && (
              <div className="flex items-center justify-between">
                <span className="text-red-400 text-xs font-bold">دائم ♾️</span>
                <span className="text-gray-500 text-xs">نوع الحظر</span>
              </div>
            )}
          </div>
          <button
            onClick={onLeave}
            className="w-full py-3.5 rounded-2xl text-white font-black text-sm active:scale-95 transition-transform"
            style={{ background: grad, boxShadow: `0 4px 20px ${color}40` }}
          >
            {isBan ? "حسناً، مغادرة" : "العودة للخلف"}
          </button>
        </div>
      </div>
    );
  }

  // ── تحقق من قفل الغرفة ──
  // فقط المالك يدخل مباشرة — الجميع (بما فيهم المشرفون) يجب أن يدخلوا كلمة المرور
  if (lockStatus.isLocked && !lockStatus.isOwner && !passwordVerified) {
    return (
      <PasswordScreen
        roomId={roomId}
        onSuccess={handlePasswordSuccess}
        onLeave={onLeave}
      />
    );
  }

  // ✅ مسموح بالدخول
  return <>{children}</>;
}
