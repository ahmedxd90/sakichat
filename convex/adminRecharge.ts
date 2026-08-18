import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const searchRechargeHistory = query({
  args: { sakiId: v.string() },
  handler: async (ctx, args) => {
    const viewerId = await getAuthUserId(ctx);
    if (!viewerId) throw new Error("غير مصرح");

    const viewer = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", viewerId))
      .unique();
    if (!viewer?.isSuperAdmin) throw new Error("هذه البيانات للسوبر أدمن فقط");

    const search = args.sakiId.trim();
    if (!search) return null;

    let profile = await ctx.db
      .query("profiles")
      .withIndex("by_sakiId", (q) => q.eq("sakiId", search))
      .unique();
    if (!profile) {
      const profiles = await ctx.db.query("profiles").collect();
      profile = profiles.find((item) => item.premiumSakiId === search) ?? null;
    }
    if (!profile) return { user: null, transactions: [] };

    const [googlePurchases, sakiTransactions, rechargeCredits] = await Promise.all([
      ctx.db.query("googlePlayPurchases").withIndex("by_user", (q) => q.eq("userId", profile!.userId)).order("desc").collect(),
      ctx.db.query("sakiTransactions").withIndex("by_target", (q) => q.eq("targetUserId", profile!.userId)).order("desc").collect(),
      ctx.db.query("rechargeGiftCredits").withIndex("by_user", (q) => q.eq("userId", profile!.userId)).order("desc").collect(),
    ]);

    const agentIds = Array.from(new Set(sakiTransactions.map((tx) => tx.agentUserId)));
    const agentProfiles = await Promise.all(agentIds.map((id) =>
      ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", id)).unique(),
    ));
    const agentNames = new Map(agentProfiles.filter(Boolean).map((item) => [item!.userId, item!.name]));

    const rows = [
      ...googlePurchases.map((purchase) => ({
        id: purchase._id,
        source: "google_play" as const,
        sourceLabel: "Google Play",
        coins: purchase.coins,
        dollars: purchase.dollars,
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        createdAt: purchase.createdAt,
        status: "verified" as const,
      })),
      ...sakiTransactions
        .filter((tx) => tx.type === "charge")
        .map((tx) => ({
          id: tx._id,
          source: "agent" as const,
          sourceLabel: "وكيل شحن",
          coins: tx.coinsAmount ?? 0,
          dollars: undefined,
          productId: undefined,
          transactionId: tx._id,
          createdAt: tx.createdAt,
          status: "completed" as const,
          agentName: agentNames.get(tx.agentUserId) ?? "وكيل",
          sakiAmount: tx.sakiAmount,
          note: tx.note,
        })),
      ...rechargeCredits
        .filter((credit) => credit.source === "agent" && !sakiTransactions.some((tx) => tx.createdAt === credit.createdAt))
        .map((credit) => ({
          id: credit._id,
          source: "agent_credit" as const,
          sourceLabel: "رصيد وكيل",
          coins: 0,
          dollars: credit.dollars,
          productId: undefined,
          transactionId: credit.externalReference ?? credit._id,
          createdAt: credit.createdAt,
          status: "completed" as const,
        })),
    ].sort((a, b) => b.createdAt - a.createdAt);

    return {
      user: {
        userId: profile.userId,
        name: profile.name,
        sakiId: profile.sakiId,
        premiumSakiId: profile.premiumSakiId,
        goldCoins: profile.goldCoins ?? 0,
        totalCoinsCharged: profile.totalCoinsCharged ?? 0,
        avatarUrl: profile.avatarUrl,
      },
      transactions: rows,
    };
  },
});
