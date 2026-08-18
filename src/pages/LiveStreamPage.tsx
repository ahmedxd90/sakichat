// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ARAB_COUNTRIES } from "../data/countries";
import UserAvatar from "../components/UserAvatar";
import VideoLivePage from "./VideoLivePage";

interface LiveStreamPageProps {
  onBack: () => void;
  onRoomSelect?: (roomId: Id<"rooms">) => void;
  myRoom?: any;
}

function CreateLiveSheet({ onClose, onCreated, myRoom }: {
  onClose: () => void;
  onCreated: (id: Id<"livestreams">, channelName: string) => void;
  myRoom?: any;
}) {
  const startLivestream = useMutation(api.livestreams.startLivestream);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(myRoom?.name ?? "");

  const handleStart = async () => {
    setLoading(true);
    try {
      const result = await startLivestream({
        title: title || (myRoom?.name ?? "بث مباشر"),
        roomId: myRoom?._id,
      });
      onCreated(result.id, result.channelName);
    } catch (e: any) {
      alert(e.message ?? "فشل بدء البث");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end" dir="rtl">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full rounded-t-3xl overflow-hidden"
        style={{ background: "linear-gradient(180deg,#0a0018 0%,#150030 50%,#0a0018 100%)", border: "1px solid rgba(239,68,68,0.2)", borderBottom: "none" }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-white/8">
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center active:scale-90">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-white font-black text-lg">إنشاء بث مباشر</h2>
          </div>
          <div className="w-9" />
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Preview */}
          <div className="rounded-2xl overflow-hidden relative" style={{ aspectRatio: "16/9" }}>
            {myRoom?.coverUrl
              ? <img src={myRoom.coverUrl} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#1a0035,#3d0070,#1a0035)" }}>
                  <div className="text-center">
                    <div className="text-5xl mb-2">📡</div>
                    <p className="text-white/50 text-xs">معاينة البث</p>
                  </div>
                </div>
            }
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            {/* Live badge */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: "0 0 20px rgba(239,68,68,0.7)" }}>
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-white text-xs font-black tracking-wider">LIVE</span>
            </div>
            {/* Scan lines effect */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)"
            }} />
          </div>

          {/* Title Input */}
          <div>
            <label className="text-gray-400 text-xs font-bold mb-2 block flex items-center gap-1.5">
              <span className="text-red-400">✦</span> عنوان البث
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="أدخل عنوان البث..."
              className="w-full px-4 py-3.5 rounded-2xl text-white text-sm outline-none text-right placeholder-gray-600"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(239,68,68,0.25)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)"
              }}
            />
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-2">
            {myRoom && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(34,197,94,0.15)" }}>
                  <span className="text-base">🏠</span>
                </div>
                <div className="min-w-0">
                  <p className="text-gray-400 text-[10px]">الغرفة</p>
                  <p className="text-green-400 text-xs font-bold truncate">{myRoom.name}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2.5 p-3 rounded-2xl" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(168,85,247,0.15)" }}>
                <span className="text-base">📹</span>
              </div>
              <div>
                <p className="text-gray-400 text-[10px]">النوع</p>
                <p className="text-purple-400 text-xs font-bold">فيديو مباشر</p>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="p-3 rounded-2xl" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}>
            <p className="text-red-400 text-[10px] font-bold mb-1.5 flex items-center gap-1">
              <span>💡</span> نصائح للبث
            </p>
            <div className="space-y-1">
              {["تأكد من اتصال إنترنت جيد", "اختر مكاناً مضاءً جيداً", "تحدث بوضوح ومباشرة"].map((tip, i) => (
                <p key={i} className="text-gray-500 text-[10px] flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-red-500/50 flex-shrink-0" />
                  {tip}
                </p>
              ))}
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full py-4 rounded-2xl font-black text-white text-base active:scale-95 transition-all disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg,#ef4444,#dc2626,#b91c1c)",
              boxShadow: "0 0 40px rgba(239,68,68,0.5), 0 4px 15px rgba(0,0,0,0.3)",
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جاري البدء...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                <span>🔴 ابدأ البث المباشر</span>
              </div>
            )}
          </button>

          <div className="h-2" />
        </div>
      </div>
    </div>
  );
}

function LiveCard({ stream, onClick }: { stream: any; onClick: () => void }) {
  const country = ARAB_COUNTRIES.find((c) => c.code === stream.country);
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-2xl active:scale-[0.98] transition-all relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg,rgba(10,0,25,0.98),rgba(20,0,40,0.95))",
        border: "1px solid rgba(239,68,68,0.2)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
      }}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at 0% 50%, rgba(239,68,68,0.06) 0%, transparent 60%)"
      }} />

      {/* Room cover */}
      <div className="relative flex-shrink-0 rounded-xl overflow-hidden" style={{ width: 76, height: 76 }}>
        {stream.roomCoverUrl
          ? <img src={stream.roomCoverUrl} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#1a0035,#3d0070)" }}>
              <span className="text-2xl">📡</span>
            </div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        {/* Live badge */}
        <div className="absolute top-1 right-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
          style={{ background: "rgba(239,68,68,0.95)", boxShadow: "0 0 10px rgba(239,68,68,0.7)" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-white text-[8px] font-black">LIVE</span>
        </div>
        {/* Wave bars */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-0.5 pb-1 px-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-full flex-1"
              style={{
                height: `${4 + (i % 4) * 3}px`,
                background: "rgba(255,255,255,0.6)",
                animation: `live-wave ${0.3 + (i % 4) * 0.12}s ease-in-out infinite`,
                animationDelay: `${i * 0.05}s`,
              }} />
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 text-right">
        <p className="text-white font-black text-sm truncate mb-0.5">{stream.title}</p>
        {stream.roomName && (
          <p className="text-red-400/80 text-[10px] truncate mb-1.5 flex items-center gap-1 justify-end">
            <span>{stream.roomName}</span>
            <span>🏠</span>
          </p>
        )}
        <div className="flex items-center gap-1.5 mb-2 justify-end">
          <span className="text-gray-300 text-[10px] truncate">{stream.hostProfile?.name}</span>
          {stream.sakiId && <span className="text-purple-400 text-[9px] font-mono">#{stream.sakiId}</span>}
          <UserAvatar userId={stream.hostId} avatarUrl={stream.hostProfile?.avatarUrl} name={stream.hostProfile?.name} size={16} className="border border-red-500/50" />
        </div>
        <div className="flex items-center gap-3 justify-end">
          <div className="flex items-center gap-1">
            <span className="text-yellow-400 text-[10px]">🪙</span>
            <span className="text-yellow-300 text-[10px] font-bold">{stream.totalCoins ?? 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-red-400 text-[10px]">❤️</span>
            <span className="text-red-300 text-[10px] font-bold">{stream.likeCount ?? 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
            <span className="text-purple-300 text-[10px] font-bold">{stream.viewerCount ?? 0}</span>
          </div>
          {country && <span className="text-[11px]">{country.flag}</span>}
        </div>
      </div>

      {/* Animated waves on left */}
      <div className="flex-shrink-0 flex items-center gap-0.5 h-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-full w-1"
            style={{
              height: `${8 + (i % 3) * 7}px`,
              background: "linear-gradient(180deg,#ef4444,#dc2626)",
              animation: `live-wave ${0.4 + i * 0.1}s ease-in-out infinite`,
              animationDelay: `${i * 0.08}s`,
              boxShadow: "0 0 6px rgba(239,68,68,0.5)",
            }} />
        ))}
      </div>
    </button>
  );
}

export default function LiveStreamPage({ onBack, onRoomSelect, myRoom }: LiveStreamPageProps) {
  const livestreams = useQuery(api.livestreams.getActiveLivestreams);
  const myLivestream = useQuery(api.livestreams.getMyLivestream);
  const endLivestream = useMutation(api.livestreams.endLivestream);

  const [showCreate, setShowCreate] = useState(false);
  const [watchingId, setWatchingId] = useState<Id<"livestreams"> | null>(null);
  const [watchingRole, setWatchingRole] = useState<"host" | "audience">("audience");

  const handleOpenMyLive = () => {
    if (myLivestream) {
      setWatchingRole("host");
      setWatchingId(myLivestream._id);
    }
  };

  const handleCreated = (id: Id<"livestreams">) => {
    setShowCreate(false);
    setWatchingRole("host");
    setWatchingId(id);
  };

  const handleWatchStream = (stream: any) => {
    setWatchingRole("audience");
    setWatchingId(stream._id);
  };

  const handleEndLive = async () => {
    if (!myLivestream) return;
    await endLivestream({ livestreamId: myLivestream._id });
  };

  if (watchingId) {
    return (
      <VideoLivePage
        livestreamId={watchingId}
        role={watchingRole}
        onBack={() => setWatchingId(null)}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen" dir="rtl"
      style={{ background: "linear-gradient(180deg,#080015 0%,#0d001f 40%,#080015 100%)" }}>

      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl"
        style={{ background: "rgba(8,0,21,0.95)", borderBottom: "1px solid rgba(239,68,68,0.15)" }}>
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center active:scale-95 border border-white/10">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <div className="flex items-center gap-2.5">
            {/* Animated signal icon */}
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full animate-ping opacity-30"
                style={{ background: "rgba(239,68,68,0.5)" }} />
              <div className="w-3 h-3 rounded-full bg-red-500" />
            </div>
            <div>
              <h2 className="text-white font-black text-base leading-none">البث المباشر</h2>
              <p className="text-red-400/70 text-[10px]">Live Streaming</p>
            </div>
          </div>

          {myLivestream ? (
            <button onClick={handleOpenMyLive}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs text-white active:scale-95"
              style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: "0 0 15px rgba(239,68,68,0.5)" }}>
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              بثي الآن
            </button>
          ) : (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs text-white active:scale-95"
              style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: "0 0 15px rgba(239,68,68,0.4)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              بث جديد
            </button>
          )}
        </div>
      </div>

      {/* Hero Banner */}
      {!myLivestream && (
        <div className="mx-4 mt-4 p-4 rounded-2xl relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg,rgba(239,68,68,0.12),rgba(220,38,38,0.06))",
            border: "1px solid rgba(239,68,68,0.2)",
          }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse at 100% 50%, rgba(239,68,68,0.1) 0%, transparent 60%)"
          }} />
          <div className="flex items-center gap-4">
            <div className="flex-1 text-right">
              <h3 className="text-white font-black text-base mb-1">ابدأ بثك المباشر الآن! 🔴</h3>
              <p className="text-gray-400 text-xs leading-relaxed">شارك لحظاتك مع الجميع وتفاعل مع متابعيك في الوقت الفعلي</p>
            </div>
            <button onClick={() => setShowCreate(true)}
              className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center active:scale-90 transition-all"
              style={{
                background: "linear-gradient(135deg,#ef4444,#dc2626)",
                boxShadow: "0 0 25px rgba(239,68,68,0.6)",
              }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* My Active Live Banner */}
      {myLivestream && (
        <button onClick={handleOpenMyLive}
          className="mx-4 mt-4 p-4 rounded-2xl relative overflow-hidden active:scale-[0.98] transition-all"
          style={{
            background: "linear-gradient(135deg,rgba(239,68,68,0.18),rgba(220,38,38,0.1))",
            border: "1.5px solid rgba(239,68,68,0.5)",
            boxShadow: "0 0 30px rgba(239,68,68,0.2)",
          }}>
          {/* Pulse ring */}
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full animate-ping opacity-40"
            style={{ background: "rgba(239,68,68,0.6)" }} />
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-red-500/30">
              {myRoom?.coverUrl
                ? <img src={myRoom.coverUrl} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#1a0035,#3d0070)" }}>
                    <span className="text-xl">📡</span>
                  </div>
              }
            </div>
            <div className="flex-1 min-w-0 text-right">
              <div className="flex items-center gap-2 mb-0.5 justify-end">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(239,68,68,0.9)" }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-white text-[9px] font-black">مباشر الآن</span>
                </div>
              </div>
              <p className="text-white font-black text-sm truncate">{myLivestream.title}</p>
              <div className="flex items-center gap-3 mt-0.5 justify-end">
                <span className="text-gray-400 text-[10px]">🪙 {myLivestream.totalCoins ?? 0}</span>
                <span className="text-gray-400 text-[10px]">❤️ {myLivestream.likeCount ?? 0}</span>
                <span className="text-gray-400 text-[10px]">👁️ {myLivestream.viewerCount ?? 0}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                style={{ background: "rgba(239,68,68,0.4)", border: "1px solid rgba(239,68,68,0.5)" }}>
                دخول
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleEndLive(); }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
                إنهاء
              </button>
            </div>
          </div>
        </button>
      )}

      {/* Stats Bar */}
      {livestreams && livestreams.length > 0 && (
        <div className="mx-4 mt-4 flex items-center gap-3 p-3 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white font-black text-sm">{livestreams.length}</span>
            <span className="text-gray-400 text-xs">بث نشط</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
            <span className="text-purple-300 text-xs font-bold">
              {livestreams.reduce((s, l) => s + (l.viewerCount ?? 0), 0)} مشاهد
            </span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span className="text-yellow-400 text-xs">🪙</span>
            <span className="text-yellow-300 text-xs font-bold">
              {livestreams.reduce((s, l) => s + (l.totalCoins ?? 0), 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Live List */}
      <div className="flex-1 px-4 mt-4 pb-8 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 font-black text-xs">البثوث المباشرة</span>
          </div>
          {livestreams && livestreams.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black text-white"
              style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}>
              {livestreams.length}
            </span>
          )}
        </div>

        {!livestreams ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              </div>
            </div>
            <p className="text-gray-500 text-sm">جاري التحميل...</p>
          </div>
        ) : livestreams.length === 0 ? (
          <div className="text-center py-16">
            <div className="relative w-24 h-24 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{ background: "rgba(239,68,68,0.5)" }} />
              <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
                style={{ background: "rgba(239,68,68,0.08)", border: "2px dashed rgba(239,68,68,0.3)" }}>
                <span className="text-4xl">📡</span>
              </div>
            </div>
            <p className="text-white font-black text-xl mb-1">لا توجد بثوث مباشرة</p>
            <p className="text-gray-500 text-sm mb-6">كن أول من يبث الآن وابدأ التفاعل!</p>
            <button onClick={() => setShowCreate(true)}
              className="px-8 py-3.5 rounded-2xl font-black text-white text-sm active:scale-95 transition-all"
              style={{
                background: "linear-gradient(135deg,#ef4444,#dc2626)",
                boxShadow: "0 0 30px rgba(239,68,68,0.5)"
              }}>
              🔴 ابدأ البث الآن
            </button>
          </div>
        ) : (
          livestreams.map((stream) => (
            <LiveCard
              key={stream._id}
              stream={stream}
              onClick={() => handleWatchStream(stream)}
            />
          ))
        )}
      </div>

      {showCreate && (
        <CreateLiveSheet
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
          myRoom={myRoom}
        />
      )}

      <style>{`
        @keyframes live-wave {
          0%,100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
