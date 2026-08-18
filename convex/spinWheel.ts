// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const KING_WHEEL_PRIZES = [
  { key: "lose_a",      label: "حظ أوفر",       type: "lose",    value: 0,       color: "#1e1b4b", darkColor: "#312e81", probability: 30, emoji: "💨" },
  { key: "coins_5000",  label: "5,000 عملة",    type: "coins",   value: 5000,    color: "#92400e", darkColor: "#b45309", probability: 28, emoji: "🪙" },
  { key: "lose_b",      label: "حظ أوفر",       type: "lose",    value: 0,       color: "#1e1b4b", darkColor: "#312e81", probability: 15, emoji: "💨" },
  { key: "coins_10000", label: "10,000 عملة",   type: "coins",   value: 10000,   color: "#7c2d12", darkColor: "#c2410c", probability: 12, emoji: "💰" },
  { key: "lose_c",      label: "حظ أوفر",       type: "lose",    value: 0,       color: "#1e1b4b", darkColor: "#312e81", probability: 8,  emoji: "💨" },
  { key: "coins_50000", label: "50,000 عملة",   type: "coins",   value: 50000,   color: "#78350f", darkColor: "#d97706", probability: 4,  emoji: "💎" },
  { key: "vip11",       label: "VIP 11",         type: "vip",     value: 11,      color: "#4c1d95", darkColor: "#7c3aed", probability: 2,  emoji: "👑" },
  { key: "jackpot",     label: "الجائزة الكبرى", type: "jackpot", value: 5000000, color: "#7f1d1d", darkColor: "#dc2626", probability: 1,  emoji: "🏆" },
];

export const SINGLE_SPIN_COST = 2000;
export const MULTI_SPIN_COST = 20000;
export const MULTI_SPIN_COUNT = 10;

function pickPrize(): number {
  const total = KING_WHEEL_PRIZES.reduce((s, p) => s + p.probability, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < KING_WHEEL_PRIZES.length; i++) {
    rand -= KING_WHEEL_PRIZES[i].probability;
    if (rand <= 0) return i;
  }
  return 0;
}

async function applyPrize(ctx: any, userId: any, profileId: any, currentCoins: number, prizeIdx: number) {
  const prize = KING_WHEEL_PRIZES[prizeIdx];
  let coinsGained = 0;
  let vipGranted = false;

  if (prize.type === "coins" || prize.type === "jackpot") {
    coinsGained = prize.value;
    await ctx.db.patch(profileId, { goldCoins: currentCoins + coinsGained });
  } else if (prize.type === "vip") {
    vipGranted = true;
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const profile = await ctx.db.get(profileId);
    const currentExpiry = profile?.vipExpiresAt ?? now;
    const newExpiry = Math.max(currentExpiry, now) + sevenDays;
    await ctx.db.patch(profileId, { isVip: true, vipLevel: 11, vipExpiresAt: newExpiry });
  }

  return { coinsGained, vipGranted };
}

export const spinOnce = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("يجب تسجيل الدخول");

    const profile = await ctx.db.query("profiles").withIndex("by_userId", q => q.eq("userId", userId)).first();
    if (!profile) throw new Error("الملف الشخصي غير موجود");

    const coins = profile.goldCoins ?? 0;
    if (coins < SINGLE_SPIN_COST) throw new Error(`تحتاج ${SINGLE_SPIN_COST.toLocaleString()} عملة ذهبية للدوران`);

    await ctx.db.patch(profile._id, { goldCoins: coins - SINGLE_SPIN_COST });

    const prizeIdx = pickPrize();
    const prize = KING_WHEEL_PRIZES[prizeIdx];
    const newCoins = coins - SINGLE_SPIN_COST;

    const { coinsGained, vipGranted } = await applyPrize(ctx, userId, profile._id, newCoins, prizeIdx);
    const finalCoins = newCoins + coinsGained;

    await ctx.db.insert("spinWheelSpins", {
      userId, betAmount: SINGLE_SPIN_COST, segmentIndex: prizeIdx,
      multiplier: 0, payout: coinsGained, profit: coinsGained - SINGLE_SPIN_COST, createdAt: Date.now(),
    });

    const lb = await ctx.db.query("spinWheelLeaderboard").withIndex("by_userId", q => q.eq("userId", userId)).first();
    if (lb) {
      await ctx.db.patch(lb._id, { totalWon: lb.totalWon + coinsGained, totalBet: lb.totalBet + SINGLE_SPIN_COST, spinsCount: lb.spinsCount + 1, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("spinWheelLeaderboard", { userId, totalWon: coinsGained, totalBet: SINGLE_SPIN_COST, spinsCount: 1, updatedAt: Date.now() });
    }

    if (prize.type === "jackpot" || prize.type === "vip") {
      await ctx.db.insert("kingWheelBanners", {
        userId, userName: profile.name, userAvatarUrl: profile.avatarUrl,
        prizeKey: prize.key, prizeLabel: prize.label, prizeEmoji: prize.emoji, prizeValue: prize.value,
        createdAt: Date.now(), expiresAt: Date.now() + 30000,
      });
    }

    return {
      prizeIdx,
      prize: { key: prize.key, label: prize.label, type: prize.type, value: prize.value, emoji: prize.emoji },
      coinsGained, vipGranted, finalCoins,
    };
  },
});

export const spinMulti = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("يجب تسجيل الدخول");

    const profile = await ctx.db.query("profiles").withIndex("by_userId", q => q.eq("userId", userId)).first();
    if (!profile) throw new Error("الملف الشخصي غير موجود");

    const coins = profile.goldCoins ?? 0;
    if (coins < MULTI_SPIN_COST) throw new Error(`تحتاج ${MULTI_SPIN_COST.toLocaleString()} عملة ذهبية لـ 10 دورات`);

    await ctx.db.patch(profile._id, { goldCoins: coins - MULTI_SPIN_COST });

    const results = [];
    let totalCoinsGained = 0;
    let anyVip = false;
    let runningCoins = coins - MULTI_SPIN_COST;

    for (let i = 0; i < MULTI_SPIN_COUNT; i++) {
      const prizeIdx = pickPrize();
      const prize = KING_WHEEL_PRIZES[prizeIdx];
      const { coinsGained, vipGranted } = await applyPrize(ctx, userId, profile._id, runningCoins, prizeIdx);
      runningCoins += coinsGained;
      totalCoinsGained += coinsGained;
      if (vipGranted) anyVip = true;

      results.push({
        prizeIdx,
        prize: { key: prize.key, label: prize.label, type: prize.type, value: prize.value, emoji: prize.emoji },
        coinsGained, vipGranted,
      });

      if (prize.type === "jackpot" || prize.type === "vip") {
        await ctx.db.insert("kingWheelBanners", {
          userId, userName: profile.name, userAvatarUrl: profile.avatarUrl,
          prizeKey: prize.key, prizeLabel: prize.label, prizeEmoji: prize.emoji, prizeValue: prize.value,
          createdAt: Date.now(), expiresAt: Date.now() + 30000,
        });
      }
    }

    await ctx.db.insert("spinWheelSpins", {
      userId, betAmount: MULTI_SPIN_COST, segmentIndex: results[results.length - 1].prizeIdx,
      multiplier: 0, payout: totalCoinsGained, profit: totalCoinsGained - MULTI_SPIN_COST, createdAt: Date.now(),
    });

    const lb = await ctx.db.query("spinWheelLeaderboard").withIndex("by_userId", q => q.eq("userId", userId)).first();
    if (lb) {
      await ctx.db.patch(lb._id, { totalWon: lb.totalWon + totalCoinsGained, totalBet: lb.totalBet + MULTI_SPIN_COST, spinsCount: lb.spinsCount + MULTI_SPIN_COUNT, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("spinWheelLeaderboard", { userId, totalWon: totalCoinsGained, totalBet: MULTI_SPIN_COST, spinsCount: MULTI_SPIN_COUNT, updatedAt: Date.now() });
    }

    return { results, totalCoinsGained, anyVip, finalCoins: runningCoins };
  },
});

export const spin = mutation({
  args: { betAmount: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مسجل");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", q => q.eq("userId", userId)).first();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    const coins = profile.goldCoins ?? 0;
    if (coins < args.betAmount) throw new Error("رصيدك غير كافٍ");
    const prizeIdx = pickPrize();
    const prize = KING_WHEEL_PRIZES[prizeIdx];
    const payout = prize.type === "coins" || prize.type === "jackpot" ? prize.value : 0;
    const profit = payout - args.betAmount;
    const newCoins = coins - args.betAmount + payout;
    await ctx.db.patch(profile._id, { goldCoins: newCoins });
    await ctx.db.insert("spinWheelSpins", {
      userId, betAmount: args.betAmount, segmentIndex: prizeIdx,
      multiplier: 0, payout, profit, createdAt: Date.now(),
    });
    const lb = await ctx.db.query("spinWheelLeaderboard").withIndex("by_userId", q => q.eq("userId", userId)).first();
    if (lb) {
      await ctx.db.patch(lb._id, { totalWon: lb.totalWon + Math.max(0, profit), totalBet: lb.totalBet + args.betAmount, spinsCount: lb.spinsCount + 1, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("spinWheelLeaderboard", { userId, totalWon: Math.max(0, profit), totalBet: args.betAmount, spinsCount: 1, updatedAt: Date.now() });
    }
    return { segmentIndex: prizeIdx, multiplier: 0, payout, profit, newCoins };
  },
});

export const getMySpinHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db.query("spinWheelSpins").withIndex("by_user", q => q.eq("userId", userId)).order("desc").take(20);
  },
});

export const getSpinLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const entries = await ctx.db.query("spinWheelLeaderboard").order("desc").take(50);
    const sorted = entries.sort((a, b) => b.totalWon - a.totalWon).slice(0, 20);
    return await Promise.all(sorted.map(async (e) => {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", q => q.eq("userId", e.userId)).first();
      return { ...e, profile };
    }));
  },
});

export const getActiveKingWheelBanners = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const banners = await ctx.db.query("kingWheelBanners").order("desc").take(10);
    return banners.filter(b => b.expiresAt > now);
  },
});
