// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "../lib/toast";

interface AiAssistantPageProps {
  onBack: () => void;
}

type Tab = "chat" | "text" | "report" | "support";

type Message = {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
};

const TEXT_TYPES = [
  { id: "bio", label: "نبذة شخصية", icon: "👤" },
  { id: "status", label: "حالة", icon: "💫" },
  { id: "message", label: "رسالة", icon: "💌" },
  { id: "poem", label: "قصيدة", icon: "📜" },
  { id: "joke", label: "نكتة", icon: "😄" },
  { id: "general", label: "عام", icon: "✨" },
];

const REPORT_TYPES = [
  { id: "user", label: "إبلاغ عن مستخدم", icon: "👤", color: "#ef4444", desc: "أبلغ عن مستخدم مخالف" },
  { id: "room", label: "إبلاغ عن غرفة", icon: "🏠", color: "#f97316", desc: "أبلغ عن غرفة مخالفة" },
  { id: "problem", label: "إبلاغ عن مشكلة", icon: "⚠️", color: "#eab308", desc: "أبلغ عن مشكلة تقنية" },
];

const REPORT_REASONS: Record<string, string[]> = {
  user: ["محتوى مسيء", "تحرش أو مضايقة", "محتوى جنسي", "انتحال شخصية", "احتيال", "محتوى عنيف", "أخرى"],
  room: ["محتوى مسيء في الغرفة", "نشاط مشبوه", "انتهاك القواعد", "محتوى غير لائق", "أخرى"],
  problem: ["مشكلة تقنية", "خطأ في الرصيد", "مشكلة في الحساب", "ميزة لا تعمل", "أخرى"],
};

export default function AiAssistantPage({ onBack }: AiAssistantPageProps) {
  const [tab, setTab] = useState<Tab>("chat");
  const [myProfile, setMyProfile] = useState<any>(null);
  const [aristocracyGranted, setAristocracyGranted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
        setMyProfile(p);
      }
    };
    fetchData();
  }, []);

  const grantAristocracy = async (args: any) => ({ granted: false });

  // منح رتبة الدوق عند فتح المساعد الذكي
  useEffect(() => {
    if (myProfile && !aristocracyGranted) {
      const currentLevel = myProfile.aristocracyLevel ?? 0;
      if (currentLevel < 4) {
        grantAristocracy().then((res) => {
          if (res?.granted) {
            toast.success("🎉 تم منحك رتبة الدوق مكافأة على استخدام الذكاء الاصطناعي!");
            setAristocracyGranted(true);
          }
        }).catch(() => {});
      }
      setAristocracyGranted(true);
    }
  }, [myProfile]);

  const tabs = [
    { id: "chat", label: "دردشة AI", icon: "🤖" },
    { id: "text", label: "توليد نص", icon: "✍️" },
    { id: "report", label: "بلاغ", icon: "🚨" },
    { id: "support", label: "خدمة العملاء", icon: "💬" },
  ];

  return (
    <div className="fixed inset-0 z-[300] flex flex-col" style={{ background: "#0a0a14" }} dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
        style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.18),rgba(236,72,153,0.12))", borderColor: "rgba(255,255,255,0.08)" }}>
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:scale-90">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)", boxShadow: "0 0 20px rgba(168,85,247,0.5)" }}>
          <span style={{ fontSize: 20 }}>🤖</span>
        </div>
        <div className="flex-1">
          <p className="text-white font-black text-base leading-tight">المساعد الذكي</p>
          <p className="text-purple-300 text-xs">مدعوم بالذكاء الاصطناعي ✨</p>
        </div>
        {(myProfile?.aristocracyLevel ?? 0) >= 4 && (
          <div className="px-2 py-1 rounded-full text-[10px] font-black flex-shrink-0"
            style={{ background: "rgba(167,139,250,0.2)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.4)" }}>
            👑 الدوق
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 py-2 border-b flex-shrink-0 overflow-x-auto scrollbar-hide"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as Tab)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap active:scale-95 transition-all flex-shrink-0"
            style={tab === t.id
              ? { background: "linear-gradient(135deg,#a855f7,#ec4899)", color: "white" }
              : { background: "rgba(255,255,255,0.06)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {tab === "chat" && <ChatTab myProfile={myProfile} />}
        {tab === "text" && <TextTab />}
        {tab === "report" && <ReportTab />}
        {tab === "support" && <SupportTab myProfile={myProfile} />}
      </div>
    </div>
  );
}

/* ─── Chat Tab ─── */
function ChatTab({ myProfile }: { myProfile: any }) {
  const [history, setHistory] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const chatWithAI = async (args: any) => "";
  const analyzeImage = async (args: any) => "";

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history, loading]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const send = async () => {
    if ((!input.trim() && !imagePreview) || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() || "حلل هذه الصورة", imageUrl: imagePreview ?? undefined };
    const newH = [...history, userMsg];
    setHistory(newH);
    setInput("");
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
    setLoading(true);
    try {
      let reply = "";
      if (userMsg.imageUrl) {
        reply = await analyzeImage({ imageUrl: userMsg.imageUrl, userQuestion: userMsg.content !== "حلل هذه الصورة" ? userMsg.content : undefined });
      } else {
        const textHistory = history.map(m => ({ role: m.role, content: m.content }));
        reply = await chatWithAI({ message: userMsg.content, history: textHistory });
      }
      setHistory([...newH, { role: "assistant", content: reply ?? "" }]);
    } catch {
      setHistory([...newH, { role: "assistant", content: "عذراً، حدث خطأ. حاول مرة أخرى." }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = ["اقترح لي موضوع محادثة 💬", "أخبرني نكتة مضحكة 😄", "ساعدني في كتابة رسالة 💌", "اكتب لي حالة مميزة ✨"];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {history.length === 0 && (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.2),rgba(236,72,153,0.15))", border: "1px solid rgba(168,85,247,0.3)" }}>
              <span style={{ fontSize: 36 }}>🤖</span>
            </div>
            <p className="text-white font-bold text-lg">مرحباً! كيف يمكنني مساعدتك؟</p>
            <p className="text-gray-500 text-sm mt-1">اسألني أي شيء أو أرسل صورة لتحليلها</p>
            <div className="mt-4 flex flex-col gap-2">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setInput(s)}
                  className="text-right px-4 py-2.5 rounded-2xl text-sm text-purple-300 active:scale-95"
                  style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {history.map((m, i) => (
          <div key={i} className={`flex items-end gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}>
                <span style={{ fontSize: 14 }}>🤖</span>
              </div>
            )}
            <div className="max-w-[78%] flex flex-col gap-1">
              {m.imageUrl && <img src={m.imageUrl} alt="" className="rounded-2xl max-w-[200px] max-h-[200px] object-cover" />}
              <div className="px-4 py-2.5 rounded-2xl text-sm text-white leading-relaxed whitespace-pre-wrap"
                style={m.role === "user"
                  ? { background: "linear-gradient(135deg,#a855f7,#ec4899)", borderBottomLeftRadius: 4 }
                  : { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderBottomRightRadius: 4 }}>
                {m.content}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}>
              <span style={{ fontSize: 14 }}>🤖</span>
            </div>
            <div className="px-4 py-3 rounded-2xl flex gap-1.5 items-center"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      {imagePreview && (
        <div className="px-4 py-2 border-t border-white/8 flex items-center gap-3 flex-shrink-0">
          <img src={imagePreview} alt="" className="w-14 h-14 rounded-xl object-cover" />
          <p className="text-gray-400 text-xs flex-1">صورة جاهزة للإرسال</p>
          <button onClick={() => { setImagePreview(null); if (fileRef.current) fileRef.current.value = ""; }}
            className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}
      <div className="flex-shrink-0 px-4 py-3 border-t border-white/8 flex gap-2">
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleImageSelect} />
        <button onClick={() => fileRef.current?.click()}
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 active:scale-90"
          style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="#a855f7"/><polyline points="21 15 16 10 5 21"/>
          </svg>
        </button>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          placeholder="اكتب سؤالك..."
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500" />
        <button onClick={send} disabled={(!input.trim() && !imagePreview) || loading}
          className="w-11 h-11 rounded-2xl flex items-center justify-center disabled:opacity-40 active:scale-90 flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}>
          {loading
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          }
        </button>
      </div>
    </div>
  );
}

/* ─── Text Tab ─── */
function TextTab() {
  const [textType, setTextType] = useState("bio");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const generateText = async (args: any) => "";

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResult("");
    try {
      const res = await generateText({ prompt: prompt.trim(), type: textType as any });
      setResult(res ?? "");
    } catch (e: any) {
      toast.error(e.message ?? "فشل توليد النص");
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result).then(() => toast.success("تم النسخ ✅")).catch(() => toast.error("فشل النسخ"));
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-4 space-y-4">
      <div className="text-center py-2">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-3"
          style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.2),rgba(236,72,153,0.15))", border: "1px solid rgba(168,85,247,0.3)" }}>
          <span style={{ fontSize: 30 }}>✍️</span>
        </div>
        <p className="text-white font-bold text-base">توليد نصوص إبداعية</p>
        <p className="text-gray-500 text-xs mt-1">اكتب ما تريد وسيكتبه الذكاء الاصطناعي</p>
      </div>

      <div>
        <p className="text-gray-400 text-xs font-semibold mb-2">نوع النص</p>
        <div className="grid grid-cols-3 gap-2">
          {TEXT_TYPES.map(t => (
            <button key={t.id} onClick={() => setTextType(t.id)}
              className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all"
              style={textType === t.id
                ? { background: "linear-gradient(135deg,#a855f7,#ec4899)", color: "white" }
                : { background: "rgba(255,255,255,0.06)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span style={{ fontSize: 18 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-gray-400 text-xs font-semibold mb-2">الموضوع أو الوصف</p>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
          placeholder="اكتب موضوعك هنا..."
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none" />
      </div>

      <button onClick={generate} disabled={!prompt.trim() || loading}
        className="w-full py-3.5 rounded-2xl text-white font-black text-base disabled:opacity-40 active:scale-95"
        style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            جاري الكتابة...
          </span>
        ) : "✍️ توليد النص"}
      </button>

      {result && (
        <div className="space-y-2">
          <div className="p-4 rounded-2xl text-sm text-white leading-relaxed whitespace-pre-wrap"
            style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)" }}>
            {result}
          </div>
          <button onClick={copyResult}
            className="w-full py-3 rounded-2xl text-white font-bold text-sm active:scale-95"
            style={{ background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)" }}>
            📋 نسخ النص
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Report Tab ─── */
function ReportTab() {
  const [reportType, setReportType] = useState<"user" | "room" | "problem" | null>(null);
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const analyzeImage = async (args: any) => "";
  const submitReport = async (args: any) => {};
  const generateUploadUrl = async () => "";

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEvidenceFile(file);
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (isImage) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const url = ev.target?.result as string;
        setEvidencePreview(url);
        if (reportType === "user") {
          setAnalyzing(true);
          try {
            const analysis = await analyzeImage({ imageUrl: url, reportedSakiId: targetId || undefined });
            setAiAnalysis(analysis ?? "");
          } catch { }
          finally { setAnalyzing(false); }
        }
      };
      reader.readAsDataURL(file);
    } else if (isVideo) {
      setEvidencePreview("video");
    }
  };

  const handleSubmit = async () => {
    if (!reportType) return toast.error("اختر نوع البلاغ");
    if (reportType === "user" && !targetId.trim()) return toast.error("أدخل Saki ID للمستخدم");
    if (!reason) return toast.error("اختر سبب البلاغ");
    setSubmitting(true);
    try {
      let evidenceStorageId: any = undefined;
      let evidenceType: string | undefined;
      if (evidenceFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": evidenceFile.type }, body: evidenceFile });
        if (!result.ok) throw new Error("فشل رفع الملف");
        const { storageId } = await result.json();
        evidenceStorageId = storageId;
        evidenceType = evidenceFile.type.startsWith("video/") ? "video" : "image";
      }
      await submitReport({
        reportType,
        targetId: targetId.trim() || undefined,
        reason,
        details: details.trim() || undefined,
        evidenceStorageId,
        evidenceType,
        aiAnalysis: aiAnalysis || undefined,
      });
      toast.success("✅ تم إرسال البلاغ بنجاح! سيتم مراجعته من قبل الإدارة");
      setReportType(null);
      setTargetId(""); setReason(""); setDetails("");
      setEvidencePreview(null); setEvidenceFile(null); setAiAnalysis("");
    } catch (e: any) {
      toast.error(e.message ?? "حدث خطأ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div className="text-center py-2">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-3"
          style={{ background: "linear-gradient(135deg,rgba(239,68,68,0.2),rgba(239,68,68,0.1))", border: "1px solid rgba(239,68,68,0.3)" }}>
          <span style={{ fontSize: 30 }}>🚨</span>
        </div>
        <p className="text-white font-bold text-base">إرسال بلاغ</p>
        <p className="text-gray-500 text-xs mt-1">اختر نوع البلاغ وأرسل الإثبات</p>
      </div>

      {/* Report Type Selection */}
      <div>
        <p className="text-gray-400 text-xs font-semibold mb-2">نوع البلاغ *</p>
        <div className="grid grid-cols-3 gap-2">
          {REPORT_TYPES.map(rt => (
            <button key={rt.id} onClick={() => { setReportType(rt.id as any); setReason(""); }}
              className="flex flex-col items-center gap-2 py-3 rounded-2xl text-xs font-bold active:scale-95 transition-all"
              style={reportType === rt.id
                ? { background: `${rt.color}25`, border: `1.5px solid ${rt.color}60`, color: rt.color }
                : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af" }}>
              <span style={{ fontSize: 22 }}>{rt.icon}</span>
              <span className="text-center leading-tight">{rt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {reportType && (
        <>
          {/* Target ID for user/room */}
          {(reportType === "user" || reportType === "room") && (
            <div>
              <label className="text-gray-400 text-xs font-semibold mb-2 block">
                {reportType === "user" ? "Saki ID للمستخدم المُبلَّغ عنه *" : "اسم أو ID الغرفة"}
              </label>
              <input value={targetId} onChange={e => setTargetId(e.target.value)}
                placeholder={reportType === "user" ? "أدخل Saki ID..." : "أدخل اسم الغرفة..."}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-red-500"
                dir="ltr" />
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="text-gray-400 text-xs font-semibold mb-2 block">سبب البلاغ *</label>
            <div className="flex flex-wrap gap-2">
              {(REPORT_REASONS[reportType] ?? []).map(r => (
                <button key={r} onClick={() => setReason(r)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-all"
                  style={reason === r
                    ? { background: "rgba(239,68,68,0.3)", border: "1px solid rgba(239,68,68,0.6)", color: "#f87171" }
                    : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af" }}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div>
            <label className="text-gray-400 text-xs font-semibold mb-2 block">تفاصيل إضافية (اختياري)</label>
            <textarea value={details} onChange={e => setDetails(e.target.value)}
              placeholder="اكتب تفاصيل إضافية..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none" />
          </div>

          {/* Evidence Upload */}
          <div>
            <label className="text-gray-400 text-xs font-semibold mb-2 block">إرفاق دليل - صورة أو فيديو (اختياري)</label>
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
            {evidencePreview ? (
              <div className="relative">
                {evidencePreview === "video" ? (
                  <div className="w-full h-24 rounded-2xl flex items-center justify-center gap-2"
                    style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)" }}>
                    <span style={{ fontSize: 28 }}>🎥</span>
                    <span className="text-purple-300 text-sm font-bold">فيديو جاهز للإرسال</span>
                  </div>
                ) : (
                  <img src={evidencePreview} alt="" className="w-full rounded-2xl max-h-48 object-cover" />
                )}
                <button onClick={() => { setEvidencePreview(null); setEvidenceFile(null); setAiAnalysis(""); if (fileRef.current) fileRef.current.value = ""; }}
                  className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center gap-2 text-gray-400 text-sm active:scale-95">
                <span style={{ fontSize: 20 }}>📎</span>
                إرفاق صورة أو فيديو كدليل
              </button>
            )}
            {analyzing && (
              <div className="mt-2 flex items-center gap-2 text-purple-300 text-xs">
                <div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin" />
                جاري تحليل الصورة بالذكاء الاصطناعي...
              </div>
            )}
            {aiAnalysis && !analyzing && (
              <div className="mt-2 p-3 rounded-2xl text-xs text-gray-300 leading-relaxed"
                style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)" }}>
                <p className="text-purple-300 font-bold mb-1">🤖 تحليل الذكاء الاصطناعي:</p>
                {aiAnalysis}
              </div>
            )}
          </div>

          <button onClick={handleSubmit} disabled={submitting || !reason || (reportType === "user" && !targetId.trim())}
            className="w-full py-3.5 rounded-2xl text-white font-black text-base disabled:opacity-40 active:scale-95"
            style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}>
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري الإرسال...
              </span>
            ) : "🚨 إرسال البلاغ"}
          </button>
        </>
      )}
    </div>
  );
}

/* ─── Support Tab ─── */
function SupportTab({ myProfile }: { myProfile: any }) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("استفسار عام");
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [myTicket, setMyTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: ticket } = await supabase.from('support_tickets').select('*').maybeSingle();
      setMyTicket(ticket);
      if (ticket) {
        const { data: msgs } = await supabase.from('support_messages').select('*').eq('ticket_id', ticket.id).order('created_at');
        setMessages(msgs || []);
        await supabase.from('support_messages').update({ is_read: true }).eq('ticket_id', ticket.id).eq('is_read', false);
      }
    };
    fetchData();
  }, []);

  const createTicket = async (args: any) => {};
  const sendMessage = async (args: any) => {};
  const generateUploadUrl = async () => "";
  const markRead = async (args: any) => {};

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (myTicket) {
      markRead({ ticketId: myTicket.id }).catch(() => {});
    }
  }, [myTicket, messages?.length]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setMediaPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setMediaPreview("video");
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !mediaFile) return;
    setSending(true);
    try {
      let ticketId = myTicket?._id;
      if (!ticketId) {
        ticketId = await createTicket({ subject });
      }
      let mediaStorageId: any = undefined;
      let mediaType: string | undefined;
      if (mediaFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": mediaFile.type }, body: mediaFile });
        if (!result.ok) throw new Error("فشل رفع الملف");
        const { storageId } = await result.json();
        mediaStorageId = storageId;
        mediaType = mediaFile.type.startsWith("video/") ? "video" : "image";
      }
      await sendMessage({
        ticketId,
        content: input.trim() || (mediaType === "video" ? "🎥 فيديو" : "📷 صورة"),
        mediaStorageId,
        mediaType,
      });
      setInput("");
      setMediaPreview(null);
      setMediaFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: any) {
      toast.error(e.message ?? "حدث خطأ");
    } finally {
      setSending(false);
    }
  };

  const statusColors: Record<string, string> = {
    open: "#22c55e",
    in_progress: "#f59e0b",
    closed: "#6b7280",
  };
  const statusLabels: Record<string, string> = {
    open: "مفتوح",
    in_progress: "قيد المراجعة",
    closed: "مغلق",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Status bar */}
      {myTicket && (
        <div className="px-4 py-2 flex items-center gap-2 flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="w-2 h-2 rounded-full" style={{ background: statusColors[myTicket.status] ?? "#6b7280" }} />
          <span className="text-xs text-gray-400">حالة التذكرة:</span>
          <span className="text-xs font-bold" style={{ color: statusColors[myTicket.status] ?? "#6b7280" }}>
            {statusLabels[myTicket.status] ?? myTicket.status}
          </span>
          <span className="text-gray-600 text-xs mr-auto">فقط السوبر أدمن يمكنه الرد</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {!myTicket && (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "linear-gradient(135deg,rgba(34,197,94,0.2),rgba(34,197,94,0.1))", border: "1px solid rgba(34,197,94,0.3)" }}>
              <span style={{ fontSize: 36 }}>💬</span>
            </div>
            <p className="text-white font-bold text-lg">خدمة العملاء</p>
            <p className="text-gray-500 text-sm mt-1">تحدث مع فريق الدعم مباشرة</p>
            <p className="text-gray-600 text-xs mt-2">يمكنك إرسال صور أو فيديوهات كإثبات</p>
            <div className="mt-4">
              <p className="text-gray-400 text-xs mb-2">موضوع المحادثة</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {["استفسار عام", "مشكلة تقنية", "شكوى", "اقتراح", "مشكلة في الرصيد"].map(s => (
                  <button key={s} onClick={() => setSubject(s)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95"
                    style={subject === s
                      ? { background: "rgba(34,197,94,0.3)", border: "1px solid rgba(34,197,94,0.6)", color: "#4ade80" }
                      : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages?.map((m, i) => {
          const isMe = !m.isAdmin;
          return (
            <div key={i} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              {!isMe && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)" }}>
                  🛡️
                </div>
              )}
              {isMe && myProfile?.avatarUrl && (
                <img src={myProfile.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              )}
              {isMe && !myProfile?.avatarUrl && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black"
                  style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}>
                  {myProfile?.name?.[0] ?? "؟"}
                </div>
              )}
              <div className="max-w-[75%] flex flex-col gap-1">
                {!isMe && <p className="text-[10px] text-yellow-400 font-bold px-1">خدمة العملاء 🛡️</p>}
                {m.mediaUrl && m.mediaType === "image" && (
                  <img src={m.mediaUrl} alt="" className="rounded-2xl max-w-full max-h-48 object-cover" />
                )}
                {m.mediaUrl && m.mediaType === "video" && (
                  <video src={m.mediaUrl} controls className="rounded-2xl max-w-full max-h-48" />
                )}
                {m.content && m.content !== "📷 صورة" && m.content !== "🎥 فيديو" && (
                  <div className="px-4 py-2.5 rounded-2xl text-sm text-white leading-relaxed"
                    style={isMe
                      ? { background: "linear-gradient(135deg,#a855f7,#ec4899)", borderBottomLeftRadius: 4 }
                      : { background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", borderBottomRightRadius: 4 }}>
                    {m.content}
                  </div>
                )}
                <p className="text-[9px] text-gray-600 px-1">
                  {new Date(m.createdAt).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                  {m.isRead && isMe && " ✓✓"}
                </p>
              </div>
            </div>
          );
        })}

        {myTicket?.status === "closed" && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs"
              style={{ background: "rgba(107,114,128,0.2)", border: "1px solid rgba(107,114,128,0.3)", color: "#9ca3af" }}>
              🔒 تم إغلاق هذه المحادثة
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Media preview */}
      {mediaPreview && (
        <div className="px-4 py-2 border-t border-white/8 flex items-center gap-3 flex-shrink-0">
          {mediaPreview === "video"
            ? <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: "rgba(168,85,247,0.2)" }}><span style={{ fontSize: 24 }}>🎥</span></div>
            : <img src={mediaPreview} alt="" className="w-14 h-14 rounded-xl object-cover" />
          }
          <p className="text-gray-400 text-xs flex-1">{mediaPreview === "video" ? "فيديو جاهز للإرسال" : "صورة جاهزة للإرسال"}</p>
          <button onClick={() => { setMediaPreview(null); setMediaFile(null); if (fileRef.current) fileRef.current.value = ""; }}
            className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* Input */}
      {myTicket?.status !== "closed" && (
        <div className="flex-shrink-0 px-4 py-3 border-t border-white/8 flex gap-2">
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
          <button onClick={() => fileRef.current?.click()}
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 active:scale-90"
            style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="#4ade80"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </button>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="اكتب رسالتك لخدمة العملاء..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-green-500" />
          <button onClick={handleSend} disabled={(!input.trim() && !mediaFile) || sending}
            className="w-11 h-11 rounded-2xl flex items-center justify-center disabled:opacity-40 active:scale-90 flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}>
            {sending
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            }
          </button>
        </div>
      )}
    </div>
  );
}
