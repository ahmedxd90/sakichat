import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const internalCreditPurchase = internalMutation({
  args: {
    userId: v.id("users"),
    productId: v.string(),
    purchaseToken: v.string(),
    transactionId: v.string(),
    coins: v.number(),
    dollars: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("googlePlayPurchases")
      .withIndex("by_token", (q) => q.eq("purchaseToken", args.purchaseToken))
      .unique();
    if (existing) throw new Error("تم استهلاك إيصال الشراء هذا مسبقًا");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");

    await ctx.db.insert("googlePlayPurchases", {
      userId: args.userId,
      productId: args.productId,
      purchaseToken: args.purchaseToken,
      transactionId: args.transactionId,
      coins: args.coins,
      dollars: args.dollars,
      createdAt: Date.now(),
    });

    const newCoins = (profile.goldCoins ?? 0) + args.coins;
    const newTotalCharged = (profile.totalCoinsCharged ?? 0) + args.coins;
    await ctx.db.patch(profile._id, {
      goldCoins: newCoins,
      totalCoinsCharged: newTotalCharged,
    });
    return { success: true, coinsAdded: args.coins, newBalance: newCoins };
  },
});
