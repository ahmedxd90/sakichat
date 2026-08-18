import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "../lib/toast";
import { ARAB_COUNTRIES } from "../data/countries";
import { VipBadge, VipName, getVipConfig, SuperAdminBadge, ProTitle } from "../components/VipBadge";
import { AristocracyBadge, AristocracyName, getAristocracyConfig } from "../components/AristocracyBadge";
import UserAvatar from "../components/UserAvatar";
import { buildBadges } from "../components/BadgeSystem";
import CurrentRoomCard from "../components/CurrentRoomCard";
import { formatNumber } from "../lib/formatNumber";
import { getLevelColor } from "../lib/levelSystem";
import { LevelIconSvg } from "../components/LevelBadgeInline";
import ProfileMomentsTab from "./ProfileMomentsTab";
import { CustomerServiceBadge } from "../components/CustomerServiceBadge";
import { TitleBadges } from "../components/TitleBadges";
import { ContentCreatorBadgeIf } from "../components/ContentCreatorBadge";
import { AgentChargeBadgeIf } from "../components/AgentChargeBadge";
import GiftsReceivedTab from "./GiftsReceivedTab";
import SupportersSection from "./SupportersSection";
import SakiIdDisplay from "../components/SakiIdDisplay";
import BadgesTabContent from "./BadgesTabContent";
import { HostAgencyBadgeInline, HostAgencyBadgeSection } from "../components/HostAgencyBadge";
import SVGADisplay from "../components/SVGADisplay";

interface UserProfilePageProps {
  userId: Id<"users">;
  onBack: () => void;
  onMessage: (userId: Id<"users">) => void;
  onRoomSelect?: (roomId: Id<"rooms">) => void;
  hideBottomBar?: boolean;
}

type ProfileTab = "moments" | "badges" | "profile" | "gifts";

const REPORT_REASONS = [
  "محتوى مسيء أو مزعج",
  "انتحال شخصية",
  "سلوك مضايق",
  "محتوى غير لائق",
  "احتيال أو نصب",
  "أخرى",
];

const PROFILE_ASSETS = {
  houseOfLove: "/assets/profile/house-of-love-icon.png",
  cpRings: "/assets/profile/cp-diamond-rings.png",
  headerOrnament: "/assets/profile/header-ornament-gold.png",
};

function HeartIcon({ size = 20, color = "#ec4899" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>
  );
}

function LockIcon({ color = "#d97706" }: { color?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
      <rect x="3" y="10" width="18" height="11" rx="2" />
      <path d="M7 10V7a5 5 0 0 1 10 0v3" />
    </svg>
  );
}

function SectionTitle({ icon, title, color = "#b45309" }: { icon: ReactNode; title: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${color}12`, color }}>{icon}</span>
      <h3 className="text-sm font-black text-slate-800">{title}</h3>
    </div>
  );
}

function LevelPill({ label, value, level, type }: { label: string; value: number; level: number; type: "wealth" | "charisma" }) {
  const config = getLevelColor(level);
  const icon = <LevelIconSvg level={level} type={type} size={32} />;
  return (
    <div className="min-w-0 rounded-2xl px-3 py-2.5" title={`${label}: LV${Math.max(0, level)}`} style={{ background: `linear-gradient(135deg,${config.primary}10,${config.secondary}08)`, border: `1px solid ${config.primary}24` }}>
      <div className="flex items-center gap-2">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${config.primary}16` }}>{icon}</span>
        <div className="min-w-0">
          <p className="text-[10px] text-slate-500 font-bold truncate">LV{Math.max(0, level)}</p>
          <p className="text-xs text-slate-800 font-black truncate">{formatNumber(value)}</p>
        </div>
      </div>
    </div>
  );
}

function StatItem({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

export default function UserProfilePage({ userId, onBack, onMessage, onRoomSelect, hideBottomBar = false }: UserProfilePageProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("moments");
  const [localFollowing, setLocalFollowing] = useState<boolean | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [bgUploading, setBgUploading] = useState(false);
  const bgFileRef = useRef<HTMLInputElement>(null);

  const profile = useQuery(api.profiles.getProfileByUserId, { userId });
  const myProfile = useQuery(api.profiles.getMyProfile);
  const isMe = myProfile?.userId === userId;
  const isFollowingQuery = useQuery(api.social.isFollowing, { targetUserId: userId });
  const followUser = useMutation(api.social.followUser);
  const recordVisit = useMutation(api.socialLists.recordProfileVisit);
  const reportUser = useMutation(api.userReports.reportUser);
  const blockUser = useMutation(api.chatBlocks.blockUser);
  const unblockUser = useMutation(api.chatBlocks.unblockUser);
  const generateBgUploadUrl = useMutation(api.profiles.generateProfileBgUploadUrl);
  const updateProfileBackground = useMutation(api.profiles.updateProfileBg);
  
  // Friend Logic
  const friendshipStatus = useQuery(api.friends.getFriendshipStatus, { targetUserId: userId });
  const sendFriendRequest = useMutation(api.friends.sendFriendRequest);
  const cancelFriendRequest = useMutation(api.friends.cancelFriendRequest);
  const removeFriend = useMutation(api.friends.removeFriend);
  const [friendLoading, setFriendLoading] = useState(false);

  const userMoments = useQuery(api.social.getUserMoments, { userId });
  const userReels = useQuery(api.social.getUserReels, { userId });
  const currentRoom = useQuery(api.rooms.getUserCurrentRoom, { userId });
  const cpPartner = useQuery(api.store.getActiveCpPartner, { userId });
  const familyInfo = useQuery(api.families.getFamilyByUserId, { userId });
  const topSupporters = useQuery(api.giftInventory.getTopSupporters, { userId });
  const receivedGifts = useQuery(api.giftInventory.getReceivedGiftsByUserId, { userId });
  const blockStatus = useQuery(api.chatBlocks.getBlockStatus, showMoreSheet && !isMe ? { otherUserId: userId } : "skip");
  const areFriendsQuery = useQuery(api.friends.areFriends, !isMe ? { otherUserId: userId } : "skip");
  const userVipInfo = useQuery(api.vip.getVipConfigForUser, { userId });
  const superAdminAssets = useQuery(api.superAdmin.getSuperAdminAssets, profile?.isSuperAdmin ? {} : "skip");
  const parentAgentInfo = useQuery(api.subAgents.getParentAgentForUser, profile?.isAgent ? { targetUserId: userId } : "skip");
  const rechargeTitle = useQuery(api.rechargeGifts.getUserRechargeTitle, profile && !profile.isPrivateProfile ? { userId } : "skip");

  useEffect(() => {
    if (!isMe && userId) recordVisit({ profileOwnerId: userId }).catch(() => {});
  }, [recordVisit, userId, isMe]);

  const isFollowing = localFollowing !== null ? localFollowing : (isFollowingQuery ?? false);

  const handleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      const result = await followUser({ targetUserId: userId });
      setLocalFollowing(result);
      toast.success(result ? "تمت المتابعة" : "تم إلغاء المتابعة");
    } catch (error: any) {
      toast.error(error?.message ?? "تعذر تحديث المتابعة");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleReport = async () => {
    if (!selectedReason) { toast.error("اختر سبب الإبلاغ"); return; }
    setReportLoading(true);
    try {
      // Fixed: Schema uses reportedId, not reportedUserId
      await reportUser({ reportedId: userId, reason: selectedReason, details: reportDetails || undefined });
      toast.success("تم إرسال البلاغ بنجاح");
      setShowReportSheet(false);
      setSelectedReason("");
      setReportDetails("");
    } catch (error: any) {
      toast.error(error?.message ?? "تعذر إرسال البلاغ");
    } finally {
      setReportLoading(false);
    }
  };

  const handleFriendAction = async () => {
    if (friendLoading || !friendshipStatus) return;
    setFriendLoading(true);
    try {
      if (friendshipStatus.status === "none") {
        await sendFriendRequest({ targetUserId: userId });
        toast.success("تم إرسال طلب الصداقة");
      } else if (friendshipStatus.status === "sent") {
        await cancelFriendRequest({ targetUserId: userId });
        toast.success("تم إلغاء طلب الصداقة");
      } else if (friendshipStatus.status === "friends") {
        if (confirm("هل تريد إزالة هذا الصديق؟")) {
          await removeFriend({ friendUserId: userId });
          toast.success("تمت إزالة الصديق");
        }
      } else if (friendshipStatus.status === "received") {
        toast.info("هذا المستخدم أرسل لك طلباً، يمكنك قبوله من صفحة الرسائل");
      }
    } catch (error: any) {
      toast.error(error?.message ?? "فشلت العملية");
    } finally {
      setFriendLoading(false);
    }
  };

  const handleBlock = async () => {
    if (blockLoading) return;
    setBlockLoading(true);
    try {
      if (blockStatus?.iBlockedThem) {
        await unblockUser({ blockedId: userId });
        toast.success("تم رفع الحظر");
      } else {
        await blockUser({ blockedId: userId });
        toast.success("تم حظر المستخدم");
      }
      setShowMoreSheet(false);
    } catch (error: any) {
      toast.error(error?.message ?? "تعذر تحديث الحظر");
    } finally {
      setBlockLoading(false);
    }
  };

  const handleBgUpload = async (file: File | null) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("حجم الصورة يجب أن يكون أقل من 10 ميجابايت"); return; }
    setBgUploading(true);
    try {
      const uploadUrl = await generateBgUploadUrl();
      const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      if (!result.ok) throw new Error("تعذر رفع الصورة");
      const { storageId } = await result.json();
      await updateProfileBackground({ profileBgStorageId: storageId });
      toast.success("تم تحديث غلاف الملف الشخصي");
    } catch (error: any) {
      toast.error(error?.message ?? "فشل تحديث الغلاف");
    } finally {
      setBgUploading(false);
      if (bgFileRef.current) bgFileRef.current.value = "";
    }
  };

  const badges = useMemo(() => {
    if (!profile) return [];
    const isPro = Boolean((profile as any).isPro && ((profile as any).proExpiresAt ?? 0) > Date.now());
    const proLevel = (profile as any).proLevel ?? 1;
    return buildBadges({
      isPro,
      proLevel,
      isSuperAdmin: Boolean(profile.isSuperAdmin),
      isAgent: Boolean(profile.isAgent),
      isActive: profile.isActive,
      wealthLevel: profile.wealthLevel ?? 0,
      charismaLevel: profile.charismaLevel ?? 0,
      familyInfo: familyInfo ? { name: familyInfo.name, role: familyInfo.role ?? "member" } : null,
      aristocracyLevel: ((profile as any).aristocracyLevel ?? 0) > 0 ? (profile as any).aristocracyLevel : 0,
      aristocracyExpiresAt: (profile as any).aristocracyExpiresAt ?? null,
      isSakiAmbassador: Boolean((profile as any).isSakiAmbassador),
      isMomentsKing: Boolean((profile as any).isMomentsKing),
      isMomentWriter: Boolean((profile as any).isMomentWriter),
      isMillionaireTitle: Boolean((profile as any).isMillionaireTitle),
      isReelsKing: Boolean((profile as any).isReelsKing),
    });
  }, [profile, familyInfo]);

  if (!profile) {
    return (
      <div className="h-full min-h-screen flex items-center justify-center bg-white" dir="rtl">
        <div className="flex flex-col items-center gap-3"><div className="w-9 h-9 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /><p className="text-xs text-slate-400">جاري تحميل الملف الشخصي...</p></div>
      </div>
    );
  }

  const isPrivate = Boolean((profile as any).isPrivateProfile);
  const isSuperAdminViewer = Boolean(myProfile?.isSuperAdmin);
  const isFriend = areFriendsQuery ?? false;
  const canViewFull = isMe || isSuperAdminViewer || isFriend || !isPrivate;
  if (!canViewFull) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-slate-950 px-6 text-center text-white" dir="rtl">
        <div className="w-full max-w-sm rounded-[32px] border border-slate-700 bg-slate-900/95 p-7 shadow-2xl">
          <img src="/assets/privacy/private-person-icon.svg" alt="شخصي" className="mx-auto h-28 w-28 rounded-full border-4 border-slate-600 object-cover shadow-[0_0_34px_rgba(71,85,105,.55)]" />
          <h1 className="mt-4 text-2xl font-black">شخصي</h1>
          <p className="mt-2 font-bold text-slate-300">هذا مستخدم خاص</p>
          <p className="mt-1 text-sm text-slate-500">لا يمكنك الدخول إلى ملفه الشخصي</p>
          <button type="button" onClick={onBack} className="mt-6 w-full rounded-2xl bg-white/10 py-3 font-black ring-1 ring-white/10">العودة</button>
        </div>
      </div>
    );
  }
  const isPro = Boolean(profile.isPro && (profile.proExpiresAt ?? 0) > Date.now());
  const proLevel = profile.proLevel ?? 1;
  const proConfig = getVipConfig(isPro ? proLevel : null);
  const isAgent = Boolean(profile.isAgent);
  const isSuperAdmin = Boolean(profile.isSuperAdmin);
  const country = ARAB_COUNTRIES.find((item) => item.code === profile.country);
  const wealthLevel = profile.wealthLevel ?? 0;
  const charismaLevel = profile.charismaLevel ?? 0;
  const aristocracyLevel = (profile as any).aristocracyLevel ?? 0;
  const aristocracyActive = aristocracyLevel > 0 && Boolean((profile as any).aristocracyExpiresAt && (profile as any).aristocracyExpiresAt > Date.now());
  const aristocracyConfig = getAristocracyConfig(aristocracyActive ? aristocracyLevel : null);
  const hasCp = Boolean(cpPartner && (!cpPartner.expiresAt || cpPartner.expiresAt > Date.now()));
  const accentColor = aristocracyConfig?.color ?? proConfig?.nameColor ?? "#d97706";
  const profileBgUrl = (profile as any).profileBgUrl ?? (profile as any).coverUrl;
  const superAdminTitle = superAdminAssets?.title ?? "سوبر أدمن";

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto flex flex-col relative" dir="rtl" style={{ fontFamily: "Cairo, Tajawal, sans-serif", paddingBottom: !isMe && !hideBottomBar ? 90 : 24 }}>
      
      {/* رأس الصفحة / الغلاف */}
      <div className="relative h-48 flex flex-col justify-between p-4 overflow-hidden flex-shrink-0" style={{ background: "linear-gradient(135deg, #e2e8f0 0%, #3b82f6 50%, #d97706 100%)" }}>
        {profileBgUrl && <img src={profileBgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager" />}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {/* أشرطة العلوي */}
        <div className="flex justify-between items-center z-10">
          {!isMe ? (
            <button onClick={() => setShowMoreSheet(true)} className="w-9 h-9 rounded-full bg-white/50 backdrop-blur flex items-center justify-center text-slate-800 hover:bg-white/80 transition shadow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
            </button>
          ) : (
            <div className="w-9 h-9" />
          )}
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-white/50 backdrop-blur flex items-center justify-center text-slate-800 hover:bg-white/80 transition shadow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>

        {isMe && (
          <div className="absolute bottom-4 left-4 z-10">
            <input ref={bgFileRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleBgUpload(event.target.files?.[0] ?? null)} />
            <button onClick={() => bgFileRef.current?.click()} disabled={bgUploading} className="px-3 py-1.5 rounded-xl text-[10px] font-black text-white bg-black/35 backdrop-blur-md border border-white/20 active:scale-95">
              {bgUploading ? "جارٍ..." : "تغيير الغلاف"}
            </button>
          </div>
        )}
      </div>

      {/* صورة الملف الشخصي وصورة المستخدم الآخر مع خاتم CP */}
      <div className="relative flex justify-center items-center -mt-14 z-20 flex-shrink-0 gap-3">

        
        <div className="relative z-10">
          <UserAvatar userId={userId} avatarUrl={profile.avatarUrl} name={profile.name} size={96} showFrame={true} isSuperAdmin={isSuperAdmin} isPro={isPro} proLevel={proLevel} className="gold-border" />
        </div>
        {hasCp && cpPartner && (
          <>
            <div className="relative z-30 flex h-12 w-12 items-center justify-center rounded-full border-2 border-pink-200 bg-white shadow-lg animate-pulse">
              <img src="/assets/cp-love-ring.svg" alt="خاتم الحب" className="h-11 w-11 object-contain" />
            </div>
            <div className="relative z-10 rounded-full border-2 border-pink-400 bg-white shadow-md">
              <UserAvatar
                userId={cpPartner.partnerUserId}
                avatarUrl={cpPartner.partnerAvatarUrl}
                name={cpPartner.partnerName}
                size={88}
                showFrame={false}
              />
            </div>
          </>
        )}
      </div>

      {/* محتوى الملف الشخصي الأساسي */}
      <div className="flex-1 flex flex-col">
        <div className="pt-3 px-4 pb-4 flex flex-col items-center bg-white border-b border-slate-100">
          {/* الاسم */}
          <div className="flex items-center gap-2 mb-1">
            {aristocracyActive ? (
              <AristocracyName level={aristocracyLevel} name={profile.name} className="text-xl font-bold tracking-wide" isPro={isPro} />
            ) : isPro ? (
              <VipName name={profile.name} level={proLevel} className="text-xl font-bold tracking-wide" isPro={true} />
            ) : (
              <h1 className="text-xl font-bold tracking-wide text-slate-900">{profile.name}</h1>
            )}
          </div>
          {profile.isDivorced && (
            <div className="mb-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-black text-rose-600 shadow-sm">💔 مطلق</div>
          )}

          {/* الأرستقراطية بجانبه PRO */}
          <div className="flex items-center gap-2 my-2 flex-wrap justify-center">
            {aristocracyActive && aristocracyConfig && (
              <AristocracyBadge level={aristocracyLevel} size="sm" dbName={aristocracyConfig.nameAr} />
            )}
            {isPro && <ProTitle level={proLevel} size="sm" />}
            {isSuperAdmin && (
              <SuperAdminBadge size="sm" title={superAdminTitle} badgeUrl={superAdminAssets?.badgeUrl} />
            )}
          </div>

          {rechargeTitle && (
            <div className="relative my-2 inline-flex items-center gap-2 overflow-hidden rounded-full border border-rose-200 bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 px-3 py-1.5 text-xs font-black text-rose-700 shadow-[0_0_18px_rgba(244,63,94,.25)]">
              <span className="text-rose-400 animate-pulse">♥</span>
              {rechargeTitle.iconUrl ? <img src={rechargeTitle.iconUrl} alt="" className="h-6 w-6 object-contain" /> : <span className="text-lg">✦</span>}
              <span>{rechargeTitle.title}</span>
              <span className="text-pink-500 animate-pulse">♥</span>
            </div>
          )}

          {/* الدولة والأيدي */}
          <div className="flex items-center gap-3 text-xs text-slate-700 my-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            {country && <span className="flex items-center gap-1">{country.flag} {country.name}</span>}
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1">🆔 {profile.sakiId}</span>
          </div>

          {/* الأوسمة والمستويات */}
          <div className="flex items-center gap-2 my-3 overflow-x-auto max-w-full py-1 no-scrollbar">
            {badges.slice(0, 3).map((badge, idx) => (
              <div key={idx} className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm overflow-hidden">
                <img src={badge.iconUrl} alt={badge.name} className="w-full h-full object-contain" />
              </div>
            ))}
            {wealthLevel > 0 && <span title={`مستوى الثروة LV${wealthLevel}`} className="w-10 h-10 flex items-center justify-center"><LevelIconSvg level={wealthLevel} type="wealth" size={38} /></span>}
            {charismaLevel > 0 && <span title={`مستوى الكاريزما LV${charismaLevel}`} className="w-10 h-10 flex items-center justify-center"><LevelIconSvg level={charismaLevel} type="charisma" size={38} /></span>}
          </div>

          {/* الإحصائيات */}
          <div className="grid grid-cols-3 gap-6 w-full max-w-xs my-4 text-center">
            <StatItem value={formatNumber(profile.followersCount ?? 0)} label="متابعين" />
            <StatItem value={formatNumber(profile.followingCount ?? 0)} label="متابعة" />
            <StatItem value={formatNumber((profile as any).visitCount ?? 0)} label="زائر" />
          </div>

          {/* أزرار التفاعل */}
          {!isMe && (
            <div className="flex items-center gap-3 w-full my-2">
              <button 
                onClick={() => { if (friendshipStatus?.status !== "friends") toast.error("يجب أن تكونا أصدقاء لإرسال رسالة خاصة"); else onMessage(userId); }}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-2.5 rounded-2xl shadow hover:brightness-105 transition flex items-center justify-center gap-2"
              >
                الرسائل
              </button>
              
              {/* Friend Request Button (Previously Follow) */}
              <button 
                onClick={handleFriendAction}
                disabled={friendLoading}
                className={`w-11 h-11 border rounded-2xl flex items-center justify-center transition active:scale-90 ${
                  friendshipStatus?.status === "friends" ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-slate-100 border-slate-200 text-slate-700"
                }`}
                title={friendshipStatus?.status === "friends" ? "صديق" : "إضافة صديق"}
              >
                {friendshipStatus?.status === "friends" ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" /></svg>
                ) : friendshipStatus?.status === "sent" ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><circle cx="18" cy="11" r="3" /></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" /></svg>
                )}
              </button>

              {/* Follow Button (Previously Heart/Like) */}
              <button 
                onClick={handleFollow}
                disabled={followLoading}
                className={`w-11 h-11 border rounded-2xl flex items-center justify-center transition active:scale-90 ${
                  isFollowing ? "bg-red-50 border-red-200 text-red-500" : "bg-slate-100 border-slate-200 text-slate-400"
                }`}
                title={isFollowing ? "إلغاء المتابعة" : "متابعة"}
              >
                <HeartIcon size={20} color={isFollowing ? "#ef4444" : "#94a3b8"} />
              </button>
            </div>
          )}

          {/* الشريط الأخضر للغرفة */}
          {currentRoom && (
            <div 
              onClick={() => onRoomSelect?.(currentRoom.roomId)}
              className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl p-3 flex items-center justify-between shadow-md transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-emerald-800 flex-shrink-0 border border-emerald-400">
                  {currentRoom.coverUrl ? (
                    <img src={currentRoom.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">🎙️</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold">{currentRoom.roomName} 👑</div>
                  <div className="text-[10px] text-emerald-200 flex items-center gap-1 mt-0.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    {currentRoom.memberCount} متواجد
                  </div>
                </div>
              </div>
              <div className="bg-emerald-500 px-3 py-1 rounded-xl text-xs font-bold border border-emerald-400 shadow-inner">
                انضمام
              </div>
            </div>
          )}
        </div>

        {/* شريط التبويبات المخصص */}
        <div className="flex justify-around border-b border-slate-200 bg-white text-sm font-semibold text-slate-500 sticky top-0 z-30 shadow-sm">
          {[
            { id: "moments" as const, label: "اللحظات" },
            { id: "badges" as const, label: "الأوسمة" },
            { id: "profile" as const, label: "الملف الشخصي" },
            { id: "gifts" as const, label: "الهدايا" },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)} 
              className={`py-3 px-2 border-b-2 transition ${activeTab === tab.id ? "border-amber-500 text-amber-600" : "border-transparent hover:text-slate-900"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* المحتوى التفاعلي للتبويبات */}
        <div className="p-4 bg-slate-50 flex-1">
          {activeTab === "moments" && (
            <ProfileMomentsTab userId={userId} canViewFull={canViewFull} myProfile={myProfile} accentColor={accentColor} />
          )}
          
          {activeTab === "badges" && (
            !canViewFull ? (
              <div className="rounded-2xl p-7 text-center bg-amber-50 border border-amber-100">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-amber-100"><LockIcon /></div>
                <p className="text-sm font-black text-slate-800">الأوسمة مخفية</p>
                <p className="text-xs text-slate-500 mt-1">أضف المستخدم كصديق لرؤية الأوسمة</p>
              </div>
            ) : <BadgesTabContent userId={userId} badges={badges} accentColor={accentColor} />
          )}

          {activeTab === "profile" && (
            <div className="space-y-4">
              {!canViewFull ? (
                <div className="rounded-2xl p-7 text-center bg-amber-50 border border-amber-100">
                  <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-amber-100"><LockIcon /></div>
                  <p className="text-sm font-black text-slate-800">ملف شخصي خاص</p>
                  <p className="text-xs text-slate-500 mt-1">أضف هذا المستخدم كصديق لرؤية ملفه الشخصي</p>
                </div>
              ) : (
                <>
                  {profile.bio && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                      <SectionTitle title="نبذة عني" icon={<span className="text-xs">✦</span>} />
                      <p className="text-sm leading-7 text-slate-600">{profile.bio}</p>
                    </div>
                  )}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                    <SectionTitle title="المستويات" icon={<span className="text-xs">LV</span>} />
                    <div className="grid grid-cols-2 gap-2">
                      <LevelPill label="مستوى الثروة" value={wealthLevel} level={wealthLevel} type="wealth" />
                      <LevelPill label="مستوى الكاريزما" value={charismaLevel} level={charismaLevel} type="charisma" />
                    </div>
                  </div>
                  {isAgent && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                      <SectionTitle title="وكالة الشحن" icon={<span className="text-xs">💰</span>} color="#d97706" />
                      <div className="flex items-center gap-3 bg-amber-50 p-3 rounded-xl border border-amber-100">
                        <AgentChargeBadgeIf profile={profile} size="md" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-amber-700 font-bold">{parentAgentInfo ? "وكالة فرعية تابعة لـ" : "وكيل شحن معتمد"}</p>
                          <p className="text-sm text-slate-800 font-black truncate">{parentAgentInfo?.name ?? "معتمد رسمياً من ساكي"}</p>
                          {parentAgentInfo?.sakiId && <p className="text-[10px] text-slate-500 font-mono">#{parentAgentInfo.sakiId}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                  <HostAgencyBadgeSection userId={userId} />
                  {familyInfo && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                      <SectionTitle title="العائلة" icon={<span className="text-xs">♙</span>} color="#db2777" />
                      <div className="flex items-center gap-3 rounded-2xl p-3 bg-pink-50 border border-pink-100">
                        <div className="w-10 h-10 rounded-full bg-pink-100 overflow-hidden flex items-center justify-center">
                          {familyInfo.avatarUrl ? <img src={familyInfo.avatarUrl} alt="" className="w-full h-full object-cover" loading="lazy" /> : <span className="text-pink-500">♙</span>}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{familyInfo.name}</p>
                          <p className="text-[10px] text-slate-500">{familyInfo.role === "owner" ? "مالك العائلة" : "عضو"}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {topSupporters && topSupporters.length > 0 && <SupportersSection supporters={topSupporters} />}
                </>
              )}
            </div>
          )}

          {activeTab === "gifts" && (
            <GiftsReceivedTab userId={userId} gifts={receivedGifts} canViewFull={canViewFull} accentColor={accentColor} />
          )}
        </div>
      </div>

      {/* Sheets (More & Report) */}
      {showMoreSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowMoreSheet(false)}>
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 text-center font-black text-slate-800">خيارات إضافية</div>
            <div className="p-2 space-y-1">
              <button onClick={() => { setShowMoreSheet(false); setShowReportSheet(true); }} className="w-full py-4 text-center text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-2xl transition">إبلاغ عن المستخدم</button>
              <button onClick={handleBlock} disabled={blockLoading} className="w-full py-4 text-center text-sm font-bold text-red-600 hover:bg-red-50 rounded-2xl transition disabled:opacity-50">
                {blockLoading ? "جارٍ..." : blockStatus?.iBlockedThem ? "إلغاء الحظر" : "حظر المستخدم"}
              </button>
              <button onClick={() => setShowMoreSheet(false)} className="w-full py-4 text-center text-sm font-black text-slate-400 hover:bg-slate-50 rounded-2xl transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {showReportSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={() => setShowReportSheet(false)}>
          <div className="w-full max-w-sm bg-white rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-black text-slate-800 text-center mb-6">إبلاغ عن مخالفة</h3>
              <div className="space-y-2 mb-6">
                {REPORT_REASONS.map(reason => (
                  <button key={reason} onClick={() => setSelectedReason(reason)} className={`w-full py-3 px-4 rounded-2xl text-right text-sm font-bold transition-all ${selectedReason === reason ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>{reason}</button>
                ))}
              </div>
              <textarea value={reportDetails} onChange={e => setReportDetails(e.target.value)} placeholder="تفاصيل إضافية (اختياري)..." className="w-full h-24 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none mb-6" />
              <div className="flex gap-3">
                <button onClick={handleReport} disabled={reportLoading || !selectedReason} className="flex-1 py-4 rounded-2xl bg-amber-500 text-white text-sm font-black shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 disabled:shadow-none">{reportLoading ? "جارٍ الإرسال..." : "إرسال البلاغ"}</button>
                <button onClick={() => setShowReportSheet(false)} className="px-6 py-4 rounded-2xl bg-slate-100 text-slate-500 text-sm font-black active:scale-95">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
