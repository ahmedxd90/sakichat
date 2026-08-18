// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const SEED_QUESTIONS = [
  { question: "كم عدد أيام الأسبوع؟", optionA: "5", optionB: "6", optionC: "7", optionD: "8", correctOption: "C" as const, difficulty: "easy" as const },
  { question: "ما عاصمة الأردن؟", optionA: "إربد", optionB: "الزرقاء", optionC: "عمان", optionD: "العقبة", correctOption: "C" as const, difficulty: "easy" as const },
  { question: "ما الكوكب الأقرب إلى الشمس؟", optionA: "الزهرة", optionB: "عطارد", optionC: "المريخ", optionD: "الأرض", correctOption: "B" as const, difficulty: "easy" as const },
  { question: "في أي قارة تقع دولة البرازيل؟", optionA: "أوروبا", optionB: "آسيا", optionC: "أمريكا الجنوبية", optionD: "إفريقيا", correctOption: "C" as const, difficulty: "easy" as const },
  { question: "من مخترع المصباح الكهربائي؟", optionA: "ألبرت أينشتاين", optionB: "إسحاق نيوتن", optionC: "توماس إديسون", optionD: "نيكولا تسلا", correctOption: "C" as const, difficulty: "easy" as const },
  { question: "كم عدد قارات العالم؟", optionA: "5", optionB: "6", optionC: "7", optionD: "8", correctOption: "C" as const, difficulty: "easy" as const },
  { question: "ما اللغة الرسمية في البرازيل؟", optionA: "الإسبانية", optionB: "البرتغالية", optionC: "الفرنسية", optionD: "الإنجليزية", correctOption: "B" as const, difficulty: "medium" as const },
  { question: "من أول إنسان صعد إلى القمر في مهمة أبولو 11؟", optionA: "نيل أرمسترونغ", optionB: "يوري غاغارين", optionC: "باز ألدرين", optionD: "مايكل كولينز", correctOption: "A" as const, difficulty: "medium" as const },
  { question: "ما أكبر محيط في العالم؟", optionA: "الأطلسي", optionB: "الهادئ", optionC: "الهندي", optionD: "المتجمد الشمالي", correctOption: "B" as const, difficulty: "medium" as const },
  { question: "أي دولة تملك أكبر عدد سكان في العالم حالياً؟", optionA: "الولايات المتحدة", optionB: "الهند", optionC: "الصين", optionD: "إندونيسيا", correctOption: "B" as const, difficulty: "medium" as const },
  { question: "ما اسم أطول نهر في العالم حسب أغلب الدراسات الحديثة؟", optionA: "الأمازون", optionB: "النيل", optionC: "اليانغتسي", optionD: "المسيسيبي", correctOption: "A" as const, difficulty: "medium" as const },
  { question: "من رسم لوحة الموناليزا؟", optionA: "بابلو بيكاسو", optionB: "فينسنت فان غوخ", optionC: "ليوناردو دا فينشي", optionD: "مايكل أنجلو", correctOption: "C" as const, difficulty: "hard" as const },
  { question: "ما المعدن الأكثر توصيلاً للكهرباء؟", optionA: "الذهب", optionB: "النحاس", optionC: "الفضة", optionD: "الألمنيوم", correctOption: "C" as const, difficulty: "hard" as const },
  { question: "كم عدد الكروموسومات في الخلية البشرية الطبيعية؟", optionA: "44", optionB: "46", optionC: "48", optionD: "50", correctOption: "B" as const, difficulty: "hard" as const },
  { question: "أي عالم وضع نظرية النسبية؟", optionA: "إسحاق نيوتن", optionB: "غاليليو غاليلي", optionC: "ألبرت أينشتاين", optionD: "ستيفن هوكينغ", correctOption: "C" as const, difficulty: "hard" as const },
];

// ── زرع الأسئلة الافتراضية ──
export const seedQuestions = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", q => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) throw new Error("غير مصرح - سوبر أدمن فقط");
    const existing = await ctx.db.query("millionaireQuestions").collect();
    if (existing.length > 0) return { count: 0, message: "الأسئلة موجودة بالفعل" };
    for (const q of SEED_QUESTIONS) {
      await ctx.db.insert("millionaireQuestions", { ...q, createdAt: Date.now() });
    }
    return { count: SEED_QUESTIONS.length };
  },
});

// ── الأسئلة ──
export const getQuestions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("millionaireQuestions").order("asc").collect();
  },
});

export const addQuestion = mutation({
  args: {
    question: v.string(),
    optionA: v.string(),
    optionB: v.string(),
    optionC: v.string(),
    optionD: v.string(),
    correctOption: v.union(v.literal("A"), v.literal("B"), v.literal("C"), v.literal("D")),
    difficulty: v.optional(v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", q => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) throw new Error("غير مصرح");
    return await ctx.db.insert("millionaireQuestions", {
      question: args.question,
      optionA: args.optionA,
      optionB: args.optionB,
      optionC: args.optionC,
      optionD: args.optionD,
      correctOption: args.correctOption,
      difficulty: args.difficulty ?? "medium",
      createdAt: Date.now(),
    });
  },
});

export const deleteQuestion = mutation({
  args: { questionId: v.id("millionaireQuestions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", q => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) throw new Error("غير مصرح");
    await ctx.db.delete(args.questionId);
  },
});

// ── جلسة اللعب ──
export const getActiveGame = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("millionaireGames")
      .withIndex("by_room", q => q.eq("roomId", args.roomId))
      .filter(q => q.neq(q.field("status"), "ended"))
      .order("desc")
      .first();
  },
});

export const getCurrentQuestion = query({
  args: { gameId: v.id("millionaireGames") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;
    const qId = game.questionIds[game.currentQuestionIndex];
    if (!qId) return null;
    return await ctx.db.get(qId);
  },
});

export const startGame = mutation({
  args: {
    roomId: v.id("rooms"),
    hostSeatIndex: v.number(),
    contestantSeatIndex: v.number(),
    contestantUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const existing = await ctx.db
      .query("millionaireGames")
      .withIndex("by_room", q => q.eq("roomId", args.roomId))
      .filter(q => q.neq(q.field("status"), "ended"))
      .first();
    if (existing) throw new Error("يوجد لعبة نشطة بالفعل");
    const questions = await ctx.db.query("millionaireQuestions").collect();
    if (questions.length === 0) throw new Error("لا توجد أسئلة متاحة - يرجى إضافة أسئلة من لوحة الأدمن");
    const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, Math.min(15, questions.length));
    const questionIds = shuffled.map(q => q._id);
    return await ctx.db.insert("millionaireGames", {
      roomId: args.roomId,
      hostUserId: userId,
      contestantUserId: args.contestantUserId,
      hostSeatIndex: args.hostSeatIndex,
      contestantSeatIndex: args.contestantSeatIndex,
      status: "active",
      currentQuestionIndex: 0,
      questionIds,
      currentLevel: 0,
      usedLifelines: [],
      createdAt: Date.now(),
    });
  },
});

export const submitAnswer = mutation({
  args: {
    gameId: v.id("millionaireGames"),
    selectedOption: v.union(v.literal("A"), v.literal("B"), v.literal("C"), v.literal("D")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("اللعبة غير موجودة");
    if (game.contestantUserId !== userId) throw new Error("فقط المشارك يمكنه الإجابة");
    if (game.status !== "active") throw new Error("اللعبة منتهية");
    await ctx.db.patch(args.gameId, {
      pendingAnswer: args.selectedOption,
      pendingAnswerAt: Date.now(),
    });
  },
});

export const revealAnswer = mutation({
  args: {
    gameId: v.id("millionaireGames"),
    isCorrect: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("اللعبة غير موجودة");
    if (game.hostUserId !== userId) throw new Error("فقط المذيع يمكنه تأكيد الإجابة");
    const prizes = [0, 1000, 2000, 3000, 5000, 10000, 20000, 30000, 50000, 75000, 100000, 150000, 250000, 500000, 750000, 1000000];
    if (args.isCorrect) {
      const newLevel = game.currentLevel + 1;
      const isFinished = newLevel >= 15;
      await ctx.db.patch(args.gameId, {
        currentLevel: newLevel,
        currentQuestionIndex: game.currentQuestionIndex + 1,
        status: isFinished ? "ended" : "active",
        lastAnswerCorrect: true,
        lastAnswerAt: Date.now(),
        pendingAnswer: undefined,
        winnerId: isFinished ? game.contestantUserId : undefined,
        finalPrize: isFinished ? 1000000 : undefined,
      });
      if (isFinished) {
        const profile = await ctx.db.query("profiles").withIndex("by_userId", q => q.eq("userId", game.contestantUserId)).unique();
        if (profile) await ctx.db.patch(profile._id, { goldCoins: (profile.goldCoins ?? 0) + 1000000 });
      }
    } else {
      const safeLevel = game.currentLevel >= 10 ? 10 : game.currentLevel >= 5 ? 5 : 0;
      const prize = prizes[safeLevel] ?? 0;
      await ctx.db.patch(args.gameId, {
        status: "ended",
        lastAnswerCorrect: false,
        lastAnswerAt: Date.now(),
        pendingAnswer: undefined,
        finalPrize: prize,
      });
      if (prize > 0) {
        const profile = await ctx.db.query("profiles").withIndex("by_userId", q => q.eq("userId", game.contestantUserId)).unique();
        if (profile) await ctx.db.patch(profile._id, { goldCoins: (profile.goldCoins ?? 0) + prize });
      }
    }
  },
});

export const useLifeline = mutation({
  args: {
    gameId: v.id("millionaireGames"),
    lifeline: v.union(v.literal("fifty_fifty"), v.literal("audience"), v.literal("call_friend")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("اللعبة غير موجودة");
    if (game.contestantUserId !== userId) throw new Error("فقط المشارك يمكنه استخدام المساعدة");
    if (game.usedLifelines.includes(args.lifeline)) throw new Error("تم استخدام هذه المساعدة مسبقاً");
    await ctx.db.patch(args.gameId, {
      usedLifelines: [...game.usedLifelines, args.lifeline],
      activeLifeline: args.lifeline,
    });
  },
});

export const endGame = mutation({
  args: { gameId: v.id("millionaireGames") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("اللعبة غير موجودة");
    if (game.hostUserId !== userId && game.contestantUserId !== userId) throw new Error("غير مصرح");
    const prizes = [0, 1000, 2000, 3000, 5000, 10000, 20000, 30000, 50000, 75000, 100000, 150000, 250000, 500000, 750000, 1000000];
    const safeLevel = game.currentLevel >= 10 ? 10 : game.currentLevel >= 5 ? 5 : 0;
    const prize = prizes[safeLevel] ?? 0;
    await ctx.db.patch(args.gameId, { status: "ended", finalPrize: prize });
    if (prize > 0) {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", q => q.eq("userId", game.contestantUserId)).unique();
      if (profile) await ctx.db.patch(profile._id, { goldCoins: (profile.goldCoins ?? 0) + prize });
    }
  },
});
