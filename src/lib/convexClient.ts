import { ConvexReactClient } from "convex/react";

export const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

export const CONVEX_AUTH_OAUTH_VERIFIER_KEY = "__convexAuthOAuthVerifier";
