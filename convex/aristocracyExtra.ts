import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ARISTOCRACY_RANKS } from "./aristocracy";

export const claimAristocracyDailyReward = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authorized");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("Profile not found");
    const level = profile.aristocracyLevel ?? 0;
    const exp = profile.aristocracyExpiresAt ?? 0;
    if (level === 0 || exp < Date.now()) throw new Error("No active aristocracy");
    const rank = ARISTOCRACY_RANKS.find((r) => r.level === level);
    if (!rank) throw new Error("Rank not found");
    const last = profile.aristocracyLastDailyClaim ?? 0;
    const now = Date.now();
    if (now - last < 86400000) {
      throw new Error(`Next claim in ${Math.ceil((last + 86400000 - now) / 3600000)} hours`);
    }
    await ctx.db.patch(profile._id, {
      goldCoins: (profile.goldCoins ?? 0) + rank.dailyCoins,
      aristocracyLastDailyClaim: now,
    });
    return { success: true, coins: rank.dailyCoins };
  },
});

export const getAristocracyLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const profiles = await ctx.db.query("profiles").collect();
    const active = profiles.filter((p) => {
      const level = p.aristocracyLevel ?? 0;
      const expAt = p.aristocracyExpiresAt ?? 0;
      return level > 0 && expAt > now;
    });
    active.sort((a, b) => (b.aristocracyLevel ?? 0) - (a.aristocracyLevel ?? 0));
    return active.slice(0, 50).map((p) => ({
      userId: p.userId,
      name: p.name,
      avatarUrl: p.avatarUrl,
      sakiId: p.sakiId,
      aristocracyLevel: p.aristocracyLevel ?? 0,
      aristocracyExpiresAt: p.aristocracyExpiresAt ?? 0,
    }));
  },
});
