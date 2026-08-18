interface AdminLockModalProps {
  room: any;
  reason: string;
  onReasonChange: (v: string) => void;
  onLock: () => void;
  onUnlock: () => void;
  onClose: () => void;
}

export default function AdminLockModal({ room, reason, onReasonChange, onLock, onUnlock, onClose }: AdminLockModalProps) {
  const isLocked = room.isAdminLocked;

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.85)" }}>
      <div className="w-full max-w-lg rounded-t-3xl p-5 space-y-4"
        style={{
          background: "#0f0f1a",
          border: `1px solid ${isLocked ? "rgba(74,222,128,0.4)" : "rgba(239,68,68,0.4)"}`,
        }}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
              style={{ background: isLocked ? "rgba(74,222,128,0.15)" : "rgba(239,68,68,0.15)" }}>
              {isLocked ? "🔒" : "🔓"}
            </div>
            <div>
              <h3 className="text-white font-black text-sm">
                {isLocked ? "فتح القفل الإداري" : "قفل الغرفة إدارياً"}
              </h3>
              <p className="text-gray-500 text-[10px] truncate max-w-[200px]">{room.name}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="text-gray-400 text-xl w-8 h-8 flex items-center justify-center rounded-xl"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            ✕
          </button>
        </div>

        {!isLocked ? (
          <>
            {/* Warning */}
            <div className="rounded-2xl p-3 space-y-1"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-red-400 text-xs font-bold">⚠️ تحذير مهم</p>
              <p className="text-gray-400 text-xs">
                عند القفل الإداري لن يتمكن أي شخص من الدخول للغرفة بما فيهم المالك.
                ستظهر لهم نافذة إدارية رسمية مع سبب القفل.
              </p>
            </div>

            {/* Reason */}
            <div>
              <label className="text-gray-400 text-xs font-bold mb-2 block">
                سبب القفل الإداري <span className="text-red-400">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
                placeholder="مثال: مخالفة شروط الاستخدام، محتوى غير لائق، تحقيق جارٍ..."
                rows={3}
                className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none resize-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
              />
            </div>

            {/* Lock Button */}
            <button
              onClick={onLock}
              disabled={!reason.trim()}
              className="w-full py-3.5 rounded-2xl text-white font-black text-sm active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 4px 20px rgba(239,68,68,0.4)" }}>
              <span>🔒</span>
              <span>تأكيد القفل الإداري</span>
            </button>
          </>
        ) : (
          <>
            {/* Current Lock Reason */}
            <div className="rounded-2xl p-4 space-y-2"
              style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-red-400 text-xs font-bold">🔒 سبب القفل الحالي:</p>
              <p className="text-gray-200 text-sm leading-relaxed">
                {room.adminLockReason ?? "لم يُحدد سبب"}
              </p>
            </div>

            {/* Unlock Button */}
            <button
              onClick={onUnlock}
              className="w-full py-3.5 rounded-2xl text-white font-black text-sm active:scale-95 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #34d399, #059669)", boxShadow: "0 4px 20px rgba(52,211,153,0.4)" }}>
              <span>🔓</span>
              <span>فتح القفل الإداري</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
