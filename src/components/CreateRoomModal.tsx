import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "../lib/toast";
import { ARAB_COUNTRIES } from "../data/countries";

interface CreateRoomModalProps {
  onClose: () => void;
}

export default function CreateRoomModal({ onClose }: CreateRoomModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("أدخل اسم الغرفة");
    if (!country) return toast.error("اختر دولة الغرفة");

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("يجب تسجيل الدخول");

      const { error } = await supabase.from('rooms').insert({
        name: name.trim(),
        description: description.trim() || null,
        country,
        owner_id: user.id,
      });
      
      if (error) throw error;
      
      toast.success("تم إنشاء الغرفة!");
      onClose();
    } catch (e: any) {
      const message = e?.code === "42501"
        ? "لا تملك صلاحية إنشاء الغرفة بهذا الحساب"
        : e?.message || "تعذر إنشاء الغرفة، حاول مرة أخرى";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end" dir="rtl">
      <div className="w-full bg-[#1a1a2e] rounded-t-3xl p-6 border-t border-white/10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg">إنشاء غرفة جديدة</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">اسم الغرفة</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسم الغرفة"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">وصف الغرفة (اختياري)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر للغرفة"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">الدولة</label>
            <div className="relative">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-[#0f0f1a] border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 appearance-none"
              >
                <option value="">اختر الدولة</option>
                {ARAB_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 text-sm"
          >
            إلغاء
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold shadow-lg shadow-purple-500/20 disabled:opacity-50"
          >
            {loading ? "جاري الإنشاء..." : "إنشاء الغرفة"}
          </button>
        </div>
      </div>
    </div>
  );
}
