// @ts-nocheck
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// أرقام الروليت الحمراء
const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

// ترتيب أرقام عجلة الروليت الأوروبية
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
    case "color":
      return betValue === color;
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

export const getActiveSession = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rouletteSessions")
      .withIndex("by_room", q => q.eq("roomId", args.roomId))
      .filter(q => q.neq(q.field("status"), "ended"))
      .order("desc")
      .first();
  },
});

export const getSessionBets = query({
  args: { sessionId: v.id("rouletteSessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("rouletteBets")
      .withIndex("by_session_and_user", q => q.eq("sessionId", args.sessionId).eq("userId", userId))
      .collect();
  },
});

export const getRecentResults = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("rouletteSessions")
      .withIndex("by_room", q => q.eq("roomId", args.roomId))
      .filter(q => q.eq(q.field("status"), "ended"))
      .order("desc")
      .take(20);
    return sessions
      .filter(s => s.winNumber !== undefined)
      .map(s => ({ number: s.winNumber!, color: getNumberColor(s.winNumber!) }));
  },
});

export const startSession = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const member = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", q => q.eq("roomId", args.roomId).eq("userId", userId))
      .unique();
    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      throw new Error("فقط المالك أو الأدمن يمكنه بدء الجلسة");
    }
    const existing = await ctx.db
      .query("rouletteSessions")
      .withIndex("by_room", q => q.eq("roomId", args.roomId))
      .filter(q => q.neq(q.field("status"), "ended"))
      .first();
    if (existing) throw new Error("يوجد جلسة نشطة بالفعل");
    const bettingEndsAt = Date.now() + 30000;
    return await ctx.db.insert("rouletteSessions", {
      roomId: args.roomId,
      hostUserId: userId,
      status: "betting",
      bettingEndsAt,
      createdAt: Date.now(),
    });
  },
});

export const placeBet = mutation({
  args: {
    sessionId: v.id("rouletteSessions"),
    betType: v.string(),
    betValue: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("الجلسة غير موجودة");
    if (session.status !== "betting") throw new Error("انتهى وقت الرهان");
    if (Date.now() > session.bettingEndsAt) throw new Error("انتهى وقت الرهان");
    if (args.amount < 10) throw new Error("الحد الأدنى للرهان 10 كوينز");
    if (args.amount > 100000) throw new Error("الحد الأقصى للرهان 100,000 كوينز");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    if ((profile.goldCoins ?? 0) < args.amount) throw new Error("رصيدك غير كافٍ");
    const existingBet = await ctx.db
      .query("rouletteBets")
      .withIndex("by_session_and_user", q => q.eq("sessionId", args.sessionId).eq("userId", userId))
      .filter(q => q.eq(q.field("betType"), args.betType))
      .filter(q => q.eq(q.field("betValue"), args.betValue))
      .first();
    if (existingBet) {
      await ctx.db.patch(existingBet._id, { amount: existingBet.amount + args.amount });
    } else {
      await ctx.db.insert("rouletteBets", {
        sessionId: args.sessionId,
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

export const spinWheel = mutation({
  args: { sessionId: v.id("rouletteSessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("الجلسة غير موجودة");
    if (session.hostUserId !== userId) throw new Error("فقط المذيع يمكنه تدوير العجلة");
    if (session.status !== "betting") throw new Error("لا يمكن التدوير الآن");
    const winNumber = WHEEL_ORDER[Math.floor(Math.random() * WHEEL_ORDER.length)];
    const winColor = getNumberColor(winNumber);
    await ctx.db.patch(args.sessionId, {
      status: "spinning",
      winNumber,
      winColor,
      spinStartedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(5000, internal.roulette.resolveSession, { sessionId: args.sessionId });
  },
});

export const resolveSession = internalMutation({
  args: { sessionId: v.id("rouletteSessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status === "ended") return;
    if (session.winNumber === undefined) return;
    const bets = await ctx.db
      .query("rouletteBets")
      .withIndex("by_session", q => q.eq("sessionId", args.sessionId))
      .collect();
    for (const bet of bets) {
      const won = checkBetWin(bet.betType, bet.betValue, session.winNumber);
      const multiplier = getMultiplier(bet.betType);
      const payout = won ? bet.amount * multiplier : 0;
      await ctx.db.patch(bet._id, { won, payout });
      if (won && payout > 0) {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", q => q.eq("userId", bet.userId))
          .unique();
        if (profile) {
          await ctx.db.patch(profile._id, { goldCoins: (profile.goldCoins ?? 0) + payout });
        }
      }
    }
    await ctx.db.patch(args.sessionId, { status: "ended", endedAt: Date.now() });
  },
});

export const endSession = mutation({
  args: { sessionId: v.id("rouletteSessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("الجلسة غير موجودة");
    if (session.hostUserId !== userId) throw new Error("غير مصرح");
    if (session.status === "betting") {
      const bets = await ctx.db
        .query("rouletteBets")
        .withIndex("by_session", q => q.eq("sessionId", args.sessionId))
        .collect();
      for (const bet of bets) {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", q => q.eq("userId", bet.userId))
          .unique();
        if (profile) {
          await ctx.db.patch(profile._id, { goldCoins: (profile.goldCoins ?? 0) + bet.amount });
        }
        await ctx.db.patch(bet._id, { won: false, payout: 0 });
      }
    }
    await ctx.db.patch(args.sessionId, { status: "ended", endedAt: Date.now() });
  },
});

export const getMyBetResults = query({
  args: { sessionId: v.id("rouletteSessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("rouletteBets")
      .withIndex("by_session_and_user", q => q.eq("sessionId", args.sessionId).eq("userId", userId))
      .collect();
  },
});
