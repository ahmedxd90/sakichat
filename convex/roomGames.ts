// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── إرسال رسالة نتيجة لعبة في دردشة الغرفة ──
export const sendGameMessage = mutation({
  args: {
    roomId: v.id("rooms"),
    gameType: v.union(v.literal("dice"), v.literal("rps")),
    result: v.string(),
    outcome: v.optional(v.string()),
    targetUserId: v.optional(v.id("users")),
    targetName: v.optional(v.string()),
    betAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    const senderName = profile?.name ?? "مجهول";

    let content = "";
    if (args.gameType === "dice") {
      content = `🎲 ${senderName} رمى النرد: ${args.result}`;
      if (args.outcome) content += ` — ${args.outcome}`;
    } else if (args.gameType === "rps") {
      content = `✊ ${senderName} لعب: ${args.result}`;
      if (args.targetName) content += ` ضد ${args.targetName}`;
      if (args.outcome) content += ` — ${args.outcome}`;
    }

    await ctx.db.insert("roomMessages", {
      roomId: args.roomId,
      userId,
      content,
      type: "system",
      createdAt: Date.now(),
    });
  },
});

// ── إنشاء لعبة (quiz / guess / trivia) ──
export const createGame = mutation({
  args: {
    roomId: v.id("rooms"),
    type: v.union(v.literal("quiz"), v.literal("guess"), v.literal("trivia")),
    question: v.string(),
    answer: v.string(),
    hint: v.optional(v.string()),
    prize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    // التحقق من صلاحيات المضيف أو الأدمن
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    const isOwner = room.ownerId === userId;
    const isAdmin = await ctx.db
      .query("roomAdmins")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", userId)
      )
      .unique();
    if (!isOwner && !isAdmin) throw new Error("غير مصرح - المضيف أو الأدمن فقط");

    // إنهاء أي لعبة نشطة سابقة
    const activeGames = await ctx.db
      .query("roomGames")
      .withIndex("by_room_and_active", (q) =>
        q.eq("roomId", args.roomId).eq("isActive", true)
      )
      .collect();
    for (const g of activeGames) {
      await ctx.db.patch(g._id, { isActive: false });
    }

    const gameId = await ctx.db.insert("roomGames", {
      roomId: args.roomId,
      hostId: userId,
      type: args.type,
      question: args.question,
      answer: args.answer.toLowerCase().trim(),
      hint: args.hint,
      isActive: true,
      prize: args.prize,
      createdAt: Date.now(),
    });

    // إرسال رسالة نظام في الدردشة
    const typeLabel =
      args.type === "quiz"
        ? "مسابقة"
        : args.type === "guess"
        ? "تخمين"
        : "معلومة";
    await ctx.db.insert("roomMessages", {
      roomId: args.roomId,
      userId,
      content: `🎯 ${typeLabel} جديدة: ${args.question}${args.prize ? ` — الجائزة: ${args.prize.toLocaleString()} عملة 🪙` : ""}`,
      type: "system",
      createdAt: Date.now(),
    });

    return gameId;
  },
});

// ── الحصول على اللعبة النشطة في الغرفة ──
export const getActiveGame = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("roomGames")
      .withIndex("by_room_and_active", (q) =>
        q.eq("roomId", args.roomId).eq("isActive", true)
      )
      .order("desc")
      .first();
    if (!game) return null;

    const host = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", game.hostId))
      .unique();

    return { ...game, hostName: host?.name ?? "مجهول" };
  },
});

// ── الإجابة على اللعبة ──
export const submitAnswer = mutation({
  args: {
    gameId: v.id("roomGames"),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("اللعبة غير موجودة");
    if (!game.isActive) throw new Error("اللعبة انتهت");

    // التحقق من عدم الإجابة مسبقاً
    const existing = await ctx.db
      .query("roomGameAnswers")
      .withIndex("by_game_and_user", (q) =>
        q.eq("gameId", args.gameId).eq("userId", userId)
      )
      .unique();
    if (existing) throw new Error("لقد أجبت بالفعل");

    const isCorrect =
      args.answer.toLowerCase().trim() === game.answer.toLowerCase().trim();

    await ctx.db.insert("roomGameAnswers", {
      gameId: args.gameId,
      userId,
      answer: args.answer,
      isCorrect,
      createdAt: Date.now(),
    });

    if (isCorrect) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();
      const winnerName = profile?.name ?? "مجهول";

      // إنهاء اللعبة وتسجيل الفائز
      await ctx.db.patch(args.gameId, {
        isActive: false,
        winnerId: userId,
        winnerName,
      });

      // منح الجائزة إن وجدت
      if (game.prize && game.prize > 0 && profile) {
        await ctx.db.patch(profile._id, {
          goldCoins: (profile.goldCoins ?? 0) + game.prize,
        });
      }

      // رسالة نظام في الدردشة
      await ctx.db.insert("roomMessages", {
        roomId: game.roomId,
        userId,
        content: `🏆 ${winnerName} أجاب بشكل صحيح!${game.prize ? ` وفاز بـ ${game.prize.toLocaleString()} عملة 🪙` : ""}`,
        type: "system",
        createdAt: Date.now(),
      });
    }

    return { isCorrect };
  },
});

// ── إنهاء اللعبة يدوياً ──
export const endGame = mutation({
  args: { gameId: v.id("roomGames") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("اللعبة غير موجودة");

    const room = await ctx.db.get(game.roomId);
    const isOwner = room?.ownerId === userId;
    const isHost = game.hostId === userId;
    const isAdmin = await ctx.db
      .query("roomAdmins")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", game.roomId).eq("userId", userId)
      )
      .unique();
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!isOwner && !isHost && !isAdmin && !profile?.isSuperAdmin)
      throw new Error("غير مصرح");

    await ctx.db.patch(args.gameId, { isActive: false });

    await ctx.db.insert("roomMessages", {
      roomId: game.roomId,
      userId,
      content: `❌ انتهت اللعبة. الإجابة الصحيحة كانت: ${game.answer}`,
      type: "system",
      createdAt: Date.now(),
    });
  },
});

// ── الحصول على إجابات لعبة معينة ──
export const getGameAnswers = query({
  args: { gameId: v.id("roomGames") },
  handler: async (ctx, args) => {
    const answers = await ctx.db
      .query("roomGameAnswers")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .order("asc")
      .collect();

    return await Promise.all(
      answers.map(async (a) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", a.userId))
          .unique();
        return { ...a, userName: profile?.name ?? "مجهول" };
      })
    );
  },
});

// ── الحصول على آخر الألعاب في الغرفة ──
export const getRoomGames = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const games = await ctx.db
      .query("roomGames")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(20);

    return await Promise.all(
      games.map(async (g) => {
        const host = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", g.hostId))
          .unique();
        return { ...g, hostName: host?.name ?? "مجهول" };
      })
    );
  },
});

// ── لعبة النرد (Dice) ──
export const rollDice = mutation({
  args: {
    roomId: v.id("rooms"),
    betAmount: v.optional(v.number()),
    targetUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");

    const myRoll = Math.floor(Math.random() * 6) + 1;
    let content = `🎲 ${profile.name} رمى النرد وحصل على: ${myRoll}`;
    let opponentRoll: number | null = null;
    let outcome = "";

    if (args.targetUserId && args.betAmount && args.betAmount > 0) {
      const coins = profile.goldCoins ?? 0;
      if (coins < args.betAmount)
        throw new Error(`رصيدك غير كافٍ. تحتاج ${args.betAmount.toLocaleString()} عملة`);

      const opponentProfile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId!))
        .unique();
      if (!opponentProfile) throw new Error("المستخدم غير موجود");
      const opponentCoins = opponentProfile.goldCoins ?? 0;
      if (opponentCoins < args.betAmount)
        throw new Error("رصيد الخصم غير كافٍ");

      opponentRoll = Math.floor(Math.random() * 6) + 1;

      if (myRoll > opponentRoll) {
        outcome = `🏆 ${profile.name} فاز!`;
        await ctx.db.patch(profile._id, {
          goldCoins: coins + args.betAmount,
        });
        await ctx.db.patch(opponentProfile._id, {
          goldCoins: opponentCoins - args.betAmount,
        });
      } else if (opponentRoll > myRoll) {
        outcome = `🏆 ${opponentProfile.name} فاز!`;
        await ctx.db.patch(profile._id, {
          goldCoins: coins - args.betAmount,
        });
        await ctx.db.patch(opponentProfile._id, {
          goldCoins: opponentCoins + args.betAmount,
        });
      } else {
        outcome = "🤝 تعادل!";
      }

      content = `🎲 ${profile.name} (${myRoll}) ضد ${opponentProfile.name} (${opponentRoll}) — ${outcome} — الرهان: ${args.betAmount.toLocaleString()} عملة`;
    }

    await ctx.db.insert("roomMessages", {
      roomId: args.roomId,
      userId,
      content,
      type: "system",
      createdAt: Date.now(),
    });

    return { myRoll, opponentRoll, outcome };
  },
});

// ── لعبة حجر ورقة مقص (RPS) ──
export const playRPS = mutation({
  args: {
    roomId: v.id("rooms"),
    choice: v.union(v.literal("rock"), v.literal("paper"), v.literal("scissors")),
    targetUserId: v.optional(v.id("users")),
    betAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");

    const choiceEmoji: Record<string, string> = {
      rock: "🪨 حجر",
      paper: "📄 ورقة",
      scissors: "✂️ مقص",
    };

    const wins: Record<string, string> = {
      rock: "scissors",
      paper: "rock",
      scissors: "paper",
    };

    const myChoice = args.choice;
    const cpuChoice = (["rock", "paper", "scissors"] as const)[
      Math.floor(Math.random() * 3)
    ];

    let outcome = "";
    let content = "";

    if (args.targetUserId && args.betAmount && args.betAmount > 0) {
      const coins = profile.goldCoins ?? 0;
      if (coins < args.betAmount)
        throw new Error(`رصيدك غير كافٍ. تحتاج ${args.betAmount.toLocaleString()} عملة`);

      const opponentProfile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId!))
        .unique();
      if (!opponentProfile) throw new Error("المستخدم غير موجود");
      const opponentCoins = opponentProfile.goldCoins ?? 0;
      if (opponentCoins < args.betAmount)
        throw new Error("رصيد الخصم غير كافٍ");

      // نختار للخصم عشوائياً (في الواقع يجب أن يختار هو، لكن هنا نبسّط)
      const opponentChoice = (["rock", "paper", "scissors"] as const)[
        Math.floor(Math.random() * 3)
      ];

      if (wins[myChoice] === opponentChoice) {
        outcome = `🏆 ${profile.name} فاز!`;
        await ctx.db.patch(profile._id, { goldCoins: coins + args.betAmount });
        await ctx.db.patch(opponentProfile._id, {
          goldCoins: opponentCoins - args.betAmount,
        });
      } else if (wins[opponentChoice] === myChoice) {
        outcome = `🏆 ${opponentProfile.name} فاز!`;
        await ctx.db.patch(profile._id, { goldCoins: coins - args.betAmount });
        await ctx.db.patch(opponentProfile._id, {
          goldCoins: opponentCoins + args.betAmount,
        });
      } else {
        outcome = "🤝 تعادل!";
      }

      content = `✊ ${profile.name} (${choiceEmoji[myChoice]}) ضد ${opponentProfile.name} (${choiceEmoji[opponentChoice]}) — ${outcome} — الرهان: ${args.betAmount.toLocaleString()} عملة`;
    } else {
      // ضد الكمبيوتر
      if (wins[myChoice] === cpuChoice) {
        outcome = "🏆 فزت!";
      } else if (wins[cpuChoice] === myChoice) {
        outcome = "😔 خسرت!";
      } else {
        outcome = "🤝 تعادل!";
      }
      content = `✊ ${profile.name} لعب ${choiceEmoji[myChoice]} ضد الكمبيوتر ${choiceEmoji[cpuChoice]} — ${outcome}`;
    }

    await ctx.db.insert("roomMessages", {
      roomId: args.roomId,
      userId,
      content,
      type: "system",
      createdAt: Date.now(),
    });

    return { myChoice, cpuChoice, outcome };
  },
});

// ── إنشاء استطلاع ──
export const createPoll = mutation({
  args: {
    roomId: v.id("rooms"),
    question: v.string(),
    options: v.array(v.string()),
    endsAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    const isOwner = room.ownerId === userId;
    const isAdmin = await ctx.db
      .query("roomAdmins")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", userId)
      )
      .unique();
    if (!isOwner && !isAdmin) throw new Error("غير مصرح");

    if (args.options.length < 2) throw new Error("يجب أن يكون هناك خياران على الأقل");

    // إنهاء الاستطلاعات النشطة
    const activePolls = await ctx.db
      .query("roomPolls")
      .withIndex("by_room_and_active", (q) =>
        q.eq("roomId", args.roomId).eq("isActive", true)
      )
      .collect();
    for (const p of activePolls) {
      await ctx.db.patch(p._id, { isActive: false });
    }

    const pollId = await ctx.db.insert("roomPolls", {
      roomId: args.roomId,
      creatorId: userId,
      question: args.question,
      options: args.options,
      isActive: true,
      endsAt: args.endsAt,
      createdAt: Date.now(),
    });

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    await ctx.db.insert("roomMessages", {
      roomId: args.roomId,
      userId,
      content: `📊 ${profile?.name ?? "المضيف"} أنشأ استطلاعاً: ${args.question}`,
      type: "system",
      createdAt: Date.now(),
    });

    return pollId;
  },
});

// ── التصويت في الاستطلاع ──
export const votePoll = mutation({
  args: {
    pollId: v.id("roomPolls"),
    optionIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const poll = await ctx.db.get(args.pollId);
    if (!poll) throw new Error("الاستطلاع غير موجود");
    if (!poll.isActive) throw new Error("الاستطلاع انتهى");
    if (poll.endsAt && Date.now() > poll.endsAt) {
      await ctx.db.patch(args.pollId, { isActive: false });
      throw new Error("انتهى وقت الاستطلاع");
    }

    const existing = await ctx.db
      .query("roomPollVotes")
      .withIndex("by_poll_and_user", (q) =>
        q.eq("pollId", args.pollId).eq("userId", userId)
      )
      .unique();
    if (existing) throw new Error("لقد صوّت بالفعل");

    if (args.optionIndex < 0 || args.optionIndex >= poll.options.length)
      throw new Error("خيار غير صالح");

    await ctx.db.insert("roomPollVotes", {
      pollId: args.pollId,
      userId,
      optionIndex: args.optionIndex,
      createdAt: Date.now(),
    });
  },
});

// ── الحصول على الاستطلاع النشط مع نتائجه ──
export const getActivePoll = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const poll = await ctx.db
      .query("roomPolls")
      .withIndex("by_room_and_active", (q) =>
        q.eq("roomId", args.roomId).eq("isActive", true)
      )
      .order("desc")
      .first();
    if (!poll) return null;

    const votes = await ctx.db
      .query("roomPollVotes")
      .withIndex("by_poll", (q) => q.eq("pollId", poll._id))
      .collect();

    const voteCounts = poll.options.map((_, i) =>
      votes.filter((v) => v.optionIndex === i).length
    );

    const userId = await getAuthUserId(ctx);
    const myVote = userId
      ? votes.find((v) => v.userId === userId)?.optionIndex ?? null
      : null;

    return { ...poll, voteCounts, totalVotes: votes.length, myVote };
  },
});

// ── إنهاء الاستطلاع ──
export const endPoll = mutation({
  args: { pollId: v.id("roomPolls") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const poll = await ctx.db.get(args.pollId);
    if (!poll) throw new Error("الاستطلاع غير موجود");

    const room = await ctx.db.get(poll.roomId);
    const isOwner = room?.ownerId === userId;
    const isAdmin = await ctx.db
      .query("roomAdmins")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", poll.roomId).eq("userId", userId)
      )
      .unique();
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!isOwner && !isAdmin && !profile?.isSuperAdmin)
      throw new Error("غير مصرح");

    await ctx.db.patch(args.pollId, { isActive: false });
  },
});

// ── إنشاء إعلان في الغرفة ──
export const createAnnouncement = mutation({
  args: {
    roomId: v.id("rooms"),
    content: v.string(),
    isPinned: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    const isOwner = room.ownerId === userId;
    const isAdmin = await ctx.db
      .query("roomAdmins")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", userId)
      )
      .unique();
    if (!isOwner && !isAdmin) throw new Error("غير مصرح");

    const announcementId = await ctx.db.insert("roomAnnouncements", {
      roomId: args.roomId,
      creatorId: userId,
      content: args.content,
      isPinned: args.isPinned ?? false,
      createdAt: Date.now(),
    });

    await ctx.db.insert("roomMessages", {
      roomId: args.roomId,
      userId,
      content: `📢 إعلان: ${args.content}`,
      type: "system",
      createdAt: Date.now(),
    });

    return announcementId;
  },
});

// ── الحصول على إعلانات الغرفة ──
export const getRoomAnnouncements = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("roomAnnouncements")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(20);
  },
});

// ── حذف إعلان ──
export const deleteAnnouncement = mutation({
  args: { announcementId: v.id("roomAnnouncements") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const ann = await ctx.db.get(args.announcementId);
    if (!ann) throw new Error("الإعلان غير موجود");

    const room = await ctx.db.get(ann.roomId);
    const isOwner = room?.ownerId === userId;
    const isAdmin = await ctx.db
      .query("roomAdmins")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", ann.roomId).eq("userId", userId)
      )
      .unique();
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!isOwner && !isAdmin && !profile?.isSuperAdmin)
      throw new Error("غير مصرح");

    await ctx.db.delete(args.announcementId);
  },
});

// ── تبديل تثبيت الإعلان ──
export const togglePinAnnouncement = mutation({
  args: { announcementId: v.id("roomAnnouncements") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const ann = await ctx.db.get(args.announcementId);
    if (!ann) throw new Error("الإعلان غير موجود");

    const room = await ctx.db.get(ann.roomId);
    const isOwner = room?.ownerId === userId;
    const isAdmin = await ctx.db
      .query("roomAdmins")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", ann.roomId).eq("userId", userId)
      )
      .unique();
    if (!isOwner && !isAdmin) throw new Error("غير مصرح");

    await ctx.db.patch(args.announcementId, { isPinned: !ann.isPinned });
  },
});
