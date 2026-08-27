import { useMemo, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "../lib/toast";
import UserAvatar from "../components/UserAvatar";

type RoleKey = "admin" | "bd" | "superadmin";

const ROLE_META: Record<RoleKey, { label: string; title: string; color: string; secondary: string; icon: string; description: string }> = {
  admin: {
    label: "Admin",
    title: "ADMIN",
    color: "#f59e0b",
    secondary: "#f97316",
    icon: "🛡️",
    description: "صلاحيات الإدارة اليومية وإدارة المحتوى والغرف حسب الصلاحيات الممنوحة.",
  },
  bd: {
    label: "BD",
    title: "BD",
    color: "#06b6d4",
    secondary: "#2563eb",
    icon: "💼",
    description: "مسؤول تطوير الأعمال، الحزم الترحيبية، ودعم الشركاء والوكلاء.",
  },
  superadmin: {
    label: "Super Admin",
    title: "SUPER ADMIN",
    color: "#fbbf24",
    secondary: "#a855f7",
    icon: "👑",
    description: "صلاحيات النظام العليا وإدارة الرتب والسياسات الحساسة.",
  },
};

function RoleBadge({ role, compact = false }: { role: RoleKey; compact?: boolean }) {
  const meta = ROLE_META[role];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-black ${compact ? "px-2 py-0.5 text-[9px]" : "px-3 py-1 text-[10px]"}`}
      style={{
        color: "#fff",
        background: `linear-gradient(135deg, ${meta.color}, ${meta.secondary})`,
        boxShadow: `0 4px 14px ${meta.color}35`,
      }}
    >
      <span>{meta.icon}</span>
      {meta.title}
    </span>
  );
}

function roleOf(user: any): RoleKey | null {
  if (user.is_super_admin) return "superadmin";
  if (user.is_bd) return "bd";
  if (user.is_admin) return "admin";
  return null;
}

export default function AdminRoleManagementTab() {
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleKey>("admin");
  const [filter, setFilter] = useState<"all" | RoleKey>("all");
  const [users, setUsers] = useState<any[]>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      let query = supabase.from('profiles').select('*').limit(80);
      if (search.trim()) {
        query = query.or(`name.ilike.%${search.trim()}%,saki_id.ilike.%${search.trim()}%`);
      }
      const { data } = await query;
      setUsers(data || []);
    };
    fetchUsers();
  }, [search]);

  const assignRole = async (args: any) => {};

  const filteredUsers = useMemo(() => {
    const list = users ?? [];
    if (filter === "all") return list;
    return list.filter((u: any) => roleOf(u) === filter);
  }, [users, filter]);

  const handleRole = async (user: any, role: RoleKey, action: "assign" | "remove") => {
    const key = `${user.user_id}-${role}-${action}`;
    setBusyKey(key);
    try {
      await assignRole({ targetUserId: user.user_id, role, action });
      toast.success(action === "assign" ? `✅ تم تعيين ${ROLE_META[role].label}` : `تمت إزالة رتبة ${ROLE_META[role].label}`);
    } catch (error: any) {
      toast.error(error?.message ?? "تعذر تحديث الرتبة");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="p-4 space-y-4" dir="rtl">
      <div
        className="relative overflow-hidden rounded-[28px] p-5"
        style={{
          background: "linear-gradient(135deg, rgba(245,158,11,0.18), rgba(168,85,247,0.14) 48%, rgba(6,182,212,0.12))",
          border: "1px solid rgba(251,191,36,0.28)",
          boxShadow: "0 18px 50px rgba(0,0,0,0.2)",
        }}
      >
        <div className="absolute -top-14 -left-10 w-40 h-40 rounded-full blur-3xl" style={{ background: "rgba(251,191,36,0.18)" }} />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black tracking-[0.25em]" style={{ color: "#fbbf24" }}>SAKI CONTROL CENTER</p>
            <h2 className="text-white font-black text-xl mt-1">إدارة الرتب والألقاب</h2>
            <p className="text-gray-300 text-xs mt-2 leading-6">عيّن Admin أو BD أو Super Admin، وسيظهر اللقب مباشرة في الملف الشخصي والغرفة والدردشة.</p>
          </div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}>👑</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(ROLE_META) as RoleKey[]).map((role) => {
          const meta = ROLE_META[role];
          const active = selectedRole === role;
          return (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className="rounded-2xl p-3 text-right transition-all active:scale-95"
              style={{
                background: active ? `linear-gradient(135deg, ${meta.color}25, ${meta.secondary}18)` : "rgba(255,255,255,0.045)",
                border: active ? `1px solid ${meta.color}70` : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="text-xl">{meta.icon}</div>
              <p className="font-black text-xs mt-2" style={{ color: active ? meta.color : "#d1d5db" }}>{meta.label}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <RoleBadge role={selectedRole} />
          <p className="text-gray-400 text-xs leading-5">{ROLE_META[selectedRole].description}</p>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-500">
          <span>معاينة اللقب:</span>
          <span className="font-black" style={{ color: ROLE_META[selectedRole].color, textShadow: `0 0 12px ${ROLE_META[selectedRole].color}` }}>{ROLE_META[selectedRole].title}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو SAKI ID..."
          className="flex-1 min-w-0 px-4 py-3 rounded-2xl text-white text-sm outline-none placeholder:text-gray-600"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "all" | RoleKey)}
          className="w-32 px-2 rounded-2xl text-white text-xs outline-none"
          style={{ background: "#171729", border: "1px solid rgba(255,255,255,0.10)" }}
        >
          <option value="all">كل المستخدمين</option>
          <option value="admin">Admin</option>
          <option value="bd">BD</option>
          <option value="superadmin">Super Admin</option>
        </select>
      </div>

      {!users ? (
        <div className="flex justify-center py-12"><div className="w-9 h-9 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" /></div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="text-4xl">👥</div>
          <p className="text-gray-500 text-sm mt-3">لا يوجد مستخدمون مطابقون</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map((user: any) => {
            const currentRole = roleOf(user);
            const meta = ROLE_META[selectedRole];
            const assignKey = `${user.user_id}-${selectedRole}-assign`;
            const removeKey = `${user.user_id}-${selectedRole}-remove`;
            return (
              <div key={user.user_id} className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-3">
                  <UserAvatar userId={user.user_id} avatarUrl={user.avatar_url} name={user.name} size={48} showFrame={false} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-black text-sm truncate">{user.name}</p>
                      {currentRole && <RoleBadge role={currentRole} compact />}
                    </div>
                    <p className="text-gray-500 text-[10px] mt-1 font-mono">#{user.saki_id}</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      disabled={busyKey !== null}
                      onClick={() => handleRole(user, selectedRole, "assign")}
                      className="px-3 py-1.5 rounded-xl text-[10px] font-black active:scale-95 disabled:opacity-50"
                      style={{ background: `${meta.color}20`, color: meta.color, border: `1px solid ${meta.color}45` }}
                    >
                      {busyKey === assignKey ? "..." : `تعيين ${meta.label}`}
                    </button>
                    {currentRole === selectedRole && (
                      <button
                        disabled={busyKey !== null}
                        onClick={() => handleRole(user, selectedRole, "remove")}
                        className="px-3 py-1.5 rounded-xl text-[10px] font-black active:scale-95 disabled:opacity-50"
                        style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.28)" }}
                      >
                        {busyKey === removeKey ? "..." : "إزالة"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { ROLE_META, RoleBadge };
