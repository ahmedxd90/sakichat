// @ts-nocheck
import PKDurationPicker from "./PKDurationPicker";

interface PKStatusTabProps {
  canManage: boolean;
  myReadyStatus: any;
  selectedDuration: number;
  onDurationChange: (v: number) => void;
  onDeclareReady: () => void;
  onCancelReady: () => void;
  onGoReadyList: () => void;
  onGoChallenge: () => void;
  loading: boolean;
  readyMins: number;
  readySecs: number;
}

export default function PKStatusTab({
  canManage,
  myReadyStatus,
  selectedDuration,
  onDurationChange,
  onDeclareReady,
  onCancelReady,
  onGoReadyList,
  onGoChallenge,
  loading,
  readyMins,
  readySecs,
}: PKStatusTabProps) {
  return (
    <div className="space-y-4">
      {myReadyStatus ? (
        <div
          className="rounded-2xl p-4"
          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <p className="text-green-400 font-bold text-sm">غرفتك معلنة للتحدي</p>
            </div>
            <span className="text-green-300 text-xs tabular-nums font-bold">
              {String(readyMins).padStart(2, "0")}:{String(readySecs).padStart(2, "0")}
            </span>
          </div>
          <p className="text-gray-400 text-xs mb-3">المدة: {myReadyStatus.durationMinutes} دقيقة</p>
          {canManage && (
            <button
              onClick={onCancelReady}
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-bold text-sm bg-red-500/10 border border-red-500/25 text-red-400 disabled:opacity-50"
            >
              إلغاء الإعلان
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 gap-3">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}
          >
            <span className="text-4xl">⚔️</span>
          </div>
          <p className="text-gray-400 text-sm text-center">لا يوجد تحدي PK نشط حالياً</p>
          {!canManage && (
            <p className="text-gray-500 text-xs">فقط مالك الغرفة أو المشرف يمكنه إرسال تحدي PK</p>
          )}
        </div>
      )}

      {canManage && !myReadyStatus && (
        <>
          <div>
            <p className="text-gray-400 text-xs mb-2 font-medium">مدة التحدي المفضلة</p>
            <PKDurationPicker value={selectedDuration} onChange={onDurationChange} />
          </div>
          <button
            onClick={onDeclareReady}
            disabled={loading}
            className="w-full py-3 rounded-2xl font-bold text-sm disabled:opacity-50"
            style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80" }}
          >
            {loading ? "جارٍ الإعلان..." : `🟢 أعلن جاهزيتك (${selectedDuration} دقيقة)`}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onGoReadyList}
              className="flex-1 py-3 rounded-2xl font-bold text-sm"
              style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", color: "#fb923c" }}
            >
              تحدى الجاهزين 🎯
            </button>
            <button
              onClick={onGoChallenge}
              className="flex-1 py-3 rounded-2xl font-bold text-sm"
              style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", color: "white" }}
            >
              تحدي مباشر ⚔️
            </button>
          </div>
        </>
      )}
    </div>
  );
}
