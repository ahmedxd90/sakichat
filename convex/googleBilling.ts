"use node";

import { google } from "googleapis";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

const PACKAGE_NAME = "saki.chat.co";
const PACKAGES_MAP: Record<string, { coins: number; dollars: number }> = {
  sakinew60k: { coins: 60000, dollars: 0.99 },
  sakinew300k: { coins: 300000, dollars: 4.99 },
  sakinew600k: { coins: 600000, dollars: 9.99 },
  sakinew3m: { coins: 3000000, dollars: 49.99 },
};

function getServiceAccount() {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Google Play verification is not configured");
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Google Play service account JSON is invalid");
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("Google Play service account is incomplete");
  }
  return {
    client_email: parsed.client_email,
    private_key: String(parsed.private_key).replace(/\\n/g, "\n"),
  };
}

export const verifyAndCredGooglePlayPurchase = action({
  args: {
    productId: v.string(),
    purchaseToken: v.string(),
    transactionId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; coinsAdded: number; newBalance: number }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const configuredPackage = process.env.GOOGLE_PLAY_PACKAGE_NAME || PACKAGE_NAME;
    if (configuredPackage !== PACKAGE_NAME) {
      throw new Error("Google Play package configuration is invalid");
    }

    const pkg = PACKAGES_MAP[args.productId];
    if (!pkg) throw new Error("معرف المنتج غير معروف");
    if (!args.purchaseToken || args.purchaseToken.length < 20) {
      throw new Error("رمز الشراء غير صالح");
    }

    const auth = new google.auth.GoogleAuth({
      credentials: getServiceAccount(),
      scopes: ["https://www.googleapis.com/auth/androidpublisher"],
    });
    const androidpublisher = google.androidpublisher({ version: "v3", auth });

    let purchase: any;
    try {
      const response = await androidpublisher.purchases.products.get({
        packageName: PACKAGE_NAME,
        productId: args.productId,
        token: args.purchaseToken,
      });
      purchase = response.data;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        throw new Error("تعذر التحقق من Google Play. راجع صلاحيات حساب الخدمة");
      }
      if (status === 404) throw new Error("عملية الشراء غير موجودة في Google Play");
      throw new Error("تعذر التحقق من عملية الشراء الآن");
    }

    if (purchase?.purchaseState !== 0) {
      throw new Error(purchase?.purchaseState === 2 ? "الشراء ما زال قيد المعالجة" : "عملية الشراء غير مكتملة");
    }

    if (purchase?.acknowledgementState === 0) {
      await androidpublisher.purchases.products.acknowledge({
        packageName: PACKAGE_NAME,
        productId: args.productId,
        token: args.purchaseToken,
        requestBody: {},
      });
    }

    return await ctx.runMutation(internal.googleBillingMutations.internalCreditPurchase, {
      userId,
      productId: args.productId,
      purchaseToken: args.purchaseToken,
      transactionId: purchase?.orderId || args.transactionId || "",
      coins: pkg.coins,
      dollars: pkg.dollars,
    });
  },
});
