// @ts-nocheck
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const sendDirectReelShare = mutation({
  args: {
    receiverId: v.optional(v.id("users")),
    reelId: v.id("reels"),
    reelVideoUrl: v.string(),
    reelCaption: v.string(),
    reelThumbnailUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    if (!args.receiverId) throw new Error("يجب تحديد المستلم");
    const iB = await ctx.db
      .query("chatBlocks")
      .withIndex("by_blocker_and_blocked", (q) =>
        q.eq("blockerId", userId).eq("blockedId", args.receiverId)
      )
      .unique();
    if (iB) throw new Error("لقد قمت بحظر هذا المستخدم");
    const tB = await ctx.db
      .query("chatBlocks")
      .withIndex("by_blocker_and_blocked", (q) =>
        q.eq("blockerId", args.receiverId).eq("blockedId", userId)
      )
      .unique();
    if (tB) throw new Error("لا يمكنك إرسال رسائل لهذا المستخدم");
    await ctx.db.insert("directMessages", {
      senderId: userId,
      receiverId: args.receiverId,
      content: "شارك ريل",
      type: "reel",
      reelId: args.reelId,
      reelVideoUrl: args.reelVideoUrl,
      reelCaption: args.reelCaption,
      reelThumbnailUrl: args.reelThumbnailUrl,
      isRead: false,
      createdAt: Date.now(),
    });
    const sp = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    await ctx.scheduler.runAfter(
      0,
      internal.pushNotificationsHelper.notifyDirectMessage,
      {
        receiverId: args.receiverId,
        senderName: sp?.name ?? "مستخدم",
        content: "شارك معك ريل 🎬",
        type: "text",
      }
    );
  },
});
