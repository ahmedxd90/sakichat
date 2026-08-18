// @ts-nocheck
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef, useEffect, useCallback } from "react";
import { VipName, VipBadge, SuperAdminBadge } from "../components/VipBadge";
import { AristocracyName, AristocracyBadge, getAristocracyConfig } from "../components/AristocracyBadge";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import UserAvatar from "../components/UserAvatar";
import LevelBadgeInline from "../components/LevelBadgeInline";

function formatCount(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

// ── Icons ──────────────────────────────────────────────────────────────────
const HeartIcon = ({ filled, size = 26 }: { filled?: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#ff3b5c" : "none"} stroke={filled ? "#ff3b5c" : "white"} strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

const CommentIcon = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

const ShareIcon = ({ size = 24, color = "white" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const EyeIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const VolumeOnIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
  </svg>
);

const VolumeOffIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const TrashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);

const PlayIcon = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="white">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const PauseIcon = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="white">
    <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

const MusicNoteIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
    <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
  </svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const CloseIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const SendIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

// ── Main Page ─────────────────────────────────────────────────────────────
export default function ReelsPage({ setCurrentPage, onUserSelect }: { setCurrentPage: (p: any) => void; onUserSelect: (userId: any) => void }) {
  const reelsAll = useQuery(api.reels.getReels);
  const reelsFollowing = useQuery(api.reels.getReelsByFollowing);
  const myProfile = useQuery(api.profiles.getMyProfile);
  const incrementViews = useMutation(api.reels.viewReel);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [globalMuted, setGlobalMuted] = useState(false);
  const [tab, setTab] = useState<"for_you" | "following">("for_you");
  const observer = useRef<IntersectionObserver | null>(null);

  const reels = tab === "for_you" ? reelsAll : reelsFollowing;

  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-id");
            if (id) {
              setActiveId(id);
              incrementViews({ reelId: id as Id<"reels"> });
            }
          }
        });
      },
      { threshold: 0.7 }
    );
    return () => observer.current?.disconnect();
  }, [incrementViews]);

  const loading = reels === undefined;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-black overflow-hidden relative" dir="rtl">

      {/* ── Top Bar ── */}
      <div
        className="absolute top-0 left-0 right-0 z-30 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)", paddingBottom: 60 }}
      >
        <div className="flex items-center justify-between px-4 pt-12 pb-3 pointer-events-auto">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-2xl p-1 border border-white/10">
            <button
              onClick={() => setTab("following")}
              className="px-4 py-1.5 text-sm font-bold rounded-xl transition-all"
              style={tab === "following"
                ? { background: "linear-gradient(135deg,#a855f7,#ec4899)", color: "white", boxShadow: "0 2px 12px rgba(168,85,247,0.5)" }
                : { color: "rgba(255,255,255,0.5)" }
              }
            >
              متابَعون
            </button>
            <button
              onClick={() => setTab("for_you")}
              className="px-4 py-1.5 text-sm font-bold rounded-xl transition-all"
              style={tab === "for_you"
                ? { background: "linear-gradient(135deg,#a855f7,#ec4899)", color: "white", boxShadow: "0 2px 12px rgba(168,85,247,0.5)" }
                : { color: "rgba(255,255,255,0.5)" }
              }
            >
              لك ✨
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setGlobalMuted((m) => !m)}
              className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              {globalMuted ? <VolumeOffIcon /> : <VolumeOnIcon />}
            </button>
            <button
              onClick={() => setCurrentPage("create-reel")}
              className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)", boxShadow: "0 4px 16px rgba(168,85,247,0.55)" }}
            >
              <PlusIcon />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-full bg-black flex flex-col items-center justify-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping" />
            <div className="w-16 h-16 rounded-full border-2 border-t-purple-500 border-purple-500/20 animate-spin" />
          </div>
          <p className="text-white/40 text-sm">جارٍ التحميل...</p>
        </div>
      ) : !reels || reels.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center"
          style={{ background: "radial-gradient(ellipse at center, #1a0a2e 0%, #0a0a0f 100%)" }}>
          <div
            className="w-28 h-28 rounded-3xl flex items-center justify-center mb-6 relative"
            style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.2),rgba(236,72,153,0.2))", border: "2px dashed rgba(168,85,247,0.4)" }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
              <PlusIcon />
            </div>
          </div>
          <h3 className="text-white text-xl font-black mb-2">
            {tab === "following" ? "لا يوجد ريلز من المتابَعين" : "لا يوجد أي ريلز حالياً"}
          </h3>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">
            {tab === "following" ? "تابع أشخاصاً لترى ريلزاتهم هنا" : "كن أول من يشارك فيديو رائع!"}
          </p>
          <button
            onClick={() => setCurrentPage("create-reel")}
            className="px-8 py-3.5 rounded-2xl text-white font-black shadow-lg active:scale-95 transition-transform flex items-center gap-2"
            style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)", boxShadow: "0 8px 30px rgba(168,85,247,0.4)" }}
          >
            <PlusIcon />
            رفع فيديو الآن
          </button>
        </div>
      ) : (
        <div className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
          {reels.map((reel) => (
            <ReelItem
              key={reel._id}
              reel={reel}
              isActive={activeId === reel._id}
              observer={observer.current}
              myProfile={myProfile}
              globalMuted={globalMuted}
              setGlobalMuted={setGlobalMuted}
              onUserSelect={onUserSelect}
            />
          ))}
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes heart-pop {
          0% { transform: scale(0) rotate(-20deg); opacity: 1; }
          40% { transform: scale(1.4) rotate(8deg); opacity: 1; }
          70% { transform: scale(1.1) rotate(-3deg); opacity: 1; }
          100% { transform: scale(1.2) rotate(0deg); opacity: 0; }
        }
        .animate-heart-pop { animation: heart-pop 1s ease-out forwards; }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes disc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
        @keyframes like-bounce { 0%,100%{transform:scale(1)} 30%{transform:scale(1.5)} 60%{transform:scale(0.9)} }
        @keyframes glow-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,59,92,0.4)} 50%{box-shadow:0 0 0 8px rgba(255,59,92,0)} }
        @keyframes float-up { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(-60px);opacity:0} }
      `}</style>
    </div>
  );
}

// ── Reel Item ─────────────────────────────────────────────────────────────
function ReelItem({ reel, isActive, observer, myProfile, globalMuted, setGlobalMuted, onUserSelect }: {
  reel: any;
  isActive: boolean;
  observer: IntersectionObserver | null;
  myProfile: any;
  globalMuted: boolean;
  setGlobalMuted: (v: boolean) => void;
  onUserSelect: (userId: any) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showHeart, setShowHeart] = useState(false);
  const [heartPos, setHeartPos] = useState({ x: 50, y: 50 });
  const [openComments, setOpenComments] = useState(false);
  const [openShare, setOpenShare] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [likeAnim, setLikeAnim] = useState(false);
  const [localLiked, setLocalLiked] = useState<boolean | null>(null);
  const [localLikes, setLocalLikes] = useState<number | null>(null);
  const lastTap = useRef(0);

  const likeReel = useMutation(api.reels.likeReel);
  const deleteReel = useMutation(api.reels.deleteReel);

  const isLiked = localLiked !== null ? localLiked : (reel.likedBy?.includes(myProfile?.userId) ?? false);
  const likesCount = localLikes !== null ? localLikes : (reel.likes || 0);
  const isMe = reel.userId === myProfile?.userId;
  const aristocracyLevel = reel.profile?.aristocracyLevel;
  const aristocracyConfig = getAristocracyConfig(aristocracyLevel);
  const hasAristo = aristocracyLevel && aristocracyLevel > 0 && reel.profile?.aristocracyExpiresAt && reel.profile.aristocracyExpiresAt > Date.now();

  const sakiIdColor = hasAristo && aristocracyConfig
    ? aristocracyConfig.color
    : reel.profile?.isVip
      ? "#c084fc"
      : "rgba(255,255,255,0.45)";

  useEffect(() => {
    if (containerRef.current && observer) observer.observe(containerRef.current);
    return () => { if (containerRef.current && observer) observer.unobserve(containerRef.current); };
  }, [observer]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.muted = globalMuted;
      video.play().catch(() => { video.muted = true; video.play().catch(() => {}); });
      setIsPaused(false);
    } else {
      video.pause();
      video.currentTime = 0;
      setProgress(0);
    }
  }, [isActive]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = globalMuted;
  }, [globalMuted]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  }, []);

  const triggerLike = (x?: number, y?: number) => {
    if (!isLiked) {
      setLocalLiked(true);
      setLocalLikes((localLikes !== null ? localLikes : reel.likes || 0) + 1);
      likeReel({ reelId: reel._id });
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 700);
    }
    if (x !== undefined && y !== undefined) setHeartPos({ x, y });
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);
  };

  const handleTap = (e: React.MouseEvent) => {
    const now = Date.now();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    if (now - lastTap.current < 300) {
      triggerLike(x, y);
    } else {
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) { video.play().catch(() => {}); setIsPaused(false); }
      else { video.pause(); setIsPaused(true); }
    }
    lastTap.current = now;
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiked) {
      setLocalLiked(false);
      setLocalLikes((localLikes !== null ? localLikes : reel.likes || 0) - 1);
      likeReel({ reelId: reel._id });
    } else {
      triggerLike();
    }
  };

  const formatDur = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  return (
    <div ref={containerRef} data-id={reel._id} className="h-screen w-full snap-start relative flex-shrink-0 bg-black">
      {/* Video */}
      <div className="absolute inset-0 w-full h-full" onClick={handleTap}>
        {reel.videoUrl ? (
          <video
            ref={videoRef}
            src={reel.videoUrl}
            className="w-full h-full object-cover"
            loop muted={globalMuted} playsInline
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: "radial-gradient(ellipse at center, #1a0a2e, #000)" }}>
            <span className="text-white/20 text-lg">لا يوجد فيديو</span>
          </div>
        )}
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 30%, transparent 55%, rgba(0,0,0,0.3) 100%)" }} />

      {/* Pause/Play indicator */}
      {isPaused && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", border: "2px solid rgba(255,255,255,0.2)" }}
          >
            <PlayIcon />
          </div>
        </div>
      )}

      {/* Double tap heart */}
      {showHeart && (
        <div
          className="absolute z-40 pointer-events-none"
          style={{ left: `${heartPos.x}%`, top: `${heartPos.y}%`, transform: "translate(-50%,-50%)" }}
        >
          <div className="animate-heart-pop">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="#ff3b5c" className="drop-shadow-2xl" style={{ filter: "drop-shadow(0 0 20px rgba(255,59,92,0.8))" }}>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-20" style={{ height: 3, background: "rgba(255,255,255,0.1)" }}>
        <div
          className="h-full transition-none"
          style={{ width: `${progress}%`, background: "linear-gradient(90deg,#a855f7,#ec4899,#f43f5e)" }}
        />
      </div>

      {/* ── Right side action buttons ── */}
      <div className="absolute left-3 bottom-32 flex flex-col items-center gap-4 z-20">

        {/* Like */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1.5 active:scale-75 transition-transform"
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all"
            style={isLiked
              ? { background: "rgba(255,59,92,0.25)", border: "1.5px solid rgba(255,59,92,0.6)", animation: likeAnim ? "like-bounce 0.4s ease" : "none" }
              : { background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)" }
            }
          >
            <HeartIcon filled={isLiked} />
          </div>
          <span className="text-white text-xs font-black drop-shadow" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
            {formatCount(likesCount)}
          </span>
        </button>

        {/* Comments */}
        <button
          onClick={(e) => { e.stopPropagation(); setOpenComments(true); }}
          className="flex flex-col items-center gap-1.5 active:scale-75 transition-transform"
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <CommentIcon />
          </div>
          <span className="text-white text-xs font-black drop-shadow" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
            {formatCount(reel.commentsCount || 0)}
          </span>
        </button>

        {/* Share */}
        <button
          onClick={(e) => { e.stopPropagation(); setOpenShare(true); }}
          className="flex flex-col items-center gap-1.5 active:scale-75 transition-transform"
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <ShareIcon />
          </div>
          <span className="text-white text-xs font-black drop-shadow" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
            مشاركة
          </span>
        </button>

        {/* Views */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <EyeIcon />
          </div>
          <span className="text-white text-xs font-black drop-shadow" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
            {formatCount(reel.views || 0)}
          </span>
        </div>

        {/* Mute */}
        <button
          onClick={(e) => { e.stopPropagation(); setGlobalMuted(!globalMuted); }}
          className="flex flex-col items-center gap-1.5 active:scale-75 transition-transform"
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all"
            style={globalMuted
              ? { background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.4)" }
              : { background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)" }
            }
          >
            {globalMuted ? <VolumeOffIcon /> : <VolumeOnIcon />}
          </div>
        </button>

        {/* Delete (owner only) */}
        {isMe && (
          <button
            onClick={async (e) => {
              e.stopPropagation();
              if (!confirm("هل تريد حذف هذا الريل؟")) return;
              try { await deleteReel({ reelId: reel._id }); } catch (err: any) { toast.error(err.message); }
            }}
            className="w-12 h-12 rounded-2xl flex items-center justify-center active:scale-75 transition-transform"
            style={{ background: "rgba(239,68,68,0.2)", border: "1.5px solid rgba(239,68,68,0.4)" }}
          >
            <TrashIcon />
          </button>
        )}
      </div>

      {/* ── Bottom info ── */}
      <div className="absolute bottom-20 right-4 left-20 z-20 space-y-3">

        {/* Profile row */}
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (reel.profile?.isPrivateProfile) {
                toast("🔒 هذا الملف الشخصي خاص", { duration: 2500 });
                return;
              }
              onUserSelect(reel.userId);
            }}
            className="flex-shrink-0 active:scale-90 transition-transform"
          >
            <div className="relative" style={{ overflow: "visible" }}>
              <UserAvatar
                userId={reel.userId}
                avatarUrl={reel.profile?.avatarUrl}
                name={reel.profile?.name}
                size={46}
                showFrame={true}
                isSuperAdmin={reel.profile?.isSuperAdmin}
                isVip={reel.profile?.isVip ?? false}
                vipLevel={reel.profile?.vipLevel ?? null}
              />
              {/* Online dot */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-black z-20" />
            </div>
          </button>

          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {reel.vipConfig?.titleUrl && (
                <img src={reel.vipConfig.titleUrl} alt="لقب" style={{ height: 14, objectFit: "contain" }} />
              )}
              {hasAristo && aristocracyConfig
                ? <AristocracyName name={reel.profile?.name || "مجهول"} level={aristocracyLevel} className="text-sm font-black drop-shadow" />
                : <VipName name={reel.profile?.name || "مجهول"} level={reel.profile?.vipLevel} vipConfig={reel.vipConfig} />
              }
              {hasAristo && <AristocracyBadge level={aristocracyLevel} size="sm" />}
              {reel.profile?.isVip && !hasAristo && <VipBadge size="sm" level={reel.profile?.vipLevel} vipConfig={reel.vipConfig} />}
              {reel.profile?.isSuperAdmin && <SuperAdminBadge size="sm" />}
            </div>
            <span className="text-[11px] font-mono font-bold drop-shadow" style={{ color: sakiIdColor }}>
              #{reel.profile?.sakiId}
            </span>
            <LevelBadgeInline wealthLevel={reel.profile?.wealthLevel} charismaLevel={reel.profile?.charismaLevel} size="xs" />
          </div>
        </div>

        {/* Caption */}
        {reel.caption && (
          <div
            className="rounded-2xl px-3 py-2"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-white text-sm leading-relaxed font-medium line-clamp-2">
              {reel.caption.split(" ").map((word: string, i: number) =>
                word.startsWith("#")
                  ? <span key={i} className="text-purple-300 font-bold">{word} </span>
                  : word + " "
              )}
            </p>
          </div>
        )}

        {/* Hashtag pills */}
        {reel.hashtags && reel.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {reel.hashtags.slice(0, 4).map((tag: string, i: number) => (
              <span
                key={i}
                className="inline-flex items-center gap-0.5 text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: "rgba(168,85,247,0.2)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.35)", backdropFilter: "blur(8px)" }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Music bar */}
        <div
          className="flex items-center gap-2 rounded-2xl px-3 py-2"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)", animation: "disc-spin 3s linear infinite" }}
          >
            <MusicNoteIcon />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-white/70 text-xs whitespace-nowrap" style={{ animation: "marquee 8s linear infinite" }}>
              🎵 {reel.profile?.name ?? "مجهول"} • ريل أصلي
            </p>
          </div>
          {duration > 0 && (
            <span
              className="text-white/60 text-[10px] flex-shrink-0 px-2 py-0.5 rounded-lg font-mono font-bold"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              {formatDur(duration)}
            </span>
          )}
        </div>
      </div>

      {/* Comments sheet */}
      {openComments && (
        <ReelCommentsSheet reelId={reel._id} onClose={() => setOpenComments(false)} myProfile={myProfile} />
      )}

      {/* Share sheet */}
      {openShare && (
        <ReelShareSheet reel={reel} onClose={() => setOpenShare(false)} myProfile={myProfile} />
      )}
    </div>
  );
}

// ── Share Sheet ───────────────────────────────────────────────────────────
function ReelShareSheet({ reel, onClose, myProfile }: { reel: any; onClose: () => void; myProfile: any }) {
  const conversations = useQuery(api.messages.getConversations);
  const sendReelShare = useMutation(api.reelShare.sendDirectReelShare);
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const filtered = conversations?.filter((c: any) =>
    !search || c.otherProfile?.name?.toLowerCase().includes(search.toLowerCase()) || c.otherProfile?.sakiId?.includes(search)
  );

  const handleShare = async (receiverId: string) => {
    if (sending || sent.has(receiverId)) return;
    setSending(receiverId);
    try {
      await sendReelShare({
        receiverId: receiverId as any,
        reelId: reel._id,
        reelVideoUrl: reel.videoUrl ?? "",
        reelCaption: reel.caption ?? "",
        reelThumbnailUrl: reel.thumbnailUrl ?? "",
      });
      setSent((s) => new Set([...s, receiverId]));
      toast.success("تم إرسال الريل! 🎉");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(null);
    }
  };

  const getOtherId = (conv: any) => conv.otherId ?? conv.otherUserId;

  return (
    <div className="fixed inset-x-0 top-0 bottom-0 z-[60] flex flex-col justify-end" style={{ pointerEvents: "none" }}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" style={{ pointerEvents: "auto" }} onClick={onClose} />
      <div
        className="relative rounded-t-3xl flex flex-col"
        style={{
          background: "linear-gradient(180deg,#1a1030,#0f0a1a)",
          border: "1px solid rgba(168,85,247,0.2)",
          maxHeight: "82vh",
          pointerEvents: "auto",
          animation: "slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-white/15 rounded-full" />
        </div>

        {/* Top glow */}
        <div style={{ height: 2, background: "linear-gradient(90deg,transparent,#a855f7,#ec4899,transparent)", margin: "0 20px 0" }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 mt-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)", boxShadow: "0 4px 12px rgba(168,85,247,0.4)" }}>
              <ShareIcon size={18} />
            </div>
            <div>
              <span className="text-white font-black text-base">مشاركة الريل</span>
              <p className="text-gray-500 text-xs">أرسل لأصدقائك</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <CloseIcon />
          </button>
        </div>

        {/* Reel preview */}
        <div className="mx-4 mb-3 rounded-2xl overflow-hidden flex items-center gap-3 p-3"
          style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
          <div className="w-14 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-black relative">
            {reel.thumbnailUrl
              ? <img src={reel.thumbnailUrl} alt="" className="w-full h-full object-cover" />
              : reel.videoUrl
                ? <video src={reel.videoUrl} className="w-full h-full object-cover" muted />
                : <div className="w-full h-full flex items-center justify-center bg-purple-900/30">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  </div>
            }
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-bold truncate">{reel.profile?.name ?? "مجهول"}</p>
            {reel.caption && <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{reel.caption}</p>}
            {reel.hashtags?.length > 0 && (
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {reel.hashtags.slice(0, 3).map((t: string, i: number) => (
                  <span key={i} className="text-purple-400 text-[10px] font-bold">#{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 rounded-2xl px-3 py-2.5"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <SearchIcon />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن صديق..."
              className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Friends list */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {!conversations ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered?.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600 text-sm">لا توجد محادثات</p>
            </div>
          ) : (
            filtered?.map((conv: any) => {
              const otherId = getOtherId(conv);
              const isSent = sent.has(otherId);
              const isSending = sending === otherId;
              return (
                <div key={otherId}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all"
                  style={{
                    background: isSent ? "rgba(74,222,128,0.06)" : "rgba(255,255,255,0.04)",
                    border: isSent ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(255,255,255,0.06)"
                  }}>
                  <UserAvatar userId={otherId} avatarUrl={conv.otherProfile?.avatarUrl} name={conv.otherProfile?.name} size={42} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate">{conv.otherProfile?.name ?? "مجهول"}</p>
                    <p className="text-gray-500 text-xs font-mono">#{conv.otherProfile?.sakiId}</p>
                  </div>
                  <button
                    onClick={() => handleShare(otherId)}
                    disabled={!!sending || isSent}
                    className="px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 disabled:opacity-60 flex items-center gap-1.5 min-w-[72px] justify-center"
                    style={isSent
                      ? { background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)" }
                      : { background: "linear-gradient(135deg,#a855f7,#ec4899)", color: "white" }
                    }
                  >
                    {isSending ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isSent ? (
                      <><CheckIcon />تم</>
                    ) : (
                      <><SendIcon />إرسال</>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── Comments Sheet ────────────────────────────────────────────────────────
function ReelCommentsSheet({ reelId, onClose, myProfile }: {
  reelId: Id<"reels">;
  onClose: () => void;
  myProfile: any;
}) {
  const comments = useQuery(api.reels.getReelComments, { reelId });
  const addComment = useMutation(api.reels.addReelComment);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleAdd = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await addComment({ reelId, content: text.trim() });
      setText("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  function formatTimeAgo(ts: number) {
    const d = Date.now() - ts, m = Math.floor(d / 60000), h = Math.floor(d / 3600000), dy = Math.floor(d / 86400000);
    if (m < 1) return "الآن"; if (m < 60) return `${m}د`; if (h < 24) return `${h}س`; if (dy < 7) return `${dy}ي`;
    return new Date(ts).toLocaleDateString("ar-SA");
  }

  return (
    <div className="fixed inset-x-0 top-0 bottom-16 z-[60] flex flex-col justify-end" style={{ pointerEvents: "none" }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" style={{ pointerEvents: "auto" }} onClick={onClose} />
      <div
        className="relative rounded-t-3xl flex flex-col"
        style={{
          background: "linear-gradient(180deg,#1a1030,#0f0a1a)",
          border: "1px solid rgba(168,85,247,0.15)",
          height: "75%",
          pointerEvents: "auto",
          animation: "slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-white/15 rounded-full" />
        </div>

        {/* Top glow */}
        <div style={{ height: 2, background: "linear-gradient(90deg,transparent,#a855f7,#ec4899,transparent)", margin: "0 20px 4px" }} />

        <div className="flex items-center justify-between px-5 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)", boxShadow: "0 4px 12px rgba(168,85,247,0.4)" }}>
              <CommentIcon size={18} />
            </div>
            <div>
              <span className="text-white font-black text-base">التعليقات</span>
              {comments && comments.length > 0 && (
                <span className="text-xs text-purple-400 mr-2 font-bold">{comments.length}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {!comments ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "rgba(168,85,247,0.1)", border: "1px dashed rgba(168,85,247,0.3)" }}>
                <CommentIcon />
              </div>
              <p className="text-gray-400 text-sm font-bold">لا توجد تعليقات بعد</p>
              <p className="text-gray-600 text-xs mt-1">كن أول من يعلّق! 💬</p>
            </div>
          ) : (
            comments.map((c) => {
              const isVip = c.profile?.isVip ?? false;
              const aristLevel = c.profile?.aristocracyLevel;
              const aristCfg = getAristocracyConfig(aristLevel);
              const hasAristo = aristLevel && aristLevel > 0 && c.profile?.aristocracyExpiresAt && c.profile.aristocracyExpiresAt > Date.now();
              const sakiColor = hasAristo && aristCfg ? aristCfg.color : isVip ? "#c084fc" : "#4b5563";
              return (
                <div key={c._id} className="flex gap-3">
                  <UserAvatar userId={c.userId} avatarUrl={c.profile?.avatarUrl} name={c.profile?.name} size={36} />
                  <div className="flex-1 min-w-0 rounded-2xl rounded-tr-sm px-3 py-2.5"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      {hasAristo && aristCfg
                        ? <AristocracyName name={c.profile?.name ?? "مجهول"} level={aristLevel} className="text-sm font-bold" />
                        : isVip
                          ? <VipName name={c.profile?.name ?? "مجهول"} />
                          : <span className="text-white text-sm font-bold">{c.profile?.name ?? "مجهول"}</span>
                      }
                      {isVip && !hasAristo && <VipBadge size="sm" />}
                      {hasAristo && <AristocracyBadge level={aristLevel} size="sm" />}
                      <span className="text-[10px] font-mono font-bold" style={{ color: sakiColor }}>#{c.profile?.sakiId}</span>
                      <span className="text-gray-600 text-[10px] mr-auto">{formatTimeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-gray-200 text-sm leading-relaxed">{c.content}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="px-4 py-3 border-t border-white/5"
          style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-2.5">
            {myProfile?.userId && (
              <UserAvatar userId={myProfile.userId} avatarUrl={myProfile?.avatarUrl} name={myProfile?.name} size={34} />
            )}
            <div className="flex-1 flex items-center gap-2 rounded-2xl px-3.5 py-2.5"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAdd()}
                placeholder="أضف تعليقاً..."
                className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleAdd}
                disabled={!text.trim() || sending}
                className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-40 flex-shrink-0 active:scale-90 transition-transform"
                style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}
              >
                {sending
                  ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <SendIcon />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
