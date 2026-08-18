// @ts-nocheck
import { Id } from "../../../../convex/_generated/dataModel";

interface PKPendingViewProps {
  activePK: any;
  roomId: Id<"rooms">;
  canManage: boolean;
  loading: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function PKPendingView({
  activePK,
  roomId,
  canManage,
  loading,
  onAccept,
  onDecline,
}: PKPendingViewProps) {
  const isChallenger = activePK.room1Id === roomId;
  const isTarget = activePK.room2Id === roomId;

  return (
    <div className="space-y-4">
      <div
        className="rounded-3xl p-5 text-center"
        style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)" }}
      >
        <div className="text-4xl mb-3 animate-pulse">⚔️</div>
        <h3 className="text-white font-black text-lg mb-1">تحدي PK معلّق</h3>
        <p className="text-gray-400 text-sm mb-4">
          {isChallenger
            ? `في انتظار قبول غرفة "${activePK.room2Name}"`
            : `غرفة "${activePK.room1Name}" تتحداك!`
          }
        </p>

        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center mx-auto mb-1">
              <span className="text-xl">🏠</span>
            </div>
            <p className="text-white text-xs font-bold truncate max-w-[80px]">{activePK.room1Name}</p>
          </div>
          <div className="text-orange-400 font-black text-2xl">VS</div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto mb-1">
              <span className="text-xl">🏠</span>
            </div>
            <p className="text-white text-xs font-bold truncate max-w-[80px]">{activePK.room2Name}</p>
          </div>
        </div>

        <p className="text-orange-300/70 text-xs">المدة: {activePK.durationMinutes} دقيقة</p>
      </div>

      {isTarget && canManage && (
        <div className="flex gap-3">
          <button
            onClick={onDecline}
            disabled={loading}
            className="flex-1 py-3.5 rounded-2xl font-bold text-sm bg-red-500/15 border border-red-500/30 text-red-400 disabled:opacity-50"
          >
            رفض
          </button>
          <button
            onClick={onAccept}
            disabled={loading}
            className="flex-1 py-3.5 rounded-2xl font-bold text-sm disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", color: "white" }}
          >
            {loading ? "..." : "قبول التحدي ⚔️"}
          </button>
        </div>
      )}

      {isTarget && !canManage && (
        <p className="text-center text-gray-500 text-xs py-2">في انتظار قرار مالك الغرفة أو المشرف...</p>
      )}

      {isChallenger && (
        <div className="space-y-2">
          <p className="text-center text-gray-500 text-xs py-2">في انتظار الرد من الغرفة الأخرى...</p>
          {canManage && (
            <button
              onClick={onDecline}
              disabled={loading}
              className="w-full py-3 rounded-2xl font-bold text-sm bg-red-500/10 border border-red-500/25 text-red-400 disabled:opacity-50"
            >
              إلغاء التحدي
            </button>
          )}
        </div>
      )}
    </div>
  );
}
