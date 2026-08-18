// @ts-nocheck
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// 3 zones: apple (x2), watermelon (x2), lucky77 (x10)
export const ZONES = {
  apple:      { label: "تفاح",    multiplier: 2,  probability: 40 },
  watermelon: { label: "بطيخ",    multiplier: 2,  probability: 40 },
  lucky77:    { label: "حظ 77",   multiplier: 10, probability: 20 },
};

function pickZone(): string {
  const total = Object.values(ZONES).reduce((s, z) => s + z.probability, 0);
  let rand = Math.random() * total;
  for (const [key, zone] of Object.entries(ZONES)) {
    rand -= zone.probability;
    if (rand <= 0) return key;
  }
  return "apple";
}

export const getCurrentRound = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("lucky77Rounds")
      .filter((q) => q.eq(q.field("status"), "betting"))
      .order("desc")
      .first();
  },
});

export const getLastRounds = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("lucky77Rounds")
      .filter((q) => q.eq(q.field("status"), "finished"))
      .order("desc")
      .take(15);
  },
});

export const getMyBetsForRound = query({
  args: { roundId: v.id("lucky77Rounds") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("lucky77Bets")
      .withIndex("by_round_and_user", (q) => q.eq("roundId", args.roundId).eq("userId", userId))
      .collect();
  },
});

export const getRoundBetsSummary = query({
  args: { roundId: v.id("lucky77Rounds") },
  handler: async (ctx, args) => {
    const bets = await ctx.db
      .query("lucky77Bets")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .collect();
    const summary: Record<string, { total: number; count: number }> = {
      apple: { total: 0, count: 0 },
      watermelon: { total: 0, count: 0 },
      lucky77: { total: 0, count: 0 },
    };
    for (const bet of bets) {
      if (summary[bet.zoneKey]) {
        summary[bet.zoneKey].total += bet.amount;
        summary[bet.zoneKey].count += 1;
      }
    }
    return summary;
  },
});

export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const entries = await ctx.db
      .query("lucky77Leaderboard")
      .order("desc")
      .take(100);
    const sorted = [...entries].sort((a, b) => b.totalWon - a.totalWon).slice(0, 20);
    return await Promise.all(sorted.map(async (e) => {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", e.userId)).first();
      return { ...e, profile };
    }));
  },
});

export const getMyTodayWinnings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const bets = await ctx.db
      .query("lucky77Bets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("createdAt"), startOfDay.getTime()))
      .collect();
    return bets.reduce((s, b) => s + (b.payout ?? 0), 0);
  },
});

export const getRoundTopWinners = query({
  args: { roundId: v.id("lucky77Rounds") },
  handler: async (ctx, args) => {
    const bets = await ctx.db
      .query("lucky77Bets")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .filter((q) => q.eq(q.field("won"), true))
      .collect();
    const userMap: Record<string, number> = {};
    for (const bet of bets) {
      userMap[bet.userId] = (userMap[bet.userId] ?? 0) + (bet.payout ?? 0);
    }
    const sorted = Object.entries(userMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    return await Promise.all(sorted.map(async ([userId, totalWon]) => {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId as any)).first();
      return { userId, totalWon, profile };
    }));
  },
});

export const placeBet = mutation({
  args: {
    roundId: v.id("lucky77Rounds"),
    zoneKey: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("يجب تسجيل الدخول");
    if (!["apple", "watermelon", "lucky77"].includes(args.zoneKey)) throw new Error("منطقة غير صالحة");
    if (![100, 1000, 10000, 50000].includes(args.amount)) throw new Error("مبلغ رهان غير صالح");

    const round = await ctx.db.get(args.roundId);
    if (!round || round.status !== "betting") throw new Error("الجولة غير متاحة للرهان");
    if (Date.now() > round.endsAt) throw new Error("انتهى وقت الرهان");

    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    if ((profile.goldCoins ?? 0) < args.amount) throw new Error("رصيدك غير كافٍ");

    await ctx.db.patch(profile._id, { goldCoins: (profile.goldCoins ?? 0) - args.amount });
    await ctx.db.insert("lucky77Bets", {
      roundId: args.roundId,
      userId,
      zoneKey: args.zoneKey,
      amount: args.amount,
      createdAt: Date.now(),
    });
    return null;
  },
});

export const startNewRound = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("lucky77Rounds")
      .filter((q) => q.eq(q.field("status"), "betting"))
      .first();
    if (existing) return existing._id;

    const lastRound = await ctx.db.query("lucky77Rounds").order("desc").first();
    const roundNumber = (lastRound?.roundNumber ?? 0) + 1;
    const now = Date.now();
    const roundId = await ctx.db.insert("lucky77Rounds", {
      status: "betting",
      startedAt: now,
      endsAt: now + 20000,
      roundNumber,
    });
    await ctx.scheduler.runAfter(20000, internal.lucky77.closeRound, { roundId });
    return roundId;
  },
});

export const closeRound = internalMutation({
  args: { roundId: v.id("lucky77Rounds") },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round || round.status !== "betting") return;
    await ctx.db.patch(args.roundId, { status: "closed" });
    // Wait 10s for the wheel to spin on the frontend, then finalize
    await ctx.scheduler.runAfter(10000, internal.lucky77.finishRound, { roundId: args.roundId });
  },
});

export const finishRound = internalMutation({
  args: { roundId: v.id("lucky77Rounds") },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round || round.status !== "closed") return;

    const winnerZone = pickZone();
    const zone = ZONES[winnerZone as keyof typeof ZONES];

    const bets = await ctx.db
      .query("lucky77Bets")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .collect();

    let totalPool = 0;
    for (const bet of bets) {
      totalPool += bet.amount;
      const won = bet.zoneKey === winnerZone;
      const payout = won ? bet.amount * zone.multiplier : 0;
      await ctx.db.patch(bet._id, { won, payout });

      if (won && payout > 0) {
        const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", bet.userId)).first();
        if (profile) {
          await ctx.db.patch(profile._id, { goldCoins: (profile.goldCoins ?? 0) + payout });
        }
        const lb = await ctx.db.query("lucky77Leaderboard").withIndex("by_userId", (q) => q.eq("userId", bet.userId)).first();
        if (lb) {
          await ctx.db.patch(lb._id, { totalWon: lb.totalWon + payout, totalBet: lb.totalBet + bet.amount, gamesPlayed: lb.gamesPlayed + 1, updatedAt: Date.now() });
        } else {
          await ctx.db.insert("lucky77Leaderboard", { userId: bet.userId, totalWon: payout, totalBet: bet.amount, gamesPlayed: 1, updatedAt: Date.now() });
        }
      }
    }

    await ctx.db.patch(args.roundId, { status: "finished", winnerZone, totalPool });
    await ctx.scheduler.runAfter(3000, internal.lucky77.startNextRound, {});
  },
});

export const startNextRound = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("lucky77Rounds")
      .filter((q) => q.eq(q.field("status"), "betting"))
      .first();
    if (existing) return;
    const lastRound = await ctx.db.query("lucky77Rounds").order("desc").first();
    const roundNumber = (lastRound?.roundNumber ?? 0) + 1;
    const now = Date.now();
    const roundId = await ctx.db.insert("lucky77Rounds", {
      status: "betting",
      startedAt: now,
      endsAt: now + 20000,
      roundNumber,
    });
    await ctx.scheduler.runAfter(20000, internal.lucky77.closeRound, { roundId });
  },
});
