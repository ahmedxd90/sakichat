// @ts-nocheck
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import {
  calcLevelWealth,
  calcLevelCharisma,
  coinsForWealthLevel,
  coinsForCharismaLevel,
  getLevelAsset,
  getLevelColor,
  getLevelTier,
  getLevelTierLabel,
} from "../lib/levelSystem";
import { LevelIconSvg } from "../components/LevelBadgeInline";

const milestones = [10, 20, 30, 40, 50];
const ranges = ["01-10", "11-20", "21-30", "31-40", "41-50"];

function ArrowIcon({ direction = "left" }: { direction?: "left" | "right" }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={direction === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function CoinGlyph({ color = "#fbbf24" }) {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill={`${color}24`} stroke={color} strokeWidth="1.6" /><path d="M14.4 8.9c-.45-.55-1.15-.9-2.1-.9-1.2 0-2 .62-2 1.52 0 2.3 4.6 1.05 4.6 3.4 0 .9-.82 1.58-2.2 1.58-.94 0-1.74-.34-2.22-.98M12.5 7v10" stroke={color} strokeWidth="1.35" strokeLinecap="round" /></svg>;
}
function MicGlyph({ color = "#f472b6" }) {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill={`${color}25`} stroke={color} strokeWidth="1.5" /><path d="M6.5 11.5a5.5 5.5 0 0011 0M12 17v3M9 20h6" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></svg>;
}
function CrownGlyph({ color = "#fbbf24" }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 18h16l-1.5 3h-13L4 18zM4 7l4 4 4-6 4 6 4-4v9H4V7z" fill={`${color}28`} stroke={color} strokeWidth="1.35" strokeLinejoin="round" /></svg>;
}
function SparkleGlyph({ color = "#c084fc" }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2l1.55 6.45L20 10l-6.45 1.55L12 18l-1.55-6.45L4 10l6.45-1.55L12 2zM19 16l.6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16z" fill={color} /></svg>;
}
function formatCoins(value: number) {
  if (!Number.isFinite(value)) return "∞";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(value % 1_000_000_000 ? 1 : 0)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 ? 1 : 0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 ? 1 : 0)}K`;
  return Math.max(0, value).toLocaleString();
}
function clampPercent(value: number) { return Math.max(0, Math.min(100, value)); }

export function LevelBadge({ level, type, size = "md" }: { level: number; type: "wealth" | "charisma"; size?: "sm" | "md" | "lg" }) {
  if (!level || level <= 0) return null;
  return <LevelIconSvg level={level} type={type} size={size === "sm" ? 22 : size === "md" ? 30 : 40} />;
}
export function RoomLevelBadge({ wealthLevel, charismaLevel }: { wealthLevel: number; charismaLevel: number }) {
  if (wealthLevel <= 0 && charismaLevel <= 0) return null;
  return <div className="flex items-center gap-1"><LevelBadge level={wealthLevel} type="wealth" size="sm" /><LevelBadge level={charismaLevel} type="charisma" size="sm" /></div>;
}

function LevelProgress({ current, start, next, color, glow }: { current: number; start: number; next: number; color: string; glow: string }) {
  const progress = clampPercent(next > start ? ((current - start) / (next - start)) * 100 : 100);
  return <div className="space-y-2"><div className="h-3 rounded-full overflow-hidden bg-white/[.07] border border-white/[.05]"><div className="relative h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${color}70, ${color}, #fff8)`, boxShadow: `0 0 18px ${glow}` }}><span className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white/50 to-transparent animate-pulse" /></div></div><div className="flex items-center justify-between text-[10px] text-white/45"><span>{formatCoins(Math.max(0, current - start))} من {formatCoins(Math.max(1, next - start))}</span><span style={{ color }}>{progress.toFixed(1)}%</span></div></div>;
}

function MilestoneCard({ level, type, active }: { level: number; type: "wealth" | "charisma"; active: boolean }) {
  const colors = getLevelColor(level);
  const badgePath = `/assets/level-badges/milestone-lv${level}.png`;
  const [broken, setBroken] = useState(false);
  return <div className="relative overflow-hidden rounded-2xl p-3 transition-all" style={{ background: active ? `linear-gradient(145deg, ${colors.bg}, rgba(7,7,18,.96))` : "rgba(255,255,255,.035)", border: `1px solid ${active ? colors.glow : "rgba(255,255,255,.08)"}`, boxShadow: active ? `0 0 22px ${colors.glow}35` : "none" }}><div className="absolute -top-8 -left-8 w-20 h-20 rounded-full opacity-20" style={{ background: colors.primary, filter: "blur(18px)" }} />{!broken ? <img src={badgePath} alt={`وسام المستوى ${level}`} onError={() => setBroken(true)} className="relative mx-auto w-16 h-16 object-contain drop-shadow-[0_0_14px_rgba(255,255,255,.18)]" /> : <div className="relative mx-auto w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `radial-gradient(circle, ${colors.primary}, ${colors.secondary})`, border: `3px solid ${colors.primary}`, boxShadow: `0 0 18px ${colors.glow}` }}><span className="text-white font-black text-xs">LV{level}</span></div>}<div className="mt-2 text-center"><div className="text-white font-black text-xs">LV{level}</div><div className="mt-0.5 text-[9px]" style={{ color: colors.secondary }}>{type === "wealth" ? "وسام الثروة" : "وسام الكاريزما"}</div></div></div>;
}

function TierCard({ tier, type, active, onClick }: { tier: number; type: "wealth" | "charisma"; active: boolean; onClick: () => void }) {
  const level = tier * 10;
  const colors = getLevelColor(level);
  return <button onClick={onClick} className="relative overflow-hidden text-right rounded-2xl p-3 min-w-[118px] transition-all active:scale-[.97]" style={{ background: active ? `linear-gradient(145deg, ${colors.bg}, rgba(8,8,20,.95))` : "rgba(255,255,255,.035)", border: `1px solid ${active ? colors.glow : "rgba(255,255,255,.08)"}`, boxShadow: active ? `0 0 20px ${colors.glow}30` : "none" }}><div className="flex items-center gap-2"><LevelIconSvg level={level} type={type} size={34} /><div><div className="text-white font-black text-[11px]">LV{(tier - 1) * 10 + 1}–{level}</div><div className="text-[9px] mt-0.5" style={{ color: colors.secondary }}>{colors.tier}</div></div></div></button>;
}

interface LevelPageProps { onBack: () => void; }

export default function LevelPage({ onBack }: LevelPageProps) {
  const profile = useQuery(api.profiles.getMyProfile);
  const [activeTab, setActiveTab] = useState<"wealth" | "charisma">("wealth");
  const [selectedTier, setSelectedTier] = useState(0);

  if (!profile) return <div className="h-full flex items-center justify-center bg-[#080814]"><div className="w-9 h-9 rounded-full border-2 border-fuchsia-400 border-t-transparent animate-spin" /></div>;

  const totalSent = profile.totalCoinsSent ?? 0;
  const totalReceived = profile.totalCoinsReceived ?? 0;
  const wealthLevel = calcLevelWealth(totalSent);
  const charismaLevel = calcLevelCharisma(totalReceived);
  const activeLevel = activeTab === "wealth" ? wealthLevel : charismaLevel;
  const activeTotal = activeTab === "wealth" ? totalSent : totalReceived;
  const color = getLevelColor(Math.max(1, activeLevel));
  const currentStart = activeTab === "wealth" ? coinsForWealthLevel(activeLevel) : coinsForCharismaLevel(activeLevel);
  const nextTotal = activeTab === "wealth" ? coinsForWealthLevel(activeLevel + 1) : coinsForCharismaLevel(activeLevel + 1);
  const nextNeed = Math.max(0, nextTotal - activeTotal);
  const activeTier = getLevelTier(Math.max(1, activeLevel));
  const visibleLevels = Array.from({ length: 10 }, (_, index) => activeTier * 10 - 9 + index);

  return <div className="h-full flex flex-col overflow-hidden text-white" dir="rtl" style={{ background: "radial-gradient(circle at 80% -10%, rgba(91,33,182,.26), transparent 35%), linear-gradient(180deg,#070711,#0a0a18 55%,#070711)" }}>
    <header className="shrink-0 px-4 pt-3 pb-3 border-b border-white/[.07] bg-[#080814]/90 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3"><button onClick={onBack} className="w-10 h-10 rounded-2xl flex items-center justify-center text-white/75 bg-white/[.06] border border-white/[.08] active:scale-95"><ArrowIcon direction="right" /></button><div className="flex-1"><h1 className="text-lg font-black">المستويات</h1><p className="text-[11px] text-white/45 mt-0.5">الثروة والكاريزما في مكان واحد</p></div><div className="flex items-center gap-1.5"><span className="px-2 py-1 rounded-xl text-[10px] font-black" style={{ background: `${getLevelColor(Math.max(1, wealthLevel)).bg}`, color: getLevelColor(Math.max(1, wealthLevel)).primary, border: `1px solid ${getLevelColor(Math.max(1, wealthLevel)).glow}` }}>LV{wealthLevel}</span><span className="px-2 py-1 rounded-xl text-[10px] font-black" style={{ background: `${getLevelColor(Math.max(1, charismaLevel)).bg}`, color: getLevelColor(Math.max(1, charismaLevel)).primary, border: `1px solid ${getLevelColor(Math.max(1, charismaLevel)).glow}` }}>LV{charismaLevel}</span></div></div>
    </header>

    <main className="flex-1 overflow-y-auto pb-8">
      <section className="px-4 pt-4"><div className="flex gap-2 p-1 rounded-2xl bg-white/[.045] border border-white/[.07]"><button onClick={() => setActiveTab("wealth")} className="flex-1 rounded-xl py-3 flex items-center justify-center gap-2 text-xs font-black transition-all" style={activeTab === "wealth" ? { background: `linear-gradient(135deg, ${getLevelColor(Math.max(1, wealthLevel)).primary}30, ${getLevelColor(Math.max(1, wealthLevel)).secondary}20)`, color: getLevelColor(Math.max(1, wealthLevel)).primary, boxShadow: `0 0 18px ${getLevelColor(Math.max(1, wealthLevel)).glow}25` } : { color: "rgba(255,255,255,.45)" }}><CoinGlyph color={getLevelColor(Math.max(1, wealthLevel)).primary} />الثروة <span className="opacity-70">LV{wealthLevel}</span></button><button onClick={() => setActiveTab("charisma")} className="flex-1 rounded-xl py-3 flex items-center justify-center gap-2 text-xs font-black transition-all" style={activeTab === "charisma" ? { background: `linear-gradient(135deg, ${getLevelColor(Math.max(1, charismaLevel)).primary}30, ${getLevelColor(Math.max(1, charismaLevel)).secondary}20)`, color: getLevelColor(Math.max(1, charismaLevel)).primary, boxShadow: `0 0 18px ${getLevelColor(Math.max(1, charismaLevel)).glow}25` } : { color: "rgba(255,255,255,.45)" }}><MicGlyph color={getLevelColor(Math.max(1, charismaLevel)).primary} />الكاريزما <span className="opacity-70">LV{charismaLevel}</span></button></div></section>

      <section className="px-4 pt-4"><div className="relative overflow-hidden rounded-[28px] p-5" style={{ background: `linear-gradient(145deg, ${color.bg}, rgba(7,7,18,.97) 68%)`, border: `1px solid ${color.glow}`, boxShadow: `0 0 42px ${color.glow}25, inset 0 0 32px ${color.glow}10` }}><div className="absolute -top-20 -left-16 w-48 h-48 rounded-full opacity-25" style={{ background: color.primary, filter: "blur(45px)" }} /><div className="absolute -bottom-16 -right-14 w-40 h-40 rounded-full opacity-15" style={{ background: color.secondary, filter: "blur(35px)" }} /><div className="relative flex items-center gap-4"><div className="relative shrink-0"><div className="absolute inset-0 rounded-full animate-ping opacity-10" style={{ background: color.primary }} /><LevelIconSvg level={Math.max(1, activeLevel)} type={activeTab} size={96} /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="text-3xl font-black">LV{activeLevel}</h2><span className="px-2.5 py-1 rounded-full text-[10px] font-black" style={{ color: color.primary, background: `${color.primary}20`, border: `1px solid ${color.glow}` }}>{getLevelTierLabel(Math.max(1, activeLevel))}</span></div><p className="mt-2 text-xs text-white/55">{activeTab === "wealth" ? "يرتفع بإرسال الهدايا والإنفاق داخل التطبيق" : "يرتفع باستقبال الهدايا والتفاعل مع الآخرين"}</p><div className="mt-3 flex items-center gap-1.5 text-xs font-black" style={{ color: color.primary }}>{activeTab === "wealth" ? <CoinGlyph color={color.primary} /> : <MicGlyph color={color.primary} />}{formatCoins(activeTotal)} <span className="text-white/40 font-normal">إجمالاً</span></div></div></div><div className="relative mt-6"><div className="flex items-center justify-between mb-2 text-xs"><span className="text-white/55">التقدم إلى LV{activeLevel + 1}</span><span className="font-black" style={{ color: color.primary }}>ينقص {formatCoins(nextNeed)}</span></div><LevelProgress current={activeTotal} start={currentStart} next={nextTotal} color={color.primary} glow={color.glow} /></div></div></section>

      <section className="px-4 pt-5"><div className="flex items-center justify-between mb-3"><div><h3 className="font-black text-sm">مراحل المستوى</h3><p className="text-[10px] text-white/40 mt-1">كل عشرة مستويات تحصل على هوية بصرية جديدة</p></div><div className="flex items-center gap-1 text-[10px] text-white/35"><SparkleGlyph color={color.primary} /> خمس مراحل</div></div><div className="flex gap-2 overflow-x-auto pb-1">{[1,2,3,4,5].map((tier) => <TierCard key={tier} tier={tier} type={activeTab} active={selectedTier === tier - 1} onClick={() => setSelectedTier(tier - 1)} />)}</div></section>

      <section className="px-4 pt-5"><div className="flex items-center justify-between mb-3"><div><h3 className="font-black text-sm">أوسمة الإنجاز</h3><p className="text-[10px] text-white/40 mt-1">أوسمة LV10 وLV20 وLV30 وLV40 وLV50</p></div><CrownGlyph color={color.primary} /></div><div className="grid grid-cols-5 gap-2">{milestones.map((level) => <MilestoneCard key={level} level={level} type={activeTab} active={activeLevel >= level} />)}</div></section>

      <section className="px-4 pt-5"><div className="rounded-3xl p-4 bg-white/[.035] border border-white/[.07]"><div className="flex items-center justify-between mb-4"><div><h3 className="font-black text-sm">تفاصيل {getLevelTierLabel(visibleLevels[0])}</h3><p className="text-[10px] text-white/40 mt-1">أيقونة كل مستوى تظهر في البروفايل والغرفة واللحظات</p></div><LevelIconSvg level={visibleLevels[0]} type={activeTab} size={38} /></div><div className="grid grid-cols-5 gap-2">{visibleLevels.map((level) => { const lvColor = getLevelColor(level); const isCurrent = level === activeLevel; return <div key={level} className="rounded-2xl p-2 text-center transition-all" style={{ background: isCurrent ? `${lvColor.primary}18` : "rgba(255,255,255,.025)", border: `1px solid ${isCurrent ? lvColor.glow : "rgba(255,255,255,.06)"}`, boxShadow: isCurrent ? `0 0 14px ${lvColor.glow}25` : "none" }}><LevelIconSvg level={level} type={activeTab} size={31} /><div className="mt-1 text-[9px] font-black" style={{ color: lvColor.primary }}>LV{level}</div></div>; })}</div></div></section>

      <section className="px-4 pt-5"><div className="rounded-3xl p-4 bg-gradient-to-br from-white/[.055] to-white/[.02] border border-white/[.07]"><div className="flex items-center gap-2 mb-3"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color.primary}20` }}><SparkleGlyph color={color.primary} /></div><div><h3 className="font-black text-sm">كيف يتم احتساب المستوى؟</h3><p className="text-[10px] text-white/40">نظام واضح ومتدرج لجميع المستخدمين</p></div></div><div className="space-y-2 text-[11px] text-white/55"><div className="flex items-center justify-between rounded-xl px-3 py-2 bg-white/[.035]"><span className="flex items-center gap-2"><CoinGlyph color="#fbbf24" />الثروة</span><span className="text-white/75">الهدايا المرسلة</span></div><div className="flex items-center justify-between rounded-xl px-3 py-2 bg-white/[.035]"><span className="flex items-center gap-2"><MicGlyph color="#f472b6" />الكاريزما</span><span className="text-white/75">الهدايا المستلمة</span></div><div className="flex items-center justify-between rounded-xl px-3 py-2 bg-white/[.035]"><span className="flex items-center gap-2"><CrownGlyph color="#c084fc" />الأيقونة</span><span className="text-white/75">تتغير كل 10 مستويات</span></div></div></div></section>
    </main>
  </div>;
}
