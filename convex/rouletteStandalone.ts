// @ts-nocheck
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const WHEEL_ORDER = [
  0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,
  24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26
];

function getNumberColor(n: number): "red" | "black" | "green" {
  if (n === 0) return "green";
  return RED_NUMBERS.includes(n) ? "red" : "black";
}

function checkBetWin(betType: string, betValue: string, winNumber: number): boolean {
  const color = getNumberColor(winNumber);
  switch (betType) {
    case "number": return winNumber === parseInt(betValue);
    case "range":
      if (betValue === "1-12") return winNumber >= 1 && winNumber <= 12;
      if (betValue === "13-24") return winNumber >= 13 && winNumber <= 24;
      if (betValue === "25-36") return winNumber >= 25 && winNumber <= 36;
      return false;
    case "color": return betValue === color;
    case "parity":
      if (winNumber === 0) return false;
      return betValue === "odd" ? winNumber % 2 !== 0 : winNumber % 2 === 0;
    case "zero": return winNumber === 0;
    default: return false;
  }
}

function getMultiplier(betType: string): number {
  switch (betType) {
    case "number": return 36;
    case "zero": return 36;
    case "range": return 3;
    case "color": return 2;
    case "parity": return 2;
    default: return 1;
  }
}

export const getActiveRound = query({
  args: {},
  handler: async (ctx) => {
    const betting = await ctx.db
      .query("soloRouletteRounds")
      .withIndex("by_status", q => q.eq("status", "betting"))
      .order("desc")
      .first();
    if (betting) return betting;
    return await ctx.db
      .query("soloRouletteRounds")
      .withIndex("by_status", q => q.eq("status", "spinning"))
      .order("desc")
      .first();
  },
});

export const getMyBetsForRound = query({
  args: { roundId: v.id("soloRouletteRounds") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("soloRouletteBets")
      .withIndex("by_round_and_user", q => q.eq("roundId", args.roundId).eq("userId", userId))
      .collect();
  },
});

export const getRecentRounds = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("soloRouletteRounds")
      .withIndex("by_status", q => q.eq("status", "finished"))
      .order("desc")
      .take(10);
  },
});

export const getDailyLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const entries = await ctx.db
      .query("soloRouletteLeaderboard")
      .order("desc")
      .take(50);
    const sorted = [...entries].sort((a, b) => b.todayWon - a.todayWon).slice(0, 10);
    return await Promise.all(sorted.map(async (e) => {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", q => q.eq("userId", e.userId)).first();
      return { ...e, profile };
    }));
  },
});

export const getRoundTopWinners = query({
  args: { roundId: v.id("soloRouletteRounds") },
  handler: async (ctx, args) => {
    const bets = await ctx.db
      .query("soloRouletteBets")
      .withIndex("by_round", q => q.eq("roundId", args.roundId))
      .collect();
    const winners = bets.filter(b => b.won && (b.payout ?? 0) > 0);
    const byUser: Record<string, number> = {};
    for (const b of winners) {
      const uid = b.userId as string;
      byUser[uid] = (byUser[uid] ?? 0) + (b.payout ?? 0);
    }
    const sorted = Object.entries(byUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    return await Promise.all(sorted.map(async ([userId, won]) => {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", q => q.eq("userId", userId as any)).first();
      return { userId, won, profile };
    }));
  },
});

export const ensureRoundExists = mutation({
  args: {},
  handler: async (ctx) => {
    const betting = await ctx.db
      .query("soloRouletteRounds")
      .withIndex("by_status", q => q.eq("status", "betting"))
      .first();
    if (betting) return betting._id;
    const spinning = await ctx.db
      .query("soloRouletteRounds")
      .withIndex("by_status", q => q.eq("status", "spinning"))
      .first();
    if (spinning) return spinning._id;

    const roundId = await ctx.db.insert("soloRouletteRounds", {
      status: "betting",
      bettingEndsAt: Date.now() + 20000,
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(20000, internal.rouletteStandalone.closeBetting, { roundId });
    return roundId;
  },
});

export const startNewRound = internalMutation({
  args: {},
  handler: async (ctx) => {
    const betting = await ctx.db
      .query("soloRouletteRounds")
      .withIndex("by_status", q => q.eq("status", "betting"))
      .first();
    if (betting) return betting._id;
    const spinning = await ctx.db
      .query("soloRouletteRounds")
      .withIndex("by_status", q => q.eq("status", "spinning"))
      .first();
    if (spinning) return spinning._id;

    const roundId = await ctx.db.insert("soloRouletteRounds", {
      status: "betting",
      bettingEndsAt: Date.now() + 20000,
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(20000, internal.rouletteStandalone.closeBetting, { roundId });
    return roundId;
  },
});

export const closeBetting = internalMutation({
  args: { roundId: v.id("soloRouletteRounds") },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round || round.status !== "betting") return;
    const winNumber = WHEEL_ORDER[Math.floor(Math.random() * WHEEL_ORDER.length)];
    const winColor = getNumberColor(winNumber);
    await ctx.db.patch(args.roundId, {
      status: "spinning",
      winNumber,
      winColor,
      spinStartedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(5000, internal.rouletteStandalone.resolveRound, { roundId: args.roundId });
  },
});

export const resolveRound = internalMutation({
  args: { roundId: v.id("soloRouletteRounds") },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round || round.status === "finished") return;
    if (round.winNumber === undefined) return;

    const bets = await ctx.db
      .query("soloRouletteBets")
      .withIndex("by_round", q => q.eq("roundId", args.roundId))
      .collect();

    for (const bet of bets) {
      const won = checkBetWin(bet.betType, bet.betValue, round.winNumber);
      const multiplier = getMultiplier(bet.betType);
      const payout = won ? bet.amount * multiplier : 0;
      await ctx.db.patch(bet._id, { won, payout });
      if (won && payout > 0) {
        const profile = await ctx.db.query("profiles").withIndex("by_userId", q => q.eq("userId", bet.userId)).first();
        if (profile) {
          await ctx.db.patch(profile._id, { goldCoins: (profile.goldCoins ?? 0) + payout });
        }
        const profit = payout - bet.amount;
        const lb = await ctx.db.query("soloRouletteLeaderboard").withIndex("by_userId", q => q.eq("userId", bet.userId)).first();
        if (lb) {
          await ctx.db.patch(lb._id, {
            totalWon: lb.totalWon + profit,
            todayWon: lb.todayWon + profit,
            totalBet: lb.totalBet + bet.amount,
            roundsPlayed: lb.roundsPlayed + 1,
            updatedAt: Date.now(),
          });
        } else {
          await ctx.db.insert("soloRouletteLeaderboard", {
            userId: bet.userId,
            totalWon: profit,
            todayWon: profit,
            totalBet: bet.amount,
            roundsPlayed: 1,
            updatedAt: Date.now(),
          });
        }
      }
    }

    await ctx.db.patch(args.roundId, { status: "finished", endedAt: Date.now() });
    await ctx.scheduler.runAfter(7000, internal.rouletteStandalone.startNewRound, {});
  },
});

export const placeBet = mutation({
  args: {
    roundId: v.id("soloRouletteRounds"),
    betType: v.string(),
    betValue: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("الجولة غير موجودة");
    if (round.status !== "betting") throw new Error("انتهى وقت الرهان");
    if (Date.now() > round.bettingEndsAt) throw new Error("انتهى وقت الرهان");
    if (args.amount < 1000) throw new Error("الحد الأدنى 1,000");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", q => q.eq("userId", userId)).first();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    if ((profile.goldCoins ?? 0) < args.amount) throw new Error("رصيدك غير كافٍ");

    const existing = await ctx.db
      .query("soloRouletteBets")
      .withIndex("by_round_and_user", q => q.eq("roundId", args.roundId).eq("userId", userId))
      .filter(q => q.eq(q.field("betType"), args.betType))
      .filter(q => q.eq(q.field("betValue"), args.betValue))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { amount: existing.amount + args.amount });
    } else {
      await ctx.db.insert("soloRouletteBets", {
        roundId: args.roundId,
        userId,
        betType: args.betType,
        betValue: args.betValue,
        amount: args.amount,
        createdAt: Date.now(),
      });
    }
    await ctx.db.patch(profile._id, { goldCoins: (profile.goldCoins ?? 0) - args.amount });
  },
});

export const spin = mutation({
  args: {
    bets: v.array(v.object({
      betType: v.string(),
      betValue: v.string(),
      amount: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    const totalBet = args.bets.reduce((s, b) => s + b.amount, 0);
    if ((profile.goldCoins ?? 0) < totalBet) throw new Error("رصيدك غير كافٍ");
    await ctx.db.patch(profile._id, { goldCoins: (profile.goldCoins ?? 0) - totalBet });
    const winNumber = WHEEL_ORDER[Math.floor(Math.random() * WHEEL_ORDER.length)];
    const winColor = getNumberColor(winNumber);
    let totalPayout = 0;
    for (const bet of args.bets) {
      const won = checkBetWin(bet.betType, bet.betValue, winNumber);
      if (won) totalPayout += bet.amount * getMultiplier(bet.betType);
    }
    if (totalPayout > 0) {
      const up = await ctx.db.get(profile._id);
      await ctx.db.patch(profile._id, { goldCoins: (up?.goldCoins ?? 0) + totalPayout });
    }
    return { winNumber, winColor, totalBet, totalPayout };
  },
});
