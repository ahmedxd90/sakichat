// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "../lib/toast";

interface AiChatPanelProps {
  onClose: () => void;
  chatWithAI: (args: { message: string; history: { role: string; content: string }[] }) => Promise<string>;
  enableImageAnalysis?: boolean;
  enableReport?: boolean;
}

type Message = {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
};

const REPORT_REASONS = ["محتوى مسيء", "تحرش أو مضايقة", "محتوى جنسي", "انتحال شخصية", "احتيال", "محتوى عنيف", "أخرى"];

export default function AiChatPanel({ onClose, chatWithAI, enableImageAnalysis = true, enableReport = true }: AiChatPanelProps) {
  const [history, setHistory] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const analyzeImage = async (args: any) => {
    return "تحليل الصورة غير متاح حالياً في نسخة Supabase.";
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

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
      if (userMsg.imageUrl && enableImageAnalysis) {
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

  const suggestions = [
    "اقترح لي موضوع محادثة 💬",
    "أخبرني نكتة مضحكة 😄",
    "ساعدني في كتابة رسالة 💌",
    "اكتب لي حالة مميزة ✨",
  ];

  return (
    <div className="fixed inset-0 z-[400] flex flex-col bg-[#0a0a14]" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 flex-shrink-0"
        style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.15),rgba(236,72,153,0.1))" }}>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:scale-90">
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
        {enableReport && (
          <button onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
            🚨 بلاغ
          </button>
        )}
      </div>

      {/* Messages */}
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
              {m.imageUrl && (
                <img src={m.imageUrl} alt="" className="rounded-2xl max-w-[200px] max-h-[200px] object-cover" />
              )}
              <div className="px-4 py-2.5 rounded-2xl text-sm text-white leading-relaxed"
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
                <div key={i} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Image preview */}
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

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-white/8 flex gap-2">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
        {enableImageAnalysis && (
          <button onClick={() => fileRef.current?.click()}
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 active:scale-90"
            style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5" fill="#a855f7"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </button>
        )}
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
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

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal onClose={() => setShowReportModal(false)} analyzeImage={analyzeImage} />
      )}
    </div>
  );
}

function ReportModal({ onClose, analyzeImage }: { onClose: () => void; analyzeImage: any }) {
  const [sakiId, setSakiId] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const reportBySakiId = async (args: any) => {
    const { data: reporter } = await supabase.auth.getUser();
    const { data: reported } = await supabase.from('profiles').select('id, name').eq('saki_id', args.sakiId).single();
    if (!reported) throw new Error("المستخدم غير موجود");
    const { error } = await supabase.from('user_reports').insert({
      reporter_id: reporter.user?.id,
      reported_id: reported.id,
      reason: args.reason,
      details: args.details,
      ai_analysis: args.aiAnalysis
    });
    if (error) throw error;
    return { reportedName: reported.name };
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const url = ev.target?.result as string;
      setImagePreview(url);
      setAnalyzing(true);
      try {
        const analysis = await analyzeImage({ imageUrl: url, reportedSakiId: sakiId || undefined });
        setAiAnalysis(analysis ?? "");
      } catch { /* ignore */ }
      finally { setAnalyzing(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!sakiId.trim()) return toast.error("أدخل Saki ID");
    if (!reason) return toast.error("اختر سبب البلاغ");
    setSubmitting(true);
    try {
      const result = await reportBySakiId({
        sakiId: sakiId.trim(),
        reason,
        details: details.trim() || undefined,
        aiAnalysis: aiAnalysis || undefined,
      });
      toast.success(`تم إرسال البلاغ بحق ${result.reportedName} ✅`);
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "حدث خطأ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-end justify-center bg-black/70" dir="rtl">
      <div className="w-full max-w-lg rounded-t-3xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ background: "#0f0f1a", border: "1px solid rgba(239,68,68,0.3)" }}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 flex-shrink-0"
          style={{ background: "linear-gradient(135deg,rgba(239,68,68,0.15),rgba(239,68,68,0.05))" }}>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <span className="text-2xl">🚨</span>
          <div>
            <p className="text-white font-black text-base">إرسال بلاغ</p>
            <p className="text-red-300 text-xs">بلّغ عن مستخدم مخالف</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div>
            <label className="text-gray-400 text-xs font-semibold mb-2 block">Saki ID للمستخدم المُبلَّغ عنه</label>
            <input value={sakiId} onChange={e => setSakiId(e.target.value)}
              placeholder="أدخل Saki ID..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-red-500"
              dir="ltr" />
          </div>

          <div>
            <label className="text-gray-400 text-xs font-semibold mb-2 block">سبب البلاغ</label>
            <div className="flex flex-wrap gap-2">
              {REPORT_REASONS.map(r => (
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

          <div>
            <label className="text-gray-400 text-xs font-semibold mb-2 block">تفاصيل إضافية (اختياري)</label>
            <textarea value={details} onChange={e => setDetails(e.target.value)}
              placeholder="اكتب تفاصيل إضافية..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none" />
          </div>

          <div>
            <label className="text-gray-400 text-xs font-semibold mb-2 block">إرفاق صورة دليل (اختياري)</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="" className="w-full rounded-2xl max-h-48 object-cover" />
                <button onClick={() => { setImagePreview(null); setAiAnalysis(""); if (fileRef.current) fileRef.current.value = ""; }}
                  className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center gap-2 text-gray-400 text-sm active:scale-95">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                إرفاق صورة دليل
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
        </div>

        <div className="px-4 py-4 border-t border-white/8 flex-shrink-0">
          <button onClick={handleSubmit} disabled={submitting || !sakiId.trim() || !reason}
            className="w-full py-3.5 rounded-2xl text-white font-black text-base disabled:opacity-40 active:scale-95"
            style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}>
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري الإرسال...
              </span>
            ) : "🚨 إرسال البلاغ"}
          </button>
        </div>
      </div>
    </div>
  );
}
