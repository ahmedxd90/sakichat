import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "../lib/toast";

function PickerCard({ item, selected, onClick, accent }: { item: any; selected: boolean; onClick: () => void; accent: string }) {
  return (
    <button onClick={onClick} className="relative text-right rounded-2xl p-2 active:scale-95 transition-all" style={{ background: selected ? `${accent}20` : "rgba(255,255,255,0.04)", border: selected ? `1px solid ${accent}80` : "1px solid rgba(255,255,255,0.08)" }}>
      <div className="h-16 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: `${accent}10` }}>
        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="max-h-full max-w-full object-contain" /> : <span className="text-2xl">🎁</span>}
      </div>
      <p className="text-white text-[10px] font-bold truncate mt-2">{item.name}</p>
      {selected && <span className="absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ background: accent, color: "#111" }}>✓</span>}
    </button>
  );
}

export default function AdminWelcomePackageTab() {
  const gifts = useQuery(api.dailyCheckinAdmin.getGiftsForPicker);
  const frames = useQuery(api.dailyCheckinAdmin.getStoreItemsForPicker, { type: "frame" });
  const current = useQuery(api.adminExtra.getWelcomePackage);
  const savePackage = useMutation(api.adminExtra.configureWelcomePackage);
  const [selectedGifts, setSelectedGifts] = useState<string[]>([]);
  const [frameId, setFrameId] = useState<string>("");
  const [goldCoins, setGoldCoins] = useState("0");
  const [aristocracyLevel, setAristocracyLevel] = useState("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!current) return;
    setSelectedGifts((current.giftIds ?? []).map(String));
    setFrameId(current.frameId ? String(current.frameId) : "");
    setGoldCoins(String(current.goldCoins ?? 0));
    setAristocracyLevel(String(current.aristocracyLevel ?? 0));
  }, [current]);

  const selectedGiftItems = useMemo(() => (gifts ?? []).filter((gift: any) => selectedGifts.includes(String(gift._id))), [gifts, selectedGifts]);

  const toggleGift = (id: string) => {
    setSelectedGifts((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : prev.length >= 5 ? prev : [...prev, id]);
  };

  const save = async () => {
    setSaving(true);
    try {
      await savePackage({
        giftIds: selectedGifts as Id<"customGifts">[],
        frameId: frameId ? frameId as Id<"storeItems"> : undefined,
        goldCoins: Math.max(0, Number(goldCoins) || 0),
        aristocracyLevel: Math.max(0, Number(aristocracyLevel) || 0),
      });
      toast.success("✅ تم حفظ حزمة الترحيب");
    } catch (error: any) {
      toast.error(error?.message ?? "تعذر حفظ الحزمة");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-4" dir="rtl">
      <div className="relative overflow-hidden rounded-[28px] p-5" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(59,130,246,0.13) 50%, rgba(245,158,11,0.14))", border: "1px solid rgba(52,211,153,0.28)" }}>
        <div className="flex items-start justify-between gap-3 relative">
          <div>
            <p className="text-[10px] font-black tracking-[0.25em]" style={{ color: "#6ee7b7" }}>WELCOME REWARDS</p>
            <h2 className="text-white font-black text-xl mt-1">حزمة ترحيب المستخدمين</h2>
            <p className="text-gray-300 text-xs leading-6 mt-2">اختر حتى 5 هدايا، إطاراً متحركاً، العملات والأرستقراطية التي يحصل عليها المستخدم الجديد.</p>
          </div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: "rgba(255,255,255,0.12)" }}>🎁</div>
        </div>
      </div>

      <section className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between mb-3">
          <div><h3 className="text-white font-black text-sm">الهدايا</h3><p className="text-gray-500 text-[10px] mt-1">{selectedGifts.length}/5 مختارة</p></div>
          <span className="text-emerald-300 text-xs font-bold">من صندوق الهدايا</span>
        </div>
        {!gifts ? <div className="h-24 flex items-center justify-center text-gray-500 text-xs">جاري تحميل الهدايا...</div> : (
          <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
            {gifts.map((gift: any) => <PickerCard key={gift._id} item={gift} selected={selectedGifts.includes(String(gift._id))} onClick={() => toggleGift(String(gift._id))} accent="#34d399" />)}
          </div>
        )}
        {selectedGiftItems.length > 0 && <div className="flex gap-2 mt-3 overflow-x-auto">{selectedGiftItems.map((gift: any) => <span key={gift._id} className="text-[10px] text-emerald-200 px-2 py-1 rounded-full whitespace-nowrap" style={{ background: "rgba(52,211,153,0.14)" }}>{gift.name}</span>)}</div>}
      </section>

      <section className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between mb-3"><div><h3 className="text-white font-black text-sm">إطار الترحيب</h3><p className="text-gray-500 text-[10px] mt-1">يضاف إلى حقيبة المستخدم</p></div><span className="text-sky-300 text-xs font-bold">إطار متحرك</span></div>
        {!frames ? <div className="h-24 flex items-center justify-center text-gray-500 text-xs">جاري تحميل الإطارات...</div> : frames.length === 0 ? <p className="text-gray-500 text-xs py-5 text-center">لا توجد إطارات متاحة</p> : (
          <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
            {frames.map((frame: any) => <PickerCard key={frame._id} item={frame} selected={frameId === String(frame._id)} onClick={() => setFrameId(frameId === String(frame._id) ? "" : String(frame._id))} accent="#38bdf8" />)}
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <label className="rounded-2xl p-4" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.22)" }}><span className="text-amber-300 text-xs font-black">🪙 العملات الذهبية</span><input type="number" min="0" value={goldCoins} onChange={(e) => setGoldCoins(e.target.value)} className="w-full mt-3 px-3 py-2 rounded-xl bg-black/20 text-white text-sm outline-none" /></label>
        <label className="rounded-2xl p-4" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.22)" }}><span className="text-purple-300 text-xs font-black">🏅 الأرستقراطية</span><input type="number" min="0" max="50" value={aristocracyLevel} onChange={(e) => setAristocracyLevel(e.target.value)} className="w-full mt-3 px-3 py-2 rounded-xl bg-black/20 text-white text-sm outline-none" /></label>
      </section>

      <button onClick={save} disabled={saving} className="w-full py-4 rounded-2xl font-black text-sm active:scale-95 disabled:opacity-60" style={{ background: "linear-gradient(135deg,#34d399,#0ea5e9)", color: "#06221c", boxShadow: "0 12px 30px rgba(52,211,153,0.2)" }}>{saving ? "جاري الحفظ..." : "حفظ حزمة الترحيب"}</button>
    </div>
  );
}
