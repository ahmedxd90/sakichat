// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireSuperAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("غير مصرح");
  const profile = await ctx.db.query("profiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId)).unique();
  if (!profile?.isSuperAdmin) throw new Error("للمشرف فقط");
  return { userId, profile };
}

export const adminSetSakiIdStyle = mutation({
  args: {
    targetUserId: v.id("users"),
    sakiIdIconUrl: v.optional(v.string()),
    sakiIdIconStorageId: v.optional(v.id("_storage")),
    sakiIdGradient: v.optional(v.string()),
    sakiIdCustomColor1: v.optional(v.string()),
    sakiIdCustomColor2: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const target = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId)).unique();
    if (!target) throw new Error("المستخدم غير موجود");
    const patch: any = {};
    if (args.sakiIdIconUrl !== undefined) patch.sakiIdIconUrl = args.sakiIdIconUrl;
    if (args.sakiIdIconStorageId !== undefined) patch.sakiIdIconStorageId = args.sakiIdIconStorageId;
    if (args.sakiIdGradient !== undefined) patch.sakiIdGradient = args.sakiIdGradient;
    if (args.sakiIdCustomColor1 !== undefined) patch.sakiIdCustomColor1 = args.sakiIdCustomColor1;
    if (args.sakiIdCustomColor2 !== undefined) patch.sakiIdCustomColor2 = args.sakiIdCustomColor2;
    await ctx.db.patch(target._id, patch);
    return { success: true, targetName: target.name };
  },
});

export const adminResetSakiIdStyle = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const target = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId)).unique();
    if (!target) throw new Error("المستخدم غير موجود");
    await ctx.db.patch(target._id, {
      sakiIdIconUrl: undefined,
      sakiIdIconStorageId: undefined,
      sakiIdGradient: undefined,
      sakiIdCustomColor1: undefined,
      sakiIdCustomColor2: undefined,
    });
    return { success: true };
  },
});

export const adminGenerateIconUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getSakiIdStyleByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId)).unique();
    if (!profile) return null;
    let iconUrl = profile.sakiIdIconUrl ?? null;
    if (profile.sakiIdIconStorageId && !iconUrl) {
      iconUrl = await ctx.storage.getUrl(profile.sakiIdIconStorageId) ?? null;
    }
    return {
      iconUrl,
      sakiIdGradient: profile.sakiIdGradient ?? null,
      sakiIdCustomColor1: profile.sakiIdCustomColor1 ?? null,
      sakiIdCustomColor2: profile.sakiIdCustomColor2 ?? null,
    };
  },
});
