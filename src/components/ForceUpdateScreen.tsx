import React from "react";

interface ForceUpdateScreenProps {
  currentVersion: string;
  requiredVersion: string;
  releaseNotes?: string;
  onUpdate: () => void;
}

export default function ForceUpdateScreen({
  currentVersion,
  requiredVersion,
  releaseNotes,
  onUpdate,
}: ForceUpdateScreenProps) {
  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 50%, #0f0f1a 100%)",
      }}
    >
      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] opacity-10"
          style={{
            background: "radial-gradient(circle at 30% 40%, #a855f7 0%, transparent 50%), radial-gradient(circle at 70% 60%, #7c3aed 0%, transparent 50%)",
            animation: "rotate 20s linear infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes float-icon {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer-btn {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      <div className="relative z-10 flex flex-col items-center px-6 max-w-sm w-full">
        {/* أيقونة التحديث */}
        <div className="relative mb-8" style={{ animation: "float-icon 3s ease-in-out infinite" }}>
          {/* حلقات نابضة */}
          <div
            className="absolute inset-0 rounded-full border-2 border-purple-500"
            style={{ animation: "pulse-ring 2s ease-out infinite" }}
          />
          <div
            className="absolute inset-0 rounded-full border-2 border-purple-400"
            style={{ animation: "pulse-ring 2s ease-out infinite 0.5s" }}
          />
          {/* الأيقونة الرئيسية */}
          <div
            className="relative w-28 h-28 rounded-3xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              boxShadow: "0 0 40px rgba(168,85,247,0.5), 0 0 80px rgba(168,85,247,0.2)",
            }}
          >
            <img
              src="https://j.top4top.io/p_37559m1p51.jpg"
              alt="ساكي"
              className="w-20 h-20 rounded-2xl object-cover"
            />
          </div>
        </div>

        {/* النص الرئيسي */}
        <div
          className="text-center mb-6"
          style={{ animation: "slide-up 0.5s ease-out forwards" }}
        >
          <h1 className="text-2xl font-bold text-white mb-2">
            🚀 تحديث جديد متاح!
          </h1>
          <p className="text-purple-300 text-sm leading-relaxed">
            يجب تحديث التطبيق للاستمرار في الاستخدام
          </p>
        </div>

        {/* بطاقة معلومات النسخة */}
        <div
          className="w-full rounded-2xl p-4 mb-6"
          style={{
            background: "rgba(168,85,247,0.1)",
            border: "1px solid rgba(168,85,247,0.3)",
            animation: "slide-up 0.6s ease-out forwards",
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <div className="text-center flex-1">
              <p className="text-gray-400 text-xs mb-1">النسخة الحالية</p>
              <p className="text-white font-bold text-lg">{currentVersion}</p>
            </div>
            <div className="text-purple-400 text-2xl px-4">→</div>
            <div className="text-center flex-1">
              <p className="text-gray-400 text-xs mb-1">النسخة الجديدة</p>
              <p className="text-purple-300 font-bold text-lg">{requiredVersion}</p>
            </div>
          </div>

          {releaseNotes && (
            <div
              className="mt-3 pt-3 border-t"
              style={{ borderColor: "rgba(168,85,247,0.2)" }}
            >
              <p className="text-gray-400 text-xs mb-1">✨ ما الجديد:</p>
              <p className="text-gray-300 text-sm leading-relaxed">{releaseNotes}</p>
            </div>
          )}
        </div>

        {/* زر التحديث */}
        <button
          onClick={onUpdate}
          className="w-full py-4 rounded-2xl text-white font-bold text-lg relative overflow-hidden"
          style={{
            background: "linear-gradient(90deg, #7c3aed, #a855f7, #7c3aed)",
            backgroundSize: "200% auto",
            animation: "shimmer-btn 3s linear infinite",
            boxShadow: "0 4px 20px rgba(168,85,247,0.5)",
          }}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <span>🔄</span>
            <span>تحديث الآن</span>
          </span>
        </button>

        {/* تحذير */}
        <p
          className="text-gray-500 text-xs text-center mt-4"
          style={{ animation: "slide-up 0.8s ease-out forwards" }}
        >
          لا يمكن استخدام التطبيق بدون التحديث
        </p>
      </div>
    </div>
  );
}
