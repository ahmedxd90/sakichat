// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// النسخة الحالية المثبتة في الكود
export const CURRENT_APP_VERSION = "1.0.0";

async function requireSuperAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("غير مصرح");
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();
  if (!profile?.isSuperAdmin) throw new Error("هذه الميزة للمدير فقط");
  return { userId, profile };
}

// جلب إعدادات النسخة (متاح للجميع بدون تسجيل دخول)
export const getAppVersion = query({
  args: {},
  handler: async (ctx) => {
    const versions = await ctx.db.query("appVersion").order("desc").take(1);
    if (!versions.length) return null;
    return versions[0];
  },
});

// تحديث النسخة المطلوبة (للمدير فقط)
export const setAppVersion = mutation({
  args: {
    version: v.string(),
    minVersion: v.string(),
    releaseNotes: v.optional(v.string()),
    forceUpdate: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireSuperAdmin(ctx);
    const existing = await ctx.db.query("appVersion").order("desc").take(1);
    if (existing.length > 0) {
      await ctx.db.patch(existing[0]._id, {
        version: args.version,
        minVersion: args.minVersion,
        releaseNotes: args.releaseNotes,
        forceUpdate: args.forceUpdate,
        updatedAt: Date.now(),
        updatedBy: userId,
      });
    } else {
      await ctx.db.insert("appVersion", {
        version: args.version,
        minVersion: args.minVersion,
        releaseNotes: args.releaseNotes,
        forceUpdate: args.forceUpdate,
        updatedAt: Date.now(),
        updatedBy: userId,
      });
    }
    return { success: true };
  },
});
