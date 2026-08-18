// @ts-nocheck
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { toast } from "../lib/toast";

function SectionHeader({ title, subtitle, icon, color = "#6366f1" }: {
  title: string; subtitle?: string; icon: string; color?: string;
}) {
  return (
    <div className="px-4 pt-5 pb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          {icon}
        </div>
        <div>
          <h2 className="text-white font-black text-base">{title}</h2>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export default function AdminAppVersionTab() {
  const versionData = useQuery(api.appVersion.getAppVersion);
  const setAppVersion = useMutation(api.appVersion.setAppVersion);
  const [version, setVersion] = useState("1.0.0");
  const [minVersion, setMinVersion] = useState("1.0.0");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [forceUpdate, setForceUpdate] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (versionData) {
      setVersion(versionData.version);
      setMinVersion(versionData.minVersion);
      setReleaseNotes(versionData.releaseNotes ?? "");
      setForceUpdate(versionData.forceUpdate);
    }
  }, [versionData]);

  const handleSave = async () => {
    if (!version || !minVersion) {
      toast.error("يجب إدخال النسخة والحد الأدنى");
      return;
    }
    setLoading(true);
    try {
      await setAppVersion({
        version,
        minVersion,
        releaseNotes: releaseNotes || undefined,
        forceUpdate,
      });
      toast.success("✅ تم حفظ إعدادات التحديث");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <SectionHeader
        title="إدارة التحديثات"
        subtitle="تحكم في إجبار المستخدمين على التحديث"
        icon="🔄"
        color="#a855f7"
      />

      {/* شرح النظام */}
      <div className="rounded-2xl p-4 space-y-2"
        style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
        <p className="text-purple-300 text-xs font-bold">⚠️ كيف يعمل نظام التحديث الإجباري:</p>
        <p className="text-gray-400 text-xs">
          • النسخة الحالية المثبتة في الكود: <span className="text-white font-bold">1.0.0</span>
        </p>
        <p className="text-gray-400 text-xs">
          • إذا كانت نسخة المستخدم أقل من "الحد الأدنى" → تظهر شاشة التحديث الإجبارية ولا يمكن تجاوزها
        </p>
        <p className="text-gray-400 text-xs">
          • مثال: لإجبار التحديث اضبط الحد الأدنى على <span className="text-yellow-400">1.0.1</span> وهذا سيجبر جميع المستخدمين على التحديث
        </p>
        <p className="text-gray-400 text-xs">
          • لإلغاء التحديث الإجباري: اضبط الحد الأدنى على <span className="text-green-400">1.0.0</span> أو عطّل الخيار
        </p>
      </div>

      {/* الإعدادات الحالية */}
      {versionData ? (
        <div className="rounded-2xl p-3 flex items-center gap-3"
          style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <span className="text-2xl">📱</span>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">الإعدادات الحالية في قاعدة البيانات</p>
            <p className="text-gray-400 text-xs">
              النسخة المطلوبة: <span className="text-white">{versionData.version}</span>
              {" | "}
              الحد الأدنى: <span className="text-white">{versionData.minVersion}</span>
            </p>
            <p className="text-xs mt-0.5"
              style={{ color: versionData.forceUpdate ? "#ef4444" : "#10b981" }}>
              {versionData.forceUpdate
                ? "🔴 التحديث الإجباري مفعّل - المستخدمون القدامى لا يستطيعون الدخول"
                : "🟢 التحديث الإجباري معطّل - الجميع يستطيع الدخول"}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl p-3 text-center"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <p className="text-gray-500 text-xs">لم يتم ضبط إعدادات التحديث بعد</p>
        </div>
      )}

      {/* النسخة الجديدة */}
      <div>
        <label className="text-gray-400 text-xs font-bold mb-2 block">
          النسخة الجديدة للتطبيق (مثال: 1.1.0)
        </label>
        <input
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          placeholder="1.0.0"
          className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(168,85,247,0.3)" }}
          dir="ltr"
        />
        <p className="text-gray-500 text-xs mt-1">هذا الرقم يظهر للمستخدم في شاشة التحديث</p>
      </div>

      {/* الحد الأدنى */}
      <div>
        <label className="text-gray-400 text-xs font-bold mb-2 block">
          الحد الأدنى المطلوب (مثال: 1.0.1)
        </label>
        <input
          value={minVersion}
          onChange={(e) => setMinVersion(e.target.value)}
          placeholder="1.0.0"
          className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(168,85,247,0.3)" }}
          dir="ltr"
        />
        <p className="text-gray-500 text-xs mt-1">
          المستخدمون الذين نسختهم أقل من هذا الرقم سيُجبرون على التحديث
        </p>
      </div>

      {/* ملاحظات التحديث */}
      <div>
        <label className="text-gray-400 text-xs font-bold mb-2 block">
          ملاحظات التحديث (اختياري)
        </label>
        <textarea
          value={releaseNotes}
          onChange={(e) => setReleaseNotes(e.target.value)}
          placeholder="ما الجديد في هذا التحديث... مثال: إصلاح مشاكل، ميزات جديدة..."
          rows={3}
          className="w-full px-4 py-3 rounded-2xl text-white text-sm outline-none resize-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
        />
      </div>

      {/* تفعيل/تعطيل */}
      <button
        onClick={() => setForceUpdate(!forceUpdate)}
        className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-between px-4 transition-all"
        style={forceUpdate
          ? { background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }
          : { background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }
        }
      >
        <span>{forceUpdate ? "🔴 التحديث الإجباري مفعّل" : "🟢 التحديث الإجباري معطّل"}</span>
        <span className="text-xs opacity-70">{forceUpdate ? "انقر لتعطيل" : "انقر لتفعيل"}</span>
      </button>

      {/* زر الحفظ */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full py-4 rounded-2xl text-white font-black text-sm active:scale-95 disabled:opacity-50 transition-all"
        style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow: "0 4px 20px rgba(168,85,247,0.3)" }}
      >
        {loading ? "⏳ جاري الحفظ..." : "💾 حفظ الإعدادات"}
      </button>

      {/* تحذير */}
      <div className="rounded-2xl p-3"
        style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
        <p className="text-red-400 text-xs font-bold mb-1">⚠️ تحذير مهم:</p>
        <p className="text-gray-400 text-xs">
          عند تفعيل التحديث الإجباري مع حد أدنى أعلى من النسخة الحالية (1.0.0)، سيُجبر جميع المستخدمين على التحديث ولن يتمكنوا من استخدام التطبيق حتى يتم نشر نسخة جديدة بالرقم المطلوب.
        </p>
      </div>
    </div>
  );
}
