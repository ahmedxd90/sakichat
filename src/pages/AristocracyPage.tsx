// تصميم الاستقراطية الجديد: شاشة ملكية داكنة، رتبة مركزية، سحب أفقي بالإصبع، ومميزات حقيقية من Convex.
// هذا الملف يطابق مواصفة الفيديو: ست رتب فقط، شريط تنقل أفقي، شعار مركزي، شبكة مميزات، وشراء لمدة 30/90/365 يومًا.
// @ts-nocheck
import { useMutation, useQuery } from "convex/react";
import { useMemo, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import { toast } from "../lib/toast";
import { BadgeCheck, Coins, Crown, DoorOpen, Gift, Headphones, Home, Image as ImageIcon, Lock, MessageCircle, Palette, Shield, Sparkles, Star, Trophy, UserRound, Gem } from "lucide-react";

interface AristocracyPageProps { onBack: () => void; onAdminAristocracy?: () => void; }

const durationOptions = [
  { days: 30, label: "30 يومًا", note: "الأكثر طلبًا" },
  { days: 90, label: "90 يومًا", note: "توفير 10%" },
  { days: 365, label: "365 يومًا", note: "قيمة سنوية" },
];

function formatCoins(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 ? 2 : 0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 ? 1 : 0)}K`;
  return value.toLocaleString();
}
function rankPrice(rank: any, days: number) { return days === 30 ? rank.price30 : days === 90 ? rank.price90 : rank.price365; }

const LOCAL_RANK_ICONS: Record<number, string> = {
  1: "/assets/aristocracy/general.png",
  2: "/assets/aristocracy/archduke.png",
  3: "/assets/aristocracy/marquis.png",
  4: "/assets/aristocracy/duke.png",
  5: "/assets/aristocracy/king.png",
  6: "/assets/aristocracy/emperor.png",
};
function rankIcon(rank: any) { return LOCAL_RANK_ICONS[rank?.level] ?? rank?.iconUrl ?? ""; }
const FEATURE_ICONS: Record<string, any> = { "شارة": BadgeCheck, "مكافأة": Coins, "اسم": Palette, "دخول": DoorOpen, "مركبة": DoorOpen, "فقاعة": MessageCircle, "إطار": ImageIcon, "أولوية": Star, "لقب": Crown, "إهداء": Gift, "هدايا": Gift, "لوحة": Trophy, "وسام": Trophy, "دعم": Headphones, "خدمة": Headphones, "غرفة": Home, "قصر": Home, "حماية": Shield, "معرف": UserRound, "إيموجي": Sparkles, "تجربة": Gem, "تسريع": Sparkles, "ترقية": Sparkles, "مؤثرات": Sparkles, "كل": Gem, "ظهور": Star };
function featureIcon(title: string) { const found = Object.keys(FEATURE_ICONS).find((key) => title.includes(key)); return FEATURE_ICONS[found ?? "شارة"] ?? BadgeCheck; }

export default function AristocracyPage({ onBack, onAdminAristocracy }: AristocracyPageProps) {
  const status = useQuery(api.aristocracy.getAristocracyStatus);
  const profile = useQuery(api.profiles.getMyProfile);
  const purchase = useMutation(api.aristocracy.purchaseAristocracy);
  const giftAristocracy = useMutation(api.aristocracy.giftAristocracy);
  const claimDaily = useMutation(api.aristocracy.claimDailyAristocracyCoins);
  const inventory = useQuery(api.aristocracy.getAristocracyInventory) ?? [];
  const activateInventory = useMutation(api.aristocracy.activateAristocracyInventory);
  const giftFromInventory = useMutation(api.aristocracy.giftAristocracyFromInventory);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [duration, setDuration] = useState(30);
  const [busy, setBusy] = useState<"buy" | "claim" | "gift" | null>(null);
  const [showBuy, setShowBuy] = useState(false);
  const [showGift, setShowGift] = useState(false);
  const [targetSakiId, setTargetSakiId] = useState("");
  const [giftDays, setGiftDays] = useState(3);
  const [showBag, setShowBag] = useState(false);
  const [bagItem, setBagItem] = useState<any>(null);
  const [bagGiftTarget, setBagGiftTarget] = useState("");
  const touchStart = useRef<number | null>(null);
  const pointerStart = useRef<number | null>(null);

  const ranks = useMemo(() => ((status?.ranks ?? []) as any[]).filter((rank) => rank.level >= 1 && rank.level <= 6), [status?.ranks]);
  const safeIndex = Math.min(Math.max(selectedIndex, 0), Math.max(ranks.length - 1, 0));
  const rank = ranks[safeIndex];
  const activeLevel = status?.isActive ? status.level : 0;
  const isCurrent = Boolean(rank && activeLevel === rank.level);
  const price = rank ? rankPrice(rank, duration) : 0;

  const move = (direction: 1 | -1) => setSelectedIndex((current) => Math.min(Math.max(current + direction, 0), Math.max(ranks.length - 1, 0)));
  const onTouchStart = (event: React.TouchEvent) => { touchStart.current = event.touches[0]?.clientX ?? null; };
  const onTouchEnd = (event: React.TouchEvent) => { if (touchStart.current == null) return; const delta = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current; if (Math.abs(delta) > 42) move(delta < 0 ? 1 : -1); touchStart.current = null; };
  const onPointerDown = (event: React.PointerEvent) => { pointerStart.current = event.clientX; };
  const onPointerUp = (event: React.PointerEvent) => { if (pointerStart.current == null) return; const delta = event.clientX - pointerStart.current; if (Math.abs(delta) > 42) move(delta < 0 ? 1 : -1); pointerStart.current = null; };

  const handleBuy = async () => {
    if (!rank || busy) return;
    setBusy("buy");
    try { const result = await purchase({ level: rank.level, durationDays: duration }); toast.success(`تم تفعيل رتبة ${result.rank.nameAr} لمدة ${result.daysLeft} يومًا`); setShowBuy(false); }
    catch (error: any) { toast.error(error?.message || "تعذر إتمام الشراء"); }
    finally { setBusy(null); }
  };
  const handleGift = async () => {
    if (!rank || busy || !profile?.isSuperAdmin || !targetSakiId.trim()) return;
    setBusy("gift");
    try {
      const result = await giftAristocracy({ targetSakiId: targetSakiId.trim(), level: rank.level, durationDays: giftDays });
      toast.success(`تم إهداء ${result.rank.nameAr} مجانًا إلى ${result.targetName} لمدة ${result.days} يومًا`);
      setTargetSakiId(""); setShowGift(false);
    } catch (error: any) { toast.error(error?.message || "تعذر إهداء الأرستقراطية"); }
    finally { setBusy(null); }
  };

  const handleActivateInventory = async (item: any) => {
    if (busy) return;
    setBusy("buy");
    try { await activateInventory({ inventoryId: item._id }); toast.success("تم تفعيل رتبة الأرستقراطية"); setShowBag(false); }
    catch (error: any) { toast.error(error?.message || "لا يمكن تفعيل هذه الرتبة"); }
    finally { setBusy(null); }
  };

  const handleGiftInventory = async () => {
    if (!bagItem || !bagGiftTarget.trim() || busy) return;
    setBusy("gift");
    try { const result = await giftFromInventory({ inventoryId: bagItem._id, targetSakiId: bagGiftTarget.trim() }); toast.success(`تم إهداء الرتبة إلى ${result.targetName}`); setBagItem(null); setBagGiftTarget(""); }
    catch (error: any) { toast.error(error?.message || "تعذر إهداء الرتبة"); }
    finally { setBusy(null); }
  };

  const handleClaim = async () => {
    if (busy || !status?.isActive) return;
    setBusy("claim");
    try { const result = await claimDaily({}); toast.success(`تم استلام ${Number(result.coinsEarned).toLocaleString()} عملة ذهبية`); }
    catch (error: any) { toast.error(error?.message || "المكافأة اليومية غير متاحة الآن"); }
    finally { setBusy(null); }
  };

  if (status === undefined || profile === undefined) return <div className="flex min-h-screen items-center justify-center bg-[#08070d] text-white"><div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" /></div>;
  if (!rank) return <div className="flex min-h-screen items-center justify-center bg-[#08070d] p-6 text-center text-white" dir="rtl">لا توجد رتب استقراطية متاحة حاليًا.</div>;

  return (
    <main className="relative min-h-screen overflow-x-hidden overflow-y-visible text-white" dir="rtl" style={{ background: rank.bgGradient, touchAction: "pan-y" }}>
      <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl" style={{ background: rank.color, opacity: .14 }} />
      <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 15% 20%, rgba(255,255,255,.5) 0 1px, transparent 1px), radial-gradient(circle at 75% 35%, rgba(255,255,255,.35) 0 1px, transparent 1px)", backgroundSize: "90px 90px, 130px 130px" }} />
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-black/20 px-4 py-3 backdrop-blur-xl">
        <button onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl active:scale-90" aria-label="رجوع">‹</button>
        <div className="text-center"><p className="text-[10px] font-bold tracking-[.28em] text-white/50">SAKI ROYAL SOCIETY</p><h1 className="text-lg font-black">الاستقراطية</h1></div>
        <button onClick={() => setShowBag(true)} className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-amber-200 active:scale-90" aria-label="حقيبة الأرستقراطية"><span className="text-lg">▣</span>{inventory.filter((item: any) => item.status === "available").length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-300 px-1 text-[9px] font-black text-black">{inventory.filter((item: any) => item.status === "available").length}</span>}</button>
      </header>
      <section className="relative z-10 px-4 pb-32 pt-4" style={{ touchAction: "pan-y" }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <div className="mb-4 flex items-center justify-between"><div><p className="text-[11px] font-bold text-white/50">اسحب لاكتشاف الرتب</p><p className="text-sm font-black">{safeIndex + 1} / {ranks.length}</p></div><div className="flex gap-1.5">{ranks.map((item, index) => <button key={item.level} onClick={() => setSelectedIndex(index)} className="h-1.5 rounded-full transition-all" style={{ width: index === safeIndex ? 28 : 8, background: index === safeIndex ? rank.color : "rgba(255,255,255,.25)" }} aria-label={`رتبة ${item.nameAr}`} />)}</div></div>
        <div className="mb-5 flex gap-2 overflow-x-auto overscroll-x-contain pb-1 scrollbar-none" style={{ touchAction: "pan-x" }}>{ranks.map((item, index) => <button key={item.level} onClick={() => setSelectedIndex(index)} className="shrink-0 rounded-2xl border px-3 py-2 text-xs font-black transition-all" style={{ borderColor: index === safeIndex ? item.color : "rgba(255,255,255,.12)", background: index === safeIndex ? `${item.color}22` : "rgba(0,0,0,.14)", color: index === safeIndex ? item.color : "rgba(255,255,255,.62)" }}>{item.nameAr}</button>)}</div>
        <div className="relative mx-auto flex max-w-md flex-col items-center rounded-[32px] border border-white/10 bg-black/20 px-5 pb-6 pt-5 shadow-2xl backdrop-blur-md">
          <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-white/60">LV.{rank.level}</div>
          <div className="relative mt-2 flex h-48 w-48 items-center justify-center"><div className="absolute inset-8 rounded-full blur-3xl" style={{ background: rank.color, opacity: .38, animation: "aristo-glow 2.6s ease-in-out infinite" }} /><div className="absolute inset-3 rounded-full border border-white/10" style={{ boxShadow: `0 0 36px ${rank.glowColor}` }} /><img src={rankIcon(rank)} alt={rank.nameAr} className="relative z-10 h-44 w-44 object-contain drop-shadow-2xl" style={{ animation: "aristo-float 3s ease-in-out infinite" }} onError={(event) => { const image = event.currentTarget; if (image.src.endsWith(".png")) image.style.display = "none"; }} /></div>
          <p className="text-[10px] font-bold tracking-[.34em] text-white/45">ARISTOCRACY RANK</p><h2 className="mt-1 bg-clip-text text-3xl font-black text-transparent" style={{ backgroundImage: rank.gradient, filter: `drop-shadow(0 0 10px ${rank.glowColor})` }}>{rank.nameAr}</h2><div className="mt-3 rounded-full border border-white/10 bg-black/20 px-4 py-1.5 text-xs font-bold text-white/70">{rank.features.length} ميزة حصرية</div>
          {isCurrent && <div className="mt-2 rounded-full px-3 py-1 text-[11px] font-black" style={{ color: rank.color, background: `${rank.color}18` }}>رتبتك الحالية · {status.daysLeft} يوم متبقٍ</div>}
        </div>
        <div className="mx-auto mt-5 max-w-md"><div className="mb-3 flex items-center justify-between"><h3 className="font-black">مميزات {rank.nameAr}</h3><span className="text-xs font-bold text-white/45">{rank.features.length} / 20</span></div><div className="grid grid-cols-2 gap-2.5">{rank.features.map((feature: any, index: number) => <div key={`${feature.title}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-3"><div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl border" style={{ color: rank.color, borderColor: `${rank.color}55`, background: `${rank.color}15`, boxShadow: `0 0 14px ${rank.glowColor}` }}>{(() => { const FeatureIcon = featureIcon(feature.title); return <FeatureIcon size={18} strokeWidth={2.4} />; })()}</div><p className="text-xs font-black">{feature.title}</p><p className="mt-1 text-[10px] leading-4 text-white/50">{feature.desc}</p></div>)}</div></div>
        <div className="mx-auto mt-5 max-w-md rounded-3xl border border-white/10 bg-black/25 p-4"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold text-white/50">رصيدك الحالي</p><p className="mt-1 text-lg font-black text-amber-300">{formatCoins(status.goldCoins)} <span className="text-xs">عملة ذهبية</span></p></div><button onClick={handleClaim} disabled={!status.isActive || busy !== null} className="rounded-xl px-3 py-2 text-[11px] font-black disabled:opacity-40" style={{ background: `${rank.color}22`, color: rank.color }}>{busy === "claim" ? "جارٍ..." : "استلام اليومية"}</button></div></div>
        <p className="mt-4 text-center text-[10px] text-white/35">اسحب الشاشة أفقيًا أو استخدم أزرار الرتب لاستعراض المميزات</p>
      </section>
      {showBag && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 backdrop-blur-sm" onClick={() => setShowBag(false)}><div className="w-full max-w-md rounded-[30px] border border-amber-200/15 bg-[#15111d] p-5" onClick={(event) => event.stopPropagation()}><div className="mb-4 flex items-center justify-between"><div><h3 className="text-xl font-black text-amber-100">حقيبة الأرستقراطية</h3><p className="text-xs text-white/45">الرتب التي تملكها ولم تُفعّل بعد</p></div><button onClick={() => setShowBag(false)} className="text-xl text-white/60">×</button></div>{inventory.filter((item: any) => item.status === "available").length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/50">الحقيبة فارغة. اشترِ رتبة لتظهر هنا.</div> : <div className="max-h-[55vh] space-y-3 overflow-y-auto">{inventory.filter((item: any) => item.status === "available").map((item: any) => { const itemRank = ranks.find((entry: any) => entry.level === item.level) ?? { nameAr: `رتبة ${item.level}`, color: "#fbbf24", glowColor: "rgba(251,191,36,.7)" }; return <div key={item._id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"><img src={rankIcon(itemRank)} alt={itemRank.nameAr} className="h-16 w-16 object-contain" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-black" style={{ color: itemRank.color }}>{itemRank.nameAr}</p><p className="mt-1 text-[11px] text-white/55">المدة: {item.durationDays} يومًا</p><p className="text-[10px] text-emerald-300">جاهزة للتفعيل أو الإهداء</p></div><div className="flex flex-col gap-2"><button onClick={() => handleActivateInventory(item)} disabled={busy !== null} className="rounded-xl px-3 py-2 text-[10px] font-black text-black" style={{ background: itemRank.gradient ?? "linear-gradient(135deg,#fbbf24,#f59e0b)" }}>تفعيل</button><button onClick={() => setBagItem(item)} disabled={busy !== null} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[10px] font-black">إهداء</button></div></div>; })}</div>}{bagItem && <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3"><p className="text-sm font-black text-amber-100">تأكيد إهداء الرتبة</p><p className="mt-1 text-[11px] text-white/55">لن يتم تفعيلها لديك. ستنتقل إلى حقيبة المستخدم المستلم.</p><input value={bagGiftTarget} onChange={(event) => setBagGiftTarget(event.target.value)} placeholder="Saki ID للمستلم" dir="ltr" className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs outline-none" /><button onClick={handleGiftInventory} disabled={!bagGiftTarget.trim() || busy !== null} className="mt-3 w-full rounded-xl bg-amber-300 py-2.5 text-xs font-black text-black disabled:opacity-40">{busy === "gift" ? "جارٍ الإهداء..." : "تأكيد الإهداء"}</button></div>}</div></div>}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/15 bg-[#0d0b16]/95 p-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(0,0,0,.45)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <button onClick={() => setShowBuy(true)} className="flex-1 rounded-2xl py-3 text-xs font-black text-black shadow-lg active:scale-[.98]" style={{ background: rank.gradient, boxShadow: `0 0 20px ${rank.glowColor}` }}>{isCurrent ? "تمديد الرتبة" : `شراء · ${formatCoins(price)}`}</button>
          {profile?.isSuperAdmin && <button onClick={() => setShowGift(true)} className="flex-1 rounded-2xl border border-amber-300/50 bg-amber-300/15 py-3 text-xs font-black text-amber-200 active:scale-[.98]">إهداء · مجاني</button>}
        </div>
      </div>
      {showGift && profile?.isSuperAdmin && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm" onClick={() => setShowGift(false)}><div className="w-full max-w-md rounded-[28px] border border-amber-300/20 bg-[#161320] p-5" onClick={(event) => event.stopPropagation()}><div className="mb-4 flex items-center justify-between"><div><h3 className="text-lg font-black text-amber-200">إهداء استقراطية مجانًا</h3><p className="text-xs text-white/45">متاح للسوبر أدمن فقط</p></div><button onClick={() => setShowGift(false)} className="text-xl text-white/60">×</button></div><input value={targetSakiId} onChange={(event) => setTargetSakiId(event.target.value)} placeholder="أدخل Saki ID للمستخدم" dir="ltr" className="mb-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-300/60" /><div className="grid grid-cols-4 gap-2">{[3, 5, 14, 30].map((days) => <button key={days} onClick={() => setGiftDays(days)} className="rounded-xl border p-2 text-center text-xs font-black" style={{ borderColor: giftDays === days ? "#fbbf24" : "rgba(255,255,255,.1)", background: giftDays === days ? "rgba(251,191,36,.18)" : "rgba(255,255,255,.04)", color: giftDays === days ? "#fcd34d" : "rgba(255,255,255,.65)" }}>{days} يوم</button>)}</div><button onClick={handleGift} disabled={!targetSakiId.trim() || busy !== null} className="mt-4 w-full rounded-2xl bg-gradient-to-r from-amber-300 to-yellow-500 py-3.5 text-sm font-black text-black disabled:opacity-40">{busy === "gift" ? "جارٍ الإهداء..." : `إهداء مجانًا · ${giftDays} يوم`}</button></div></div>}
      {showBuy && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm" onClick={() => setShowBuy(false)}><div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#161320] p-5" onClick={(event) => event.stopPropagation()}><div className="mb-4 flex items-center justify-between"><div><h3 className="text-lg font-black">تفعيل {rank.nameAr}</h3><p className="text-xs text-white/45">اختر مدة الاشتراك</p></div><button onClick={() => setShowBuy(false)} className="text-xl text-white/60">×</button></div><div className="grid grid-cols-3 gap-2">{durationOptions.map((item) => <button key={item.days} onClick={() => setDuration(item.days)} className="rounded-2xl border p-3 text-center" style={{ borderColor: duration === item.days ? rank.color : "rgba(255,255,255,.1)", background: duration === item.days ? `${rank.color}18` : "rgba(255,255,255,.04)" }}><p className="text-xs font-black">{item.label}</p><p className="mt-1 text-[10px] text-white/45">{item.note}</p><p className="mt-2 text-xs font-black" style={{ color: rank.color }}>{formatCoins(rankPrice(rank, item.days))}</p></button>)}</div><button onClick={handleBuy} disabled={busy !== null} className="mt-4 w-full rounded-2xl py-3.5 text-sm font-black text-black disabled:opacity-50" style={{ background: rank.gradient }}>{busy === "buy" ? "جارٍ التفعيل..." : `تأكيد · ${formatCoins(price)} عملة`}</button></div></div>}
      <style>{`@keyframes aristo-glow{0%,100%{transform:scale(.9);opacity:.25}50%{transform:scale(1.1);opacity:.52}}@keyframes aristo-float{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-7px) rotate(1deg)}}`}</style>
    </main>
  );
}
