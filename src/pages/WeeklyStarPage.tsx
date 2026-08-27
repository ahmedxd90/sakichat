// @ts-nocheck
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import WeeklyStarAdminPanel from "../components/WeeklyStarAdminPanel";

interface WeeklyStarPageProps {
  onBack: () => void;
}

function useCountdown(endsAt: number | undefined) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    if (!endsAt) return;
    const tick = () => {
      const diff = Math.max(0, endsAt - Date.now());
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return timeLeft;
}

export default function WeeklyStarPage({ onBack }: WeeklyStarPageProps) {
  const [tab, setTab] = useState<"leaderboard" | "rules" | "hall">("leaderboard");
  const [showAdmin, setShowAdmin] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [weeklySettings, setWeeklySettings] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const countdown = useCountdown(event?.weekEnd);

  useEffect(() => {
    const fetchData = async () => {
      const { data: ae } = await supabase.from('weekly_star_events').select('*').eq('status', 'active').maybeSingle();
      setEvent(ae);
      const { data: ws } = await supabase.from('app_settings').select('*').eq('key', 'weekly_star').maybeSingle();
      setWeeklySettings(ws?.value);
      if (ae) {
        const { data: lb } = await supabase.from('weekly_star_leaderboard').select('*').eq('event_id', ae.id).order('total_coins', { ascending: false });
        setLeaderboard(lb || []);
      }
      const { data: pe } = await supabase.from('weekly_star_events').select('*').eq('status', 'completed').order('created_at', { ascending: false });
      setPastEvents(pe || []);
    };
    fetchData();
  }, []);

  const top3 = leaderboard?.slice(0, 3) ?? [];
  const rest = leaderboard?.slice(3) ?? [];

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div
      className="fixed inset-0 z-[150] flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(180deg, #1a0a00 0%, #3d1500 40%, #7c2d00 100%)" }}
      dir="rtl"
    >
      {/* Animated stars bg */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-yellow-300"
            style={{
              width: `${1 + (i % 3)}px`,
              height: `${1 + (i % 3)}px`,
              top: `${(i * 41) % 100}%`,
              left: `${(i * 67) % 100}%`,
              opacity: 0.1 + (i % 5) * 0.07,
              animation: `ws-twinkle ${2 + (i % 4)}s ease-in-out infinite`,
              animationDelay: `${(i * 0.4) % 3}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div
        className="relative flex items-center gap-3 px-4 py-4 flex-shrink-0"
        style={{ background: "rgba(0,0,0,0.4)", borderBottom: "1px solid rgba(255,215,0,0.2)" }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-white font-black text-xl leading-none">⭐ نجمة أسبوعية</h1>
          <p className="text-yellow-400/70 text-[11px] mt-0.5">أرسل الهدايا وكن النجم الأول</p>
        </div>
        <button onClick={() => setShowAdmin(true)} className="rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-3 py-2 text-[11px] font-black text-yellow-300">إدارة</button>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.4)" }}
        >
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-yellow-400 text-[10px] font-black">مباشر</span>
        </div>
      </div>

      {showAdmin && <WeeklyStarAdminPanel onClose={() => setShowAdmin(false)} />}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Banner */}
        <div className="mx-4 mt-4 rounded-3xl overflow-hidden" style={{ border: "3px solid #ffd700", boxShadow: "0 10px 40px rgba(255,215,0,0.4)" }}>
            <img
            src={weeklySettings?.bannerUrl ?? "https://j.top4top.io/p_3742mh9j21.jpg"}
            alt="نجمة أسبوعية"
            className="w-full object-cover"
            style={{ maxHeight: "180px" }}
          />
        </div>

        {/* Tabs */}
        <div className="flex mx-4 mt-4 gap-2">
          {[
            { id: "leaderboard", label: "الترتيب", emoji: "🏆" },
            { id: "rules", label: "قواعد وجوائز", emoji: "📋" },
            { id: "hall", label: "قاعة الشهرة", emoji: "🌟" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className="flex-1 py-2.5 rounded-2xl text-xs font-black transition-all"
              style={
                tab === t.id
                  ? { background: "linear-gradient(135deg,#ffd700,#ff9c00)", color: "#5a1a00", boxShadow: "0 4px 15px rgba(255,215,0,0.4)" }
                  : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }
              }
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* ── LEADERBOARD TAB ── */}
        {tab === "leaderboard" && (
          <div className="px-4 pb-8">
            {/* Current week badge */}
            <div className="flex justify-center mt-4">
              <div
                className="px-6 py-2 rounded-full font-black text-sm"
                style={{ background: "linear-gradient(135deg,#ffd700,#ff8a00)", color: "#5a1a00", boxShadow: "0 4px 15px rgba(255,215,0,0.4)" }}
              >
                ⭐ الأسبوع الحالي
              </div>
            </div>

            {/* Countdown */}
            {event && (
              <div
                className="mt-4 rounded-2xl p-4"
                style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,215,0,0.2)" }}
              >
                <p className="text-center text-yellow-300/80 text-xs mb-3 font-bold">⏳ العد التنازلي لنهاية الأسبوع</p>
                <div className="flex justify-center gap-3">
                  {[
                    { val: countdown.days, label: "يوم" },
                    { val: countdown.hours, label: "ساعة" },
                    { val: countdown.minutes, label: "دقيقة" },
                    { val: countdown.seconds, label: "ثانية" },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col items-center gap-1">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white"
                        style={{ background: "linear-gradient(135deg,#5a1a00,#8f2a10)", border: "1px solid rgba(255,215,0,0.3)", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
                      >
                        {pad(item.val)}
                      </div>
                      <span className="text-yellow-400/70 text-[10px] font-bold">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event gift */}
            {event && (
              <div className="mt-4 flex flex-col items-center">
                <p className="text-yellow-300/70 text-xs font-bold mb-3">🎁 هدية الفعالية</p>
                <div
                  className="w-36 rounded-3xl p-4 flex flex-col items-center gap-2"
                  style={{ background: "linear-gradient(135deg,#ffd700,#ff9a00)", boxShadow: "0 8px 30px rgba(255,215,0,0.5)" }}
                >
                  {event.giftImageUrl ? (
                    <img src={event.giftImageUrl} alt={event.giftName} className="w-20 h-20 object-contain rounded-2xl" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-4xl">⭐</div>
                  )}
                  <p className="text-[#5a1a00] font-black text-sm text-center">{event.giftName ?? "هدية النجمة"}</p>
                  {event.giftPrice && (
                    <div className="flex items-center gap-1 bg-[#5a1a00]/30 rounded-full px-3 py-1">
                      <span className="text-[#5a1a00] font-black text-sm">🪙 {event.giftPrice.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Podium - Top 3 */}
            {top3.length > 0 && (
              <div className="mt-6">
                <p className="text-center text-yellow-300/70 text-xs font-bold mb-4">🏆 المراكز الثلاثة الأولى</p>
                <div className="flex justify-center items-end gap-4">
                  {/* 2nd place */}
                  {top3[1] ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <img
                          src={top3[1].userAvatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${top3[1].userId}`}
                          alt={top3[1].userName}
                          className="w-16 h-16 rounded-full object-cover"
                          style={{ border: "3px solid #d8d8d8", boxShadow: "0 4px 15px rgba(216,216,216,0.5)" }}
                        />
                        <div className="absolute -top-2 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                          style={{ background: "linear-gradient(135deg,#d8d8d8,#8a8a8a)", color: "#333" }}>2</div>
                      </div>
                      <div
                        className="w-24 rounded-2xl p-3 text-center"
                        style={{ background: "linear-gradient(180deg,#d8d8d8,#8a8a8a)", boxShadow: "0 4px 15px rgba(0,0,0,0.3)", minHeight: "80px" }}
                      >
                        <p className="text-gray-900 font-black text-xs truncate">{top3[1].userName}</p>
                        <p className="text-gray-700 text-[10px] mt-1">🪙 {top3[1].totalCoins.toLocaleString()}</p>
                        <p className="text-gray-700 text-[10px]">×{top3[1].giftCount}</p>
                      </div>
                    </div>
                  ) : <div className="w-24" />}

                  {/* 1st place */}
                  {top3[0] && (
                    <div className="flex flex-col items-center gap-2" style={{ marginBottom: "20px" }}>
                      <div className="text-3xl animate-bounce">👑</div>
                      <div className="relative">
                        <img
                          src={top3[0].userAvatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${top3[0].userId}`}
                          alt={top3[0].userName}
                          className="w-20 h-20 rounded-full object-cover"
                          style={{ border: "3px solid #ffd700", boxShadow: "0 0 20px rgba(255,215,0,0.8), 0 4px 20px rgba(0,0,0,0.4)" }}
                        />
                        <div className="absolute -top-2 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black"
                          style={{ background: "linear-gradient(135deg,#ffd700,#ff9c00)", color: "#5a1a00" }}>1</div>
                      </div>
                      <div
                        className="w-28 rounded-2xl p-3 text-center"
                        style={{ background: "linear-gradient(180deg,#ffd700,#c88900)", boxShadow: "0 8px 25px rgba(255,215,0,0.5)", minHeight: "90px" }}
                      >
                        <p className="text-[#5a1a00] font-black text-sm truncate">{top3[0].userName}</p>
                        <p className="text-[#5a1a00]/80 text-[10px] mt-1">🪙 {top3[0].totalCoins.toLocaleString()}</p>
                        <p className="text-[#5a1a00]/80 text-[10px]">×{top3[0].giftCount}</p>
                        <div className="mt-1 px-2 py-0.5 rounded-full text-[9px] font-black" style={{ background: "rgba(90,26,0,0.2)", color: "#5a1a00" }}>
                          ⭐ نجمة الأسبوع
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3rd place */}
                  {top3[2] ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <img
                          src={top3[2].userAvatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${top3[2].userId}`}
                          alt={top3[2].userName}
                          className="w-16 h-16 rounded-full object-cover"
                          style={{ border: "3px solid #e7a66b", boxShadow: "0 4px 15px rgba(231,166,107,0.5)" }}
                        />
                        <div className="absolute -top-2 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                          style={{ background: "linear-gradient(135deg,#e7a66b,#8f4b1f)", color: "white" }}>3</div>
                      </div>
                      <div
                        className="w-24 rounded-2xl p-3 text-center"
                        style={{ background: "linear-gradient(180deg,#e7a66b,#8f4b1f)", boxShadow: "0 4px 15px rgba(0,0,0,0.3)", minHeight: "80px" }}
                      >
                        <p className="text-white font-black text-xs truncate">{top3[2].userName}</p>
                        <p className="text-white/80 text-[10px] mt-1">🪙 {top3[2].totalCoins.toLocaleString()}</p>
                        <p className="text-white/80 text-[10px]">×{top3[2].giftCount}</p>
                      </div>
                    </div>
                  ) : <div className="w-24" />}
                </div>
              </div>
            )}

            {/* Rest of leaderboard */}
            {rest.length > 0 && (
              <div className="mt-5 space-y-2">
                {rest.map((entry, idx) => (
                  <div
                    key={entry.userId}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                    style={{ background: "linear-gradient(135deg,rgba(255,107,53,0.15),rgba(90,26,0,0.3))", border: "1px solid rgba(255,215,0,0.1)" }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                      style={{ background: "rgba(255,215,0,0.15)", color: "#ffd700", border: "1px solid rgba(255,215,0,0.3)" }}
                    >
                      {idx + 4}
                    </div>
                    <img
                      src={entry.userAvatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.userId}`}
                      alt={entry.userName}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      style={{ border: "2px solid rgba(255,215,0,0.3)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{entry.userName}</p>
                      <p className="text-yellow-400/60 text-[10px]">×{entry.giftCount} هدية</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-yellow-400 font-black text-sm">🪙 {entry.totalCoins.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!event && (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">⭐</div>
                <p className="text-yellow-400/60 text-sm">لا توجد فعالية نشطة حالياً</p>
                <p className="text-gray-500 text-xs mt-1">ترقب الفعاليات القادمة</p>
              </div>
            )}

            {event && leaderboard?.length === 0 && (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">🎁</div>
                <p className="text-yellow-400/60 text-sm">لا يوجد مشاركون بعد</p>
                <p className="text-gray-500 text-xs mt-1">كن أول من يرسل الهدية!</p>
              </div>
            )}
          </div>
        )}

        {/* ── RULES TAB ── */}
        {tab === "rules" && (
          <div className="px-4 pb-8 mt-4 space-y-4">
            {/* Reward card driven by the saved weekly-star settings */}
            <div className="rounded-3xl p-5" style={{ background: "linear-gradient(135deg,rgba(255,215,0,0.15),rgba(255,140,0,0.1))", border: "1px solid rgba(255,215,0,0.3)" }}>
              <p className="text-yellow-400 font-black text-base mb-4 text-center">🏆 القواعد والجوائز المحددة لهذا الأسبوع</p>
              <div className="mb-4 rounded-2xl border border-yellow-300/20 bg-black/20 p-3">
                <p className="mb-2 text-center text-xs font-black text-yellow-200">هدية النجم الأسبوعي</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white/10">{(weeklySettings?.currentGift?.resolvedImageUrl ?? event?.giftImageUrl) ? <img src={weeklySettings?.currentGift?.resolvedImageUrl ?? event?.giftImageUrl} alt={weeklySettings?.currentGift?.name ?? event?.giftName ?? "هدية النجم"} className="h-full w-full object-contain" /> : null}</div>
                  <div><p className="font-black text-white">{weeklySettings?.currentGift?.name ?? event?.giftName ?? "لم تحدد الهدية بعد"}</p><p className="mt-1 text-[11px] text-yellow-200/70">تُحتسب هذه الهدية فقط في الترتيب</p></div>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { rank: "🥇", label: "المركز الأول", gold: weeklySettings?.firstGold ?? event?.rewardCoins ?? 0, color: "#ffd700", bg: "rgba(255,215,0,0.1)" },
                  { rank: "🥈", label: "المركز الثاني", gold: weeklySettings?.secondGold ?? 0, color: "#d8d8d8", bg: "rgba(216,216,216,0.08)" },
                  { rank: "🥉", label: "المركز الثالث", gold: weeklySettings?.thirdGold ?? 0, color: "#e7a66b", bg: "rgba(231,166,107,0.08)" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl p-3" style={{ background: item.bg, border: `1px solid ${item.color}30` }}>
                    <div className="flex items-center gap-3"><span className="text-lg">{item.rank}</span><div><p className="font-black text-sm" style={{ color: item.color }}>{item.label}</p><p className="mt-0.5 text-xs text-white">🪙 {Number(item.gold).toLocaleString()} عملة ذهبية</p></div></div>
                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-white/75">
                      {weeklySettings?.titleIconUrl ? <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1"><img src={weeklySettings.titleIconUrl} alt="لقب النجم" className="h-5 w-5 object-contain" /> {weeklySettings.title ?? "نجم الأسبوع"} · {weeklySettings.titleDays ?? 14} يوم</span> : null}
                      {weeklySettings?.aristocracyLevel ? <span className="rounded-full bg-white/10 px-2 py-1">استقراطية {weeklySettings.aristocracyLevel} · {weeklySettings.aristocracyDays ?? 14} يوم</span> : null}
                      {weeklySettings?.frame?.resolvedImageUrl ? <img src={weeklySettings.frame.resolvedImageUrl} alt="الإطار" className="h-7 w-7 rounded-lg object-cover" /> : null}
                      {weeklySettings?.entry?.resolvedImageUrl ? <img src={weeklySettings.entry.resolvedImageUrl} alt="الدخولية" className="h-7 w-7 rounded-lg object-cover" /> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rules */}
            <div
              className="rounded-3xl p-5"
              style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <p className="text-white font-black text-base mb-4">📋 قواعد الفعالية</p>
              <div className="space-y-3">
                {[
                  { icon: "🎁", text: "أرسل هدية الفعالية المحددة من صندوق الهدايا في الغرفة" },
                  { icon: "📊", text: "يتم احتساب العملات الذهبية المُرسلة لترتيب المشاركين" },
                  { icon: "⏰", text: "تبدأ الفعالية كل يوم أحد الساعة 00:00 وتنتهي يوم السبت الساعة 23:59" },
                  { icon: "🏆", text: "المركز الأول يحصل على وسام نجمة الأسبوع الحقيقي" },
                  { icon: "💰", text: "كلما أرسلت أكثر، ارتفع ترتيبك في القائمة" },
                  { icon: "🌟", text: "يمكن إرسال الهدية لأي شخص في الغرفة" },
                ].map((rule, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{rule.icon}</span>
                    <p className="text-gray-300 text-sm leading-relaxed">{rule.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* How to participate */}
            <div
              className="rounded-3xl p-5"
              style={{ background: "rgba(255,215,0,0.05)", border: "1px solid rgba(255,215,0,0.2)" }}
            >
              <p className="text-yellow-400 font-black text-base mb-4">🚀 كيفية المشاركة</p>
              <div className="space-y-3">
                {[
                  "ادخل إلى أي غرفة صوتية",
                  "افتح صندوق الهدايا",
                  "اختر هدية الفعالية (فئة الفعاليات)",
                  "أرسل الهدية لأي شخص في الغرفة",
                  "يتم احتساب عملاتك تلقائياً في الترتيب",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,#ffd700,#ff9c00)", color: "#5a1a00" }}
                    >
                      {i + 1}
                    </div>
                    <p className="text-gray-300 text-sm">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── HALL OF FAME TAB ── */}
        {tab === "hall" && (
          <div className="px-4 pb-8 mt-4">
            <p className="text-center text-yellow-400/70 text-xs font-bold mb-4">🌟 أبطال الأسابيع الماضية</p>
            {pastEvents && pastEvents.length > 0 ? (
              <div className="space-y-3">
                {pastEvents.map((e) => (
                  <div
                    key={e._id}
                    className="flex items-center gap-4 p-4 rounded-2xl"
                    style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,215,0,0.15)" }}
                  >
                    <div className="text-3xl">⭐</div>
                    <div className="flex-1">
                      <p className="text-white font-black text-sm">{e.winnerName ?? "لم يُحدد بعد"}</p>
                      <p className="text-yellow-400/60 text-xs mt-0.5">
                        {new Date(e.weekStart).toLocaleDateString("ar-SA")} - {new Date(e.weekEnd).toLocaleDateString("ar-SA")}
                      </p>
                      {e.giftName && <p className="text-gray-500 text-[10px] mt-0.5">هدية: {e.giftName}</p>}
                    </div>
                    {e.winnerAvatarUrl && (
                      <img src={e.winnerAvatarUrl} alt={e.winnerName} className="w-12 h-12 rounded-full object-cover" style={{ border: "2px solid #ffd700" }} />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">🌟</div>
                <p className="text-yellow-400/60 text-sm">لا يوجد سجل بعد</p>
                <p className="text-gray-500 text-xs mt-1">كن أول نجمة في التاريخ!</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes ws-twinkle {
          0%,100%{opacity:0.1;transform:scale(1)}
          50%{opacity:0.5;transform:scale(1.8)}
        }
      `}</style>
    </div>
  );
}
