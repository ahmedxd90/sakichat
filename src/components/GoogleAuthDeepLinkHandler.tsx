import { useEffect, useRef } from "react";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "../lib/toast";

/**
 * Completes the Convex Auth OAuth flow when Android reopens the Capacitor app
 * using the saki.chat.co://callback deep link.
 */
export default function GoogleAuthDeepLinkHandler() {
  const { signIn } = useAuthActions();
  const processingRef = useRef(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const completeFromUrl = async (url?: string | null) => {
      if (!url || processingRef.current) return;
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return;
      }
      const code = parsed.searchParams.get("code");
      if (!code) return;

      processingRef.current = true;
      try {
        await Browser.close().catch(() => {});
        await signIn(undefined, { code });
      } catch (error) {
        console.error("Google OAuth callback failed", error);
        toast.error("تعذّر إكمال تسجيل الدخول عبر Google");
      } finally {
        processingRef.current = false;
      }
    };

    const listenerPromise = App.addListener("appUrlOpen", (event) => {
      void completeFromUrl(event?.url);
    });

    void App.getLaunchUrl()
      .then((launch) => completeFromUrl(launch?.url))
      .catch(() => undefined);

    return () => {
      void listenerPromise.then((listener) => listener.remove());
    };
  }, [signIn]);

  return null;
}
