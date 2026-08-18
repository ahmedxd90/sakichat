// @ts-nocheck
import React, { memo } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import UserAvatar from "../UserAvatar";
import SeatEmojiOverlay from "../SeatEmojiOverlay";
import { SeatEmojiItem } from "../../types/room";
import { AgentSeatIcon } from "../AgentChargeBadge";
import { AristocracyName } from "../AristocracyBadge";

interface RoomSeatsGridProps {
  members: any[];
  myProfile: any;
  maxSeats: number;
  isCp: boolean;
  isMusic: boolean;
  isAstronomy: boolean;
  isDesert: boolean;
  isRadio?: boolean;
  isFootball?: boolean;
  isKaraoke?: boolean;
  isPK: boolean;
  pkRoom1Id?: string;
  pkRoom2Id?: string;
  roomId?: string;
  ownerIsVip12: boolean;
  isMuted: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  hideRoyalSeats?: boolean;
  speakingUsers: Set<string>;
  activeEmojis: SeatEmojiItem[];
  seatPositions: Array<{ x: number; y: number } | null>;
  seatsGridRef: React.RefObject<HTMLDivElement>;
  lockedSeats: number[];
  onSeatPress: (seatIndex: number) => void;
  onViewProfile: (userId: Id<"users">) => void;
}

const ContentCreatorHeart = memo(function ContentCreatorHeart({ size = 11 }: { size?: number }) {
  return (
    <div style={{ animation: "ccHB 1.6s ease-in-out infinite", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} viewBox="0 0 24 24">
        <defs>
          <linearGradient id="ccHG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="url(#ccHG)" stroke="#93c5fd" strokeWidth="0.8" />
      </svg>
    </div>
  );
});

const PRIVATE_AVATAR_URL = "/assets/privacy/private-person-icon.svg";

const ARISTO_COLORS: Record<number, string> = {
  1: "#60a5fa", 2: "#34d399", 3: "#a78bfa",
  4: "#f472b6", 5: "#fb923c", 6: "#f97316",
  7: "#ffd700", 8: "#ffd700",
};

function getWaveColor(profile: any, isMe: boolean): string {
  if (isMe) return "#38bdf8";
  const al = profile?.aristocracyLevel ?? 0;
  const ae = profile?.aristocracyExpiresAt ?? null;
  if (al > 0 && ae && ae > Date.now()) {
    if (al >= 7) return "#ffd700";
    if (al >= 5) return "#f97316";
    return ARISTO_COLORS[al] ?? "#60a5fa";
  }
  if (profile?.isSuperAdmin) return "#ffd700";
  if (profile?.isVip) {
    const vl = profile.vipLevel ?? 1;
    if (vl >= 10) return "#ff4757";
    if (vl >= 7) return "#a855f7";
    if (vl >= 4) return "#f59e0b";
    return "#fbbf24";
  }
  return "#4ade80";
}

function getAristoLevel(profile: any): number {
  const al = profile?.aristocracyLevel ?? 0;
  const ae = profile?.aristocracyExpiresAt ?? null;
  if (al > 0 && ae && ae > Date.now()) return al;
  return 0;
}

function getSeatNameStyle(profile: any): React.CSSProperties {
  const isPro = Boolean(profile?.isPro && (profile?.proExpiresAt ?? 0) > Date.now());
  const proLevel = profile?.proLevel ?? 1;

  if (isPro) {
    if (proLevel === 1) return { animation: "pro-name-1 3s ease-in-out infinite", fontWeight: "900" };
    if (proLevel === 2) return { animation: "pro-name-2 3s ease-in-out infinite", fontWeight: "900" };
    if (proLevel === 3) return { animation: "pro-name-3 3s ease-in-out infinite", fontWeight: "900" };
    if (proLevel === 4) return { animation: "pro-name-4 4s linear infinite", fontWeight: "900" };
    if (proLevel === 5) return { animation: "pro-name-5 4s linear infinite", fontWeight: "900" };

    return {
      background: "linear-gradient(90deg, #ef4444, #fbbf24, #9ca3af, #fbbf24, #ef4444)",
      backgroundSize: "200% auto",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      animation: "vip-name-flow 2s linear infinite",
      filter: "drop-shadow(0 0 4px rgba(239,68,68,0.5))",
      fontWeight: "900",
    };
  }
  const al = profile?.aristocracyLevel ?? 0;
  const ae = profile?.aristocracyExpiresAt ?? null;
  if (al > 0 && ae && ae > Date.now()) {
    const c = ARISTO_COLORS[al] ?? "#60a5fa";
    return { color: c, textShadow: `0 0 8px ${c}80` };
  }
  if (profile?.isVip) return { color: "#fbbf24" };
  if (profile?.isSuperAdmin) return { color: "#ffd700" };
  return {};
}

const MicOnSVG = memo(({ size = 8 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
  </svg>
));

const MicOffSVG = memo(({ size = 8 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
    <line x1="1" y1="1" x2="23" y2="23" stroke="#ff4444" strokeWidth="2.5" />
    <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
    <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v4M8 23h8" />
  </svg>
));

const LockSVG = memo(({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="5" y="11" width="14" height="10" rx="2.5" fill="rgba(239,68,68,0.9)" stroke="rgba(255,100,100,0.6)" strokeWidth="1.5" />
    <path d="M8 11V7a4 4 0 018 0v4" stroke="rgba(239,68,68,0.9)" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="16" r="1.5" fill="white" opacity="0.9" />
  </svg>
));

const EmptyMicSVG = memo(({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
));

const CrownSVG = memo(({ size = 10, color = "#fbbf24" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M3 17L5 8L9 13L12 6L15 13L19 8L21 17H3Z" fill={color} stroke={color} strokeWidth="1" strokeLinejoin="round" />
    <rect x="3" y="17" width="18" height="2.5" rx="1.25" fill={color} />
    <circle cx="12" cy="6" r="1.5" fill={color} />
    <circle cx="3" cy="8" r="1.5" fill={color} />
    <circle cx="21" cy="8" r="1.5" fill={color} />
  </svg>
));

const VoiceRings = memo(({ color, isMe, al, size }: { color: string; isMe: boolean; al: number; size: number }) => {
  const top = al >= 7, high = al >= 5;
  const n = top ? 5 : high ? 4 : isMe ? 4 : 3;
  const spd = top ? 1.1 : high ? 1.3 : isMe ? 1.5 : 1.7;
  const bw = top ? 3 : high ? 2.5 : isMe ? 2.2 : 1.8;
  const g = top ? 20 : high ? 12 : isMe ? 8 : 5;
  return (
    <div className="absolute pointer-events-none"
      style={{ top: 0, left: 0, width: size, height: size, overflow: "visible", zIndex: 3 }}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="absolute rounded-full" style={{
          top: 0, left: 0, width: size, height: size,
          border: `${Math.max(bw - i * 0.25, 1)}px solid ${color}`,
          animation: `voiceRing ${spd}s ease-out ${i * 0.28}s infinite`,
          boxShadow: top
            ? `0 0 ${g}px ${color}cc, 0 0 ${g * 2}px ${color}55`
            : high
              ? `0 0 ${g}px ${color}99`
              : `0 0 ${g}px ${color}${isMe ? "66" : "44"}`,
        }} />
      ))}
    </div>
  );
});

const GlassBubble = memo(function GlassBubble({
  size, glowColor, borderColor, bgGradient, isSpeaking, isMe, seatSkinUrl, isEmpty, children,
}: {
  size: number; glowColor: string; borderColor: string; bgGradient: string;
  isSpeaking?: boolean; isMe?: boolean; seatSkinUrl?: string; isEmpty?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="relative flex items-center justify-center rounded-full"
      style={{
        width: size, height: size,
        background: seatSkinUrl ? "transparent" : bgGradient,
        border: `${isSpeaking && isMe ? 2.5 : 2}px solid ${borderColor}`,
        boxShadow: isSpeaking
          ? isMe
            ? `0 0 0 3px ${glowColor}60, 0 0 20px ${glowColor}90, 0 6px 18px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.5)`
            : `0 0 0 2px ${glowColor}40, 0 0 14px ${glowColor}70, 0 6px 18px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.4)`
          : isEmpty
            ? `inset 0 0 10px rgba(255,255,255,0.2), 0 4px 10px rgba(0,0,0,0.3)`
            : `0 0 10px ${glowColor}50, 0 6px 18px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.35)`,
        backdropFilter: isEmpty ? "blur(6px)" : undefined,
        WebkitBackdropFilter: isEmpty ? "blur(6px)" : undefined,
        transition: "box-shadow 0.3s ease, border-color 0.3s ease",
        overflow: "visible", clipPath: "none",
      }}>
      {seatSkinUrl && (
        <div className="absolute inset-0 rounded-full pointer-events-none" style={{ overflow: "hidden", zIndex: 0 }}>
          <img src={seatSkinUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      {!isEmpty && (
        <div className="absolute pointer-events-none z-20" style={{
          top: "12%", left: "18%", width: "35%", height: "18%",
          background: "linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.08) 100%)",
          borderRadius: "50%", transform: "rotate(-20deg)", filter: "blur(1px)",
        }} />
      )}
      {children}
    </div>
  );
});

const RegularSeat = memo(function RegularSeat({
  seatIndex, member, isMe, isMuted: globalMuted, isSpeaking, isLocked, isPK, pkSide, isHostSeat, onPress, scale = 1,
}: {
  seatIndex: number; member: any; isMe: boolean; isMuted: boolean; isSpeaking: boolean;
  isLocked: boolean; isPK: boolean; pkSide: string | null; isHostSeat: boolean;
  onPress: () => void; scale?: number;
}) {
  const seatSkinUrl: string | undefined = member?.seatSkinUrl ?? undefined;
  const isOwnerSeat = member?.role === "owner";
  const isAdminSeat = member?.role === "admin";
  const isMicMuted = isMe ? globalMuted : member?.isMuted;
  const isActuallySpeaking = isSpeaking && !isMicMuted && !!member;
  const pkBorderColor = pkSide === "room1" ? "#3b82f6" : "#ef4444";
  const pkGlowColor = pkSide === "room1" ? "#3b82f6" : "#ef4444";
  const isCC = member?.profile?.isContentCreator ?? false;
  const waveColor = getWaveColor(member?.profile, isMe);
  const aristoLv = getAristoLevel(member?.profile);
  const isRoyalOwnerSeat = isOwnerSeat && aristoLv >= 5;
  const isEmpty = !member && !isLocked && !isPK;

  const getColors = () => {
    if (isLocked) return { glow: "#ef4444", border: "rgba(239,68,68,0.5)", bg: "linear-gradient(145deg, rgba(30,5,5,0.95), rgba(15,0,0,0.98))" };
    if (isActuallySpeaking && isMe) return { glow: waveColor, border: `${waveColor}90`, bg: "linear-gradient(145deg, #051520, #020d18)" };
    if (isActuallySpeaking) return { glow: waveColor, border: `${waveColor}85`, bg: "linear-gradient(145deg, #0d2010, #051a0a)" };
    if (isPK) return { glow: pkGlowColor, border: `${pkBorderColor}80`, bg: "linear-gradient(145deg, rgba(10,10,25,0.95), rgba(5,5,15,0.98))" };
    if (member) {
      if (isMe) return { glow: "#818cf8", border: "rgba(129,140,248,0.7)", bg: "linear-gradient(145deg, #0d0a1a, #060410)" };
      if (isRoyalOwnerSeat) return { glow: "#fbbf24", border: "rgba(251,191,36,0.95)", bg: "linear-gradient(145deg, #3b2104 0%, #1a0d01 52%, #080400 100%)" };
      if (isOwnerSeat) return { glow: "#d6a84f", border: "rgba(214,168,79,0.55)", bg: "linear-gradient(145deg, #1f1608, #0d0903)" };
      if (isAdminSeat) return { glow: "#c084fc", border: "rgba(192,132,252,0.7)", bg: "linear-gradient(145deg, #150a20, #0a0515)" };
      return { glow: "#818cf8", border: "rgba(129,140,248,0.6)", bg: "linear-gradient(145deg, #0d0a1a, #060410)" };
    }
    return { glow: "rgba(255,255,255,0.3)", border: "rgba(255,255,255,0.25)", bg: "rgba(255,255,255,0.18)" };
  };
  const { glow, border, bg } = getColors();

  const nameStyle = member ? getSeatNameStyle(member.profile) : {};
  const isRestricted = member?.profile?.isPrivateProfile && !isMe;
  const displayName = member
    ? (isRestricted ? "مستخدم مخفي" : isMe ? "أنا" : member.profile?.name)
    : isPK ? (pkSide === "room1" ? "🐯" : "🦁")
    : isLocked ? "مقفل"
    : `${seatIndex + 1}`;

  const BUBBLE = 60 * scale;
  const AVATAR = 46 * scale;

  return (
    <button key={seatIndex} data-seat={seatIndex} onClick={onPress}
      className="flex flex-col items-center gap-0.5 active:scale-95 transition-all duration-150">
      <div className="relative" style={{ overflow: "visible" }}>

        {isActuallySpeaking && (
          <VoiceRings color={waveColor} isMe={isMe} al={aristoLv} size={BUBBLE} />
        )}

        {isHostSeat && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30"
            style={{ filter: member ? "drop-shadow(0 0 5px #fbbf24)" : "drop-shadow(0 0 3px rgba(251,191,36,0.4))", transform: `translateX(-50%) scale(${scale})` }}>
            <CrownSVG size={10} color={member ? "#fbbf24" : "rgba(251,191,36,0.35)"} />
          </div>
        )}

        <GlassBubble size={BUBBLE} glowColor={glow} borderColor={border} bgGradient={bg}
          isSpeaking={isActuallySpeaking} isMe={isMe} seatSkinUrl={member ? seatSkinUrl : undefined} isEmpty={isEmpty}>
          {member ? (
            <div className="absolute inset-0 flex items-center justify-center z-10" style={{ overflow: "visible", pointerEvents: "none" }}>
              <UserAvatar 
                userId={member.profile?.userId as Id<"users">} 
                avatarUrl={isRestricted ? PRIVATE_AVATAR_URL : member.profile?.avatarUrl} 
                name={isRestricted ? "مستخدم مخفي" : member.profile?.name} 
                size={AVATAR} 
                showFrame={!isRestricted} 
              />
            </div>
          ) : isLocked ? (
            <div className="z-10"><LockSVG size={20 * scale} /></div>
          ) : isPK ? (
            <span className="z-10" style={{ fontSize: 16 * scale }}>{pkSide === "room1" ? "🐯" : "🦁"}</span>
          ) : (
            <div className="z-10"><EmptyMicSVG size={22 * scale} /></div>
          )}
        </GlassBubble>

        {member && (
          <div className="absolute -bottom-1 -left-1 rounded-full flex items-center justify-center z-30"
            style={{
              width: 17 * scale, height: 17 * scale,
              background: isMicMuted ? "linear-gradient(135deg,#dc2626,#991b1b)" : "linear-gradient(135deg,#16a34a,#15803d)",
              border: `${1.5 * scale}px solid rgba(0,0,0,0.5)`,
              boxShadow: isMicMuted ? `0 ${2*scale}px ${5*scale}px rgba(220,38,38,0.6)` : `0 ${2*scale}px ${5*scale}px rgba(22,163,74,0.6)`,
            }}>
            {isMicMuted ? <MicOffSVG size={8 * scale} /> : <MicOnSVG size={8 * scale} />}
          </div>
        )}
        {isCC && member && <div className="absolute -top-1 -right-1 z-30" style={{ transform: `scale(${scale})` }}><ContentCreatorHeart size={11} /></div>}
        {member?.profile?.isAgent && <div className="absolute -top-1 right-3 z-30" style={{ transform: `scale(${scale})` }}><AgentSeatIcon size={11} /></div>}
      </div>

      {/* اسم المستخدم أو رقم المقعد */}
      <div className="font-bold"
        style={{
          fontSize: (member ? 8 : 14) * scale,
          background: member
            ? isMe ? "linear-gradient(135deg, rgba(56,189,248,0.2), rgba(14,165,233,0.12))" : "rgba(15,10,25,0.95)"
            : "transparent",
          padding: member ? `${2*scale}px ${6*scale}px` : "0",
          borderRadius: 999,
          border: member ? `${1*scale}px solid ${
            isMe
              ? isActuallySpeaking ? `${waveColor}60` : "rgba(129,140,248,0.3)"
              : isOwnerSeat ? "rgba(251,191,36,0.3)" : isAdminSeat ? "rgba(192,132,252,0.3)" : "rgba(255,255,255,0.1)"
          }` : "none",
          boxShadow: isActuallySpeaking && isMe ? `0 0 ${8*scale}px ${waveColor}40` : member ? `0 ${2*scale}px ${5*scale}px rgba(0,0,0,0.5)` : "none",
          maxWidth: 60 * scale, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          transition: "all 0.3s ease",
          ...nameStyle,
          color: nameStyle.color ?? (member
            ? isMe
              ? isActuallySpeaking ? "#7dd3fc" : "#fde68a"
              : isOwnerSeat ? "#fbbf24" : isAdminSeat ? "#c084fc" : "#e5e7eb"
            : "rgba(255,255,255,0.9)"),
        }}>
        <div className="flex max-w-full items-center justify-center"><AristocracyName level={isRestricted ? 0 : getAristoLevel(member?.profile)} name={displayName} className="truncate" /></div>
      </div>


    </button>
  );
});

// Main Grid
function RoomSeatsGridInner({
  members, myProfile, maxSeats, isCp, isMusic, isAstronomy, isDesert, isRadio = false,
  isFootball = false, isKaraoke = false,
  isPK, pkRoom1Id, pkRoom2Id, roomId,
  ownerIsVip12, isMuted, isOwner, isAdmin, isSuperAdmin = false, hideRoyalSeats = false,
  speakingUsers, activeEmojis, seatPositions,
  seatsGridRef, lockedSeats, onSeatPress, onViewProfile,
}: RoomSeatsGridProps) {

  const halfSeats = Math.ceil(maxSeats / 2);
  const getPKSide = (seatIndex: number) => {
    if (!isPK) return null;
    const isRoom1 = roomId === pkRoom1Id;
    if (seatIndex < halfSeats) return isRoom1 ? "room1" : "room2";
    return isRoom1 ? "room2" : "room1";
  };

  const getMemberSpeakerIds = (member: any): string[] => {
    const raw = member?.profile?.userId != null ? String(member.profile.userId) : "";
    if (!raw) return [];
    // Agora historically used a numeric hash; ZEGOCLOUD uses the raw userId in pub_<userId>.
    const hash = String(Math.abs(raw.split("").reduce((acc: number, c: string) => acc * 31 + c.charCodeAt(0), 0) % 100000000));
    return [raw, hash, `pub_${raw}`, `pub_${hash}`];
  };

  // تصغير المقاعد تلقائياً للأعداد الكبيرة
  const scale = maxSeats > 10 ? 0.75 : 1;
  const gapY = maxSeats > 10 ? 3 : 5;

  return (
    <>
      <style>{`
        @keyframes voiceRing {
          0%   { transform: scale(1);   opacity: 0.85; }
          100% { transform: scale(2.0); opacity: 0;    }
        }
        @keyframes ccHB {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 3px #3b82f6); }
          30% { transform: scale(1.4); filter: drop-shadow(0 0 7px #60a5fa) drop-shadow(0 0 12px #3b82f6); }
          60% { transform: scale(0.95); filter: drop-shadow(0 0 4px #3b82f6); }
        }
      `}</style>

      <div className="flex-shrink-0 px-2 pt-3 pb-3 relative" ref={seatsGridRef}
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <SeatEmojiOverlay activeEmojis={activeEmojis} seatPositions={seatPositions} />

        {isPK && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-px h-10 bg-gradient-to-b from-transparent via-orange-500/70 to-transparent" />
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #1a0820, #0a0510)", border: "2px solid rgba(249,115,22,0.8)", boxShadow: "0 0 16px rgba(249,115,22,0.6)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 17.5L3 6M3 6h5M3 6v5M9.5 6.5L21 18M21 18h-5M21 18v-5" />
                </svg>
              </div>
              <div className="w-px h-10 bg-gradient-to-b from-transparent via-orange-500/70 to-transparent" />
            </div>
          </div>
        )}

        {isKaraoke ? (
          <div className="flex flex-col items-center gap-4 px-1">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 rounded-full border border-fuchsia-300/35 bg-fuchsia-950/45 px-4 py-1.5 text-[10px] font-black tracking-[0.16em] text-fuchsia-100 shadow-[0_0_18px_rgba(217,70,239,0.28)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0M12 17v4M8 21h8" /></svg>
                MAIN MIC
              </div>
              <KaraokeSeat
                seatIndex={0}
                member={members?.find((m) => m.seatIndex === 0)}
                myProfile={myProfile}
                isMuted={isMuted}
                isSpeaking={getMemberSpeakerIds(members?.find((m) => m.seatIndex === 0)).some((speakerId) => speakingUsers.has(speakerId))}
                isLocked={lockedSeats.includes(0)}
                onPress={() => onSeatPress(0)}
                onViewProfile={onViewProfile}
                getMemberSpeakerIds={getMemberSpeakerIds}
                size={92}
                isMain
              />
            </div>
            <div className="grid w-full grid-cols-5 gap-x-1.5 gap-y-4">
              {Array.from({ length: 10 }, (_, offset) => {
                const i = offset + 1;
                const member = members?.find((m) => m.seatIndex === i);
                return (
                  <KaraokeSeat
                    key={i}
                    seatIndex={i}
                    member={member}
                    myProfile={myProfile}
                    isMuted={isMuted}
                    isSpeaking={getMemberSpeakerIds(member).some((speakerId) => speakingUsers.has(speakerId))}
                    isLocked={lockedSeats.includes(i)}
                    onPress={() => onSeatPress(i)}
                    onViewProfile={onViewProfile}
                    getMemberSpeakerIds={getMemberSpeakerIds}
                    size={62}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className={`grid grid-cols-5 gap-x-1`} style={{ rowGap: `${gapY * 4}px` }}>
            {Array.from({ length: maxSeats }, (_, i) => {
              const member = members?.find((m) => m.seatIndex === i);
              const memberSpeakerIds = getMemberSpeakerIds(member);
              const isSpeaking = memberSpeakerIds.some((speakerId) => speakingUsers.has(speakerId));
              const isMe = member?.profile?.userId === myProfile?.userId;
              const isLocked = lockedSeats.includes(i);
              const pkSide = getPKSide(i);
              const isHostSeat = i === 0;
              return (
                <RegularSeat key={i} seatIndex={i} member={member} isMe={isMe} isMuted={isMuted}
                  isSpeaking={isSpeaking} isLocked={isLocked} isPK={isPK} pkSide={pkSide}
                  isHostSeat={isHostSeat} onPress={() => onSeatPress(i)} scale={scale} />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function KaraokeSeat({ seatIndex, member, myProfile, isMuted, isSpeaking, isLocked, onPress, onViewProfile, getMemberSpeakerIds, size, isMain = false }: any) {
  const isMe = member?.profile?.userId === myProfile?.userId;
  const profile = member?.profile;
  const waveColor = isMain ? "#f0abfc" : "#d946ef";
  const displayName = profile?.name || (member ? "مستخدم" : `مقعد ${seatIndex}`);
  const isEmpty = !member;
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      <button type="button" onClick={onPress} className="relative flex items-center justify-center rounded-full outline-none transition-transform active:scale-95" style={{ width: size, height: size }} aria-label={isEmpty ? `فتح المقعد ${seatIndex}` : `مقعد ${displayName}`}>
        {isSpeaking && <VoiceRings color={waveColor} isMe={isMe} al={isMain ? 7 : 0} size={size} />}
        <div className="relative z-10 flex h-full w-full items-center justify-center rounded-full border-2" style={{ borderColor: isSpeaking ? waveColor : isMain ? "#f0abfc" : "rgba(232,121,249,.6)", background: isEmpty ? "linear-gradient(145deg,rgba(255,255,255,.2),rgba(168,85,247,.18))" : "rgba(24,5,45,.2)", boxShadow: isSpeaking ? `0 0 0 3px ${waveColor}55,0 0 24px ${waveColor}aa` : `0 0 16px rgba(217,70,239,.28)` }}>
          {isEmpty ? <svg width={isMain ? 34 : 24} height={isMain ? 34 : 24} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0M12 17v4M8 21h8" /></svg> : <UserAvatar profile={profile} size={size - 8} />}
        </div>
        <span className="absolute -bottom-1 z-20 flex h-5 min-w-5 items-center justify-center rounded-full border border-fuchsia-200/40 bg-fuchsia-900/85 px-1 text-[9px] font-black text-fuchsia-50">{seatIndex === 0 ? "MIC" : seatIndex}</span>
        <span className="absolute -left-1 bottom-1 z-20 flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-fuchsia-700/90">{isMuted ? <MicOffSVG size={10} /> : <MicOnSVG size={10} />}</span>
        {isLocked && <span className="absolute inset-0 z-30 flex items-center justify-center rounded-full bg-black/50"><LockSVG size={20} /></span>}
      </button>
      <button type="button" onClick={() => member && onViewProfile(member.profile?.userId)} className="max-w-full truncate text-[10px] font-bold text-fuchsia-100" style={{ textShadow: "0 0 8px rgba(217,70,239,.8)" }}>{displayName}</button>
    </div>
  );
}

function seatsAreEqual(prev: RoomSeatsGridProps, next: RoomSeatsGridProps) {
  if (prev.speakingUsers !== next.speakingUsers) return false;
  if (prev.activeEmojis !== next.activeEmojis) return false;
  if (prev.isMuted !== next.isMuted) return false;
  if (prev.isPK !== next.isPK) return false;
  if (prev.maxSeats !== next.maxSeats) return false;
  if (prev.seatPositions !== next.seatPositions) return false;
  const sig = (m: any[]) => (m ?? []).filter((x) => x.seatIndex != null)
    .map((x) => `${x.seatIndex}:${x.userId}:${x.role}:${x.isMuted}`).sort().join("|");
  if (sig(prev.members) !== sig(next.members)) return false;
  return true;
}

export default memo(RoomSeatsGridInner, seatsAreEqual);
