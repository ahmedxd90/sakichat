// @ts-nocheck
import { useState } from "react";
import PKDurationPicker from "./PKDurationPicker";

interface PKChallengeTabProps {
  availableRooms: any[] | undefined;
  canManage: boolean;
  loading: boolean;
  selectedDuration: number;
  onDurationChange: (v: number) => void;
  onSendChallenge: (roomId: string) => void;
}

export default function PKChallengeTab({
  availableRooms,
  canManage,
  loading,
  selectedDuration,
  onDurationChange,
  onSendChallenge,
}: PKChallengeTabProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {!canManage && (
        <div
          className="rounded-2xl p-4 text-center"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <p className="text-red-400 text-sm">فقط مالك الغرفة أو المشرف يمكنه إرسال تحدي PK</p>
        </div>
      )}

      <div>
        <p className="text-gray-400 text-xs mb-2 font-medium">مدة المعركة</p>
        <PKDurationPicker value={selectedDuration} onChange={onDurationChange} />
      </div>

      <div>
        <p className="text-gray-400 text-xs mb-2 font-medium">اختر غرفة للتحدي</p>
        {!availableRooms ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : availableRooms.length === 0 ? (
          <div
            className="rounded-2xl p-4 text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p className="text-gray-500 text-sm">لا توجد غرف متاحة للتحدي حالياً</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {availableRooms.map((r) => (
              <button
                key={r._id}
                onClick={() => setSelectedRoomId(r._id)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all"
                style={
                  selectedRoomId === r._id
                    ? { background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.4)" }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }
                }
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-orange-800 to-red-900 flex items-center justify-center">
                  {r.coverUrl
                    ? <img src={r.coverUrl} alt="" className="w-full h-full object-cover" />
                    : <span className="text-lg">🏠</span>
                  }
                </div>
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-white font-bold text-sm truncate">{r.name}</p>
                  <p className="text-gray-500 text-xs">{r.memberCount ?? 0} عضو</p>
                </div>
                {selectedRoomId === r._id && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(249,115,22,0.3)", border: "1px solid #f97316" }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {canManage && (
        <button
          onClick={() => selectedRoomId && onSendChallenge(selectedRoomId)}
          disabled={loading || !selectedRoomId}
          className="w-full py-4 rounded-2xl font-black text-base transition-all disabled:opacity-50"
          style={{
            background: selectedRoomId ? "linear-gradient(135deg,#f97316,#ea580c)" : "rgba(255,255,255,0.08)",
            color: "white",
          }}
        >
          {loading ? "جارٍ الإرسال..." : selectedRoomId ? "إرسال التحدي ⚔️" : "اختر غرفة أولاً"}
        </button>
      )}
    </div>
  );
}
