import { useMemo, useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "../../lib/toast";

interface Props {
  roomId: string;
  isOwner: boolean;
  isAdmin: boolean;
  myProfile?: any;
  members: any[];
  onClose: () => void;
}

export default function KaraokeQueueSheet({ roomId, isOwner, isAdmin, myProfile, members, onClose }: Props) {
  const [songs, setSongs] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: s } = await supabase.from('room_music').select('*').eq('room_id', roomId);
      setSongs(s || []);
      const { data: q } = await supabase.from('karaoke_queue').select('*, track:room_music(*), singer:profiles(*)').eq('room_id', roomId).order('created_at', { ascending: true });
      setQueue(q || []);
    };
    fetchData();
    const sub = supabase.channel(`karaoke_${roomId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'karaoke_queue' }, fetchData).subscribe();
    return () => { sub.unsubscribe(); };
  }, [roomId]);

  const addToQueue = async (args: any) => {};
  const removeFromQueue = async (args: any) => {};
  const startNext = async (args: any) => {};
  const finishCurrent = async (args: any) => {};
  const clearQueue = async (args: any) => {};
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const canManage = isOwner || isAdmin;
  const mainSinger = members.find((member) => member.seatIndex === 0);
  const filteredSongs = useMemo(() => {
    const list = songs ?? [];
    const term = search.trim().toLocaleLowerCase();
    return term ? list.filter((song: any) => song.name.toLocaleLowerCase().includes(term)) : list;
  }, [songs, search]);
  const queuedTrackIds = new Set((queue ?? []).filter((entry: any) => entry.status === "queued").map((entry: any) => String(entry.trackId)));
  const active = (queue ?? []).find((entry: any) => entry.status === "singing");

  async function run(action: string, task: () => Promise<unknown>) {
    setBusy(action);
    try { await task(); } catch (error: any) { toast(error?.message || "تعذر تنفيذ العملية"); } finally { setBusy(null); }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/65 p-2 sm:items-center" dir="rtl">
      <div className="max-h-[88vh] w-full max-w-lg overflow-hidden rounded-[28px] border border-fuchsia-300/25 bg-[#18052c] text-white shadow-[0_0_60px_rgba(168,85,247,.35)]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <div className="flex items-center gap-2 text-lg font-black"><span className="text-fuchsia-300">♫</span> Karaoke</div>
            <p className="mt-0.5 text-[11px] text-fuchsia-200/70">اختَر أغنية وأضفها إلى دور الغناء</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/80">إغلاق</button>
        </div>

        <div className="max-h-[calc(88vh-70px)] overflow-y-auto p-4">
          <div className="mb-3 rounded-2xl border border-fuchsia-300/20 bg-fuchsia-950/40 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black tracking-widest text-fuchsia-200">MAIN MIC</p>
                <p className="mt-1 text-sm font-bold">{active ? `يغني الآن: ${active.singer?.name ?? active.singerName ?? "مغنٍ"}` : mainSinger ? `المقعد الرئيسي: ${mainSinger.profile?.name ?? "مغنٍ"}` : "المقعد الرئيسي فارغ"}</p>
              </div>
              <div className="flex gap-2">
                {canManage && <button type="button" disabled={!queue?.some((entry: any) => entry.status === "queued") || busy === "start"} onClick={() => run("start", () => startNext({ roomId }))} className="rounded-xl bg-fuchsia-500 px-3 py-2 text-xs font-black disabled:opacity-40">ابدأ التالي</button>}
                {active && (canManage || String(active.singerId) === String(myProfile?.userId)) && <button type="button" disabled={busy === "finish"} onClick={() => run("finish", () => finishCurrent({ roomId, queueId: active.id, skipped: canManage }))} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold">إنهاء</button>}
              </div>
            </div>
            {canManage && <button type="button" disabled={busy === "clear"} onClick={() => run("clear", () => clearQueue({ roomId }))} className="mt-3 text-[11px] text-rose-300 disabled:opacity-40">تفريغ الانتظار</button>}
          </div>

          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between"><h3 className="font-black">قائمة الانتظار <span className="text-xs text-fuchsia-300">({queue?.length ?? 0})</span></h3><span className="text-[10px] text-white/50">المغني يجب أن يجلس على MAIN MIC</span></div>
            {(queue ?? []).length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 p-4 text-center text-xs text-white/45">لا توجد أغانٍ في الانتظار</div> : <div className="space-y-2">{(queue ?? []).map((entry: any, index: number) => <div key={entry.id} className={`flex items-center gap-3 rounded-2xl border p-2.5 ${entry.status === "singing" ? "border-fuchsia-300/60 bg-fuchsia-500/15" : "border-white/10 bg-white/5"}`}><div className="flex h-7 w-7 items-center justify-center rounded-full bg-fuchsia-500/25 text-xs font-black">{entry.status === "singing" ? "♫" : index + 1}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{entry.track?.name ?? "أغنية محذوفة"}</p><p className="text-[10px] text-white/55">{entry.singer?.name ?? entry.singerName ?? "مغنٍ"}{entry.status === "singing" ? " · يغني الآن" : ""}</p></div>{entry.status === "queued" && (canManage || String(entry.singerId) === String(myProfile?.userId)) && <button type="button" onClick={() => run(`remove-${entry.id}`, () => removeFromQueue({ roomId, queueId: entry.id }))} className="rounded-lg bg-white/10 px-2 py-1 text-[10px]">إزالة</button>}</div>)}</div>}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between"><h3 className="font-black">الأغاني المتاحة</h3><span className="text-[10px] text-white/50">{songs?.length ?? 0} مقطع</span></div>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث عن أغنية..." className="mb-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm outline-none placeholder:text-white/35 focus:border-fuchsia-400/60" />
            {(songs ?? []).length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 p-4 text-center text-xs text-white/45">لا توجد أغانٍ مرفوعة لهذه الغرفة. ارفع مقطعًا من مشغل الموسيقى أولًا.</div> : <div className="space-y-2">{filteredSongs.map((song: any) => { const alreadyQueued = queuedTrackIds.has(String(song.id)); return <div key={song.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 p-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-400 to-violet-700 text-lg">♫</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{song.name}</p><p className="text-[10px] text-white/45">{song.duration ? `${Math.round(song.duration)} ثانية` : "مقطع صوتي"}</p></div><button type="button" disabled={alreadyQueued || busy === `add-${song.id}`} onClick={() => run(`add-${song.id}`, () => addToQueue({ roomId, trackId: song.id }))} className="rounded-xl bg-fuchsia-500/90 px-3 py-2 text-[11px] font-black disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40">{alreadyQueued ? "في الانتظار" : "أضف"}</button></div>; })}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
