import { App } from "@capacitor/app";
import { useEffect, useRef } from "react";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { supabase } from "../lib/supabaseClient";
import { toast } from "../lib/toast";

/**
 * Completes the Supabase OAuth flow when Android reopens the Capacitor app
 * using the saki.chat.co://callback deep link.
 */
export default function GoogleAuthDeepLinkHandler() {
  const processingRef = useRef(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const completeFromUrl = async (url?: string | null) => {
      if (!url || processingRef.current) return;
      
      // Supabase uses hash for access_token or query params for code
      const hasAuthData = url.includes("access_token=") || url.includes("code=");
      if (!hasAuthData) return;

      processingRef.current = true;
      try {
        await Browser.close().catch(() => {});
        
        // Extract params from the URL (could be in hash or query)
        const urlObj = new URL(url.replace("#", "?"));
        const refreshToken = urlObj.searchParams.get("refresh_token");
        const accessToken = urlObj.searchParams.get("access_token");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else {
          // If it's a PKCE flow with code
          const code = urlObj.searchParams.get("code");
          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) throw error;
          }
        }

        window.dispatchEvent(new CustomEvent("saki-google-auth-state", { detail: { status: "success" } }));
      } catch (error) {
        console.error("Google OAuth callback failed", error);
        const message = error instanceof Error ? error.message : String(error);
        window.dispatchEvent(new CustomEvent("saki-google-auth-state", { detail: { status: "error", message } }));
        toast.error(`تعذّر إكمال تسجيل الدخول عبر Google: ${message.slice(0, 120)}`);
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
  }, []);

  return null;
}
