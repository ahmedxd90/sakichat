# Google OAuth integration notes

## Sources
1. Convex Auth Google provider: https://labs.convex.dev/auth/config/oauth/google
2. Convex Auth OAuth overview: https://labs.convex.dev/auth/config/oauth
3. Convex Auth advanced details: https://labs.convex.dev/auth/advanced
4. Capawesome Capacitor Google Sign-In: https://capawesome.io/docs/sdks/capacitor/google-sign-in/

## Key verified requirements
- Convex Auth Google is configured by importing `Google` from `@auth/core/providers/google` and adding it to `convexAuth({ providers: [...] })`.
- Convex environment variables are `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.
- The Google OAuth callback is the Convex HTTP Actions URL ending in `/api/auth/callback/google`.
- `SITE_URL`/redirect configuration must match the actual environment; a production custom auth domain can be set using `CUSTOM_AUTH_SITE_URL`.
- The Convex Auth client sign-in call is `signIn("google", { redirectTo: ... })` for web; OAuth code handling is supported for native/React Native flows.
- Capawesome Google Sign-In plugin version 0.1.x supports Capacitor 8, uses the web client ID on all platforms, requires `initialize({ clientId, redirectUrl? })`, and returns a Google ID token from `signIn()` on Android. On web it redirects and requires `handleRedirectCallback()` after returning.

## Project-specific values found
- Android package: `saki.chat.co`.
- Attached `google-services.json` project number: `317097005212`.
- Attached JSON Android OAuth client ID: `317097005212-effkoveos5iroac0v553sh7i850l2db3.apps.googleusercontent.com`.
- Attached JSON web OAuth client ID: `317097005212-fttfmuo7h9bt3qfdie3jakiqbvi4ki2j.apps.googleusercontent.com`.
- Convex currently reports `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` already configured; the configured ID is a different web client ID (`317097005212-hd9npgrq2fmn6cgfqupq62ghk4s309ph.apps.googleusercontent.com`). Do not replace that ID without its matching secret. Convex also reports `SITE_URL=saki.chat.co://callback`, which is suitable as a native deep-link target but is not a normal web URL; web and native redirect handling must be tested/configured separately or the production web URL must be set.
- Deployment access using the user-provided Convex deploy key succeeded for env inspection; secret values must not be exposed in user-facing output.

## Implementation status
- `convex/auth.ts` now imports Google from `@auth/core/providers/google` and includes `[Password, Anonymous, Google]`.
- `@auth/core` and `@capawesome/capacitor-google-sign-in` were installed.
- The remaining work is wiring `LoginPage.tsx`, native deep-link handling, Convex environment/deployment verification, and final web/Android builds.
