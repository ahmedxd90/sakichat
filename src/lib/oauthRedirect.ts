import { Capacitor } from "@capacitor/core";

/**
 * The native callback must be a custom URL scheme handled by MainActivity.
 * Capacitor's WebView itself uses https://localhost, so that origin must never
 * be used as the OAuth destination for the packaged Android app.
 */
export const NATIVE_OAUTH_REDIRECT = "saki.chat.co://callback";

export function isSakiNativeRuntime(): boolean {
  const platform = Capacitor.getPlatform();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const isCapacitorWebViewOrigin = /^https:\/\/localhost(?::\d+)?$/i.test(origin);
  return Capacitor.isNativePlatform() || (platform !== "web" && platform !== "") || isCapacitorWebViewOrigin;
}

export function getSakiOAuthRedirectTo(): string {
  if (isSakiNativeRuntime()) return NATIVE_OAUTH_REDIRECT;
  return `${window.location.origin}/`;
}
