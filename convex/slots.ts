// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const SLOT_SYMBOLS = [
  { key: "cherry",  emoji: "🍒", label: "كرز",    multiplier: 2,   weight: 30 },
  { key: "lemon",   emoji: "🍋", label: "ليمون",  multiplier: 3,   weight: 25 },
  { key: "orange",  emoji: "🍊", label: "برتقال", multiplier: 4,   weight: 20 },
  { key: "grape",   emoji: "🍇", label: "عنب",    multiplier: 5,   weight: 15 },
  { key: "bell",    emoji: "🔔", label: "جرس",    multiplier: 10,  weight: 6  },
  { key: "star",    emoji: "⭐", label: "نجمة",   multiplier: 20,  weight: 3  },
  { key: "seven",   emoji: "7️⃣", label: "سبعة",   multiplier: 50,  weight: 1  },
];

function pickSymbol(): number {
  const total = SLOT_SYMBOLS.reduce((s, sym) => s + sym.weight, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < SLOT_SYMBOLS.length; i++) {
    rand -= SLOT_SYMBOLS[i].weight;
    if (rand <= 0) return i;
  }
  return 0;
}

function calcPayout(reels: number[], betAmount: number): { payout: number; winType: string } {
  const [a, b, c] = reels;
  // All three match
  if (a === b && b === c) {
    const sym = SLOT_SYMBOLS[a];
    return { payout: betAmount * sym.multiplier, winType: `3x ${sym.emoji}` };
  }
  // Two match
  if (a === b || b === c || a === c) {
    const matchIdx = a === b ? a : b === c ? b : a;
    const sym = SLOT_SYMBOLS[matchIdx];
    return { payout: Math.floor(betAmount * sym.multiplier * 0.3), winType: `2x ${sym.emoji}` };
  }
  // Cherry anywhere = small win
  const cherryIdx = SLOT_SYMBOLS.findIndex(s => s.key === "cherry");
  const cherryCount = reels.filter(r => r === cherryIdx).length;
  if (cherryCount >= 1) {
    return { payout: Math.floor(betAmount * 0.5), winType: `🍒 كرز` };
  }
  return { payout: 0, winType: "خسارة" };
}

export const pullSlots = mutation({
  args: { betAmount: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مسجل");

    const profile = await ctx.db.query("profiles").withIndex("by_userId", q => q.eq("userId", userId)).first();
    if (!profile) throw new Error("الملف الشخصي غير موجود");

    const coins = profile.goldCoins ?? 0;
    if (coins < args.betAmount) throw new Error("رصيدك غير كافٍ");
    if (args.betAmount < 10) throw new Error("الحد الأدنى للرهان 10 عملات");

    const reels = [pickSymbol(), pickSymbol(), pickSymbol()];
    const { payout, winType } = calcPayout(reels, args.betAmount);
    const profit = payout - args.betAmount;
    const newCoins = coins - args.betAmount + payout;

    await ctx.db.patch(profile._id, { goldCoins: newCoins });

    await ctx.db.insert("slotsSpins", {
      userId,
      betAmount: args.betAmount,
      reels,
      payout,
      profit,
      winType,
      createdAt: Date.now(),
    });

    // Update leaderboard
    const lb = await ctx.db.query("slotsLeaderboard").withIndex("by_userId", q => q.eq("userId", userId)).first();
    if (lb) {
      await ctx.db.patch(lb._id, {
        totalWon: lb.totalWon + Math.max(0, profit),
        totalBet: lb.totalBet + args.betAmount,
        spinsCount: lb.spinsCount + 1,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("slotsLeaderboard", {
        userId,
        totalWon: Math.max(0, profit),
        totalBet: args.betAmount,
        spinsCount: 1,
        updatedAt: Date.now(),
      });
    }

    return { reels, payout, profit, winType, newCoins };
  },
});

export const getMySlotsHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db.query("slotsSpins").withIndex("by_user", q => q.eq("userId", userId)).order("desc").take(20);
  },
});

export const getSlotsLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const entries = await ctx.db.query("slotsLeaderboard").order("desc").take(50);
    const sorted = entries.sort((a, b) => b.totalWon - a.totalWon).slice(0, 20);
    return await Promise.all(sorted.map(async (e) => {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", q => q.eq("userId", e.userId)).first();
      return { ...e, profile };
    }));
  },
});
