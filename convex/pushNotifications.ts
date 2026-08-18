// @ts-nocheck
"use node";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import webpush from "web-push";
import * as admin from "firebase-admin";

// Initialize Firebase Admin once
let firebaseApp: admin.app.App | null = null;
function getFirebaseAdmin() {
  if (firebaseApp) return admin;
  
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    console.warn("Firebase service account secret is not configured, FCM will not work");
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return admin;
  } catch (err) {
    console.error("Failed to initialize Firebase Admin:", err);
    return null;
  }
}

function getVapidKeys() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || "mailto:admin@saki.app";
  return { publicKey, privateKey, email };
}

// ── Internal: send push to a user ───────────────────────────────
export const sendPushToUser = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    icon: v.optional(v.string()),
    badge: v.optional(v.string()),
    tag: v.optional(v.string()),
    url: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // 1. Web Push (VAPID)
    const { publicKey, privateKey, email } = getVapidKeys();
    if (publicKey && privateKey) {
      webpush.setVapidDetails(email, publicKey, privateKey);
      const webSubs: any[] = await ctx.runMutation(
        internal.pushSubscriptions.getSubscriptionsForUser,
        { userId: args.userId }
      );

      if (webSubs.length > 0) {
        const payload = JSON.stringify({
          title: args.title,
          body: args.body,
          icon: args.icon || "https://c.top4top.io/p_3738imzif1.jpg",
          badge: args.badge || "https://c.top4top.io/p_3738imzif1.jpg",
          tag: args.tag || "saki-notification",
          data: { url: args.url || "/", ...(args.data || {}) },
          vibrate: [200, 100, 200],
          renotify: true,
        });

        await Promise.allSettled(
          webSubs.map(async (sub: any) => {
            try {
              await webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                payload
              );
            } catch (err: any) {
              if (err.statusCode === 410 || err.statusCode === 404) {
                await ctx.runMutation(internal.pushSubscriptions.deleteSubscription, {
                  subscriptionId: sub._id,
                });
              }
            }
          })
        );
      }
    }

    // 2. Native Push (FCM)
    const firebase = getFirebaseAdmin();
    if (firebase) {
      const fcmSubs: any[] = await ctx.runMutation(
        internal.fcmSubscriptions.getSubscriptionsForUser,
        { userId: args.userId }
      );

      if (fcmSubs.length > 0) {
        const tokens = fcmSubs.map(s => s.token);
        const message = {
          notification: {
            title: args.title,
            body: args.body,
          },
          data: {
            url: args.url || "/",
            tag: args.tag || "saki-notification",
            ...(args.data ? { extra: JSON.stringify(args.data) } : {}),
          },
          tokens: tokens,
        };

        try {
          const response = await firebase.messaging().sendEachForMulticast(message);
          if (response.failureCount > 0) {
            const failedTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
              if (!resp.success) {
                const errorCode = resp.error?.code;
                if (errorCode === 'messaging/registration-token-not-registered' || 
                    errorCode === 'messaging/invalid-registration-token') {
                  failedTokens.push(fcmSubs[idx]._id);
                }
              }
            });
            if (failedTokens.length > 0) {
              await Promise.all(failedTokens.map(id => 
                ctx.runMutation(internal.fcmSubscriptions.deleteSubscription, { subscriptionId: id })
              ));
            }
          }
        } catch (err) {
          console.error("FCM Send Error:", err);
        }
      }
    }
  },
});
