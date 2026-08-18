// @ts-nocheck
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const FRUIT_ITEMS = {
  watermelon: { label: "بطيخ",    multiplier: 3,  color: "#22c55e" },
  apple:      { label: "تفاح",    multiplier: 5,  color: "#ef4444" },
  grape:      { label: "عنب",     multiplier: 5,  color: "#a855f7" },
  orange:     { label: "برتقال",  multiplier: 5,  color: "#f97316" },
  strawberry: { label: "فراولة",  multiplier: 8,  color: "#f43f5e" },
  pineapple:  { label: "أناناس",  multiplier: 10, color: "#eab308" },
  mango:      { label: "مانجو",   multiplier: 15, color: "#fb923c" },
  cherry:     { label: "كرز",     multiplier: 25, color: "#e11d48" },
  coconut:    { label: "جوز هند", multiplier: 45, color: "#a8a29e" },
};

const VALID_FRUIT_KEYS = new Set(Object.keys(FRUIT_ITEMS));
const VALID_AMOUNTS = new Set([1000, 5000, 10000, 50000, 100000, 500000, 1000000]);
const MAX_BET_PER_ROUND = Number.MAX_SAFE_INTEGER;
const MAX_BETS_PER_FRUIT = 9999;

export const getCurrentRound = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("fruitPartyRounds")
      .withIndex("by_status", (q) => q.eq("status", "betting"))
      .order("desc")
      .first();
  },
});

export const getLastRounds = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("fruitPartyRounds")
      .filter((q) => q.eq(q.field("status"), "finished"))
      .order("desc")
      .take(14);
  },
});

export const getMyBetsForRound = query({
  args: { roundId: v.id("fruitPartyRounds") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("fruitPartyBets")
      .withIndex("by_round_and_user", (q) => q.eq("roundId", args.roundId).eq("userId", userId))
      .collect();
  },
});

export const getRoundBetsSummary = query({
  args: { roundId: v.id("fruitPartyRounds") },
  handler: async (ctx, args) => {
    const bets = await ctx.db
      .query("fruitPartyBets")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .collect();
    const summary: Record<string, { count: number; total: number }> = {};
    for (const bet of bets) {
      if (!summary[bet.fruitKey]) summary[bet.fruitKey] = { count: 0, total: 0 };
      summary[bet.fruitKey].count++;
      summary[bet.fruitKey].total += bet.amount;
    }
    return summary;
  },
});

export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const entries = await ctx.db.query("fruitPartyLeaderboard").order("desc").take(100);
    const sorted = [...entries].sort((a, b) => b.totalWon - a.totalWon).slice(0, 50);
    const result = [];
    for (const entry of sorted) {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", entry.userId)).unique();
      result.push({ ...entry, profile });
    }
    return result;
  },
});

export const getMyTodayWinnings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;
    const nowSaudi = Date.now() + 3 * 60 * 60 * 1000;
    const todayStart = nowSaudi - (nowSaudi % (24 * 60 * 60 * 1000));
    const todayStartUTC = todayStart - 3 * 60 * 60 * 1000;
    const bets = await ctx.db
      .query("fruitPartyBets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    let todayWon = 0;
    for (const bet of bets) {
      if (bet.createdAt >= todayStartUTC && bet.won && bet.payout) {
        todayWon += bet.payout;
      }
    }
    return todayWon;
  },
});

export const getRoundTopBettors = query({
  args: { roundId: v.id("fruitPartyRounds") },
  handler: async (ctx, args) => {
    const bets = await ctx.db
      .query("fruitPartyBets")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .collect();
    const userWins: Record<string, { bet: number; payout: number }> = {};
    for (const bet of bets) {
      const uid = bet.userId as string;
      if (!userWins[uid]) userWins[uid] = { bet: 0, payout: 0 };
      userWins[uid].bet += bet.amount;
      userWins[uid].payout += (bet.payout ?? 0);
    }
    const sorted = Object.entries(userWins)
      .filter(([, v]) => v.payout > 0)
      .sort((a, b) => b[1].payout - a[1].payout)
      .slice(0, 3);
    const result = [];
    for (const [uid, data] of sorted) {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", uid as any)).first();
      result.push({ userId: uid, totalBet: data.bet, totalWon: data.payout, profile });
    }
    return result;
  },
});

export const placeBet = mutation({
  args: {
    roundId: v.id("fruitPartyRounds"),
    fruitKey: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("يجب تسجيل الدخول");

    // Strict server-side validation
    if (!VALID_FRUIT_KEYS.has(args.fruitKey)) throw new Error("فاكهة غير صالحة");
    if (!VALID_AMOUNTS.has(args.amount)) throw new Error("مبلغ الرهان غير صالح");

    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("الجولة غير موجودة");
    if (round.status !== "betting") throw new Error("انتهى وقت الرهان");
    if (Date.now() >= round.endsAt - 500) throw new Error("انتهى وقت الرهان");

    const fruit = FRUIT_ITEMS[args.fruitKey as keyof typeof FRUIT_ITEMS];
    if (!fruit) throw new Error("فاكهة غير صالحة");

    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    if (profile.isBanned) throw new Error("حسابك محظور");

    const currentBalance = profile.goldCoins ?? 0;
    if (currentBalance < args.amount) throw new Error("رصيدك غير كافٍ");

    const myBets = await ctx.db
      .query("fruitPartyBets")
      .withIndex("by_round_and_user", (q) => q.eq("roundId", args.roundId).eq("userId", userId))
      .collect();

    // No limits on bets per round

    // Atomic deduction
    const newBalance = currentBalance - args.amount;
    if (newBalance < 0) throw new Error("رصيدك غير كافٍ");
    await ctx.db.patch(profile._id, { goldCoins: newBalance });

    await ctx.db.insert("fruitPartyBets", {
      roundId: args.roundId,
      userId,
      fruitKey: args.fruitKey,
      amount: args.amount,
      createdAt: Date.now(),
    });
  },
});

export const startNewRound = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("fruitPartyRounds")
      .withIndex("by_status", (q) => q.eq("status", "betting"))
      .collect();
    for (const r of existing) {
      await ctx.db.patch(r._id, { status: "closed" });
    }

    const allRounds = await ctx.db.query("fruitPartyRounds").collect();
    const roundNumber = allRounds.length + 1;
    const now = Date.now();

    const roundId = await ctx.db.insert("fruitPartyRounds", {
      status: "betting",
      startedAt: now,
      endsAt: now + 20000,
      roundNumber,
    });

    await ctx.scheduler.runAfter(20000, internal.fruitParty.finishRound, { roundId });
    return roundId;
  },
});

export const finishRound = internalMutation({
  args: { roundId: v.id("fruitPartyRounds") },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round || round.status === "finished") return;

    await ctx.db.patch(args.roundId, { status: "closed" });

    const fruits = Object.entries(FRUIT_ITEMS);
    const weights = fruits.map(([, v]) => 100 / v.multiplier);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * totalWeight;
    let winnerFruit = fruits[0][0];
    for (let i = 0; i < fruits.length; i++) {
      rand -= weights[i];
      if (rand <= 0) { winnerFruit = fruits[i][0]; break; }
    }

    const winnerFruitData = FRUIT_ITEMS[winnerFruit as keyof typeof FRUIT_ITEMS];

    const bets = await ctx.db
      .query("fruitPartyBets")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .collect();

    const totalPool = bets.reduce((sum, b) => sum + b.amount, 0);

    for (const bet of bets) {
      const won = bet.fruitKey === winnerFruit;
      const payout = won ? bet.amount * winnerFruitData.multiplier : 0;

      await ctx.db.patch(bet._id, { won, payout });

      if (won && payout > 0) {
        const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", bet.userId)).unique();
        if (profile) {
          await ctx.db.patch(profile._id, { goldCoins: (profile.goldCoins ?? 0) + payout });
        }
        const lb = await ctx.db.query("fruitPartyLeaderboard").withIndex("by_userId", (q) => q.eq("userId", bet.userId)).unique();
        if (lb) {
          await ctx.db.patch(lb._id, { totalWon: lb.totalWon + payout, totalBet: lb.totalBet + bet.amount, gamesPlayed: lb.gamesPlayed + 1, updatedAt: Date.now() });
        } else {
          await ctx.db.insert("fruitPartyLeaderboard", { userId: bet.userId, totalWon: payout, totalBet: bet.amount, gamesPlayed: 1, updatedAt: Date.now() });
        }
      } else {
        const lb = await ctx.db.query("fruitPartyLeaderboard").withIndex("by_userId", (q) => q.eq("userId", bet.userId)).unique();
        if (lb) {
          await ctx.db.patch(lb._id, { totalBet: lb.totalBet + bet.amount, gamesPlayed: lb.gamesPlayed + 1, updatedAt: Date.now() });
        } else {
          await ctx.db.insert("fruitPartyLeaderboard", { userId: bet.userId, totalWon: 0, totalBet: bet.amount, gamesPlayed: 1, updatedAt: Date.now() });
        }
      }
    }

    await ctx.db.patch(args.roundId, { status: "finished", winnerFruit, totalPool });

    // Start next round after 7 seconds (result shown for 5s + 2s buffer)
    await ctx.scheduler.runAfter(7000, internal.fruitParty.autoStartRound, {});
  },
});

export const autoStartRound = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("fruitPartyRounds")
      .withIndex("by_status", (q) => q.eq("status", "betting"))
      .first();
    if (existing) return;

    const allRounds = await ctx.db.query("fruitPartyRounds").collect();
    const roundNumber = allRounds.length + 1;
    const now = Date.now();

    const roundId = await ctx.db.insert("fruitPartyRounds", {
      status: "betting",
      startedAt: now,
      endsAt: now + 20000,
      roundNumber,
    });

    await ctx.scheduler.runAfter(20000, internal.fruitParty.finishRound, { roundId });
  },
});
