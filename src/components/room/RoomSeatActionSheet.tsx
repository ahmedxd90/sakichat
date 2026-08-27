// @ts-nocheck
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "../../lib/toast";
import UserAvatar from "../UserAvatar";
import { VipFrame } from "../VipBadge";
import { PRIVATE_AVATAR_URL, PRIVATE_DISPLAY_NAME, isPrivateUser } from "../../lib/privateUser";
import { Crown, Lock, LockOpen, Mic, UserRound, UserRoundCheck, DoorOpen, Send, Shield } from "lucide-react";

interface RoomSeatActionSheetProps {
  selectedSeat: number;
  members: any[];
  myProfile: any;
  isCp: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  roomId: string;
  lockedSeats: number[];
  onClose: () => void;
  onTakeSeat: (seatIndex: number) => void;
  onLeaveSeat: () => void;
  onSelectUser?: (member: any) => void;
  inviteTargetUser?: any;
  onViewMyProfile?: () => void;
}

export default function RoomSeatActionSheet({
  selectedSeat,
  members,
  myProfile,
  isCp,
  isOwner,
  isAdmin,
  roomId,
  lockedSeats,
  onClose,
  onTakeSeat,
  onLeaveSeat,
  onSelectUser,
  inviteTargetUser,
  onViewMyProfile,
}: RoomSeatActionSheetProps) {
  const seatMember = members?.find((m) => m.seatIndex === selectedSeat);
  const isMySeat = seatMember?.profile?.user_id === myProfile?.user_id;
  const safeLockedSeats = lockedSeats ?? [];
  const isLocked = safeLockedSeats.includes(selectedSeat);
  const canManage = isOwner || isAdmin;
  const isRoyalSeat = selectedSeat === -2 || selectedSeat === -1;
  const seatInvitesEnabled = true;
  const [showInvitePicker, setShowInvitePicker] = useState(false);
  const royalLabel = selectedSeat === -2 ? "Sheikh" : "King";

  const accentColor = isRoyalSeat ? "#fbbf24" : isCp ? "#ff4d6d" : "#a855f7";
  const accentGlow = isRoyalSeat ? "rgba(251,191,36,0.3)" : isCp ? "rgba(255,77,109,0.3)" : "rgba(168,85,247,0.3)";

  const handleToggleLock = async () => {
    try {
      const newLockedSeats = isLocked 
        ? safeLockedSeats.filter(s => s !== selectedSeat)
        : [...safeLockedSeats, selectedSeat];
      
      const { error } = await supabase.from('rooms').update({ locked_seats: newLockedSeats }).eq('id', roomId);
      if (error) throw error;
      toast.success(isLocked ? "تم فتح المقعد" : "تم قفل المقعد");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const inviteTargetName = inviteTargetUser?.profile?.name ?? inviteTargetUser?.name ?? "المستخدم";
  const isPrivateSeatMember = Boolean(seatMember && isPrivateUser(seatMember, myProfile?.userId));
  const seatTitle = isMySeat
    ? "مقعدك"
    : seatMember
      ? (isPrivateSeatMember ? PRIVATE_DISPLAY_NAME : seatMember.profile?.name)
      : isRoyalSeat
        ? (selectedSeat === -2 ? "مقعد الشيخ الملكي" : "مقعد الملك الملكي")
        : `المقعد ${selectedSeat + 1}`;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative rounded-t-3xl border-t border-white/10 animate-slide-up-sheet overflow-hidden"
        style={isRoyalSeat ? { background: "#1a1200" } : isCp ? { background: "#1a000d" } : { background: "#1a1a2e" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: `${accentColor}40` }} />
        </div>

        {/* Royal seat header decoration */}
        {isRoyalSeat && (
          <div className="flex justify-center pb-1">
            <div className="flex items-center gap-2 px-4 py-1 rounded-full" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }}>
              <Shield size={14} strokeWidth={1.8} style={{ color: "#fbbf24" }} />
              <span className="text-[11px] font-bold" style={{ color: "#fbbf24" }}>
                {selectedSeat === -2 ? "مقعد الشيخ الملكي" : "مقعد الملك الملكي"}
              </span>
              <Shield size={14} strokeWidth={1.8} style={{ color: "#fbbf24" }} />
            </div>
          </div>
        )}

        {/* Seat header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
              style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}50`, color: accentColor }}
            >
              {isRoyalSeat ? <Crown size={16} strokeWidth={1.8} /> : selectedSeat + 1}
            </div>
            <div>
              <p className="text-white font-bold text-sm">{seatTitle}</p>
              {!isRoyalSeat && (
                <p className="text-xs" style={{ color: isLocked ? "#ef4444" : "#22c55e" }}>
                  {isLocked ? <span className="inline-flex items-center gap-1"><Lock size={12} /> مقفول</span> : <span className="inline-flex items-center gap-1"><LockOpen size={12} /> مفتوح</span>}
                </p>
              )}
              {isRoyalSeat && (
                <p className="text-xs" style={{ color: "#fbbf24" }}>
                  ✨ للمالك والمشرف فقط
                </p>
              )}
            </div>
          </div>

          {/* Seat occupant avatar */}
          {seatMember && (
            <VipFrame isVip={isPrivateSeatMember ? false : seatMember.profile?.isVip} level={seatMember.profile?.vipLevel}>
              <UserAvatar
                userId={seatMember.profile?.userId}
                avatarUrl={isPrivateSeatMember ? PRIVATE_AVATAR_URL : seatMember.profile?.avatarUrl}
                name={isPrivateSeatMember ? PRIVATE_DISPLAY_NAME : seatMember.profile?.name}
                size={44}
                showFrame={!isPrivateSeatMember}
              />
            </VipFrame>
          )}
          {!seatMember && (
            <div
              className="w-11 h-11 rounded-full border-2 border-dashed flex items-center justify-center"
              style={{ borderColor: isRoyalSeat ? "rgba(251,191,36,0.4)" : isLocked ? "#ef444460" : `${accentColor}40` }}
            >
              {isRoyalSeat ? <Crown size={20} /> : isLocked ? <Lock size={18} /> : <UserRound size={20} className="text-gray-500" />}
            </div>
          )}
        </div>

        <div className="px-5 pb-6 space-y-2.5">
          {/* My seat → view profile + leave */}
          {isMySeat && (
            <>
              {onViewMyProfile && (
                <button
                  onClick={() => { onViewMyProfile(); onClose(); }}
                  className="w-full py-3.5 rounded-2xl text-white font-bold text-base"
                  style={{
                    background: isRoyalSeat
                      ? "linear-gradient(135deg,#92400e,#fbbf24)"
                      : isCp
                        ? "linear-gradient(135deg,#c9184a,#ff4d6d)"
                        : "linear-gradient(to right,#a855f7,#ec4899)",
                    boxShadow: `0 4px 20px ${accentGlow}`,
                  }}
                >
                  <span className="inline-flex items-center gap-2"><UserRoundCheck size={17} /> عرض معلومات المستخدم</span>
                </button>
              )}
              <button
                onClick={onLeaveSeat}
                className="w-full py-3.5 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-base"
              >
                <span className="inline-flex items-center gap-2"><DoorOpen size={17} /> مغادرة المقعد</span>
              </button>
            </>
          )}

          {/* Empty royal seat - only owner/admin can sit */}
          {!seatMember && isRoyalSeat && canManage && (
            <button
              onClick={() => onTakeSeat(selectedSeat)}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-base shadow-lg"
              style={{ background: "linear-gradient(135deg,#92400e,#d97706,#fbbf24)", boxShadow: "0 4px 20px rgba(251,191,36,0.4)" }}
            >
              <span className="inline-flex items-center gap-2"><Crown size={17} /> الجلوس على المقعد الملكي</span>
            </button>
          )}

          {/* Royal seat restricted */}
          {!seatMember && isRoyalSeat && !canManage && (
            <div className="w-full py-3.5 rounded-2xl text-center" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
              <p className="text-yellow-400 font-bold text-base inline-flex items-center justify-center gap-2"><Crown size={16} /> هذا المقعد للمالك والمشرف فقط</p>
            </div>
          )}

          {/* Empty regular seat → take or invite a selected user */}
          {!seatMember && !isRoyalSeat && (!isLocked || canManage) && (
            <button
              onClick={async () => {
                if (inviteTargetUser) {
                  if (!seatInvitesEnabled) {
                    toast.error("دعوات المقاعد غير متاحة حالياً");
                    return;
                  }
                  try {
                    const { error } = await supabase.from('seat_invites').insert({
                      room_id: roomId,
                      inviter_user_id: myProfile.user_id,
                      target_user_id: inviteTargetUser.user_id ?? inviteTargetUser.profile?.user_id,
                      seat_index: selectedSeat,
                      status: 'pending'
                    });
                    if (error) throw error;
                    toast.success(`تمت دعوة ${inviteTargetName} إلى المقعد`);
                    onClose();
                  } catch (e: any) {
                    toast.error(e?.message || "فشل إرسال الدعوة");
                  }
                  return;
                }
                onTakeSeat(selectedSeat);
              }}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-base shadow-lg"
              style={{
                background: isCp
                  ? "linear-gradient(135deg,#c9184a,#ff4d6d)"
                  : "linear-gradient(to right,#a855f7,#ec4899)",
                boxShadow: `0 4px 20px ${accentGlow}`,
              }}
              >
              <span className="inline-flex items-center gap-2">{inviteTargetUser ? <><Send size={16} /> دعوة {inviteTargetName} للمقعد</> : <><Mic size={16} /> أخذ المقعد</>}</span>
            </button>
          )}

          {/* Locked seat message for non-admin */}
          {!seatMember && !isRoyalSeat && isLocked && !canManage && (
            <div className="w-full py-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
              <p className="text-red-400 font-bold text-base inline-flex items-center justify-center gap-2"><Lock size={16} /> هذا المقعد مقفول</p>
            </div>
          )}

          {/* View profile of occupant */}
          {seatMember && !isMySeat && onSelectUser && (
            <button
              onClick={() => { onSelectUser(seatMember); onClose(); }}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-base"
              style={{
                background: isRoyalSeat
                  ? "linear-gradient(135deg,#92400e,#fbbf24)"
                  : isCp
                    ? "linear-gradient(135deg,#c9184a,#ff4d6d)"
                    : "linear-gradient(to right,#a855f7,#ec4899)",
                boxShadow: `0 4px 20px ${accentGlow}`,
              }}
            >
              <span className="inline-flex items-center gap-2"><UserRoundCheck size={17} /> عرض الملف الشخصي</span>
            </button>
          )}

          {/* Lock / Unlock seat & Invite user (owner or admin only, not royal) */}
          {canManage && !isRoyalSeat && (
            <>
              <button
                onClick={handleToggleLock}
                className="w-full py-3.5 rounded-2xl font-bold text-base"
                style={
                  isLocked
                    ? { background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }
                    : { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }
                }
              >
                <span className="inline-flex items-center gap-2">{isLocked ? <><LockOpen size={16} /> فتح المقعد</> : <><Lock size={16} /> قفل المقعد</>}</span>
              </button>

              {!seatMember && seatInvitesEnabled && (
                <button
                  onClick={() => setShowInvitePicker(!showInvitePicker)}
                  className="w-full py-3.5 rounded-2xl font-bold text-base text-white"
                  style={{ background: "linear-gradient(135deg,#3b82f6,#1d4ed8)" }}
                >
                  <span className="inline-flex items-center gap-2"><Send size={16} /> دعوة مستخدم للمقعد</span>
                </button>
              )}

              {showInvitePicker && seatInvitesEnabled && (
                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-black/40 border border-white/10">
                  <p className="text-xs text-gray-400 font-bold px-1 text-right">اختر مستخدماً للدعوة:</p>
                  {members?.filter((m: any) => m.seatIndex === undefined || m.seatIndex === null).map((m: any) => (
                    <div key={m._id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10">
                      <div className="flex items-center gap-2">
                        <UserAvatar userId={m.profile?.userId} avatarUrl={m.profile?.avatarUrl} name={m.profile?.name} size={32} />
                        <span className="text-white text-xs font-bold">{m.profile?.name}</span>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const { error } = await supabase.from('seat_invites').insert({
                              room_id: roomId,
                              inviter_user_id: myProfile.user_id,
                              target_user_id: m.profile.user_id,
                              seat_index: selectedSeat,
                              status: 'pending'
                            });
                            if (error) throw error;
                            toast.success(`✅ تم إرسال الدعوة إلى ${m.profile?.name}`);
                            setShowInvitePicker(false);
                            onClose();
                          } catch (e: any) {
                            toast.error(e?.message || "فشل إرسال الدعوة");
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-black text-white bg-purple-600 active:scale-95"
                      >
                        دعوة
                      </button>
                    </div>
                  ))}
                  {members?.filter((m: any) => m.seatIndex === undefined || m.seatIndex === null).length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-2">لا يوجد مستخدمون متاحون خارج المقاعد</p>
                  )}
                </div>
              )}
            </>
          )}

          <button onClick={onClose} className="w-full py-3 rounded-2xl bg-white/5 text-gray-400 font-medium text-sm">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
