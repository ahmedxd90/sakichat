// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const BROADCAST_COST = 50; // 50 gold coins per message
const MIN_VIP_LEVEL = 6;   // VIP6+ only

export const getMessages = query({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db
      .query("broadcastMessages")
      .order("desc")
      .take(50);
    return messages.reverse();
  },
});

export const sendMessage = mutation({
  args: { content: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const content = args.content.trim();
    if (!content) throw new Error("الرسالة فارغة");
    if (content.length > 200) throw new Error("الرسالة طويلة جداً");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("الملف الشخصي غير موجود");

    // Check VIP level
    const vipLevel = profile.vipLevel ?? 0;
    const isVip = profile.isVip ?? false;
    const isSuperAdmin = profile.isSuperAdmin ?? false;

    if (!isSuperAdmin && (!isVip || vipLevel < MIN_VIP_LEVEL)) {
      throw new Error(`ميزة الإذاعة متاحة فقط لـ VIP${MIN_VIP_LEVEL} وأعلى`);
    }

    // Deduct coins
    const coins = profile.goldCoins ?? 0;
    if (!isSuperAdmin && coins < BROADCAST_COST) {
      throw new Error(`تحتاج ${BROADCAST_COST} ذهبية لإرسال رسالة إذاعة`);
    }

    if (!isSuperAdmin) {
      await ctx.db.patch(profile._id, {
        goldCoins: coins - BROADCAST_COST,
      });
    }

    let senderAvatarUrl = profile.avatarUrl;
    if (profile.avatarStorageId && !senderAvatarUrl) {
      senderAvatarUrl = await ctx.storage.getUrl(profile.avatarStorageId) ?? undefined;
    }

    await ctx.db.insert("broadcastMessages", {
      senderId: userId,
      senderName: profile.name,
      senderAvatarUrl,
      senderVipLevel: vipLevel,
      senderSakiId: profile.sakiId,
      content,
      createdAt: Date.now(),
    });

    return null;
  },
});
