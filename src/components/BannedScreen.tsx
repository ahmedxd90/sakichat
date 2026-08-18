import { useEffect, useState } from "react";

interface BannedScreenProps {
  reason: string;
  type: "device" | "account" | null;
  banExpiresAt?: number | null;
  banDuration?: string | null;
}

function formatTimeLeft(expiresAt: number): string {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "انتهى";
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} يوم و ${hours % 24} ساعة`;
  if (hours > 0) return `${hours} ساعة و ${minutes} دقيقة`;
  return `${minutes} دقيقة`;
}

const durationLabels: Record<string, string> = {
  "1h": "ساعة واحدة",
  "1d": "يوم واحد",
  "3d": "3 أيام",
  "7d": "7 أيام",
  "30d": "30 يوم",
  "365d": "سنة كاملة",
  "permanent": "دائم",
};

export default function BannedScreen({ reason, type, banExpiresAt, banDuration }: BannedScreenProps) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const isPermanent = !banExpiresAt || banDuration === "permanent";

  useEffect(() => {
    if (!banExpiresAt) return;
    const update = () => setTimeLeft(formatTimeLeft(banExpiresAt));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [banExpiresAt]);

  return (
    <div className="min-h-screen bg-[#0a0a14] flex flex-col items-center justify-center px-6" dir="rtl">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full opacity-10 animate-pulse"
          style={{ background: "radial-gradient(circle, #ef4444, transparent)", animationDuration: "3s" }} />
        <div className="absolute bottom-0 right-1/4 w-60 h-60 rounded-full opacity-8 animate-pulse"
          style={{ background: "radial-gradient(circle, #dc2626, transparent)", animationDuration: "4s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #ef4444, transparent)" }} />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">

        {/* Lock Icon */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: "rgba(239,68,68,0.5)", animationDuration: "2s" }} />
          <div className="absolute inset-0 rounded-full animate-pulse opacity-30"
            style={{ background: "radial-gradient(circle, rgba(239,68,68,0.6), transparent)" }} />

          <div className="w-32 h-32 rounded-full flex items-center justify-center relative"
            style={{
              background: "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(185,28,28,0.25))",
              border: "2px solid rgba(239,68,68,0.5)",
              boxShadow: "0 0 60px rgba(239,68,68,0.4), 0 0 120px rgba(239,68,68,0.15), inset 0 0 30px rgba(239,68,68,0.1)",
            }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" className="relative z-10">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"
                fill="rgba(239,68,68,0.2)" stroke="#ef4444" strokeWidth="2" />
              <path d="M7 11V7a5 5 0 0110 0v4"
                stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1.5" fill="#ef4444" />
              <line x1="12" y1="17.5" x2="12" y2="19.5"
                stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="mb-2">
          <h1 className="text-white font-black text-2xl mb-1">
            تم حظرك من التطبيق
          </h1>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <p className="text-red-400 font-bold text-sm">
              حظر شامل من جميع الحسابات والأجهزة
            </p>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
        </div>

        {/* Duration Badge */}
        <div className="mb-5">
          <span className="px-4 py-1.5 rounded-full text-xs font-black"
            style={{
              background: isPermanent
                ? "linear-gradient(135deg, rgba(239,68,68,0.3), rgba(185,28,28,0.4))"
                : "linear-gradient(135deg, rgba(251,191,36,0.2), rgba(217,119,6,0.3))",
              border: isPermanent ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(251,191,36,0.4)",
              color: isPermanent ? "#ef4444" : "#fbbf24",
            }}>
            {isPermanent ? "🔒 حظر دائم" : `⏱️ مدة الحظر: ${durationLabels[banDuration ?? "permanent"] ?? banDuration}`}
          </span>
        </div>

        {/* Time Left */}
        {!isPermanent && timeLeft && (
          <div className="w-full rounded-2xl p-3 mb-4 flex items-center gap-3"
            style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <div className="text-right">
              <p className="text-yellow-400 text-xs font-bold">الوقت المتبقي للحظر</p>
              <p className="text-yellow-300 text-sm font-black">{timeLeft}</p>
            </div>
          </div>
        )}

        {/* Ban Reason */}
        <div className="w-full rounded-2xl p-4 mb-4"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <div className="flex items-center gap-2 mb-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-red-400 text-xs font-bold">سبب الحظر</p>
          </div>
          <p className="text-white text-sm font-medium leading-relaxed">{reason}</p>
        </div>

        {/* Info Cards */}
        <div className="w-full space-y-2 mb-6">
          <div className="flex items-start gap-3 rounded-xl p-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" className="flex-shrink-0 mt-0.5">
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <line x1="12" y1="18" x2="12" y2="18" strokeWidth="3" />
            </svg>
            <p className="text-gray-400 text-xs leading-relaxed">
              تم حظرك من التطبيق بالكامل ومن جميع الحسابات المرتبطة بجهازك. لا يمكنك الوصول للتطبيق بأي حساب.
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-xl p-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" className="flex-shrink-0 mt-0.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <p className="text-gray-400 text-xs leading-relaxed">
              {isPermanent
                ? "هذا الحظر دائم ولا يمكن رفعه إلا من قِبل الإدارة الرسمية."
                : "سيتم رفع الحظر تلقائياً بعد انتهاء المدة المحددة."}
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-xl p-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" className="flex-shrink-0 mt-0.5">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
            </svg>
            <p className="text-gray-400 text-xs leading-relaxed">
              تواصل مع الدعم الفني أو خدمة العملاء الرسمية لمعرفة السبب والاعتراض.
            </p>
          </div>
        </div>

        {/* App Logo */}
        <div className="flex items-center gap-2 opacity-40">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="11" y="3" width="10" height="16" rx="5" />
              <path d="M6 16a10 10 0 0020 0" />
            </svg>
          </div>
          <span className="text-gray-600 text-xs font-bold">SAKU</span>
        </div>
      </div>
    </div>
  );
}
