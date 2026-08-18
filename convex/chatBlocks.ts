// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// حظر مستخدم
export const blockUser = mutation({
  args: { blockedId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    if (userId === args.blockedId) throw new Error("لا يمكنك حظر نفسك");
    const existing = await ctx.db
      .query("chatBlocks")
      .withIndex("by_blocker_and_blocked", (q) =>
        q.eq("blockerId", userId).eq("blockedId", args.blockedId)
      )
      .unique();
    if (existing) return { alreadyBlocked: true };
    await ctx.db.insert("chatBlocks", {
      blockerId: userId,
      blockedId: args.blockedId,
      createdAt: Date.now(),
    });
    return { blocked: true };
  },
});

// رفع الحظر
export const unblockUser = mutation({
  args: { blockedId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const existing = await ctx.db
      .query("chatBlocks")
      .withIndex("by_blocker_and_blocked", (q) =>
        q.eq("blockerId", userId).eq("blockedId", args.blockedId)
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);
    return { unblocked: true };
  },
});

// هل هذا المستخدم محظور؟
export const getBlockStatus = query({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { iBlockedThem: false, theyBlockedMe: false };
    const iBlockedThem = await ctx.db
      .query("chatBlocks")
      .withIndex("by_blocker_and_blocked", (q) =>
        q.eq("blockerId", userId).eq("blockedId", args.otherUserId)
      )
      .unique();
    const theyBlockedMe = await ctx.db
      .query("chatBlocks")
      .withIndex("by_blocker_and_blocked", (q) =>
        q.eq("blockerId", args.otherUserId).eq("blockedId", userId)
      )
      .unique();
    return {
      iBlockedThem: !!iBlockedThem,
      theyBlockedMe: !!theyBlockedMe,
    };
  },
});


export const listMyBlockedUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const blocks = await ctx.db.query("chatBlocks").withIndex("by_blocker", (q) => q.eq("blockerId", userId)).collect();
    return await Promise.all(blocks.map(async (block) => {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", block.blockedId)).unique();
      let avatarUrl = profile?.avatarUrl;
      if (profile?.avatarStorageId && !avatarUrl) avatarUrl = await ctx.storage.getUrl(profile.avatarStorageId) ?? undefined;
      return { blockId: block._id, userId: block.blockedId, name: profile?.name ?? "مستخدم", sakiId: profile?.sakiId ?? "", avatarUrl, createdAt: block.createdAt };
    }));
  },
});
