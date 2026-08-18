// @ts-nocheck
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "../lib/toast";
import UserAvatar from "../components/UserAvatar";
import AdminLockModal from "../components/AdminLockModal";
import SakiIdDisplay from "../components/SakiIdDisplay";
import AdminExtraTabs from "./AdminExtraTabs";
import AdminDashboardExtra from "./AdminDashboardExtra";

type CSSection = "users" | "rooms" | "leaderboard" | "banners";

const CS_MENU: { id: CSSection; label: string; icon: string; color: string }[] = [
  { id: "users",       label: "إدارة المستخدمين", icon: "👥", color: "#3b82f6" },
  { id: "rooms",       label: "إدارة الغرف",       icon: "🏠", color: "#8b5cf6" },
  { id: "leaderboard", label: "المتصدرون",          icon: "🏆", color: "#fbbf24" },
  { id: "banners",     label: "البنرات",            icon: "🖼️", color: "#14b8a6" },
];

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 animate-spin" />
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, icon, color = "#3b82f6" }: {
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
          <h2 className="text-white font-black text-base">{title}</h2>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Users Tab (CS version - no ban/unban, read-only + basic edit) ──────────
function CSUsersTab() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "vip" | "banned">("all");
  const users = useQuery(api.admin.listAllUsers, {
    search: search || undefined,
    filterVip: filter === "vip" ? true : undefined,
    filterBanned: filter === "banned" ? true : undefined,
    limit: 50,
  });

  return (
    <div className="p-4 space-y-3" dir="rtl">
      <SectionHeader title="إدارة المستخدمين" subtitle={`${users?.length ?? 0} مستخدم`} icon="👥" color="#3b82f6" />
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 بحث بالاسم أو ID..."
        className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(59,130,246,0.2)" }}
        dir="rtl"
      />
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {([
          { id: "all",    label: "الكل",    icon: "👥" },
          { id: "vip",    label: "VIP",     icon: "👑" },
          { id: "banned", label: "محظور",   icon: "🚫" },
        ] as const).map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={filter === f.id
              ? { background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "white", boxShadow: "0 4px 15px rgba(59,130,246,0.3)" }
              : { background: "rgba(255,255,255,0.05)", color: "#6b7280" }}>
            <span>{f.icon}</span><span>{f.label}</span>
          </button>
        ))}
      </div>

      {!users ? <LoadingSpinner /> : users.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">👤</div>
          <p className="text-gray-500 text-sm">لا يوجد مستخدمون</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u: any) => (
            <div key={u._id} className="rounded-2xl p-3"
              style={{
                background: u.isBanned ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.04)",
                border: u.isBanned ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(59,130,246,0.12)",
              }}>
              <div className="flex items-center gap-3">
                <UserAvatar userId={u.userId as Id<"users">} avatarUrl={u.avatarUrl} name={u.name} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-white font-bold text-sm truncate">{u.name}</p>
                    {u.isSuperAdmin && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black" style={{ background: "rgba(168,85,247,0.2)", color: "#a855f7" }}>🔴 أدمن</span>}
                    {u.isVip && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(251,191,36,0.2)", color: "#fbbf24" }}>👑 VIP{u.vipLevel}</span>}
                    {u.isBanned && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>🚫 محظور</span>}
                    {u.isAgent && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(52,211,153,0.2)", color: "#34d399" }}>⚡ وكيل</span>}
                    {u.isCustomerService && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(59,130,246,0.2)", color: "#3b82f6" }}>🎧 CS</span>}
                  </div>
                  <p className="text-gray-500 text-xs font-mono mt-0.5">
                    <SakiIdDisplay sakiId={u.sakiId} profile={u} fontSize={11} iconSize={13} showCopy={false} />
                    {" · "}{(u.goldCoins ?? 0).toLocaleString()} 🪙
                  </p>
                  <p className="text-gray-600 text-[10px]">{u.country} · {u.gender === "male" ? "ذكر" : "أنثى"}</p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <div className="text-[10px] px-2 py-1 rounded-lg font-bold"
                    style={{ background: "rgba(255,255,255,0.05)", color: "#9ca3af" }}>
                    {u.isActive ? "🟢 نشط" : "⚫ غير نشط"}
                  </div>
                  <div className="text-[10px] px-2 py-1 rounded-lg font-bold"
                    style={{ background: "rgba(255,255,255,0.05)", color: "#9ca3af" }}>
                    💎 {(u.diamonds ?? 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Rooms Tab (CS version) ─────────────────────────────────────────────────
function CSRoomsTab() {
  const [search, setSearch] = useState("");
  const [lockingRoom, setLockingRoom] = useState<any>(null);
  const [lockReason, setLockReason] = useState("");
  const rooms = useQuery(api.admin.adminListRooms, { search: search || undefined, limit: 50 });
  const setFeatured = useMutation(api.admin.adminSetRoomFeatured);
  const setOfficial = useMutation(api.adminExtra.adminSetRoomOfficial);
  const lockRoom = useMutation(api.adminLock.adminLockRoom);

  return (
    <div className="p-4 space-y-3" dir="rtl">
      <SectionHeader title="إدارة الغرف" subtitle={`${rooms?.length ?? 0} غرفة`} icon="🏠" color="#8b5cf6" />
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 بحث باسم الغرفة..."
        className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}
        dir="rtl"
      />
      {!rooms ? <LoadingSpinner /> : rooms.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🏠</div>
          <p className="text-gray-500 text-sm">لا توجد غرف</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map((r: any) => (
            <div key={r._id} className="rounded-2xl p-3"
              style={{
                background: r.isAdminLocked ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.04)",
                border: r.isAdminLocked ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(139,92,246,0.12)",
              }}>
              <div className="flex items-center gap-3 mb-3">
                {r.coverUrl ? (
                  <img src={r.coverUrl} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: "rgba(139,92,246,0.15)" }}>🏠</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-white font-bold text-sm truncate">{r.name}</p>
                    {r.isAdminLocked && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>🔒 مقفول</span>}
                    {r.isOfficial && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(251,191,36,0.2)", color: "#fbbf24" }}>🏅 رسمي</span>}
                    {r.isFeatured && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>⭐ مميزة</span>}
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">{r.ownerName} · {r.memberCount ?? 0} عضو</p>
                  <p className="text-gray-600 text-[10px] font-mono">#{r.roomNumericId ?? "—"}</p>
                  {r.isAdminLocked && r.adminLockReason && (
                    <p className="text-red-400 text-[10px] mt-0.5 truncate">سبب القفل: {r.adminLockReason}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  {
                    label: r.isOfficial ? "🏅 إلغاء رسمي" : "🏅 رسمي",
                    color: "#f59e0b",
                    onClick: async () => {
                      try { await setOfficial({ roomId: r._id, isOfficial: !r.isOfficial }); toast.success(r.isOfficial ? "إلغاء الرسمي" : "🏅 رسمي!"); }
                      catch (e: any) { toast.error(e.message); }
                    },
                  },
                  {
                    label: r.isFeatured ? "⭐ إلغاء تمييز" : "⭐ تمييز",
                    color: "#fbbf24",
                    onClick: async () => {
                      try { await setFeatured({ roomId: r._id, isFeatured: !r.isFeatured }); toast.success(r.isFeatured ? "إلغاء التمييز" : "⭐ مميزة"); }
                      catch (e: any) { toast.error(e.message); }
                    },
                  },
                  {
                    label: r.isAdminLocked ? "🔒 مقفول" : "🔓 قفل",
                    color: r.isAdminLocked ? "#ef4444" : "#9ca3af",
                    onClick: () => { setLockingRoom(r); setLockReason(""); },
                  },
                ].map((btn, i) => (
                  <button key={i} onClick={btn.onClick}
                    className="py-2 rounded-xl text-[10px] font-bold active:scale-95 transition-all"
                    style={{ background: `${btn.color}12`, color: btn.color, border: `1px solid ${btn.color}25` }}>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {lockingRoom && (
        <AdminLockModal
          room={lockingRoom}
          reason={lockReason}
          onReasonChange={setLockReason}
          onLock={async () => {
            if (!lockReason.trim()) { toast.error("أدخل سبب القفل"); return; }
            try { await lockRoom({ roomId: lockingRoom._id, isLocked: true, reason: lockReason }); toast.success("🔒 تم القفل"); setLockingRoom(null); }
            catch (e: any) { toast.error(e.message); }
          }}
          onUnlock={async () => {
            try { await lockRoom({ roomId: lockingRoom._id, isLocked: false }); toast.success("🔓 تم الفتح"); setLockingRoom(null); }
            catch (e: any) { toast.error(e.message); }
          }}
          onClose={() => setLockingRoom(null)}
        />
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function CustomerServiceDashboard({ onBack }: { onBack: () => void }) {
  const [section, setSection] = useState<CSSection>("users");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const myProfile = useQuery(api.profiles.getMyProfile);
  const currentItem = CS_MENU.find(i => i.id === section);

  return (
    <div className="h-screen flex flex-col overflow-hidden" dir="rtl"
      style={{ background: "linear-gradient(135deg,#060612 0%,#0d0d1f 50%,#060612 100%)" }}>

      {/* TOP BAR */}
      <div className="flex-shrink-0 z-50 px-4 py-3 flex items-center gap-3"
        style={{ background: "rgba(6,6,18,0.97)", borderBottom: "1px solid rgba(59,130,246,0.2)", backdropFilter: "blur(20px)" }}>
        <button onClick={() => setSidebarOpen(true)}
          className="w-10 h-10 rounded-2xl flex flex-col items-center justify-center gap-1.5 flex-shrink-0 active:scale-90 transition-transform"
          style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)" }}>
          <div style={{ background: "#60a5fa", width: "18px", height: "2px", borderRadius: "2px" }} />
          <div style={{ background: "#60a5fa", width: "14px", height: "2px", borderRadius: "2px" }} />
          <div style={{ background: "#60a5fa", width: "18px", height: "2px", borderRadius: "2px" }} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentItem?.icon ?? "🎧"}</span>
            <h1 className="text-white font-black text-base truncate">{currentItem?.label ?? "لوحة خدمة العملاء"}</h1>
          </div>
          <p className="text-xs" style={{ color: "#3b82f6" }}>🎧 لوحة تحكم خدمة العملاء</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2" style={{ borderColor: "#3b82f6" }}>
              {myProfile?.avatarUrl ? (
                <img src={myProfile.avatarUrl} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-black"
                  style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)" }}>
                  {myProfile?.name?.[0] ?? "CS"}
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
          <div className="absolute top-0 right-0 h-full w-[270px] flex flex-col overflow-hidden"
            style={{ background: "linear-gradient(180deg,#0a0a1f 0%,#060612 100%)", borderLeft: "1px solid rgba(59,130,246,0.25)", boxShadow: "-20px 0 60px rgba(59,130,246,0.12)" }}
            onClick={e => e.stopPropagation()}>

            {/* Sidebar Header */}
            <div className="p-5 flex-shrink-0" style={{ borderBottom: "1px solid rgba(59,130,246,0.15)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border-2" style={{ borderColor: "#3b82f6" }}>
                    {myProfile?.avatarUrl ? (
                      <img src={myProfile.avatarUrl} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-black"
                        style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)" }}>
                        {myProfile?.name?.[0] ?? "CS"}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2"
                    style={{ background: "#10b981", borderColor: "#060612" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-sm truncate">{myProfile?.name ?? "خدمة العملاء"}</p>
                  <p className="text-xs font-mono" style={{ color: "#3b82f6" }}>#{myProfile?.sakiId}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} />
                    <span className="text-[10px]" style={{ color: "#10b981" }}>متصل الآن</span>
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

              {/* CS Badge */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)" }}>
                <span className="text-base">🎧</span>
                <div>
                  <p className="text-xs font-black" style={{ color: "#60a5fa" }}>خدمة العملاء</p>
                  <p className="text-[10px]" style={{ color: "#6b7280" }}>صلاحيات محدودة</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {CS_MENU.map(item => {
                const isActive = section === item.id;
                return (
                  <button key={item.id}
                    onClick={() => { setSection(item.id); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all active:scale-95"
                    style={isActive
                      ? { background: `${item.color}18`, border: `1px solid ${item.color}35` }
                      : { background: "transparent", border: "1px solid transparent" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
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

            {/* Exit Button */}
            <div className="p-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(59,130,246,0.15)" }}>
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

      {/* Bottom Tab Bar */}
      <div className="flex-shrink-0 flex gap-1 px-3 py-2"
        style={{ background: "rgba(6,6,18,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {CS_MENU.map(item => {
          const isActive = section === item.id;
          return (
            <button key={item.id} onClick={() => setSection(item.id)}
              className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all active:scale-95"
              style={isActive
                ? { background: `${item.color}15`, border: `1px solid ${item.color}30` }
                : { background: "transparent", border: "1px solid transparent" }}>
              <span className="text-lg">{item.icon}</span>
              <span className="text-[9px] font-bold"
                style={{ color: isActive ? item.color : "#6b7280" }}>
                {item.label.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto pb-8">
        {section === "users"       && <CSUsersTab />}
        {section === "rooms"       && <CSRoomsTab />}
        {section === "leaderboard" && <AdminDashboardExtra.LeaderboardTab />}
        {section === "banners"     && <AdminExtraTabs.BannersTab />}
      </div>
    </div>
  );
}
