// @ts-nocheck
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "../lib/toast";

// ── أيقونات الأنواع ──
const TYPE_ICONS: Record<string, string> = {
  coins: "🪙", gift: "🎁", frame: "🖼️", entry: "🚪",   vip: "🟢", aristocracy: "💎",
};
const TYPE_LABELS: Record<string, string> = {
  coins: "عملات ذهبية", gift: "هدية", frame: "إطار", entry: "دخولية", vip: "PRO", aristocracy: "استقراطية",
};
const TYPE_COLORS: Record<string, string> = {
  coins: "#fbbf24", gift: "#f472b6", frame: "#60a5fa", entry: "#34d399", vip: "#a855f7", aristocracy: "#f97316",
};

const DAY_LABELS = ["اليوم 1", "اليوم 2", "اليوم 3", "اليوم 4", "اليوم 5", "اليوم 6", "اليوم 7"];

// ── مكوّن اختيار الهدية ──
function GiftPicker({ onSelect, onClose }: { onSelect: (g: any) => void; onClose: () => void }) {
  const gifts = useQuery(api.dailyCheckinAdmin.getGiftsForPicker);
  const [search, setSearch] = useState("");
  const filtered = (gifts ?? []).filter((g: any) => g.name?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="fixed inset-0 z-[400] flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative w-full rounded-t-3xl max-h-[80vh] flex flex-col"
        style={{ background: "#0a0a1f", border: "1px solid rgba(244,114,182,0.3)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-white font-black text-base">🎁 اختر هدية</h3>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        <div className="p-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..."
            className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />
        </div>
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-3 gap-2">
          {!gifts ? (
            <div className="col-span-3 flex justify-center py-8"><div className="w-6 h-6 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <p className="col-span-3 text-gray-500 text-sm text-center py-8">لا توجد هدايا</p>
          ) : filtered.map((g: any) => (
            <button key={g._id} onClick={() => onSelect(g)}
              className="rounded-2xl p-2 flex flex-col items-center gap-1 active:scale-95 transition-all"
              style={{ background: "rgba(244,114,182,0.08)", border: "1px solid rgba(244,114,182,0.2)" }}>
              {g.imageUrl
                ? <img src={g.imageUrl} alt={g.name} className="w-12 h-12 object-contain rounded-xl" />
                : <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: "rgba(244,114,182,0.15)" }}>🎁</div>
              }
              <p className="text-white text-[10px] font-bold text-center truncate w-full">{g.name}</p>
              <p className="text-pink-400 text-[9px]">{(g.price ?? 0).toLocaleString()} 🪙</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── مكوّن اختيار عنصر المتجر ──
function StoreItemPicker({ type, onSelect, onClose }: { type: "frame" | "entry"; onSelect: (i: any) => void; onClose: () => void }) {
  const items = useQuery(api.dailyCheckinAdmin.getStoreItemsForPicker, { type });
  const [search, setSearch] = useState("");
  const filtered = (items ?? []).filter((i: any) => i.name?.toLowerCase().includes(search.toLowerCase()));
  const color = type === "frame" ? "#60a5fa" : "#34d399";
  const label = type === "frame" ? "إطار" : "دخولية";
  return (
    <div className="fixed inset-0 z-[400] flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative w-full rounded-t-3xl max-h-[80vh] flex flex-col"
        style={{ background: "#0a0a1f", border: `1px solid ${color}40` }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-white font-black text-base">{type === "frame" ? "🖼️" : "🚪"} اختر {label}</h3>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        <div className="p-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..."
            className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />
        </div>
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-3 gap-2">
          {!items ? (
            <div className="col-span-3 flex justify-center py-8"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: color }} /></div>
          ) : filtered.length === 0 ? (
            <p className="col-span-3 text-gray-500 text-sm text-center py-8">لا توجد عناصر</p>
          ) : filtered.map((i: any) => (
            <button key={i._id} onClick={() => onSelect(i)}
              className="rounded-2xl p-2 flex flex-col items-center gap-1 active:scale-95 transition-all"
              style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
              {i.imageUrl
                ? <img src={i.imageUrl} alt={i.name} className="w-12 h-12 object-contain rounded-xl" />
                : <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${color}20` }}>{type === "frame" ? "🖼️" : "🚪"}</div>
              }
              <p className="text-white text-[10px] font-bold text-center truncate w-full">{i.name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── مكوّن تعديل يوم واحد ──
function DayEditor({ day, config, onClose }: { day: number; config: any; onClose: () => void }) {
  const saveConfig = useMutation(api.dailyCheckinAdmin.saveCheckinDayConfig);
  const [rewardType, setRewardType] = useState<string>(config?.rewardType ?? "coins");
  const [coins, setCoins] = useState(String(config?.coins ?? 1000));
  const [vipLevel, setVipLevel] = useState(String(config?.vipLevel ?? 1));
  const [vipDays, setVipDays] = useState(String(config?.vipDays ?? 3));
  const [aristoLevel, setAristoLevel] = useState(String(config?.aristocracyLevel ?? 1));
  const [aristoDays, setAristoDays] = useState(String(config?.aristocracyDays ?? 3));
  const [durationDays, setDurationDays] = useState(String(config?.durationDays ?? 3));
  const [selectedGift, setSelectedGift] = useState<any>(config?.giftId ? { _id: config.giftId, name: config.giftName, imageUrl: config.giftImageUrl } : null);
  const [selectedItem, setSelectedItem] = useState<any>(config?.storeItemId ? { _id: config.storeItemId, name: config.storeItemName, imageUrl: config.storeItemImageUrl } : null);
  const [showGiftPicker, setShowGiftPicker] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const color = TYPE_COLORS[rewardType] ?? "#6366f1";

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveConfig({
        day,
        rewardType: rewardType as any,
        coins: rewardType === "coins" ? Number(coins) : undefined,
        giftId: rewardType === "gift" ? selectedGift?._id : undefined,
        giftName: rewardType === "gift" ? selectedGift?.name : undefined,
        giftImageUrl: rewardType === "gift" ? selectedGift?.imageUrl : undefined,
        storeItemId: (rewardType === "frame" || rewardType === "entry") ? selectedItem?._id : undefined,
        storeItemName: (rewardType === "frame" || rewardType === "entry") ? selectedItem?.name : undefined,
        storeItemImageUrl: (rewardType === "frame" || rewardType === "entry") ? selectedItem?.imageUrl : undefined,
        durationDays: (rewardType === "frame" || rewardType === "entry") ? Number(durationDays) : undefined,
        vipLevel: rewardType === "vip" ? Number(vipLevel) : undefined,
        vipDays: rewardType === "vip" ? Number(vipDays) : undefined,
        aristocracyLevel: rewardType === "aristocracy" ? Number(aristoLevel) : undefined,
        aristocracyDays: rewardType === "aristocracy" ? Number(aristoDays) : undefined,
      });
      toast.success(`✅ تم حفظ اليوم ${day}`);
      onClose();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[350] flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div className="relative w-full rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
        style={{ background: "#0a0a1f", border: `1px solid ${color}40` }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-black text-base">✏️ تعديل {DAY_LABELS[day - 1]}</h3>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>

        {/* نوع المكافأة */}
        <div>
          <p className="text-gray-400 text-xs font-bold mb-2">نوع المكافأة</p>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(TYPE_LABELS).map(([type, label]) => (
              <button key={type} onClick={() => setRewardType(type)}
                className="py-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all active:scale-95"
                style={rewardType === type
                  ? { background: `${TYPE_COLORS[type]}20`, color: TYPE_COLORS[type], border: `1.5px solid ${TYPE_COLORS[type]}` }
                  : { background: "rgba(255,255,255,0.05)", color: "#6b7280", border: "1px solid rgba(255,255,255,0.1)" }}>
                <span className="text-lg">{TYPE_ICONS[type]}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* حقول حسب النوع */}
        {rewardType === "coins" && (
          <div>
            <p className="text-gray-400 text-xs font-bold mb-2">عدد العملات 🪙</p>
            <input value={coins} onChange={(e) => setCoins(e.target.value)} type="number" min="1"
              className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(251,191,36,0.3)" }} dir="ltr" />
          </div>
        )}

        {rewardType === "gift" && (
          <div>
            <p className="text-gray-400 text-xs font-bold mb-2">الهدية المختارة</p>
            {selectedGift ? (
              <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "rgba(244,114,182,0.08)", border: "1px solid rgba(244,114,182,0.25)" }}>
                {selectedGift.imageUrl && <img src={selectedGift.imageUrl} alt="" className="w-12 h-12 object-contain rounded-xl" />}
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">{selectedGift.name}</p>
                </div>
                <button onClick={() => setShowGiftPicker(true)} className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: "rgba(244,114,182,0.2)", color: "#f472b6" }}>تغيير</button>
              </div>
            ) : (
              <button onClick={() => setShowGiftPicker(true)}
                className="w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: "rgba(244,114,182,0.08)", border: "1px dashed rgba(244,114,182,0.4)", color: "#f472b6" }}>
                🎁 اختر هدية من القائمة
              </button>
            )}
          </div>
        )}

        {(rewardType === "frame" || rewardType === "entry") && (
          <div>
            <p className="text-gray-400 text-xs font-bold mb-2">{rewardType === "frame" ? "الإطار المختار" : "الدخولية المختارة"}</p>
            {selectedItem ? (
              <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
                {selectedItem.imageUrl && <img src={selectedItem.imageUrl} alt="" className="w-12 h-12 object-contain rounded-xl" />}
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">{selectedItem.name}</p>
                </div>
                <button onClick={() => setShowItemPicker(true)} className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: `${color}20`, color }}>تغيير</button>
              </div>
            ) : (
              <button onClick={() => setShowItemPicker(true)}
                className="w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: `${color}08`, border: `1px dashed ${color}40`, color }}>
                {rewardType === "frame" ? "🖼️ اختر إطاراً من المتجر" : "🚪 اختر دخولية من المتجر"}
              </button>
            )}
            <div className="mt-3">
              <p className="text-gray-400 text-xs font-bold mb-2">مدة الصلاحية بالأيام</p>
              <input value={durationDays} onChange={(e) => setDurationDays(e.target.value)} type="number" min="1" max="365"
                className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${color}40` }} dir="ltr" />
            </div>
          </div>
        )}

        {rewardType === "vip" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-gray-400 text-xs font-bold mb-2">مستوى PRO 🟢</p>
              <input value={vipLevel} onChange={(e) => setVipLevel(e.target.value)} type="number" min="1" max="12"
                className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(168,85,247,0.3)" }} dir="ltr" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold mb-2">عدد الأيام</p>
              <input value={vipDays} onChange={(e) => setVipDays(e.target.value)} type="number" min="1"
                className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(168,85,247,0.3)" }} dir="ltr" />
            </div>
          </div>
        )}

        {rewardType === "aristocracy" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-gray-400 text-xs font-bold mb-2">مستوى الاستقراطية 💎</p>
              <input value={aristoLevel} onChange={(e) => setAristoLevel(e.target.value)} type="number" min="1" max="8"
                className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(249,115,22,0.3)" }} dir="ltr" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold mb-2">عدد الأيام</p>
              <input value={aristoDays} onChange={(e) => setAristoDays(e.target.value)} type="number" min="1"
                className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(249,115,22,0.3)" }} dir="ltr" />
            </div>
          </div>
        )}

        <button onClick={handleSave} disabled={saving}
          className="w-full py-4 rounded-2xl text-white font-black text-sm active:scale-95 disabled:opacity-50"
          style={{ background: `linear-gradient(135deg,${color},${color}cc)`, boxShadow: `0 4px 20px ${color}40` }}>
          {saving ? <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />جاري الحفظ...</div> : `✅ حفظ ${DAY_LABELS[day - 1]}`}
        </button>
      </div>

      {showGiftPicker && <GiftPicker onSelect={(g) => { setSelectedGift(g); setShowGiftPicker(false); }} onClose={() => setShowGiftPicker(false)} />}
      {showItemPicker && <StoreItemPicker type={rewardType as "frame" | "entry"} onSelect={(i) => { setSelectedItem(i); setShowItemPicker(false); }} onClose={() => setShowItemPicker(false)} />}
    </div>
  );
}

// ── بطاقة اليوم ──
function DayCard({ day, config, onEdit }: { day: number; config: any; onEdit: () => void }) {
  const type = config?.rewardType ?? "coins";
  const color = TYPE_COLORS[type] ?? "#fbbf24";

  const getRewardDisplay = () => {
    if (!config) return { icon: "🪙", text: "غير محدد", sub: "" };
    switch (config.rewardType) {
      case "coins": return { icon: "🪙", text: (config.coins ?? 0).toLocaleString() + " عملة", sub: "", img: null };
      case "gift": return { icon: "🎁", text: config.giftName ?? "هدية", sub: "", img: config.giftImageUrl };
      case "frame": return { icon: "🖼️", text: config.storeItemName ?? "إطار", sub: "", img: config.storeItemImageUrl };
      case "entry": return { icon: "🚪", text: config.storeItemName ?? "دخولية", sub: "", img: config.storeItemImageUrl };
      case "vip": return { icon: "👑", text: `VIP ${config.vipLevel}`, sub: `${config.vipDays} يوم`, img: null };
      case "aristocracy": return { icon: "💎", text: `استقراطية ${config.aristocracyLevel}`, sub: `${config.aristocracyDays} يوم`, img: null };
      default: return { icon: "🪙", text: "غير محدد", sub: "", img: null };
    }
  };

  const { icon, text, sub, img } = getRewardDisplay();
  const isDay7 = day === 7;

  return (
    <div className="rounded-2xl p-3 relative overflow-hidden"
      style={{
        background: isDay7
          ? "linear-gradient(135deg,rgba(251,191,36,0.15),rgba(245,158,11,0.08))"
          : `${color}0a`,
        border: isDay7 ? "1.5px solid rgba(251,191,36,0.5)" : `1px solid ${color}25`,
        boxShadow: isDay7 ? "0 0 20px rgba(251,191,36,0.15)" : "none",
      }}>
      {isDay7 && (
        <div className="absolute top-1 left-1">
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.3)", color: "#fbbf24" }}>🏆 نهاية الأسبوع</span>
        </div>
      )}
      <div className="flex items-center gap-2 mb-2 mt-1">
        <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black"
          style={{ background: `${color}20`, color }}>
          {day}
        </div>
        <p className="text-white font-bold text-xs">{DAY_LABELS[day - 1]}</p>
      </div>

      {/* صورة المكافأة */}
      <div className="flex flex-col items-center gap-1 mb-2">
        {img ? (
          <img src={img} alt={text} className="w-14 h-14 object-contain rounded-xl" />
        ) : (
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
            style={{ background: `${color}15` }}>
            {icon}
          </div>
        )}
        <p className="text-white text-[10px] font-bold text-center leading-tight">{text}</p>
        {sub && <p className="text-[9px] font-bold" style={{ color }}>{sub}</p>}
        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
          style={{ background: `${color}20`, color }}>
          {TYPE_LABELS[type]}
        </span>
      </div>

      <button onClick={onEdit}
        className="w-full py-1.5 rounded-xl text-[10px] font-black active:scale-95 transition-all"
        style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
        ✏️ تعديل
      </button>
    </div>
  );
}

// ── الصفحة الرئيسية ──
export default function AdminDailyCheckinTab() {
  const configs = useQuery(api.dailyCheckinAdmin.getCheckinConfig);
  const [editingDay, setEditingDay] = useState<number | null>(null);

  const configMap: Record<number, any> = {};
  (configs ?? []).forEach((c: any) => { configMap[c.day] = c; });

  return (
    <div className="p-4 space-y-4" dir="rtl">
      {/* Header */}
      <div className="px-1 pt-2 pb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
            style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" }}>
            📅
          </div>
          <div>
            <h2 className="text-white font-black text-base">تشكيل الدخول اليومي</h2>
            <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>حدد مكافأة كل يوم من أيام الأسبوع السبعة</p>
          </div>
        </div>
      </div>

      {/* إرشادات */}
      <div className="rounded-2xl p-3 flex items-start gap-3"
        style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
        <span className="text-lg flex-shrink-0">💡</span>
        <div className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
          <p className="font-bold mb-1">كيف يعمل النظام؟</p>
          <p>• المستخدم يسجل دخوله يومياً ويحصل على مكافأة اليوم المقابل</p>
          <p>• بعد اليوم 7 تعود الدورة من اليوم 1</p>
          <p>• يمكنك تحديد: عملات، هدية، إطار، دخولية، VIP، أو استقراطية</p>
        </div>
      </div>

      {/* ملخص الأيام */}
      <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="text-gray-400 text-xs font-bold mb-2">ملخص المكافآت الحالية</p>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => {
            const cfg = configMap[day];
            const type = cfg?.rewardType ?? "coins";
            const color = TYPE_COLORS[type];
            return (
              <div key={day} className="flex-shrink-0 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl"
                style={{ background: `${color}12`, border: `1px solid ${color}25`, minWidth: 44 }}>
                <span className="text-base">{TYPE_ICONS[type]}</span>
                <span className="text-[9px] font-black" style={{ color }}>{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* شبكة الأيام */}
      {!configs ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => (
            <DayCard
              key={day}
              day={day}
              config={configMap[day] ?? null}
              onEdit={() => setEditingDay(day)}
            />
          ))}
          {/* بطاقة معلومات */}
          <div className="rounded-2xl p-3 flex flex-col items-center justify-center gap-2"
            style={{ background: "rgba(99,102,241,0.06)", border: "1px dashed rgba(99,102,241,0.25)" }}>
            <span className="text-3xl">🔄</span>
            <p className="text-gray-400 text-[10px] text-center font-bold">بعد اليوم 7<br />تعود الدورة</p>
          </div>
        </div>
      )}

      {/* محرر اليوم */}
      {editingDay !== null && (
        <DayEditor
          day={editingDay}
          config={configMap[editingDay] ?? null}
          onClose={() => setEditingDay(null)}
        />
      )}
    </div>
  );
}
