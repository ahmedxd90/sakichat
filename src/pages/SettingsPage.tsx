import { api } from "../../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery, useMutation } from "convex/react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { useState, useCallback, useEffect } from "react";
import { toast } from "../lib/toast";

interface SettingsPageProps {
  onBack: () => void;
}

type UpdateStatus = "idle" | "checking" | "found" | "notfound" | "updating";

const APP_VERSION = "1.0.102";

function ArrowIcon({ direction = "left" }: { direction?: "left" | "right" }) {
  return (
    <svg className="settings-arrow" viewBox="0 0 24 24" aria-hidden="true">
      {direction === "left" ? (
        <polyline points="15 18 9 12 15 6" />
      ) : (
        <polyline points="9 18 15 12 9 6" />
      )}
    </svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 01-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function SettingsRow({
  label,
  onClick,
  value,
  disabled = false,
  children,
}: {
  label: string;
  onClick?: () => void;
  value?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="settings-item w-full text-right disabled:cursor-default"
    >
      <span className="item-label">{label}</span>
      <span className="flex items-center gap-2 min-w-0">
        {value && <span className="item-value truncate max-w-[170px]">{value}</span>}
        {children ?? <ArrowIcon />}
      </span>
    </button>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return <section className="settings-group">{children}</section>;
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const profile = useQuery(api.profiles.getMyProfile);
  // لا نستدعي الدالة الجديدة قبل نشرها على Convex حتى لا يحوّل غيابها خطأ إعدادات إلى ErrorBoundary.
  // ستُفعّل تلقائيًا بعد نشر chatBlocks:listMyBlockedUsers في بيئة الإنتاج.
  const blockedUsers = useQuery(api.chatBlocks.listMyBlockedUsers, "skip");
  const { signOut, signIn } = useAuthActions();
  const unblockUser = useMutation(api.chatBlocks.unblockUser);
  const deleteDirectMessages = useMutation(api.messages.deleteMyDirectMessages);
  const removeFcmToken = useMutation(api.fcmSubscriptions.removeFcmToken);

  const [showAccount, setShowAccount] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("idle");
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showBlocked, setShowBlocked] = useState(false);
  const [batterySaver, setBatterySaver] = useState(() => localStorage.getItem("saki:batterySaver") === "1");
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem("saki:notifications") !== "0");
  const [networkStatus, setNetworkStatus] = useState("لم يتم الفحص");
  const [appVersion, setAppVersion] = useState(APP_VERSION);

  const checkForUpdate = useCallback(async () => {
    if (!("serviceWorker" in navigator)) {
      setUpdateStatus("notfound");
      toast.info("التطبيق يعمل بأحدث إصدار متاح");
      return;
    }

    setUpdateStatus("checking");
    setWaitingWorker(null);

    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      if (!registration) {
        setUpdateStatus("notfound");
        toast.info("التطبيق يعمل بأحدث إصدار متاح");
        return;
      }

      await registration.update();
      await new Promise((resolve) => setTimeout(resolve, 900));

      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setUpdateStatus("found");
        toast.success("يوجد تحديث جديد");
      } else {
        setUpdateStatus("notfound");
        toast.info("التطبيق يعمل بأحدث إصدار متاح");
      }
    } catch {
      setUpdateStatus("notfound");
      toast.info("تعذر الفحص حالياً، حاول مرة أخرى");
    }
  }, []);

  const applyUpdate = useCallback(() => {
    setUpdateStatus("updating");
    if (waitingWorker) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      }, { once: true });
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      window.setTimeout(() => window.location.reload(), 3500);
    } else {
      window.setTimeout(() => window.location.reload(), 700);
    }
  }, [waitingWorker]);

  const handleEmailChange = async () => {
    const email = newEmail.trim();
    if (!email || !email.includes("@")) {
      toast.error("أدخل بريد إلكتروني صحيح");
      return;
    }

    setEmailLoading(true);
    try {
      await signIn("password", { email, flow: "email-verification" } as any);
      toast.success("تم إرسال رابط التحقق إلى بريدك الجديد");
      setShowEmailForm(false);
      setNewEmail("");
    } catch (error: any) {
      toast.error(error?.message || "فشل تغيير البريد الإلكتروني");
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("كلمة المرور الجديدة غير متطابقة");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    setPasswordLoading(true);
    try {
      await signIn("password", {
        email: loggedInUser?.email ?? "",
        password: currentPassword,
        newPassword,
        flow: "reset-verification",
      } as any);
      toast.success("تم تغيير كلمة المرور بنجاح");
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error?.message || "فشل تغيير كلمة المرور");
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    void CapacitorApp.getInfo().then((info) => setAppVersion(info.version || APP_VERSION)).catch(() => setAppVersion(APP_VERSION));
  }, []);

  const toggleBatterySaver = () => {
    const next = !batterySaver;
    setBatterySaver(next);
    localStorage.setItem("saki:batterySaver", next ? "1" : "0");
    window.dispatchEvent(new CustomEvent("saki:battery-saver-changed", { detail: { enabled: next } }));
    toast.success(next ? "تم تفعيل تقليل استهلاك البطارية" : "تم إلغاء تقليل استهلاك البطارية");
  };

  const toggleNotifications = async () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    localStorage.setItem("saki:notifications", next ? "1" : "0");
    window.dispatchEvent(new CustomEvent("saki:notifications-changed", { detail: { enabled: next } }));
    if (!next) toast.success("تم إيقاف إشعارات الهاتف");
    else toast.success("تم تفعيل إشعارات الهاتف؛ سيطلب النظام الإذن إذا لزم");
  };

  const handleClearMemory = async () => {
    try {
      const before = "storage" in navigator && navigator.storage?.estimate ? (await navigator.storage.estimate()).usage ?? 0 : 0;
      if ("caches" in window) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map((key) => window.caches.delete(key)));
      }
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.update().catch(() => {})));
      }
      const after = "storage" in navigator && navigator.storage?.estimate ? (await navigator.storage.estimate()).usage ?? 0 : 0;
      const saved = Math.max(0, before - after);
      toast.success(saved ? `تم تنظيف الذاكرة المؤقتة وتحرير ${Math.round(saved / 1024)} كيلوبايت` : "تم تنظيف الذاكرة المؤقتة");
    } catch {
      toast.error("تعذر تنظيف الذاكرة المؤقتة حالياً");
    }
  };

  const handleNetworkCheck = async () => {
    if (!navigator.onLine) { setNetworkStatus("غير متصل بالإنترنت"); toast.error("لا يوجد اتصال بالإنترنت حالياً"); return; }
    const started = performance.now();
    setNetworkStatus("جارٍ الفحص...");
    try {
      const response = await fetch(`/__manus__/version.json?networkCheck=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("network");
      const ms = Math.round(performance.now() - started);
      setNetworkStatus(`متصل · زمن الاستجابة ${ms}ms`);
      toast.success(`الشبكة تعمل — زمن الاستجابة ${ms}ms`);
    } catch {
      setNetworkStatus("الاتصال متاح لكن الخادم لا يستجيب");
      toast.error("تعذر الوصول إلى خادم Saki");
    }
  };

  const handleDeleteChats = async () => {
    if (!window.confirm("سيتم حذف جميع سجلات الدردشة الخاصة بك نهائيًا. هل تريد المتابعة؟")) return;
    try {
      const result = await deleteDirectMessages({});
      toast.success(`تم حذف ${result.deleted} رسالة من الدردشة الخاصة`);
    } catch (error: any) { toast.error(error?.message || "تعذر حذف سجلات الدردشة"); }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      setSigningOut(false);
      toast.error("تعذر تسجيل الخروج، حاول مرة أخرى");
    }
  };

  const accountEmail = loggedInUser?.email ?? "غير محدد";
  const updateLabel = updateStatus === "found"
    ? "يوجد تحديث جديد"
    : updateStatus === "checking"
      ? "جارٍ الفحص..."
      : updateStatus === "updating"
        ? "جارٍ التحديث..."
        : "البحث عن تحديث";

  return (
    <div className="settings-page min-h-full w-full overflow-y-auto" dir="rtl">
      <div className="settings-shell">
        <header className="settings-header">
          <h1 className="header-title">الإعدادات</h1>
          <button type="button" className="back-button" onClick={onBack} aria-label="رجوع">
            <ArrowIcon direction="right" />
          </button>
        </header>

        <main className="settings-content">
          <SettingsGroup>
            <SettingsRow label="حسابي" onClick={() => setShowAccount((value) => !value)}>
              <ArrowIcon direction={showAccount ? "left" : "right"} />
            </SettingsRow>
            {showAccount && (
              <div className="account-panel">
                <div className="linked-account-card">
                  <div className="google-logo" aria-hidden="true">G</div>
                  <div className="linked-account-copy"><strong>حساب Google المرتبط</strong><span dir="ltr">{accountEmail}</span></div>
                  <span className="linked-account-state">مرتبط</span>
                </div>
                <div className="linked-account-card phone-card">
                  <div className="phone-logo" aria-hidden="true">+9</div>
                  <div className="linked-account-copy"><strong>ربط رقم الهاتف</strong><span>متاح لاحقًا</span></div>
                  <span className="linked-account-state pending">قريبًا</span>
                </div>
                <div className="account-detail">
                  <div>
                    <p className="detail-caption">البريد الإلكتروني</p>
                    <p className="detail-value" dir="ltr">{accountEmail}</p>
                  </div>
                  <button type="button" className="small-action" onClick={() => { setShowEmailForm((value) => !value); setShowPasswordForm(false); }}>تعديل</button>
                </div>
                {showEmailForm && (
                  <div className="inline-form">
                    <label>البريد الإلكتروني الجديد</label>
                    <input value={newEmail} onChange={(event) => setNewEmail(event.target.value)} type="email" dir="ltr" placeholder="example@email.com" />
                    <div className="form-actions">
                      <button type="button" className="secondary-action" onClick={() => { setShowEmailForm(false); setNewEmail(""); }}>إلغاء</button>
                      <button type="button" className="primary-action" disabled={emailLoading || !newEmail.trim()} onClick={handleEmailChange}>{emailLoading ? "جارٍ..." : "حفظ"}</button>
                    </div>
                  </div>
                )}

                <div className="account-detail">
                  <div>
                    <p className="detail-caption">كلمة المرور</p>
                    <p className="detail-value password-dots">••••••••</p>
                  </div>
                  <button type="button" className="small-action" onClick={() => { setShowPasswordForm((value) => !value); setShowEmailForm(false); }}>تغيير</button>
                </div>
                {showPasswordForm && (
                  <div className="inline-form">
                    <label>كلمة المرور الحالية</label>
                    <div className="password-field">
                      <input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} dir="ltr" placeholder="••••••••" />
                      <button type="button" onClick={() => setShowCurrent((value) => !value)} aria-label="إظهار كلمة المرور"><EyeIcon visible={showCurrent} /></button>
                    </div>
                    <label>كلمة المرور الجديدة</label>
                    <div className="password-field">
                      <input type={showNew ? "text" : "password"} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} dir="ltr" placeholder="8 أحرف على الأقل" />
                      <button type="button" onClick={() => setShowNew((value) => !value)} aria-label="إظهار كلمة المرور"><EyeIcon visible={showNew} /></button>
                    </div>
                    <label>تأكيد كلمة المرور</label>
                    <div className="password-field">
                      <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} dir="ltr" placeholder="أعد كتابة كلمة المرور" />
                      <button type="button" onClick={() => setShowConfirm((value) => !value)} aria-label="إظهار كلمة المرور"><EyeIcon visible={showConfirm} /></button>
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && <p className="form-error">كلمة المرور غير متطابقة</p>}
                    <div className="form-actions">
                      <button type="button" className="secondary-action" onClick={() => { setShowPasswordForm(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}>إلغاء</button>
                      <button type="button" className="primary-action" disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword} onClick={handlePasswordChange}>{passwordLoading ? "جارٍ..." : "حفظ"}</button>
                    </div>
                  </div>
                )}

                <div className="account-detail account-detail-last">
                  <div>
                    <p className="detail-caption">SAKI ID</p>
                    <p className="detail-value mono">#{profile?.sakiId ?? "—"}</p>
                  </div>
                </div>
              </div>
            )}
            <SettingsRow label="الإشعارات" value={notificationsEnabled ? "مفعّلة" : "متوقفة"} onClick={toggleNotifications} />
            <SettingsRow label="الخصوصية" onClick={() => toast.info("إعدادات الخصوصية متاحة من صفحة الملف الشخصي")} />
            <SettingsRow label="قائمة الحظر" value={`${blockedUsers?.length ?? 0} مستخدم`} onClick={() => setShowBlocked(true)} />
          </SettingsGroup>

          <SettingsGroup>
            <SettingsRow label="تقليل استهلاك البطارية" value={batterySaver ? "مفعّل" : "متوقف"} onClick={toggleBatterySaver} />
            <SettingsRow label="تنظيف الذاكرة المؤقتة" onClick={handleClearMemory} />
            <SettingsRow label="حذف سجلات الدردشة الخاصة" onClick={handleDeleteChats} />
          </SettingsGroup>

          <SettingsGroup>
            <SettingsRow label="فحص الشبكة" onClick={handleNetworkCheck} value={networkStatus} />
            <SettingsRow label="تحديث التطبيق" onClick={updateStatus === "found" ? applyUpdate : checkForUpdate} disabled={updateStatus === "checking" || updateStatus === "updating"} value={updateLabel} />
            <SettingsRow label="حول التطبيق" onClick={() => toast.info(`ساكي · الإصدار الحقيقي ${appVersion}`)} value={`الإصدار ${appVersion}`} />
          </SettingsGroup>

          <button type="button" className="logout-button" onClick={handleSignOut} disabled={signingOut}>
            <span className="logout-text">{signingOut ? "جارٍ تسجيل الخروج..." : "خروج"}</span>
          </button>

          <div className="settings-footer">ساكي · الإصدار {appVersion}</div>
        </main>

        {showBlocked && (
          <div className="settings-subpage" dir="rtl">
            <div className="settings-subpage-header"><button type="button" className="back-button" onClick={() => setShowBlocked(false)} aria-label="رجوع"><ArrowIcon direction="right" /></button><h2>قائمة الحظر</h2><span /></div>
            <div className="settings-subpage-body">
              {!blockedUsers ? <p className="empty-state">جارٍ تحميل المحظورين...</p> : blockedUsers.length === 0 ? <p className="empty-state">لا يوجد مستخدمون محظورون</p> : blockedUsers.map((blocked: any) => (
                <div className="blocked-user-row" key={String(blocked.userId)}>
                  {blocked.avatarUrl ? <img src={blocked.avatarUrl} alt="" className="blocked-avatar" /> : <div className="blocked-avatar blocked-avatar-fallback">م</div>}
                  <div className="blocked-user-copy"><strong>{blocked.name}</strong><span>SAKI ID: {blocked.sakiId || "—"}</span></div>
                  <button type="button" className="unblock-button" onClick={async () => { try { await unblockUser({ blockedId: blocked.userId }); toast.success("تم فك الحظر"); } catch (e: any) { toast.error(e?.message || "تعذر فك الحظر"); } }}>فك الحظر</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap');
        .settings-page {
          background: #f7f7f9;
          color: #333333;
          font-family: 'Noto Sans Arabic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          -webkit-tap-highlight-color: transparent;
        }
        .settings-shell {
          width: 100%;
          max-width: 430px;
          min-height: 100%;
          margin: 0 auto;
          padding: 20px 16px 40px;
          background: #f7f7f9;
        }
        .settings-header {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 4px 24px;
        }
        .header-title {
          width: 100%;
          color: #2c2c2e;
          font-size: 20px;
          font-weight: 600;
          line-height: 1.5;
          text-align: center;
        }
        .back-button {
          position: absolute;
          left: 4px;
          top: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border: 0;
          background: transparent;
          color: #2c2c2e;
          transform: translateY(-50%);
          cursor: pointer;
        }
        .settings-arrow {
          width: 16px;
          height: 16px;
          fill: none;
          stroke: #c4c4c6;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-width: 2.2;
        }
        .back-button .settings-arrow {
          width: 20px;
          height: 20px;
          stroke: #333333;
        }
        .settings-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .settings-group {
          overflow: hidden;
          margin: 0;
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }
        .settings-item {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 56px;
          padding: 16px 20px;
          border: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
          transition: background-color 150ms ease;
        }
        .settings-item:active,
        .logout-button:active,
        .small-action:active,
        .primary-action:active,
        .secondary-action:active {
          background: #f2f2f7;
          transform: scale(0.99);
        }
        .settings-item:not(:last-child)::after {
          position: absolute;
          right: 20px;
          bottom: 0;
          left: 20px;
          height: 1px;
          background: #f2f2f5;
          content: '';
        }
        .item-label {
          color: #222222;
          font-size: 16px;
          font-weight: 500;
          line-height: 1.55;
        }
        .item-value {
          color: #a1a1a6;
          font-size: 12px;
          font-weight: 500;
        }
        .account-panel {
          padding: 0 20px;
          border-top: 1px solid #f2f2f5;
          background: #ffffff;
        }
        .account-detail {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid #f2f2f5;
        }
        .account-detail-last { border-bottom: 0; }
        .detail-caption {
          margin-bottom: 2px;
          color: #9a9aa0;
          font-size: 11px;
          font-weight: 500;
        }
        .detail-value {
          max-width: 230px;
          overflow: hidden;
          color: #343438;
          font-size: 13px;
          font-weight: 600;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .detail-value.mono { color: #26aebd; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
        .password-dots { letter-spacing: 3px; }
        .small-action {
          padding: 7px 12px;
          border: 1px solid #b8edf1;
          border-radius: 999px;
          background: #effcfd;
          color: #26aebd;
          font-size: 11px;
          font-weight: 700;
          transition: transform 150ms ease, background-color 150ms ease;
        }
        .inline-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px 0 14px;
          border-bottom: 1px solid #f2f2f5;
        }
        .inline-form label {
          color: #77777d;
          font-size: 11px;
          font-weight: 600;
        }
        .inline-form input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e3e3e8;
          border-radius: 11px;
          outline: none;
          background: #fafafd;
          color: #333333;
          font-family: inherit;
          font-size: 13px;
        }
        .inline-form input:focus { border-color: #8edfe5; box-shadow: 0 0 0 3px rgba(92, 225, 230, 0.12); }
        .password-field { position: relative; }
        .password-field input { padding-left: 42px; }
        .password-field button {
          position: absolute;
          top: 50%;
          left: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border: 0;
          background: transparent;
          color: #a1a1a6;
          transform: translateY(-50%);
        }
        .form-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px; }
        .primary-action, .secondary-action {
          padding: 10px 12px;
          border-radius: 11px;
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          transition: transform 150ms ease, opacity 150ms ease, background-color 150ms ease;
        }
        .primary-action { border: 0; background: linear-gradient(135deg, #5ce1e6, #3dbda7); color: #ffffff; }
        .secondary-action { border: 1px solid #e5e5ea; background: #f7f7f9; color: #77777d; }
        .primary-action:disabled { cursor: not-allowed; opacity: 0.45; }
        .form-error { color: #e05252; font-size: 10px; }
        .logout-button {
          width: 100%;
          margin-top: -8px;
          padding: 16px;
          border: 0;
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          cursor: pointer;
          transition: transform 150ms ease, background-color 150ms ease;
        }
        .logout-button:disabled { cursor: wait; opacity: 0.65; }
        .logout-text { color: #26c6da; font-size: 17px; font-weight: 600; }
        .settings-subpage { position: absolute; inset: 0; z-index: 20; background: #f7f7f9; min-height: 100%; }
        .settings-subpage-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 16px; background: #fff; border-bottom: 1px solid #e5e7eb; }
        .settings-subpage-header h2 { margin: 0; color: #111827; font-size: 18px; font-weight: 800; }
        .settings-subpage-body { padding: 16px; }
        .blocked-user-row { display: flex; align-items: center; gap: 12px; padding: 12px; margin-bottom: 10px; background: #fff; border: 1px solid #eceff3; border-radius: 18px; }
        .blocked-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; flex: 0 0 auto; }
        .blocked-avatar-fallback { display: grid; place-items: center; background: #e5e7eb; color: #6b7280; font-weight: 800; }
        .blocked-user-copy { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 3px; }
        .blocked-user-copy strong { color: #111827; font-size: 14px; }
        .blocked-user-copy span { color: #9ca3af; font-size: 10px; direction: ltr; text-align: right; }
        .unblock-button { border: 0; border-radius: 12px; padding: 9px 10px; background: #fee2e2; color: #b91c1c; font-size: 11px; font-weight: 800; white-space: nowrap; }
        .empty-state { padding: 48px 16px; text-align: center; color: #9ca3af; font-size: 13px; }

        .linked-account-card { display: flex; align-items: center; gap: 10px; padding: 12px; margin-bottom: 10px; border-radius: 16px; background: #fff; border: 1px solid #e5e7eb; }
        .google-logo, .phone-logo { width: 34px; height: 34px; border-radius: 11px; display: grid; place-items: center; font-weight: 900; font-size: 18px; background: #fff; border: 1px solid #e5e7eb; color: #4285f4; }
        .phone-logo { font-size: 11px; color: #6b7280; background: #f3f4f6; }
        .linked-account-copy { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 3px; }
        .linked-account-copy strong { font-size: 12px; color: #111827; }
        .linked-account-copy span { font-size: 10px; color: #9ca3af; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .linked-account-state { font-size: 10px; font-weight: 800; color: #16a34a; }
        .linked-account-state.pending { color: #9ca3af; }

        .settings-footer { padding: 4px 0 0; color: #b2b2b7; font-size: 10px; text-align: center; }
        @media (prefers-reduced-motion: reduce) {
          .settings-item, .logout-button, .small-action, .primary-action, .secondary-action { transition: none; }
        }
      `}</style>
    </div>
  );
}
