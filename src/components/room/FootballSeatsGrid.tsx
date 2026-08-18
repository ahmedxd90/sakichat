// @ts-nocheck
import React, { memo } from "react";
import UserAvatar from "../UserAvatar";
import SeatEmojiOverlay from "../SeatEmojiOverlay";
import { SeatEmojiItem } from "../../types/room";

interface FootballSeatsGridProps {
  members: any[];
  myProfile: any;
  maxSeats: number;
  isMuted: boolean;
  speakingUsers: Set<string>;
  activeEmojis: SeatEmojiItem[];
  seatPositions: Array<{ x: number; y: number } | null>;
  seatsGridRef: React.RefObject<HTMLDivElement>;
  lockedSeats: number[];
  onSeatPress: (seatIndex: number) => void;
}

// Football seat wave animation
const FootballWaves = memo(function FootballWaves({ speaking }: { speaking: boolean }) {
  if (!speaking) return null;
  return (
    <div className="absolute inset-0 rounded-full pointer-events-none" style={{ overflow: "visible" }}>
      {[0, 1, 2].map((ri) => (
        <div
          key={ri}
          className="absolute rounded-full"
          style={{
            inset: -(ri + 1) * 5,
            border: `2px solid ${ri === 0 ? "#22c55e" : ri === 1 ? "#16a34a" : "#fbbf24"}`,
            opacity: 0.8 - ri * 0.22,
            animation: `fbWave2 1.3s ease-out ${ri * 0.28}s infinite`,
          }}
        />
      ))}
    </div>
  );
});

const FootballSeat = memo(function FootballSeat({
  seatIndex, member, isMe, isSpeaking, isLocked, onPress,
}: {
  seatIndex: number; member: any; isMe: boolean;
  isSpeaking: boolean; isLocked: boolean; onPress: () => void;
}) {
  const isMicMuted = member?.isMuted;
  const speaking = isSpeaking && member && !isMicMuted;

  return (
    <button
      data-seat={seatIndex}
      onClick={onPress}
      className="flex flex-col items-center gap-0.5 active:scale-95 transition-all"
      style={{ minWidth: 46 }}
    >
      <div className="relative" style={{ overflow: "visible" }}>
        <FootballWaves speaking={speaking} />

        {/* Seat glow ring */}
        {speaking && (
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              inset: -3,
              background: "radial-gradient(circle, rgba(34,197,94,0.25) 0%, transparent 70%)",
              animation: "fbPulse 1.5s ease-in-out infinite",
            }}
          />
        )}

        <div
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: 44,
            height: 44,
            background: member
              ? "linear-gradient(145deg,#0d2010,#051a0a)"
              : "linear-gradient(145deg,rgba(8,22,8,0.92),rgba(4,12,4,0.96))",
            border: `2px solid ${
              speaking
                ? "rgba(34,197,94,0.9)"
                : isMe
                ? "rgba(251,191,36,0.6)"
                : member
                ? "rgba(34,197,94,0.4)"
                : "rgba(34,197,94,0.2)"
            }`,
            boxShadow: speaking
              ? "0 0 16px rgba(34,197,94,0.6), 0 0 30px rgba(34,197,94,0.2)"
              : isMe
              ? "0 0 10px rgba(251,191,36,0.3)"
              : "0 3px 8px rgba(0,0,0,0.5)",
          }}
        >
          {member ? (
            <div className="absolute inset-0 flex items-center justify-center" style={{ overflow: "visible" }}>
              <UserAvatar
                userId={member.profile?.userId}
                avatarUrl={member.profile?.avatarUrl}
                name={member.profile?.name}
                size={40}
                showFrame={true}
              />
            </div>
          ) : isLocked ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="10" rx="2.5" fill="rgba(239,68,68,0.8)" />
              <path d="M8 11V7a4 4 0 018 0v4" stroke="rgba(239,68,68,0.8)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <span style={{ fontSize: 16 }}>⚽</span>
          )}

          {/* Mic indicator */}
          {member && (
            <div
              className="absolute -bottom-1 -left-1 w-[14px] h-[14px] rounded-full flex items-center justify-center z-30"
              style={{
                background: isMicMuted ? "#dc2626" : "#16a34a",
                border: "1.5px solid rgba(0,0,0,0.5)",
              }}
            >
              {isMicMuted ? (
                <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <line x1="1" y1="1" x2="23" y2="23" stroke="#ff4444" />
                  <path d="M9 9v3a3 3 0 005.12 2.12" />
                </svg>
              ) : (
                <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                </svg>
              )}
            </div>
          )}

          {/* Seat number for empty */}
          {!member && !isLocked && (
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-30 px-1 rounded-full"
              style={{
                background: "rgba(34,197,94,0.25)",
                border: "1px solid rgba(34,197,94,0.35)",
                fontSize: 7,
                color: "rgba(255,255,255,0.6)",
                fontWeight: "bold",
                lineHeight: "13px",
              }}
            >
              {seatIndex + 1}
            </div>
          )}
        </div>
      </div>

      <span
        className="text-[8px] font-bold truncate max-w-[46px] text-center"
        style={{ color: member ? (isMe ? "#fbbf24" : "#22c55e") : "rgba(255,255,255,0.3)" }}
      >
        {member
          ? isMe
            ? "أنا"
            : member.profile?.isPrivateProfile
            ? "🔒"
            : member.profile?.name ?? "—"
          : `م${seatIndex + 1}`}
      </span>
    </button>
  );
});

export default function FootballSeatsGrid({
  members,
  myProfile,
  maxSeats,
  isMuted,
  speakingUsers,
  activeEmojis,
  seatPositions,
  seatsGridRef,
  lockedSeats,
  onSeatPress,
}: FootballSeatsGridProps) {
  // Football theme: always 5 seats max
  const seats = Math.min(maxSeats, 5);

  const getMemberUid = (member: any) =>
    member?.profile?.userId
      ? String(
          Math.abs(
            member.profile.userId
              .replace(/[^a-zA-Z0-9_-]/g, "")
              .split("")
              .reduce((acc: number, c: string) => acc * 31 + c.charCodeAt(0), 0) % 100000000
          )
        )
      : "";

  return (
    <>
      <style>{`
        @keyframes fbWave2 {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes fbPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
      <div
        className="flex-shrink-0 px-2 pt-1.5 pb-2 relative"
        ref={seatsGridRef}
        style={{ borderBottom: "1px solid rgba(34,197,94,0.12)" }}
      >
        <SeatEmojiOverlay activeEmojis={activeEmojis} seatPositions={seatPositions} />

        {/* Football field line decoration */}
        <div className="flex items-center gap-2 mb-1.5 px-2">
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(34,197,94,0.4),transparent)" }} />
          <div className="flex items-center gap-1">
            <span className="text-green-500 text-[9px] font-bold">⚽</span>
            <span className="text-green-500 text-[9px] font-bold">المقاعد</span>
            <span className="text-green-500 text-[9px] font-bold">⚽</span>
          </div>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(34,197,94,0.4),transparent)" }} />
        </div>

        {/* Seats row - centered, 5 seats */}
        <div className="flex justify-center gap-2.5">
          {Array.from({ length: seats }, (_, i) => {
            const member = members?.find((m: any) => m.seatIndex === i);
            const memberUid = getMemberUid(member);
            const isSpeaking = speakingUsers.has(memberUid);
            const isMe = member?.profile?.userId === myProfile?.userId;
            const isLocked = lockedSeats.includes(i);
            return (
              <FootballSeat
                key={i}
                seatIndex={i}
                member={member}
                isMe={isMe}
                isSpeaking={isSpeaking}
                isLocked={isLocked}
                onPress={() => onSeatPress(i)}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
