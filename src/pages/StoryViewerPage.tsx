import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "../lib/toast";
import { Id } from "../../convex/_generated/dataModel";
import { getAristocracyConfig } from "../components/AristocracyBadge";
import { getVipConfig } from "../components/VipBadge";

interface StoryGroup {
  userId: string;
  profile: any;
  stories: any[];
  hasUnviewed: boolean;
}

interface StoryViewerPageProps {
  storyGroups: StoryGroup[];
  initialGroupIndex: number;
  myUserId?: string;
  onClose: () => void;
  onOpenChat: (userId: Id<"users">) => void;
}

function formatTimeAgo(ts: number) {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  const h = Math.floor(d / 3600000);
  if (m < 1) return "الآن";
  if (m < 60) return `${m} دقيقة`;
  if (h < 24) return `${h} ساعة`;
  return `${Math.floor(d / 86400000)} يوم`;
}

export default function StoryViewerPage({
  storyGroups,
  initialGroupIndex,
  myUserId,
  onClose,
  onOpenChat,
}: StoryViewerPageProps) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const viewStory = useMutation(api.stories.viewStory);
  const likeStory = useMutation(api.stories.likeStory);
  const replyToStory = useMutation(api.stories.replyToStory);
  const deleteStory = useMutation(api.stories.deleteStory);

  const group = storyGroups[groupIndex];
  const story = group?.stories[storyIndex];
  const isMyStory = story?.userId === myUserId;

  const viewers = useQuery(
    api.stories.getStoryViewers,
    isMyStory && story ? { storyId: story._id } : "skip"
  );

  const intervalRef = useRef<any>(null);
  const DURATION = story?.type === "video" ? 15000 : 5000;

  useEffect(() => {
    if (story && !isMyStory) {
      viewStory({ storyId: story._id }).catch(() => {});
    }
    setIsLiked(false);
  }, [story?._id]);

  useEffect(() => {
    setProgress(0);
    if (paused || showReply || showViewers) return;
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          goNext();
          return 0;
        }
        return p + (100 / (DURATION / 100));
      });
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [storyIndex, groupIndex, paused, showReply, showViewers]);

  const goNext = () => {
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex((i) => i + 1);
    } else if (groupIndex < storyGroups.length - 1) {
      setGroupIndex((g) => g + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
    } else if (groupIndex > 0) {
      setGroupIndex((g) => g - 1);
      setStoryIndex(storyGroups[groupIndex - 1].stories.length - 1);
    }
  };

  const handleLike = async () => {
    if (!story || isMyStory) return;
    setLikeAnim(true);
    setIsLiked(true);
    setTimeout(() => setLikeAnim(false), 800);
    try {
      await likeStory({ storyId: story._id });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !story) return;
    try {
      await replyToStory({ storyId: story._id, content: replyText.trim() });
      toast.success("تم إرسال الرد 💬");
      setReplyText("");
      setShowReply(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async () => {
    if (!story) return;
    if (!confirm("هل تريد حذف هذه القصة؟")) return;
    try {
      await deleteStory({ storyId: story._id });
      toast.success("تم الحذف");
      goNext();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (!group || !story) return null;

  const now = Date.now();
  const aristLevel = group.profile?.aristocracyLevel ?? 0;
  const aristExpiry = group.profile?.aristocracyExpiresAt ?? 0;
  const aristActive = aristLevel > 0 && aristExpiry > now;
  const aristCfg = aristActive ? getAristocracyConfig(aristLevel) : null;
  const vipCfg = group.profile?.isVip ? getVipConfig(group.profile.vipLevel) : null;
  const ringStyle = aristCfg
    ? { background: aristCfg.gradient, boxShadow: `0 0 16px ${aristCfg.glowColor}` }
    : vipCfg
      ? { background: vipCfg.frameGradient, boxShadow: `0 0 14px ${vipCfg.glowColor}` }
      : { background: "linear-gradient(135deg,#a855f7,#ec4899)" };
  const progressColor = aristCfg ? aristCfg.gradient : vipCfg ? vipCfg.frameGradient : "linear-gradient(90deg,#a855f7,#ec4899)";

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col select-none"
      style={{ background: "#000", touchAction: "none" }}
      dir="rtl"
    >
      {/* Background blur */}
      {story.type !== "text" && story.mediaUrl && (
        <div className="absolute inset-0 z-0">
          <img src={story.mediaUrl} alt="" className="w-full h-full object-cover blur-2xl scale-110 opacity-30" />
        </div>
      )}

      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-3 pt-safe pt-3">
        {group.stories.map((s: any, i: number) => (
          <div key={s._id} className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.2)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: i < storyIndex ? "100%" : i === storyIndex ? `${progress}%` : "0%",
                background: progressColor,
                transition: i === storyIndex ? "none" : undefined,
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-0 right-0 z-20 flex items-center justify-between px-4 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full p-[2.5px] flex-shrink-0" style={ringStyle}>
            <div className="w-full h-full rounded-full overflow-hidden bg-black">
              {group.profile?.avatarUrl
                ? <img src={group.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <span className="text-white text-sm font-black">{group.profile?.name?.[0] ?? "؟"}</span>
                  </div>
              }
            </div>
          </div>
          <div>
            <p className="text-white font-black text-sm leading-none drop-shadow-lg">{group.profile?.name ?? "مجهول"}</p>
            <p className="text-white/60 text-[10px] mt-0.5">{formatTimeAgo(story.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isMyStory && (
            <button onClick={() => setShowViewers(!showViewers)}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          )}
          {isMyStory && (
            <button onClick={handleDelete}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.3)", backdropFilter: "blur(12px)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
            </button>
          )}
          <button onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Story Content */}
      <div
        className="flex-1 relative flex items-center justify-center z-10"
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
      >
        {/* Tap zones */}
        <div className="absolute inset-0 flex z-10">
          <div className="flex-1" onClick={goPrev} />
          <div className="flex-1" onClick={goNext} />
        </div>

        {story.type === "text" ? (
          <div className="w-full h-full flex items-center justify-center p-10"
            style={{ background: story.textBg ?? "linear-gradient(135deg,#667eea,#764ba2)" }}>
            <p className="text-white font-black text-3xl text-center leading-relaxed"
              style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
              {story.text}
            </p>
          </div>
        ) : story.type === "video" ? (
          <video src={story.mediaUrl} className="w-full h-full object-cover" autoPlay muted={false} playsInline loop={false} />
        ) : (
          <img src={story.mediaUrl} alt="" className="w-full h-full object-contain" />
        )}

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-28 left-0 right-0 px-6 z-10">
            <div className="px-4 py-2 rounded-2xl text-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-sm font-semibold">{story.caption}</p>
            </div>
          </div>
        )}

        {/* Like animation */}
        {likeAnim && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <svg width="90" height="90" viewBox="0 0 24 24" fill="#ef4444" style={{ animation: "sv-heart-pop 0.8s ease-out forwards" }}>
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </div>
        )}
      </div>

      {/* Viewers Sheet */}
      {showViewers && isMyStory && (
        <div className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl max-h-[65vh] overflow-y-auto"
          style={{ background: "rgba(10,10,20,0.98)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-black text-base">المشاهدون</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-black" style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7" }}>
                {story.viewsCount ?? 0}
              </span>
            </div>
            <button onClick={() => setShowViewers(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-4 space-y-3">
            {!viewers ? (
              <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : viewers.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">لا أحد شاهد قصتك بعد</p>
            ) : viewers.map((v: any) => (
              <div key={v._id} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-900 flex-shrink-0">
                  {v.profile?.avatarUrl
                    ? <img src={v.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-white font-black">{v.profile?.name?.[0] ?? "؟"}</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold truncate">{v.profile?.name ?? "مجهول"}</p>
                  <p className="text-gray-500 text-xs">{formatTimeAgo(v.createdAt)}</p>
                </div>
                {v.liked && <span className="text-red-400 text-lg">❤️</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      {!isMyStory && (
        <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-8 pt-6"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)" }}>
          {showReply ? (
            <div className="flex gap-2 items-center" style={{ animation: "sv-slide-up 0.2s ease-out" }}>
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReply()}
                placeholder={`رد على ${group.profile?.name ?? ""}...`}
                autoFocus
                className="flex-1 rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
              />
              <button onClick={handleReply} disabled={!replyText.trim()}
                className="w-11 h-11 rounded-2xl flex items-center justify-center disabled:opacity-40 active:scale-90 transition-transform"
                style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
              </button>
              <button onClick={() => setShowReply(false)}
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.1)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={() => setShowReply(true)}
                className="flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold text-white"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                <span>رد على القصة...</span>
              </button>
              <button onClick={handleLike}
                className="w-12 h-12 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
                style={isLiked
                  ? { background: "rgba(239,68,68,0.25)", border: "1px solid rgba(239,68,68,0.4)" }
                  : { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill={isLiked ? "#ef4444" : "none"} stroke={isLiked ? "#ef4444" : "white"} strokeWidth="2"
                  style={{ transition: "all 0.2s", transform: isLiked ? "scale(1.15)" : "scale(1)" }}>
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              </button>
              <button onClick={() => onOpenChat(group.userId as Id<"users">)}
                className="w-12 h-12 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes sv-heart-pop { 0%{transform:scale(0.3);opacity:1} 50%{transform:scale(1.5)} 100%{transform:scale(1.2);opacity:0} }
        @keyframes sv-slide-up { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
