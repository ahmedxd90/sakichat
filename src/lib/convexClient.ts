import { ConvexReactClient } from "convex/react";

// Public Convex deployment URL used by production Web and Capacitor builds.
// VITE_CONVEX_URL still takes precedence when provided by the build environment.
const PRODUCTION_CONVEX_URL = "https://tremendous-eel-230.convex.cloud";
const configuredConvexUrl = String(import.meta.env.VITE_CONVEX_URL || "").trim();
const isLocalConvexUrl = /^(https?:\/\/)?(127\.0\.0\.1|localhost)(:\d+)?/i.test(configuredConvexUrl);
export const convexUrl = configuredConvexUrl && !isLocalConvexUrl ? configuredConvexUrl : PRODUCTION_CONVEX_URL;

export const convex = new ConvexReactClient(convexUrl);

export const CONVEX_AUTH_OAUTH_VERIFIER_KEY = "__convexAuthOAuthVerifier";
// ConvexAuthProvider namespaces browser storage by the Convex client URL.
export const CONVEX_AUTH_OAUTH_VERIFIER_STORAGE_KEY = `${CONVEX_AUTH_OAUTH_VERIFIER_KEY}_${convex.url.replace(/[^a-zA-Z0-9]/g, "")}`;
