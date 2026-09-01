// @ts-nocheck
import { useState, useEffect } from "react";
import { AristocracyName } from "../components/AristocracyBadge";
import { ProTitle } from "../components/VipBadge";
import UserAvatar from "../components/UserAvatar";
import { Page } from "../App";
import { supabase } from "../lib/supabaseClient";
import { useProfile } from "../components/ProfileManager";
import { formatNumber } from "../lib/formatNumber";
import { buildBadges, BadgeCard } from "../components/BadgeSystem";
import InvitePage from "./InvitePage";
import FollowersPage from "./FollowersPage";
import { useLang } from "../hooks/useLang";
import { toast } from "../lib/toast";

type IconName =
  | "wallet" | "tasks" | "heart" | "store" | "level" | "vip" | "gem" | "badge"
  | "invite" | "charge" | "host" | "dashboard" | "globe" | "settings";

interface MePageProps {
  setCurrentPage: (p: Page) => void;
  onOpenProfile: () => void;
  onOpenWallet: () => void;
  onOpenStore: () => void;
  onOpenPro: () => void;
  onOpenProSettings: () => void;
  onOpenFamily: () => void;
  onOpenAgent: () => void;
  onOpenSettings: () => void;
  onOpenEdit: () => void;
  onOpenLevel: () => void;
  onOpenVipFeatures?: () => void;
  onOpenBan?: () => void;
  onOpenAdminDashboard?: () => void;
  onOpenAristocracy?: () => void;
  onOpenCpHome?: () => void;
}

function LineIcon({ name, className = "w-5 h-5" }: { name: IconName | "copy" | "check" | "x" | "chevron-left" | "chevron-right"; className?: string }) {
  const common = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  const icons: Record<string, React.ReactNode> = {
    wallet: <><path d="M3 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" /><path d="M3 6V4a2 2 0 0 1 2-2h13" /><path d="M16 13h.01" /></>,
    tasks: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="m8 12 2.5 2.5L16 9" /></>,
    heart: <><path d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z" /><path d="M7.5 10.5h2l1-2 1.5 4 1-2h2" /></>,
    store: <><path d="M4 8h16l-1 13H5L4 8Z" /><path d="M6 8 7 3h10l1 5" /><path d="M9 12a3 3 0 0 0 6 0" /></>,
    level: <><circle cx="12" cy="8" r="5" /><path d="m8 12-2 9 6-3 6 3-2-9" /><path d="m12 5 .8 1.6 1.8.3-1.3 1.2.3 1.8-1.6-.8-1.6.8.3-1.8-1.3-1.2 1.8-.3L12 5Z" /></>,
    vip: <><path d="m3 7 4 10 5-12 5 12 4-10" /><path d="M5 21h14" /></>,
    gem: <><path d="m12 2 9 8-9 12L3 10l9-8Z" /><path d="m3 10 9 3 9-3M12 2v11" /></>,
    badge: <><path d="M12 3 15 6l4-.2-.2 4 3 3-3 3 .2 4-4-.2-3 3-3-3-4 .2.2-4-3-3 3-3L5 6l4 .2 3-3Z" /><path d="m9 13 2 2 4-4" /></>,
    invite: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></>,
    charge: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></>,
    host: <><path d="M3 10 12 3l9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" /><path d="M9 21v-7h6v7" /><circle cx="12" cy="9" r="2" /></>,
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5v.2h-4v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1-2.8-2.8.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3v-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1 2.8-2.8.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V3h4v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1 2.8 2.8-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1h.2v4h-.2a1.7 1.7 0 0 0-1.5 1Z" /></>,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M15 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    x: <><path d="m6 6 12 12M18 6 6 18" /></>,
    "chevron-left": <path d="m15 18-6-6 6-6" />,
    "chevron-right": <path d="m9 18 6-6-6-6" />,
  };
  return <svg {...common}>{icons[name]}</svg>;
}

function ProName({ name, level = 0, className = "" }: { name?: string; level?: number; className?: string }) {
  const palette: Record<number, [string, string]> = {
    1: ["#ef4444", "#f97316"], 2: ["#f59e0b", "#facc15"], 3: ["#10b981", "#22d3ee"],
    4: ["#3b82f6", "#a855f7"], 5: ["#8b5cf6", "#ec4899"],
  };
  const [from, to] = palette[Math.min(5, Math.max(1, level))] ?? ["#475569", "#0f172a"];
  if (!level) return <span className={className}>{name || "مستخدم"}</span>;
  return <span className={`font-black ${className}`} style={{ background: `linear-gradient(90deg,${from},${to},${from})`, backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "pro-name-flow 2.4s linear infinite", filter: `drop-shadow(0 0 5px ${from}70)` }}>{name || "مستخدم"}</span>;
}

function ProfileName({ profile, proLevel, isPro, aristocracyActive, aristocracyLevel, aristocracyDbName }: any) {
  if (aristocracyActive) return <AristocracyName level={aristocracyLevel} className="text-xl" dbName={aristocracyDbName}>{profile.name}</AristocracyName>;
  return <ProName name={profile.name} level={isPro ? proLevel : 0} />;
}

function StatsRow({ followingCount, followersCount, onFollowing, onFollowers, onVisitors, lang }: any) {
  const [visitorsCount, setVisitorsCount] = useState(0);
  
  useEffect(() => {
    const fetchVisitors = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase.from('profile_visitors').select('*', { count: 'exact', head: true }).eq('profile_id', user.id);
      setVisitorsCount(count || 0);
    };
    fetchVisitors();
  }, []);

  const items = [
    { label: lang === "en" ? "Visitors" : "زائر", value: formatNumber(visitorsCount), onClick: onVisitors, locked: false },
    { label: lang === "en" ? "Following" : "متابعة", value: formatNumber(followingCount), onClick: onFollowing },
    { label: lang === "en" ? "Fans" : "متابعين", value: formatNumber(followersCount), onClick: onFollowers },
  ];
  return (
    <div className="profile-stats">
      {items.map((item, index) => (
        <div key={item.label} className="contents">
          {index > 0 && <div className="stats-divider" />}
          <button type="button" className="stat-button item-press" onClick={item.onClick}>
            <span className={item.locked ? "visitor-lock" : "stat-number"}>{item.value}</span>
            <span className="stat-label">{item.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
}

function BadgePage({ badges, onBack }: { badges: any[]; onBack: () => void }) {
  return (
    <div className="fixed inset-0 z-[250] flex flex-col bg-soft-gradient" dir="rtl">
      <header className="glass-header h-14 flex items-center gap-3 px-4 border-b border-slate-200/50">
        <button type="button" onClick={onBack} className="p-2 text-slate-600 item-press" aria-label="رجوع"><LineIcon name="chevron-right" /></button>
        <div><h2 className="font-bold text-slate-800">الشارة</h2><p className="text-[10px] text-slate-400">{badges.length} وسام مكتسب</p></div>
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        {badges.length === 0 ? <div className="text-center py-20 text-slate-500 font-bold">لا توجد أوسمة بعد</div> : <div className="grid grid-cols-3 gap-3">{badges.map((badge: any) => <BadgeCard key={badge.id} badge={badge} size="md" />)}</div>}
      </div>
    </div>
  );
}

function MenuItem({ iconUrl, label, action, value, badge, isNew }: { iconUrl: string; label: string; action: () => void; value?: string; badge?: string; isNew?: boolean }) {
  return (
    <button type="button" onClick={action} className="menu-item item-press">
      <img src={iconUrl} alt="" className="w-6 h-6 object-contain" />
      <span className="menu-label">{label}</span>
      <span className="menu-trailing">
        {isNew && <span className="new-badge">جديد</span>}
        {badge && <span className="level-badge">{badge}</span>}
        {value && <span className="menu-value">{value}</span>}
        <LineIcon name="chevron-left" className="w-4 h-4" />
      </span>
    </button>
  );
}

export default function MePage({
  setCurrentPage, onOpenProfile, onOpenWallet, onOpenStore, onOpenPro,
  onOpenFamily, onOpenAgent, onOpenSettings, onOpenEdit, onOpenLevel,
  onOpenVipFeatures, onOpenBan, onOpenAdminDashboard, onOpenAristocracy, onOpenCpHome,
}: MePageProps) {
  const { profile, isLoading } = useProfile();
  const [myRoom, setMyRoom] = useState<any>(null);
  const [familyInfo, setFamilyInfo] = useState<any>(null);
  const [cpHome, setCpHome] = useState<any>(null);
  
  useEffect(() => {
    if (!profile) return;
    const fetchData = async () => {
      const { data: room } = await supabase.from('rooms').select('*').eq('owner_id', profile.user_id).single();
      setMyRoom(room);
      
      const { data: family } = await supabase.from('families').select('*').eq('creator_id', profile.user_id).single();
      setFamilyInfo(family);
    };
    fetchData();
  }, [profile]);

  const { lang, isRtl, changeLang } = useLang();
  const [showBadges, setShowBadges] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showFollowers, setShowFollowers] = useState<"followers" | "following" | "visitors" | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [toastText, setToastText] = useState<string | null>(null);

  if (!profile) {
    return <div className="me-loading"><div className="loading-ring" /></div>;
  }

  const isPro = Boolean(profile.is_pro && (profile.pro_expires_at ?? 0) > Date.now());
  const proLevel = profile.pro_level ?? (isPro ? 1 : 0);
  const isSuperAdmin = Boolean(profile.is_super_admin);
  const isAgent = Boolean(profile.is_agent);
  const wealthLevel = profile.wealth_level ?? 0;
  const charismaLevel = profile.charisma_level ?? 0;
  const aristocracyLevel = profile.aristocracy_level ?? 0;
  const aristocracyActive = aristocracyLevel > 0 && (profile.aristocracy_expires_at ?? 0) > Date.now();
  const aristocracyDbLevel = null;
  const displayLevel = Math.max(wealthLevel, charismaLevel, 1);
  const isCustomerService = Boolean(profile.is_customer_service);
  // بيت الحب مدخل عام في صفحة «أنا»؛ تُعرض بيانات CP عند توفرها وتبقى البطاقة قابلة للفتح للجميع.
  const hasActiveCp = true;
  const cpTotalGifts = Math.max(0, Number(cpHome?.total_gifts_received ?? 0));
  const cpLevel = Math.min(5, Math.max(1, Number(cpHome?.level ?? 1)));
  const cpCurrentThreshold = Number(cpHome?.current_threshold ?? 0);
  const cpNextThreshold = cpHome?.next_threshold == null ? null : Number(cpHome.next_threshold);
  const cpProgress = cpNextThreshold == null
    ? 100
    : Math.min(100, Math.max(0, ((cpTotalGifts - cpCurrentThreshold) / Math.max(1, cpNextThreshold - cpCurrentThreshold)) * 100));
  const cpRemaining = cpNextThreshold == null ? 0 : Math.max(0, cpNextThreshold - cpTotalGifts);

  const badges = buildBadges({
    isPro, proLevel, isSuperAdmin, isAgent, isActive: profile.is_active,
    wealthLevel, charismaLevel,
    familyInfo: familyInfo ? { name: familyInfo.name, role: familyInfo.role } : null,
    isRoomOwner: Boolean(myRoom),
    aristocracyLevel: aristocracyActive ? aristocracyLevel : 0,
    aristocracyExpiresAt: profile.aristocracy_expires_at,
    isSakiAmbassador: Boolean(profile.is_saki_ambassador),
  });

  const copySakiId = async () => {
    const value = String(profile.saki_id ?? "");
    try {
      await navigator.clipboard.writeText(value);
      setToastText("تم نسخ المعرف بنجاح!");
    } catch {
      toast.success("تم نسخ المعرف بنجاح!");
    }
    window.setTimeout(() => setToastText(null), 2000);
  };

  const selectLanguage = (next: "ar" | "en") => {
    changeLang(next);
    setShowLanguageModal(false);
    setToastText(next === "ar" ? "تم تغيير اللغة إلى العربية" : "Language changed to English");
    window.setTimeout(() => setToastText(null), 2000);
  };

  if (showBadges) return <BadgePage badges={badges} onBack={() => setShowBadges(false)} />;
  if (showInvite) return <InvitePage onBack={() => setShowInvite(false)} />;
  if (showFollowers) return <FollowersPage initialTab={showFollowers} onBack={() => setShowFollowers(null)} onViewProfile={() => { setShowFollowers(null); onOpenProfile(); }} />;

  const menuItems: Array<{ icon: IconName; label: string; action: () => void; iconClass: string; value?: string; badge?: string; isNew?: boolean }> = [
    { icon: "vip", label: "PRO SAKI", action: onOpenPro, iconClass: "menu-amber", value: isPro ? `PRO ${proLevel}` : "ترقية الآن" },
    { icon: "gem", label: lang === "en" ? "Aristocracy" : "الأرستقراطية", action: () => onOpenAristocracy?.(), iconClass: "menu-indigo" },
    { icon: "badge", label: lang === "en" ? "Badge" : "الشارة", action: () => setShowBadges(true), iconClass: "menu-purple" },
    { icon: "invite", label: lang === "en" ? "Invite Friend" : "دعوة صديق", action: () => setShowInvite(true), iconClass: "menu-rose", isNew: true },
  ];

  if (isAgent || isSuperAdmin) menuItems.push({ icon: "charge", label: lang === "en" ? "Charge Agency" : "وكالة شحن", action: onOpenAgent, iconClass: "menu-teal" });
  menuItems.push({ icon: "host", label: lang === "en" ? "Host Agency" : "وكالة مضيفين", action: onOpenFamily, iconClass: "menu-blue" });
  if (isSuperAdmin || isCustomerService) menuItems.push({ icon: "dashboard", label: lang === "en" ? "Control Panel" : "لوحة التحكم", action: () => onOpenAdminDashboard?.(), iconClass: "menu-orange" });
  menuItems.push({ icon: "globe", label: lang === "en" ? "Language" : "اللغة", action: () => setShowLanguageModal(true), iconClass: "menu-teal", value: lang === "en" ? "English" : "العربية" });
  menuItems.push({ icon: "settings", label: lang === "en" ? "Settings" : "الإعدادات", action: onOpenSettings, iconClass: "menu-slate" });

  return (
    <div className="me-page" dir={isRtl ? "rtl" : "ltr"}>
      <header className="me-topbar">
        <div className="me-topbar-inner">
          <button type="button" onClick={() => setCurrentPage("home")} className="topbar-button item-press" aria-label="رجوع"><LineIcon name={isRtl ? "chevron-right" : "chevron-left"} /></button>
          <h1 className="topbar-title">{lang === "en" ? "Profile" : "الملف الشخصي"}</h1>
          <button type="button" onClick={onOpenEdit} className="topbar-button item-press text-teal-700" aria-label="تعديل الملف الشخصي"><LineIcon name="settings" className="w-5 h-5" /></button>
        </div>
      </header>

      <main className="me-shell">
        <section className="profile-hero relative overflow-hidden rounded-[32px] mb-6 pt-10 pb-6 px-4" style={{ backgroundImage: "url('/manus-storage/icon_user_detail_home_bg_4de2dd22.webp')", backgroundSize: "cover", backgroundPosition: "center" }}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 flex flex-col items-center">
            <button type="button" onClick={onOpenProfile} className="avatar-button item-press mb-4" aria-label="فتح الملف الشخصي">
              <div className="avatar-ring border-4 border-white/30"><UserAvatar userId={profile.user_id} avatarUrl={profile.avatar_url} name={profile.name} size={92} showFrame isSuperAdmin={isSuperAdmin} isVip={false} /></div>
            </button>
            <h2 className="profile-name text-white drop-shadow-md"><ProfileName profile={profile} proLevel={proLevel} isPro={isPro} aristocracyActive={aristocracyActive} aristocracyLevel={aristocracyLevel} aristocracyDbName={aristocracyDbLevel?.name} /></h2>
            {isPro && <div className="mt-1"><ProTitle level={proLevel} size="sm" /></div>}
            <button type="button" onClick={copySakiId} className="id-pill item-press bg-white/20 border-white/30 text-white mt-2" aria-label="نسخ معرف ساكي">
              <LineIcon name="copy" className="w-3.5 h-3.5 text-white/70" />
              <span>ID: {profile.saki_id ?? "—"}</span>
            </button>
            <div className="w-full mt-6">
              <StatsRow followingCount={profile.following_count ?? 0} followersCount={profile.followers_count ?? 0} onFollowing={() => setShowFollowers("following")} onFollowers={() => setShowFollowers("followers")} onVisitors={() => setShowFollowers("visitors")} lang={lang} />
            </div>
          </div>
        </section>

        <section className="quick-grid">
          <button type="button" className="quick-card item-press" onClick={onOpenWallet}>
            <img src="/manus-storage/me_icon_recharge_394d23a1.webp" alt="" className="w-10 h-10 object-contain" />
            <span>المحفظة</span>
          </button>
          {hasActiveCp && <button type="button" className="quick-card item-press" onClick={() => onOpenCpHome?.()}>
            <img src="/manus-storage/me_icon_confession_d1f15531.webp" alt="" className="w-10 h-10 object-contain" />
            <span>بيت الحب</span>
          </button>}
          <button type="button" className="quick-card item-press" onClick={onOpenStore}>
            <img src="/manus-storage/me_icon_package_5bb1263b.webp" alt="" className="w-10 h-10 object-contain" />
            <span>المتجر</span>
          </button>
          <button type="button" className="quick-card item-press" onClick={onOpenLevel}>
            <img src="/manus-storage/me_icon_level_42eaf98e.webp" alt="" className="w-10 h-10 object-contain" />
            <span>المستوى</span>
          </button>
        </section>

        {hasActiveCp && (
          <section className="cp-home-entry mb-4">
            <button type="button" onClick={() => onOpenCpHome?.()} className="cp-home-button item-press" aria-label="فتح بيت الحب">
              <span className="cp-home-icon"><span>⌂</span><i>♥</i></span>
              <span className="cp-home-pair" aria-label="صورة المستخدم والشريك"><span className="cp-mini-avatar">{cpHome?.owner_avatar_url ? <img src={cpHome.owner_avatar_url} alt="" /> : <span>{profile?.name?.[0] ?? "♥"}</span>}</span><img className="cp-mini-ring" src="/assets/cp-love-ring.svg" alt="خاتم الحب" /><span className="cp-mini-avatar">{cpHome?.partner_avatar_url ? <img src={cpHome.partner_avatar_url} alt="" /> : <span>{cpHome?.partner_name?.[0] ?? "♥"}</span>}</span></span>
              <span className="cp-home-copy">
                <span className="cp-home-title">بيت الحب <b>LV.{cpLevel}</b></span>
                <span className="cp-home-subtitle">المهام والتقدم في بيت الحب</span>
                <span className="cp-progress-track"><span className="cp-progress-fill" style={{ width: `${cpProgress}%` }} /></span>
                <span className="cp-progress-label">{cpNextThreshold == null ? "اكتمل المستوى الخامس" : `باقي ${formatNumber(cpRemaining)} هدية للمستوى التالي`}</span>
              </span>
              <span className="cp-home-arrow">‹</span>
            </button>
            <div className="cp-task-row">
              <span><LineIcon name="heart" className="w-4 h-4" /> إجمالي الهدايا {formatNumber(cpTotalGifts)}</span>
              <span>{cpHome?.level_name ?? "بيت الحب"}</span>
            </div>
          </section>
        )}

        <section className="menu-card">
          <MenuItem iconUrl="/manus-storage/me_icon_bill_75af1506.webp" label="المحفظة" action={onOpenWallet} value={`${formatNumber(profile.gold_coins)} عملة`} />
          <div className="menu-divider" />
          <MenuItem iconUrl="/manus-storage/me_icon_package_5bb1263b.webp" label="المتجر" action={onOpenStore} />
          <div className="menu-divider" />
          <MenuItem iconUrl="/manus-storage/me_icon_aristocracy_4dcace13.webp" label="عضوية PRO" action={onOpenPro} value={isPro ? `مستوى ${proLevel}` : "تفعيل"} />
          <div className="menu-divider" />
          <MenuItem iconUrl="/manus-storage/me_icon_confession_d1f15531.webp" label="بيت الحب" action={onOpenCpHome} isNew />
        </section>

        <section className="menu-card">
          <MenuItem iconUrl="/manus-storage/me_icon_level_42eaf98e.webp" label="المستوى" action={onOpenLevel} badge={`Lv.${displayLevel}`} />
          <div className="menu-divider" />
          <MenuItem iconUrl="/manus-storage/me_icon_medal_1ef471d3.webp" label="الشارات" action={() => setShowBadges(true)} value={`${badges.length} وسام`} />
          <div className="menu-divider" />
          <MenuItem iconUrl="/manus-storage/me_icon_earnings_d2019d22.webp" label="وكالة المضيفين" action={onOpenFamily} />
        </section>

        {isAgent && (
          <section className="menu-card">
            <MenuItem iconUrl="/manus-storage/me_icon_recharge_394d23a1.webp" label="لوحة وكيل الشحن" action={onOpenAgent} />
          </section>
        )}

        {isSuperAdmin && (
          <section className="menu-card">
            <MenuItem iconUrl="/manus-storage/me_icon_game_5dcc19b0.webp" label="لوحة التحكم" action={onOpenAdminDashboard} />
          </section>
        )}

        <section className="menu-card">
          <MenuItem iconUrl="/manus-storage/me_icon_invitation_cfc4b509.webp" label="دعوة الأصدقاء" action={() => setShowInvite(true)} />
          <div className="menu-divider" />
          <MenuItem iconUrl="/manus-storage/me_icon_relation_f90406a4.webp" label="اللغة" action={() => setShowLanguageModal(true)} value={lang === "en" ? "English" : "العربية"} />
          <div className="menu-divider" />
          <MenuItem iconUrl="/manus-storage/me_icon_setting_2a9ef1ad.webp" label="الإعدادات" action={onOpenSettings} />
        </section>

        <p className="me-version">{lang === "en" ? "Version 2.0.0" : "الإصدار 2.0.0"}</p>
      </main>

      {showLanguageModal && (
        <div className="language-overlay" onClick={() => setShowLanguageModal(false)}>
          <div className="language-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="language-heading"><h3>{lang === "en" ? "Choose language" : "اختر اللغة"}</h3><button type="button" onClick={() => setShowLanguageModal(false)}><LineIcon name="x" className="w-5 h-5" /></button></div>
            <button type="button" className={`language-option ${lang === "ar" ? "language-active" : ""}`} onClick={() => selectLanguage("ar")}><span>العربية</span>{lang === "ar" && <LineIcon name="check" className="w-5 h-5 text-teal-600" />}</button>
            <button type="button" className={`language-option ${lang === "en" ? "language-active" : ""}`} onClick={() => selectLanguage("en")}><span>English</span>{lang === "en" && <LineIcon name="check" className="w-5 h-5 text-teal-600" />}</button>
          </div>
        </div>
      )}

      {toastText && <div className="me-toast"><LineIcon name="check" className="w-4 h-4 text-teal-400" /><span>{toastText}</span></div>}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
        .me-page { position: relative; display: flex; flex: 1 1 auto; flex-direction: column; width: 100%; height: 100%; min-height: 0; max-height: 100%; overflow-x: hidden; overflow-y: auto; overscroll-behavior-y: contain; -webkit-overflow-scrolling: touch; touch-action: pan-y; padding-bottom: calc(96px + env(safe-area-inset-bottom)); color: #334155; background: linear-gradient(180deg, #d3f9f2 0%, #f4fbf9 25%, #f8fafc 100%); font-family: 'Cairo', sans-serif; -webkit-tap-highlight-color: transparent; }
        .me-topbar { position: fixed; top: 0; left: 0; right: 0; z-index: 40; display: flex; justify-content: center; }
        .me-topbar-inner { width: 100%; max-width: 430px; height: 56px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; border-bottom: 1px solid rgba(203,213,225,.5); background: rgba(255,255,255,.85); box-shadow: 0 1px 5px rgba(15,23,42,.04); backdrop-filter: blur(12px); }
        .topbar-button { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; padding: 8px; border: 0; border-radius: 999px; background: transparent; color: #475569; }
        .topbar-button:hover { background: rgba(241,245,249,.7); }
        .topbar-title { color: #1e293b; font-size: 16px; font-weight: 700; letter-spacing: .02em; }
        .me-shell { width: 100%; max-width: 430px; min-height: max-content; margin: 0 auto; padding: 80px 16px 28px; }
        .item-press:active { transform: scale(.98); transition: transform .1s ease; }
        .profile-hero { display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 20px; }
        .avatar-button { border: 0; background: transparent; padding: 0; margin-bottom: 12px; }
        .avatar-ring { width: 100px; height: 100px; padding: 4px; border: 4px solid #fff; border-radius: 999px; background: #fff; box-shadow: 0 4px 14px rgba(15,23,42,.12); overflow: hidden; }
        .profile-name { margin: 0 0 4px; color: #1e293b; font-size: 21px; line-height: 1.4; font-weight: 700; letter-spacing: .02em; }
        .id-pill { display: flex; align-items: center; gap: 6px; padding: 2px 12px; border: 1px solid rgba(203,213,225,.55); border-radius: 999px; background: rgba(255,255,255,.6); color: #64748b; font-size: 12px; font-weight: 500; letter-spacing: .05em; }
        .profile-stats { display: grid; grid-template-columns: repeat(3, 1fr); width: 100%; margin-top: 22px; padding: 0 14px; }
        .stat-button { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 0 8px; border: 0; background: transparent; }
        .stat-number { color: #1e293b; font-size: 19px; font-weight: 700; line-height: 1.4; }
        .stat-label { color: #94a3b8; font-size: 11px; font-weight: 600; }
        .visitor-lock { padding: 2px 8px; border-radius: 999px; background: #f59e0b; color: #fff; font-size: 10px; font-weight: 800; line-height: 1.5; }
        .stats-divider { width: 1px; height: 32px; margin: 3px auto 0; background: rgba(203,213,225,.7); }
        .quick-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 10px; margin-bottom: 16px; padding: 16px 12px; border: 1px solid #f1f5f9; border-radius: 16px; background: #fff; box-shadow: 0 2px 10px rgba(15,23,42,.04); }
        .quick-card { display: flex; flex-direction: column; align-items: center; gap: 8px; border: 0; background: transparent; color: #475569; font-family: inherit; font-size: 11px; font-weight: 600; }
        .quick-icon { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 16px; }
        .quick-amber { color: #f59e0b; background: #fffbeb; }
        .quick-heart { color: #e11d48; background: #fff1f2; }
        .quick-sky { color: #0ea5e9; background: #f0f9ff; }
        .quick-rose { color: #f43f5e; background: #fff1f2; }
        .quick-emerald { color: #10b981; background: #ecfdf5; }
        .cp-home-entry { overflow: hidden; border: 1px solid #fbcfe8; border-radius: 24px; background: linear-gradient(135deg,#fff1f8 0%,#fff 48%,#f5f3ff 100%); box-shadow: 0 8px 24px rgba(236,72,153,.10); }
        .cp-home-button { display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px; border: 0; background: radial-gradient(circle at 8% 10%,rgba(244,114,182,.18),transparent 34%), transparent; color: #831843; font-family: inherit; text-align: right; }
        .cp-home-icon { position: relative; display: flex; align-items: center; justify-content: center; flex: 0 0 auto; width: 54px; height: 54px; border-radius: 18px; background: linear-gradient(145deg,#f9a8d4,#c084fc); color: #fff; font-size: 31px; line-height: 1; box-shadow: 0 6px 14px rgba(236,72,153,.22); }
        .cp-home-icon i { position: absolute; right: 7px; bottom: 6px; color: #ffe4e6; font-size: 14px; font-style: normal; }
        .cp-home-pair { display: inline-flex; align-items: center; flex: 0 0 auto; margin-inline: 1px; }
        .cp-mini-avatar { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; overflow: hidden; border: 2px solid #f9a8d4; border-radius: 999px; background: linear-gradient(135deg,#f472b6,#8b5cf6); color: #fff; font-size: 13px; font-weight: 900; }
        .cp-mini-avatar + .cp-mini-ring { margin-inline: -5px; }
        .cp-mini-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .cp-mini-ring { position: relative; z-index: 2; width: 27px; height: 27px; object-fit: contain; filter: drop-shadow(0 2px 3px rgba(236,72,153,.35)); }
        .cp-home-copy { min-width: 0; flex: 1; }
        .cp-home-title { display: flex; align-items: center; gap: 7px; color: #9d174d; font-size: 15px; font-weight: 900; }
        .cp-home-title b { padding: 2px 6px; border-radius: 999px; background: #fce7f3; color: #db2777; font-size: 9px; }
        .cp-home-subtitle { display: block; margin-top: 2px; color: #be185d; font-size: 10px; font-weight: 700; }
        .cp-progress-track { display: block; height: 7px; margin-top: 9px; overflow: hidden; border-radius: 999px; background: #fce7f3; }
        .cp-progress-fill { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg,#ec4899,#a855f7); transition: width .5s ease; }
        .cp-progress-label { display: block; margin-top: 4px; color: #be185d; font-size: 9px; font-weight: 700; }
        .cp-home-arrow { flex: 0 0 auto; color: #ec4899; font-size: 27px; line-height: 1; }
        .cp-task-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 9px 15px; border-top: 1px solid rgba(251,207,232,.7); color: #9d174d; font-size: 10px; font-weight: 800; }
        .cp-task-row span { display: inline-flex; align-items: center; gap: 5px; }
        .menu-card { display: flex; flex-direction: column; gap: 0; padding: 8px; margin-bottom: 20px; border: 1px solid #f1f5f9; border-radius: 16px; background: #fff; box-shadow: 0 2px 10px rgba(15,23,42,.04); }
        .menu-item { display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: 60px; padding: 12px; border: 0; border-radius: 12px; background: transparent; color: #1e293b; font-family: inherit; text-align: right; transition: background-color .15s ease, transform .1s ease; }
        .menu-item:hover { background: #f8fafc; }
        .menu-icon { display: flex; align-items: center; justify-content: center; flex: 0 0 auto; width: 38px; height: 38px; border-radius: 12px; }
        .menu-label { flex: 1; margin: 0 12px; font-size: 13px; font-weight: 700; }
        .menu-trailing { display: flex; align-items: center; gap: 6px; flex: 0 0 auto; color: #94a3b8; }
        .menu-value { color: #64748b; font-size: 11px; font-weight: 600; }
        .menu-divider { height: 1px; margin: 0 12px; background: #f1f5f9; }
        .new-badge { padding: 2px 6px; border-radius: 999px; background: linear-gradient(135deg,#ff4757,#ff6b81); color: #fff; font-size: 9px; font-weight: 800; }
        .level-badge { padding: 2px 7px; border-radius: 999px; background: linear-gradient(135deg,#22c55e,#16a34a); color: #fff; font-size: 9px; font-weight: 800; }
        .menu-amber { color: #d97706; background: rgba(254,243,199,.75); }
        .menu-indigo { color: #4f46e5; background: rgba(224,231,255,.75); }
        .menu-purple { color: #9333ea; background: rgba(243,232,255,.8); }
        .menu-rose { color: #e11d48; background: rgba(255,228,230,.78); }
        .menu-teal { color: #0f766e; background: rgba(204,251,241,.8); }
        .menu-blue { color: #2563eb; background: rgba(219,234,254,.8); }
        .menu-orange { color: #ea580c; background: rgba(255,237,213,.8); }
        .menu-slate { color: #475569; background: #f1f5f9; }
        .me-version { margin: 0; color: #cbd5e1; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px; text-align: center; }
        .me-loading { display: flex; min-height: 100%; align-items: center; justify-content: center; background: linear-gradient(180deg,#d3f9f2,#f8fafc); }
        .loading-ring { width: 34px; height: 34px; border: 3px solid rgba(20,184,166,.18); border-top-color: #14b8a6; border-radius: 999px; animation: me-spin .8s linear infinite; }
        .language-overlay { position: fixed; inset: 0; z-index: 80; display: flex; align-items: flex-end; justify-content: center; background: rgba(15,23,42,.4); backdrop-filter: blur(3px); }
        .language-sheet { width: 100%; max-width: 430px; display: flex; flex-direction: column; gap: 8px; padding: 24px; border-radius: 24px 24px 0 0; background: #fff; box-shadow: 0 -8px 24px rgba(15,23,42,.12); }
        .language-heading { display: flex; align-items: center; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
        .language-heading h3 { font-size: 15px; font-weight: 700; }
        .language-heading button { border: 0; background: transparent; color: #94a3b8; }
        .language-option { display: flex; align-items: center; justify-content: space-between; padding: 12px; border: 1px solid #f1f5f9; border-radius: 12px; background: #fff; color: #475569; font-family: inherit; font-size: 13px; font-weight: 600; }
        .language-active { border-color: #99f6e4; background: #f0fdfa; color: #115e59; }
        .me-toast { position: fixed; top: 72px; left: 50%; z-index: 100; display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 999px; background: rgba(15,23,42,.92); color: #fff; font-size: 11px; box-shadow: 0 8px 20px rgba(15,23,42,.18); transform: translateX(-50%); }
        @keyframes me-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .item-press, .menu-item { transition: none; } }
      `}</style>
    </div>
  );
}
