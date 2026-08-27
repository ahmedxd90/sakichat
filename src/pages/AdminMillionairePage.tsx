// @ts-nocheck
import { supabase } from "../lib/supabaseClient";
import { useState, useEffect } from "react";
import { toast } from "../lib/toast";

export default function AdminMillionairePage({ onBack }: { onBack: () => void }) {
  const [questions, setQuestions] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('millionaire_questions').select('*').order('created_at', { ascending: false });
      setQuestions(data || []);
    };
    fetchData();
  }, []);

  const addQuestion = async (args: any) => {};
  const deleteQuestion = async (args: any) => {};
  const seedQuestions = async (args: any) => ({ count: 0 });

  const [form, setForm] = useState({
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctOption: "A" as "A" | "B" | "C" | "D",
    difficulty: "medium" as "easy" | "medium" | "hard",
  });
  const [adding, setAdding] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleAdd = async () => {
    if (!form.question.trim() || !form.optionA.trim() || !form.optionB.trim() || !form.optionC.trim() || !form.optionD.trim()) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }
    setAdding(true);
    try {
      await addQuestion(form);
      setForm({ question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A", difficulty: "medium" });
      setShowForm(false);
      toast.success("تم إضافة السؤال ✅");
    } catch (e: any) { toast.error(e.message); }
    finally { setAdding(false); }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await seedQuestions({});
      if (res.count > 0) {
        toast.success(`✅ تم إضافة ${res.count} سؤال بنجاح!`);
      } else {
        toast.info(res.message ?? "الأسئلة موجودة بالفعل");
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setSeeding(false); }
  };

  const difficultyColors: Record<string, string> = { easy: "#00c864", medium: "#ffd700", hard: "#ef4444" };
  const difficultyLabels: Record<string, string> = { easy: "سهل", medium: "متوسط", hard: "صعب" };

  return (
    <div className="min-h-screen flex flex-col" dir="rtl"
      style={{ background: "linear-gradient(180deg, #000d2e 0%, #000510 100%)" }}>

      <div className="sticky top-0 z-40 backdrop-blur-xl"
        style={{ background: "rgba(0,13,46,0.97)", borderBottom: "1px solid rgba(255,215,0,0.2)" }}>
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.3)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffd700" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-white font-black text-base">أسئلة من سيربح المليون</h1>
            <p className="text-yellow-500/70 text-xs">{questions?.length ?? 0} سؤال متاح</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg, #ffd700, #c8a000)", color: "#000" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M12 5v14M5 12h14" />
            </svg>
            إضافة
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-10">

        {/* زر زرع الأسئلة الافتراضية */}
        {questions !== undefined && questions.length === 0 && (
          <div className="rounded-2xl p-5 text-center"
            style={{ background: "rgba(255,215,0,0.06)", border: "2px dashed rgba(255,215,0,0.3)" }}>
            <div className="text-5xl mb-3">🎯</div>
            <p className="text-white font-black text-base mb-1">لا توجد أسئلة بعد</p>
            <p className="text-gray-500 text-xs mb-4">أضف الأسئلة الافتراضية (15 سؤال) بضغطة واحدة</p>
            <button onClick={handleSeed} disabled={seeding}
              className="px-6 py-3 rounded-xl font-black text-sm active:scale-95 transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #ffd700, #c8a000)", color: "#000", boxShadow: "0 0 20px rgba(255,215,0,0.4)" }}>
              {seeding ? "⏳ جاري الإضافة..." : "🚀 إضافة الأسئلة الافتراضية (15 سؤال)"}
            </button>
          </div>
        )}

        {/* نموذج إضافة سؤال */}
        {showForm && (
          <div className="rounded-2xl p-4 space-y-3"
            style={{ background: "rgba(255,215,0,0.05)", border: "2px solid rgba(255,215,0,0.3)" }}>
            <h3 className="text-yellow-400 font-black text-sm">➕ إضافة سؤال جديد</h3>
            <div>
              <label className="text-gray-400 text-xs font-bold mb-1 block">نص السؤال</label>
              <textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="اكتب السؤال هنا..." rows={2}
                className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none resize-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,215,0,0.2)" }} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["A", "B", "C", "D"] as const).map((opt) => (
                <div key={opt}>
                  <label className="text-xs font-bold mb-1 block"
                    style={{ color: form.correctOption === opt ? "#ffd700" : "#6b7280" }}>
                    {opt} {form.correctOption === opt ? "✅" : ""}
                  </label>
                  <input value={form[`option${opt}` as keyof typeof form] as string}
                    onChange={(e) => setForm({ ...form, [`option${opt}`]: e.target.value })}
                    placeholder={`الخيار ${opt}...`}
                    className="w-full px-3 py-2 rounded-xl text-white text-xs outline-none"
                    style={{
                      background: form.correctOption === opt ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.06)",
                      border: form.correctOption === opt ? "1px solid rgba(255,215,0,0.4)" : "1px solid rgba(255,255,255,0.1)",
                    }} />
                </div>
              ))}
            </div>
            <div>
              <label className="text-gray-400 text-xs font-bold mb-2 block">الإجابة الصحيحة</label>
              <div className="flex gap-2">
                {(["A", "B", "C", "D"] as const).map((opt) => (
                  <button key={opt} onClick={() => setForm({ ...form, correctOption: opt })}
                    className="flex-1 py-2 rounded-xl text-sm font-black active:scale-95"
                    style={form.correctOption === opt
                      ? { background: "linear-gradient(135deg, #ffd700, #c8a000)", color: "#000" }
                      : { background: "rgba(255,255,255,0.05)", color: "#6b7280" }}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-xs font-bold mb-2 block">الصعوبة</label>
              <div className="flex gap-2">
                {(["easy", "medium", "hard"] as const).map((d) => (
                  <button key={d} onClick={() => setForm({ ...form, difficulty: d })}
                    className="flex-1 py-2 rounded-xl text-xs font-black active:scale-95"
                    style={form.difficulty === d
                      ? { background: `${difficultyColors[d]}20`, color: difficultyColors[d], border: `1px solid ${difficultyColors[d]}50` }
                      : { background: "rgba(255,255,255,0.05)", color: "#6b7280" }}>
                    {difficultyLabels[d]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} disabled={adding}
                className="flex-1 py-3 rounded-xl font-black text-sm active:scale-95 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #ffd700, #c8a000)", color: "#000" }}>
                {adding ? "جاري الإضافة..." : "✅ إضافة"}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-4 py-3 rounded-xl font-black text-sm active:scale-95"
                style={{ background: "rgba(255,255,255,0.05)", color: "#6b7280" }}>
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* قائمة الأسئلة */}
        {!questions ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : questions.length === 0 && !showForm ? null : questions.length > 0 ? (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id} className="rounded-2xl p-4"
                style={{ background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.15)" }}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
                      style={{ background: "linear-gradient(135deg, #ffd700, #c8a000)", color: "#000" }}>
                      {idx + 1}
                    </div>
                    <p className="text-white font-bold text-sm leading-relaxed">{q.question}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black"
                      style={{ background: `${difficultyColors[q.difficulty]}20`, color: difficultyColors[q.difficulty] }}>
                      {difficultyLabels[q.difficulty]}
                    </span>
                    <button onClick={async () => {
                      if (!confirm("حذف هذا السؤال؟")) return;
                      try { await deleteQuestion({ questionId: q.id }); toast.success("تم الحذف"); }
                      catch (e: any) { toast.error(e.message); }
                    }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90"
                      style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                        <path d="M3 6h18M19 6v14H5V6m3 0V4h8v2" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["A", "B", "C", "D"] as const).map((opt) => (
                    <div key={opt} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
                      style={{
                        background: q.correctOption === opt ? "rgba(0,200,100,0.15)" : "rgba(255,255,255,0.04)",
                        border: q.correctOption === opt ? "1px solid rgba(0,200,100,0.4)" : "1px solid rgba(255,255,255,0.08)",
                      }}>
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black flex-shrink-0"
                        style={{ background: q.correctOption === opt ? "#00c864" : "rgba(255,255,255,0.1)", color: q.correctOption === opt ? "#fff" : "#6b7280" }}>
                        {opt}
                      </span>
                      <span className={`text-[10px] leading-tight ${q.correctOption === opt ? "text-green-400 font-bold" : "text-gray-400"}`}>
                        {(q as any)[`option${opt}`]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
