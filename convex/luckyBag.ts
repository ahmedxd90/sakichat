// @ts-nocheck
import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Send a lucky bag
export const sendLuckyBag = mutation({
  args: {
    roomId: v.id("rooms"),
    bagType: v.union(v.literal("normal"), v.literal("super")),
    totalCoins: v.number(),
    maxRecipients: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");

    const normalAmounts = [10_000, 50_000, 150_000];
    const normalRecipients = [5, 10, 20, 50, 100];
    const superAmounts = [100_000, 200_000, 500_000, 1_000_000];
    const superRecipients = [10, 50, 100, 200];
    const validAmounts = args.bagType === "normal" ? normalAmounts : superAmounts;
    const validRecipients = args.bagType === "normal" ? normalRecipients : superRecipients;
    if (!validAmounts.includes(args.totalCoins)) throw new Error("قيمة الحقيبة غير مدعومة");
    if (!validRecipients.includes(args.maxRecipients)) throw new Error("عدد المستفيدين غير مدعوم");

    const coins = profile.goldCoins ?? 0;
    if (coins < args.totalCoins) throw new Error("رصيدك غير كافٍ");

    // Deduct coins
    await ctx.db.patch(profile._id, {
      goldCoins: coins - args.totalCoins,
    });

    const now = Date.now();
    const expiresAt = now + (args.bagType === "super" ? 120_000 : 30_000);

    let avatarUrl = profile.avatarUrl;
    if (profile.avatarStorageId && !avatarUrl) {
      avatarUrl = (await ctx.storage.getUrl(profile.avatarStorageId)) ?? undefined;
    }

    const bagId = await ctx.db.insert("luckyBags", {
      roomId: args.roomId,
      senderId: userId,
      senderName: profile.name,
      senderAvatarUrl: avatarUrl,
      bagType: args.bagType,
      totalCoins: args.totalCoins,
      maxRecipients: args.maxRecipients,
      claimedCount: 0,
      isActive: true,
      expiresAt,
      createdAt: now,
    });

    // الشريط العام خاص بحقيبة السوبر فقط.
    if (args.bagType === "super") await ctx.db.insert("luckyBagEvents", {
      bagId,
      roomId: args.roomId,
      senderName: profile.name,
      senderAvatarUrl: avatarUrl,
      bagType: args.bagType,
      totalCoins: args.totalCoins,
      maxRecipients: args.maxRecipients,
      createdAt: now,
    });

    // Insert chat message for super bag
    if (args.bagType === "super") {
      await ctx.db.insert("messages", {
        senderId: userId,
        roomId: args.roomId,
        content: `أرسل حقيبة حظ سوبر 🎁`,
        type: "lucky_bag",
        senderName: profile.name,
        senderAvatarUrl: avatarUrl,
        luckyBagCoins: args.totalCoins,
        luckyBagRecipients: args.maxRecipients,
        createdAt: now,
      });
    }

    // Schedule expiry
    await ctx.scheduler.runAt(expiresAt, internal.luckyBag.expireBag, { bagId });

    return bagId;
  },
});

// Claim a lucky bag
export const claimLuckyBag = mutation({
  args: { bagId: v.id("luckyBags") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const bag = await ctx.db.get(args.bagId);
    if (!bag) throw new Error("الحقيبة غير موجودة");
    if (!bag.isActive) throw new Error("انتهت صلاحية الحقيبة");
    if (bag.claimedCount >= bag.maxRecipients) throw new Error("تم استنفاد الحقيبة");
    if (Date.now() > bag.expiresAt) throw new Error("انتهت صلاحية الحقيبة");

    // Check already claimed
    const existing = await ctx.db
      .query("luckyBagClaims")
      .withIndex("by_bag_and_user", (q) => q.eq("bagId", args.bagId).eq("userId", userId))
      .unique();
    if (existing) throw new Error("لقد فتحت هذه الحقيبة مسبقاً");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");

    // Calculate coins: random distribution
    const remaining = bag.maxRecipients - bag.claimedCount;
    const remainingCoins = bag.totalCoins - await getRemainingCoins(ctx, args.bagId);
    let coinsReceived: number;

    if (remaining === 1) {
      coinsReceived = remainingCoins;
    } else {
      // Random: between 1 and 2x average, but leave enough for others
      const avg = remainingCoins / remaining;
      const min = Math.max(1, Math.floor(avg * 0.1));
      const max = Math.floor(avg * 1.9);
      coinsReceived = Math.floor(min + Math.random() * (max - min + 1));
      coinsReceived = Math.min(coinsReceived, remainingCoins - (remaining - 1));
    }

    coinsReceived = Math.max(1, coinsReceived);

    // Give coins
    await ctx.db.patch(profile._id, {
      goldCoins: (profile.goldCoins ?? 0) + coinsReceived,
    });

    // Record claim
    await ctx.db.insert("luckyBagClaims", {
      bagId: args.bagId,
      userId,
      userName: profile.name,
      coinsReceived,
      claimedAt: Date.now(),
    });

    // Update bag
    const newCount = bag.claimedCount + 1;
    if (newCount >= bag.maxRecipients) {
      await ctx.db.patch(args.bagId, { claimedCount: newCount, isActive: false });
    } else {
      await ctx.db.patch(args.bagId, { claimedCount: newCount });
    }

    return coinsReceived;
  },
});

async function getRemainingCoins(ctx: any, bagId: any): Promise<number> {
  const claims = await ctx.db
    .query("luckyBagClaims")
    .withIndex("by_bag", (q: any) => q.eq("bagId", bagId))
    .collect();
  return claims.reduce((sum: number, c: any) => sum + c.coinsReceived, 0);
}

export const expireBag = internalMutation({
  args: { bagId: v.id("luckyBags") },
  handler: async (ctx, args) => {
    const bag = await ctx.db.get(args.bagId);
    if (!bag || !bag.isActive) return;

    // Refund unclaimed coins
    const claimed = await ctx.db
      .query("luckyBagClaims")
      .withIndex("by_bag", (q) => q.eq("bagId", args.bagId))
      .collect();
    const claimedCoins = claimed.reduce((s, c) => s + c.coinsReceived, 0);
    const refund = bag.totalCoins - claimedCoins;

    if (refund > 0) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", bag.senderId))
        .unique();
      if (profile) {
        await ctx.db.patch(profile._id, {
          goldCoins: (profile.goldCoins ?? 0) + refund,
        });
      }
    }

    await ctx.db.patch(args.bagId, { isActive: false });
  },
});

// Get active bag in room
export const getActiveLuckyBag = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const bags = await ctx.db
      .query("luckyBags")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .collect();
    const now = Date.now();
    const active = bags.find((b) => b.isActive && b.expiresAt > now);
    if (!active) return null;

    const claims = await ctx.db
      .query("luckyBagClaims")
      .withIndex("by_bag", (q) => q.eq("bagId", active._id))
      .collect();

    return { ...active, claims };
  },
});

// Get latest lucky bag event (for global banner)
export const getLatestLuckyBagEvent = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("luckyBagEvents")
      .order("desc")
      .first();
  },
});

// Check if user already claimed
export const hasUserClaimed = query({
  args: { bagId: v.id("luckyBags") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const claim = await ctx.db
      .query("luckyBagClaims")
      .withIndex("by_bag_and_user", (q) => q.eq("bagId", args.bagId).eq("userId", userId))
      .unique();
    return !!claim;
  },
});
