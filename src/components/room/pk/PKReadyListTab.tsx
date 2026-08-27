// @ts-nocheck

interface PKReadyListTabProps {
  readyRooms: any[] | undefined;
  canManage: boolean;
  loading: boolean;
  onChallenge: (roomId: string, duration: number) => void;
  onGoDirectChallenge: () => void;
}

export default function PKReadyListTab({
  readyRooms,
  canManage,
  loading,
  onChallenge,
  onGoDirectChallenge,
}: PKReadyListTabProps) {
  return (
    <div className="space-y-3">
      <p className="text-gray-400 text-xs font-medium">الغرف المعلنة عن جاهزيتها للتحدي</p>

      {!readyRooms ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : readyRooms.length === 0 ? (
        <div className="flex flex-col items-center py-10 gap-3">
          <span className="text-4xl">🔍</span>
          <p className="text-gray-500 text-sm text-center">لا توجد غرف جاهزة للتحدي حالياً</p>
          {canManage && (
            <button
              onClick={onGoDirectChallenge}
              className="px-5 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", color: "white" }}
            >
              تحدى غرفة مباشرة ⚔️
            </button>
          )}
        </div>
      ) : (
        readyRooms.map((r) => (
          <div
            key={r._id}
            className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-orange-800 to-red-900 flex items-center justify-center">
              {r.roomCoverUrl
                ? <img src={r.roomCoverUrl} alt="" className="w-full h-full object-cover" />
                : <span className="text-xl">🏠</span>
              }
            </div>
            <div className="flex-1 min-w-0 text-right">
              <p className="text-white font-bold text-sm truncate">{r.roomName}</p>
              <p className="text-gray-500 text-xs">{r.memberCount ?? 0} عضو • {r.durationMinutes} دقيقة</p>
              <p className="text-green-400 text-xs">🟢 جاهز للتحدي</p>
            </div>
            {canManage && (
              <button
                onClick={() => onChallenge(r.roomId, r.durationMinutes)}
                disabled={loading}
                className="px-3 py-2 rounded-xl font-bold text-xs disabled:opacity-50 flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", color: "white" }}
              >
                {loading ? "..." : "تحدى ⚔️"}
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
