import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";

interface RoomMusicSheetProps {
  roomId: string;
  isOwner: boolean;
  activeMusicUrl?: string;
  activeMusicName?: string;
  musicVolume?: number;
  onClose: () => void;
}

export default function RoomMusicSheet({ roomId, isOwner, activeMusicUrl, activeMusicName, musicVolume, onClose }: RoomMusicSheetProps) {
  const [tracks, setTracks] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [vol, setVol] = useState(musicVolume ?? 80);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchTracks = async () => {
    const { data } = await supabase.from('room_music').select('*').eq('room_id', roomId).order('created_at', { ascending: false });
    setTracks(data || []);
  };

  useEffect(() => {
    fetchTracks();
  }, [roomId]);

  // Sync volume
  useEffect(() => { setVol(musicVolume ?? 80); }, [musicVolume]);

  // Play active music for this user
  useEffect(() => {
    if (activeMusicUrl) {
      if (!audioRef.current) audioRef.current = new Audio();
      if (audioRef.current.src !== activeMusicUrl) {
        audioRef.current.src = activeMusicUrl;
        audioRef.current.loop = true;
        audioRef.current.volume = (musicVolume ?? 80) / 100;
        audioRef.current.play().catch(() => {});
      }
    } else {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    }
    return () => {};
  }, [activeMusicUrl]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = vol / 100;
  }, [vol]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) { toast.error("يرجى اختيار ملف صوتي"); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error("حجم الملف يجب أن يكون أقل من 20 ميجابايت"); return; }
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("يجب تسجيل الدخول");

      const fileExt = file.name.split('.').pop();
      const fileName = `${roomId}-${Math.random()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage.from('room_music').upload(fileName, file);
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('room_music').getPublicUrl(data.path);
      const name = file.name.replace(/\.[^/.]+$/, "");
      
      const { error } = await supabase.from('room_music').insert({
        room_id: roomId,
        name,
        audio_url: publicUrl,
        uploader_id: user.id
      });
      if (error) throw error;
      
      toast.success("تم رفع الموسيقى ✅");
      fetchTracks();
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const handlePlay = async (trackId: string) => {
    try {
      const track = tracks.find(t => t.id === trackId);
      if (!track) return;
      await supabase.from('rooms').update({
        active_music_url: track.audio_url,
        active_music_name: track.name,
        music_volume: vol
      }).eq('id', roomId);
      setPlayingId(trackId);
      toast.success("تم تشغيل الموسيقى 🎵");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleStop = async () => {
    try {
      await supabase.from('rooms').update({
        active_music_url: null,
        active_music_name: null
      }).eq('id', roomId);
      setPlayingId(null);
      toast.success("تم إيقاف الموسيقى");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleVolumeChange = async (v: number) => {
    setVol(v);
    if (audioRef.current) audioRef.current.volume = v / 100;
    try { await supabase.from('rooms').update({ music_volume: v }).eq('id', roomId); } catch {}
  };

  const handleDelete = async (trackId: string) => {
    try {
      const track = tracks.find(t => t.id === trackId);
      if (track) {
        const path = track.audio_url.split('/').pop();
        if (path) await supabase.storage.from('room_music').remove([path]);
      }
      await supabase.from('room_music').delete().eq('id', trackId);
      toast.success("تم حذف المقطع");
      fetchTracks();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative rounded-t-3xl border-t border-purple-500/30 animate-slide-up-sheet flex flex-col"
        style={{ height: "80vh", background: "linear-gradient(180deg,#0d0020 0%,#0a0015 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-purple-500/40 rounded-full" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-purple-500/20 flex-shrink-0">
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎵</span>
            <span className="text-white font-bold text-sm">موسيقى الغرفة</span>
          </div>
          {isOwner && (
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
              {uploading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span>+ رفع</span>}
            </button>
          )}
          {!isOwner && <div className="w-16" />}
        </div>
        <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFileSelect} />

        {/* Now playing */}
        {activeMusicUrl && activeMusicName && (
          <div className="mx-4 mt-3 rounded-2xl px-4 py-3 flex-shrink-0"
            style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
                <span className="text-lg">🎵</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold truncate">{activeMusicName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-purple-400 text-[10px]">🔊 يعمل الآن</span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="w-0.5 rounded-full bg-purple-400"
                        style={{ height: `${6 + i * 2}px`, animation: `cpWave ${0.4 + i * 0.1}s ease-in-out infinite alternate` }} />
                    ))}
                  </div>
                </div>
              </div>
              {isOwner && (
                <button onClick={handleStop} className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#ef4444"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
                </button>
              )}
            </div>
            {/* Volume slider - owner only */}
            {isOwner && (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-purple-400 text-xs">🔈</span>
                <input type="range" min={0} max={100} value={vol}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: "#a855f7" }} />
                <span className="text-purple-400 text-xs">🔊</span>
                <span className="text-white text-xs font-bold w-8 text-center">{vol}%</span>
              </div>
            )}
          </div>
        )}

        {/* Track list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
          {!tracks || tracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <span className="text-5xl">🎵</span>
              <p className="text-gray-400 text-sm text-center">لا توجد موسيقى بعد</p>
              {isOwner && <p className="text-gray-600 text-xs text-center">اضغط "+ رفع" لإضافة موسيقى</p>}
            </div>
          ) : (
            tracks.map((track) => {
              const isActive = activeMusicUrl === track.audio_url;
              return (
                <div key={track.id} className="flex items-center gap-3 rounded-2xl px-3 py-3"
                  style={isActive
                    ? { background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)" }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: isActive ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "rgba(255,255,255,0.08)" }}>
                    {isActive
                      ? <div className="flex gap-0.5 items-end h-5">{[1,2,3].map(i => <div key={i} className="w-1 rounded-full bg-white" style={{ height: `${8+i*4}px`, animation: `cpWave ${0.3+i*0.15}s ease-in-out infinite alternate` }} />)}</div>
                      : <span className="text-base">🎵</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isActive ? "text-purple-300" : "text-white"}`}>{track.name}</p>
                    <p className="text-gray-500 text-[10px]">{isActive ? "يعمل الآن ▶" : "موسيقى"}</p>
                  </div>
                  {isOwner && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isActive ? (
                        <button onClick={handleStop} className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="#ef4444"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
                        </button>
                      ) : (
                        <button onClick={() => handlePlay(track.id)} className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="6,3 20,12 6,21" /></svg>
                        </button>
                      )}
                      <button onClick={() => handleDelete(track.id)} className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
