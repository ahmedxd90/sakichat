// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// تحديث حالة الكتابة
export const setTyping = mutation({
  args: { otherUserId: v.id("users"), isTyping: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_user_and_other", (q) =>
        q.eq("userId", userId).eq("otherUserId", args.otherUserId)
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        isTyping: args.isTyping,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("typingIndicators", {
        userId,
        otherUserId: args.otherUserId,
        isTyping: args.isTyping,
        updatedAt: Date.now(),
      });
    }
  },
});

// هل الطرف الآخر يكتب؟
export const getTypingStatus = query({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const indicator = await ctx.db
      .query("typingIndicators")
      .withIndex("by_user_and_other", (q) =>
        q.eq("userId", args.otherUserId).eq("otherUserId", userId)
      )
      .unique();
    if (!indicator) return false;
    // تنتهي صلاحية مؤشر الكتابة بعد 5 ثوانٍ
    if (Date.now() - indicator.updatedAt > 5000) return false;
    return indicator.isTyping;
  },
});

