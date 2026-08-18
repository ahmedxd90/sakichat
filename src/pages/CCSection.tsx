// @ts-nocheck
export default function CCSection({ ccUsers, ccOthers, search, setSearch, ccLoading, handleToggleCC }: any) {
  const all = [
    ...ccUsers.map((u: any) => ({ ...u, isCC: true })),
    ...ccOthers.map((u: any) => ({ ...u, isCC: false })),
  ];
  return (
    <div className="space-y-3">
      <div className="rounded-2xl p-4" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)" }}>
        <p className="text-blue-400 font-black text-sm">🎬 صانع محتوى ({ccUsers.length})</p>
        <p className="text-gray-400 text-xs">إدارة صانعي المحتوى</p>
      </div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 بحث..."
        className="w-full px-4 py-3 rounded-2xl text-sm text-white placeholder-gray-500 outline-none"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
      />
      {all.map((u: any) => (
        <div
          key={u.userId}
          className="flex items-center gap-3 p-3 rounded-2xl"
          style={{
            background: u.isCC ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${u.isCC ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.08)"}`,
          }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate">{u.name}</p>
            <p className="text-gray-500 text-xs">{u.sakiId}</p>
          </div>
          <button
            onClick={() => handleToggleCC(u.userId, u.isCC)}
            disabled={ccLoading === u.userId}
            className="px-3 py-2 rounded-xl text-[11px] font-black active:scale-95 disabled:opacity-50"
            style={
              u.isCC
                ? { background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.35)" }
                : { background: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.35)" }
            }
          >
            {ccLoading === u.userId ? "..." : u.isCC ? "❌ إزالة" : "🎬 تعيين"}
          </button>
        </div>
      ))}
    </div>
  );
}
