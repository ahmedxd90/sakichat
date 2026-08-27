// @ts-nocheck
import { supabase } from "../lib/supabaseClient";
import { useState, useEffect } from "react";
import { toast } from "../lib/toast";
import UserAvatar from "../components/UserAvatar";
import AdminFamiliesTab from "./AdminFamiliesTab";

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-t-indigo-500 animate-spin" />
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
          <h2 className="text-white font-black text-base">{title}</h2>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Families Tab ──────────────────────────────────────────────────────────
function FamiliesTab() {
  return (
    <div className="space-y-0">
      <SectionHeader title="العائلات" subtitle="إدارة طلبات إنشاء العائلات" icon="👨‍👩‍👧" color="#f472b6" />
      <AdminFamiliesTab />
    </div>
  );
}

// ── Transfers Tab ─────────────────────────────────────────────────────────
function TransfersTab() {
  const [transfers, setTransfers] = useState<any[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('transfers').select('*').limit(50);
      setTransfers(data || []);
    };
    fetchData();
  }, []);
  return (
    <div className="p-4 space-y-3">
      <SectionHeader title="التحويلات" subtitle="سجل التحويلات المالية" icon="💸" color="#06b6d4" />
      {!transfers ? <LoadingSpinner /> : (transfers as any[]).length === 0 ? (
        <div className="text-center py-12"><div className="text-4xl mb-3">💸</div><p className="text-gray-500 text-sm">لا توجد تحويلات</p></div>
      ) : (
        <div className="space-y-2">
          {(transfers as any[]).slice(0, 50).map((t: any) => (
            <div key={t.id} className="rounded-2xl p-3"
              style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">{t.agentName ?? "—"}</p>
                  <p className="text-gray-500 text-xs">{new Date(t.createdAt).toLocaleString("ar")}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm" style={{ color: "#06b6d4" }}>{(t.diamonds ?? 0).toLocaleString()} 💎</p>
                  <p className="text-[10px] text-gray-500">{(t.coinsReceived ?? 0).toLocaleString()} 🪙</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── VIP Management Tab ────────────────────────────────────────────────────
function VipManagementTab() {
  const [sakiId, setSakiId] = useState("");
  const [vipLevel, setVipLevel] = useState("1");
  const [vipDays, setVipDays] = useState("30");
  const [loading, setLoading] = useState(false);
  const [searchProfile, setSearchProfile] = useState<any>(null);

  useEffect(() => {
    if (sakiId.length >= 6) {
      const fetchData = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('saki_id', sakiId).maybeSingle();
        setSearchProfile(data);
      };
      fetchData();
    } else {
      setSearchProfile(null);
    }
  }, [sakiId]);

  const setVip = async (args: any) => ({ targetName: "User" });
  return (
    <div className="p-4 space-y-4">
      <SectionHeader title="إدارة VIP" subtitle="منح وإلغاء اشتراكات VIP" icon="👑" color="#fbbf24" />
      <div className="rounded-2xl p-4 space-y-3"
        style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)" }}>
        <p className="text-xs font-bold" style={{ color: "#fbbf24" }}>منح VIP لمستخدم</p>
        <input value={sakiId} onChange={(e) => setSakiId(e.target.value)} placeholder="معرف SAKU..."
          className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(251,191,36,0.2)" }} dir="ltr" />
        {searchProfile && (
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
            <UserAvatar userId={searchProfile.user_id as string} avatarUrl={searchProfile.avatarUrl} name={searchProfile.name} size={40} />
            <div className="flex-1">
              <p className="text-white font-bold text-sm">{searchProfile.name}</p>
              <p className="text-xs" style={{ color: searchProfile.isVip ? "#fbbf24" : "#6b7280" }}>
                {searchProfile.isVip ? `👑 VIP${searchProfile.vipLevel} نشط` : "بدون VIP"}
              </p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-400 text-xs font-bold mb-1 block">المستوى (1-12)</label>
            <input value={vipLevel} onChange={(e) => setVipLevel(e.target.value)} type="number" min="1" max="12"
              className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(251,191,36,0.2)" }} dir="ltr" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-bold mb-1 block">المدة (يوم)</label>
            <input value={vipDays} onChange={(e) => setVipDays(e.target.value)} type="number" min="1"
              className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(251,191,36,0.2)" }} dir="ltr" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={async () => {
            if (!searchProfile) return;
            setLoading(true);
            try { const res = await setVip({ targetSakiId: sakiId, isVip: true, vipLevel: Number(vipLevel), durationDays: Number(vipDays) }); toast.success(`✅ تم منح VIP${vipLevel} لـ ${res.targetName}`); setSakiId(""); }
            catch (e: any) { toast.error(e.message); }
            finally { setLoading(false); }
          }} disabled={!searchProfile || loading}
            className="py-3 rounded-2xl font-black text-sm active:scale-95 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)", color: "#000" }}>
            👑 منح VIP
          </button>
          <button onClick={async () => {
            if (!searchProfile) return;
            setLoading(true);
            try { const res = await setVip({ targetSakiId: sakiId, isVip: false, vipLevel: 0, durationDays: 0 }); toast.success(`✅ تم إلغاء VIP من ${res.targetName}`); setSakiId(""); }
            catch (e: any) { toast.error(e.message); }
            finally { setLoading(false); }
          }} disabled={!searchProfile || loading}
            className="py-3 rounded-2xl font-black text-sm active:scale-95 disabled:opacity-40"
            style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
            إلغاء VIP
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Games Tab ─────────────────────────────────────────────────────────────
function GamesTab() {
  const games = [
    { name: "روليت", icon: "🎰", color: "#ef4444", desc: "لعبة الروليت في الغرف" },
    { name: "فاكهة الحفلة", icon: "🍎", color: "#10b981", desc: "لعبة الفاكهة الجماعية" },
    { name: "القط الجشع", icon: "🐱", color: "#f59e0b", desc: "لعبة القط الجشع" },
    { name: "Lucky 77", icon: "🎯", color: "#6366f1", desc: "لعبة الأرقام المحظوظة" },
    { name: "عجلة الحظ", icon: "🎡", color: "#8b5cf6", desc: "عجلة الحظ الدوارة" },
    { name: "السلوتس", icon: "🎰", color: "#ec4899", desc: "ماكينة السلوتس" },
    { name: "المليونير", icon: "💰", color: "#fbbf24", desc: "من سيربح المليون" },
    { name: "معركة البطاقات", icon: "🃏", color: "#06b6d4", desc: "معركة البطاقات" },
  ];
  return (
    <div className="p-4 space-y-3">
      <SectionHeader title="الألعاب" subtitle="إحصائيات وإدارة الألعاب" icon="🎮" color="#22d3ee" />
      <div className="grid grid-cols-2 gap-3">
        {games.map(g => (
          <div key={g.name} className="rounded-2xl p-4"
            style={{ background: `${g.color}0d`, border: `1px solid ${g.color}20` }}>
            <div className="text-2xl mb-2">{g.icon}</div>
            <p className="font-bold text-sm" style={{ color: g.color }}>{g.name}</p>
            <p className="text-gray-500 text-[10px] mt-0.5">{g.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Security Tab ──────────────────────────────────────────────────────────
function SecurityTab() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('security_logs').select('*').limit(50);
      setLogs(data || []);
    };
    fetchData();
  }, []);
  return (
    <div className="p-4 space-y-3">
      <SectionHeader title="سجل الأمان" subtitle="مراقبة النشاطات المشبوهة" icon="🔐" color="#f97316" />
      {!logs ? <LoadingSpinner /> : (logs as any[]).length === 0 ? (
        <div className="text-center py-12"><div className="text-4xl mb-3">✅</div><p className="text-gray-500 text-sm">لا توجد سجلات</p></div>
      ) : (
        <div className="space-y-2">
          {(logs as any[]).map((log: any) => {
            const sc = log.severity === "critical" ? "#ef4444" : log.severity === "high" ? "#f97316" : log.severity === "medium" ? "#fbbf24" : "#10b981";
            const sl = log.severity === "critical" ? "حرج" : log.severity === "high" ? "عالي" : log.severity === "medium" ? "متوسط" : "منخفض";
            return (
              <div key={log.id} className="rounded-2xl p-3"
                style={{ background: `${sc}08`, border: `1px solid ${sc}20` }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-white font-bold text-xs">{log.eventType}</p>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                    style={{ background: `${sc}20`, color: sc }}>{sl}</span>
                </div>
                <p className="text-gray-400 text-xs">{log.userName ?? "مجهول"}</p>
                {log.details && <p className="text-gray-500 text-[10px] mt-1 truncate">{log.details}</p>}
                <p className="text-gray-600 text-[10px] mt-1">{new Date(log.createdAt).toLocaleString("ar")}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Support Tab ───────────────────────────────────────────────────────────
function SupportTab() {
  const [tickets, setTickets] = useState<any[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('support_tickets').select('*').limit(50);
      setTickets(data || []);
    };
    fetchData();
  }, []);
  const closeTicket = async (args: any) => {};
  return (
    <div className="p-4 space-y-3">
      <SectionHeader title="الدعم الفني" subtitle={`${(tickets as any[])?.length ?? 0} تذكرة`} icon="🎧" color="#34d399" />
      {!tickets ? <LoadingSpinner /> : (tickets as any[]).length === 0 ? (
        <div className="text-center py-12"><div className="text-4xl mb-3">🎧</div><p className="text-gray-500 text-sm">لا توجد تذاكر</p></div>
      ) : (
        <div className="space-y-2">
          {(tickets as any[]).map((t: any) => {
            const sc = t.status === "open" ? "#ef4444" : t.status === "in_progress" ? "#f59e0b" : "#10b981";
            const sl = t.status === "open" ? "مفتوح" : t.status === "in_progress" ? "قيد المعالجة" : "مغلق";
            return (
              <div key={t.id} className="rounded-2xl p-3"
                style={{ background: `${sc}08`, border: `1px solid ${sc}20` }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-white font-bold text-sm truncate flex-1">{t.subject}</p>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-bold mr-2 flex-shrink-0"
                    style={{ background: `${sc}20`, color: sc }}>{sl}</span>
                </div>
                <p className="text-gray-400 text-xs">{t.userName ?? "مجهول"} · #{t.userSakiId}</p>
                {t.lastMessage && <p className="text-gray-500 text-[10px] mt-1 truncate">{t.lastMessage}</p>}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-gray-600 text-[10px]">{new Date(t.createdAt).toLocaleString("ar")}</p>
                  {t.status !== "closed" && (
                    <button onClick={async () => {
                      try { await closeTicket({ ticketId: t.id }); toast.success("تم إغلاق التذكرة"); }
                      catch (e: any) { toast.error(e.message); }
                    }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                      style={{ background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)" }}>
                      إغلاق ✅
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Leaderboard Tab ───────────────────────────────────────────────────────
function LeaderboardTab() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [wealth, setWealth] = useState<any[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('profiles').select('*').order('gold_coins', { ascending: false }).limit(20);
      setWealth(data || []);
    };
    fetchData();
  }, [period]);
  return (
    <div className="p-4 space-y-3">
      <SectionHeader title="المتصدرون" subtitle="أكثر المستخدمين إنفاقاً" icon="🏆" color="#fbbf24" />
      <div className="flex gap-2">
        {[{ id: "daily", label: "اليوم" }, { id: "weekly", label: "الأسبوع" }, { id: "monthly", label: "الشهر" }].map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id as any)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={period === p.id
              ? { background: "rgba(251,191,36,0.2)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.4)" }
              : { background: "rgba(255,255,255,0.05)", color: "#6b7280", border: "1px solid transparent" }}>
            {p.label}
          </button>
        ))}
      </div>
      {!wealth ? <LoadingSpinner /> : (wealth as any[]).length === 0 ? (
        <div className="text-center py-12"><div className="text-4xl mb-3">🏆</div><p className="text-gray-500 text-sm">لا توجد بيانات</p></div>
      ) : (
        <div className="space-y-2">
          {(wealth as any[]).slice(0, 20).map((u: any, i: number) => (
            <div key={u.userId} className="rounded-2xl p-3 flex items-center gap-3"
              style={{
                background: i < 3 ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.04)",
                border: i < 3 ? "1px solid rgba(251,191,36,0.2)" : "1px solid rgba(255,255,255,0.08)"
              }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{
                  background: i === 0 ? "linear-gradient(135deg,#fbbf24,#f59e0b)" : i === 1 ? "rgba(192,192,192,0.3)" : i === 2 ? "rgba(205,127,50,0.3)" : "rgba(255,255,255,0.08)",
                  color: i < 3 ? "#000" : "#9ca3af"
                }}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
              </div>
              <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-black"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                    {u.name?.[0] ?? "؟"}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{u.name}</p>
                <p className="text-gray-500 text-xs font-mono">#{u.sakiId}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-sm" style={{ color: "#fbbf24" }}>{(u.total ?? 0).toLocaleString()}</p>
                <p className="text-gray-500 text-[10px]">🪙 عملة</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Store Tab ─────────────────────────────────────────────────────────────
function StoreTab() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('store_items').select('*');
      setItems(data || []);
    };
    fetchData();
  }, []);
  const toggleActive = async (args: any) => {};
  const deleteItem = async (args: any) => {};
  return (
    <div className="p-4 space-y-3">
      <SectionHeader title="المتجر" subtitle={`${items?.length ?? 0} عنصر`} icon="🛍️" color="#f59e0b" />
      {!items ? <LoadingSpinner /> : (items as any[]).length === 0 ? (
        <div className="text-center py-12"><div className="text-4xl mb-3">🛍️</div><p className="text-gray-500 text-sm">لا توجد عناصر</p></div>
      ) : (
        <div className="space-y-2">
          {(items as any[]).map((item: any) => (
            <div key={item.id} className="rounded-2xl p-3 flex items-center gap-3"
              style={{
                background: item.isActive ? "rgba(245,158,11,0.06)" : "rgba(255,255,255,0.03)",
                border: item.isActive ? "1px solid rgba(245,158,11,0.2)" : "1px solid rgba(255,255,255,0.06)"
              }}>
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.06)" }}>
                {item.mediaUrl ? (
                  item.mediaType === "mp4" || item.mediaUrl?.includes(".mp4") ? (
                    <video src={item.mediaUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                  ) : (
                    <img src={item.mediaUrl} className="w-full h-full object-cover" />
                  )
                ) : <div className="w-full h-full flex items-center justify-center text-xl">🛍️</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{item.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>
                    {item.type === "frame" ? "إطار" : item.type === "entry" ? "دخولية" : item.type === "bubble" ? "فقاعة" : "CP"}
                  </span>
                  <p className="text-xs" style={{ color: "#fbbf24" }}>{(item.price ?? 0).toLocaleString()} 🪙</p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={async () => {
                  try { await toggleActive({ itemId: item.id, isActive: !item.isActive }); toast.success(item.isActive ? "تم إخفاء العنصر" : "✅ تم تفعيل العنصر"); }
                  catch (e: any) { toast.error(e.message); }
                }}
                  className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold active:scale-95"
                  style={item.isActive
                    ? { background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }
                    : { background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
                  {item.isActive ? "إخفاء" : "تفعيل"}
                </button>
                <button onClick={async () => {
                  if (!confirm(`حذف "${item.name}"؟`)) return;
                  try { await deleteItem({ itemId: item.id }); toast.success("تم الحذف"); }
                  catch (e: any) { toast.error(e.message); }
                }}
                  className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold active:scale-95"
                  style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                  🗑️ حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Gifts Tab ─────────────────────────────────────────────────────────────
function GiftsTab() {
  const [gifts, setGifts] = useState<any[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('custom_gifts').select('*');
      setGifts(data || []);
    };
    fetchData();
  }, []);
  const setVisibility = async (args: any) => {};
  const deleteGift = async (args: any) => {};
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggleVisibility = async (gift: any) => {
    setBusyId(gift.id);
    try {
      await setVisibility({ giftId: gift.id as string, isActive: gift.isActive === false });
      toast.success(gift.isActive === false ? "تم إظهار الهدية" : "تم إخفاء الهدية");
    } catch (e: any) {
      toast.error(e?.message ?? "تعذر تحديث حالة الهدية");
    } finally { setBusyId(null); }
  };

  const removeGift = async (gift: any) => {
    if (!window.confirm(`هل تريد حذف الهدية «${gift.name}» نهائيًا؟`)) return;
    setBusyId(gift.id);
    try {
      await deleteGift({ giftId: gift.id as string });
      toast.success("تم حذف الهدية");
    } catch (e: any) {
      toast.error(e?.message ?? "تعذر حذف الهدية");
    } finally { setBusyId(null); }
  };

  return (
    <div className="p-4 space-y-3">
      <SectionHeader title="إدارة الهدايا" subtitle={`${gifts?.length ?? 0} هدية — إخفاء أو حذف`} icon="🎁" color="#e879f9" />
      {!gifts ? <LoadingSpinner /> : (gifts as any[]).length === 0 ? (
        <div className="text-center py-12"><div className="text-4xl mb-3">🎁</div><p className="text-gray-500 text-sm">لا توجد هدايا مخصصة</p></div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {(gifts as any[]).map((gift: any) => {
            const busy = busyId === gift.id;
            return (
              <div key={gift.id} className="rounded-2xl p-3"
                style={{ background: "rgba(232,121,249,0.06)", border: "1px solid rgba(232,121,249,0.15)" }}>
                <div className="w-full h-20 rounded-xl overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.06)" }}>
                  {gift.videoUrl ? <video src={gift.videoUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                    : gift.thumbnailUrl ? <img src={gift.thumbnailUrl} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl">🎁</div>}
                </div>
                <p className="text-white font-bold text-xs truncate">{gift.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "#e879f9" }}>{(gift.price ?? 0).toLocaleString()} 🪙</p>
                <div className="flex items-center gap-1 mt-1 mb-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: gift.isActive === false ? "rgba(239,68,68,0.2)" : "rgba(52,211,153,0.2)", color: gift.isActive === false ? "#ef4444" : "#34d399" }}>
                    {gift.isActive === false ? "مخفي" : "ظاهر"}
                  </span>
                  {gift.showFullScreen && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>شاشة كاملة</span>}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button disabled={busy} onClick={() => void toggleVisibility(gift)} className="rounded-lg py-1.5 text-[10px] font-bold disabled:opacity-50" style={{ background: "rgba(52,211,153,0.14)", color: "#34d399" }}>
                    {busy ? "..." : gift.isActive === false ? "إظهار" : "إخفاء"}
                  </button>
                  <button disabled={busy} onClick={() => void removeGift(gift)} className="rounded-lg py-1.5 text-[10px] font-bold disabled:opacity-50" style={{ background: "rgba(239,68,68,0.14)", color: "#f87171" }}>
                    حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────
const AdminDashboardExtra = {
  FamiliesTab,
  TransfersTab,
  VipManagementTab,
  GamesTab,
  SecurityTab,
  SupportTab,
  LeaderboardTab,
  StoreTab,
  GiftsTab,
};

export default AdminDashboardExtra;
