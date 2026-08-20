// DJ Spin — اقتصاد خادمي آمن. لا يقبل الخادم نتيجة أو ربحًا من العميل.
// @ts-nocheck
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

const VALID_AMOUNTS = new Set([50, 500, 5000, 50000]);
const MAX_BETTING_MS = 22000;
const SYMBOLS = ["headphones", "glasses", "vinyl", "deck", "A", "K", "Q", "J", "wild", "scatter"];

function payoutFor(amount: number, matches: number) {
  if (matches >= 5) return amount * 45;
  if (matches === 4) return amount * 10;
  if (matches === 3) return amount * 5;
  return 0;
}

async function profileFor(ctx: any, userId: any) {
  const profile = await ctx.db.query("profiles").withIndex("by_userId", (q: any) => q.eq("userId", userId)).unique();
  if (!profile) throw new Error("الملف الشخصي غير موجود");
  if (profile.isBanned) throw new Error("حسابك محظور");
  return profile;
}

export const getCurrentRound = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db.query("djSpinRounds").withIndex("by_room_status", (q) => q.eq("roomId", args.roomId).eq("status", "betting")).order("desc").first();
  },
});

export const getRecentRounds = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db.query("djSpinRounds").withIndex("by_room", (q) => q.eq("roomId", args.roomId)).order("desc").take(12);
  },
});

export const getMyBets = query({
  args: { roundId: v.id("djSpinRounds") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db.query("djSpinBets").withIndex("by_round_user", (q) => q.eq("roundId", args.roundId).eq("userId", userId)).collect();
  },
});

export const startRound = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("يجب تسجيل الدخول");
    const now = Date.now();
    const active = await ctx.db.query("djSpinRounds").withIndex("by_room_status", (q) => q.eq("roomId", args.roomId).eq("status", "betting")).first();
    if (active && active.bettingEndsAt > now) return active._id;
    if (active && active.bettingEndsAt <= now) await settleRound(ctx, active._id);
    const recent = await ctx.db.query("djSpinRounds").withIndex("by_room", (q) => q.eq("roomId", args.roomId)).order("desc").first();
    const roundNumber = (recent?.roundNumber ?? 0) + 1;
    const roundId = await ctx.db.insert("djSpinRounds", { roomId: args.roomId, status: "betting", roundNumber, bettingEndsAt: now + MAX_BETTING_MS, totalPool: 0, createdAt: now });
    await ctx.scheduler.runAfter(MAX_BETTING_MS, internal.djSpin.finishRound, { roundId });
    return roundId;
  },
});

export const placeBet = mutation({
  args: { roomId: v.id("rooms"), roundId: v.id("djSpinRounds"), amount: v.number(), symbolKey: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("يجب تسجيل الدخول");
    if (!VALID_AMOUNTS.has(args.amount)) throw new Error("مبلغ الرهان غير صالح");
    if (!SYMBOLS.includes(args.symbolKey)) throw new Error("رمز الرهان غير صالح");
    const round = await ctx.db.get(args.roundId);
    if (!round || round.roomId !== args.roomId || round.status !== "betting" || Date.now() >= round.bettingEndsAt) throw new Error("انتهى وقت الرهان");
    const profile = await profileFor(ctx, userId);
    const balance = profile.goldCoins ?? 0;
    if (balance < args.amount) throw new Error("رصيدك غير كافٍ");
    const nextBalance = balance - args.amount;
    await ctx.db.patch(profile._id, { goldCoins: nextBalance });
    await ctx.db.insert("djSpinBets", { roundId: args.roundId, roomId: args.roomId, userId, amount: args.amount, symbolKey: args.symbolKey, settled: false, createdAt: Date.now() });
    await ctx.db.insert("djSpinTransactions", { roundId: args.roundId, roomId: args.roomId, userId, kind: "bet", amount: -args.amount, balanceAfter: nextBalance, createdAt: Date.now() });
    await ctx.db.patch(round._id, { totalPool: round.totalPool + args.amount });
    return { balanceAfter: nextBalance };
  },
});

async function settleRound(ctx: any, roundId: any) {
  const round = await ctx.db.get(roundId);
  if (!round || round.status === "settled" || round.status === "cancelled") return;
  const winner = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  await ctx.db.patch(round._id, { status: "spinning", winningSymbol: winner });
  const bets = await ctx.db.query("djSpinBets").withIndex("by_round", (q: any) => q.eq("roundId", roundId)).collect();
  for (const bet of bets) {
    if (bet.settled) continue;
    const matches = bet.symbolKey === winner ? 5 : 0;
    const payout = payoutFor(bet.amount, matches);
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q: any) => q.eq("userId", bet.userId)).unique();
    if (profile && payout > 0) {
      const balanceAfter = (profile.goldCoins ?? 0) + payout;
      await ctx.db.patch(profile._id, { goldCoins: balanceAfter });
      await ctx.db.insert("djSpinTransactions", { roundId, roomId: round.roomId, userId: bet.userId, kind: "payout", amount: payout, balanceAfter, createdAt: Date.now() });
    }
    await ctx.db.patch(bet._id, { settled: true, payout });
  }
  await ctx.db.patch(round._id, { status: "settled", settledAt: Date.now() });
}

export const finishRound = internalMutation({
  args: { roundId: v.id("djSpinRounds") },
  handler: async (ctx, args) => { await settleRound(ctx, args.roundId); },
});

export const resolveExpiredRound = mutation({
  args: { roundId: v.id("djSpinRounds") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("يجب تسجيل الدخول");
    const round = await ctx.db.get(args.roundId);
    if (round && round.status === "betting" && Date.now() >= round.bettingEndsAt) await settleRound(ctx, args.roundId);
  },
});
