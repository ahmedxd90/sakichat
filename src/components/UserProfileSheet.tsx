// @ts-nocheck
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "../lib/toast";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, memo, useCallback } from "react";
import FriendButton from "./FriendButton";
import { ARAB_COUNTRIES } from "../data/countries";
import UserAvatar from "./UserAvatar";
import { getVipConfig, VipBadge } from "./VipBadge";
import { getAristocracyConfig, AristocracyBadge, AristocracyName } from "./AristocracyBadge";
import { TitleBadges } from "./TitleBadges";
import { LevelIconSvg } from "./LevelBadgeInline";
import SakiIdDisplay from "./SakiIdDisplay";
import SVGAPlayer from "./SVGAPlayer";
import { 
  Heart, 
  User, 
  MessageCircle, 
  Gift, 
  ShieldAlert, 
  MicOff, 
  MessageSquareOff, 
  UserPlus, 
  LogOut, 
  Ban,
  ShieldCheck,
  PhoneCall,
  TriangleAlert,
  Star,
  Flame,
  UserCheck
} from "lucide-react";

interface UserProfileSheetProps {
  selectedUser: any;
  myProfile: any;
  isOwner: boolean;
  isAdmin: boolean;
  roomId: Id<"rooms">;
  userActiveItems: any;
  userCpPartner: any;
  onClose: () => void;
  onSendGift: (user: any) => void;
  onViewProfile?: (userId: Id<"users">) => void;
  onMessage?: (userId: Id<"users">) => void;
  muteChatMember: any;
  kickMember: any;
  banMember: any;
  setAdminRole: any;
  onMention?: (name: string) => void;
  onInviteToSeat?: (member: any) => void;
}

// ── Report Sheet ──
const ReportSheet = memo(function ReportSheet({ userId, onClose }: { userId: Id<"users">; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const reportUser = useMutation(api.userReports.reportUser);
  const reasons = ["محتوى مسيء أو مزعج", "انتحال شخصية", "تحرش أو إزعاج", "محتوى غير لائق", "احتيال أو نصب", "سبب آخر"];
  
  const handleSubmit = async () => {
    if (!reason) { toast.error("اختر سبب الإبلاغ"); return; }
    setLoading(true);
    try { 
      await reportUser({ reportedId: userId, reason, details: details || undefined }); 
      toast.success("تم إرسال البلاغ ✅"); 
      onClose(); 
    } catch (e: any) { 
      toast.error(e?.message || e); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div className="relative w-full max-w-xs bg-white rounded-3xl p-6 text-center overflow-hidden border border-amber-200 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center mb-4 text-amber-500">
          <TriangleAlert size={40} />
        </div>
        <h3 className="text-slate-900 font-black text-lg mb-4">إبلاغ عن مخالفة</h3>
        <div className="space-y-2 mb-4 max-h-[40vh] overflow-y-auto pr-1">
          {reasons.map((r) => (
            <button key={r} onClick={() => setReason(r)} 
              className={`w-full text-right px-4 py-3 rounded-2xl text-xs font-bold transition-all active:scale-95 border ${
                reason === r ? "bg-amber-50 border-amber-400 text-amber-700" : "bg-slate-50 border-slate-100 text-slate-500"
              }`}>
              {reason === r ? "✓ " : ""}{r}
            </button>
          ))}
        </div>
        <textarea 
          value={details} 
          onChange={(e) => setDetails(e.target.value)} 
          placeholder="تفاصيل إضافية (اختياري)..." 
          rows={2}
          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:border-amber-400 resize-none mb-4" 
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">إلغاء</button>
          <button onClick={handleSubmit} disabled={loading || !reason} 
            className="flex-1 py-3 rounded-full text-white text-xs font-black disabled:opacity-50 active:scale-95 shadow-md shadow-amber-500/20" 
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
            {loading ? "جاري الإرسال..." : "إرسال البلاغ"}
          </button>
        </div>
      </div>
    </div>
  );
});

// ── Duration Picker ──
const DurationPicker = memo(function DurationPicker({ type, userName, onConfirm, onClose }: { type: "ban" | "kick"; userName: string; onConfirm: (d: string) => void; onClose: () => void }) {
  const [selected, setSelected] = useState(type === "ban" ? "1d" : "1h");
  const banDurs = [{ id: "1h", label: "ساعة" }, { id: "1d", label: "يوم" }, { id: "7d", label: "7 أيام" }, { id: "1m", label: "شهر" }, { id: "1y", label: "سنة" }, { id: "permanent", label: "دائم ♾️" }];
  const kickDurs = [{ id: "1min", label: "دقيقة" }, { id: "1h", label: "ساعة" }, { id: "1d", label: "يوم" }, { id: "7d", label: "7 أيام" }];
  const durs = type === "ban" ? banDurs : kickDurs;
  const color = type === "ban" ? "#ef4444" : "#f59e0b";
  const grad = type === "ban" ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#f59e0b,#d97706)";
  
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div className="relative w-full max-w-xs bg-white rounded-3xl p-6 text-center border border-slate-100 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-3xl mb-2">{type === "ban" ? "🚫" : "👢"}</div>
        <h3 className="text-slate-900 font-black text-lg">{type === "ban" ? "حظر" : "طرد"} {userName}</h3>
        <p className="text-slate-500 text-xs mt-1 mb-4">اختر مدة {type === "ban" ? "الحظر" : "الطرد"}</p>
        
        <div className="grid grid-cols-3 gap-2 mb-6">
          {durs.map((d) => (
            <button key={d.id} onClick={() => setSelected(d.id)}
              className={`py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95 border ${
                selected === d.id ? "bg-slate-50 border-slate-400 text-slate-900" : "bg-slate-50 border-slate-100 text-slate-400"
              }`}
              style={selected === d.id ? { borderColor: color, color: color, backgroundColor: `${color}08` } : {}}>
              {d.label}
            </button>
          ))}
        </div>
        
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">إلغاء</button>
          <button onClick={() => onConfirm(selected)} 
            className="flex-1 py-3 rounded-full text-white text-xs font-black active:scale-95 shadow-lg" 
            style={{ background: grad }}>تأكيد</button>
        </div>
      </div>
    </div>
  );
});

// ── Main Component ──
export default function UserProfileSheet({
  selectedUser, myProfile, isOwner, isAdmin, roomId,
  userActiveItems, userCpPartner, onClose, onSendGift,
  onViewProfile, onMessage, muteChatMember,
  kickMember, banMember, setAdminRole, onMention, onInviteToSeat,
}: UserProfileSheetProps) {
  const actualUserId = selectedUser.userId;
  const userProfile = selectedUser.profile;
  const isMe = actualUserId === myProfile?.userId;

  const [showReport, setShowReport] = useState(false);
  const [showBanPicker, setShowBanPicker] = useState(false);
  const [showKickPicker, setShowKickPicker] = useState(false);

  const banMemberWithDuration = useMutation(api.roomAccess.banMemberWithDuration);
  const kickMemberWithDuration = useMutation(api.roomAccess.kickMemberWithDuration);

  const isFollowingQuery = useQuery(api.social.isFollowing, actualUserId ? { targetUserId: actualUserId as Id<"users"> } : "skip");
  const followUser = useMutation(api.social.followUser);
  const [localFollowing, setLocalFollowing] = useState<boolean | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const isFollowing = localFollowing !== null ? localFollowing : (isFollowingQuery ?? false);

  const handleFollow = useCallback(async () => {
    if (!actualUserId || followLoading) return;
    setFollowLoading(true);
    try {
      const r = await followUser({ targetUserId: actualUserId as Id<"users"> });
      setLocalFollowing(r);
      toast.success(r ? "تمت المتابعة ✅" : "تم إلغاء المتابعة");
    } catch (e: any) { toast.error(e?.message || e); }
    finally { setFollowLoading(false); }
  }, [actualUserId, followLoading, followUser]);

  const handleBanConfirm = useCallback(async (duration: string) => {
    try {
      await banMemberWithDuration({ roomId, targetUserId: actualUserId as Id<"users">, duration });
      setShowBanPicker(false); onClose(); toast.success("تم الحظر ✅");
    } catch (e: any) { toast.error(e?.message || e); }
  }, [banMemberWithDuration, roomId, actualUserId, onClose]);

  const handleKickConfirm = useCallback(async (duration: string) => {
    try {
      await kickMemberWithDuration({ roomId, targetUserId: actualUserId as Id<"users">, duration });
      setShowKickPicker(false); onClose(); toast.success("تم الطرد ✅");
    } catch (e: any) { toast.error(e?.message || e); }
  }, [kickMemberWithDuration, roomId, actualUserId, onClose]);

  if (!actualUserId || !userProfile) return null;

  const wealthLevel = userProfile?.wealthLevel ?? 0;
  const charismaLevel = userProfile?.charismaLevel ?? 0;
  const country = ARAB_COUNTRIES.find((c) => c.code === userProfile?.country);
  const gender = userProfile?.gender;
  const canAdminAction = !isMe && (isOwner || isAdmin) && selectedUser.role !== "owner";
  const isVip = userProfile?.isVip ?? false;
  const vipLevel = userProfile?.vipLevel ?? 0;
  const aristocracyLevel = userProfile?.aristocracyLevel ?? 0;
  const aristocracyExpiresAt = userProfile?.aristocracyExpiresAt ?? null;
  const aristocracyActive = aristocracyLevel > 0 && (!aristocracyExpiresAt || aristocracyExpiresAt > Date.now());
  const aristocracyConfig = getAristocracyConfig(aristocracyActive ? aristocracyLevel : null);
  const followersCount = userProfile?.followersCount ?? 0;
  const hasCp = !!userCpPartner;
  const cpAvatarUrl = userCpPartner?.profile?.avatarUrl ?? userCpPartner?.avatarUrl ?? userCpPartner?.profile?.avatar ?? userCpPartner?.imageUrl ?? null;
  const isPrivateProfile = Boolean(userProfile.isPrivateProfile && !isMe);
  const privateAvatarUrl = "/assets/privacy/private-person-icon.svg";
  const rechargeTitle = useQuery(api.rechargeGifts.getUserRechargeTitle, actualUserId ? { userId: actualUserId as Id<"users"> } : "skip");

  if (isPrivateProfile) {
    return (
      <div className="fixed inset-0 z-[220] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm" dir="rtl" onClick={onClose}>
        <div className="w-full max-w-md rounded-t-[32px] border border-slate-700 bg-slate-950 px-6 pb-8 pt-7 text-center text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-600" />
          <img src={privateAvatarUrl} alt="شخصي" className="mx-auto h-24 w-24 rounded-full border-4 border-slate-600 object-cover shadow-[0_0_30px_rgba(71,85,105,.55)]" />
          <h2 className="mt-3 text-xl font-black">شخصي</h2>
          <p className="mt-2 text-sm font-bold text-slate-300">هذا مستخدم خاص</p>
          <p className="mt-1 text-xs text-slate-500">لا يمكنك الدخول إلى ملفه الشخصي</p>
          <button type="button" onClick={onClose} className="mt-5 w-full rounded-2xl bg-white/10 py-3 text-sm font-black text-white ring-1 ring-white/10">حسنًا</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .card-user-info-luxury {
          background-color: #b52b50;
          background-image: linear-gradient(180deg, rgba(27, 6, 45, 0.08) 0%, rgba(66, 9, 79, 0.05) 55%, rgba(16, 12, 61, 0.16) 100%), url('/card-assets/user-info-card-bg.jpg');
          background-size: 100% 100%, 100% 100%;
          background-position: center, center;
          background-repeat: no-repeat;
          border: 2px solid rgba(255,218,150,0.9);
          box-shadow: 0 14px 45px rgba(91, 8, 36, 0.5), inset 0 0 24px rgba(255, 210, 160, 0.18);
          color: #fff4e8;
        }
        .card-user-info-luxury .text-slate-900,
        .card-user-info-luxury .text-slate-800,
        .card-user-info-luxury .text-slate-700 { color: #fff4e8 !important; }
        .card-user-info-luxury .text-slate-500,
        .card-user-info-luxury .text-slate-400 { color: rgba(255,239,224,0.78) !important; }
        .card-user-info-luxury .border-amber-200,
        .card-user-info-luxury .border-amber-200\/50 { border-color: rgba(255,218,150,0.48) !important; }
        .card-user-info-luxury .bg-white\/40 { background: rgba(105, 13, 45, 0.28) !important; }
        .card-user-info-luxury .bg-white\/90 { background: rgba(255,244,232,0.92) !important; }
        .user-info-heading { margin-top: 0.15rem; transform: translateY(-6px); }
        .user-info-badges { margin-top: 0.15rem; transform: translateY(-6px); }
        .user-info-id { margin-top: 0.45rem; transform: translateY(-6px); }
        .vip-gold-badge { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #d97706 100%); }
        .aristocrat-badge { background: linear-gradient(135deg, #7e22ce 0%, #a855f7 100%); }
        .level-badge { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        .charisma-badge { background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); }
        .ring-glow { filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.8)); }
        
        @keyframes bottomSheetUp {
          from { transform: translateY(100%); opacity: 0.72; }
          to { transform: translateY(0); opacity: 1; }
        }
        .bottom-sheet-animate { animation: bottomSheetUp 0.34s cubic-bezier(0.22, 1, 0.36, 1); }
        .sheet-handle { box-shadow: 0 0 12px rgba(255,218,150,0.55); }
      `}</style>

      {/* Backdrop */}
            <div className="fixed inset-0 z-[100] flex items-end justify-center p-0" onClick={onClose}>
        <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" />
        {/* ── Bottom Sheet User Card ── */}
        <div 
          className="bottom-sheet-animate relative w-full max-w-md max-h-[91vh] overflow-visible card-user-info-luxury rounded-t-[34px] rounded-b-none pt-16 pb-5 px-4 text-center flex flex-col items-center"
          style={aristocracyActive ? { background: `linear-gradient(180deg, ${aristocracyConfig?.color ?? "#7c3aed"}48 0%, rgba(20,8,35,.98) 72%), url('/card-assets/user-info-card-bg.jpg') center/cover`, borderColor: `${aristocracyConfig?.color ?? "#c084fc"}cc`, boxShadow: `0 16px 52px ${aristocracyConfig?.glowColor ?? "rgba(168,85,247,.45)"}, inset 0 0 32px ${aristocracyConfig?.color ?? "#a855f7"}22` } : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-amber-100/80 sheet-handle" />
          {/* Report Button */}
          {!isMe && (
            <button 
              onClick={() => setShowReport(true)}
              className="absolute top-4 left-4 text-amber-800/60 hover:text-amber-900 transition active:scale-90"
            >
              <TriangleAlert size={18} />
            </button>
          )}

          {/* CP Avatars Section */}
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-[60]">
            {/* Main User Avatar + active frame */}
            <div className="relative z-10">
              <UserAvatar userId={actualUserId as Id<"users">} avatarUrl={userProfile.avatarUrl} name={userProfile.name} size={80} showFrame={true} isVip={isVip} vipLevel={vipLevel} />
              <span className="absolute bottom-1 right-1 z-[45] w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>

            {hasCp && (
              <>
                {/* Real CP ring between the two framed avatars */}
                <div className="relative -mx-3 z-[80] flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-200 bg-gradient-to-br from-amber-100 via-yellow-400 to-amber-700 shadow-[0_0_20px_rgba(251,191,36,.85)] animate-pulse">
                  <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-label="خاتم CP"><circle cx="16" cy="17" r="8" stroke="#fff7cc" strokeWidth="2.2"/><path d="M10 12c2.2-4.2 9.8-4.2 12 0" stroke="#b45309" strokeWidth="2" strokeLinecap="round"/><path d="M16 3l3.2 4.2L16 11l-3.2-3.8L16 3z" fill="#ef4444" stroke="#fff7cc" strokeWidth="1.2"/><circle cx="16" cy="17" r="3" fill="#fde68a" opacity=".9"/></svg>
                </div>

                {/* CP Partner Avatar + active frame */}
                <div className="relative z-10 group" onClick={() => userCpPartner?.userId && onViewProfile?.(userCpPartner.userId)}>
                  <UserAvatar userId={userCpPartner?.userId as Id<"users">} avatarUrl={cpAvatarUrl || userProfile.avatarUrl} name={userCpPartner?.profile?.name || userCpPartner?.name || "CP"} size={80} showFrame={true} isVip={Boolean(userCpPartner?.profile?.isVip)} vipLevel={userCpPartner?.profile?.vipLevel} />
                  <span className="absolute -bottom-1 left-1/2 z-[45] -translate-x-1/2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-white shadow-sm">CP</span>
                </div>
              </>
            )}
          </div>

          {/* ألقاب المستخدم تُعرض مرة واحدة فقط في صف الألقاب أسفل الهوية */}

          {/* User Name + Gender */}
          <div className="user-info-heading flex items-center justify-center gap-2">
            <h2 className="text-xl font-black text-amber-50 tracking-tight drop-shadow-[0_2px_4px_rgba(85,5,30,0.55)]">
              {aristocracyActive ? <AristocracyName level={aristocracyLevel} name={userProfile.name} className="text-xl tracking-tight drop-shadow-[0_2px_4px_rgba(85,5,30,0.55)]" /> : Boolean(userProfile.isPro && (userProfile.proExpiresAt ?? 0) > Date.now()) ? (
                <span style={{
                  background: "linear-gradient(90deg, #ef4444, #fbbf24, #9ca3af, #fbbf24, #ef4444)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: "vip-name-flow 2s linear infinite",
                  filter: "drop-shadow(0 0 6px rgba(239,68,68,0.5))",
                }}>
                  {userProfile.name}
                </span>
              ) : userProfile.name}
            </h2>
            {gender && (
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm text-white ${gender === "male" ? "bg-blue-500" : "bg-pink-500"}`}>
                {gender === "male" ? "♂" : "♀"}
              </span>
            )}
          </div>

          {/* Identity row: ID, country, gender and followers */}
          <button type="button" onClick={async () => { const id = userProfile.sakiId ? String(userProfile.sakiId) : ""; if (!id) return; try { await navigator.clipboard?.writeText(id); toast.success("تم نسخ ID"); } catch { toast.error("تعذر نسخ ID"); } }} className="user-info-id flex items-center justify-center gap-2 text-amber-50 text-xs font-bold bg-white/40 py-1.5 px-4 rounded-full border border-amber-200/50 shadow-inner active:scale-95 transition-transform" title="اضغط لنسخ ID">
            <span className="text-amber-900 font-black" dir="ltr">ID {userProfile.sakiId ?? "—"}</span>
            {country && <span className="text-base" title={country.name}>{country.flag}</span>}
            {gender && <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-white ${gender === "male" ? "bg-blue-500" : "bg-pink-500"}`}>{gender === "male" ? "♂" : "♀"}</span>}
            <span className="text-amber-300">|</span><span>{followersCount} متابع</span>
          </button>

          {/* Badges Section */}
          <div className="user-info-badges flex items-center justify-center gap-1.5 flex-wrap max-w-[300px] mt-2">
            {/* VIP Badge */}
            {isVip && (
              <div className="vip-gold-badge text-white font-black text-[10px] px-2.5 py-0.5 rounded-lg shadow-sm flex items-center gap-1">
                <ShieldCheck size={10} />
                <span>PRO {vipLevel}</span>
              </div>
            )}

            {/* اللقب الأرستقراطي الأصلي بجانب PRO — بدون الشارة البنفسجية القديمة */}
            {aristocracyActive && aristocracyConfig && (
              <div className="text-white font-black text-[10px] px-2.5 py-0.5 rounded-lg shadow-[0_0_12px_rgba(251,191,36,.55)] flex items-center gap-1 border border-amber-200/60" style={{ background: aristocracyConfig.gradient }}>
                <img src={aristocracyConfig.iconUrl} alt="" className="h-4 w-4 object-contain" />
                <span>{aristocracyConfig.nameAr || aristocracyConfig.label}</span>
              </div>
            )}

            {/* لقب داعم كبير من هدية الشحن */}
            {rechargeTitle && (
              <div className="text-white font-black text-[10px] px-2.5 py-0.5 rounded-lg shadow-[0_0_14px_rgba(244,63,94,.62)] flex items-center gap-1 border border-rose-200/70 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400">
                <span className="animate-pulse text-pink-100">♥</span>
                {rechargeTitle.iconUrl ? <img src={rechargeTitle.iconUrl} alt="" className="h-4 w-4 object-contain" /> : <Star size={11} className="text-yellow-100 fill-yellow-100" />}
                <span>{rechargeTitle.title}</span>
                <span className="animate-pulse text-pink-100">♥</span>
              </div>
            )}

            {/* Level icons — same illustrated assets used in the user profile */}
            {wealthLevel > 0 && (
              <div className="flex h-10 w-10 items-center justify-center" title={`مستوى الثروة LV${wealthLevel}`}>
                <LevelIconSvg level={wealthLevel} type="wealth" size={38} />
              </div>
            )}
            {charismaLevel > 0 && (
              <div className="flex h-10 w-10 items-center justify-center" title={`مستوى الكاريزما LV${charismaLevel}`}>
                <LevelIconSvg level={charismaLevel} type="charisma" size={38} />
              </div>
            )}

          </div>

          {/* Primary profile actions: file, mention, chat */}
          <div className="grid grid-cols-3 gap-3 w-full my-5 px-2">
            <button onClick={() => { onClose(); onViewProfile?.(actualUserId as Id<"users">); }} className="flex flex-col items-center gap-1.5 group active:scale-90 transition">
              <div className="w-10 h-10 bg-white/90 group-hover:bg-white text-purple-600 rounded-2xl flex items-center justify-center shadow-sm border border-amber-200"><User size={18} /></div>
              <span className="text-[10px] font-black text-slate-800">الملف</span>
            </button>
            <button onClick={() => { onMention?.(`@${userProfile.name} `); onClose(); }} className="flex flex-col items-center gap-1.5 group active:scale-90 transition">
              <div className="w-10 h-10 bg-white/90 group-hover:bg-white text-sky-600 rounded-2xl flex items-center justify-center text-lg font-black shadow-sm border border-amber-200">@</div>
              <span className="text-[10px] font-black text-slate-800">الإشارة</span>
            </button>
            <button onClick={() => { onClose(); onMessage?.(actualUserId as Id<"users">); }} className="flex flex-col items-center gap-1.5 group active:scale-90 transition">
              <div className="w-10 h-10 bg-white/90 group-hover:bg-white text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm border border-amber-200"><MessageCircle size={18} /></div>
              <span className="text-[10px] font-black text-slate-800">الدردشة</span>
            </button>
          </div>

          {/* Social actions: follow, friend request, gift box */}
          <div className="grid grid-cols-3 gap-2 w-full mb-4">
            {!isMe ? <button onClick={handleFollow} disabled={followLoading} className={`py-3 rounded-2xl flex flex-col items-center justify-center gap-1 font-black text-[10px] active:scale-95 transition ${isFollowing ? "border border-slate-200 bg-slate-50 text-slate-400" : "border border-emerald-500/40 bg-white text-emerald-600"}`}>
              {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}<span>{isFollowing ? "متابَع" : "متابعة"}</span>
            </button> : <div />}
            {!isMe ? <div className="rounded-2xl overflow-hidden"><FriendButton targetUserId={actualUserId as Id<"users">} compactGrid /></div> : <div />}
            <button onClick={() => { onClose(); onSendGift(selectedUser); }} className="py-3 rounded-2xl flex flex-col items-center justify-center gap-1 bg-emerald-500 text-white font-black text-[10px] shadow-lg shadow-emerald-500/20 active:scale-95 transition"><Gift size={16} /><span>صندوق هدايا</span></button>
          </div>

          {/* Room role */}
          {(selectedUser.role === "owner" || selectedUser.role === "admin") && (
            <div className="mb-3 flex items-center gap-2 rounded-full border border-amber-200/50 bg-white/30 px-4 py-2 text-[10px] font-black text-amber-50 shadow-inner">
              <ShieldCheck size={14} className="text-amber-200" />
              <span>{selectedUser.role === "owner" ? "مالك الغرفة" : "مشرف في الغرفة"}</span>
            </div>
          )}

          {/* Admin Toolbar */}
          {canAdminAction && (
            <div className="w-full pt-4 border-t border-amber-200/50 flex items-center justify-between gap-1 px-1">
              {/* Set Admin */}
              {isOwner && (
                <button 
                  title={selectedUser.role === "admin" ? "إزالة المشرف" : "تعيين مشرف"}
                  onClick={async () => {
                    try {
                      await setAdminRole({ roomId, targetUserId: actualUserId as Id<"users">, isAdmin: selectedUser.role !== "admin" });
                      onClose();
                      toast.success(selectedUser.role !== "admin" ? "تم تعيين مشرف ✅" : "تم إزالة المشرف");
                    } catch (e: any) { toast.error(e?.message || e); }
                  }}
                  className="w-9 h-9 rounded-xl bg-white/90 hover:bg-white text-indigo-600 shadow-sm border border-amber-200 flex items-center justify-center transition active:scale-90"
                >
                  <ShieldCheck size={18} />
                </button>
              )}

              {/* Mute Chat */}
              <button 
                title={selectedUser.isChatMuted ? "إلغاء كتم الدردشة" : "كتم الدردشة"}
                onClick={async () => {
                  try { await muteChatMember({ roomId, targetUserId: actualUserId as Id<"users">, isMuted: !selectedUser.isChatMuted }); onClose(); }
                  catch (e: any) { toast.error(e?.message || e); }
                }}
                className={`w-9 h-9 rounded-xl shadow-sm border flex items-center justify-center transition active:scale-90 ${
                  selectedUser.isChatMuted ? "bg-orange-500 text-white border-orange-600" : "bg-white/90 text-orange-600 border-amber-200"
                }`}
              >
                <MessageSquareOff size={18} />
              </button>

              {/* Invite to Seat */}
              {onInviteToSeat && (
                <button 
                  title="دعوة للمقعد"
                  onClick={() => { onClose(); onInviteToSeat(selectedUser); }}
                  className="w-9 h-9 rounded-xl bg-white/90 hover:bg-white text-emerald-600 shadow-sm border border-amber-200 flex items-center justify-center transition active:scale-90"
                >
                  <PhoneCall size={18} className="rotate-90" />
                </button>
              )}

              {/* Kick */}
              <button 
                title="طرد"
                onClick={() => setShowKickPicker(true)}
                className="w-9 h-9 rounded-xl bg-white/90 hover:bg-white text-rose-600 shadow-sm border border-amber-200 flex items-center justify-center transition active:scale-90"
              >
                <LogOut size={18} />
              </button>

              {/* Ban */}
              {isOwner && (
                <button 
                  title="حظر"
                  onClick={() => setShowBanPicker(true)}
                  className="w-9 h-9 rounded-xl bg-white/90 hover:bg-white text-red-700 shadow-sm border border-amber-200 flex items-center justify-center transition active:scale-90"
                >
                  <Ban size={18} />
                </button>
              )}
            </div>
          )}

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="mt-4 text-[10px] text-slate-400 hover:text-slate-600 font-bold tracking-widest uppercase"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>

      {showReport && <ReportSheet userId={actualUserId as Id<"users">} onClose={() => setShowReport(false)} />}
      {showBanPicker && <DurationPicker type="ban" userName={userProfile?.name ?? ""} onConfirm={handleBanConfirm} onClose={() => setShowBanPicker(false)} />}
      {showKickPicker && <DurationPicker type="kick" userName={userProfile?.name ?? ""} onConfirm={handleKickConfirm} onClose={() => setShowKickPicker(false)} />}
    </>
  );
}
