// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import UserAvatar from "../components/UserAvatar";
import { useAgoraVideoLive } from "../hooks/useAgoraVideoLive";
import RoomGiftsSheet from "../components/room/RoomGiftsSheet";
import { formatNumber } from "../lib/formatNumber";
import { VipBadge, VipName, getVipChatBubbleStyle, getVipConfig } from "../components/VipBadge";
import { AristocracyBadge, AristocracyName, getAristocracyChatBubbleStyle, getAristocracyConfig } from "../components/AristocracyBadge";
import { ARAB_COUNTRIES } from "../data/countries";

interface VideoLivePageProps {
  livestreamId: Id<"livestreams">;
  role: "host" | "audience";
  onBack: () => void;
}

// ── Icons ──────────────────────────────────────────────────────────
const Ic = {
  Close: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  MicOn: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></svg>,
  MicOff: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v4M8 23h8"/></svg>,
  CamOn: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  CamOff: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  Flip: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="7" r="3"/><circle cx="7" cy="17" r="3"/></svg>,
  Send: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Gift: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  Heart: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Viewers: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Coins: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  Duet: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/></svg>,
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Ban: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  Mute: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v4M8 23h8"/></svg>,
  Kick: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

// ── Floating Hearts ───────────────────────────────────────────────
function FloatingHearts({ hearts }: { hearts: Array<{ id: number; x: number }> }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 25 }}>
      {hearts.map((h) => (
        <div key={h.id} className="absolute text-2xl" style={{ left: `${h.x}%`, bottom: "18%", animation: "floatHeart 2.5s ease-out forwards" }}>❤️</div>
      ))}
    </div>
  );
}

// ── Chat Bubble ───────────────────────────────────────────────────
function ChatBubble({ msg, onAvatarClick }: { msg: any; onAvatarClick?: (msg: any) => void }) {
  const vipLevel = msg.vipLevel;
  const aristocracyLevel = msg.aristocracyLevel;
  let bubbleStyle: any = { background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)" };
  if (aristocracyLevel) bubbleStyle = getAristocracyChatBubbleStyle(aristocracyLevel);
  else if (vipLevel) bubbleStyle = getVipChatBubbleStyle(vipLevel);
  const isGift = msg.type === "gift";
  return (
    <div className="flex items-start gap-1.5 mb-1">
      <button className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden border border-white/20 active:scale-90 transition-transform" onClick={() => onAvatarClick?.(msg)}>
        <UserAvatar userId={msg.userId} name={msg.senderName} avatarUrl={msg.senderAvatarUrl} size={28} />
      </button>
      <div className="flex-1 min-w-0 px-2.5 py-1.5 rounded-2xl rounded-tl-sm" style={bubbleStyle}>
        <div className="flex items-center gap-1 flex-wrap mb-0.5">
          {aristocracyLevel ? (
            <><AristocracyName level={aristocracyLevel} className="text-[10px] font-black leading-none">{msg.senderName}</AristocracyName><AristocracyBadge level={aristocracyLevel} size="sm" /></>
          ) : vipLevel ? (
            <><VipName level={vipLevel} name={msg.senderName} /><VipBadge level={vipLevel} size="sm" /></>
          ) : (
            <span className="text-purple-300 text-[10px] font-bold">{msg.senderName}</span>
          )}
        </div>
        {isGift ? <span className="text-yellow-300 text-xs">🎁 {msg.content}</span> : <span className="text-white text-xs leading-snug">{msg.content}</span>}
      </div>
    </div>
  );
}

// ── Live User Profile Sheet ───────────────────────────────────────
function LiveUserProfileSheet({ user, isHost, livestreamId, liveBans, liveChatMutes, onClose, onSendGift }: any) {
  const banUser = useMutation(api.livestreams.banLiveViewer);
  const unbanUser = useMutation(api.livestreams.unbanLiveViewer);
  const muteUser = useMutation(api.livestreams.muteLiveChat);
  const unmuteUser = useMutation(api.livestreams.unmuteLiveChat);
  const kickUser = useMutation(api.livestreams.kickLiveViewer);
  const followUser = useMutation(api.social.followUser);
  const isFollowingQuery = useQuery(api.social.isFollowing, user?.userId ? { targetUserId: user.userId } : "skip");
  const [loading, setLoading] = useState<string | null>(null);
  const [localFollowing, setLocalFollowing] = useState<boolean | null>(null);
  const isFollowing = localFollowing !== null ? localFollowing : (isFollowingQuery ?? false);
  const isBanned = liveBans?.some((b: any) => b.userId === user?.userId);
  const isMuted = liveChatMutes?.some((m: any) => m.userId === user?.userId);
  const profile = user?.profile ?? user;
  const vipLevel = profile?.vipLevel;
  const aristocracyLevel = profile?.aristocracyLevel;
  const vipConfig = getVipConfig(vipLevel);
  const aristocracyConfig = getAristocracyConfig(aristocracyLevel && profile?.aristocracyExpiresAt > Date.now() ? aristocracyLevel : null);
  const accentColor = aristocracyConfig?.color || vipConfig?.nameColor || "#a855f7";
  const country = ARAB_COUNTRIES.find((c: any) => c.code === profile?.country);

  const handleAction = async (action: string) => {
    setLoading(action);
    try {
      if (action === "ban") await banUser({ livestreamId, targetUserId: user.userId });
      if (action === "unban") await unbanUser({ livestreamId, targetUserId: user.userId });
      if (action === "mute") await muteUser({ livestreamId, targetUserId: user.userId });
      if (action === "unmute") await unmuteUser({ livestreamId, targetUserId: user.userId });
      if (action === "kick") { await kickUser({ livestreamId, targetUserId: user.userId }); onClose(); }
      if (action === "follow") { const r = await followUser({ targetUserId: user.userId }); setLocalFollowing(r); }
    } catch (e: any) { alert(e.message); }
    setLoading(null);
  };

  if (!user) return null;
  return (
    <div className="absolute inset-0 z-50 flex items-end" dir="rtl" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full rounded-t-3xl overflow-hidden" style={{ background: "linear-gradient(180deg,#1a0035 0%,#0d0020 100%)", borderTop: `3px solid ${accentColor}`, boxShadow: `0 -8px 40px ${accentColor}40`, maxHeight: "80vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-12 h-1.5 rounded-full bg-white/20" /></div>
        {/* Cover */}
        <div className="relative h-24 overflow-hidden">
          {profile?.coverUrl ? <img src={profile.coverUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${accentColor}40, #0d0020)` }} />}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0d0020]" />
        </div>
        {/* Avatar + actions */}
        <div className="relative px-4 -mt-10">
          <div className="flex items-end justify-between">
            <div className="relative">
              <div className="rounded-full p-[3px]" style={{ background: `linear-gradient(135deg, ${accentColor}, #ec4899)`, boxShadow: `0 0 20px ${accentColor}60` }}>
                <div className="w-18 h-18 rounded-full overflow-hidden bg-gray-900" style={{ width: 72, height: 72 }}>
                  {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accentColor}40, #0d0020)` }}><span className="text-white font-black text-2xl">{profile?.name?.[0] ?? "؟"}</span></div>}
                </div>
              </div>
              {vipLevel && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2"><VipBadge level={vipLevel} size="sm" /></div>}
              {aristocracyLevel && !vipLevel && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2"><AristocracyBadge level={aristocracyLevel} size="sm" /></div>}
            </div>
            <div className="flex gap-2 pb-1">
              <button onClick={() => handleAction("follow")} disabled={loading === "follow"} className="px-4 py-2 rounded-2xl text-white text-xs font-bold active:scale-95 transition-transform" style={{ background: isFollowing ? "rgba(255,255,255,0.1)" : `linear-gradient(135deg, ${accentColor}, #ec4899)` }}>
                {loading === "follow" ? "..." : isFollowing ? "متابَع ✓" : "+ متابعة"}
              </button>
              {onSendGift && <button onClick={() => { onSendGift(); onClose(); }} className="px-4 py-2 rounded-2xl text-white text-xs font-bold active:scale-95 transition-transform" style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)" }}>🎁 هدية</button>}
            </div>
          </div>
          {/* Name */}
          <div className="mt-3">
            <div className="flex items-center gap-2 flex-wrap">
              {aristocracyConfig ? <AristocracyName level={aristocracyLevel} name={profile?.name ?? "مجهول"} className="text-lg" /> : vipConfig ? <VipName level={vipLevel} name={profile?.name ?? "مجهول"} /> : <h3 className="text-white font-black text-lg">{profile?.name ?? "مجهول"}</h3>}
              {country && <span className="text-base">{country.flag}</span>}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {profile?.sakiId && <span className="text-purple-400 text-xs">#{profile.sakiId}</span>}
              {profile?.gender && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: profile.gender === "male" ? "rgba(59,130,246,0.15)" : "rgba(236,72,153,0.15)", color: profile.gender === "male" ? "#60a5fa" : "#f472b6" }}>{profile.gender === "male" ? "♂ ذكر" : "♀ أنثى"}</span>}
            </div>
            {/* Levels & badges */}
            <div className="flex gap-2 mt-2 flex-wrap">
              {(profile?.wealthLevel ?? 0) > 0 && <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" }}><span className="text-xs">💰</span><span className="text-amber-400 text-[10px] font-bold">ثروة {profile.wealthLevel}</span></div>}
              {(profile?.charismaLevel ?? 0) > 0 && <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(236,72,153,0.15)", border: "1px solid rgba(236,72,153,0.3)" }}><span className="text-xs">✨</span><span className="text-pink-400 text-[10px] font-bold">كاريزما {profile.charismaLevel}</span></div>}
              {profile?.isSakiAmbassador && <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.3)" }}><span className="text-xs">⭐</span><span className="text-yellow-400 text-[10px] font-bold">سفير ساكي</span></div>}
            </div>
          </div>
          {/* Host admin actions */}
          {isHost && (
            <div className="flex gap-2 mt-4 pb-6 flex-wrap">
              <button onClick={() => handleAction(isMuted ? "unmute" : "mute")} disabled={!!loading} className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold active:scale-95 transition-transform" style={{ background: isMuted ? "rgba(34,197,94,0.15)" : "rgba(251,191,36,0.15)", border: `1px solid ${isMuted ? "rgba(34,197,94,0.4)" : "rgba(251,191,36,0.4)"}`, color: isMuted ? "#4ade80" : "#fbbf24" }}>
                <Ic.Mute />{loading === "mute" || loading === "unmute" ? "..." : isMuted ? "رفع الكتم" : "كتم الدردشة"}
              </button>
              <button onClick={() => handleAction("kick")} disabled={!!loading} className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold active:scale-95 transition-transform" style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.4)", color: "#fb923c" }}>
                <Ic.Kick />{loading === "kick" ? "..." : "طرد"}
              </button>
              <button onClick={() => handleAction(isBanned ? "unban" : "ban")} disabled={!!loading} className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold active:scale-95 transition-transform" style={{ background: isBanned ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${isBanned ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`, color: isBanned ? "#4ade80" : "#f87171" }}>
                <Ic.Ban />{loading === "ban" || loading === "unban" ? "..." : isBanned ? "رفع الحظر" : "حظر"}
              </button>
            </div>
          )}
          {!isHost && <div className="pb-6" />}
        </div>
      </div>
    </div>
  );
}

// ── Viewers Sheet ─────────────────────────────────────────────────
function ViewersSheet({ viewers, isHost, livestreamId, liveBans, liveChatMutes, onClose, onSelectUser }: any) {
  return (
    <div className="absolute inset-0 z-50 flex items-end" dir="rtl" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full rounded-t-3xl" style={{ background: "linear-gradient(180deg,#1a0035,#0d0020)", border: "1px solid rgba(168,85,247,0.3)", maxHeight: "70vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-12 h-1.5 rounded-full bg-white/20" /></div>
        <div className="flex items-center justify-between px-5 pb-3">
          <h3 className="text-white font-black text-base">المشاهدون ({viewers.length})</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Ic.Close /></button>
        </div>
        <div className="overflow-y-auto px-4 pb-6 scrollbar-hide" style={{ maxHeight: "55vh" }}>
          {viewers.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">لا يوجد مشاهدون حالياً</p>
          ) : viewers.map((v: any) => {
            const isBanned = liveBans?.some((b: any) => b.userId === v.userId);
            const isMuted = liveChatMutes?.some((m: any) => m.userId === v.userId);
            return (
              <button key={v._id} onClick={() => onSelectUser(v)} className="w-full flex items-center gap-3 py-3 border-b border-white/5 active:bg-white/5 rounded-xl px-2 transition-colors">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-purple-500/40">
                    <UserAvatar userId={v.userId} name={v.userName} avatarUrl={v.userAvatarUrl} size={40} />
                  </div>
                  {v.isVip && <div className="absolute -bottom-1 -right-1"><VipBadge level={v.vipLevel} size="sm" /></div>}
                </div>
                <div className="flex-1 text-right">
                  <p className="text-white text-sm font-bold">{v.userName ?? "مجهول"}</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    {(v.wealthLevel ?? 0) > 0 && <span className="text-amber-400 text-[10px]">💰{v.wealthLevel}</span>}
                    {(v.charismaLevel ?? 0) > 0 && <span className="text-pink-400 text-[10px]">✨{v.charismaLevel}</span>}
                    {isBanned && <span className="text-red-400 text-[10px] font-bold">محظور</span>}
                    {isMuted && <span className="text-yellow-400 text-[10px] font-bold">مكتوم</span>}
                  </div>
                </div>
                {v.aristocracyLevel > 0 && <AristocracyBadge level={v.aristocracyLevel} size="sm" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Top Bar ───────────────────────────────────────────────────────
function LiveTopBar({ stream, role, onClose, onEndConfirm, onHostAvatarClick, onViewersClick }: any) {
  return (
    <div className="relative z-10 flex items-center justify-between px-4 pt-10 pb-3">
      <button onClick={role === "host" ? onEndConfirm : onClose} className="w-9 h-9 rounded-xl bg-black/50 backdrop-blur flex items-center justify-center"><Ic.Close /></button>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/90 backdrop-blur">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-white text-xs font-black">LIVE</span>
        </div>
        <button onClick={onViewersClick} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur active:scale-95 transition-transform">
          <Ic.Viewers /><span className="text-white text-xs font-bold">{stream.viewerCount ?? 0}</span>
        </button>
      </div>
      <button onClick={onHostAvatarClick} className="flex items-center gap-2 active:scale-95 transition-transform">
        <div className="text-right">
          <p className="text-white text-xs font-bold leading-none">{stream.hostProfile?.name}</p>
          <p className="text-purple-300 text-[9px]">#{stream.hostProfile?.sakiId}</p>
        </div>
        <UserAvatar userId={stream.hostId} avatarUrl={stream.hostProfile?.avatarUrl} name={stream.hostProfile?.name} size={32} className="border-2 border-purple-500" />
      </button>
    </div>
  );
}

// ── Host Controls ─────────────────────────────────────────────────
function HostControls({ agora }: any) {
  return (
    <div className="absolute top-20 left-4 z-10 flex flex-col gap-2">
      <button onClick={agora.toggleMute} className="w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur" style={{ background: agora.isMuted ? "rgba(239,68,68,0.8)" : "rgba(0,0,0,0.5)" }}>
        {agora.isMuted ? <Ic.MicOff /> : <Ic.MicOn />}
      </button>
      <button onClick={agora.toggleCamera} className="w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur" style={{ background: agora.isCameraOff ? "rgba(239,68,68,0.8)" : "rgba(0,0,0,0.5)" }}>
        {agora.isCameraOff ? <Ic.CamOff /> : <Ic.CamOn />}
      </button>
      <button onClick={agora.switchCamera} className="w-10 h-10 rounded-xl flex items-center justify-center bg-black/50 backdrop-blur"><Ic.Flip /></button>
    </div>
  );
}

// ── Flying Gift Banner ────────────────────────────────────────────
function FlyingGiftBanner({ events }: { events: Array<any> }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {events.map((g) => (
        <div key={g.id} className="absolute left-4 bottom-40 flex items-center gap-2 px-3 py-2 rounded-full" style={{ background: "rgba(168,85,247,0.85)", animation: "flyGift 3s ease-out forwards" }}>
          {g.imageUrl ? <img src={g.imageUrl} alt="" className="w-7 h-7 rounded-lg object-cover" /> : <span className="text-xl">{g.emoji || "🎁"}</span>}
          <div>
            <p className="text-white text-xs font-bold">{g.senderName}</p>
            <p className="text-purple-200 text-[10px]">{g.name} × {g.qty}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Live Chat ─────────────────────────────────────────────────────
function LiveChat({ messages, onAvatarClick }: any) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  return (
    <div className="px-3 pb-2 max-h-52 overflow-y-auto flex flex-col gap-0.5 scrollbar-hide">
      {(messages ?? []).slice().reverse().map((msg: any) => (
        <ChatBubble key={msg._id} msg={msg} onAvatarClick={onAvatarClick} />
      ))}
      <div ref={chatEndRef} />
    </div>
  );
}

// ── Bottom Bar ────────────────────────────────────────────────────
function LiveBottomBar({ chatInput, setChatInput, onSend, onGift, onLike, onDuet, likeAnim, role, likeCount }: any) {
  return (
    <div className="flex items-center gap-2 px-3 pb-6 pt-2" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)" }}>
      <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-full" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}>
        <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSend()} placeholder="اكتب رسالة..." className="flex-1 bg-transparent text-white text-xs outline-none placeholder-gray-400 text-right" />
        <button onClick={onSend} disabled={!chatInput.trim()} className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center disabled:opacity-40"><Ic.Send /></button>
      </div>
      {role === "host" && (
        <button onClick={onDuet} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#8b5cf6,#6d28d9)" }}><Ic.Duet /></button>
      )}
      <button onClick={onGift} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)" }}><Ic.Gift /></button>
      <button onClick={onLike} className="relative w-10 h-10 rounded-full flex items-center justify-center transition-transform" style={{ background: "linear-gradient(135deg,#ec4899,#ef4444)", transform: likeAnim ? "scale(1.3)" : "scale(1)" }}>
        <Ic.Heart />
        {likeCount > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center">{likeCount > 99 ? "99+" : likeCount}</span>}
      </button>
    </div>
  );
}

// ── End Confirm ───────────────────────────────────────────────────
function EndConfirmSheet({ onCancel, onConfirm }: any) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70">
      <div className="mx-6 p-6 rounded-3xl text-center" style={{ background: "linear-gradient(180deg,#1a0035,#0d0020)", border: "1px solid rgba(239,68,68,0.4)" }}>
        <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center mx-auto mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <p className="text-white font-black text-lg mt-1">إنهاء البث؟</p>
        <p className="text-gray-400 text-sm mt-1">سيتم إنهاء البث المباشر للجميع</p>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl bg-white/10 text-white font-bold text-sm">إلغاء</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl font-bold text-sm text-white" style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}>إنهاء البث</button>
        </div>
      </div>
    </div>
  );
}

// ── Co-Host Grid ──────────────────────────────────────────────────
function CoHostGrid({ coHosts, agora, role, myUserId, onRemove }: any) {
  if (!coHosts || coHosts.length === 0) return null;
  return (
    <div className="absolute bottom-36 left-0 right-0 z-10 px-3">
      <div className="flex gap-2 justify-center">
        {coHosts.slice(0, 5).map((ch: any) => (
          <div key={ch._id} className="relative rounded-2xl overflow-hidden" style={{ width: 90, height: 120, background: "#111", border: "2px solid rgba(168,85,247,0.6)" }}>
            <div id={`cohost-video-${ch.userId}`} className="w-full h-full bg-gradient-to-br from-purple-900 to-black" />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <UserAvatar userId={ch.userId} name={ch.userName} avatarUrl={ch.userAvatarUrl} size={36} className="border-2 border-purple-400" />
              <p className="text-white text-[9px] font-bold mt-1 px-1 text-center truncate w-full">{ch.userName}</p>
            </div>
            {(role === "host" || ch.userId === myUserId) && (
              <button onClick={() => onRemove(ch.userId)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600/80 flex items-center justify-center">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Duet Invite Sheet ─────────────────────────────────────────────
function DuetInviteSheet({ livestreamId, coHosts, onClose }: any) {
  const [searchSakiId, setSearchSakiId] = useState("");
  const [inviting, setInviting] = useState(false);
  const [msg, setMsg] = useState("");
  const inviteCoHost = useMutation(api.liveCoHost.inviteCoHost);
  const removeCoHost = useMutation(api.liveCoHost.removeCoHost);
  const searchProfile = useQuery(api.profiles.getProfileBySakiId, searchSakiId.trim() ? { sakiId: searchSakiId.trim() } : "skip");
  const handleInvite = async () => {
    if (!searchProfile) return;
    setInviting(true); setMsg("");
    try { await inviteCoHost({ livestreamId, invitedUserId: searchProfile.userId }); setMsg("✅ تم إرسال الدعوة"); setSearchSakiId(""); }
    catch (e: any) { setMsg("❌ " + (e.message ?? "فشل")); }
    setInviting(false);
  };
  return (
    <div className="absolute inset-0 z-50 flex items-end" dir="rtl">
      <div className="w-full rounded-t-3xl p-5" style={{ background: "linear-gradient(180deg,#1a0035,#0d0020)", border: "1px solid rgba(168,85,247,0.3)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-black text-base">دعوة ضيف للبث</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Ic.Close /></button>
        </div>
        {coHosts.length > 0 && (
          <div className="mb-4">
            <p className="text-purple-300 text-xs font-bold mb-2">الضيوف الحاليون ({coHosts.length}/5)</p>
            <div className="flex gap-2 flex-wrap">
              {coHosts.map((ch: any) => (
                <div key={ch._id} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-purple-900/60 border border-purple-500/40">
                  <UserAvatar userId={ch.userId} name={ch.userName} avatarUrl={ch.userAvatarUrl} size={20} />
                  <span className="text-white text-xs">{ch.userName}</span>
                  <button onClick={() => removeCoHost({ livestreamId, coHostUserId: ch.userId })} className="w-4 h-4 rounded-full bg-red-600/70 flex items-center justify-center">
                    <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {coHosts.length < 5 && (
          <>
            <div className="flex gap-2 mb-3">
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-white/10 border border-white/15">
                <Ic.Search />
                <input value={searchSakiId} onChange={(e) => setSearchSakiId(e.target.value)} placeholder="أدخل Saki ID..." className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500 text-right" />
              </div>
            </div>
            {searchProfile && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-purple-900/40 border border-purple-500/30 mb-3">
                <UserAvatar userId={searchProfile.userId} name={searchProfile.name} avatarUrl={searchProfile.avatarUrl} size={40} />
                <div className="flex-1"><p className="text-white font-bold text-sm">{searchProfile.name}</p><p className="text-purple-300 text-xs">#{searchProfile.sakiId}</p></div>
                <button onClick={handleInvite} disabled={inviting} className="px-4 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-50" style={{ background: "linear-gradient(135deg,#8b5cf6,#6d28d9)" }}>{inviting ? "..." : "دعوة"}</button>
              </div>
            )}
          </>
        )}
        {msg && <p className="text-center text-sm mt-2" style={{ color: msg.startsWith("✅") ? "#4ade80" : "#f87171" }}>{msg}</p>}
        <p className="text-gray-600 text-[10px] text-center mt-3">يمكنك دعوة حتى 5 ضيوف للبث معك</p>
      </div>
    </div>
  );
}

// ── Co-Host Invite Popup ──────────────────────────────────────────
function CoHostInvitePopup({ invite, onAccept, onReject }: any) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60" dir="rtl">
      <div className="mx-6 p-6 rounded-3xl text-center" style={{ background: "linear-gradient(180deg,#1a0035,#0d0020)", border: "1px solid rgba(168,85,247,0.5)" }}>
        <div className="w-14 h-14 rounded-full bg-purple-600/30 flex items-center justify-center mx-auto mb-3"><Ic.Duet /></div>
        <p className="text-white font-black text-base">دعوة للبث المشترك</p>
        <p className="text-gray-400 text-sm mt-1">دعاك المضيف للانضمام إلى البث المباشر</p>
        <div className="flex gap-3 mt-5">
          <button onClick={onReject} className="flex-1 py-3 rounded-2xl bg-white/10 text-white font-bold text-sm">رفض</button>
          <button onClick={onAccept} className="flex-1 py-3 rounded-2xl font-bold text-sm text-white" style={{ background: "linear-gradient(135deg,#8b5cf6,#6d28d9)" }}>قبول</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function VideoLivePage({ livestreamId, role: initialRole, onBack }: VideoLivePageProps) {
  const stream = useQuery(api.livestreams.getLivestream, { livestreamId });
  const messages = useQuery(api.livestreams.getLiveMessages, { livestreamId });
  const giftEvents = useQuery(api.livestreams.getLiveGiftEvents, { livestreamId });
  const myProfile = useQuery(api.profiles.getMyProfile);
  const coHosts = useQuery(api.liveCoHost.getCoHosts, { livestreamId }) ?? [];
  const myCoHostInvite = useQuery(api.liveCoHost.getMyCoHostInvite, { livestreamId });
  const myCoHostStatus = useQuery(api.liveCoHost.getMyCoHostStatus, { livestreamId });
  const liveViewers = useQuery(api.livestreams.getLiveViewers, { livestreamId }) ?? [];
  const liveBans = useQuery(api.livestreams.getLiveBans, { livestreamId }) ?? [];
  const liveChatMutes = useQuery(api.livestreams.getLiveChatMutes, { livestreamId }) ?? [];

  const joinLivestreamViewer = useMutation(api.livestreams.joinLivestreamViewer);
  const leaveLivestreamViewer = useMutation(api.livestreams.leaveLivestreamViewer);
  const sendLike = useMutation(api.livestreams.sendLike);
  const sendLiveMessage = useMutation(api.livestreams.sendLiveMessage);
  const sendLiveCustomGift = useMutation(api.livestreams.sendLiveCustomGift);
  const endLivestream = useMutation(api.livestreams.endLivestream);
  const respondCoHostInvite = useMutation(api.liveCoHost.respondCoHostInvite);
  const removeCoHost = useMutation(api.liveCoHost.removeCoHost);

  const isCoHost = !!myCoHostStatus;
  const effectiveRole = initialRole === "host" ? "host" : isCoHost ? "host" : "audience";
  const isHost = initialRole === "host";

  const [giftsCategory, setGiftsCategory] = useState("general");
  const customGifts = useQuery(api.store.getCustomGifts, {}) ?? [];
  const activeWeeklyEvent = useQuery(api.weeklyStar.getActiveEvent);

  const [chatInput, setChatInput] = useState("");
  const [showGifts, setShowGifts] = useState(false);
  const [showDuet, setShowDuet] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [flyingEvents, setFlyingEvents] = useState<Array<any>>([]);
  const [likeAnim, setLikeAnim] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [hearts, setHearts] = useState<Array<{ id: number; x: number }>>([]);
  const flyingIdRef = useRef(0);
  const heartIdRef = useRef(0);

  const [giftTarget, setGiftTarget] = useState<any>(null);
  const [giftTargets, setGiftTargets] = useState<any[]>([]);
  const [selectedCustomGift, setSelectedCustomGift] = useState<any>(null);
  const [giftQuantity, setGiftQuantity] = useState(1);
  const [showQuantityMenu, setShowQuantityMenu] = useState(false);

  const channelName = stream?.channelName ?? "";
  const agora = useAgoraVideoLive(channelName, myProfile?._id ?? stream?.hostId ?? "", effectiveRole, !!stream && !!channelName);

  // Join as viewer
  useEffect(() => {
    if (!stream?.isLive) return;
    if (initialRole === "audience" && !isCoHost) {
      joinLivestreamViewer({ livestreamId });
      return () => { leaveLivestreamViewer({ livestreamId }); };
    }
  }, [stream?.isLive, isCoHost]);

  // Play remote co-host videos
  useEffect(() => {
    if (!agora.remoteUsers || agora.remoteUsers.length === 0) return;
    agora.remoteUsers.forEach((user: any) => {
      if (user.videoTrack) {
        const el = document.getElementById(`cohost-video-${user.uid}`);
        if (el) { try { user.videoTrack.play(el); } catch (_) {} }
      }
    });
  }, [agora.remoteUsers, coHosts]);

  // Flying gift events
  useEffect(() => {
    if (!giftEvents || giftEvents.length === 0) return;
    const latest = giftEvents[0];
    const id = ++flyingIdRef.current;
    setFlyingEvents((prev) => [...prev, { id, emoji: latest.giftEmoji, name: latest.giftName, imageUrl: latest.giftImageUrl, senderName: latest.senderName, qty: latest.quantity ?? 1 }]);
    setTimeout(() => setFlyingEvents((prev) => prev.filter((g) => g.id !== id)), 3000);
  }, [giftEvents?.[0]?._id]);

  // Tap screen for hearts
  const handleScreenTap = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("[data-no-heart]")) return;
    const id = ++heartIdRef.current;
    const x = (e.clientX / window.innerWidth) * 100;
    setHearts((prev) => [...prev, { id, x }]);
    setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== id)), 2500);
  }, []);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    try { await sendLiveMessage({ livestreamId, content: chatInput.trim() }); setChatInput(""); }
    catch (e: any) { alert(e.message); }
  };

  const handleLike = async () => {
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 600);
    const id = ++heartIdRef.current;
    setHearts((prev) => [...prev, { id, x: 50 + (Math.random() - 0.5) * 30 }]);
    setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== id)), 2500);
    await sendLike({ livestreamId });
  };

  const hostAsSeatMember = stream ? {
    _id: stream.hostId, userId: stream.hostId, seatIndex: 0,
    profile: { userId: stream.hostId, name: stream.hostProfile?.name ?? "المضيف", avatarUrl: stream.hostProfile?.avatarUrl, isVip: stream.hostProfile?.isVip, vipLevel: stream.hostProfile?.vipLevel },
  } : null;

  const handleSendGift = async () => {
    if (!selectedCustomGift) return;
    try {
      await sendLiveCustomGift({ livestreamId, customGiftId: selectedCustomGift._id, quantity: giftQuantity });
      setShowGifts(false); setSelectedCustomGift(null); setGiftQuantity(1); setShowQuantityMenu(false); setGiftTargets([]); setGiftTarget(null);
    } catch (e: any) { alert(e.message ?? "فشل إرسال الهدية"); }
  };

  const handleOpenGifts = () => {
    setShowGifts(true);
    if (hostAsSeatMember) { setGiftTarget(hostAsSeatMember); setGiftTargets([hostAsSeatMember]); }
    setSelectedCustomGift(null); setGiftQuantity(1); setShowQuantityMenu(false);
  };

  const handleCloseGifts = () => {
    setShowGifts(false); setSelectedCustomGift(null); setGiftQuantity(1); setShowQuantityMenu(false); setGiftTargets([]); setGiftTarget(null);
  };

  const filteredGifts = giftsCategory === "all" || giftsCategory === "bag" ? customGifts : customGifts.filter((g: any) => {
    if (giftsCategory === "events") return g.category === "events";
    if (giftsCategory === "luck") return g.category === "luck";
    return !g.category || g.category === giftsCategory || g.category === "general";
  });

  const handleEnd = async () => { await agora.leave(); await endLivestream({ livestreamId }); onBack(); };
  const handleAudienceLeave = async () => {
    if (isCoHost) await removeCoHost({ livestreamId, coHostUserId: myProfile?._id ?? "" });
    await agora.leave(); onBack();
  };

  const handleChatAvatarClick = (msg: any) => {
    setSelectedUser({ userId: msg.userId, profile: { name: msg.senderName, avatarUrl: msg.senderAvatarUrl, isVip: msg.isVip, vipLevel: msg.vipLevel, aristocracyLevel: msg.aristocracyLevel, sakiId: null } });
  };

  const handleHostAvatarClick = () => {
    if (!stream) return;
    setSelectedUser({ userId: stream.hostId, profile: stream.hostProfile });
  };

  if (!stream) {
    return <div className="fixed inset-0 bg-black flex items-center justify-center"><div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!stream.isLive) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4" dir="rtl">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
        <p className="text-white font-bold text-lg">انتهى البث</p>
        <button onClick={onBack} className="px-6 py-3 rounded-2xl bg-purple-600 text-white font-bold">العودة</button>
      </div>
    );
  }

  const coins = myProfile?.goldCoins ?? 0;
  const isSuperAdmin = myProfile?.isSuperAdmin ?? false;
  const likeCount = stream.likeCount ?? 0;

  return (
    <div className="fixed inset-0 bg-black flex flex-col" dir="rtl" style={{ zIndex: 300 }} onClick={handleScreenTap}>
      {/* Video Layer */}
      <div className="absolute inset-0">
        {effectiveRole === "host" ? (
          <div ref={agora.localVideoRef} className="w-full h-full object-cover" style={{ background: "#000" }} />
        ) : agora.remoteUsers.length > 0 ? (
          <div id={`remote-video-${agora.remoteUsers[0].uid}`} className="w-full h-full" style={{ background: "#000" }} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-950 via-black to-indigo-950 flex items-center justify-center">
            <div className="text-center">
              <UserAvatar userId={stream.hostId} avatarUrl={stream.hostProfile?.avatarUrl} name={stream.hostProfile?.name} size={80} className="mx-auto mb-3 border-4 border-purple-500" />
              <p className="text-white font-bold">{stream.hostProfile?.name}</p>
              <p className="text-gray-400 text-sm mt-1">جاري الاتصال...</p>
              <div className="flex items-center justify-center gap-1 mt-3">
                {[0, 1, 2].map((i) => <div key={i} className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80 pointer-events-none" />
      </div>

      {/* Top Bar */}
      <LiveTopBar stream={stream} role={initialRole} onClose={handleAudienceLeave} onEndConfirm={() => setShowEndConfirm(true)} onHostAvatarClick={handleHostAvatarClick} onViewersClick={() => setShowViewers(true)} />

      {/* Host Controls */}
      {effectiveRole === "host" && <HostControls agora={agora} />}

      {/* Coins badge */}
      <div className="absolute top-24 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur" data-no-heart>
        <Ic.Coins /><span className="text-white text-xs font-bold">{formatNumber(stream.totalCoins ?? 0)}</span>
      </div>

      {/* Co-Host badge */}
      {isCoHost && initialRole !== "host" && (
        <div className="absolute top-24 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-600/80 backdrop-blur" data-no-heart>
          <Ic.Duet /><span className="text-white text-xs font-bold">ضيف</span>
        </div>
      )}

      {/* Flying Gifts */}
      <FlyingGiftBanner events={flyingEvents} />

      {/* Floating Hearts */}
      <FloatingHearts hearts={hearts} />

      {/* Co-Host Grid */}
      {coHosts.length > 0 && (
        <CoHostGrid coHosts={coHosts} agora={agora} role={initialRole} myUserId={myProfile?._id} onRemove={(uid: string) => removeCoHost({ livestreamId, coHostUserId: uid })} />
      )}

      {/* Chat + Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10" data-no-heart>
        <LiveChat messages={messages} onAvatarClick={handleChatAvatarClick} />
        <LiveBottomBar chatInput={chatInput} setChatInput={setChatInput} onSend={handleSendMessage} onGift={handleOpenGifts} onLike={handleLike} onDuet={() => setShowDuet(true)} likeAnim={likeAnim} role={initialRole} likeCount={likeCount} />
      </div>

      {/* Gifts Sheet */}
      {showGifts && (
        <div data-no-heart>
          <RoomGiftsSheet
            isCp={false} isSuperAdmin={isSuperAdmin} coins={coins}
            seatedMembers={hostAsSeatMember ? [hostAsSeatMember] : []}
            myProfile={myProfile} customGifts={filteredGifts} giftsCategory={giftsCategory}
            giftTarget={giftTarget} giftTargets={giftTargets} selectedCustomGift={selectedCustomGift}
            giftQuantity={giftQuantity} showQuantityMenu={showQuantityMenu} activeWeeklyEvent={activeWeeklyEvent ?? null}
            onClose={handleCloseGifts}
            onCategoryChange={(cat) => { setGiftsCategory(cat); setSelectedCustomGift(null); }}
            onSelectTarget={(m) => { setGiftTarget(m); setGiftTargets([m]); }}
            onSelectAll={(members) => { setGiftTargets(members); setGiftTarget(members[0] ?? null); }}
            onSelectGift={(gift) => setSelectedCustomGift(gift)}
            onSendGift={handleSendGift}
            onQuantityChange={(qty) => { setGiftQuantity(qty); setShowQuantityMenu(false); }}
            onToggleQuantityMenu={() => setShowQuantityMenu((v) => !v)}
            onUploadGift={() => {}}
          />
        </div>
      )}

      {/* Duet Sheet */}
      {showDuet && initialRole === "host" && <DuetInviteSheet livestreamId={livestreamId} coHosts={coHosts} onClose={() => setShowDuet(false)} />}

      {/* Viewers Sheet */}
      {showViewers && (
        <ViewersSheet
          viewers={liveViewers} isHost={isHost} livestreamId={livestreamId}
          liveBans={liveBans} liveChatMutes={liveChatMutes}
          onClose={() => setShowViewers(false)}
          onSelectUser={(v: any) => { setSelectedUser(v); setShowViewers(false); }}
        />
      )}

      {/* User Profile Sheet */}
      {selectedUser && (
        <LiveUserProfileSheet
          user={selectedUser} isHost={isHost} livestreamId={livestreamId}
          liveBans={liveBans} liveChatMutes={liveChatMutes}
          onClose={() => setSelectedUser(null)}
          onSendGift={!isHost ? handleOpenGifts : undefined}
        />
      )}

      {/* Co-Host Invite Popup */}
      {myCoHostInvite && initialRole !== "host" && !isCoHost && (
        <CoHostInvitePopup invite={myCoHostInvite} onAccept={() => respondCoHostInvite({ livestreamId, accept: true })} onReject={() => respondCoHostInvite({ livestreamId, accept: false })} />
      )}

      {/* End Confirm */}
      {showEndConfirm && <EndConfirmSheet onCancel={() => setShowEndConfirm(false)} onConfirm={handleEnd} />}

      {/* Agora Error */}
      {agora.error && (
        <div className="absolute top-32 left-4 right-4 z-20 p-3 rounded-2xl bg-red-900/80 backdrop-blur">
          <p className="text-white text-xs text-center">⚠️ {agora.error}</p>
        </div>
      )}

      <style>{`
        @keyframes flyGift { 0%{transform:translateY(0) scale(1);opacity:1} 70%{transform:translateY(-120px) scale(1.1);opacity:1} 100%{transform:translateY(-200px) scale(0.8);opacity:0} }
        @keyframes floatHeart { 0%{transform:translateY(0) scale(1);opacity:1} 50%{transform:translateY(-80px) scale(1.2);opacity:0.8} 100%{transform:translateY(-160px) scale(0.6);opacity:0} }
        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>
    </div>
  );
}
