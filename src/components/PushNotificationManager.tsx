// إشعارات Saki: تسجيل FCM مرة واحدة بعد جاهزية المستخدم، مع تنظيف المستمعين لمنع التسريب وتكرار التسجيل.
// فلسفة الملف: الإشعار الحقيقي يأتي من Firebase/Convex، ولا تُمنح الثقة لأي بيانات محلية.
//
// The native listeners must be installed before register(); otherwise the registration
// event can be emitted before the listener exists on some Android devices.
//
// @ts-nocheck
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

export default function PushNotificationManager() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem("saki:notifications") !== "0");
  const saveFcmToken = useMutation(api.fcmSubscriptions.saveFcmToken);
  const removeFcmToken = useMutation(api.fcmSubscriptions.removeFcmToken);
  const saveWebSubscription = useMutation(api.pushSubscriptions.saveSubscription);
  const vapidKey = useQuery(api.pushSubscriptions.getVapidPublicKey);
  const myProfile = useQuery(api.profiles.getMyProfile);

  useEffect(() => {
    const onNotificationSettingChanged = (event: Event) => setNotificationsEnabled((event as CustomEvent<{ enabled?: boolean }>).detail?.enabled !== false);
    window.addEventListener("saki:notifications-changed", onNotificationSettingChanged);
    return () => window.removeEventListener("saki:notifications-changed", onNotificationSettingChanged);
  }, []);

  useEffect(() => {
    if (!myProfile) return;
    if (!notificationsEnabled) {
      const token = localStorage.getItem("saki:fcm-token");
      if (token) void removeFcmToken({ token }).catch(() => {}).finally(() => localStorage.removeItem("saki:fcm-token"));
      return;
    }
    let cancelled = false;
    let cleanup = () => {};

    const registerNativePush = async () => {
      const registration = await PushNotifications.addListener("registration", (token) => {
        if (cancelled || !token?.value) return;
        localStorage.setItem("saki:fcm-token", token.value);
        saveFcmToken({ token: token.value, platform: Capacitor.getPlatform() }).catch((err) =>
          console.error("Failed to save FCM token:", err),
        );
      });
      const registrationError = await PushNotifications.addListener("registrationError", (error) => {
        console.error("Push registration error:", error);
      });
      const received = await PushNotifications.addListener("pushNotificationReceived", (notification) => {
        console.log("Push received:", notification?.title ?? "notification");
      });
      const action = await PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
        const data = notification?.notification?.data ?? {};
        window.dispatchEvent(new CustomEvent("saki:push-action", { detail: data }));
      });

      cleanup = () => {
        void registration.remove();
        void registrationError.remove();
        void received.remove();
        void action.remove();
      };

      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === "prompt") {
        permStatus = await PushNotifications.requestPermissions();
      }
      if (cancelled || permStatus.receive !== "granted") {
        if (permStatus.receive !== "granted") console.warn("User denied push permissions");
        return;
      }
      await PushNotifications.register();
    };

    const registerWebPush = async () => {
      if (!vapidKey || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
      try {
        const swRegistration = await navigator.serviceWorker.ready;
        let subscription = await swRegistration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidKey,
          });
        }
        const subJson = subscription.toJSON();
        if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
          await saveWebSubscription({
            endpoint: subJson.endpoint,
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth,
            userAgent: navigator.userAgent,
          });
        }
      } catch (err) {
        console.warn("Web push registration failed:", err);
      }
    };

    const run = Capacitor.isNativePlatform() ? registerNativePush : registerWebPush;
    void run().catch((err) => console.error("Push registration failed:", err));
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [myProfile?._id, vapidKey, notificationsEnabled, removeFcmToken]);

  return null;
}
