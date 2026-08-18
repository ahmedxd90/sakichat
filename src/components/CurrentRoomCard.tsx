// @ts-nocheck
export default function CurrentRoomCard({ room, onSelect }: { room: any; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-2xl px-3 py-3 active:scale-[0.98] overflow-hidden relative"
    >
      {room.coverUrl && (
        <div className="absolute inset-0 opacity-15">
          <img src={room.coverUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f1a]/90 to-transparent" />
        </div>
      )}
      <div className="relative z-10 flex items-center gap-3 w-full">
        {room.coverUrl ? (
          <img
            src={room.coverUrl}
            alt=""
            className="w-11 h-11 rounded-xl object-cover flex-shrink-0 border border-green-500/40"
          />
        ) : (
          <div className="w-11 h-11 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0 border border-green-500/40">
            <span className="text-xl">🎙️</span>
          </div>
        )}
        <div className="flex-1 text-right min-w-0">
          <div className="flex items-center justify-end gap-1 mb-0.5">
            <p className="text-green-400 text-xs font-bold">متواجد الآن</p>
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          </div>
          <p className="text-white text-sm font-bold truncate">{room.roomName}</p>
          <p className="text-gray-400 text-[10px]">{room.memberCount} عضو</p>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4ade80"
          strokeWidth="2"
          className="flex-shrink-0"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </div>
    </button>
  );
}
