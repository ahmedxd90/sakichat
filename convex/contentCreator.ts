// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const setContentCreator = mutation({
  args: { targetUserId: v.id("users"), isContentCreator: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const me = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!me?.isSuperAdmin) throw new Error("غير مصرح");
    const t = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.targetUserId)).unique();
    if (!t) throw new Error("المستخدم غير موجود");
    await ctx.db.patch(t._id, { isContentCreator: args.isContentCreator });
    await ctx.db.insert("notifications", {
      userId: args.targetUserId,
      type: "system",
      title: args.isContentCreator ? "🎬 تم منحك لقب صانع محتوى" : "تم إزالة لقب صانع المحتوى",
      body: args.isContentCreator ? "تهانينا! تم منحك لقب صانع محتوى المميز ✨" : "تم إزالة لقب صانع المحتوى من حسابك",
      isRead: false,
      actorUserId: userId,
      createdAt: Date.now(),
    });
    return null;
  },
});

export const searchProfilesForContentCreator = query({
  args: { search: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const me = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!me?.isSuperAdmin) return [];
    if (!args.search.trim()) return [];
    const all = await ctx.db.query("profiles").collect();
    const sq = args.search.toLowerCase();
    return all
      .filter((p: any) => p.name?.toLowerCase().includes(sq) || p.sakiId?.includes(sq))
      .slice(0, 20)
      .map((p: any) => ({
        userId: p.userId,
        name: p.name,
        sakiId: p.sakiId,
        avatarUrl: p.avatarUrl,
        isContentCreator: p.isContentCreator ?? false,
        isSuperAdmin: p.isSuperAdmin ?? false,
      }));
  },
});

export const getContentCreators = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const me = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!me?.isSuperAdmin) return [];
    const all = await ctx.db.query("profiles").collect();
    return all
      .filter((p: any) => p.isContentCreator === true)
      .map((p: any) => ({
        userId: p.userId,
        name: p.name,
        sakiId: p.sakiId,
        avatarUrl: p.avatarUrl,
      }));
  },
});
