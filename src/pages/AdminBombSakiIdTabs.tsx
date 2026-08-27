// @ts-nocheck
import { supabase } from "../lib/supabaseClient";
import { useState, useEffect } from "react";
import { toast } from "../lib/toast";
import UserAvatar from "../components/UserAvatar";

function formatCoins(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

const LEVEL_COLORS = [
  { from: "#f59e0b", to: "#ef4444" },
  { from: "#a855f7", to: "#7c3aed" },
  { from: "#3b82f6", to: "#1d4ed8" },
  { from: "#ff006e", to: "#8338ec" },
  { from: "#10b981", to: "#059669" },
  { from: "#f97316", to: "#ea580c" },
  { from: "#ec4899", to: "#db2777" },
  { from: "#06b6d4", to: "#0891b2" },
  { from: "#84cc16", to: "#65a30d" },
  { from: "#8b5cf6", to: "#7c3aed" },
];

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-10">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function BombConfigTab() {
  const [allConfigs, setAllConfigs] = useState<any[]>([]);
  const [storeItems, setStoreItems] = useState<any[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      const { data: configs } = await supabase.from('bomb_configs').select('*').order('level');
      setAllConfigs(configs || []);
      const { data: items } = await supabase.from('store_items').select('*');
      setStoreItems(items || []);
    };
    fetchData();
  }, []);
  const updateConfig = async (args: any) => {};
  const [editingLevel, setEditingLevel] = useState<number | null>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const openEdit = (cfg: any) => {
    setForm({
      threshold: cfg.threshold,
      firstVip: cfg.firstVip,
      firstVipDays: cfg.firstVipDays,
      firstCoins: cfg.firstCoins ?? 0,
      firstStoreItemId: cfg.firstStoreItemId ?? "",
      secondCoins: cfg.secondCoins ?? 0,
      secondVip: cfg.secondVip ?? "",
      secondVipDays: cfg.secondVipDays ?? "",
      thirdCoins: cfg.thirdCoins ?? 0,
      thirdVip: cfg.thirdVip ?? "",
      thirdVipDays: cfg.thirdVipDays ?? "",
    });
    setEditingLevel(cfg.level);
  };

  const handleSave = async () => {
    if (editingLevel === null) return;
    setSaving(true);
    try {
      await updateConfig({
        level: editingLevel,
        threshold: Number(form.threshold),
        firstPlaceVipLevel: Number(form.firstVip) || undefined,
        firstPlaceVipDays: Number(form.firstVipDays) || undefined,
        firstPlaceCoins: Number(form.firstCoins) || undefined,
        firstPlaceStoreItemId: form.firstStoreItemId || undefined,
        secondPlaceCoins: Number(form.secondCoins) || undefined,
        secondPlaceVipLevel: Number(form.secondVip) || undefined,
        secondPlaceVipDays: Number(form.secondVipDays) || undefined,
        thirdPlaceCoins: Number(form.thirdCoins) || undefined,
        thirdPlaceVipLevel: Number(form.thirdVip) || undefined,
        thirdPlaceVipDays: Number(form.thirdVipDays) || undefined,
      });
      toast.success(`✅ تم حفظ إعدادات المستوى ${editingLevel}`);
      setEditingLevel(null);
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  if (!allConfigs) return <LoadingSpinner />;

  return (
    <div className="p-4 space-y-3">
      <div className="rounded-2xl p-3 text-xs text-gray-400"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        💣 إعداد مستويات القنبلة الأربعة — حدد عتبة الهدايا وجوائز كل مركز
      </div>
      {allConfigs.map((cfg: any) => {
        const c = LEVEL_COLORS[cfg.level - 1];
        return (
          <div key={cfg.level} className="rounded-2xl p-4 border"
            style={{ background: `${c.from}10`, borderColor: `${c.from}30` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white"
                  style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}>
                  {cfg.level}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">المستوى {cfg.level}</p>
                  <p className="text-gray-500 text-xs">عتبة: {formatCoins(cfg.threshold)} عملة</p>
                </div>
              </div>
              <button onClick={() => openEdit(cfg)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95"
                style={{ background: `${c.from}20`, color: c.from, border: `1px solid ${c.from}40` }}>
                ✏️ تعديل
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl p-2" style={{ background: "rgba(251,191,36,0.1)" }}>
                <p className="text-yellow-400 text-[10px] font-bold">🥇 الأول</p>
                <p className="text-white text-xs">VIP{cfg.firstVip}</p>
                <p className="text-gray-500 text-[10px]">{cfg.firstVipDays}ي</p>
                {cfg.firstCoins > 0 && <p className="text-yellow-300 text-[10px]">+{formatCoins(cfg.firstCoins)}</p>}
                {cfg.storeItemName && <p className="text-purple-300 text-[9px] truncate">{cfg.storeItemName}</p>}
              </div>
              <div className="rounded-xl p-2" style={{ background: "rgba(156,163,175,0.1)" }}>
                <p className="text-gray-300 text-[10px] font-bold">🥈 الثاني</p>
                <p className="text-white text-xs">{formatCoins(cfg.secondCoins)}</p>
                {cfg.secondVip && <p className="text-yellow-400 text-[10px]">VIP{cfg.secondVip}</p>}
              </div>
              <div className="rounded-xl p-2" style={{ background: "rgba(180,120,60,0.1)" }}>
                <p className="text-orange-300 text-[10px] font-bold">🥉 الثالث</p>
                <p className="text-white text-xs">{formatCoins(cfg.thirdCoins)}</p>
                {cfg.thirdVip && <p className="text-yellow-400 text-[10px]">VIP{cfg.thirdVip}</p>}
              </div>
            </div>
          </div>
        );
      })}

      {editingLevel !== null && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="w-full max-w-lg rounded-t-3xl p-5 space-y-3 max-h-[90vh] overflow-y-auto"
            style={{ background: "#0f0f1a", border: "1px solid rgba(168,85,247,0.3)" }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-black text-base">💣 تعديل المستوى {editingLevel}</h3>
              <button onClick={() => setEditingLevel(null)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div>
              <label className="text-gray-400 text-xs font-bold mb-1 block">عتبة الهدايا (عملات)</label>
              <input value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} type="number"
                className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} dir="ltr" />
            </div>
            <p className="text-yellow-400 text-xs font-bold pt-1">🥇 جائزة المركز الأول</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-gray-400 text-[10px] font-bold mb-1 block">مستوى VIP</label>
                <input value={form.firstVip} onChange={(e) => setForm({ ...form, firstVip: e.target.value })} type="number" min="1" max="12"
                  className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} dir="ltr" />
              </div>
              <div>
                <label className="text-gray-400 text-[10px] font-bold mb-1 block">مدة VIP (يوم)</label>
                <input value={form.firstVipDays} onChange={(e) => setForm({ ...form, firstVipDays: e.target.value })} type="number" min="1"
                  className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} dir="ltr" />
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-[10px] font-bold mb-1 block">عملات إضافية (اختياري)</label>
              <input value={form.firstCoins} onChange={(e) => setForm({ ...form, firstCoins: e.target.value })} type="number" min="0"
                className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} dir="ltr" />
            </div>
            <div>
              <label className="text-gray-400 text-[10px] font-bold mb-1 block">هدية من المتجر (اختياري)</label>
              <select value={form.firstStoreItemId} onChange={(e) => setForm({ ...form, firstStoreItemId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <option value="">-- بدون هدية --</option>
                {storeItems?.map((item: any) => (
                  <option key={item.id} value={item.id}>{item.name} ({item.type})</option>
                ))}
              </select>
            </div>
            <p className="text-gray-300 text-xs font-bold pt-1">🥈 جائزة المركز الثاني</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-gray-400 text-[10px] font-bold mb-1 block">عملات ذهبية</label>
                <input value={form.secondCoins} onChange={(e) => setForm({ ...form, secondCoins: e.target.value })} type="number" min="0"
                  className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} dir="ltr" />
              </div>
              <div>
                <label className="text-gray-400 text-[10px] font-bold mb-1 block">VIP (0=بدون)</label>
                <input value={form.secondVip} onChange={(e) => setForm({ ...form, secondVip: e.target.value })} type="number" min="0"
                  className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} dir="ltr" />
              </div>
            </div>
            {Number(form.secondVip) > 0 && (
              <div>
                <label className="text-gray-400 text-[10px] font-bold mb-1 block">مدة VIP الثاني (يوم)</label>
                <input value={form.secondVipDays} onChange={(e) => setForm({ ...form, secondVipDays: e.target.value })} type="number" min="1"
                  className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} dir="ltr" />
              </div>
            )}
            <p className="text-orange-300 text-xs font-bold pt-1">🥉 جائزة المركز الثالث</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-gray-400 text-[10px] font-bold mb-1 block">عملات ذهبية</label>
                <input value={form.thirdCoins} onChange={(e) => setForm({ ...form, thirdCoins: e.target.value })} type="number" min="0"
                  className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} dir="ltr" />
              </div>
              <div>
                <label className="text-gray-400 text-[10px] font-bold mb-1 block">VIP (0=بدون)</label>
                <input value={form.thirdVip} onChange={(e) => setForm({ ...form, thirdVip: e.target.value })} type="number" min="0"
                  className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} dir="ltr" />
              </div>
            </div>
            {Number(form.thirdVip) > 0 && (
              <div>
                <label className="text-gray-400 text-[10px] font-bold mb-1 block">مدة VIP الثالث (يوم)</label>
                <input value={form.thirdVipDays} onChange={(e) => setForm({ ...form, thirdVipDays: e.target.value })} type="number" min="1"
                  className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} dir="ltr" />
              </div>
            )}
            <button onClick={handleSave} disabled={saving}
              className="w-full py-3 rounded-2xl text-white font-black text-sm active:scale-95 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)" }}>
              {saving ? "جاري الحفظ..." : "💾 حفظ الإعدادات"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PremiumSakiIdTab() {
  const [premiums, setPremiums] = useState<any[]>([]);
  const [targetSakiId, setTargetSakiId] = useState("");
  const [premiumId, setPremiumId] = useState("");
  const [days, setDays] = useState("30");
  const [loading, setLoading] = useState(false);
  const [searchProfile, setSearchProfile] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('premium_saki_ids').select('*, profile:profiles(*)');
      setPremiums(data || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (targetSakiId.length >= 6) {
      const fetchData = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('saki_id', targetSakiId).maybeSingle();
        setSearchProfile(data);
      };
      fetchData();
    } else {
      setSearchProfile(null);
    }
  }, [targetSakiId]);

  const grantPremium = async (args: any) => ({ targetName: "User" });
  const revokePremium = async (args: any) => {};

  const handleGrant = async () => {
    if (!targetSakiId || !premiumId || !days) return;
    setLoading(true);
    try {
      const res = await grantPremium({
        targetSakiId,
        premiumSakiId: premiumId,
        durationDays: Number(days),
      });
      toast.success(`✅ تم منح المعرف المميز #${premiumId} لـ ${(res as any).targetName} لمدة ${days} يوم`);
      setTargetSakiId(""); setPremiumId(""); setDays("30");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-2xl p-3 text-xs text-gray-400"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        🆔 منح معرف SAKU مؤقت للمستخدمين — يعود المعرف الأصلي تلقائياً بعد انتهاء المدة
      </div>
      <div className="rounded-2xl p-4 space-y-3"
        style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.2)" }}>
        <p className="text-purple-400 font-bold text-sm">➕ منح معرف مميز</p>
        <div>
          <label className="text-gray-400 text-xs font-bold mb-1 block">معرف SAKU الحالي للمستخدم</label>
          <input value={targetSakiId} onChange={(e) => setTargetSakiId(e.target.value)}
            placeholder="أدخل معرف SAKU..."
            className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} dir="ltr" />
        </div>
        {searchProfile && (
          <div className="rounded-xl p-2.5 flex items-center gap-2"
            style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)" }}>
            <UserAvatar userId={searchProfile.user_id as string} avatarUrl={searchProfile.avatarUrl} name={searchProfile.name} size={32} />
            <div>
              <p className="text-white font-bold text-xs">{searchProfile.name}</p>
              <p className="text-gray-400 text-[10px]">#{searchProfile.sakiId}</p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-gray-400 text-xs font-bold mb-1 block">المعرف المميز الجديد</label>
            <input value={premiumId} onChange={(e) => setPremiumId(e.target.value)}
              placeholder="مثال: KING001"
              className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} dir="ltr" />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-bold mb-1 block">المدة (يوم)</label>
            <input value={days} onChange={(e) => setDays(e.target.value)} type="number" min="1"
              className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} dir="ltr" />
          </div>
        </div>
        <button onClick={handleGrant} disabled={!searchProfile || !premiumId || !days || loading}
          className="w-full py-3 rounded-2xl text-white font-black text-sm active:scale-95 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)" }}>
          {loading ? "جاري المنح..." : "🆔 منح المعرف المميز"}
        </button>
      </div>
      <p className="text-white font-bold text-sm">المعرفات المميزة النشطة</p>
      {!premiums ? <LoadingSpinner /> : premiums.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-6">لا توجد معرفات مميزة نشطة</p>
      ) : (
        <div className="space-y-2">
          {premiums.map((p: any) => (
            <div key={p.id} className="rounded-2xl p-3"
              style={{
                background: p.isExpired ? "rgba(239,68,68,0.06)" : "rgba(168,85,247,0.06)",
                border: p.isExpired ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(168,85,247,0.2)",
              }}>
              <div className="flex items-center gap-3">
                <UserAvatar userId={p.userId as string} avatarUrl={p.userAvatarUrl} name={p.userName} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{p.userName}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-gray-500 text-xs">#{p.originalSakiId}</span>
                    <span className="text-purple-400 text-xs">→</span>
                    <span className="text-purple-300 font-bold text-xs">#{p.sakiId}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {p.isExpired
                    ? <span className="text-red-400 text-xs font-bold">منتهي</span>
                    : <span className="text-green-400 text-xs font-bold">{p.daysLeft} يوم</span>
                  }
                </div>
                <button onClick={async () => {
                  try {
                    await revokePremium({ targetSakiId: p.originalSakiId });
                    toast.success("تم إلغاء المعرف المميز");
                  } catch (e: any) { toast.error(e.message); }
                }}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold active:scale-95 flex-shrink-0"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                  إلغاء
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
