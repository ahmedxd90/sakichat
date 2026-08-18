import { useState } from "react";
import { toast } from "../lib/toast";

interface FootballStreamSheetProps {
  streamUrl: string | null;
  isOwner: boolean;
  onClose: () => void;
  onSave: (url: string | null) => void;
}

// Popular free football stream sources
const STREAM_SOURCES = [
  {
    name: "يوتيوب - بحث مباشر",
    icon: "▶️",
    color: "#ef4444",
    desc: "ابحث عن المباراة على يوتيوب وانسخ الرابط",
    example: "https://www.youtube.com/watch?v=LIVE_ID",
  },
  {
    name: "beIN Sports يوتيوب",
    icon: "📺",
    color: "#f97316",
    desc: "قناة beIN Sports الرسمية على يوتيوب",
    example: "https://www.youtube.com/@beINSPORTS_AR",
  },
  {
    name: "SSC Sport يوتيوب",
    icon: "⚽",
    color: "#22c55e",
    desc: "قناة SSC الرياضية على يوتيوب",
    example: "https://www.youtube.com/@SSCSport",
  },
  {
    name: "رابط Embed مخصص",
    icon: "🔗",
    color: "#3b82f6",
    desc: "أي رابط iframe embed مباشر",
    example: "https://www.youtube.com/embed/VIDEO_ID?autoplay=1",
  },
];

const API_SERVICES = [
  {
    name: "football-data.org",
    desc: "API مجاني لنتائج ومواعيد المباريات",
    url: "https://www.football-data.org",
    tier: "مجاني",
    color: "#22c55e",
  },
  {
    name: "api-football.com",
    desc: "API شامل للمباريات والإحصائيات",
    url: "https://www.api-football.com",
    tier: "مجاني محدود",
    color: "#3b82f6",
  },
  {
    name: "thesportsdb.com",
    desc: "قاعدة بيانات رياضية مجانية",
    url: "https://www.thesportsdb.com/api.php",
    tier: "مجاني",
    color: "#f97316",
  },
  {
    name: "sofascore.com",
    desc: "نتائج مباشرة ومعلومات المباريات",
    url: "https://www.sofascore.com",
    tier: "مجاني",
    color: "#a855f7",
  },
];

export default function FootballStreamSheet({ streamUrl, isOwner, onClose, onSave }: FootballStreamSheetProps) {
  const [customUrl, setCustomUrl] = useState(streamUrl ?? "");
  const [tab, setTab] = useState<"custom" | "sources" | "api">("custom");

  const handleSave = () => {
    if (!customUrl.trim()) {
      onSave(null);
      toast.success("تم إيقاف البث");
      onClose();
      return;
    }
    let url = customUrl.trim();

    // Convert YouTube watch URL to embed
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) {
      url = `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    }
    // Convert YouTube live URL
    const liveMatch = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]+)/);
    if (liveMatch) {
      url = `https://www.youtube.com/embed/${liveMatch[1]}?autoplay=1&rel=0`;
    }
    // Convert YouTube shorts
    const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
    if (shortsMatch) {
      url = `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=1`;
    }

    onSave(url);
    toast.success("تم تفعيل البث المباشر ⚽");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.75)" }}>
      <div
        className="w-full rounded-t-3xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg,#071207,#040a04)",
          border: "1px solid rgba(34,197,94,0.3)",
          maxHeight: "88vh",
          boxShadow: "0 -10px 40px rgba(34,197,94,0.15)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-green-900/30">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <div>
              <h2 className="text-white font-bold text-sm">بث مباريات كرة القدم</h2>
              <p className="text-green-500 text-[10px]">شاهد مع أصدقائك مباشرة</p>
            </div>
          </div>
          <div className="w-9" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 mx-3 mt-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }}>
          {[
            { key: "custom", label: "رابط البث", icon: "🔗" },
            { key: "sources", label: "مصادر مجانية", icon: "📺" },
            { key: "api", label: "API المباريات", icon: "⚡" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className="flex-1 py-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1"
              style={{
                background: tab === t.key ? "linear-gradient(135deg,#16a34a,#15803d)" : "transparent",
                color: tab === t.key ? "white" : "#6b7280",
                boxShadow: tab === t.key ? "0 0 10px rgba(34,197,94,0.3)" : "none",
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: "65vh" }}>

          {/* ── Tab: Custom URL ── */}
          {tab === "custom" && (
            <div className="space-y-4">
              {/* Current status */}
              {streamUrl && (
                <div className="rounded-2xl p-3 flex items-center gap-3"
                  style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}>
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <div>
                    <p className="text-green-400 text-xs font-bold">البث نشط الآن</p>
                    <p className="text-gray-500 text-[10px] truncate max-w-[200px]" dir="ltr">{streamUrl}</p>
                  </div>
                </div>
              )}

              <div className="rounded-2xl p-4 space-y-3"
                style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.18)" }}>
                <label className="text-green-400 text-xs font-bold block">رابط البث المباشر</label>
                <textarea
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=LIVE_ID"
                  dir="ltr"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-white text-xs outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(34,197,94,0.22)" }}
                />
                <p className="text-gray-500 text-[10px]">
                  ✅ يدعم روابط يوتيوب العادية وسيتم تحويلها تلقائياً
                </p>
              </div>

              {/* Quick paste examples */}
              <div className="space-y-2">
                <p className="text-gray-400 text-[10px] font-bold">أمثلة على الروابط المدعومة:</p>
                {[
                  "youtube.com/watch?v=XXXXX",
                  "youtube.com/live/XXXXX",
                  "youtube.com/embed/XXXXX?autoplay=1",
                ].map((ex, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-gray-400 text-[10px]" dir="ltr">{ex}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setCustomUrl(""); onSave(null); onClose(); }}
                  className="py-3 rounded-xl text-xs font-bold"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  إيقاف البث
                </button>
                <button
                  onClick={handleSave}
                  className="py-3 rounded-xl text-xs font-bold text-white active:scale-95"
                  style={{
                    background: "linear-gradient(135deg,#16a34a,#15803d)",
                    boxShadow: "0 0 12px rgba(34,197,94,0.3)",
                  }}
                >
                  تفعيل البث ⚽
                </button>
              </div>
            </div>
          )}

          {/* ── Tab: Free Sources ── */}
          {tab === "sources" && (
            <div className="space-y-3">
              <div className="rounded-2xl p-3"
                style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <p className="text-green-400 text-xs font-bold mb-1">كيف تشاهد مباريات مجانية؟</p>
                <div className="space-y-2">
                  {[
                    { n: "1", t: "افتح يوتيوب وابحث عن اسم المباراة + كلمة 'مباشر' أو 'live'" },
                    { n: "2", t: "اختر الفيديو المباشر (يكون عليه علامة LIVE حمراء)" },
                    { n: "3", t: "انسخ رابط الصفحة من شريط العنوان" },
                    { n: "4", t: "الصق الرابط في تبويب 'رابط البث' وسيتم التحويل تلقائياً" },
                  ].map((s) => (
                    <div key={s.n} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black text-white"
                        style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
                        {s.n}
                      </div>
                      <p className="text-gray-300 text-[10px] mt-0.5">{s.t}</p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-gray-400 text-[10px] font-bold px-1">مصادر البث المجاني:</p>
              {STREAM_SOURCES.map((src, i) => (
                <div key={i} className="rounded-2xl p-3 flex items-start gap-3"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ background: `${src.color}18`, border: `1px solid ${src.color}30` }}>
                    {src.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold">{src.name}</p>
                    <p className="text-gray-400 text-[10px]">{src.desc}</p>
                    <p className="text-gray-600 text-[9px] mt-0.5 truncate" dir="ltr">{src.example}</p>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl p-3"
                style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)" }}>
                <p className="text-yellow-400 text-[10px]">
                  💡 <strong>نصيحة:</strong> ابحث على يوتيوب بـ "اسم الفريق live" أو "مباراة اليوم مباشر" للعثور على بث مجاني
                </p>
              </div>
            </div>
          )}

          {/* ── Tab: API Services ── */}
          {tab === "api" && (
            <div className="space-y-3">
              <div className="rounded-2xl p-3"
                style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)" }}>
                <p className="text-blue-400 text-xs font-bold mb-1">🔑 مواقع API مجانية للمباريات</p>
                <p className="text-gray-400 text-[10px]">
                  يمكنك استخدام هذه الـ APIs للحصول على مواعيد ونتائج المباريات في تطبيقك
                </p>
              </div>

              {API_SERVICES.map((api, i) => (
                <div key={i} className="rounded-2xl p-3"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white text-xs font-bold">{api.name}</p>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                      style={{ background: `${api.color}20`, color: api.color, border: `1px solid ${api.color}30` }}>
                      {api.tier}
                    </span>
                  </div>
                  <p className="text-gray-400 text-[10px] mb-1">{api.desc}</p>
                  <p className="text-blue-400 text-[9px]" dir="ltr">{api.url}</p>
                </div>
              ))}

              <div className="rounded-2xl p-3 space-y-2"
                style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <p className="text-green-400 text-xs font-bold">كيف تستخدم API المباريات؟</p>
                {[
                  "سجّل في football-data.org للحصول على مفتاح API مجاني",
                  "استخدم المفتاح في إعدادات التطبيق تحت FOOTBALL_API_KEY",
                  "ستظهر مواعيد المباريات القادمة تلقائياً في الغرفة",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-black text-white"
                      style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
                      {i + 1}
                    </div>
                    <p className="text-gray-300 text-[10px]">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
