import { useEffect, useState, useRef } from "react";
import { useProfile } from "../components/ProfileManager";
import { supabase } from "../lib/supabaseClient";
import { toast } from "../lib/toast";
import { ARAB_COUNTRIES } from "../data/countries";
import { useDeviceFingerprint } from "../hooks/useDeviceFingerprint";
import BannedScreen from "../components/BannedScreen";

interface RegisterPageProps {
  onBack: () => void;
  isProfileSetup?: boolean;
}

// مكوّن التحقق من كود الدعوة
function ReferralCodeChecker({ code }: { code: string }) {
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (code.length >= 4) {
      const validate = async () => {
        const { data } = await supabase.from('profiles').select('name').eq('saki_id', code).single();
        if (data) setResult({ valid: true, referrerName: data.name });
        else setResult(null);
      };
      validate();
    }
  }, [code]);

  if (!result && code.length >= 4) {
    return <p className="text-xs mt-1" style={{ color: "#ef4444" }}>كود الدعوة غير صحيح</p>;
  }
  if (result?.valid) {
    return (
      <p className="text-xs mt-1" style={{ color: "#22c55e" }}>
        ✅ كود صحيح - صديقك: {result.referrerName}
      </p>
    );
  }
  return null;
}

export default function RegisterPage({ onBack, isProfileSetup }: RegisterPageProps) {
  const { refreshProfile } = useProfile();
  const fingerprint = useDeviceFingerprint();
  const registrationCheck = null; // Will implement with Supabase RPC later

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [referralCode, setReferralCode] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Block registration if device is banned
  if (fingerprint && registrationCheck && !registrationCheck.allowed) {
    return (
      <BannedScreen
        reason={registrationCheck.reason ?? "هذا الجهاز محظور من إنشاء حسابات جديدة"}
        type="device"
      />
    );
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("أدخل اسمك"); return; }
    if (!country) { toast.error("اختر دولتك"); return; }
    if (!gender) { toast.error("اختر جنسك"); return; }
    setLoading(true);
    try {
      // Read the authoritative user from Supabase after the OAuth callback.
      // React auth state can still be one render behind on Android WebView.
      const { data: { user: authenticatedUser }, error: authUserError } = await supabase.auth.getUser();
      if (authUserError) throw authUserError;
      if (!authenticatedUser) throw new Error("يجب تسجيل الدخول أولاً");

      let avatarUrl = "";
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${authenticatedUser.id}-${Math.random()}.${fileExt}`;
        const { data, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);
        
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(data.path);
        avatarUrl = publicUrl;
      }

      // Save the profile and allocate/reuse the six-digit Saki ID in one
      // server-side transaction. This avoids losing saki_id between a client
      // uniqueness check and the profile upsert.
      const { data: savedProfile, error: profileError } = await supabase.rpc("complete_current_profile", {
        p_name: name.trim(),
        p_country: country,
        p_gender: gender,
        p_avatar_url: avatarUrl || null,
      });

      if (profileError) throw profileError;
      const completedProfile = Array.isArray(savedProfile) ? savedProfile[0] : savedProfile;
      const savedSakiId = completedProfile?.saki_id;
      if (!savedSakiId) throw new Error("تعذر حفظ معرف Saki، حاول مرة أخرى");

      await refreshProfile();
      toast.success(`تم حفظ معلومات الحساب بنجاح — معرف Saki: ${savedSakiId} 🎉`);
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto"
      dir="rtl"
      style={{
        background: "linear-gradient(180deg, #0b2a5b 0%, #1aa6a6 100%)",
        fontFamily: "'Cairo', sans-serif",
      }}
    >
      <div className="w-full max-w-[340px] flex flex-col items-center py-4">

        <h1 className="text-white font-black text-xl mb-1">إكمال معلوماتك</h1>
        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.65)" }}>
          أضف صورتك وبياناتك الشخصية
        </p>

        {/* ── Avatar Picker ── */}
        <div
          className="mb-2 relative cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          style={{ width: 100, height: 100 }}
        >
          <div style={{
            width: 100, height: 100, borderRadius: "50%",
            overflow: "hidden",
            border: "3px solid rgba(255,255,255,0.85)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
            background: "rgba(255,255,255,0.15)",
            position: "relative",
          }}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            ) : (
              <>
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "rgba(0,0,0,0.6)",
                  padding: "5px 0",
                  textAlign: "center",
                }}>
                  <span style={{ color: "white", fontSize: 10, fontWeight: 700 }}>اختيار صورة</span>
                </div>
              </>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.5)" }}>
          اضغط على الدائرة لاختيار صورة من جهازك
        </p>

        <div className="w-full space-y-3">
          {/* Name */}
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="اسم المستخدم"
            className="w-full px-5 py-4 text-gray-800 text-sm focus:outline-none"
            style={{ borderRadius: 30, background: "rgba(255,255,255,0.92)", border: "none" }}
          />

          {/* Country */}
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="w-full px-5 py-4 text-sm focus:outline-none appearance-none"
            style={{ borderRadius: 30, background: "rgba(255,255,255,0.92)", border: "none", color: country ? "#1a1a1a" : "#9ca3af" }}
          >
            <option value="" style={{ color: "#9ca3af" }}>اختر الدولة</option>
            {ARAB_COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
            ))}
          </select>

          {/* Gender */}
          <select
            value={gender}
            onChange={e => setGender(e.target.value as "male" | "female" | "")}
            className="w-full px-5 py-4 text-sm focus:outline-none appearance-none"
            style={{ borderRadius: 30, background: "rgba(255,255,255,0.92)", border: "none", color: gender ? "#1a1a1a" : "#9ca3af" }}
          >
            <option value="" style={{ color: "#9ca3af" }}>اختر الجنس</option>
            <option value="male">👨 ذكر</option>
            <option value="female">👩 أنثى</option>
          </select>

          {/* Referral Code */}
          <div>
            <input
              value={referralCode}
              onChange={e => setReferralCode(e.target.value.toUpperCase())}
              placeholder="كود الدعوة (اختياري)"
              maxLength={12}
              className="w-full px-5 py-4 text-gray-800 text-sm focus:outline-none"
              style={{ borderRadius: 30, background: "rgba(255,255,255,0.92)", border: "none" }}
            />
            {referralCode && (
              <div className="px-2 mt-1">
                <ReferralCodeChecker code={referralCode} />
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 font-black text-black text-base transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: "#FFD400", borderRadius: 30, boxShadow: "0 4px 20px rgba(255,212,0,0.4)" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                جارٍ الحفظ...
              </span>
            ) : "حفظ والمتابعة 🚀"}
          </button>

          {!isProfileSetup && (
            <button
              onClick={onBack}
              className="w-full py-3 text-center text-sm"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              ← العودة لتسجيل الدخول
            </button>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
      `}</style>
    </div>
  );
}
