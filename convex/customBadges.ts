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

// ── Admin: List all custom badges ─────────────────────────────────────────
export const adminListBadges = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) return [];
    const badges = await ctx.db.query("customBadges").order("desc").collect();
    return await Promise.all(badges.map(async (b) => {
      let imageUrl = b.imageUrl ?? null;
      if (b.imageStorageId && !imageUrl) {
        imageUrl = await ctx.storage.getUrl(b.imageStorageId) ?? null;
      }
      let svgaUrl = b.svgaUrl ?? null;
      if (b.svgaStorageId && !svgaUrl) {
        svgaUrl = await ctx.storage.getUrl(b.svgaStorageId) ?? null;
      }
      return { ...b, imageUrl, svgaUrl };
    }));
  },
});

// ── Admin: Create badge ────────────────────────────────────────────────────
export const adminCreateBadge = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    svgaStorageId: v.optional(v.id("_storage")),
    svgaUrl: v.optional(v.string()),
    mediaType: v.optional(v.string()),
    glowColor: v.optional(v.string()),
    bgColor: v.optional(v.string()),
    textColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const id = await ctx.db.insert("customBadges", {
      name: args.name,
      description: args.description,
      imageUrl: args.imageUrl,
      imageStorageId: args.imageStorageId,
      svgaStorageId: args.svgaStorageId,
      svgaUrl: args.svgaUrl,
      mediaType: args.mediaType,
      glowColor: args.glowColor ?? "#a855f7",
      bgColor: args.bgColor ?? "rgba(168,85,247,0.2)",
      textColor: args.textColor ?? "#e9d5ff",
      createdAt: Date.now(),
    });
    return id;
  },
});

// ── Admin: Update badge ────────────────────────────────────────────────────
export const adminUpdateBadge = mutation({
  args: {
    badgeId: v.id("customBadges"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    svgaStorageId: v.optional(v.id("_storage")),
    svgaUrl: v.optional(v.string()),
    mediaType: v.optional(v.string()),
    glowColor: v.optional(v.string()),
    bgColor: v.optional(v.string()),
    textColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const { badgeId, ...rest } = args;
    const patch: any = {};
    if (rest.name !== undefined) patch.name = rest.name;
    if (rest.description !== undefined) patch.description = rest.description;
    if (rest.imageUrl !== undefined) patch.imageUrl = rest.imageUrl;
    if (rest.imageStorageId !== undefined) patch.imageStorageId = rest.imageStorageId;
    if (rest.svgaStorageId !== undefined) patch.svgaStorageId = rest.svgaStorageId;
    if (rest.svgaUrl !== undefined) patch.svgaUrl = rest.svgaUrl;
    if (rest.mediaType !== undefined) patch.mediaType = rest.mediaType;
    if (rest.glowColor !== undefined) patch.glowColor = rest.glowColor;
    if (rest.bgColor !== undefined) patch.bgColor = rest.bgColor;
    if (rest.textColor !== undefined) patch.textColor = rest.textColor;
    await ctx.db.patch(badgeId, patch);
    return { success: true };
  },
});

// ── Admin: Delete badge ────────────────────────────────────────────────────
export const adminDeleteBadge = mutation({
  args: { badgeId: v.id("customBadges") },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const assignments = await ctx.db.query("userCustomBadges")
      .withIndex("by_badge", (q) => q.eq("badgeId", args.badgeId)).collect();
    for (const a of assignments) await ctx.db.delete(a._id);
    await ctx.db.delete(args.badgeId);
    return { success: true };
  },
});

// ── Admin: Assign badge to user ────────────────────────────────────────────
export const adminAssignBadge = mutation({
  args: {
    targetUserId: v.id("users"),
    badgeId: v.id("customBadges"),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const existing = await ctx.db.query("userCustomBadges")
      .withIndex("by_user_and_badge", (q) =>
        q.eq("userId", args.targetUserId).eq("badgeId", args.badgeId)
      ).unique();
    if (existing) throw new Error("المستخدم يمتلك هذا الوسام بالفعل");
    await ctx.db.insert("userCustomBadges", {
      userId: args.targetUserId,
      badgeId: args.badgeId,
      assignedAt: Date.now(),
    });
    const badge = await ctx.db.get(args.badgeId);
    await ctx.db.insert("notifications", {
      userId: args.targetUserId,
      type: "badge_awarded",
      title: "🏅 حصلت على وسام جديد!",
      body: `تهانينا! حصلت على وسام "${badge?.name}" من الإدارة`,
      isRead: false,
      createdAt: Date.now(),
    });
    return { success: true };
  },
});

// ── Admin: Revoke badge from user ──────────────────────────────────────────
export const adminRevokeBadge = mutation({
  args: {
    targetUserId: v.id("users"),
    badgeId: v.id("customBadges"),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const existing = await ctx.db.query("userCustomBadges")
      .withIndex("by_user_and_badge", (q) =>
        q.eq("userId", args.targetUserId).eq("badgeId", args.badgeId)
      ).unique();
    if (!existing) throw new Error("المستخدم لا يمتلك هذا الوسام");
    await ctx.db.delete(existing._id);
    return { success: true };
  },
});

// ── Get user custom badges ─────────────────────────────────────────────────
export const getUserCustomBadges = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const assignments = await ctx.db.query("userCustomBadges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    const result = [];
    for (const a of assignments) {
      const badge = await ctx.db.get(a.badgeId);
      if (!badge) continue;
      let imageUrl = badge.imageUrl ?? null;
      if (badge.imageStorageId && !imageUrl) {
        imageUrl = await ctx.storage.getUrl(badge.imageStorageId) ?? null;
      }
      let svgaUrl = badge.svgaUrl ?? null;
      if (badge.svgaStorageId && !svgaUrl) {
        svgaUrl = await ctx.storage.getUrl(badge.svgaStorageId) ?? null;
      }
      result.push({ ...badge, imageUrl, svgaUrl, assignedAt: a.assignedAt });
    }
    return result;
  },
});

// ── Admin: Generate upload URL ─────────────────────────────────────────────
export const adminGenerateBadgeUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// ── Admin: Get all users with a specific badge ─────────────────────────────
export const adminGetBadgeUsers = query({
  args: { badgeId: v.id("customBadges") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const me = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!me?.isSuperAdmin) return [];
    const assignments = await ctx.db.query("userCustomBadges")
      .withIndex("by_badge", (q) => q.eq("badgeId", args.badgeId)).collect();
    const result = [];
    for (const a of assignments) {
      const profile = await ctx.db.query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", a.userId)).unique();
      if (!profile) continue;
      result.push({
        userId: a.userId,
        name: profile.name,
        sakiId: profile.sakiId,
        avatarUrl: profile.avatarUrl,
        assignedAt: a.assignedAt,
      });
    }
    return result;
  },
});
