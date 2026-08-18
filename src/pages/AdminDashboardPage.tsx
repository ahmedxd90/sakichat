// @ts-nocheck
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "../lib/toast";
import UserAvatar from "../components/UserAvatar";
import AdminExtraTabs from "./AdminExtraTabs";
import AdminLockModal from "../components/AdminLockModal";
import { PremiumSakiIdTab } from "./AdminBombSakiIdTabs";
import AdminHostAgenciesTab from "./AdminHostAgenciesTab";
import AdminSuperAdminsTab from "./AdminSuperAdminsTab";
import AdminDashboardExtra from "./AdminDashboardExtra";
import AdminSplashAdTab from "./AdminSplashAdTab";
import AdminContentCreatorTab from "./AdminContentCreatorTab";
import AdminDailyCheckinTab from "./AdminDailyCheckinTab";
import AdminSakiWalletTab from "./AdminSakiWalletTab";
import AdminSakiIdStyleTab from "./AdminSakiIdStyleTab";
import AdminCustomBadgesTab from "./AdminCustomBadgesTab";
import SakiIdDisplay from "../components/SakiIdDisplay";
import AdminAppVersionTab from "./AdminAppVersionTab";
import UploadGiftPage from "./UploadGiftPage";
import UploadEmojiPage from "./UploadEmojiPage";
import AdminAristocracyPage from "./AdminAristocracyPage";
import AdminRoleManagementTab from "./AdminRoleManagementTab";

interface AdminDashboardPageProps {
  onBack: () => void;
  onOpenBan: () => void;
}

type Section =
  | "overview" | "users" | "rooms" | "reports" | "coins"
  | "notify" | "agents" | "content" | "ban" | "banners"
  | "sakiid" | "hostAgencies" | "superadmins"
  | "transfers" | "aristocracy"
  | "security" | "support" | "leaderboard" | "store" | "gifts" | "splashAd" | "contentCreator" | "dailyCheckin" | "sakiWallet" | "sakiIdStyle" | "customBadges" | "appVersion" | "uploadGifts" | "uploadEmoji" | "roles";

const MENU_SECTIONS = [
  { title: "الرئيسية", items: [{ id: "overview", label: "لوحة المراقبة", icon: "📊", color: "#6366f1" }] },
        { title: "إدارة المستخدمين", items: [
      { id: "users", label: "المستخدمون", icon: "👥", color: "#3b82f6" },
      { id: "ban", label: "الحظر والأمان", icon: "🚫", color: "#ef4444" },
      { id: "security", label: "سجل الأمان", icon: "🔐", color: "#f97316" },
      { id: "reports", label: "البلاغات", icon: "🚨", color: "#f43f5e" },
      { id: "superadmins", label: "إدارة السوبر أدمن", icon: "🔴", color: "#dc2626" },
      { id: "dailyCheckin", label: "الدخول اليومي", icon: "📅", color: "#16a34a" },
    ],
  },
  {
    title: "إدارة الغرف", items: [
      { id: "rooms", label: "الغرف", icon: "🏠", color: "#8b5cf6" },
      { id: "leaderboard", label: "المتصدرون", icon: "🏆", color: "#fbbf24" },
    ],
  },
  {
    title: "العمليات والتحويلات", items: [
      { id: "transfers", label: "التحويلات", icon: "💸", color: "#06b6d4" },
      { id: "agents", label: "الوكلاء", icon: "⚡", color: "#84cc16" },
      { id: "sakiWallet", label: "محافظ ساكي", icon: "💼", color: "#0f766e" },
    ],
  },
  {
    title: "المحتوى والمتجر", items: [
      { id: "content", label: "المحتوى", icon: "🎬", color: "#ec4899" },
      { id: "store", label: "المتجر", icon: "🛍️", color: "#f59e0b" },
      { id: "gifts", label: "الهدايا", icon: "🎁", color: "#e879f9" },
      { id: "uploadGifts", label: "رفع هدايا", icon: "🎀", color: "#f43f5e" },
      { id: "uploadEmoji", label: "رفع إيموجي", icon: "😄", color: "#facc15" },
      { id: "customBadges", label: "الأوسمة المميزة", icon: "🏅", color: "#be185d" },
      { id: "banners", label: "البنرات", icon: "🖼️", color: "#14b8a6" },
      { id: "splashAd", label: "إعلان الشاشة", icon: "📢", color: "#a855f7" },
    ],
  },
  {
    title: "المجتمع", items: [
      { id: "hostAgencies", label: "وكالات المضيفين", icon: "🏢", color: "#60a5fa" },
      { id: "support", label: "الدعم الفني", icon: "🎧", color: "#34d399" },
      { id: "notify", label: "الإشعارات", icon: "📢", color: "#fb923c" },
    ],
  },
  {
    title: "النظام", items: [
      { id: "appVersion", label: "إدارة التحديثات", icon: "🔄", color: "#a855f7" },
    ],
  },
];

// ── Shared UI ──────────────────────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-green-600/20" />
      <div className="absolute inset-0 rounded-full border-2 border-t-green-600 animate-spin" />
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, icon, color = "#6366f1" }: {
  title: string; subtitle?: string; icon: string; color?: string;
}) {
  return (
      <div className="px-4 pt-5 pb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          {icon}
        </div>
        <div>
          <h2 className="text-[#163b2a] font-black text-base">{title}</h2>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, sub }: {
  label: string; value: string; icon: string; color: string; sub?: string;
}) {
  return (
    <div className="rounded-2xl p-4 relative overflow-hidden bg-white shadow-[0_8px_24px_rgba(22,101,52,.07)]"
      style={{ border: `1px solid rgba(22,163,74,.12)` }}>
      <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-10 -translate-y-4 translate-x-4"
        style={{ background: color }} />
      <div className="text-2xl mb-2">{icon}</div>
      <p className="font-black text-xl" style={{ color }}>{value}</p>
      <p className="text-[#6b8175] text-xs mt-0.5">{label}</p>
      {sub && <p className="text-[10px] mt-1" style={{ color: `${color}99` }}>{sub}</p>}
    </div>
  );
}

function ActionButton({ label, icon, color, onClick, sub }: {
  label: string; icon: string; color: string; onClick: () => void; sub?: string;
}) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white shadow-[0_8px_24px_rgba(22,101,52,.06)] active:scale-95 transition-all"
      style={{ border: "1px solid rgba(22,163,74,.12)" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: `${color}18` }}>
        {icon}
      </div>
      <div className="flex-1 text-right">
        <p className="font-bold text-sm" style={{ color }}>{label}</p>
        {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"
        style={{ opacity: 0.5, transform: "rotate(180deg)", flexShrink: 0 }}>
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function AdminDashboardPage({ onBack, onOpenBan }: AdminDashboardPageProps) {
  const [section, setSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const myFullProfile = useQuery(api.profiles.getMyProfile);
  const currentItem = MENU_SECTIONS.flatMap(s => s.items).find(i => i.id === section);

  const adminPermissions: string[] = (myFullProfile as any)?.adminPermissions ?? [];
  const isRootAdmin = myFullProfile?.isSuperAdmin === true && adminPermissions.length === 0;
  const hasPermission = (id: string) => id === "overview" || id === "appVersion" || isRootAdmin || adminPermissions.includes(id);
  const filteredMenuSections = MENU_SECTIONS
    .map(g => ({ ...g, items: g.items.filter(item => hasPermission(item.id)) }))
    .filter(g => g.items.length > 0);
  const handleNavigate = (s: Section) => { if (hasPermission(s)) setSection(s); };

  return (
    <div className="admin-dashboard-light h-screen flex flex-col overflow-hidden" dir="rtl"
      style={{ background: "linear-gradient(135deg,#f7fffb 0%,#ffffff 48%,#effaf3 100%)", color: "#163b2a" }}>
      <style>{`
        .admin-dashboard-light { --admin-green:#16a34a; --admin-dark:#163b2a; --admin-muted:#6b8175; }
        .admin-dashboard-light .text-white { color:#163b2a !important; }
        .admin-dashboard-light .text-gray-400 { color:#6b8175 !important; }
        .admin-dashboard-light .text-gray-500 { color:#789083 !important; }
        .admin-dashboard-light [style*="rgba(255,255,255,0.04)"],
        .admin-dashboard-light [style*="rgba(255,255,255,0.05)"],
        .admin-dashboard-light [style*="rgba(255,255,255,0.06)"] { background:rgba(22,163,74,.045) !important; border-color:rgba(22,163,74,.14) !important; }
        .admin-dashboard-light input, .admin-dashboard-light textarea, .admin-dashboard-light select { color:#163b2a !important; background:#ffffff !important; border-color:rgba(22,163,74,.2) !important; }
        .admin-dashboard-light button { transition:transform .16s ease, box-shadow .16s ease, background .16s ease; }
        .admin-dashboard-light button:active { transform:scale(.97); }
      `}</style>

      {/* TOP BAR */}
      <div className="flex-shrink-0 z-50 px-4 py-3 flex items-center gap-3"
        style={{ background: "rgba(255,255,255,0.94)", borderBottom: "1px solid rgba(22,163,74,0.16)", backdropFilter: "blur(20px)", boxShadow: "0 4px 20px rgba(22,101,52,.06)" }}>
        <button onClick={() => setSidebarOpen(true)}
          className="w-10 h-10 rounded-2xl flex flex-col items-center justify-center gap-1.5 flex-shrink-0 active:scale-90 transition-transform"
          style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
          <div style={{ background: "#818cf8", width: "18px", height: "2px", borderRadius: "2px" }} />
          <div style={{ background: "#818cf8", width: "14px", height: "2px", borderRadius: "2px" }} />
          <div style={{ background: "#818cf8", width: "18px", height: "2px", borderRadius: "2px" }} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentItem?.icon ?? "📊"}</span>
            <h1 className="text-white font-black text-base truncate">{currentItem?.label ?? "لوحة المراقبة"}</h1>
          </div>
          <p className="text-xs" style={{ color: "#16a34a" }}>
            {isRootAdmin ? "صلاحيات النظام الكاملة" : `${adminPermissions.length} صلاحية مفعّلة`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2" style={{ borderColor: "#6366f1" }}>
              {myFullProfile?.avatarUrl ? (
                <img src={myFullProfile.avatarUrl} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-black"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                  {myFullProfile?.name?.[0] ?? "A"}
                </div>
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
              style={{ background: "#10b981", borderColor: "#060612" }} />
          </div>
          <button onClick={onBack}
            className="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* SIDEBAR */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[200]" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }} />
            <div className="absolute top-0 right-0 h-full w-[290px] flex flex-col overflow-hidden"
            style={{ background: "linear-gradient(180deg,#ffffff 0%,#f6fff8 100%)", borderLeft: "1px solid rgba(22,163,74,0.18)", boxShadow: "-20px 0 60px rgba(22,101,52,0.12)" }}
            onClick={e => e.stopPropagation()}>
            <div className="p-5 flex-shrink-0" style={{ borderBottom: "1px solid rgba(22,163,74,0.15)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border-2" style={{ borderColor: "#6366f1" }}>
                    {myFullProfile?.avatarUrl ? (
                      <img src={myFullProfile.avatarUrl} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-black"
                        style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                        {myFullProfile?.name?.[0] ?? "A"}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2"
                    style={{ background: "#10b981", borderColor: "#060612" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-sm truncate">{myFullProfile?.name ?? "سوبر أدمن"}</p>
                  <p className="text-xs font-mono" style={{ color: "#6366f1" }}>#{myFullProfile?.sakiId}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: isRootAdmin ? "#10b981" : "#f59e0b" }} />
                    <span className="text-[10px]" style={{ color: isRootAdmin ? "#10b981" : "#f59e0b" }}>
                      {isRootAdmin ? "صلاحيات كاملة" : `${adminPermissions.length} صلاحية`}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSidebarOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.06)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="rounded-2xl px-3 py-2.5" style={{ background: "#effaf3", border: "1px solid rgba(22,163,74,.14)" }}>
                <p className="text-xs font-black" style={{ color: "#166534" }}>مركز الإدارة</p>
                <p className="text-[10px] mt-1" style={{ color: "#6b8175" }}>مراقبة وتشغيل خدمات Saku</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4" style={{ background: "#fbfffc" }}>
              {filteredMenuSections.map(group => (
                <div key={group.title}>
                  <p className="text-[10px] font-black uppercase tracking-widest px-2 mb-2"
                    style={{ color: "rgba(99,102,241,0.55)" }}>{group.title}</p>
                  <div className="space-y-0.5">
                    {group.items.map(item => {
                      const isActive = section === item.id;
                      return (
                        <button key={item.id}
                          onClick={() => { setSection(item.id as Section); setSidebarOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all active:scale-95"
                          style={isActive ? { background: `${item.color}18`, border: `1px solid ${item.color}35` } : { background: "transparent", border: "1px solid transparent" }}>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                            style={{ background: isActive ? `${item.color}22` : "rgba(255,255,255,0.05)" }}>
                            {item.icon}
                          </div>
                          <span className="text-sm font-bold flex-1 text-right"
                            style={{ color: isActive ? item.color : "#9ca3af" }}>
                            {item.label}
                          </span>
                          {isActive && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.color }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(99,102,241,0.15)" }}>
              <button onClick={() => { onBack(); setSidebarOpen(false); }}
                className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                <span className="text-sm font-bold" style={{ color: "#ef4444" }}>الخروج من اللوحة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto pb-8">
        {section === "overview" && <OverviewTab onOpenBan={onOpenBan} onNavigate={handleNavigate} hasPermission={hasPermission} />}
        {section === "users" && hasPermission("users") && <UsersTab />}
        {section === "roles" && hasPermission("roles") && <AdminRoleManagementTab />}
        {section === "rooms" && hasPermission("rooms") && <RoomsTab />}
        {section === "reports" && hasPermission("reports") && <ReportsTab />}
        {section === "coins" && hasPermission("coins") && <CoinsTab />}
        {section === "notify" && hasPermission("notify") && <NotifyTab />}
        {section === "agents" && hasPermission("agents") && <AgentsTab />}
        {section === "content" && hasPermission("content") && <AdminExtraTabs.ContentTab />}
        {section === "ban" && hasPermission("ban") && <AdminExtraTabs.BanTab />}
        {section === "banners" && hasPermission("banners") && <AdminExtraTabs.BannersTab />}
        {section === "sakiid" && hasPermission("sakiid") && <PremiumSakiIdTab />}
        {section === "hostAgencies" && hasPermission("hostAgencies") && <AdminHostAgenciesTab />}
        {section === "superadmins" && hasPermission("superadmins") && <AdminSuperAdminsTab />}
        {section === "transfers" && hasPermission("transfers") && <AdminDashboardExtra.TransfersTab />}
        {section === "aristocracy" && hasPermission("aristocracy") && <AdminAristocracyPage onBack={() => setSection("overview")} />}
        {section === "security" && hasPermission("security") && <AdminDashboardExtra.SecurityTab />}
        {section === "support" && hasPermission("support") && <AdminDashboardExtra.SupportTab />}
        {section === "leaderboard" && hasPermission("leaderboard") && <AdminDashboardExtra.LeaderboardTab />}
        {section === "store" && hasPermission("store") && <AdminDashboardExtra.StoreTab />}
        {section === "gifts" && hasPermission("gifts") && <AdminDashboardExtra.GiftsTab />}
        {section === "uploadGifts" && hasPermission("uploadGifts") && <UploadGiftPage onBack={() => setSection("overview")} />}
        {section === "uploadEmoji" && hasPermission("uploadEmoji") && <UploadEmojiPage onBack={() => setSection("overview")} />}
        {section === "splashAd" && hasPermission("splashAd") && <AdminSplashAdTab />}
        {section === "contentCreator" && hasPermission("contentCreator") && <AdminContentCreatorTab />}
        {section === "dailyCheckin" && hasPermission("dailyCheckin") && <AdminDailyCheckinTab />}
        {section === "sakiWallet" && hasPermission("sakiWallet") && <AdminSakiWalletTab />}
        {section === "sakiIdStyle" && hasPermission("sakiIdStyle") && <AdminSakiIdStyleTab />}
        {section === "customBadges" && hasPermission("customBadges") && <AdminCustomBadgesTab />}
        {section === "appVersion" && <AdminAppVersionTab />}
      </div>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────
function OverviewTab({ onOpenBan, onNavigate, hasPermission }: { onOpenBan: () => void; onNavigate: (s: Section) => void; hasPermission: (id: string) => boolean }) {
  const stats = useQuery(api.admin.getDashboardStats);
  if (!stats) return <LoadingSpinner />;
  const statCards = [
    { label: "إجمالي المستخدمين", value: stats.totalUsers.toLocaleString(), icon: "👥", color: "#6366f1", sub: `+${stats.newUsersToday} اليوم` },
    { label: "أعضاء PRO", value: (stats.proUsers ?? 0).toLocaleString(), icon: "✦", color: "#f59e0b", sub: "نشطون" },
    { label: "إجمالي الغرف", value: stats.totalRooms.toLocaleString(), icon: "🏠", color: "#8b5cf6", sub: `${stats.activeRooms} نشطة` },
    { label: "هدايا اليوم", value: stats.giftsToday.toLocaleString(), icon: "🎁", color: "#ec4899", sub: `${stats.totalGifts} إجمالي` },
    { label: "محظورون", value: stats.bannedUsers.toLocaleString(), icon: "🚫", color: "#ef4444", sub: "حظر نشط" },
    { label: "مستخدمون جدد", value: stats.newUsersWeek.toLocaleString(), icon: "🆕", color: "#10b981", sub: "هذا الأسبوع" },
    { label: "غرف نشطة", value: stats.activeRooms.toLocaleString(), icon: "🔴", color: "#f87171", sub: "الآن" },
  ];
  const quickActions = [
    { label: "إدارة المستخدمين", icon: "👥", color: "#6366f1", id: "users", sub: "بحث وتعديل وحظر" },
    { label: "إدارة الغرف", icon: "🏠", color: "#8b5cf6", id: "rooms", sub: "قفل وتمييز وحذف" },
    { label: "إرسال إشعار", icon: "📢", color: "#f59e0b", id: "notify", sub: "إشعار جماعي" },
    { label: "البلاغات", icon: "🚨", color: "#ef4444", id: "reports", sub: "مراجعة البلاغات" },
    { label: "الحظر والأمان", icon: "🚫", color: "#f43f5e", id: "ban", sub: "حظر المستخدمين" },
    { label: "الدعم الفني", icon: "🎧", color: "#34d399", id: "support", sub: "تذاكر الدعم" },
    { label: "سجل الأمان", icon: "🔐", color: "#f97316", id: "security", sub: "مراقبة النشاطات" },
  ];
  return (
    <div className="p-4 space-y-5">
      <SectionHeader title="لوحة المراقبة" subtitle="إحصائيات التطبيق الحية" icon="📊" color="#6366f1" />
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
        style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#10b981" }} />
        <span className="text-xs font-bold" style={{ color: "#10b981" }}>مباشر — يتحدث تلقائياً</span>
        <span className="text-gray-500 text-xs mr-auto">{new Date().toLocaleTimeString("ar")}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {statCards.map(c => <StatCard key={c.label} {...c} />)}
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-widest mb-3 px-1"
          style={{ color: "rgba(99,102,241,0.7)" }}>إجراءات سريعة</p>
        <div className="space-y-2">
          {quickActions.filter(a => hasPermission(a.id)).map(a => (
            <ActionButton key={a.id} label={a.label} icon={a.icon} color={a.color}
              sub={a.sub} onClick={() => onNavigate(a.id as Section)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────
function UsersTab() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pro" | "banned" | "agent">("all");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [changingSakiUser, setChangingSakiUser] = useState<any>(null);
  const users = useQuery(api.admin.listAllUsers, {
    search: search || undefined,
    filterPro: filter === "pro" ? true : undefined,
    filterBanned: filter === "banned" ? true : undefined,
    filterAgent: filter === "agent" ? true : undefined,
    limit: 50,
  });
  const editUser = useMutation(api.adminExtra.adminEditUserProfile);
  const changeSakiId = useMutation(api.adminExtra.adminChangeUserSakiId);
  const banUser = useMutation(api.appBan.banUserFromApp);
  const unbanUser = useMutation(api.appBan.unbanUserFromApp);
  const filtered = users ?? [];

  return (
    <div className="p-4 space-y-3">
      <SectionHeader title="إدارة المستخدمين" subtitle={`${filtered.length} مستخدم`} icon="👥" color="#3b82f6" />
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 بحث بالاسم أو ID..."
        className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(99,102,241,0.2)" }} dir="rtl" />
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {([
          { id: "all", label: "الكل", icon: "👥" },
          { id: "pro", label: "PRO", icon: "✦" },
          { id: "banned", label: "محظور", icon: "🚫" },
          { id: "agent", label: "وكيل", icon: "⚡" },
        ] as const).map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={filter === f.id
              ? { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", boxShadow: "0 4px 15px rgba(99,102,241,0.3)" }
              : { background: "rgba(255,255,255,0.05)", color: "#6b7280" }}>
            <span>{f.icon}</span><span>{f.label}</span>
          </button>
        ))}
      </div>
      {!users ? <LoadingSpinner /> : filtered.length === 0 ? (
        <div className="text-center py-12"><div className="text-4xl mb-3">👤</div><p className="text-gray-500 text-sm">لا يوجد مستخدمون</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u: any) => (
            <div key={u._id} className="rounded-2xl p-3"
              style={{
                background: u.isBanned ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.04)",
                border: u.isBanned ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(99,102,241,0.12)"
              }}>
              <div className="flex items-center gap-3">
                <UserAvatar userId={u.userId as Id<"users">} avatarUrl={u.avatarUrl} name={u.name} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-white font-bold text-sm truncate">{u.name}</p>
                    {u.isPro && (u.proExpiresAt ?? 0) > Date.now() && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black" style={{ background: "rgba(245,158,11,0.2)", color: "#f59e0b" }}>✦ PRO{u.proLevel ?? 1}</span>}
                    {u.isBanned && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>🚫 محظور</span>}
                    {u.isAgent && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(52,211,153,0.2)", color: "#34d399" }}>⚡ وكيل</span>}
                  </div>
                  <p className="text-gray-500 text-xs font-mono mt-0.5">
                    <SakiIdDisplay sakiId={u.sakiId} profile={u} fontSize={11} iconSize={13} showCopy={false} />
                    {" · "}{(u.goldCoins ?? 0).toLocaleString()} 🪙
                  </p>
                  <p className="text-gray-600 text-[10px]">{u.country} · {u.gender === "male" ? "ذكر" : "أنثى"}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => setEditingUser(u)}
                    className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold active:scale-95"
                    style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)" }}>
                    ✏️ تعديل
                  </button>
                  <button onClick={() => setChangingSakiUser(u)}
                    className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold active:scale-95"
                    style={{ background: "rgba(6,182,212,0.15)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.3)" }}>
                    🆔 ID
                  </button>
                  {u.isBanned ? (
                    <button onClick={async () => { try { await unbanUser({ targetUserId: u.userId as Id<"users"> }); toast.success("✅ رُفع الحظر"); } catch (e: any) { toast.error(e.message); } }}
                      className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold active:scale-95"
                      style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
                      🔓 رفع
                    </button>
                  ) : (
                    <button onClick={async () => {
                      const reason = prompt("سبب الحظر:");
                      if (!reason) return;
                      try { await banUser({ targetUserId: u.userId as Id<"users">, reason, banAllDevices: true }); toast.success("🚫 تم الحظر"); }
                      catch (e: any) { toast.error(e.message); }
                    }}
                      className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold active:scale-95"
                      style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                      🚫 حظر
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {editingUser && (
        <UserEditModal user={editingUser} onClose={() => setEditingUser(null)}
          onSave={async (data) => {
            try { await editUser({ targetUserId: editingUser.userId as Id<"users">, ...data }); toast.success("✅ تم التحديث"); setEditingUser(null); }
            catch (e: any) { toast.error(e.message); }
          }} />
      )}
      {changingSakiUser && (
        <ChangeSakiIdModal user={changingSakiUser} onClose={() => setChangingSakiUser(null)}
          onSave={async (newId) => {
            try { await changeSakiId({ targetUserId: changingSakiUser.userId as Id<"users">, newSakiId: newId }); toast.success(`✅ تم تغيير المعرف`); setChangingSakiUser(null); }
            catch (e: any) { toast.error(e.message); }
          }} />
      )}
    </div>
  );
}

// ── Rooms Tab ─────────────────────────────────────────────────────────────
function RoomsTab() {
  const [search, setSearch] = useState("");
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [lockingRoom, setLockingRoom] = useState<any>(null);
  const [lockReason, setLockReason] = useState("");
  const [changingRoomId, setChangingRoomId] = useState<any>(null);
  const [pinningRoom, setPinningRoom] = useState<any>(null);
  const rooms = useQuery(api.admin.adminListRooms, { search: search || undefined, limit: 50 });
  const setFeatured = useMutation(api.admin.adminSetRoomFeatured);
  const setOfficial = useMutation(api.adminExtra.adminSetRoomOfficial);
  const deleteRoom = useMutation(api.admin.adminDeleteRoom);
  const editRoom = useMutation(api.adminExtra.adminEditRoom);
  const lockRoom = useMutation(api.adminLock.adminLockRoom);
  const changeRoomNumId = useMutation(api.adminExtra.adminChangeRoomId);
  const pinRoom = useMutation(api.adminExtra.adminPinRoom);

  return (
    <div className="p-4 space-y-3">
      <SectionHeader title="إدارة الغرف" subtitle={`${rooms?.length ?? 0} غرفة`} icon="🏠" color="#8b5cf6" />
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 بحث باسم الغرفة..."
        className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(139,92,246,0.2)" }} dir="rtl" />
      {!rooms ? <LoadingSpinner /> : rooms.length === 0 ? (
        <div className="text-center py-12"><div className="text-4xl mb-3">🏠</div><p className="text-gray-500 text-sm">لا توجد غرف</p></div>
      ) : (
        <div className="space-y-3">
          {rooms.map((r: any) => (
            <div key={r._id} className="rounded-2xl p-3"
              style={{
                background: r.isAdminLocked ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.04)",
                border: r.isAdminLocked ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(139,92,246,0.12)"
              }}>
              <div className="flex items-center gap-3 mb-3">
                {r.coverUrl ? <img src={r.coverUrl} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" /> : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: "rgba(139,92,246,0.15)" }}>🏠</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-white font-bold text-sm truncate">{r.name}</p>
                    {r.isPinned && r.pinnedOrder === 1 && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#000" }}>🏆 TOP1</span>}
                    {r.isPinned && r.pinnedOrder !== 1 && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.2)", color: "#fbbf24" }}>📌 #{r.pinnedOrder}</span>}
                    {r.isAdminLocked && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>🔒 مقفول</span>}
                    {r.isOfficial && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(251,191,36,0.2)", color: "#fbbf24" }}>🏅 رسمي</span>}
                    {r.isFeatured && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>⭐ مميزة</span>}
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">{r.ownerName} · {r.memberCount ?? 0} عضو</p>
                  <p className="text-gray-600 text-[10px] font-mono">#{r.roomNumericId ?? "—"}</p>
                  {r.isAdminLocked && r.adminLockReason && <p className="text-red-400 text-[10px] mt-0.5 truncate">سبب القفل: {r.adminLockReason}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: "✏️ تعديل", color: "#8b5cf6", onClick: () => setEditingRoom(r) },
                  { label: "🔢 Room ID", color: "#06b6d4", onClick: () => setChangingRoomId(r) },
                  { label: r.isPinned ? "📌 مثبت" : "📌 تثبيت", color: "#fbbf24", onClick: () => setPinningRoom(r) },
                  { label: r.isOfficial ? "🏅 إلغاء" : "🏅 رسمي", color: "#f59e0b", onClick: async () => { try { await setOfficial({ roomId: r._id, isOfficial: !r.isOfficial }); toast.success(r.isOfficial ? "إلغاء الرسمي" : "🏅 رسمي!"); } catch (e: any) { toast.error(e.message); } } },
                  { label: r.isFeatured ? "⭐ إلغاء" : "⭐ تمييز", color: "#fbbf24", onClick: async () => { try { await setFeatured({ roomId: r._id, isFeatured: !r.isFeatured }); toast.success(r.isFeatured ? "إلغاء التمييز" : "⭐ مميزة"); } catch (e: any) { toast.error(e.message); } } },
                  { label: "🗑️ حذف", color: "#ef4444", onClick: async () => { if (!confirm(`حذف "${r.name}"؟`)) return; try { await deleteRoom({ roomId: r._id }); toast.success("تم الحذف"); } catch (e: any) { toast.error(e.message); } } },
                ].map((btn, i) => (
                  <button key={i} onClick={btn.onClick}
                    className="py-2 rounded-xl text-[10px] font-bold active:scale-95 transition-all"
                    style={{ background: `${btn.color}12`, color: btn.color, border: `1px solid ${btn.color}25` }}>
                    {btn.label}
                  </button>
                ))}
              </div>
              <button onClick={() => { setLockingRoom(r); setLockReason(""); }}
                className="w-full mt-2 py-2 rounded-xl text-xs font-bold active:scale-95 flex items-center justify-center gap-2"
                style={r.isAdminLocked
                  ? { background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }
                  : { background: "rgba(255,255,255,0.04)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.08)" }}>
                {r.isAdminLocked ? "🔒 مقفول إدارياً — اضغط للفتح" : "🔓 قفل إداري"}
              </button>
            </div>
          ))}
        </div>
      )}
      {editingRoom && <RoomEditModal room={editingRoom} onClose={() => setEditingRoom(null)} onSave={async (data) => { try { await editRoom({ roomId: editingRoom._id, ...data }); toast.success("✅ تم التحديث"); setEditingRoom(null); } catch (e: any) { toast.error(e.message); } }} />}
      {changingRoomId && <ChangeRoomIdModal room={changingRoomId} onClose={() => setChangingRoomId(null)} onSave={async (newId) => { try { await changeRoomNumId({ roomId: changingRoomId._id, newRoomNumericId: newId }); toast.success("✅ تم تغيير ID"); setChangingRoomId(null); } catch (e: any) { toast.error(e.message); } }} />}
      {pinningRoom && <PinRoomModal room={pinningRoom} onClose={() => setPinningRoom(null)} onPin={async (order) => { try { await pinRoom({ roomId: pinningRoom._id, isPinned: true, pinnedOrder: order }); toast.success("📌 تم التثبيت"); setPinningRoom(null); } catch (e: any) { toast.error(e.message); } }} onUnpin={async () => { try { await pinRoom({ roomId: pinningRoom._id, isPinned: false }); toast.success("تم إلغاء التثبيت"); setPinningRoom(null); } catch (e: any) { toast.error(e.message); } }} />}
      {lockingRoom && <AdminLockModal room={lockingRoom} reason={lockReason} onReasonChange={setLockReason} onLock={async () => { if (!lockReason.trim()) { toast.error("أدخل سبب القفل"); return; } try { await lockRoom({ roomId: lockingRoom._id, isLocked: true, reason: lockReason }); toast.success("🔒 تم القفل"); setLockingRoom(null); } catch (e: any) { toast.error(e.message); } }} onUnlock={async () => { try { await lockRoom({ roomId: lockingRoom._id, isLocked: false }); toast.success("🔓 تم الفتح"); setLockingRoom(null); } catch (e: any) { toast.error(e.message); } }} onClose={() => setLockingRoom(null)} />}
    </div>
  );
}

// ── Reports Tab ───────────────────────────────────────────────────────────
function ReportsTab() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [decisionMsg, setDecisionMsg] = useState("");
  const reports = useQuery(api.admin.adminGetReports, { status: statusFilter || undefined });
  const sendDecision = useMutation(api.adminExtra.adminSendReportDecision);
  return (
    <div className="p-4 space-y-3">
      <SectionHeader title="البلاغات" subtitle={`${reports?.length ?? 0} بلاغ`} icon="🚨" color="#f43f5e" />
      <div className="flex gap-2">
        {[{ id: "pending", label: "جديد", color: "#ef4444" }, { id: "reviewed", label: "قيد المراجعة", color: "#f59e0b" }, { id: "resolved", label: "محلول", color: "#10b981" }].map(s => (
          <button key={s.id} onClick={() => setStatusFilter(s.id)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={statusFilter === s.id ? { background: `${s.color}20`, color: s.color, border: `1px solid ${s.color}40` } : { background: "rgba(255,255,255,0.05)", color: "#6b7280", border: "1px solid transparent" }}>
            {s.label}
          </button>
        ))}
      </div>
      {!reports ? <LoadingSpinner /> : reports.length === 0 ? (
        <div className="text-center py-12"><div className="text-4xl mb-3">✅</div><p className="text-gray-500 text-sm">لا توجد بلاغات</p></div>
      ) : (
        <div className="space-y-2">
          {reports.map((r: any) => (
            <div key={r._id} className="rounded-2xl p-4 space-y-2" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">ضد: <span style={{ color: "#f87171" }}>{r.reportedName}</span></p>
                  <p className="text-gray-500 text-xs">من: {r.reporterName} · #{r.reporterSakiId}</p>
                </div>
                {r.reportedIsBanned && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>محظور</span>}
              </div>
              <p className="text-gray-300 text-xs rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.04)" }}>{r.reason}</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "📩 رد", color: "#8b5cf6", onClick: () => setSelectedReport(r) },
                  { label: "🔍 مراجعة", color: "#f59e0b", onClick: async () => { try { await sendDecision({ reportId: r._id, decision: "reviewed" }); toast.success("تم"); } catch (e: any) { toast.error(e.message); } } },
                  { label: "✅ حل", color: "#10b981", onClick: async () => { try { await sendDecision({ reportId: r._id, decision: "resolved" }); toast.success("تم حل البلاغ"); } catch (e: any) { toast.error(e.message); } } },
                ].map((btn, i) => (
                  <button key={i} onClick={btn.onClick} className="py-2 rounded-xl text-xs font-bold active:scale-95"
                    style={{ background: `${btn.color}12`, color: btn.color, border: `1px solid ${btn.color}25` }}>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedReport && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="w-full max-w-lg rounded-t-3xl p-5 space-y-3" style={{ background: "#0a0a1f", border: "1px solid rgba(99,102,241,0.3)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-black text-base">إرسال رد</h3>
              <button onClick={() => setSelectedReport(null)} className="text-gray-400 text-xl">✕</button>
            </div>
            <textarea value={decisionMsg} onChange={(e) => setDecisionMsg(e.target.value)} placeholder="اكتب رسالة القرار..." rows={4}
              className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(99,102,241,0.2)" }} />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={async () => { try { await sendDecision({ reportId: selectedReport._id, decision: "reviewed", message: decisionMsg || undefined }); toast.success("✅ تم"); setSelectedReport(null); setDecisionMsg(""); } catch (e: any) { toast.error(e.message); } }}
                className="py-3 rounded-2xl font-black text-sm active:scale-95"
                style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
                إرسال كمراجعة
              </button>
              <button onClick={async () => { try { await sendDecision({ reportId: selectedReport._id, decision: "resolved", message: decisionMsg || undefined }); toast.success("✅ تم"); setSelectedReport(null); setDecisionMsg(""); } catch (e: any) { toast.error(e.message); } }}
                className="py-3 rounded-2xl text-white font-black text-sm active:scale-95"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                قرار نهائي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Coins Tab ─────────────────────────────────────────────────────────────
function CoinsTab() {
  const [sakiId, setSakiId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"add" | "deduct" | "vip">("add");
  const [vipLevel, setVipLevel] = useState("1");
  const [vipDays, setVipDays] = useState("30");
  const [loading, setLoading] = useState(false);
  const searchProfile = useQuery(api.profiles.getProfileBySakiId, sakiId.length >= 6 ? { sakiId } : "skip");
  const addCoins = useMutation(api.admin.adminAddCoins);
  const deductCoins = useMutation(api.admin.adminDeductCoins);
  const setVip = useMutation(api.admin.adminSetVip);
  const handleSubmit = async () => {
    if (!searchProfile) return;
    setLoading(true);
    try {
      if (mode === "add") { const res = await addCoins({ targetSakiId: sakiId, amount: Number(amount), note: note || undefined }); toast.success(`✅ تم إضافة ${Number(amount).toLocaleString()} عملة لـ ${res.targetName}`); }
      else if (mode === "deduct") { const res = await deductCoins({ targetSakiId: sakiId, amount: Number(amount), note: note || undefined }); toast.success(`✅ تم خصم ${Number(amount).toLocaleString()} عملة من ${res.targetName}`); }
      else { const res = await setVip({ targetSakiId: sakiId, isVip: true, vipLevel: Number(vipLevel), durationDays: Number(vipDays) }); toast.success(`✅ تم تفعيل VIP${vipLevel} لـ ${res.targetName}`); }
      setSakiId(""); setAmount(""); setNote("");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  return (
    <div className="p-4 space-y-4">
      <SectionHeader title="العملات والـ VIP" subtitle="إدارة رصيد المستخدمين" icon="💰" color="#10b981" />
      <div className="grid grid-cols-3 gap-2">
        {[{ id: "add", label: "إضافة", icon: "➕", color: "#10b981" }, { id: "deduct", label: "خصم", icon: "➖", color: "#ef4444" }, { id: "vip", label: "منح VIP", icon: "👑", color: "#fbbf24" }].map(m => (
          <button key={m.id} onClick={() => setMode(m.id as any)}
            className="py-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-1"
            style={mode === m.id ? { background: `${m.color}20`, color: m.color, border: `1px solid ${m.color}40` } : { background: "rgba(255,255,255,0.05)", color: "#6b7280", border: "1px solid transparent" }}>
            <span className="text-lg">{m.icon}</span><span>{m.label}</span>
          </button>
        ))}
      </div>
      <div>
        <label className="text-gray-400 text-xs font-bold mb-2 block">معرف SAKU</label>
        <input value={sakiId} onChange={(e) => setSakiId(e.target.value)} placeholder="أدخل معرف SAKU..."
          className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(16,185,129,0.2)" }} dir="ltr" />
      </div>
      {searchProfile && (
        <div className="rounded-2xl p-3 flex items-center gap-3" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <UserAvatar userId={searchProfile.userId as Id<"users">} avatarUrl={searchProfile.avatarUrl} name={searchProfile.name} size={44} />
          <div>
            <p className="text-white font-bold text-sm">{searchProfile.name}</p>
            <p className="text-gray-400 text-xs">#{searchProfile.sakiId}</p>
            <p className="text-xs mt-0.5" style={{ color: "#10b981" }}>{(searchProfile.goldCoins ?? 0).toLocaleString()} 🪙 · {(searchProfile.diamonds ?? 0).toLocaleString()} 💎</p>
          </div>
        </div>
      )}
      {mode !== "vip" ? (
        <>
          <div>
            <label className="text-gray-400 text-xs font-bold mb-2 block">المبلغ</label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" type="number"
              className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} dir="ltr" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-bold mb-2 block">ملاحظة (اختياري)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="سبب العملية..."
              className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-400 text-xs font-bold mb-2 block">مستوى VIP (1-12)</label>
            <input value={vipLevel} onChange={(e) => setVipLevel(e.target.value)} type="number" min="1" max="12"
              className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(251,191,36,0.2)" }} dir="ltr" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-bold mb-2 block">المدة (يوم)</label>
            <input value={vipDays} onChange={(e) => setVipDays(e.target.value)} type="number" min="1"
              className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(251,191,36,0.2)" }} dir="ltr" />
          </div>
        </div>
      )}
      <button onClick={handleSubmit} disabled={!searchProfile || loading || (mode !== "vip" && !amount)}
        className="w-full py-4 rounded-2xl text-white font-black text-sm transition-all active:scale-95 disabled:opacity-40"
        style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 20px rgba(99,102,241,0.4)" }}>
        {loading ? <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />جاري التنفيذ...</div>
          : mode === "add" ? "➕ إضافة العملات" : mode === "deduct" ? "➖ خصم العملات" : "👑 منح VIP"}
      </button>
    </div>
  );
}

// ── Notify Tab ────────────────────────────────────────────────────────────
function NotifyTab() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetGroup, setTargetGroup] = useState<"all" | "vip" | "agents" | "active">("all");
  const [loading, setLoading] = useState(false);
  const broadcast = useMutation(api.admin.adminBroadcastMessage);
  const handleSend = async () => {
    if (!title.trim() || !body.trim()) { toast.error("أدخل العنوان والمحتوى"); return; }
    setLoading(true);
    try { const res = await broadcast({ title, body, targetGroup }); toast.success(`✅ تم الإرسال لـ ${res.count} مستخدم`); setTitle(""); setBody(""); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  return (
    <div className="p-4 space-y-4">
      <SectionHeader title="الإشعارات الجماعية" subtitle="إرسال إشعار لمجموعة مستخدمين" icon="📢" color="#fb923c" />
      <div className="grid grid-cols-2 gap-2">
        {[{ id: "all", label: "الجميع", icon: "👥", color: "#6366f1" }, { id: "vip", label: "VIP فقط", icon: "👑", color: "#fbbf24" }, { id: "agents", label: "الوكلاء", icon: "⚡", color: "#10b981" }, { id: "active", label: "النشطون", icon: "✅", color: "#34d399" }].map(g => (
          <button key={g.id} onClick={() => setTargetGroup(g.id as any)}
            className="py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
            style={targetGroup === g.id ? { background: `${g.color}20`, color: g.color, border: `1px solid ${g.color}40` } : { background: "rgba(255,255,255,0.05)", color: "#6b7280", border: "1px solid transparent" }}>
            <span>{g.icon}</span><span>{g.label}</span>
          </button>
        ))}
      </div>
      <div>
        <label className="text-gray-400 text-xs font-bold mb-2 block">عنوان الإشعار</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان الإشعار..."
          className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(251,146,60,0.2)" }} />
      </div>
      <div>
        <label className="text-gray-400 text-xs font-bold mb-2 block">محتوى الإشعار</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="اكتب محتوى الإشعار هنا..." rows={4}
          className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none resize-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(251,146,60,0.2)" }} />
      </div>
      <button onClick={handleSend} disabled={!title.trim() || !body.trim() || loading}
        className="w-full py-4 rounded-2xl text-white font-black text-sm transition-all active:scale-95 disabled:opacity-40"
        style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", boxShadow: "0 4px 20px rgba(249,115,22,0.3)" }}>
        {loading ? <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />جاري الإرسال...</div> : "📢 إرسال الإشعار"}
      </button>
    </div>
  );
}

// ── Agents Tab ────────────────────────────────────────────────────────────
function AgentsTab() {
  const agents = useQuery(api.admin.adminGetAgents);
  const setAgent = useMutation(api.profiles.setAgentRole);
  const [addingSakiId, setAddingSakiId] = useState("");
  const searchProfile = useQuery(api.profiles.getProfileBySakiId, addingSakiId.length >= 6 ? { sakiId: addingSakiId } : "skip");
  return (
    <div className="p-4 space-y-3">
      <SectionHeader title="الوكلاء" subtitle={`${agents?.length ?? 0} وكيل`} icon="⚡" color="#84cc16" />
      <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(132,204,22,0.06)", border: "1px solid rgba(132,204,22,0.15)" }}>
        <p className="text-xs font-bold" style={{ color: "#84cc16" }}>➕ إضافة وكيل جديد</p>
        <input value={addingSakiId} onChange={(e) => setAddingSakiId(e.target.value)} placeholder="معرف SAKU للوكيل الجديد..."
          className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(132,204,22,0.2)" }} dir="ltr" />
        {searchProfile && (
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
            <UserAvatar userId={searchProfile.userId as Id<"users">} avatarUrl={searchProfile.avatarUrl} name={searchProfile.name} size={36} />
            <div className="flex-1"><p className="text-white font-bold text-sm">{searchProfile.name}</p><p className="text-gray-400 text-xs">#{searchProfile.sakiId}</p></div>
            <button onClick={async () => { try { await setAgent({ targetUserId: searchProfile.userId as Id<"users">, isAgent: true }); toast.success("✅ تم تعيين الوكيل"); setAddingSakiId(""); } catch (e: any) { toast.error(e.message); } }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ background: "rgba(132,204,22,0.2)", color: "#84cc16", border: "1px solid rgba(132,204,22,0.3)" }}>
              تعيين ⚡
            </button>
          </div>
        )}
      </div>
      {!agents ? <LoadingSpinner /> : agents.length === 0 ? (
        <div className="text-center py-12"><div className="text-4xl mb-3">⚡</div><p className="text-gray-500 text-sm">لا يوجد وكلاء</p></div>
      ) : (
        <div className="space-y-2">
          {agents.map((a: any) => (
            <div key={a._id} className="rounded-2xl p-3 flex items-center gap-3" style={{ background: "rgba(132,204,22,0.06)", border: "1px solid rgba(132,204,22,0.15)" }}>
              <UserAvatar userId={a.userId as Id<"users">} avatarUrl={a.avatarUrl} name={a.name} size={44} />
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{a.name}</p>
                <p className="text-gray-500 text-xs">#{a.sakiId} · {(a.goldCoins ?? 0).toLocaleString()} 🪙</p>
                <p className="text-xs mt-0.5" style={{ color: "#84cc16" }}>{a.totalCharges ?? 0} عملية · {(a.totalCoinsCharged ?? 0).toLocaleString()} عملة</p>
              </div>
              {!a.isSuperAdmin && (
                <button onClick={async () => { if (!confirm(`إزالة صلاحية الوكيل من ${a.name}؟`)) return; try { await setAgent({ targetUserId: a.userId as Id<"users">, isAgent: false }); toast.success("تم الإزالة"); } catch (e: any) { toast.error(e.message); } }}
                  className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold active:scale-95"
                  style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                  إزالة
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Modals ────────────────────────────────────────────────────────────────
function ChangeSakiIdModal({ user, onClose, onSave }: { user: any; onClose: () => void; onSave: (id: string) => void }) {
  const [newId, setNewId] = useState(user.sakiId ?? "");
  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
      <div className="w-full max-w-lg rounded-t-3xl p-5 space-y-4" style={{ background: "#0a0a1f", border: "1px solid rgba(6,182,212,0.3)" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-black text-base">🆔 تغيير Saki ID</h3>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}>
          <UserAvatar userId={user.userId as Id<"users">} avatarUrl={user.avatarUrl} name={user.name} size={36} />
          <div>
            <p className="text-white font-bold text-sm">{user.name}</p>
            <p className="text-gray-400 text-xs">المعرف الحالي: <span className="text-cyan-400 font-mono">#{user.sakiId}</span></p>
          </div>
        </div>
        <div>
          <label className="text-gray-400 text-xs font-bold mb-2 block">المعرف الجديد</label>
          <input value={newId} onChange={(e) => setNewId(e.target.value)} placeholder="أدخل المعرف الجديد..."
            className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none font-mono"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(6,182,212,0.3)" }} dir="ltr" />
        </div>
        <button onClick={() => { if (newId.trim()) onSave(newId.trim()); }}
          disabled={!newId.trim() || newId.trim() === user.sakiId}
          className="w-full py-3 rounded-2xl text-white font-black text-sm active:scale-95 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#06b6d4,#0891b2)" }}>
          حفظ المعرف الجديد ✅
        </button>
      </div>
    </div>
  );
}

function UserEditModal({ user, onClose, onSave }: { user: any; onClose: () => void; onSave: (d: any) => void }) {
  const [name, setName] = useState(user.name ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [goldCoins, setGoldCoins] = useState(String(user.goldCoins ?? 0));
  const [diamonds, setDiamonds] = useState(String(user.diamonds ?? 0));
  const [isPro, setIsPro] = useState(Boolean(user.isPro && (user.proExpiresAt ?? 0) > Date.now()));
  const [proLevel, setProLevel] = useState(String(user.proLevel ?? 1));
  const [isAgent, setIsAgent] = useState(user.isAgent ?? false);
  const [isActive, setIsActive] = useState(user.isActive ?? false);
  const [hideRoomPresence, setHideRoomPresence] = useState(user.hideRoomPresence ?? false);
  const [isPrivateProfile, setIsPrivateProfile] = useState(user.isPrivateProfile ?? false);
  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
      <div className="w-full max-w-lg rounded-t-3xl p-5 space-y-3 max-h-[85vh] overflow-y-auto"
        style={{ background: "#0a0a1f", border: "1px solid rgba(99,102,241,0.3)" }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-black text-base">تعديل: {user.name}</h3>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        {[{ label: "الاسم", val: name, set: setName }, { label: "النبذة", val: bio, set: setBio }].map((f) => (
          <div key={f.label}>
            <label className="text-gray-400 text-xs font-bold mb-1 block">{f.label}</label>
            <input value={f.val} onChange={(e) => f.set(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-3">
          {[{ label: "العملات الذهبية", val: goldCoins, set: setGoldCoins }, { label: "الماس", val: diamonds, set: setDiamonds }].map((f) => (
            <div key={f.label}>
              <label className="text-gray-400 text-xs font-bold mb-1 block">{f.label}</label>
              <input value={f.val} onChange={(e) => f.set(e.target.value)} type="number"
                className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} dir="ltr" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "PRO مفعّل", val: isPro, set: setIsPro },
            { label: "وكيل شحن", val: isAgent, set: setIsAgent },
            { label: "حساب نشط", val: isActive, set: setIsActive },
            { label: "🕵️ إخفاء الغرفة", val: hideRoomPresence, set: setHideRoomPresence },
            { label: "🔒 ملف خاص", val: isPrivateProfile, set: setIsPrivateProfile },
          ].map((f) => (
            <button key={f.label} onClick={() => f.set(!f.val)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold"
              style={f.val
                ? { background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)" }
                : { background: "rgba(255,255,255,0.05)", color: "#6b7280", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span>{f.label}</span><span>{f.val ? "✅" : "❌"}</span>
            </button>
          ))}
          {isPro && (
            <div>
              <label className="text-gray-400 text-xs font-bold mb-1 block">مستوى PRO (1–5)</label>
              <input value={proLevel} onChange={(e) => setProLevel(e.target.value)} type="number" min="1" max="5"
                className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} dir="ltr" />
            </div>
          )}
        </div>
        <button onClick={() => onSave({ name, bio, goldCoins: Number(goldCoins), diamonds: Number(diamonds), isPro, proLevel: Number(proLevel), isAgent, isActive, hideRoomPresence, isPrivateProfile })}
          className="w-full py-3 rounded-2xl text-white font-black text-sm active:scale-95"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
          حفظ التغييرات ✅
        </button>
      </div>
    </div>
  );
}

function ChangeRoomIdModal({ room, onClose, onSave }: { room: any; onClose: () => void; onSave: (id: string) => void }) {
  const [newId, setNewId] = useState(room.roomNumericId ?? "");
  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
      <div className="w-full max-w-lg rounded-t-3xl p-5 space-y-4" style={{ background: "#0a0a1f", border: "1px solid rgba(6,182,212,0.3)" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-black text-base">🔢 تغيير Room ID</h3>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        <div className="rounded-xl p-3" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}>
          <p className="text-white font-bold text-sm">{room.name}</p>
          <p className="text-gray-400 text-xs">Room ID الحالي: <span className="text-cyan-400 font-mono">#{room.roomNumericId ?? "—"}</span></p>
        </div>
        <div>
          <label className="text-gray-400 text-xs font-bold mb-2 block">Room ID الجديد</label>
          <input value={newId} onChange={(e) => setNewId(e.target.value)} placeholder="أدخل الرقم الجديد..."
            className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none font-mono"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(6,182,212,0.3)" }} dir="ltr" />
        </div>
        <button onClick={() => { if (newId.trim()) onSave(newId.trim()); }} disabled={!newId.trim()}
          className="w-full py-3 rounded-2xl text-white font-black text-sm active:scale-95 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#06b6d4,#0891b2)" }}>
          حفظ Room ID الجديد ✅
        </button>
      </div>
    </div>
  );
}

function PinRoomModal({ room, onClose, onPin, onUnpin }: { room: any; onClose: () => void; onPin: (order: number) => void; onUnpin: () => void }) {
  const [order, setOrder] = useState(String(room.pinnedOrder ?? 1));
  const isPinned = room.isPinned;
  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
      <div className="w-full max-w-lg rounded-t-3xl p-5 space-y-4" style={{ background: "#0a0a1f", border: "1px solid rgba(251,191,36,0.3)" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-black text-base">📌 تثبيت الغرفة</h3>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        <div className="rounded-xl p-3" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
          <p className="text-white font-bold text-sm">{room.name}</p>
          <p className="text-gray-400 text-xs">الحالة: {isPinned ? <span className="text-yellow-400">مثبت في الترتيب #{room.pinnedOrder}</span> : <span className="text-gray-500">غير مثبت</span>}</p>
        </div>
        <div>
          <label className="text-gray-400 text-xs font-bold mb-2 block">ترتيب التثبيت (1 = TOP 1 🏆)</label>
          <input value={order} onChange={(e) => setOrder(e.target.value)} type="number" min="1" max="10"
            className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(251,191,36,0.3)" }} dir="ltr" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => onPin(Number(order) || 1)}
            className="py-3 rounded-2xl font-black text-sm active:scale-95"
            style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#000" }}>
            📌 تثبيت
          </button>
          {isPinned && (
            <button onClick={onUnpin}
              className="py-3 rounded-2xl font-black text-sm active:scale-95"
              style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
              إلغاء التثبيت
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RoomEditModal({ room, onClose, onSave }: { room: any; onClose: () => void; onSave: (d: any) => void }) {
  const [name, setName] = useState(room.name ?? "");
  const [description, setDescription] = useState(room.description ?? "");
  const [maxSeats, setMaxSeats] = useState(String(room.maxSeats ?? 8));
  const [isFeatured, setIsFeatured] = useState(room.isFeatured ?? false);
  const [isOfficial, setIsOfficial] = useState(room.isOfficial ?? false);
  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
      <div className="w-full max-w-lg rounded-t-3xl p-5 space-y-3" style={{ background: "#0a0a1f", border: "1px solid rgba(99,102,241,0.3)" }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-black text-base">تعديل الغرفة</h3>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        {[{ label: "اسم الغرفة", val: name, set: setName }, { label: "الوصف", val: description, set: setDescription }].map((f) => (
          <div key={f.label}>
            <label className="text-gray-400 text-xs font-bold mb-1 block">{f.label}</label>
            <input value={f.val} onChange={(e) => f.set(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />
          </div>
        ))}
        <div>
          <label className="text-gray-400 text-xs font-bold mb-1 block">عدد المقاعد</label>
          <input value={maxSeats} onChange={(e) => setMaxSeats(e.target.value)} type="number" min="2" max="20"
            className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} dir="ltr" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[{ label: "🏅 غرفة رسمية", val: isOfficial, set: setIsOfficial }, { label: "⭐ غرفة مميزة", val: isFeatured, set: setIsFeatured }].map((f) => (
            <button key={f.label} onClick={() => f.set(!f.val)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold"
              style={f.val ? { background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" } : { background: "rgba(255,255,255,0.05)", color: "#6b7280", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span>{f.label}</span><span>{f.val ? "✅" : "❌"}</span>
            </button>
          ))}
        </div>
        <button onClick={() => onSave({ name, description, maxSeats: Number(maxSeats), isFeatured, isOfficial })}
          className="w-full py-3 rounded-2xl text-white font-black text-sm active:scale-95"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
          حفظ التغييرات ✅
        </button>
      </div>
    </div>
  );
}
