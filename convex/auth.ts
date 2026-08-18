import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import Google from "@auth/core/providers/google";
import { query } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Native Google bridge.
 * Android returns a signed ID token from the in-app account picker.
 * Convex verifies its claims, links the verified identity to a Convex Auth user,
 * and creates a normal Convex session.
 */
const GoogleNative = ConvexCredentials({
  id: "googleNative",
  authorize: async (credentials, ctx) => {
    const idToken = credentials.idToken;
    if (typeof idToken !== "string" || !idToken.trim()) {
      throw new Error("Google Native ID token is missing");
    }

    const expectedAudience = process.env.AUTH_GOOGLE_ID;
    if (!expectedAudience) {
      throw new Error("Google server client ID is not configured");
    }

    // Google validates the token signature and returns its verified claims.
    // We additionally enforce the expected audience, issuer, expiry, and email.
    const tokenInfoResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    );
    if (!tokenInfoResponse.ok) {
      throw new Error(`Google ID token verification failed (${tokenInfoResponse.status})`);
    }

    const claims = (await tokenInfoResponse.json()) as {
      aud?: string;
      iss?: string;
      exp?: string;
      sub?: string;
      email?: string;
      email_verified?: string | boolean;
      name?: string;
      picture?: string;
    };

    const expiresAt = Number(claims.exp ?? 0);
    const emailVerified = claims.email_verified === true || claims.email_verified === "true";
    if (
      claims.aud !== expectedAudience ||
      (claims.iss !== "accounts.google.com" && claims.iss !== "https://accounts.google.com") ||
      !expiresAt || expiresAt * 1000 <= Date.now() ||
      !claims.sub || !claims.email || !emailVerified
    ) {
      throw new Error("Google ID token claims are invalid");
    }

    return await ctx.runMutation(internal.googleNative.upsertGoogleUser, {
      providerAccountId: claims.sub,
      email: claims.email,
      name: claims.name,
      image: claims.picture,
    });
  },
});

const googleRedirectCallback = async ({ redirectTo }: { redirectTo: string }) => {
  // Capacitor receives the OAuth result through this custom scheme.
  if (redirectTo === "saki.chat.co://callback" || redirectTo.startsWith("saki.chat.co://callback?")) {
    return redirectTo;
  }
  const baseUrl = (process.env.SITE_URL ?? process.env.CONVEX_SITE_URL ?? "").replace(/\\/$/, "");
  if (redirectTo.startsWith("?") || redirectTo.startsWith("/")) return `${baseUrl}${redirectTo}`;
  if (baseUrl && redirectTo.startsWith(baseUrl)) return redirectTo;
  throw new Error(`Invalid redirectTo ${redirectTo}`);
};

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password, Anonymous, Google, GoogleNative],
  callbacks: { redirect: googleRedirectCallback },
});

export const loggedInUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get("users", userId);
    if (!user) {
      return null;
    }
    return user;
  },
});
