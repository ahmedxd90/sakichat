// @ts-nocheck
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Teams: joker, batman, draw
// Probabilities: joker 45%, batman 45%, draw 10%
// Multipliers: joker x2, batman x2, draw x8

export const TEAMS = {
  joker:  { label: "الجوكر",  multiplier: 2,  probability: 45 },
  batman: { label: "باتمان",  multiplier: 2,  probability: 45 },
  draw:   { label: "تعادل",   multiplier: 8,  probability: 10 },
};

function pickTeam(): string {
  const total = Object.values(TEAMS).reduce((s, z) => s + z.probability, 0);
  let rand = Math.random() * total;
  for (const [key, team] of Object.entries(TEAMS)) {
    rand -= team.probability;
    if (rand <= 0) return key;
  }
  return "joker";
}

export const getCurrentRound = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("cardBattleRounds")
      .withIndex("by_status", (q) => q.eq("status", "betting"))
      .order("desc")
      .first();
  },
});

export const getLastRounds = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("cardBattleRounds")
      .filter((q) => q.eq(q.field("status"), "finished"))
      .order("desc")
      .take(10);
  },
});

export const getMyBetsForRound = query({
  args: { roundId: v.id("cardBattleRounds") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("cardBattleBets")
      .withIndex("by_round_and_user", (q) => q.eq("roundId", args.roundId).eq("userId", userId))
      .collect();
  },
});

export const getRoundBetsSummary = query({
  args: { roundId: v.id("cardBattleRounds") },
  handler: async (ctx, args) => {
    const bets = await ctx.db
      .query("cardBattleBets")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .collect();
    const summary: Record<string, { total: number; count: number }> = {
      joker:  { total: 0, count: 0 },
      batman: { total: 0, count: 0 },
      draw:   { total: 0, count: 0 },
    };
    for (const bet of bets) {
      if (summary[bet.teamKey]) {
        summary[bet.teamKey].total += bet.amount;
        summary[bet.teamKey].count += 1;
      }
    }
    return summary;
  },
});

export const getActivePlayers = query({
  args: { roundId: v.id("cardBattleRounds") },
  handler: async (ctx, args) => {
    const bets = await ctx.db
      .query("cardBattleBets")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .collect();
    const seen = new Set<string>();
    const players: Array<{ userId: string; profile: any }> = [];
    for (const bet of bets) {
      if (!seen.has(bet.userId)) {
        seen.add(bet.userId);
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", bet.userId as any))
          .first();
        players.push({ userId: bet.userId, profile });
      }
    }
    return players.slice(0, 20);
  },
});

export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const entries = await ctx.db
      .query("cardBattleLeaderboard")
      .order("desc")
      .take(100);
    const sorted = [...entries].sort((a, b) => b.totalWon - a.totalWon).slice(0, 20);
    return await Promise.all(sorted.map(async (e) => {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", e.userId))
        .first();
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
      .query("cardBattleBets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("createdAt"), startOfDay.getTime()))
      .collect();
    return bets.reduce((s, b) => s + (b.payout ?? 0), 0);
  },
});

export const getRoundTopWinners = query({
  args: { roundId: v.id("cardBattleRounds") },
  handler: async (ctx, args) => {
    const bets = await ctx.db
      .query("cardBattleBets")
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
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId as any))
        .first();
      return { userId, totalWon, profile };
    }));
  },
});

export const placeBet = mutation({
  args: {
    roundId: v.id("cardBattleRounds"),
    teamKey: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("يجب تسجيل الدخول");
    if (!["joker", "batman", "draw"].includes(args.teamKey)) throw new Error("فريق غير صالح");
    if (![1000, 10000, 50000, 100000].includes(args.amount)) throw new Error("مبلغ رهان غير صالح");

    const round = await ctx.db.get(args.roundId);
    if (!round || round.status !== "betting") throw new Error("الجولة غير متاحة للرهان");
    if (Date.now() > round.endsAt) throw new Error("انتهى وقت الرهان");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    if ((profile.goldCoins ?? 0) < args.amount) throw new Error("رصيدك غير كافٍ");

    await ctx.db.patch(profile._id, { goldCoins: (profile.goldCoins ?? 0) - args.amount });
    await ctx.db.insert("cardBattleBets", {
      roundId: args.roundId,
      userId,
      teamKey: args.teamKey,
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
      .query("cardBattleRounds")
      .withIndex("by_status", (q) => q.eq("status", "betting"))
      .first();
    if (existing) return existing._id;

    const lastRound = await ctx.db.query("cardBattleRounds").order("desc").first();
    const roundNumber = (lastRound?.roundNumber ?? 0) + 1;
    const now = Date.now();
    const roundId = await ctx.db.insert("cardBattleRounds", {
      status: "betting",
      startedAt: now,
      endsAt: now + 20000,
      roundNumber,
    });
    await ctx.scheduler.runAfter(20000, internal.cardBattle.closeRound, { roundId });
    return roundId;
  },
});

export const closeRound = internalMutation({
  args: { roundId: v.id("cardBattleRounds") },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round || round.status !== "betting") return;
    await ctx.db.patch(args.roundId, { status: "closed" });
    await ctx.scheduler.runAfter(5000, internal.cardBattle.finishRound, { roundId: args.roundId });
  },
});

export const finishRound = internalMutation({
  args: { roundId: v.id("cardBattleRounds") },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round || round.status !== "closed") return;

    const winnerTeam = pickTeam();
    const team = TEAMS[winnerTeam as keyof typeof TEAMS];

    const bets = await ctx.db
      .query("cardBattleBets")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .collect();

    let totalPool = 0;
    for (const bet of bets) {
      totalPool += bet.amount;
      const won = bet.teamKey === winnerTeam;
      const payout = won ? bet.amount * team.multiplier : 0;
      await ctx.db.patch(bet._id, { won, payout });

      if (won && payout > 0) {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", bet.userId))
          .first();
        if (profile) {
          await ctx.db.patch(profile._id, { goldCoins: (profile.goldCoins ?? 0) + payout });
        }
        const lb = await ctx.db
          .query("cardBattleLeaderboard")
          .withIndex("by_userId", (q) => q.eq("userId", bet.userId))
          .first();
        if (lb) {
          await ctx.db.patch(lb._id, {
            totalWon: lb.totalWon + payout,
            totalBet: lb.totalBet + bet.amount,
            gamesPlayed: lb.gamesPlayed + 1,
            updatedAt: Date.now(),
          });
        } else {
          await ctx.db.insert("cardBattleLeaderboard", {
            userId: bet.userId,
            totalWon: payout,
            totalBet: bet.amount,
            gamesPlayed: 1,
            updatedAt: Date.now(),
          });
        }
      }
    }

    await ctx.db.patch(args.roundId, { status: "finished", winnerTeam, totalPool });
    await ctx.scheduler.runAfter(4000, internal.cardBattle.startNextRound, {});
  },
});

export const startNextRound = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("cardBattleRounds")
      .withIndex("by_status", (q) => q.eq("status", "betting"))
      .first();
    if (existing) return;
    const lastRound = await ctx.db.query("cardBattleRounds").order("desc").first();
    const roundNumber = (lastRound?.roundNumber ?? 0) + 1;
    const now = Date.now();
    const roundId = await ctx.db.insert("cardBattleRounds", {
      status: "betting",
      startedAt: now,
      endsAt: now + 20000,
      roundNumber,
    });
    await ctx.scheduler.runAfter(20000, internal.cardBattle.closeRound, { roundId });
  },
});
