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
      
      // Supabase may return tokens in the hash, a PKCE code in the query, or an OAuth error.
      const hasAuthData = /(?:access_token|refresh_token|code|error)=/i.test(url);
      if (!hasAuthData) return;

      processingRef.current = true;
      try {
        await Browser.close().catch(() => {});

        // URL() keeps the custom scheme intact. Merge query and hash so both
        // implicit and PKCE callbacks work after Android resumes the app.
        const urlObj = new URL(url);
        const hashParams = new URLSearchParams(urlObj.hash.startsWith("#") ? urlObj.hash.slice(1) : urlObj.hash);
        const getParam = (name: string) => urlObj.searchParams.get(name) ?? hashParams.get(name);
        const oauthError = getParam("error");
        if (oauthError) {
          const description = getParam("error_description") ?? oauthError;
          throw new Error(decodeURIComponent(description.replace(/\\+/g, " ")));
        }

        const refreshToken = getParam("refresh_token");
        const accessToken = getParam("access_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else {
          const code = getParam("code");
          if (!code) throw new Error("لم تصل بيانات جلسة Google إلى التطبيق");
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
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
