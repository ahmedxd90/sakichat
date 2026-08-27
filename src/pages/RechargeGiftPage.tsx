import React, { useRef, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

interface RechargeGiftPageProps { onBack: () => void; }

const DEFAULT_BANNER = "https://l.top4top.io/p_38848efnl0.png";

function RewardIcon({ type, label, duration }: { type: "frame" | "entry" | "rank"; label: string; duration: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300/60 bg-gradient-to-br from-[#5d0717] via-[#90142d] to-[#2b0610] shadow-[0_0_18px_rgba(245,158,11,.25)]">
        {type === "frame" && <svg width="34" height="34" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="#f8d37a" strokeWidth="1.7"/><circle cx="12" cy="12" r="6" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="2 2"/><path d="m12 7 1.5 3 3.3.5-2.4 2.3.6 3.2-3-1.6-3 1.6.6-3.2-2.4-2.3 3.3-.5L12 7Z" fill="#fbbf24"/></svg>}
        {type === "entry" && <svg width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="M12 3 14 8l5 .4-3.8 3.3 1.2 5-4.4-2.7L7.6 17l1.2-5L5 8.4 10 8l2-5Z" fill="#f8d37a"/><path d="M4 19c2-2 4-2 6 0 2-2 4-2 6 0 1.4-1.4 2.8-1.7 4-.8" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round"/></svg>}
        {type === "rank" && <svg width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="m4 17 2-8 4 4 2-7 3 7 4-4 1 8H4Z" fill="#fbbf24" stroke="#fff0a6" strokeWidth=".8"/><path d="M5 19h14" stroke="#f8d37a" strokeWidth="2" strokeLinecap="round"/></svg>}
        <span className="absolute -right-1 -top-1 rounded-full bg-amber-300 px-1.5 py-0.5 text-[8px] font-black text-[#55101b]">هدية</span>
      </div>
      <span className="max-w-[78px] truncate text-center text-[10px] font-bold text-white">{label}</span>
      <span className="text-[9px] text-amber-200/70">{duration}</span>
    </div>
  );
}

export default function RechargeGiftPage({ onBack }: RechargeGiftPageProps) {
  const [showAdmin, setShowAdmin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: "هدية شحن لواء", minimumDollars: 100, frameItemId: "", entryItemId: "", giftId: "", giftQuantity: 1, aristocracyLevel: 1, aristocracyDays: 3, proLevel: 0, proDays: 0, customTitle: "", googlePlay: true, agent: true });
  
  const [myProfile, setMyProfile] = useState<any>(null);
  const [catalog, setCatalog] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [eligibility, setEligibility] = useState<any>(null);
  const [rechargeGiftSettings, setRechargeGiftSettings] = useState<any>(null);
  const [adminPackages, setAdminPackages] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
        setMyProfile(p);
        const { data: elig } = await supabase.from('recharge_eligibility').select('*').eq('user_id', user.id).single();
        setEligibility(elig);
      }
      const { data: pkgs } = await supabase.from('recharge_packages').select('*, frame:store_items(*), entry:store_items(*), gift:custom_gifts(*)').eq('is_active', true);
      setPackages(pkgs || []);
      const { data: sett } = await supabase.from('recharge_settings').select('*').single();
      setRechargeGiftSettings(sett);
    };
    fetchData();
  }, []);

  const savePackage = async (args: any) => {};
  const claimPackage = async (args: any) => {};
  const generateBannerUploadUrl = async (args: any) => "";
  const saveBanner = async (args: any) => {};

  const bannerUrl = bannerPreview ?? rechargeGiftSettings?.banner_url ?? DEFAULT_BANNER;
  const rechargeAmount = (eligibility?.google_play_dollars ?? 0) + (eligibility?.agent_dollars ?? 0);
  const submitPackage = async () => {
    if (!form.googlePlay && !form.agent) return;
    setSaving(true);
    try {
      await savePackage({ packageId: editingId || undefined as any, name: form.name, minimumDollars: Number(form.minimumDollars), acceptedSources: [form.googlePlay ? "google_play" : null, form.agent ? "agent" : null].filter(Boolean) as any, frameItemId: form.frameItemId || undefined as any, entryItemId: form.entryItemId || undefined as any, giftId: form.giftId || undefined as any, giftQuantity: Number(form.giftQuantity) || 1, aristocracyLevel: Number(form.aristocracyLevel) || undefined, aristocracyDays: Number(form.aristocracyDays) || undefined, proLevel: Number(form.proLevel) || undefined, proDays: Number(form.proDays) || undefined, customTitle: form.customTitle || undefined, isActive: true });
      setEditingId(null);
      setForm({ name: "هدية شحن جديدة", minimumDollars: 100, frameItemId: "", entryItemId: "", giftId: "", giftQuantity: 1, aristocracyLevel: 0, aristocracyDays: 0, proLevel: 0, proDays: 0, customTitle: "", googlePlay: true, agent: true });
    } finally { setSaving(false); }
  };
  const startNewPackage = () => { setEditingId(null); setForm({ name: "هدية شحن جديدة", minimumDollars: 100, frameItemId: "", entryItemId: "", giftId: "", giftQuantity: 1, aristocracyLevel: 0, aristocracyDays: 0, proLevel: 0, proDays: 0, customTitle: "", googlePlay: true, agent: true }); };
  const editPackage = (pkg: any) => { setEditingId(String(pkg.id)); setForm({ name: pkg.name ?? "", minimumDollars: pkg.minimum_dollars ?? 100, frameItemId: pkg.frame_item_id ? String(pkg.frame_item_id) : "", entryItemId: pkg.entry_item_id ? String(pkg.entry_item_id) : "", giftId: pkg.gift_id ? String(pkg.gift_id) : "", giftQuantity: pkg.gift_quantity ?? 1, aristocracyLevel: pkg.aristocracy_level ?? 0, aristocracyDays: pkg.aristocracy_days ?? 0, proLevel: pkg.pro_level ?? 0, proDays: pkg.pro_days ?? 0, customTitle: pkg.custom_title ?? "", googlePlay: pkg.accepted_sources?.includes("google_play") ?? true, agent: pkg.accepted_sources?.includes("agent") ?? true }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const uploadBanner = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setBannerPreview(URL.createObjectURL(file));
    setBannerUploading(true);
    try {
      const uploadUrl = await generateBannerUploadUrl({});
      const response = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      if (!response.ok) throw new Error("فشل رفع الصورة");
      const { storageId } = await response.json();
      await saveBanner({ storageId });
      setBannerPreview(null);
    } finally { setBannerUploading(false); }
  };

  if (showAdmin && myProfile?.isSuperAdmin) return (
    <div dir="rtl" className="h-full min-h-0 overflow-y-auto overscroll-contain touch-pan-y bg-[#18040b] text-white" style={{ WebkitOverflowScrolling: "touch" }}><div className="mx-auto min-h-full w-full max-w-md bg-[linear-gradient(160deg,#4c0817,#19030a_58%,#0b0306)] pb-10">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-amber-200/15 bg-[#2b0610]/90 px-4 backdrop-blur-xl"><button onClick={() => setShowAdmin(false)} className="h-9 w-9 rounded-full bg-white/10 text-xl">›</button><h1 className="text-sm font-black text-amber-100">إدارة هدايا الشحن</h1><button onClick={startNewPackage} className="rounded-lg bg-amber-300/15 px-2 py-1 text-[10px] font-black text-amber-100">+ حزمة</button></header>
      <div className="relative"><img src={bannerUrl} alt="بنر هدية الشحن" className="h-32 w-full object-cover" /><button onClick={() => bannerInputRef.current?.click()} disabled={bannerUploading} className="absolute bottom-3 left-3 rounded-xl border border-amber-200/60 bg-[#3b0712]/90 px-3 py-2 text-[11px] font-black text-amber-100 disabled:opacity-50">{bannerUploading ? "جارٍ رفع البنر..." : "إضافة بنر"}</button><input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={e => uploadBanner(e.target.files?.[0])} /></div>
      <div className="space-y-3 p-4">
        <p className="rounded-xl border border-amber-300/25 bg-amber-200/10 p-3 text-[10px] leading-5 text-amber-100/80">اختر عناصر حقيقية من المتجر والهدايا والرتب. يمكنك إضافة عدد غير محدود من الحزم؛ لا تصبح الحزمة قابلة للاستلام إلا بعد تحقق الشحن من Google Play أو تسجيل وكيل شحن معتمد.</p>
        {catalog === undefined ? <div className="rounded-xl bg-white/5 p-4 text-center text-xs text-amber-100/70">جارٍ تحميل عناصر المتجر والهدايا…</div> : null}
        <div className="flex items-center justify-between"><h2 className="text-xs font-black text-amber-100">{editingId ? "تعديل الحزمة" : "إضافة حزمة جديدة"}</h2><span className="text-[10px] text-amber-200/65">{adminPackages?.length ?? 0} حزمة</span></div>
        <Field label="اسم الحزمة"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="قيمة الشحن بالدولار"><input type="number" value={form.minimumDollars} onChange={e => setForm({ ...form, minimumDollars: Number(e.target.value) })} /></Field>
        <div className="grid grid-cols-2 gap-2"><Toggle checked={form.googlePlay} onChange={v => setForm({ ...form, googlePlay: v })} label="Google Play" /><Toggle checked={form.agent} onChange={v => setForm({ ...form, agent: v })} label="وكيل شحن" /></div>
        <Picker label="إطار متحرك من المتجر" value={form.frameItemId} onChange={v => setForm({ ...form, frameItemId: v })} items={catalog?.frames ?? []} />
        <Picker label="دخولية من المتجر" value={form.entryItemId} onChange={v => setForm({ ...form, entryItemId: v })} items={catalog?.entries ?? []} />
        <Picker label="هدية من الحقيبة" value={form.giftId} onChange={v => setForm({ ...form, giftId: v })} items={catalog?.gifts ?? []} />
        <div className="grid grid-cols-2 gap-2"><Field label="عدد الهدايا"><input type="number" value={form.giftQuantity} onChange={e => setForm({ ...form, giftQuantity: Number(e.target.value) })} /></Field><Field label="لقب مخصص"><input value={form.customTitle} onChange={e => setForm({ ...form, customTitle: e.target.value })} placeholder="مثال: فارس الشحن" /></Field></div>
        <Picker label="رتبة الأرستقراطية" value={String(form.aristocracyLevel || "")} onChange={v => setForm({ ...form, aristocracyLevel: Number(v) })} items={(catalog?.ranks ?? []).map((r: any) => ({ _id: String(r.level), name: r.name, imageUrl: r.iconUrl }))} />
        <div className="grid grid-cols-2 gap-2"><Field label="مدة الأرستقراطية (أيام)"><input type="number" value={form.aristocracyDays} onChange={e => setForm({ ...form, aristocracyDays: Number(e.target.value) })} /></Field><Field label="مستوى PRO"><input type="number" value={form.proLevel} onChange={e => setForm({ ...form, proLevel: Number(e.target.value) })} /></Field></div>
        <Field label="مدة PRO (أيام)"><input type="number" value={form.proDays} onChange={e => setForm({ ...form, proDays: Number(e.target.value) })} /></Field>
        <button onClick={submitPackage} disabled={saving || catalog === undefined || !catalog?.allowed} className="w-full rounded-2xl bg-gradient-to-l from-amber-200 via-amber-400 to-orange-500 py-3 text-sm font-black text-[#4a0712] disabled:opacity-50">{saving ? "جارٍ حفظ الحزمة..." : editingId ? "حفظ التعديلات" : "حفظ وإضافة الحزمة"}</button>
        <div className="space-y-2 pt-3"><h2 className="text-xs font-black text-amber-100">الحزم الحالية</h2>{adminPackages === undefined ? <div className="rounded-xl bg-white/5 p-3 text-xs text-white/55">جارٍ تحميل الحزم…</div> : adminPackages.length === 0 ? <div className="rounded-xl border border-dashed border-amber-200/20 p-3 text-xs text-white/50">لا توجد حزم بعد. أضف أول حزمة من النموذج أعلاه.</div> : adminPackages.map((pkg: any) => <button key={pkg.id} onClick={() => editPackage(pkg)} className="flex w-full items-center justify-between rounded-2xl border border-amber-200/20 bg-black/20 p-3 text-right"><div className="flex min-w-0 items-center gap-2">{(pkg.frame?.imageUrl || pkg.entry?.imageUrl || pkg.gift?.imageUrl) ? <img src={pkg.frame?.imageUrl || pkg.entry?.imageUrl || pkg.gift?.imageUrl} alt="" className="h-10 w-10 rounded-xl object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/15 text-amber-200">VIP</span>}<span className="min-w-0"><b className="block truncate text-xs text-amber-100">{pkg.name}</b><small className="text-[10px] text-white/55">${pkg.minimum_dollars} · {pkg.is_active ? "نشطة" : "موقوفة"}</small></span></div><span className="text-[10px] font-black text-amber-200">تعديل</span></button>)}</div>
      </div>
    </div></div>
  );

  return (
    <div dir="rtl" className="h-full min-h-0 overflow-y-auto overscroll-contain touch-pan-y bg-[#16050b] text-white" style={{ WebkitOverflowScrolling: "touch" }}>
      <div className="mx-auto min-h-full w-full max-w-md bg-[radial-gradient(circle_at_50%_-10%,rgba(155,25,48,.65),transparent_45%),linear-gradient(180deg,#3a0712,#14050a_58%,#0b0306)] pb-10">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-amber-200/10 bg-[#2b0610]/90 px-4 backdrop-blur-xl">
          <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl text-amber-100 active:scale-95">›</button>
          <h1 className="text-base font-black text-amber-100">هدايا إعادة الشحن VIP</h1>
          {myProfile?.isSuperAdmin ? <button onClick={() => setShowAdmin(true)} className="rounded-xl border border-amber-300/45 bg-amber-300/15 px-2 py-1 text-[10px] font-black text-amber-100">إدارة</button> : <span className="w-9" />}
        </header>

        <section className="relative overflow-hidden border-b border-amber-300/20">
          <img src={bannerUrl} alt="هدية الشحن" className="h-[145px] w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#16050b] via-transparent to-transparent" />
        </section>

        <section className="space-y-3 px-4 pt-4">
          {packages.length === 0 ? <div className="rounded-3xl border border-dashed border-amber-300/25 bg-black/15 p-7 text-center text-xs leading-6 text-amber-100/65">لا توجد حزم شحن نشطة حاليًا. سيظهر هنا كل ما ينشره السوبر أدمن من حزم ومكافآت وصور مصغرة.</div> : packages.map((pkg: any) => {
            const packageClaimed = Boolean(eligibility?.claimed_package_ids?.some((id: any) => String(id) === String(pkg.id)));
            const eligible = rechargeAmount >= pkg.minimum_dollars;
            return <div key={pkg.id} className="rounded-3xl border border-amber-300/55 bg-gradient-to-br from-[#6f0d21] via-[#420815] to-[#23040c] p-4 shadow-[0_12px_35px_rgba(0,0,0,.35),0_0_22px_rgba(245,158,11,.15)]">
              <div className="mb-3 flex items-center justify-between"><span className="rounded-full border border-amber-300/45 bg-amber-300/15 px-3 py-1 text-[10px] font-black text-amber-100">{pkg.name}</span><strong className="text-xl text-amber-300">${pkg.minimum_dollars}</strong></div>
              <div className="grid grid-cols-3 gap-2 border-t border-amber-200/15 pt-4">
                <RewardThumb fallback="frame" item={pkg.frame} label="إطار متحرك" duration={`${pkg.pro_days ?? 3} أيام`} />
                <RewardThumb fallback="entry" item={pkg.entry} label="دخولية" duration={`${pkg.pro_days ?? 3} أيام`} />
                <RewardThumb fallback="rank" item={pkg.gift ?? (pkg.aristocracy_level ? { name: `رتبة ${pkg.aristocracy_level}` } : null)} label={pkg.gift?.name ?? "رتبة الأرستقراطية"} duration={pkg.aristocracy_days ? `${pkg.aristocracy_days} أيام` : "هدية"} />
              </div>
              {pkg.custom_title && <p className="mt-3 text-center text-[10px] font-black text-amber-200">اللقب: {pkg.custom_title}</p>}
              <button onClick={() => claimPackage({ packageId: pkg.id })} disabled={packageClaimed || !eligible} className={`mt-5 w-full rounded-2xl py-3 text-sm font-black transition ${packageClaimed ? "bg-emerald-500/25 text-emerald-200" : eligible ? "bg-gradient-to-l from-amber-200 via-amber-400 to-orange-500 text-[#4a0712] shadow-[0_0_22px_rgba(245,158,11,.35)]" : "bg-white/10 text-white/35"}`}>{packageClaimed ? "تم استلام المكافأة" : eligible ? "استلام المكافأة" : `اشحن $${pkg.minimum_dollars} لفتح الاستلام`}</button>
            </div>;
          })}
        </section>

        <section className="px-5 pt-5 text-[10px] leading-6 text-amber-100/55"><h2 className="mb-1 text-xs font-black text-amber-100">القواعد</h2><p>تُستحق المكافأة بعد تحقق عملية الشحن من Google Play أو وكيل الشحن المعتمد. يمكن استلام كل مستوى مرة واحدة خلال مدة الحملة، وتظهر المكافآت المؤهلة فقط بعد تأكيد المعاملة.</p></section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-[11px] font-bold text-amber-100/80"><span className="mb-1.5 block">{label}</span><span className="block [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-amber-200/20 [&_input]:bg-black/25 [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-sm [&_input]:text-white [&_input]:outline-none">{children}</span></label>; }
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) { return <button onClick={() => onChange(!checked)} className={`rounded-xl border px-3 py-2.5 text-xs font-black ${checked ? "border-amber-300/55 bg-amber-300/15 text-amber-100" : "border-white/10 bg-white/5 text-white/45"}`}>{checked ? "✓ " : ""}{label}</button>; }
function Picker({ label, value, onChange, items }: { label: string; value: string; onChange: (value: string) => void; items: any[] }) { const selected = items.find((item: any) => String(item._id) === String(value)); return <div className="rounded-2xl border border-amber-200/15 bg-black/15 p-3"><p className="mb-2 text-[11px] font-bold text-amber-100/80">{label}</p><select value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-xl border border-amber-200/20 bg-[#2b0710] px-3 py-2 text-xs text-white outline-none"><option value="">بدون اختيار</option>{items.map((item: any) => <option key={item._id} value={item._id}>{item.name}</option>)}</select>{selected && <div className="mt-2 flex items-center gap-2 text-xs text-amber-100">{selected.imageUrl && <img src={selected.imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover" />}{selected.name}</div>}</div>; }
function RewardThumb({ fallback, item, label, duration }: { fallback: "frame" | "entry" | "rank"; item: any; label: string; duration: string }) { return item?.imageUrl ? <div className="flex min-w-0 flex-col items-center gap-1.5"><img src={item.imageUrl} alt="" className="h-16 w-16 rounded-2xl border border-amber-300/60 object-cover" /><span className="max-w-[78px] truncate text-center text-[10px] font-bold text-white">{item.name ?? label}</span><span className="text-[9px] text-amber-200/70">{duration}</span></div> : <RewardIcon type={fallback} label={label} duration={duration} />; }
