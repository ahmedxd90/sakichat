// @ts-nocheck
import { Id } from "../../../convex/_generated/dataModel";
import { VipFrame, VipName, VipBadge } from "../VipBadge";
import { AristocracyName, AristocracyBadge, getAristocracyConfig } from "../AristocracyBadge";
import UserAvatar from "../UserAvatar";

// ── لون الاسم: استقراطية أولاً ──
const ARISTO_COLORS: Record<number, string> = {
  1: "#60a5fa", 2: "#34d399", 3: "#a78bfa",
  4: "#f472b6", 5: "#fb923c", 6: "#f97316",
  7: "#ffd700", 8: "#e879f9",
};
function getMemberNameStyle(profile: any): React.CSSProperties {
  const al = profile?.aristocracyLevel ?? 0;
  const ae = profile?.aristocracyExpiresAt ?? null;
  if (al > 0 && ae && ae > Date.now()) {
    const c = ARISTO_COLORS[al] ?? "#60a5fa";
    return { color: c, textShadow: `0 0 8px ${c}70` };
  }
  if (profile?.isVip) return { color: "#fbbf24" };
  if (profile?.isSuperAdmin) return { color: "#ffd700" };
  return { color: "white" };
}

interface RoomMembersSheetProps {
  members: any[];
  myProfile: any;
  isMuted: boolean;
  onClose: () => void;
  onSelectUser: (member: any) => void;
}

export default function RoomMembersSheet({
  members,
  myProfile,
  isMuted,
  onClose,
  onSelectUser,
}: RoomMembersSheetProps) {
  const seated = members?.filter((m) => m.seatIndex !== undefined && m.seatIndex !== null) ?? [];
  const listeners = members?.filter((m) => m.seatIndex === undefined || m.seatIndex === null) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}>
      <div
        className="w-full rounded-t-3xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, rgba(20,15,35,0.98) 0%, rgba(12,8,22,0.99) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "none",
          maxHeight: "75vh",
          animation: "slideUpSheet 0.3s cubic-bezier(0.32,0.72,0,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`@keyframes slideUpSheet { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.3)" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-black text-sm">المتصلون</h3>
              <p className="text-white/40 text-[10px]">{members?.length ?? 0} شخص</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain px-1 pb-2" style={{ maxHeight: "calc(75vh - 100px)", WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}>
          {/* Seated section */}
          {seated.length > 0 && (
            <div className="px-4 pt-3 pb-1">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: "0 0 6px rgba(74,222,128,0.8)" }} />
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">على المقاعد ({seated.length})</span>
              </div>
              <div className="space-y-1">
                {seated.map((member) => (
                  <MemberRow key={member._id} member={member} myProfile={myProfile} isMuted={isMuted} onSelect={() => { onSelectUser(member); onClose(); }} />
                ))}
              </div>
            </div>
          )}

          {/* Listeners section */}
          {listeners.length > 0 && (
            <div className="px-4 pt-3 pb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400/60" />
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">مستمعون ({listeners.length})</span>
              </div>
              <div className="space-y-1">
                {listeners.map((member) => (
                  <MemberRow key={member._id} member={member} myProfile={myProfile} isMuted={isMuted} onSelect={() => { onSelectUser(member); onClose(); }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MemberRow({ member, myProfile, isMuted, onSelect }: { member: any; myProfile: any; isMuted: boolean; onSelect: () => void }) {
  const isPrivateMember = Boolean(member.profile?.isPrivateProfile && member.profile?.userId !== myProfile?.userId);
  const privateAvatarUrl = "/assets/privacy/private-person-icon.svg";
  const isVipM = isPrivateMember ? false : (member.profile?.isVip ?? false);
  const memberVipLevel = member.profile?.vipLevel;
  const memberAristoLevel = isPrivateMember ? 0 : (member.profile?.aristocracyLevel ?? 0);
  const memberAristoActive = memberAristoLevel > 0 && member.profile?.aristocracyExpiresAt && member.profile.aristocracyExpiresAt > Date.now();
  const isMe = member.profile?.userId === myProfile?.userId;
  const isOnSeat = member.seatIndex !== undefined && member.seatIndex !== null;
  const memberMuted = isMe ? isMuted : member.isMuted;
  const nameStyle = getMemberNameStyle(member.profile);

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-right active:scale-[0.98] transition-all"
      style={{
        background: isMe ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.03)",
        border: isMe ? "1px solid rgba(168,85,247,0.2)" : "1px solid rgba(255,255,255,0.04)",
      }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <VipFrame isVip={isVipM} level={memberVipLevel}>
          <UserAvatar userId={member.userId as Id<"users">} avatarUrl={isPrivateMember ? privateAvatarUrl : member.profile?.avatarUrl} name={isPrivateMember ? "شخصي" : member.profile?.name} size={42} showFrame={!isPrivateMember} />
        </VipFrame>
        {/* Online dot */}
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0f0a1e]"
          style={{ background: isOnSeat ? "#4ade80" : "#60a5fa", boxShadow: `0 0 6px ${isOnSeat ? "rgba(74,222,128,0.8)" : "rgba(96,165,250,0.6)"}` }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 text-right">
        <div className="flex items-center gap-1 flex-wrap justify-end">
          {member.role === "owner" && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>مالك</span>}
          {member.role === "admin" && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full" style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }}>مشرف</span>}
          {!isPrivateMember && memberAristoActive && <AristocracyBadge level={memberAristoLevel} size="xs" />}
          <AristocracyName level={isPrivateMember ? 0 : (memberAristoActive ? memberAristoLevel : 0)} name={isPrivateMember ? "شخصي" : (isMe ? "أنا" : (member.profile?.name ?? "مجهول"))} className="max-w-[145px] truncate text-[12px]" />
        </div>
        <div className="mt-1 flex items-center justify-end gap-1.5">
          {!isPrivateMember && isOnSeat ? (
            <span className="text-[9px]" style={{ color: "rgba(74,222,128,0.7)" }}>
              <span className="inline-flex items-center gap-1"><span className="text-[10px]">●</span> مقعد {(member.seatIndex ?? 0) + 1}</span>
            </span>
          ) : (
            <span className="text-[9px]" style={{ color: "rgba(96,165,250,0.6)" }}>
              <span className="inline-flex items-center gap-1"><span className="text-[10px]">◌</span> مستمع</span>
            </span>
          )}
        </div>
      </div>

      {/* Mic status */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={
          memberMuted
            ? { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" }
            : { background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)" }
        }
      >
        {memberMuted ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
            <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v4M8 23h8" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
          </svg>
        )}
      </div>
    </button>
  );
}
