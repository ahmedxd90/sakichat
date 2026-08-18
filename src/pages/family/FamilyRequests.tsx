// @ts-nocheck
interface Props {
  pendingReqs: any[];
  isOwner: boolean;
  onBack: () => void;
  onRespond: (id: any, approve: boolean) => void;
}

export default function FamilyRequests({ pendingReqs, isOwner, onBack, onRespond }: Props) {
  return (
    <div className="flex flex-col h-full bg-[#0a0a14] overflow-hidden" dir="rtl">
      <div className="sticky top-0 z-40 bg-[#0a0a14]/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center active:scale-95">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          <h2 className="text-white font-bold text-base">📋 طلبات الانضمام</h2>
          <div className="w-9"/>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-10">
        {!pendingReqs || pendingReqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3"><span className="text-6xl">📭</span><p className="text-gray-400 text-sm">لا توجد طلبات انضمام معلقة</p></div>
        ) : pendingReqs.map(req => (
          <div key={req._id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center flex-shrink-0">
              {req.profile?.avatarUrl ? <img src={req.profile.avatarUrl} alt="" className="w-full h-full object-cover"/> : <span className="text-white font-bold text-lg">{req.profile?.name?.[0]??"؟"}</span>}
            </div>
            <div className="flex-1 min-w-0"><p className="text-white text-sm font-bold">{req.profile?.name??"مجهول"}</p><p className="text-gray-500 text-xs font-mono">#{req.profile?.sakiId}</p></div>
            <div className="flex gap-2">
              <button onClick={() => onRespond(req._id, true)} className="w-9 h-9 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center active:scale-95"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg></button>
              <button onClick={() => onRespond(req._id, false)} className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center active:scale-95"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
