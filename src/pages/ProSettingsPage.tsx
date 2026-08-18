// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "../lib/toast";

interface ProSettingsPageProps {
  onBack: () => void;
}

export default function ProSettingsPage({ onBack }: ProSettingsPageProps) {
  const proStatus = useQuery(api.proMembership.getMyProStatus);
  const updateSettings = useMutation(api.proMembership.updateProSettings);
  const currentLevel = proStatus?.isPro ? (proStatus.proLevel ?? 1) : 0;

  const [settings, setSettings] = useState({
    glowingName: true,
    lionEntry: true,
    antiKick: true,
    privateProfile: false,
    hideRoomPresence: false,
  });

  useEffect(() => {
    if (proStatus?.proSettings) {
      setSettings(proStatus.proSettings);
    }
  }, [proStatus]);

  const handleToggle = async (key: string) => {
    const next = { ...settings, [key]: !settings[key as keyof typeof settings] };
    setSettings(next);
    try {
      await updateSettings(next);
      toast.success("تم تحديث إعدادات PRO بنجاح");
    } catch (e: any) {
      toast.error("فشل حفظ الإعدادات");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900" dir="rtl">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-700 active:scale-90 transition-transform">
          ✕
        </button>
        <h1 className="font-black text-lg text-gray-900">إعدادات مميزات PRO</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4 overflow-y-auto">
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-800 leading-relaxed">
          يمكنك هنا التحكم الكامل في تفعيل أو تعطيل ميزات عضوية PRO الملكية حسب رغبتك الشخصية.
        </div>

        <div className="space-y-3">
          {[
            { key: "glowingName", title: "الاسم اللامع الملون", desc: "تفعيل اسمك المتحرك الملون في جميع أنحاء التطبيق وفي الغرف.", minLevel: 1 },
            { key: "lionEntry", title: "دخولية الأسد الناري", desc: "عرض تأثير الأسد الفخم والمؤثرات الصوتية عند دخولك إلى أي غرفة.", minLevel: 2 },
            { key: "antiKick", title: "الحصانة وضد الطرد", desc: "حماية كاملة من الطرد من غرف الدردشة عبر أدوات المشرفين العادية.", minLevel: 3 },
            { key: "privateProfile", title: "الملف الشخصي الخاص", desc: "إخفاء اللحظات، الهدايا، والمستوى عن غير الأصدقاء.", minLevel: 1 },
            { key: "hideRoomPresence", title: "إخفاء الوجود في الغرفة", desc: "عدم ظهور فقاعة الغرفة في بروفايلك عند تواجِدك داخل غرفة صوتية.", minLevel: 1 },
          ].map((item) => {
            const isLocked = currentLevel < item.minLevel;
            const isActive = settings[item.key as keyof typeof settings];
            return (
              <div key={item.key} className={`flex items-center justify-between p-4 border rounded-2xl ${isLocked ? "bg-gray-100 border-gray-200 opacity-60" : "bg-gray-50 border-gray-100"}`}>
                <div className="flex-1 ml-4">
                  <h4 className="font-bold text-sm text-gray-900">{item.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => !isLocked && handleToggle(item.key)}
                  disabled={isLocked}
                  title={isLocked ? `تحتاج إلى PRO ${item.minLevel}` : undefined}
                  className={`w-14 h-8 rounded-full transition-colors relative p-1 ${isLocked ? "bg-gray-300 cursor-not-allowed" : isActive ? "bg-amber-500" : "bg-gray-300"}`}>
                  <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform ${isActive ? "translate-x-0" : "-translate-x-6"}`} />
                  {isLocked && <span className="absolute -top-2 -left-1 text-[9px] font-black text-slate-500">PRO {item.minLevel}</span>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
