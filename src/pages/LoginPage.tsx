import { useAuthActions } from "@convex-dev/auth/react";
import { Capacitor } from "@capacitor/core";
import { useState, useRef, useEffect } from "react";
import { toast } from "../lib/toast";
import { useConvex, useMutation } from "convex/react";
import { Browser } from "@capacitor/browser";
import { api } from "../../convex/_generated/api";
import { CONVEX_AUTH_OAUTH_VERIFIER_STORAGE_KEY } from "../lib/convexClient";
import { ARAB_COUNTRIES } from "../data/countries";
import { useDeviceFingerprint } from "../hooks/useDeviceFingerprint";

// ── Privacy Policy Page ──
function PolicyPage({ type, onClose }: { type: "privacy" | "terms"; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[999] flex flex-col" dir="rtl"
      style={{ background: "linear-gradient(180deg,#0a0010 0%,#050008 100%)" }}>
      <div className="flex items-center gap-3 px-4 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(168,85,247,0.2)" }}>
        <button onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h1 className="text-white font-black text-lg">
          {type === "privacy" ? "سياسة الخصوصية" : "شروط الاستخدام"}
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
        {type === "privacy" ? (
          <>
            <Section title="مقدمة">نحن في ساكي نلتزم بحماية خصوصيتك وبياناتك الشخصية.</Section>
            <Section title="المعلومات التي نجمعها">نجمع المعلومات التي تقدمها مباشرةً مثل الاسم والبريد الإلكتروني وصورة الملف الشخصي.</Section>
            <Section title="كيف نستخدم معلوماتك">نستخدم معلوماتك لتشغيل الخدمة وتحسينها وضمان أمان حسابك.</Section>
            <Section title="الأمان">نستخدم تشفيراً متقدماً لحماية بياناتك.</Section>
            <Section title="التواصل معنا">privacy@saki.app</Section>
          </>
        ) : (
          <>
            <Section title="قبول الشروط">باستخدامك لتطبيق ساكي، فإنك توافق على الالتزام بهذه الشروط.</Section>
            <Section title="استخدام الخدمة">يجب أن يكون عمرك 13 عاماً أو أكثر لاستخدام التطبيق.</Section>
            <Section title="المحتوى المحظور">يُحظر نشر أي محتوى مسيء أو مخالف للقانون.</Section>
            <Section title="التواصل معنا">support@saki.app</Section>
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4 space-y-2"
      style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)" }}>
      <h3 className="text-purple-300 font-black text-sm">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{children}</p>
    </div>
  );
}

// ── Register Step 1: Email & Password ──
function RegisterStep1({ onNext, onBack }: { onNext: (email: string, password: string) => void; onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuthActions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (password.length < 6) { toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    setSubmitting(true);
    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);
    formData.set("flow", "signUp");
    try {
      await signIn("password", formData);
      onNext(email, password);
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg.includes("already")) toast.error("هذا البريد الإلكتروني مسجل مسبقاً");
      else toast.error("تعذّر إنشاء الحساب");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6 py-10"
      dir="rtl"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        fontFamily: "'Cairo', sans-serif",
      }}
    >
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.55)" }} />
      <div className="relative z-10 w-full max-w-[340px] flex flex-col items-center">
        {/* Logo */}
        <div className="mb-4" style={{ width: 80, height: 80, borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", border: "2px solid rgba(255,255,255,0.15)" }}>
          <img src="https://a.top4top.io/p_3752kw5ce1.jpg" alt="Saki" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <h1 className="text-white font-black text-xl mb-1">إنشاء حساب جديد</h1>
        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.65)" }}>أدخل بريدك وكلمة المرور</p>

        <form onSubmit={handleSubmit} className="w-full space-y-3">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="البريد الإلكتروني" required dir="ltr"
            className="w-full px-5 py-4 text-gray-800 text-sm focus:outline-none"
            style={{ borderRadius: 30, background: "rgba(255,255,255,0.92)", border: "none" }}
          />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="كلمة المرور (6 أحرف على الأقل)" required dir="ltr"
            className="w-full px-5 py-4 text-gray-800 text-sm focus:outline-none"
            style={{ borderRadius: 30, background: "rgba(255,255,255,0.92)", border: "none" }}
          />
          <button type="submit" disabled={submitting || !email.trim() || !password.trim()}
            className="w-full py-4 font-black text-black text-base transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: "#FFD400", borderRadius: 30, boxShadow: "0 4px 20px rgba(255,212,0,0.4)" }}>
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                جارٍ...
              </span>
            ) : "التالي ←"}
          </button>
        </form>

        <button onClick={onBack} className="mt-4 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          ← العودة لتسجيل الدخول
        </button>
      </div>
    </div>
  );
}

// ── Register Step 2: Profile Info ──
function RegisterStep2({ onBack }: { onBack: () => void }) {
  const createProfile = useMutation(api.profiles.createProfile);
  const generateUploadUrl = useMutation(api.hostAgency.generateUploadUrl);

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [referralCode, setReferralCode] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setSubmitting(true);
    try {
      let avatarStorageId: any = undefined;
      if (avatarFile) {
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": avatarFile.type },
          body: avatarFile,
        });
        const json = await res.json();
        avatarStorageId = json.storageId;
      }
      await createProfile({
        name: name.trim(),
        country,
        gender: gender as "male" | "female",
        avatarStorageId,
        referralCode: referralCode.trim() || undefined,
      });
      toast.success("تم إنشاء الحساب بنجاح! 🎉");
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ");
    } finally {
      setSubmitting(false);
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
        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.65)" }}>أضف صورتك وبياناتك الشخصية</p>

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
        <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.5)" }}>اضغط على الدائرة لاختيار صورة من جهازك</p>

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
          <input
            value={referralCode}
            onChange={e => setReferralCode(e.target.value)}
            placeholder="كود الدعوة (اختياري)"
            className="w-full px-5 py-4 text-gray-800 text-sm focus:outline-none"
            style={{ borderRadius: 30, background: "rgba(255,255,255,0.92)", border: "none" }}
          />

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-4 font-black text-black text-base transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: "#FFD400", borderRadius: 30, boxShadow: "0 4px 20px rgba(255,212,0,0.4)" }}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                جارٍ الحفظ...
              </span>
            ) : "حفظ والمتابعة 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Register Flow ──
function RegisterForm({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<"auth" | "profile">("auth");

  if (step === "auth") {
    return <RegisterStep1 onNext={() => setStep("profile")} onBack={onBack} />;
  }
  return <RegisterStep2 onBack={onBack} />;
}

// ── Android-only Google login ──
function AndroidOnlyLogin({
  submitting,
  onGoogleLogin,
  onPolicy,
}: {
  submitting: boolean;
  onGoogleLogin: () => void;
  onPolicy: (type: "privacy" | "terms") => void;
}) {
  const loginBackground = "https://i.top4top.io/p_3881bvk7t0.png";
  const appIcon = "https://a.top4top.io/p_3752kw5ce1.jpg";

  return (
    <div
      className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-6 py-10"
      dir="rtl"
      style={{
        backgroundImage: `url("${loginBackground}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        fontFamily: "'Cairo', sans-serif",
      }}
    >
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(6,18,43,0.22) 0%, rgba(4,9,26,0.72) 100%)" }} />
      <div className="relative z-10 w-full max-w-[360px] flex flex-col items-center text-center">
        <div
          className="mb-4 overflow-hidden"
          style={{ width: 92, height: 92, borderRadius: 26, boxShadow: "0 10px 34px rgba(0,0,0,0.42)", border: "2px solid rgba(255,255,255,0.72)" }}
        >
          <img src={appIcon} alt="Saki Chat" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <h1 className="text-white font-black text-3xl tracking-wide" style={{ textShadow: "0 2px 14px rgba(0,0,0,0.6)" }}>Saki Chat</h1>
        <p className="mt-2 mb-10 text-sm font-bold" style={{ color: "rgba(255,255,255,0.88)", textShadow: "0 1px 8px rgba(0,0,0,0.55)" }}>
          مجتمع رائع للحفلات على الانترنت
        </p>

        <button
          type="button"
          onClick={onGoogleLogin}
          disabled={submitting}
          className="w-full py-4 font-black text-gray-800 text-base flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-60"
          style={{ background: "rgba(255,255,255,0.96)", borderRadius: 30, boxShadow: "0 7px 24px rgba(0,0,0,0.28)" }}
        >
          <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {submitting ? "جارٍ فتح Google..." : "تسجيل الدخول عبر Google"}
        </button>

        <p className="mt-8 text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.68)" }}>
          بمتابعة الدخول، فإنك توافق على{" "}
          <button type="button" onClick={() => onPolicy("terms")} className="underline" style={{ color: "#ffe07a" }}>شروط الاستخدام</button>
          {" "}و{" "}
          <button type="button" onClick={() => onPolicy("privacy")} className="underline" style={{ color: "#ffe07a" }}>سياسة الخصوصية</button>
        </p>
      </div>
    </div>
  );
}

// ── Main Login Page ──
function withOAuthTimeout<T>(promise: Promise<T>, timeoutMs = 12000) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error("لم يستجب خادم تسجيل الدخول خلال المهلة المحددة")), timeoutMs);
    }),
  ]);
}

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const convex = useConvex();
  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [policyPage, setPolicyPage] = useState<"privacy" | "terms" | null>(null);
  const [oauthDiagnostics, setOauthDiagnostics] = useState<{ stage: string; message?: string; code?: string } | null>(null);

  useEffect(() => {
    const onOAuthState = (event: Event) => {
      const detail = (event as CustomEvent<{ status?: string; message?: string; stage?: string; code?: string }>).detail;
      const status = detail?.status;
      if (status === "success") {
        setSubmitting(false);
        setOauthDiagnostics({ stage: "اكتملت العودة إلى التطبيق", message: "تم استلام رد Google بنجاح." });
      } else if (status === "error") {
        setSubmitting(false);
        setOauthDiagnostics({ stage: detail?.stage ?? "فشل إكمال تسجيل الدخول", message: detail?.message ?? "لم يكتمل تسجيل الدخول.", code: detail?.code });
      }
    };
    window.addEventListener("saki-google-auth-state", onOAuthState);
    return () => window.removeEventListener("saki-google-auth-state", onOAuthState);
  }, []);

  const handleGoogleLogin = async () => {
    setOauthDiagnostics({ stage: "تم الضغط على زر Google" });
    setSubmitting(true);
    try {
      if (Capacitor.getPlatform() === "android") {
        // Android uses the browser OAuth flow. Ask Convex for its signed,
        // stateful redirect first, save the verifier, then open Chrome.
        const redirectTo = "saki.chat.co://callback";
        setOauthDiagnostics({ stage: "جاري الاتصال بخادم تسجيل الدخول", message: `سيتم استخدام رابط العودة ${redirectTo}` });
        const result = await withOAuthTimeout(convex.action(api.auth.signIn, {
          provider: "google",
          params: { redirectTo },
        }));
        if (!result?.redirect || !result.verifier) throw new Error("OAuth redirect was not created");
        localStorage.setItem(CONVEX_AUTH_OAUTH_VERIFIER_STORAGE_KEY, result.verifier);
        setOauthDiagnostics({ stage: "تم إنشاء رابط Google", message: "جاري فتح Chrome لاختيار الحساب." });
        await withOAuthTimeout(Browser.open({ url: String(result.redirect) }), 10000);
      } else {
        await signIn("google", { redirectTo: window.location.origin });
      }
    } catch (err: any) {
      const message = String(err?.message ?? "");
      const errorCode = String(err?.code ?? err?.errorCode ?? "").trim();
      const lowerMessage = message.toLowerCase();
      const cancelled = lowerMessage.includes("cancel") || errorCode === "SIGN_IN_CANCELED";
      if (!cancelled) {
        // Never log tokens or credentials; only log the provider code and safe message.
        console.error("Google OAuth failed", {
          code: errorCode || "UNKNOWN",
          message: message.slice(0, 240),
        });
        const providerCode = errorCode || (lowerMessage.includes("developer") ? "DEVELOPER_ERROR" : "UNKNOWN");
        const nativeHint = message.includes("DEVELOPER_ERROR") || errorCode === "DEVELOPER_ERROR"
          ? "إعداد Google أو بصمة توقيع التطبيق غير مطابقة في Google Cloud/Firebase."
          : message.includes("ID token")
          ? "لم يُرجع Google Play رمز هوية صالحًا."
          : message.includes("ID token verification") || message.includes("server client ID")
            ? "تعذر التحقق من رمز Google على خادم Convex."
            : message.includes("not ready")
              ? "لم تكتمل تهيئة Google Play Services."
              : "تعذّر تسجيل الدخول عبر Google.";
        const diagnostic = message && !message.includes("Google Sign-In failed") ? ` ${message.slice(0, 120)}` : "";
        toast.error(`${nativeHint} [${providerCode}]${diagnostic}`);
      }
      setSubmitting(false);
      setOauthDiagnostics({ stage: "تعذر بدء تسجيل الدخول", message: message || "لم يتم فتح Chrome أو لم يستجب خادم OAuth.", code: errorCode || "UNKNOWN" });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setSubmitting(true);
    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);
    formData.set("flow", "signIn");
    try {
      await signIn("password", formData);
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg.includes("Invalid password")) toast.error("كلمة المرور غير صحيحة");
      else toast.error("تعذّر تسجيل الدخول، تحقق من البيانات");
      setSubmitting(false);
    }
  };

  if (policyPage) {
    return <PolicyPage type={policyPage} onClose={() => setPolicyPage(null)} />;
  }

  if (oauthDiagnostics && !submitting && oauthDiagnostics.stage !== "اكتملت العودة إلى التطبيق") {
    return (
      <div className="fixed inset-0 z-[1200] flex flex-col bg-slate-950 px-5 py-8 text-right text-white" dir="rtl">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15 text-3xl">!</div>
          <h1 className="text-2xl font-black">تشخيص تسجيل دخول Google</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">لم يحدث انتقال إلى Chrome أو لم يكتمل طلب تسجيل الدخول. هذه تفاصيل المرحلة الأخيرة.</p>
          <div className="mt-6 space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5">
            <div><span className="text-xs text-slate-400">المرحلة</span><p className="mt-1 font-black text-amber-300">{oauthDiagnostics.stage}</p></div>
            <div><span className="text-xs text-slate-400">الرسالة</span><p className="mt-1 break-words text-sm leading-6 text-white">{oauthDiagnostics.message || "لم تصل استجابة حتى الآن."}</p></div>
            {oauthDiagnostics.code ? <div><span className="text-xs text-slate-400">الكود</span><p className="mt-1 font-mono text-sm text-red-200">{oauthDiagnostics.code}</p></div> : null}
          </div>
          <button type="button" onClick={() => setOauthDiagnostics(null)} className="mt-6 rounded-2xl bg-amber-400 px-4 py-3.5 font-black text-slate-950">العودة وتجربة الدخول مرة أخرى</button>
        </div>
      </div>
    );
  }

  if (showRegister) {
    return <RegisterForm onBack={() => setShowRegister(false)} />;
  }

  if (Capacitor.getPlatform() === "android") {
    return <AndroidOnlyLogin submitting={submitting} onGoogleLogin={handleGoogleLogin} onPolicy={setPolicyPage} />;
  }

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center"
      dir="rtl"
      style={{
        backgroundImage: "url('https://i.top4top.io/p_3881bvk7t0.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        fontFamily: "'Cairo', sans-serif",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.55)" }} />

      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-6 py-10">
        <div className="w-full max-w-[340px] flex flex-col items-center">

          {/* ── Logo ── */}
          <div className="mb-3"
            style={{
              width: 95, height: 95, borderRadius: 25, overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              border: "2px solid rgba(255,255,255,0.15)",
            }}>
            <img src="https://a.top4top.io/p_3752kw5ce1.jpg" alt="Saki"
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>

          {/* App Name */}
          <h1 className="text-white font-black text-3xl mb-1 tracking-wide"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
            saki
          </h1>

          {/* Subtitle */}
          <p className="text-center text-sm mb-8" style={{ color: "rgba(255,255,255,0.7)" }}>
            مجتمع رائع للحفلات على الإنترنت
          </p>

          {/* ── Login Form ── */}
          <form onSubmit={handleLogin} className="w-full space-y-3">
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني" required dir="ltr"
              className="w-full px-5 py-4 text-gray-800 text-sm focus:outline-none transition-all"
              style={{ borderRadius: 30, background: "rgba(255,255,255,0.92)", border: "none" }}
            />
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="كلمة المرور" required dir="ltr"
              className="w-full px-5 py-4 text-gray-800 text-sm focus:outline-none transition-all"
              style={{ borderRadius: 30, background: "rgba(255,255,255,0.92)", border: "none" }}
            />

            {/* Login Button */}
            <button
              type="submit"
              disabled={submitting || !email.trim() || !password.trim()}
              className="w-full py-4 font-black text-black text-base transition-all active:scale-[0.98] disabled:opacity-50 mt-1"
              style={{ background: "#FFD400", borderRadius: 30, boxShadow: "0 4px 20px rgba(255,212,0,0.45)" }}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  جارٍ الدخول...
                </span>
              ) : "تسجيل الدخول"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.2)" }} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>أو</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.2)" }} />
            </div>

            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={submitting}
              className="w-full py-3.5 font-bold text-gray-700 text-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
              style={{ background: "rgba(255,255,255,0.95)", borderRadius: 30, boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              تسجيل عبر Google
            </button>

            {/* Create Account */}
            <div className="text-center mt-2">
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                ليس لديك حساب؟{" "}
                <button
                  type="button"
                  onClick={() => setShowRegister(true)}
                  className="font-black active:opacity-70"
                  style={{ color: "#FFD400" }}
                >
                  إنشاء حساب
                </button>
              </p>
            </div>

            {/* Terms */}
            <div className="text-center mt-3 space-y-1">
              <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>
                بمجرد دخولك توافق على{" "}
                <button type="button" onClick={() => setPolicyPage("terms")} className="underline underline-offset-2 active:opacity-70" style={{ color: "rgba(255,212,0,0.7)" }}>شروط الاستخدام</button>
                {" "}و{" "}
                <button type="button" onClick={() => setPolicyPage("privacy")} className="underline underline-offset-2 active:opacity-70" style={{ color: "rgba(255,212,0,0.7)" }}>سياسة الخصوصية</button>
              </p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.15)" }}>© 2025 ساكي — جميع الحقوق محفوظة</p>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
      `}</style>
    </div>
  );
}
