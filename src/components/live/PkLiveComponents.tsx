import { useEffect, useState } from "react";
import UserAvatar from "../UserAvatar";

export function PkInvitePopup({ invite, onAccept, onReject }: any) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60" dir="rtl">
      <div className="mx-6 w-[min(360px,calc(100vw-40px))] rounded-3xl bg-white p-6 text-center shadow-2xl border border-blue-100">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 border border-blue-100">
          <span className="text-2xl">PK</span>
        </div>
        <p className="text-lg font-black text-slate-900">دعوة تحدي PK</p>
        <p className="mt-2 text-sm text-slate-500">{invite.inviterName || "مضيف"} دعاك لمواجهة PK مباشرة</p>
        <div className="mt-5 flex gap-3">
          <button onClick={onReject} className="flex-1 rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-700">إلغاء</button>
          <button onClick={onAccept} className="flex-1 rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200">تأكيد</button>
        </div>
      </div>
    </div>
  );
}

export function PkInviteSheet({ streams, currentStreamId, onInvite, onClose }: any) {
  const [search, setSearch] = useState("");
  const list = streams.filter((stream: any) => stream._id !== currentStreamId && (!search.trim() || `${stream.title} ${stream.hostProfile?.name} ${stream.sakiId}`.toLowerCase().includes(search.trim().toLowerCase())));
  return (
    <div className="absolute inset-0 z-50 flex items-end bg-black/50" dir="rtl">
      <div className="w-full rounded-t-3xl bg-white p-5 shadow-2xl border-t border-blue-100">
        <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-black text-slate-900">تحدي PK</h3><button onClick={onClose} className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">×</button></div>
        <p className="mb-3 text-xs text-slate-500">اختر مضيفًا لإرسال دعوة تحدي. سيظهر المضيفان في نفس الجولة.</p>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث باسم المضيف أو SAKI ID" className="mb-3 w-full rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-right text-sm text-slate-900 outline-none focus:border-blue-400" />
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {list.map((stream: any) => (
            <div key={stream._id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
              <UserAvatar userId={stream.hostId} avatarUrl={stream.hostProfile?.avatarUrl} name={stream.hostProfile?.name} size={42} className="border-2 border-blue-100" />
              <div className="min-w-0 flex-1 text-right"><p className="truncate text-sm font-black text-slate-900">{stream.hostProfile?.name || "مضيف"}</p><p className="truncate text-xs text-slate-500">{stream.title}</p></div>
              <button onClick={() => onInvite(stream._id)} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white">دعوة PK</button>
            </div>
          ))}
          {list.length === 0 && <p className="py-8 text-center text-sm text-slate-400">لا يوجد مضيفون متاحون الآن</p>}
        </div>
      </div>
    </div>
  );
}

export function PkBattleOverlay({ session, currentStreamId, currentStream, opponentStream, onEnd }: any) {
  const [remaining, setRemaining] = useState(Math.max(0, Math.ceil((session.endsAt - Date.now()) / 1000)));
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(Math.max(0, Math.ceil((session.endsAt - Date.now()) / 1000))), 1000);
    return () => window.clearInterval(timer);
  }, [session.endsAt]);
  const aIsCurrent = session.streamAId === currentStreamId;
  const leftScore = aIsCurrent ? session.scoreA : session.scoreB;
  const rightScore = aIsCurrent ? session.scoreB : session.scoreA;
  const leftStream = aIsCurrent ? currentStream : opponentStream;
  const rightStream = aIsCurrent ? opponentStream : currentStream;
  const total = Math.max(1, leftScore + rightScore);
  const leftWidth = `${Math.round((leftScore / total) * 100)}%`;
  return (
    <div className="absolute left-3 right-3 top-24 z-30" dir="rtl">
      <div className="rounded-3xl border border-white/30 bg-slate-950/80 p-2 shadow-2xl backdrop-blur-xl">
        <div className="mb-2 flex items-center justify-between px-2"><span className="text-xs font-black text-white">تحدي PK</span><span className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</span>{onEnd && <button onClick={onEnd} className="text-[10px] font-bold text-white/70">إنهاء</button>}</div>
        <div className="flex gap-1">
          {[{ stream: leftStream, score: leftScore, color: "from-blue-500 to-cyan-400" }, { stream: rightStream, score: rightScore, color: "from-fuchsia-500 to-violet-500" }].map((side: any, index) => (
            <div key={index} className="min-w-0 flex-1 rounded-2xl bg-white/10 p-2 text-center"><UserAvatar userId={side.stream?.hostId} avatarUrl={side.stream?.hostProfile?.avatarUrl} name={side.stream?.hostProfile?.name} size={34} className="mx-auto border-2 border-white/70" /><p className="mt-1 truncate text-[10px] font-bold text-white">{side.stream?.hostProfile?.name || "مضيف"}</p><p className="text-sm font-black text-white">{side.score.toLocaleString()}</p></div>
          ))}
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-fuchsia-500/70"><div className={`h-full bg-gradient-to-r ${aIsCurrent ? "from-blue-400 to-cyan-300" : "from-fuchsia-400 to-violet-300"}`} style={{ width: leftWidth }} /></div>
      </div>
    </div>
  );
}

// Style reminder: PK uses a dark stage overlay with Saki blue/fuchsia score accents.
