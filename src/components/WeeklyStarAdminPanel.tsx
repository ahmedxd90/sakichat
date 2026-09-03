// لوحة إدارة النجم الأسبوعي: اختيار هدية الفعالية والجوائز والبنر من بيانات Saki الحقيقية.
import { useMemo, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "../lib/toast";

function Preview({ item, label }: { item: any; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <p className="mb-2 text-[11px] font-black text-white/60">{label}</p>
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 overflow-hidden rounded-xl bg-black/30">
          {item?.resolvedImageUrl ? <img src={item.resolvedImageUrl} alt={item.name ?? label} className="h-full w-full object-cover" /> : null}
        </div>
        <span className="text-xs font-bold text-white/80">{item?.name ?? "لم يتم الاختيار"}</span>
      </div>
    </div>
  );
}

export default function WeeklyStarAdminPanel({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<any>(null);
  const [catalog, setCatalog] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: s } = await supabase.from('weekly_star_settings').select('*').single();
      setSettings(s);
      
      const { data: g } = await supabase.from('gifts').select('*').eq('category', 'event');
      const { data: f } = await supabase.from('store_items').select('*').eq('type', 'frame');
      const { data: e } = await supabase.from('store_items').select('*').eq('type', 'entry');
      setCatalog({ gifts: g || [], frames: f || [], entries: e || [], allowed: true });
    };
    fetchData();
  }, []);

  const [currentGiftId, setCurrentGiftId] = useState<any>(undefined);
  const [nextGiftId, setNextGiftId] = useState<any>(undefined);
  const [title, setTitle] = useState("نجم الأسبوع");
  const [titleIconUrl, setTitleIconUrl] = useState("/assets/icons/icon_week_star.webp");
  const [frameItemId, setFrameItemId] = useState<any>(undefined);
  const [entryItemId, setEntryItemId] = useState<any>(undefined);
  const [aristocracyLevel, setAristocracyLevel] = useState(0);
  const [aristocracyDays, setAristocracyDays] = useState(14);
  const [titleDays, setTitleDays] = useState(14);
  const [firstGold, setFirstGold] = useState(100000);
  const [secondGold, setSecondGold] = useState(50000);
  const [thirdGold, setThirdGold] = useState(25000);
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerStorageId, setBannerStorageId] = useState<any>(undefined);
  const [initialized, setInitialized] = useState(false);

  if (settings && !initialized) {
    setInitialized(true);
    setCurrentGiftId(settings.currentGiftId);
    setNextGiftId(settings.nextGiftId);
    setTitle(settings.title ?? "نجم الأسبوع");
    setTitleIconUrl(settings.titleIconUrl ?? "/assets/icons/icon_week_star.webp");
    setFrameItemId(settings.frameItemId);
    setEntryItemId(settings.entryItemId);
    setAristocracyLevel(settings.aristocracyLevel ?? 0);
    setAristocracyDays(settings.aristocracyDays ?? 14);
    setTitleDays(settings.titleDays ?? 14);
    setFirstGold(settings.firstGold ?? 100000);
    setSecondGold(settings.secondGold ?? 50000);
    setThirdGold(settings.thirdGold ?? 25000);
    setBannerUrl(settings.bannerUrl ?? "");
    setBannerStorageId(settings.bannerStorageId);
  }

  const gifts = catalog?.gifts ?? [];
  const frames = catalog?.frames ?? [];
  const entries = catalog?.entries ?? [];
  const currentGift = useMemo(() => gifts.find((x: any) => x._id === currentGiftId), [gifts, currentGiftId]);
  const nextGift = useMemo(() => gifts.find((x: any) => x._id === nextGiftId), [gifts, nextGiftId]);
  const frame = useMemo(() => frames.find((x: any) => x._id === frameItemId), [frames, frameItemId]);
  const entry = useMemo(() => entries.find((x: any) => x._id === entryItemId), [entries, entryItemId]);

  const uploadBanner = async (file: File) => {
    try {
      const { data, error } = await supabase.storage.from('banners').upload(`weekly-star-${Date.now()}`, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(data.path);
      setBannerUrl(publicUrl);
      toast.success("تم رفع البنر، اضغط حفظ لتثبيته");
    } catch (error: any) {
      toast.error(error?.message ?? "تعذر رفع البنر");
    }
  };

  const handleSave = async () => {
    if (!currentGiftId) {
      toast.error("اختر هدية هذا الأسبوع أولًا");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('weekly_star_settings').upsert({
        id: settings?.id || undefined,
        current_gift_id: currentGiftId,
        next_gift_id: nextGiftId,
        title,
        title_icon_url: titleIconUrl,
        frame_item_id: frameItemId,
        entry_item_id: entryItemId,
        aristocracy_level: aristocracyLevel,
        aristocracy_days: aristocracyDays,
        first_gold: firstGold,
        second_gold: secondGold,
        third_gold: thirdGold,
        title_days: titleDays,
        banner_url: bannerUrl
      });
      if (error) throw error;
      toast.success("تم حفظ إعدادات النجم الأسبوعي");
    } catch (error: any) {
      toast.error(error?.message ?? "تعذر حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[220] overflow-y-auto bg-black/75 p-4" dir="rtl">
      <div className="mx-auto max-w-2xl rounded-3xl border border-amber-300/30 bg-[#1c1028] p-5 text-white shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div><h2 className="font-black text-amber-100">إدارة النجم الأسبوعي</h2><p className="mt-1 text-xs text-white/50">اختيار هدايا الفعاليات والمكافآت الحقيقية للمراكز الثلاثة</p></div>
          <button onClick={onClose} className="rounded-xl bg-white/10 px-3 py-2 text-xs">إغلاق</button>
        </div>
        {!catalog ? <div className="rounded-2xl bg-white/5 p-5 text-center text-sm text-amber-100">جارٍ تحميل كتالوج الهدايا والمتجر…</div> : !catalog.allowed ? <div className="rounded-2xl bg-red-500/10 p-5 text-center text-sm text-red-200">هذه الإدارة متاحة للسوبر أدمن فقط.</div> : (
          <div className="space-y-5">
            <section className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
              <h3 className="mb-3 font-black text-amber-100">هدية الفعالية</h3>
              <p className="mb-3 text-xs text-white/60">تظهر هنا هدايا تبويب «الفعاليات» فقط، والهدية الحالية وحدها تُحتسب في ترتيب النجم.</p>
              <label className="mb-2 block text-xs text-white/70">هدية هذا الأسبوع</label>
              <select value={currentGiftId ?? ""} onChange={(e) => setCurrentGiftId(e.target.value || undefined)} className="w-full rounded-xl bg-black/30 p-3 text-sm text-white"><option value="">اختر الهدية الحالية</option>{gifts.map((g: any) => <option key={g._id} value={g._id}>{g.name}</option>)}</select>
              <div className="mt-3"><Preview item={currentGift} label="المعاينة الحالية" /></div>
              <label className="mb-2 mt-4 block text-xs text-white/70">هدية الأسبوع القادم</label>
              <select value={nextGiftId ?? ""} onChange={(e) => setNextGiftId(e.target.value || undefined)} className="w-full rounded-xl bg-black/30 p-3 text-sm text-white"><option value="">اختر هدية الأسبوع القادم</option>{gifts.map((g: any) => <option key={g._id} value={g._id}>{g.name}</option>)}</select>
              <div className="mt-3"><Preview item={nextGift} label="معاينة الأسبوع القادم" /></div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <h3 className="mb-3 font-black text-white">لقب النجم وأيقونته</h3>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="اسم اللقب" className="mb-3 w-full rounded-xl bg-white/10 p-3 text-sm text-white" />
              <input value={titleIconUrl} onChange={(e) => setTitleIconUrl(e.target.value)} placeholder="رابط أيقونة اللقب المولدة أو المرفوعة" className="w-full rounded-xl bg-white/10 p-3 text-sm text-white" />
              <label className="mt-3 block text-xs text-white/60">مدة اللقب بالأيام</label><input type="number" min={1} value={titleDays} onChange={(e) => setTitleDays(Number(e.target.value))} className="mt-1 w-full rounded-xl bg-white/10 p-3 text-sm text-white" />
            </section>

            <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <h3 className="mb-3 font-black text-white">جوائز المراكز الثلاثة</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{[["الأول", firstGold, setFirstGold], ["الثاني", secondGold, setSecondGold], ["الثالث", thirdGold, setThirdGold]].map(([rank, value, setter]: any) => <div key={rank} className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3"><p className="mb-2 text-xs font-black text-amber-200">المركز {rank}</p><label className="text-[11px] text-white/60">عملات ذهبية</label><input type="number" min={0} value={value} onChange={(e) => setter(Number(e.target.value))} className="mt-1 w-full rounded-xl bg-black/30 p-2 text-sm text-white" /></div>)}</div>
              <div className="mt-4 grid grid-cols-2 gap-3"><div><label className="text-xs text-white/60">رتبة الاستقراطية</label><input type="number" min={0} value={aristocracyLevel} onChange={(e) => setAristocracyLevel(Number(e.target.value))} className="mt-1 w-full rounded-xl bg-white/10 p-2 text-sm text-white" /></div><div><label className="text-xs text-white/60">مدة الاستقراطية</label><input type="number" min={0} value={aristocracyDays} onChange={(e) => setAristocracyDays(Number(e.target.value))} className="mt-1 w-full rounded-xl bg-white/10 p-2 text-sm text-white" /></div></div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-black/20 p-4"><h3 className="mb-3 font-black text-white">عناصر المتجر للمكافأة</h3><div className="grid gap-3 sm:grid-cols-2"><div><select value={frameItemId ?? ""} onChange={(e) => setFrameItemId(e.target.value || undefined)} className="w-full rounded-xl bg-white/10 p-3 text-sm text-white"><option value="">اختر الإطار</option>{frames.map((x: any) => <option key={x._id} value={x._id}>{x.name}</option>)}</select><div className="mt-2"><Preview item={frame} label="الإطار" /></div></div><div><select value={entryItemId ?? ""} onChange={(e) => setEntryItemId(e.target.value || undefined)} className="w-full rounded-xl bg-white/10 p-3 text-sm text-white"><option value="">اختر الدخولية</option>{entries.map((x: any) => <option key={x._id} value={x._id}>{x.name}</option>)}</select><div className="mt-2"><Preview item={entry} label="الدخولية" /></div></div></div></section>

            <section className="rounded-2xl border border-white/10 bg-black/20 p-4"><h3 className="mb-3 font-black text-white">البنر الخارجي</h3><input type="file" accept="image/*,video/*" onChange={(e) => e.target.files?.[0] && uploadBanner(e.target.files[0])} className="w-full rounded-xl bg-white/10 p-3 text-xs text-white" />{bannerUrl ? <img src={bannerUrl} alt="بنر النجم الأسبوعي" className="mt-3 max-h-40 w-full rounded-xl object-cover" /> : null}</section>

            <button onClick={handleSave} disabled={saving} className="w-full rounded-2xl bg-gradient-to-l from-amber-400 to-orange-500 py-4 font-black text-black disabled:opacity-50">{saving ? "جارٍ الحفظ…" : "حفظ إعدادات النجم الأسبوعي"}</button>
          </div>
        )}
      </div>
    </div>
  );
}
