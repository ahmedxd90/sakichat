// @ts-nocheck
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ARAB_COUNTRIES } from "../data/countries";
import { useState, useRef } from "react";
import { toast } from "../lib/toast";
import { VipBadge, VipName, getVipConfig, SuperAdminBadge } from "../components/VipBadge";
import EditProfilePage from "./EditProfilePage";
import SettingsPage from "./SettingsPage";
import WalletPage from "./WalletPage";
import AgentChargePage from "./AgentChargePage";
import FamilyPage from "./FamilyPage";
import StorePage from "./StorePage";
import VipPage from "./VipPage";
import ProMembershipPage from "./ProMembershipPage";
import LevelPage, { LevelBadge } from "./LevelPage";
import { Page } from "../App";
import UserAvatar from "../components/UserAvatar";
import { buildBadges, BadgeCard } from "../components/BadgeSystem";
import { AristocracyName, getAristocracyConfig } from "../components/AristocracyBadge";
import { CustomerServiceBadge } from "../components/CustomerServiceBadge";
import { AgentChargeBadgeIf } from "../components/AgentChargeBadge";
import SakiIdDisplay from "../components/SakiIdDisplay";
import BadgesTabContent from "./BadgesTabContent";

interface ProfilePageProps {
  setCurrentPage: (p: Page) => void;
  onVipOpen?: (hide: boolean) => void;
  initialSubPage?: SubPage;
  onBack?: () => void;
  onMessage?: (userId: any) => void;
  onViewProfile?: (userId: any) => void;
}

type SubPage = "main" | "edit" | "settings" | "wallet" | "agent" | "family" | "store" | "vip" | "pro" | "level" | "uploadEmoji";

function daysLeft(expiresAt: number | null): string {
  if (!expiresAt) return "دائم ♾️";
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "منتهي";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days} يوم`;
  return `${hours} ساعة`;
}

export default function ProfilePage({ setCurrentPage, onVipOpen, initialSubPage, onBack, onMessage, onViewProfile }: ProfilePageProps) {
  const profile = useQuery(api.profiles.getMyProfile);
  const myMoments = useQuery(api.social.getUserMoments, profile ? { userId: profile.userId } : "skip");
  const myReels = useQuery(api.social.getUserReels, profile ? { userId: profile.userId } : "skip");
  const activeItems = useQuery(api.store.getUserActiveItems, profile ? { userId: profile.userId } : "skip");
  const cpPartner = useQuery(api.store.getActiveCpPartner, profile ? { userId: profile.userId } : "skip");
  const myRoom = useQuery(api.rooms.getMyRoom);
  const familyInfo = useQuery(api.families.getFamilyByUserId, profile ? { userId: profile.userId } : "skip");
  const activateAccount = useMutation(api.profiles.activateAccount);
  const generateCoverUploadUrl = useMutation(api.profiles.generateCoverUploadUrl);
  const updateCover = useMutation(api.profiles.updateCover);

  const [activating, setActivating] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "reels" | "badges" | "cp">("posts");
  const [showMenu, setShowMenu] = useState(false);
  const [subPage, setSubPage] = useState<SubPage>(initialSubPage ?? "main");
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const country = ARAB_COUNTRIES.find((c) => c.code === profile?.country);
  const isVip = profile?.isVip ?? false;
  const vipLevel = profile?.vipLevel;
  const vipConfig = getVipConfig(vipLevel);
  const isAgent = profile?.isAgent ?? false;
  const isSuperAdmin = profile?.isSuperAdmin ?? false;
  const aristocracyLevel = profile?.aristocracyLevel;
  const aristocracyConfig = getAristocracyConfig(aristocracyLevel);
  const hasActiveAristocracy = aristocracyLevel && aristocracyLevel > 0 && profile?.aristocracyExpiresAt && profile.aristocracyExpiresAt > Date.now();
  const hasCp = cpPartner && (!cpPartner.expiresAt || cpPartner.expiresAt > Date.now());
  const wealthLevel = profile?.wealthLevel ?? 0;
  const charismaLevel = profile?.charismaLevel ?? 0;
  const accentColor = hasActiveAristocracy && aristocracyConfig ? aristocracyConfig.color : (vipConfig?.nameColor || "#a855f7");
  const accentBorder = hasActiveAristocracy && aristocracyConfig ? `${aristocracyConfig.color}40` : (vipConfig?.glowColor || "rgba(168,85,247,0.25)");

  const handleActivate = async () => {
    if (!profile) return;
    setActivating(true);
    try { await activateAccount({ profileId: profile._id }); toast.success("تم تفعيل حسابك! 🎉"); }
    catch (e: any) { toast.error(e.message); }
    finally { setActivating(false); }
  };

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    try {
      const uploadUrl = await generateCoverUploadUrl();
      const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = await res.json();
      await updateCover({ coverStorageId: storageId });
      toast.success("تم تحديث الغلاف ✅");
    } catch (e: any) {
      toast.error(e.message ?? "فشل رفع الغلاف");
    } finally {
      setUploadingCover(false);
    }
  };

  if (subPage === "edit") return <EditProfilePage onBack={() => { setSubPage("main"); if (initialSubPage) onBack?.(); }} />;
  if (subPage === "settings") return <SettingsPage onBack={() => { setSubPage("main"); if (initialSubPage) onBack?.(); }} />;
  if (subPage === "wallet") return <WalletPage onBack={() => { setSubPage("main"); if (initialSubPage) onBack?.(); }} onOpenAgent={() => setSubPage("agent")} onMessage={onMessage} onViewProfile={onViewProfile} />;
  if (subPage === "agent") return <AgentChargePage onBack={() => setSubPage("wallet")} />;
  if (subPage === "family") return <FamilyPage onBack={() => { setSubPage("main"); if (initialSubPage) onBack?.(); }} />;
  if (subPage === "store") return <StorePage onBack={() => { setSubPage("main"); if (initialSubPage) onBack?.(); }} />;
  if (subPage === "vip" || subPage === "pro") return <ProMembershipPage onBack={() => { setSubPage("main"); if (initialSubPage) onBack?.(); }} onOpenSettings={() => setSubPage("settings")} />;
  if (subPage === "level") return <LevelPage onBack={() => setSubPage("main")} />;

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d002a" }}>
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const badges = buildBadges({
    isVip, vipLevel, isSuperAdmin, isAgent,
    isActive: profile.isActive,
    wealthLevel, charismaLevel,
    familyInfo: familyInfo ? { name: familyInfo.name, role: familyInfo.role } : null,
    isRoomOwner: !!myRoom,
    isSakiAmbassador: (profile as any).isSakiAmbassador ?? false,
    aristocracyLevel: hasActiveAristocracy ? aristocracyLevel : 0,
    aristocracyExpiresAt: profile?.aristocracyExpiresAt ?? null,
  });

  const menuItems = [
    { icon: "💰", label: "المحفظة", color: "#fbbf24", bg: "rgba(251,191,36,0.12)", action: () => { setShowMenu(false); setSubPage("wallet"); } },
    { icon: "🛒", label: "المتجر", color: "#60a5fa", bg: "rgba(96,165,250,0.12)", action: () => { setShowMenu(false); setSubPage("store"); } },
    { icon: "✦", label: "PRO SAKI", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", action: () => { setShowMenu(false); setSubPage("pro"); } },
    { icon: "👨‍👩‍👧‍👦", label: "العائلة", color: "#f472b6", bg: "rgba(244,114,182,0.12)", action: () => { setShowMenu(false); setSubPage("family"); } },
    ...(isAgent || isSuperAdmin ? [{ icon: "⚡", label: "وكالة الشحن", color: "#4ade80", bg: "rgba(74,222,128,0.12)", action: () => { setShowMenu(false); setSubPage("agent"); } }] : []),
    { icon: "⭐", label: "المستوى", color: "#fb923c", bg: "rgba(251,146,60,0.12)", action: () => { setShowMenu(false); setSubPage("level"); } },
    { icon: "⚙️", label: "الإعدادات", color: "#9ca3af", bg: "rgba(156,163,175,0.1)", action: () => { setShowMenu(false); setSubPage("settings"); } },
  ];

  return (
    <div className="flex flex-col h-full relative overflow-x-hidden overflow-y-auto" dir="rtl"
      style={{ background: "linear-gradient(180deg, #0d002a 0%, #1a0035 50%, #0d002a 100%)" }}>

      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full opacity-10 animate-pulse"
          style={{ background: `radial-gradient(circle, ${accentColor}, transparent)`, animationDuration: "3s" }} />
        <div className="absolute top-40 right-0 w-56 h-56 rounded-full opacity-8 animate-pulse"
          style={{ background: `radial-gradient(circle, ${accentBorder}, transparent)`, animationDuration: "4s", animationDelay: "1s" }} />
      </div>

      {/* ── Fixed Header ── */}
      <div className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl"
        style={{ background: "rgba(13,0,42,0.92)", borderBottom: `1px solid ${accentBorder}` }}>
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack ?? (() => setShowMenu(true))}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
            style={{ background: `${accentColor}15`, border: `1px solid ${accentBorder}` }}>
            {onBack ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {hasActiveAristocracy && aristocracyConfig
              ? <AristocracyName name={profile.name} level={aristocracyLevel} className="text-base font-black" />
              : isVip
                ? <VipName name={profile.name} level={vipLevel} />
                : <h2 className="text-white font-bold text-base truncate">{profile.name}</h2>
            }
            {isVip && <VipBadge size="sm" level={vipLevel} />}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSubPage("wallet")}
              className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5"
              style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)" }}>
              <span className="text-sm">🪙</span>
              <span className="text-yellow-400 text-xs font-bold">{(profile.goldCoins ?? 0).toLocaleString()}</span>
            </button>
            <button onClick={() => setSubPage("edit")}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
              style={{ background: `${accentColor}15`, border: `1px solid ${accentBorder}` }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Side Menu ── */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setShowMenu(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-72 h-full border-l border-white/10 flex flex-col overflow-y-auto"
            style={{ background: "#0d002a", animation: "slideFromLeft 0.3s cubic-bezier(0.32,0.72,0,1) forwards" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10"
              style={{ background: `linear-gradient(135deg, ${accentColor}20, rgba(168,85,247,0.1))` }}>
              <div className="flex items-center gap-3">
                <UserAvatar userId={profile.userId} avatarUrl={profile.avatarUrl} name={profile.name} size={52} showFrame={true} showVipFrame={true} vipLevel={vipLevel} />
                <div className="flex-1 min-w-0">
                  {hasActiveAristocracy && aristocracyConfig
                    ? <AristocracyName name={profile.name} level={aristocracyLevel} className="font-bold" />
                    : isVip ? <VipName name={profile.name} level={vipLevel} /> : <p className="text-white font-bold truncate">{profile.name}</p>}
                  <p className="text-xs font-mono font-bold" style={{ color: hasActiveAristocracy && aristocracyConfig ? aristocracyConfig.color : "#6b7280" }}>
                    <SakiIdDisplay sakiId={profile.sakiId} profile={profile as any} fontSize={11} iconSize={13} showCopy={false} />
                  </p>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    {isVip && <VipBadge size="sm" level={vipLevel} />}
                    {isAgent && <AgentChargeBadgeIf profile={profile} size="xs" />}
                    {isSuperAdmin && <span className="text-[10px] bg-red-500/20 border border-red-500/30 text-red-400 px-1.5 py-0.5 rounded-full font-bold">أدمن</span>}
                    {(profile as any).isCustomerService && <CustomerServiceBadge size="xs" />}
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded-xl px-3 py-2 flex items-center gap-2"
                style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
                <span className="text-lg">🪙</span>
                <div className="flex-1">
                  <p className="text-yellow-400 font-black text-base">{(profile.goldCoins ?? 0).toLocaleString()}</p>
                  <p className="text-gray-600 text-[10px]">عملة ذهبية</p>
                </div>
                <button onClick={() => { setShowMenu(false); setSubPage("wallet"); }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold"
                  style={{ background: "rgba(251,191,36,0.2)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
                  شحن +
                </button>
              </div>
            </div>
            <div className="flex-1 p-4 space-y-1">
              {menuItems.map((item) => (
                <button key={item.label} onClick={item.action}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/5 transition-colors text-right">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: item.bg }}>
                    <span className="text-xl">{item.icon}</span>
                  </div>
                  <span className="font-medium text-sm" style={{ color: item.color }}>{item.label}</span>
                  <svg className="mr-auto opacity-30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-white/5">
              <p className="text-gray-700 text-xs text-center">SAKU v2.0.0</p>
            </div>
          </div>
          <div className="flex-1" />
        </div>
      )}

      {/* Spacer for fixed header */}
      <div className="h-[57px] flex-shrink-0" />

      {/* ── COVER SECTION ── */}
      <div className="relative z-10">
        <div className="w-full relative overflow-hidden" style={{ height: 200 }}>
          {profile.coverUrl ? (
            <img src={profile.coverUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full"
              style={{
                background: isVip && vipConfig
                  ? `linear-gradient(135deg, ${vipConfig.nameColor}40, ${vipConfig.glowColor ?? "#7c3aed"}60, #0d002a)`
                  : "linear-gradient(135deg, #2d0066 0%, #1a0035 50%, #0d002a 100%)",
              }}>
              {isVip && Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="absolute rounded-full animate-pulse"
                  style={{
                    width: 2 + (i % 3), height: 2 + (i % 3),
                    background: accentColor, opacity: 0.4,
                    left: `${8 + i * 9}%`, top: `${15 + (i % 4) * 20}%`,
                    animationDuration: `${1.5 + i * 0.3}s`,
                  }} />
              ))}
            </div>
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(13,0,42,0.9) 100%)" }} />

          {/* Edit cover button */}
          <button
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold active:scale-95"
            style={{ background: "rgba(0,0,0,0.6)", color: "white", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
          >
            {uploadingCover ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <span>🖼️</span>}
            {uploadingCover ? "جارٍ الرفع..." : "تغيير الغلاف"}
          </button>
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }} />
        </div>

        {/* Avatar overlapping cover */}
        <div className="px-5" style={{ marginTop: -52 }}>
          <div className="flex items-end justify-between">
            <div className="relative" style={{ zIndex: 10 }}>
              {isVip ? (
                <div className="relative">
                  <div className="absolute rounded-full animate-pulse opacity-25 pointer-events-none"
                    style={{ inset: -16, background: `radial-gradient(circle, ${accentColor}, transparent)` }} />
                  <div className="rounded-full p-[3px] relative z-10"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}, ${vipConfig?.glowColor ?? "#a855f7"}, ${accentColor})`,
                      boxShadow: `0 0 30px ${accentColor}60, 0 0 60px ${accentColor}30`,
                    }}>
                    <div className="rounded-full overflow-hidden" style={{ width: 96, height: 96 }}>
                      {profile.avatarUrl
                        ? <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                            <span className="text-white font-black text-3xl">{profile.name?.[0]}</span>
                          </div>
                      }
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 z-20"><VipBadge size="sm" level={vipLevel} /></div>
                </div>
              ) : (
                <div style={{ filter: "drop-shadow(0 0 14px rgba(168,85,247,0.5))", overflow: "visible" }}>
                  <UserAvatar userId={profile.userId} avatarUrl={profile.avatarUrl} name={profile.name} size={96} showFrame={true} />
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mb-1">
              {!profile.isActive && (
                <button onClick={handleActivate} disabled={activating}
                  className="px-4 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #f97316, #ef4444)", color: "white", boxShadow: "0 4px 15px rgba(249,115,22,0.4)" }}>
                  {activating ? "..." : "🔓 تفعيل"}
                </button>
              )}
              <button onClick={() => setSubPage("edit")}
                className="px-5 py-2 rounded-2xl text-sm font-bold transition-all active:scale-95"
                style={isVip && vipConfig
                  ? { background: vipConfig.frameGradient, color: "#000", boxShadow: `0 4px 15px ${vipConfig.glowColor}` }
                  : { background: "linear-gradient(135deg, #7c3aed, #ec4899)", color: "white", boxShadow: "0 4px 15px rgba(124,58,237,0.4)" }}>
                ✏️ تعديل
              </button>
            </div>
          </div>

          {/* Name & info */}
          <div className="mt-3">
            <div className="flex items-center gap-2 flex-wrap">
              {hasActiveAristocracy && aristocracyConfig
                ? <h1 className="text-2xl font-black"><AristocracyName name={profile.name} level={aristocracyLevel} /></h1>
                : isVip
                  ? <h1 className="text-2xl font-black"><VipName name={profile.name} level={vipLevel} /></h1>
                  : <h1 className="text-white font-black text-2xl">{profile.name}</h1>
              }
              {isVip && <VipBadge size="sm" level={vipLevel} />}
              {wealthLevel > 0 && <LevelBadge level={wealthLevel} type="wealth" size="md" />}
              {charismaLevel > 0 && <LevelBadge level={charismaLevel} type="charisma" size="md" />}
              {(profile as any).isCustomerService && <CustomerServiceBadge size="sm" />}
              {isSuperAdmin && <SuperAdminBadge size="sm" adminTitle={(profile as any).adminTitle} adminTitleColor1={(profile as any).adminTitleColor1} adminTitleColor2={(profile as any).adminTitleColor2} adminTitleIconUrl={(profile as any).adminTitleIconUrl} adminTitleBg={(profile as any).adminTitleBg} />}
              {isAgent && <AgentChargeBadgeIf profile={profile} size="sm" />}
            </div>
            {profile.isDivorced && <span className="mt-2 inline-flex rounded-full border border-rose-300/30 bg-rose-500/15 px-3 py-1 text-xs font-black text-rose-300">💔 مطلق</span>}
            <p className="text-xs font-mono mt-0.5 font-bold">
              <SakiIdDisplay sakiId={profile.sakiId} profile={profile as any} fontSize={11} iconSize={14} />
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-gray-400 text-xs flex items-center gap-1">{country?.flag} {country?.name}</span>
              <span className="text-gray-500 text-xs">{profile.gender === "male" ? "👨 ذكر" : "👩 أنثى"}</span>
              {profile.isActive ? (
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80" }}>
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />مفعّل
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)", color: "#fb923c" }}>
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full" />غير مفعّل
                </span>
              )}
            </div>
            {profile.bio && (
              <p className="text-gray-300 text-sm mt-2 leading-relaxed line-clamp-3">{profile.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Active Store Items ── */}
      {activeItems && ((activeItems as any).frame || (activeItems as any).entry || (activeItems as any).bubble) && (
        <div className="relative z-10 px-5 pb-3">
          <div className="flex gap-2 flex-wrap">
            {(activeItems as any).frame && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)" }}>
                {(activeItems as any).frame.mediaUrl
                  ? <img src={(activeItems as any).frame.mediaUrl} className="w-5 h-5 rounded object-cover" alt="" />
                  : <span className="text-sm">🖼️</span>}
                <span className="text-purple-300 text-[11px] font-bold">{(activeItems as any).frame.name}</span>
              </div>
            )}
            {(activeItems as any).entry && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                style={{ background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.25)" }}>
                {(activeItems as any).entry.mediaUrl
                  ? <img src={(activeItems as any).entry.mediaUrl} className="w-5 h-5 rounded object-cover" alt="" />
                  : <span className="text-sm">🚪</span>}
                <span className="text-pink-300 text-[11px] font-bold">{(activeItems as any).entry.name}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="relative z-10 px-5 pb-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "منشورات", value: (myMoments?.length ?? 0) + (myReels?.length ?? 0) },
            { label: "متابِعون", value: profile.followersCount ?? 0 },
            { label: "متابَعون", value: profile.followingCount ?? 0 },
            { label: "عملات", value: (profile.goldCoins ?? 0) > 9999 ? `${Math.floor((profile.goldCoins ?? 0) / 1000)}k` : (profile.goldCoins ?? 0) },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-3 text-center"
              style={{
                background: isVip && vipConfig ? `linear-gradient(135deg, ${vipConfig.glowColor}, ${vipConfig.nameColor}10)` : "rgba(255,255,255,0.04)",
                border: `1px solid ${accentBorder}`,
              }}>
              <p className="text-white font-black text-lg">{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
              <p className="text-gray-500 text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CP Banner ── */}
      {hasCp && cpPartner && (
        <div className="relative z-10 px-5 pb-4">
          <MyCpBanner cp={cpPartner} profile={profile} />
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="relative z-30 flex sticky top-[57px] backdrop-blur-xl"
        style={{ background: "rgba(13,0,42,0.92)", borderBottom: `1px solid ${accentBorder}` }}>
        {[
          { id: "posts", label: "منشورات" },
          { id: "reels", label: "ريلز" },
          { id: "badges", label: "أوسمة" },
          ...(hasCp ? [{ id: "cp", label: "CP" }] : []),
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className="flex-1 py-3 text-xs font-bold transition-all relative"
            style={activeTab === tab.id ? { color: accentColor } : { color: "#6b7280" }}>
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                style={{ background: accentColor }} />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="relative z-10 flex-1">
        {activeTab === "posts" && (
          <div className="grid grid-cols-3 gap-0.5">
            {myMoments?.map((m: any) => (
              <div key={m._id} className="aspect-square relative overflow-hidden bg-white/5 group">
                {m.imageUrl
                  ? <img src={m.imageUrl} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-pink-900/50">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="4" /></svg>
                    </div>
                }
              </div>
            ))}
            {(!myMoments || myMoments.length === 0) && (
              <div className="col-span-3 py-20 flex flex-col items-center gap-3 text-center">
                <span className="text-5xl opacity-30">📸</span>
                <p className="text-gray-500 text-sm">لا توجد منشورات بعد</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "reels" && (
          <div className="grid grid-cols-3 gap-0.5">
            {myReels?.map((r: any) => (
              <div key={r._id} className="aspect-[9/16] bg-white/5 relative overflow-hidden group">
                {r.videoUrl
                  ? <video src={r.videoUrl} className="w-full h-full object-cover" muted />
                  : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-pink-900/50">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    </div>
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  <span className="text-white text-[9px] font-bold">{r.views}</span>
                </div>
              </div>
            ))}
            {(!myReels || myReels.length === 0) && (
              <div className="col-span-3 py-20 flex flex-col items-center gap-3 text-center">
                <span className="text-5xl opacity-30">🎬</span>
                <p className="text-gray-500 text-sm">لا توجد ريلز بعد</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "badges" && (
          <div className="p-4">
            <p className="text-gray-500 text-xs mb-4 text-center">الأوسمة والإنجازات المكتسبة</p>
            <div className="grid grid-cols-3 gap-3">
              {badges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} size="md" />
              ))}
            </div>
            <p className="text-gray-700 text-xs mt-6 mb-3 text-center">أوسمة قادمة 🔒</p>
            <div className="grid grid-cols-3 gap-3">
              {[{ label: "بطل الغرف" }, { label: "ماسي" }, { label: "شرف خاص" }].map((b, i) => (
                <div key={i} className="rounded-2xl p-4 flex flex-col items-center gap-2 opacity-25"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                  </div>
                  <span className="text-gray-600 text-xs font-bold">{b.label}</span>
                  <span className="text-gray-700 text-[10px]">قريباً</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "badges" && (
          <BadgesTabContent userId={profile.userId} badges={badges} accentColor={accentColor} />
        )}

        {activeTab === "cp" && hasCp && cpPartner && (
          <MyCpTab cp={cpPartner} profile={profile} />
        )}
      </div>

      <style>{`
        @keyframes badge-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        @keyframes slideFromLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes cp-float { 0% { transform: translateY(0) scale(1); opacity: 0.8; } 100% { transform: translateY(-30px) scale(0.5); opacity: 0; } }
        @keyframes cp-heartbeat { 0%,100% { transform: scale(1); } 50% { transform: scale(1.2); } }
      `}</style>
    </div>
  );
}

function MyCpBanner({ cp, profile }: { cp: any; profile: any }) {
  return (
    <div className="relative rounded-3xl overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1a0020 0%, #2d0035 40%, #1a0020 70%, #2d0010 100%)", border: "1px solid rgba(236,72,153,0.35)", boxShadow: "0 0 25px rgba(236,72,153,0.15)" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {["❤️", "💕", "💗", "💓", "💞"].map((h, i) => (
          <span key={i} className="absolute text-xs select-none"
            style={{ left: `${10 + i * 18}%`, bottom: "5%", animation: `cp-float ${1.5 + i * 0.4}s ease-out infinite`, animationDelay: `${i * 0.4}s` }}>{h}</span>
        ))}
      </div>
      <div className="relative z-10 p-4">
        <p className="text-center text-pink-300 text-xs font-black mb-3">💍 زوجان سحريان 💍</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-pink-500/50 flex-shrink-0">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center"><span className="text-white font-black text-sm">{profile.name?.[0]}</span></div>}
            </div>
            <span className="text-pink-300 text-xs font-bold truncate max-w-[70px]">{profile.name}</span>
          </div>
          <img src="/assets/cp-love-ring.svg" alt="خاتم الحب" className="h-12 w-12 object-contain" style={{ filter: "drop-shadow(0 0 6px rgba(236,72,153,0.8))", animation: "cp-heartbeat 2s ease-in-out infinite" }} />
          <div className="flex items-center gap-2">
            <span className="text-purple-300 text-xs font-bold truncate max-w-[70px] text-right">{cp.partnerName}</span>
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-purple-500/50 flex-shrink-0">
              {cp.partnerAvatarUrl ? <img src={cp.partnerAvatarUrl} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center"><span className="text-white font-black text-sm">{cp.partnerName?.[0]}</span></div>}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between bg-white/5 rounded-xl px-3 py-2 border border-pink-500/15">
          <span className="text-pink-300 text-xs font-bold">💍 {cp.ringName}</span>
          <span className="text-pink-400 text-xs font-black">{daysLeft(cp.expiresAt)}</span>
        </div>
      </div>
    </div>
  );
}

function MyCpTab({ cp, profile }: { cp: any; profile: any }) {
  return (
    <div className="p-5">
      <div className="relative rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a0020 0%, #2d0035 30%, #1a0020 60%, #2d0010 100%)", border: "1px solid rgba(236,72,153,0.4)", boxShadow: "0 0 40px rgba(236,72,153,0.2)" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          {["❤️", "💕", "💗", "💓", "💞", "🩷", "💖"].map((h, i) => (
            <span key={i} className="absolute select-none"
              style={{ left: `${8 + i * 12}%`, bottom: "8%", animation: `cp-float ${1.5 + (i % 4) * 0.5}s ease-out infinite`, animationDelay: `${i * 0.35}s`, fontSize: `${10 + (i % 3) * 4}px` }}>{h}</span>
          ))}
        </div>
        <div className="relative z-10 p-6">
          <p className="text-center text-pink-300 text-base font-black mb-5">💍 زوجان سحريان 💍</p>
          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full p-[2px]" style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}>
                <div className="w-full h-full rounded-full overflow-hidden">
                  {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center"><span className="text-white font-black text-xl">{profile.name?.[0]}</span></div>}
                </div>
              </div>
              <span className="text-pink-300 text-xs font-bold">{profile.name}</span>
            </div>
            <span className="text-4xl" style={{ filter: "drop-shadow(0 0 10px rgba(236,72,153,0.8))", animation: "cp-heartbeat 2s ease-in-out infinite" }}>💗</span>
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full p-[2px]" style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)" }}>
                <div className="w-full h-full rounded-full overflow-hidden">
                  {cp.partnerAvatarUrl ? <img src={cp.partnerAvatarUrl} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center"><span className="text-white font-black text-xl">{cp.partnerName?.[0]}</span></div>}
                </div>
              </div>
              <span className="text-purple-300 text-xs font-bold">{cp.partnerName}</span>
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-pink-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">الخاتم</span>
              <span className="text-pink-300 text-sm font-bold">💍 {cp.ringName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">المدة المتبقية</span>
              <span className="text-pink-400 text-sm font-black">{daysLeft(cp.expiresAt)}</span>
            </div>
            {cp.expiresAt && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs">تاريخ الانتهاء</span>
                <span className="text-gray-300 text-xs">{new Date(cp.expiresAt).toLocaleDateString("ar-SA")}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
