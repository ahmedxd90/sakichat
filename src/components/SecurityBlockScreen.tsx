/**
 * شاشة الحجب الأمني - تظهر عند اكتشاف تهديد أمني
 */
import { SecurityThreat } from "../hooks/useSecurityGuard";

interface Props {
  threatType: SecurityThreat;
  message: string;
}

const THREAT_CONFIG: Record<
  NonNullable<SecurityThreat>,
  { icon: string; title: string; color: string; glow: string }
> = {
  devtools: {
    icon: "🔧",
    title: "أدوات المطورين مفتوحة",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.3)",
  },
  root: {
    icon: "⚠️",
    title: "جهاز مكسور الحماية",
    color: "#ef4444",
    glow: "rgba(239,68,68,0.3)",
  },
  emulator: {
    icon: "🖥️",
    title: "محاكي مكتشف",
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.3)",
  },
  tamper: {
    icon: "🚨",
    title: "تلاعب مكتشف",
    color: "#ef4444",
    glow: "rgba(239,68,68,0.3)",
  },
  debugger: {
    icon: "🐛",
    title: "مصحح أخطاء مكتشف",
    color: "#ef4444",
    glow: "rgba(239,68,68,0.3)",
  },
  automation: {
    icon: "🤖",
    title: "أداة أتمتة مكتشفة",
    color: "#ef4444",
    glow: "rgba(239,68,68,0.3)",
  },
};

export default function SecurityBlockScreen({ threatType, message }: Props) {
  const config = threatType ? THREAT_CONFIG[threatType] : THREAT_CONFIG.tamper;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6"
      dir="rtl"
      style={{ background: "#0a0a14" }}
    >
      {/* خلفية متحركة */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-1/4 w-72 h-72 rounded-full opacity-10 animate-pulse"
          style={{
            background: `radial-gradient(circle, ${config.color}, transparent)`,
            animationDuration: "2s",
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-56 h-56 rounded-full opacity-8 animate-pulse"
          style={{
            background: `radial-gradient(circle, ${config.color}, transparent)`,
            animationDuration: "3s",
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(${config.color} 1px, transparent 1px), linear-gradient(90deg, ${config.color} 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
        {/* أيقونة التهديد */}
        <div
          className="w-32 h-32 rounded-full flex items-center justify-center mb-6 relative"
          style={{
            background: `linear-gradient(135deg, ${config.color}22, ${config.color}11)`,
            border: `2px solid ${config.color}66`,
            boxShadow: `0 0 60px ${config.glow}`,
          }}
        >
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: `radial-gradient(circle, ${config.color}, transparent)` }}
          />
          <span className="text-5xl relative z-10">{config.icon}</span>
        </div>

        {/* شارة تحذير */}
        <div
          className="px-3 py-1 rounded-full text-xs font-bold mb-3"
          style={{
            background: `${config.color}22`,
            border: `1px solid ${config.color}44`,
            color: config.color,
          }}
        >
          🛡️ تحذير أمني
        </div>

        {/* العنوان */}
        <h1 className="text-white font-black text-2xl mb-2">{config.title}</h1>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">{message}</p>

        {/* تفاصيل */}
        <div
          className="w-full rounded-2xl p-4 mb-6 space-y-3"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {threatType === "devtools" && (
            <div className="flex items-start gap-3">
              <span className="text-lg">💡</span>
              <p className="text-gray-400 text-xs leading-relaxed text-right">
                أغلق أدوات المطورين (F12) وأعد تحميل الصفحة للمتابعة.
              </p>
            </div>
          )}
          {threatType === "root" && (
            <div className="flex items-start gap-3">
              <span className="text-lg">📱</span>
              <p className="text-gray-400 text-xs leading-relaxed text-right">
                تم اكتشاف أن جهازك مكسور الحماية (Rooted/Jailbroken). لا يُسمح باستخدام التطبيق على أجهزة مكسورة الحماية لأسباب أمنية.
              </p>
            </div>
          )}
          {threatType === "emulator" && (
            <div className="flex items-start gap-3">
              <span className="text-lg">📱</span>
              <p className="text-gray-400 text-xs leading-relaxed text-right">
                يُرجى استخدام جهاز حقيقي للوصول إلى التطبيق. المحاكيات غير مدعومة.
              </p>
            </div>
          )}
          {(threatType === "tamper" || threatType === "automation") && (
            <div className="flex items-start gap-3">
              <span className="text-lg">🚫</span>
              <p className="text-gray-400 text-xs leading-relaxed text-right">
                تم اكتشاف برنامج اختراق أو أداة تلاعب. أوقف جميع البرامج المشبوهة وأعد تشغيل التطبيق.
              </p>
            </div>
          )}

          <div className="flex items-start gap-3">
            <span className="text-lg">⚖️</span>
            <p className="text-gray-400 text-xs leading-relaxed text-right">
              أي محاولة للتلاعب بالتطبيق تُعدّ انتهاكاً صريحاً لشروط الاستخدام وقد تؤدي إلى الحظر الدائم.
            </p>
          </div>
        </div>

        {/* زر إعادة التحميل */}
        {threatType === "devtools" && (
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 rounded-2xl font-bold text-white text-sm transition-all active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${config.color}, ${config.color}aa)`,
              boxShadow: `0 4px 20px ${config.glow}`,
            }}
          >
            🔄 إعادة التحميل
          </button>
        )}

        {/* شعار */}
        <div className="flex items-center gap-2 opacity-30 mt-6">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="11" y="3" width="10" height="16" rx="5" />
              <path d="M6 16a10 10 0 0020 0" />
            </svg>
          </div>
          <span className="text-gray-600 text-xs font-bold">SAKU Security</span>
        </div>
      </div>
    </div>
  );
}
