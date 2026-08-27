import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

interface AdminRoomLockScreenProps {
  roomId: string;
  onBack: () => void;
}

export default function AdminRoomLockScreen({ roomId, onBack }: AdminRoomLockScreenProps) {
  const [lockStatus, setLockStatus] = useState<any>(null);

  useEffect(() => {
    const fetchLock = async () => {
      const { data } = await supabase.from('rooms').select('is_admin_locked, admin_lock_reason').eq('id', roomId).single();
      setLockStatus(data);
    };
    fetchLock();
  }, [roomId]);

  if (!lockStatus?.is_admin_locked) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(20px)" }}>
      {/* Animated border */}
      <div className="w-full max-w-sm relative">
        <div className="absolute inset-0 rounded-3xl animate-pulse"
          style={{ background: "linear-gradient(135deg, #ef4444, #dc2626, #b91c1c)", opacity: 0.3, filter: "blur(20px)" }} />

        <div className="relative rounded-3xl p-6 text-center space-y-5"
          style={{ background: "linear-gradient(135deg, #0f0f1a, #1a0a0a)", border: "2px solid rgba(239,68,68,0.5)", boxShadow: "0 0 40px rgba(239,68,68,0.3), inset 0 0 40px rgba(239,68,68,0.05)" }}>

          {/* Lock Icon */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full animate-ping"
              style={{ background: "rgba(239,68,68,0.2)" }} />
            <div className="relative w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(185,28,28,0.3))", border: "2px solid rgba(239,68,68,0.5)" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
          </div>

          {/* Official Badge */}
          <div className="flex items-center justify-center gap-2">
            <div className="px-3 py-1 rounded-full text-xs font-black"
              style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)", color: "#000" }}>
              🏅 إشعار رسمي
            </div>
          </div>

          <div>
            <h2 className="text-white font-black text-xl mb-2">🔒 الغرفة مقفلة إدارياً</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              {lockStatus.admin_lock_reason ?? "تم قفل هذه الغرفة من قِبل الإدارة الرسمية"}
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />

          <div className="rounded-2xl p-4 space-y-2 text-right"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p className="text-gray-400 text-xs font-bold mb-2">ماذا يعني هذا؟</p>
            {[
              "لا يمكن لأي شخص الدخول لهذه الغرفة",
              "حتى مالك الغرفة لا يمكنه الدخول",
              "القرار صادر من الإدارة الرسمية",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                <p className="text-gray-400 text-xs">{item}</p>
              </div>
            ))}
          </div>

          {/* Contact Support */}
          <div className="rounded-2xl p-3 flex items-center gap-3"
            style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(168,85,247,0.15)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-purple-400 font-bold text-xs">تواصل مع خدمة العملاء</p>
              <p className="text-gray-500 text-[10px]">للاستفسار عن سبب القفل</p>
            </div>
          </div>

          <button onClick={onBack}
            className="w-full py-3 rounded-2xl text-white font-black text-sm active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg, #374151, #1f2937)", border: "1px solid rgba(255,255,255,0.1)" }}>
            العودة للخلف
          </button>
        </div>
      </div>
    </div>
  );
}
