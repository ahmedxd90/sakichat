// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "../../lib/toast";

interface RoomMusicPlayerProps {
  roomId: Id<"rooms">;
  isCp: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isOnSeat: boolean;
  activeMusicUrl?: string;
  activeMusicName?: string;
  musicVolume?: number;
  onClose: () => void;
}

// ── Global audio — persists across renders, plays for ALL users ──
let globalAudio: HTMLAudioElement | null = null;
let globalCurrentUrl: string | undefined = undefined;
let globalIsMuted = false;
let globalVolume = 80;

export function stopGlobalMusic() {
  if (globalAudio) { globalAudio.pause(); globalAudio.src = ""; }
  globalCurrentUrl = undefined;
}

export function toggleGlobalMusicMute(): boolean {
  globalIsMuted = !globalIsMuted;
  if (globalAudio) globalAudio.volume = globalIsMuted ? 0 : globalVolume / 100;
  return globalIsMuted;
}

export function isGlobalMusicMuted(): boolean {
  return globalIsMuted;
}

export function useRoomMusicGlobal(activeMusicUrl?: string, musicVolume?: number, _isOnSeat?: boolean) {
  useEffect(() => {
    // Stop if no music
    if (!activeMusicUrl) {
      if (globalAudio) { globalAudio.pause(); globalAudio.src = ""; }
      globalCurrentUrl = undefined;
      return;
    }
    globalVolume = musicVolume ?? 80;
    // Same track — just update volume
    if (globalCurrentUrl === activeMusicUrl) {
      if (globalAudio && !globalIsMuted) globalAudio.volume = globalVolume / 100;
      return;
    }
    if (!globalAudio) globalAudio = new Audio();
    globalAudio.pause();
    globalAudio.src = activeMusicUrl;
    globalAudio.loop = true;
    globalAudio.volume = globalIsMuted ? 0 : globalVolume / 100;
    const playAttempt = globalAudio.play();
    if (playAttempt !== undefined) {
      playAttempt.catch(() => {
        const retry = () => {
          globalAudio?.play().catch(() => {});
          document.removeEventListener('touchstart', retry);
          document.removeEventListener('click', retry);
        };
        document.addEventListener('touchstart', retry, { once: true });
        document.addEventListener('click', retry, { once: true });
      });
    }
    globalCurrentUrl = activeMusicUrl;
  }, [activeMusicUrl, musicVolume]);
}

export default function RoomMusicPlayer({
  roomId,
  isCp,
  isOwner,
  isAdmin,
  isOnSeat,
  activeMusicUrl,
  activeMusicName,
  musicVolume,
  onClose,
}: RoomMusicPlayerProps) {
  const canControl = isOwner || isAdmin;

  const myTracks = useQuery(api.roomMusic.getRoomMusicList, { roomId });
  const uploadMusic = useMutation(api.roomMusic.uploadMusic);
  const playMusic = useMutation(api.roomMusic.playMusic);
  const stopMusic = useMutation(api.roomMusic.stopMusic);
  const setVolumeMutation = useMutation(api.roomMusic.setMusicVolume);
  const deleteMusic = useMutation(api.roomMusic.deleteMusic);
  const generateUrl = useMutation(api.roomMusic.generateMusicUploadUrl);

  // Local audio for preview (personal player)
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const [localCurrentIndex, setLocalCurrentIndex] = useState<number>(-1);
  const [isLocalPlaying, setIsLocalPlaying] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const [localDuration, setLocalDuration] = useState(0);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [localVol, setLocalVol] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVol, setPrevVol] = useState(80);
  const [isRepeat, setIsRepeat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const tracks = myTracks ?? [];
  const filteredTracks = searchQuery
    ? tracks.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : tracks;

  // Init local audio
  useEffect(() => {
    if (!localAudioRef.current) {
      localAudioRef.current = new Audio();
    }
    const audio = localAudioRef.current;

    const onTimeUpdate = () => {
      if (audio.duration) {
        setLocalProgress((audio.currentTime / audio.duration) * 100);
        setLocalCurrentTime(audio.currentTime);
      }
    };
    const onDurationChange = () => setLocalDuration(audio.duration || 0);
    const onEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        handleLocalNext();
      }
    };
    const onPlay = () => setIsLocalPlaying(true);
    const onPause = () => setIsLocalPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [isRepeat]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localAudioRef.current) {
        localAudioRef.current.pause();
      }
    };
  }, []);

  const loadAndPlayLocal = (index: number) => {
    const track = filteredTracks[index];
    if (!track?.audioUrl) return;
    const audio = localAudioRef.current!;
    audio.src = track.audioUrl;
    audio.volume = isMuted ? 0 : localVol / 100;
    audio.play().catch(() => {});
    setLocalCurrentIndex(index);
    setLocalProgress(0);
    setLocalCurrentTime(0);
    // ── AUTO BROADCAST when owner/admin plays a track ──
    if (canControl) {
      playMusic({ roomId, trackId: track._id, volume: localVol }).catch(() => {});
    }
  };

  const handleLocalPlayPause = () => {
    const audio = localAudioRef.current!;
    if (localCurrentIndex === -1 && filteredTracks.length > 0) {
      loadAndPlayLocal(0);
      return;
    }
    if (isLocalPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  };

  const handleLocalNext = () => {
    if (filteredTracks.length === 0) return;
    const next = (localCurrentIndex + 1) % filteredTracks.length;
    loadAndPlayLocal(next);
  };

  const handleLocalPrev = () => {
    if (filteredTracks.length === 0) return;
    const prev = (localCurrentIndex - 1 + filteredTracks.length) % filteredTracks.length;
    loadAndPlayLocal(prev);
  };

  const handleProgressChange = (val: number) => {
    const audio = localAudioRef.current!;
    if (audio.duration) {
      audio.currentTime = (val / 100) * audio.duration;
      setLocalProgress(val);
    }
  };

  const handleVolumeChange = (val: number) => {
    setLocalVol(val);
    setIsMuted(val === 0);
    if (localAudioRef.current) localAudioRef.current.volume = val / 100;
    // Update room volume for broadcast
    if (canControl && activeMusicUrl) {
      setVolumeMutation({ roomId, volume: val }).catch(() => {});
    }
  };

  const handleToggleMute = () => {
    const audio = localAudioRef.current!;
    if (isMuted) {
      setIsMuted(false);
      setLocalVol(prevVol || 80);
      audio.volume = (prevVol || 80) / 100;
    } else {
      setPrevVol(localVol);
      setIsMuted(true);
      audio.volume = 0;
    }
  };

  const handleStopBroadcast = async () => {
    try {
      await stopMusic({ roomId });
      toast.success("تم إيقاف الموسيقى");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) { toast.error("يرجى اختيار ملف صوتي"); return; }
    if (file.size > 30 * 1024 * 1024) { toast.error("حجم الملف يجب أن يكون أقل من 30 ميجابايت"); return; }
    setUploading(true);
    setUploadProgress(10);
    try {
      const uploadUrl = await generateUrl();
      setUploadProgress(40);
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      setUploadProgress(80);
      const { storageId } = await res.json();
      const name = file.name.replace(/\.[^/.]+$/, "");
      await uploadMusic({ roomId, name, audioStorageId: storageId });
      setUploadProgress(100);
      toast.success(`تم رفع "${name}" ✅`);
    } catch (e: any) { toast.error(e.message); }
    finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (trackId: Id<"roomMusic">, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteMusic({ trackId, roomId });
      toast.success(`تم حذف "${name}"`);
    } catch (e: any) { toast.error(e.message); }
  };

  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const currentTrack = localCurrentIndex >= 0 ? filteredTracks[localCurrentIndex] : null;
  const isRoomPlaying = !!activeMusicUrl;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end" onClick={onClose} dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative flex flex-col animate-slide-up-sheet"
        style={{
          height: "90vh",
          background: "#ffffff",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 20px",
          borderBottom: "1px solid #f0f0f0",
          flexShrink: 0,
        }}>
          <button onClick={onClose} style={{ color: "#888", fontSize: 20, background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <span style={{ fontWeight: 700, fontSize: 17, color: "#222" }}>الموسيقى الخاصة بي</span>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              width: 30, height: 30, borderRadius: "50%",
              border: "1.5px solid #888",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "none", cursor: "pointer", color: "#888",
            }}
          >
            {uploading
              ? <div style={{ width: 12, height: 12, border: "2px solid #888", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            }
          </button>
        </div>
        <input ref={fileRef} type="file" accept="audio/*,audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/aac" className="hidden" onChange={handleFileSelect} />

        {/* Upload progress */}
        {uploading && (
          <div style={{ padding: "6px 20px", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "#888" }}>جارٍ الرفع...</span>
              <span style={{ fontSize: 11, color: "#888" }}>{uploadProgress}%</span>
            </div>
            <div style={{ height: 3, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${uploadProgress}%`, background: "#eeb318", borderRadius: 4, transition: "width 0.3s" }} />
            </div>
          </div>
        )}

        {/* Room broadcast status */}
        {isRoomPlaying && activeMusicName && (
          <div style={{
            margin: "8px 16px 0",
            padding: "8px 14px",
            background: "rgba(238,179,24,0.08)",
            border: "1px solid rgba(238,179,24,0.3)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse 1.5s infinite" }} />
            <span style={{ fontSize: 11, color: "#666", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              يعمل للجميع: {activeMusicName}
            </span>
            {canControl && (
              <button onClick={handleStopBroadcast} style={{
                fontSize: 10, color: "#ef4444", background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8,
                padding: "2px 8px", cursor: "pointer", fontWeight: 700,
              }}>إيقاف</button>
            )}
          </div>
        )}

        {/* ── SEARCH ── */}
        <div style={{ padding: "10px 20px", flexShrink: 0 }}>
          <div style={{
            background: "#f5f5f5",
            borderRadius: 25,
            display: "flex",
            alignItems: "center",
            padding: "9px 15px",
            gap: 8,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن الأغاني"
              style={{
                border: "none", background: "transparent", outline: "none",
                width: "100%", fontSize: 14, color: "#333", fontFamily: "inherit",
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", color: "#bbb", cursor: "pointer", padding: 0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* ── SONG LIST ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 10px" }}>
          {!myTracks ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
              <div style={{ width: 28, height: 28, border: "3px solid #eeb318", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : filteredTracks.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "50px 0", gap: 12 }}>
              <div style={{ fontSize: 48, opacity: 0.3 }}>🎵</div>
              <p style={{ color: "#aaa", fontSize: 14, margin: 0, fontWeight: 600 }}>
                {searchQuery ? `لا توجد نتائج لـ "${searchQuery}"` : "مكتبتك فارغة"}
              </p>
              {!searchQuery && (
                <>
                  <p style={{ color: "#ccc", fontSize: 12, margin: 0 }}>اضغط + لإضافة موسيقى من جهازك</p>
                  <button
                    onClick={() => fileRef.current?.click()}
                    style={{
                      marginTop: 4, padding: "10px 24px", borderRadius: 20,
                      background: "#eeb318", color: "#fff", fontWeight: 700,
                      fontSize: 13, border: "none", cursor: "pointer",
                    }}>
                    رفع موسيقى
                  </button>
                </>
              )}
            </div>
          ) : (
            filteredTracks.map((track, index) => {
              const isActive = localCurrentIndex === index;
              const isRoomActive = activeMusicUrl === track.audioUrl;
              return (
                <div
                  key={track._id}
                  onClick={() => loadAndPlayLocal(index)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "13px 0",
                    cursor: "pointer",
                    borderBottom: "1px solid #f9f9f9",
                    gap: 0,
                  }}
                >
                  {/* Index / playing indicator */}
                  <div style={{ width: 36, flexShrink: 0, textAlign: "center" }}>
                    {isActive && isLocalPlaying ? (
                      <div style={{ display: "flex", gap: 2, alignItems: "flex-end", justifyContent: "center", height: 16 }}>
                        {[1,2,3].map(i => (
                          <div key={i} style={{
                            width: 3, borderRadius: 2, background: "#eeb318",
                            height: `${6 + i * 3}px`,
                            animation: `pk-wave ${0.3 + i * 0.15}s ease-in-out infinite alternate`,
                          }} />
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: isActive ? "#eeb318" : "#b3b3b3", fontSize: 13 }}>
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: 0, fontSize: 14, fontWeight: isActive ? 700 : 400,
                      color: isActive ? "#eeb318" : "#222",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {track.name}
                    </p>
                    {isRoomActive && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
                        <span style={{ fontSize: 10, color: "#22c55e" }}>يعمل للجميع</span>
                      </div>
                    )}
                  </div>

                  {/* Delete */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={(e) => handleDelete(track._id, track.name, e)}
                      style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── BOTTOM PLAYER ── */}
        <div style={{
          flexShrink: 0,
          background: "#f9f9f9",
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          padding: "16px 20px 20px",
          boxShadow: "0 -5px 15px rgba(0,0,0,0.05)",
        }}>
          {/* Now playing title */}
          <div style={{ textAlign: "center", fontSize: 13, color: "#888", marginBottom: 12, fontWeight: 500 }}>
            {currentTrack ? (
              <span style={{ color: "#333", fontWeight: 700 }}>{currentTrack.name}</span>
            ) : (
              <span>اختر أغنية للتشغيل</span>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 16 }}>
            <input
              type="range"
              min={0} max={100}
              value={localProgress}
              onChange={(e) => handleProgressChange(Number(e.target.value))}
              style={{
                WebkitAppearance: "none",
                width: "100%",
                height: 4,
                background: `linear-gradient(to left, #ddd ${100 - localProgress}%, #eeb318 ${100 - localProgress}%)`,
                borderRadius: 5,
                outline: "none",
                cursor: "pointer",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: "#bbb" }}>{formatTime(localCurrentTime)}</span>
              <span style={{ fontSize: 10, color: "#bbb" }}>{formatTime(localDuration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {/* Repeat */}
            <button
              onClick={() => setIsRepeat(!isRepeat)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: isRepeat ? "#eeb318" : "#999", fontSize: 18, padding: 4,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="17 1 21 5 17 9"/>
                <path d="M3 11V9a4 4 0 014-4h14"/>
                <polyline points="7 23 3 19 7 15"/>
                <path d="M21 13v2a4 4 0 01-4 4H3"/>
              </svg>
            </button>

            {/* Next */}
            <button
              onClick={handleLocalNext}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#999", padding: 4 }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={handleLocalPlayPause}
              style={{
                width: 56, height: 56,
                border: "1.5px solid #ddd",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "#fff",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              {isLocalPlaying ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#555">
                  <rect x="6" y="4" width="4" height="16" rx="1"/>
                  <rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#555">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              )}
            </button>

            {/* Prev */}
            <button
              onClick={handleLocalPrev}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#999", padding: 4 }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>
              </svg>
            </button>

            {/* Volume + Mute */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
              <button
                onClick={handleToggleMute}
                style={{ background: "none", border: "none", cursor: "pointer", color: isMuted ? "#ef4444" : "#999", padding: 4 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  {isMuted
                    ? <><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>
                    : localVol < 50
                      ? <path d="M15.54 8.46a5 5 0 010 7.07"/>
                      : <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
                  }
                </svg>
              </button>
              <input
                type="range"
                min={0} max={100}
                value={isMuted ? 0 : localVol}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                style={{
                  WebkitAppearance: "none",
                  width: 70, height: 3,
                  background: `linear-gradient(to left, #ddd ${100 - (isMuted ? 0 : localVol)}%, #eeb318 ${100 - (isMuted ? 0 : localVol)}%)`,
                  borderRadius: 5,
                  outline: "none",
                  cursor: "pointer",
                }}
              />
            </div>
          </div>

          {/* Stop broadcast button (owner/admin only, when music is playing) */}
          {canControl && isRoomPlaying && (
            <button
              onClick={handleStopBroadcast}
              style={{
                marginTop: 14,
                width: "100%",
                padding: "10px 0",
                borderRadius: 14,
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#ef4444",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#ef4444"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
              إيقاف الموسيقى للجميع
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px; height: 12px;
          background: #eeb318;
          border-radius: 50%;
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 12px; height: 12px;
          background: #eeb318;
          border-radius: 50%;
          border: none;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
