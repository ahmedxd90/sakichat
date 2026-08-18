// @ts-nocheck
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const FOOD_ITEMS = {
  corn:   { label: "ذرة",    multiplier: 5,  color: "#fbbf24", group: "veg" },
  tomato: { label: "طماطم",  multiplier: 5,  color: "#f87171", group: "veg" },
  pepper: { label: "فلفل",   multiplier: 5,  color: "#fb923c", group: "veg" },
  carrot: { label: "جزر",    multiplier: 5,  color: "#f97316", group: "veg" },
  shrimp: { label: "جمبري",  multiplier: 10, color: "#e879f9", group: "meat" },
  cow:    { label: "لحم",    multiplier: 15, color: "#a78bfa", group: "meat" },
  fish:   { label: "سمكة",   multiplier: 25, color: "#60a5fa", group: "meat" },
  chick:  { label: "دجاج",   multiplier: 45, color: "#fde047", group: "meat" },
  salad:  { label: "سلطة",   multiplier: 0,  color: "#4ade80", group: "special" },
  pizza:  { label: "بيتزا",  multiplier: 0,  color: "#f97316", group: "special" },
};

export const getCurrentRound = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("greedyCatRounds")
      .withIndex("by_status", (q) => q.eq("status", "betting"))
      .order("desc")
      .first();
  },
});

export const getLastRounds = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("greedyCatRounds")
      .withIndex("by_status", (q) => q.eq("status", "finished"))
      .order("desc")
      .take(10);
  },
});

export const getMyBetsForRound = query({
  args: { roundId: v.id("greedyCatRounds") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("greedyCatBets")
      .withIndex("by_round_and_user", (q) => q.eq("roundId", args.roundId).eq("userId", userId))
      .collect();
  },
});

// جلب رهانات جولة منتهية مع نتائجها
export const getMyBetsForFinishedRound = query({
  args: { roundId: v.id("greedyCatRounds") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("greedyCatBets")
      .withIndex("by_round_and_user", (q) => q.eq("roundId", args.roundId).eq("userId", userId))
      .collect();
  },
});

export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const entries = await ctx.db
      .query("greedyCatLeaderboard")
      .order("desc")
      .take(100);
    const sorted = [...entries].sort((a, b) => b.totalWon - a.totalWon).slice(0, 50);
    const result = [];
    for (const entry of sorted) {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", entry.userId)).unique();
      result.push({ ...entry, profile });
    }
    return result;
  },
});

export const getRoundBetsSummary = query({
  args: { roundId: v.id("greedyCatRounds") },
  handler: async (ctx, args) => {
    const bets = await ctx.db
      .query("greedyCatBets")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .collect();
    const summary: Record<string, { count: number; total: number }> = {};
    for (const bet of bets) {
      if (!summary[bet.foodKey]) summary[bet.foodKey] = { count: 0, total: 0 };
      summary[bet.foodKey].count++;
      summary[bet.foodKey].total += bet.amount;
    }
    return summary;
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
      .query("greedyCatBets")
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

export const getRecentBets = query({
  args: { roundId: v.id("greedyCatRounds") },
  handler: async (ctx, args) => {
    const bets = await ctx.db
      .query("greedyCatBets")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .order("desc")
      .take(20);
    const result = [];
    for (const bet of bets) {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", bet.userId)).unique();
      result.push({ ...bet, profileName: profile?.name ?? "مجهول" });
    }
    return result;
  },
});

export const getRoundTopBettors = query({
  args: { roundId: v.id("greedyCatRounds") },
  handler: async (ctx, args) => {
    const bets = await ctx.db
      .query("greedyCatBets")
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
    roundId: v.id("greedyCatRounds"),
    foodKey: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("يجب تسجيل الدخول");
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("الجولة غير موجودة");
    if (round.status !== "betting") throw new Error("انتهى وقت الرهان");
    if (Date.now() >= round.endsAt) throw new Error("انتهى وقت الرهان");
    const food = FOOD_ITEMS[args.foodKey as keyof typeof FOOD_ITEMS];
    if (!food) throw new Error("طعام غير صالح");
    if (food.group === "special") throw new Error("لا يمكن الرهان على هذا العنصر");
    if (args.amount < 10) throw new Error("الحد الأدنى للرهان 10 عملات");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    if ((profile.goldCoins ?? 0) < args.amount) throw new Error("رصيدك غير كافٍ");
    const myBets = await ctx.db
      .query("greedyCatBets")
      .withIndex("by_round_and_user", (q) => q.eq("roundId", args.roundId).eq("userId", userId))
      .collect();
    const uniqueFoods = new Set(myBets.map((b) => b.foodKey));
    if (!uniqueFoods.has(args.foodKey) && uniqueFoods.size >= 6) {
      throw new Error("يمكنك الرهان على 6 أنواع طعام كحد أقصى");
    }
    await ctx.db.patch(profile._id, { goldCoins: (profile.goldCoins ?? 0) - args.amount });
    await ctx.db.insert("greedyCatBets", {
      roundId: args.roundId,
      userId,
      foodKey: args.foodKey,
      amount: args.amount,
      createdAt: Date.now(),
    });
  },
});

export const startNewRound = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("greedyCatRounds")
      .withIndex("by_status", (q) => q.eq("status", "betting"))
      .collect();
    for (const r of existing) {
      await ctx.db.patch(r._id, { status: "finished" });
    }
    const lastFinished = await ctx.db
      .query("greedyCatRounds")
      .withIndex("by_status", (q) => q.eq("status", "finished"))
      .order("desc").first();
    const roundNumber = (lastFinished?.roundNumber ?? 0) + 1;
    const now = Date.now();
    const roundId = await ctx.db.insert("greedyCatRounds", {
      status: "betting", startedAt: now, endsAt: now + 30000, roundNumber,
    });
    await ctx.scheduler.runAfter(30000, internal.greedyCat.finishRound, { roundId });
    return roundId;
  },
});

export const forceRestartGame = mutation({
  args: {},
  handler: async (ctx) => {
    // تحقق أولاً: إذا كانت هناك جولة نشطة وغير منتهية، لا تعيد التشغيل
    const activeBetting = await ctx.db.query("greedyCatRounds")
      .withIndex("by_status", (q) => q.eq("status", "betting")).first();
    if (activeBetting && Date.now() < activeBetting.endsAt) {
      return activeBetting._id; // جولة نشطة موجودة، لا حاجة لإعادة التشغيل
    }

    // إنهاء الجولات العالقة بحالة betting
    const betting = await ctx.db.query("greedyCatRounds")
      .withIndex("by_status", (q) => q.eq("status", "betting")).collect();
    for (const r of betting) await ctx.db.patch(r._id, { status: "finished" });
    // إنهاء الجولات العالقة بحالة closed
    const closed = await ctx.db.query("greedyCatRounds")
      .withIndex("by_status", (q) => q.eq("status", "closed")).collect();
    for (const r of closed) await ctx.db.patch(r._id, { status: "finished" });
    // حساب رقم الجولة من آخر جولة منتهية
    const lastFinished = await ctx.db.query("greedyCatRounds")
      .withIndex("by_status", (q) => q.eq("status", "finished"))
      .order("desc").first();
    const roundNumber = (lastFinished?.roundNumber ?? 0) + 1;
    const now = Date.now();
    const roundId = await ctx.db.insert("greedyCatRounds", {
      status: "betting", startedAt: now, endsAt: now + 30000, roundNumber,
    });
    await ctx.scheduler.runAfter(30000, internal.greedyCat.finishRound, { roundId });
    return roundId;
  },
});

export const finishRound = internalMutation({
  args: { roundId: v.id("greedyCatRounds") },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round || round.status === "finished") return;
    await ctx.db.patch(args.roundId, { status: "closed" });

    // اختيار الفائز - فقط من الأطعمة القابلة للرهان (ليس special)
    const bettableFoods = Object.entries(FOOD_ITEMS).filter(([, v]) => v.group !== "special");
    const weights = bettableFoods.map(([, v]) => 100 / v.multiplier);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * totalWeight;
    let winnerFood = bettableFoods[0][0];
    for (let i = 0; i < bettableFoods.length; i++) {
      rand -= weights[i];
      if (rand <= 0) { winnerFood = bettableFoods[i][0]; break; }
    }

    const winnerFoodData = FOOD_ITEMS[winnerFood as keyof typeof FOOD_ITEMS];
    const bets = await ctx.db
      .query("greedyCatBets")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .collect();
    const totalPool = bets.reduce((sum, b) => sum + b.amount, 0);

    for (const bet of bets) {
      // الفوز فقط إذا راهن على نفس الطعام الفائز
      const won = bet.foodKey === winnerFood;
      const payout = won ? bet.amount * winnerFoodData.multiplier : 0;

      await ctx.db.patch(bet._id, { won, payout });

      if (won && payout > 0) {
        const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", bet.userId)).unique();
        if (profile) await ctx.db.patch(profile._id, { goldCoins: (profile.goldCoins ?? 0) + payout });
        const lb = await ctx.db.query("greedyCatLeaderboard").withIndex("by_user", (q) => q.eq("userId", bet.userId)).unique();
        if (lb) {
          await ctx.db.patch(lb._id, { totalWon: lb.totalWon + payout, totalBet: (lb.totalBet ?? 0) + bet.amount, gamesPlayed: (lb.gamesPlayed ?? 0) + 1, updatedAt: Date.now() });
        } else {
          await ctx.db.insert("greedyCatLeaderboard", { userId: bet.userId, totalWon: payout, totalBet: bet.amount, gamesPlayed: 1, updatedAt: Date.now() });
        }
      } else {
        const lb = await ctx.db.query("greedyCatLeaderboard").withIndex("by_user", (q) => q.eq("userId", bet.userId)).unique();
        if (lb) {
          await ctx.db.patch(lb._id, { totalBet: (lb.totalBet ?? 0) + bet.amount, gamesPlayed: (lb.gamesPlayed ?? 0) + 1, updatedAt: Date.now() });
        } else {
          await ctx.db.insert("greedyCatLeaderboard", { userId: bet.userId, totalWon: 0, totalBet: bet.amount, gamesPlayed: 1, updatedAt: Date.now() });
        }
      }
    }
    await ctx.db.patch(args.roundId, { status: "finished", winningFood: winnerFood, totalPool });
    await ctx.scheduler.runAfter(8000, internal.greedyCat.autoStartRound, {});
  },
});

export const autoStartRound = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("greedyCatRounds")
      .withIndex("by_status", (q) => q.eq("status", "betting"))
      .first();
    if (existing) return;
    const lastFinished = await ctx.db
      .query("greedyCatRounds")
      .withIndex("by_status", (q) => q.eq("status", "finished"))
      .order("desc").first();
    const roundNumber = (lastFinished?.roundNumber ?? 0) + 1;
    const now = Date.now();
    const roundId = await ctx.db.insert("greedyCatRounds", {
      status: "betting", startedAt: now, endsAt: now + 30000, roundNumber,
    });
    await ctx.scheduler.runAfter(30000, internal.greedyCat.finishRound, { roundId });
  },
});
