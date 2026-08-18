// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const SUPER_ADMIN_FRAME_URL = "https://h.top4top.io/p_3750wsw2o1.jpg";
export const SUPER_ADMIN_BADGE_URL = "https://c.top4top.io/p_375029up61.jpg";
const SUPER_ADMIN_FRAME_NAME = "إطار سوبر أدمن";

async function requireRootSuperAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("غير مصرح");
  const me: any = await ctx.db.query("profiles").withIndex("by_userId", (q: any) => q.eq("userId", userId)).unique();
  if (!me?.isSuperAdmin || (me.adminPermissions?.length ?? 0) > 0) throw new Error("هذه الإدارة متاحة للسوبر أدمن الرئيسي فقط");
  return userId;
}

export const getSuperAdminAssets = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("superAdminAssets").order("desc").first().catch(() => null);
    return {
      frameUrl: settings?.frameUrl ?? SUPER_ADMIN_FRAME_URL,
      badgeUrl: settings?.badgeUrl ?? SUPER_ADMIN_BADGE_URL,
      title: settings?.title ?? "سوبر أدمن",
    };
  },
});

export const generateSuperAdminUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const me = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!me?.isSuperAdmin) throw new Error("غير مصرح");
    return await ctx.storage.generateUploadUrl();
  },
});

export const updateSuperAdminAssets = mutation({
  args: {
    badgeStorageId: v.optional(v.id("_storage")),
    frameStorageId: v.optional(v.id("_storage")),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const me = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!me?.isSuperAdmin) throw new Error("غير مصرح");

    const badgeUrl = args.badgeStorageId ? await ctx.storage.getUrl(args.badgeStorageId) : undefined;
    const frameUrl = args.frameStorageId ? await ctx.storage.getUrl(args.frameStorageId) : undefined;

    const existing = await ctx.db.query("superAdminAssets").order("desc").first().catch(() => null);
    if (existing) {
      await ctx.db.patch(existing._id, {
        ...(badgeUrl ? { badgeUrl, badgeStorageId: args.badgeStorageId } : {}),
        ...(frameUrl ? { frameUrl, frameStorageId: args.frameStorageId } : {}),
        ...(args.title !== undefined ? { title: args.title } : {}),
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("superAdminAssets", {
        badgeUrl: badgeUrl ?? SUPER_ADMIN_BADGE_URL,
        frameUrl: frameUrl ?? SUPER_ADMIN_FRAME_URL,
        title: args.title ?? "سوبر أدمن",
        updatedAt: Date.now(),
      });
    }
    if (frameUrl) {
      const allFrames = await ctx.db.query("storeItems").withIndex("by_type", (q) => q.eq("type", "frame")).collect();
      const frameItem = allFrames.find((i: any) => i.name === SUPER_ADMIN_FRAME_NAME);
      if (frameItem) await ctx.db.patch(frameItem._id, { mediaUrl: frameUrl });
    }
    return null;
  },
});

export const setSuperAdminRole = mutation({
  args: { targetUserId: v.id("users"), isSuperAdmin: v.boolean(), adminPermissions: v.optional(v.array(v.string())) },
  handler: async (ctx, args) => {
    const userId = await requireRootSuperAdmin(ctx);
    const t = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.targetUserId)).unique();
    if (!t) throw new Error("المستخدم غير موجود");

    const settings = await ctx.db.query("superAdminAssets").order("desc").first().catch(() => null);
    const currentFrameUrl = settings?.frameUrl ?? SUPER_ADMIN_FRAME_URL;

    await ctx.db.patch(t._id, {
      isSuperAdmin: args.isSuperAdmin,
      adminPermissions: args.isSuperAdmin ? (args.adminPermissions ?? []) : [],
    });
    const now = Date.now();
    const allFrames = await ctx.db.query("storeItems").withIndex("by_type", (q) => q.eq("type", "frame")).collect();

    if (args.isSuperAdmin) {
      let frameItem: any = allFrames.find((i: any) => i.name === SUPER_ADMIN_FRAME_NAME);
      if (!frameItem) {
        const newId = await ctx.db.insert("storeItems", {
          type: "frame", name: SUPER_ADMIN_FRAME_NAME, price: 0,
          mediaUrl: currentFrameUrl, isActive: true, frameScale: 1.3,
          createdBy: userId, createdAt: now,
        });
        frameItem = await ctx.db.get(newId);
      }
      if (frameItem) {
        const userFrames = await ctx.db.query("userStoreItems")
          .withIndex("by_user_and_type", (q) => q.eq("userId", args.targetUserId).eq("type", "frame")).collect();
        if (!userFrames.some((i: any) => i.storeItemId === frameItem._id)) {
          await ctx.db.insert("userStoreItems", {
            userId: args.targetUserId, storeItemId: frameItem._id, type: "frame",
            purchasedAt: now, isActive: false,
          });
        }
      }
      await ctx.db.insert("notifications", {
        userId: args.targetUserId, type: "system",
        title: "🔴 تم تعيينك سوبر أدمن",
        body: "تهانينا! تم منحك صلاحيات سوبر أدمن مع إطار وشارة حصرية دائمة",
        isRead: false, actorUserId: userId, createdAt: now,
      });
    } else {
      const frameItem: any = allFrames.find((i: any) => i.name === SUPER_ADMIN_FRAME_NAME);
      if (frameItem) {
        const userFrames = await ctx.db.query("userStoreItems")
          .withIndex("by_user_and_type", (q) => q.eq("userId", args.targetUserId).eq("type", "frame")).collect();
        const adminFrame = userFrames.find((i: any) => i.storeItemId === frameItem._id);
        if (adminFrame) await ctx.db.delete(adminFrame._id);
      }
      await ctx.db.insert("notifications", {
        userId: args.targetUserId, type: "system",
        title: "ℹ️ تم إزالة صلاحيات سوبر أدمن",
        body: "تم إزالة صلاحيات سوبر أدمن من حسابك",
        isRead: false, actorUserId: userId, createdAt: now,
      });
    }
    return null;
  },
});

export const updateAdminPermissions = mutation({
  args: { targetUserId: v.id("users"), adminPermissions: v.array(v.string()) },
  handler: async (ctx, args) => {
    const userId = await requireRootSuperAdmin(ctx);
    const t = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.targetUserId)).unique();
    if (!t) throw new Error("المستخدم غير موجود");
    await ctx.db.patch(t._id, { adminPermissions: args.adminPermissions });
    return null;
  },
});

export const generateAdminTitleIconUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireRootSuperAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const updateAdminTitle = mutation({
  args: {
    targetUserId: v.id("users"),
    adminTitle: v.optional(v.string()),
    adminTitleColor1: v.optional(v.string()),
    adminTitleColor2: v.optional(v.string()),
    adminTitleIconStorageId: v.optional(v.id("_storage")),
    adminTitleBg: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireRootSuperAdmin(ctx);
    const t = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.targetUserId)).unique();
    if (!t) throw new Error("المستخدم غير موجود");

    const iconUrl = args.adminTitleIconStorageId
      ? await ctx.storage.getUrl(args.adminTitleIconStorageId)
      : undefined;

    await ctx.db.patch(t._id, {
      ...(args.adminTitle !== undefined ? { adminTitle: args.adminTitle } : {}),
      ...(args.adminTitleColor1 !== undefined ? { adminTitleColor1: args.adminTitleColor1 } : {}),
      ...(args.adminTitleColor2 !== undefined ? { adminTitleColor2: args.adminTitleColor2 } : {}),
      ...(args.adminTitleBg !== undefined ? { adminTitleBg: args.adminTitleBg } : {}),
      ...(iconUrl ? { adminTitleIconUrl: iconUrl, adminTitleIconStorageId: args.adminTitleIconStorageId } : {}),
    });
    return null;
  },
});

export const clearAdminTitle = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await requireRootSuperAdmin(ctx);
    const t = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.targetUserId)).unique();
    if (!t) throw new Error("المستخدم غير موجود");
    await ctx.db.patch(t._id, {
      adminTitle: undefined,
      adminTitleColor1: undefined,
      adminTitleColor2: undefined,
      adminTitleIconUrl: undefined,
      adminTitleIconStorageId: undefined,
      adminTitleBg: undefined,
    });
    return null;
  },
});
