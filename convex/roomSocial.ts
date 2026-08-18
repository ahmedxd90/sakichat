// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── Room Likes ────────────────────────────────────────────────────────────────

export const toggleRoomLike = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const ex = await ctx.db
      .query("roomLikes")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", userId)
      )
      .unique();
    if (ex) {
      await ctx.db.delete(ex._id);
      return false;
    }
    await ctx.db.insert("roomLikes", {
      roomId: args.roomId,
      userId,
      createdAt: Date.now(),
    });
    return true;
  },
});

export const getRoomLikes = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const likes = await ctx.db
      .query("roomLikes")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    const isLiked = userId ? likes.some((l) => l.userId === userId) : false;
    const likers = await Promise.all(
      likes.slice(0, 30).map(async (l) => {
        const p = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", l.userId))
          .unique();
        let av = p?.avatarUrl;
        if (p?.avatarStorageId && !av)
          av = (await ctx.storage.getUrl(p.avatarStorageId)) ?? undefined;
        return {
          userId: l.userId,
          name: p?.name ?? "مجهول",
          avatarUrl: av,
          isVip: p?.isVip ?? false,
          vipLevel: p?.vipLevel,
        };
      })
    );
    return { count: likes.length, isLiked, likers };
  },
});

export const toggleRoomFollow = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    const existing = await ctx.db.query("roomFollowers")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", userId))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }
    await ctx.db.insert("roomFollowers", { roomId: args.roomId, userId, createdAt: Date.now() });
    return true;
  },
});

export const getRoomFollowStatus = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const followers = await ctx.db.query("roomFollowers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    return { count: followers.length, isFollowing: !!userId && followers.some((f) => f.userId === userId) };
  },
});

export const getRoomAdmins = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    const staff = members.filter(
      (m) => m.role === "owner" || m.role === "admin"
    );
    return await Promise.all(
      staff.map(async (m) => {
        const p = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", m.userId))
          .unique();
        let av = p?.avatarUrl;
        if (p?.avatarStorageId && !av)
          av = (await ctx.storage.getUrl(p.avatarStorageId)) ?? undefined;
        return { ...m, profile: p ? { ...p, avatarUrl: av } : null };
      })
    );
  },
});

// ── Room Announcements ────────────────────────────────────────────────────────

export const createAnnouncement = mutation({
  args: {
    roomId: v.id("rooms"),
    content: v.string(),
    isPinned: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const myMember = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", userId)
      )
      .unique();
    if (!myMember || (myMember.role !== "owner" && myMember.role !== "admin"))
      throw new Error("ليس لديك صلاحية");
    if (args.content.trim().length === 0) throw new Error("المحتوى فارغ");
    if (args.content.length > 500) throw new Error("الإعلان طويل جداً (500 حرف كحد أقصى)");
    return await ctx.db.insert("roomAnnouncements", {
      roomId: args.roomId,
      creatorId: userId,
      content: args.content.trim(),
      isPinned: args.isPinned ?? false,
      createdAt: Date.now(),
    });
  },
});

export const deleteAnnouncement = mutation({
  args: { announcementId: v.id("roomAnnouncements") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const ann = await ctx.db.get(args.announcementId);
    if (!ann) throw new Error("الإعلان غير موجود");
    const myMember = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", ann.roomId).eq("userId", userId)
      )
      .unique();
    if (!myMember || (myMember.role !== "owner" && myMember.role !== "admin"))
      throw new Error("ليس لديك صلاحية");
    await ctx.db.delete(args.announcementId);
  },
});

export const pinAnnouncement = mutation({
  args: { announcementId: v.id("roomAnnouncements"), isPinned: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const ann = await ctx.db.get(args.announcementId);
    if (!ann) throw new Error("الإعلان غير موجود");
    const myMember = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", ann.roomId).eq("userId", userId)
      )
      .unique();
    if (!myMember || myMember.role !== "owner")
      throw new Error("فقط المالك يمكنه تثبيت الإعلانات");
    await ctx.db.patch(args.announcementId, { isPinned: args.isPinned });
  },
});

export const getRoomAnnouncements = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const anns = await ctx.db
      .query("roomAnnouncements")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(20);
    return await Promise.all(
      anns.map(async (a) => {
        const p = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", a.creatorId))
          .unique();
        let av = p?.avatarUrl;
        if (p?.avatarStorageId && !av)
          av = (await ctx.storage.getUrl(p.avatarStorageId)) ?? undefined;
        return {
          ...a,
          creatorName: p?.name ?? "مجهول",
          creatorAvatar: av,
          creatorIsVip: p?.isVip ?? false,
          creatorVipLevel: p?.vipLevel,
        };
      })
    );
  },
});

// ── Room Polls ────────────────────────────────────────────────────────────────

export const createPoll = mutation({
  args: {
    roomId: v.id("rooms"),
    question: v.string(),
    options: v.array(v.string()),
    durationMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const myMember = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", userId)
      )
      .unique();
    if (!myMember || (myMember.role !== "owner" && myMember.role !== "admin"))
      throw new Error("ليس لديك صلاحية");
    if (args.options.length < 2) throw new Error("يجب أن يكون هناك خياران على الأقل");
    if (args.options.length > 6) throw new Error("الحد الأقصى 6 خيارات");
    if (args.question.trim().length === 0) throw new Error("السؤال فارغ");
    // Close any existing active poll
    const existing = await ctx.db
      .query("roomPolls")
      .withIndex("by_room_and_active", (q) =>
        q.eq("roomId", args.roomId).eq("isActive", true)
      )
      .first();
    if (existing) await ctx.db.patch(existing._id, { isActive: false });
    const endsAt = args.durationMinutes
      ? Date.now() + args.durationMinutes * 60 * 1000
      : undefined;
    return await ctx.db.insert("roomPolls", {
      roomId: args.roomId,
      creatorId: userId,
      question: args.question.trim(),
      options: args.options.map((o) => o.trim()).filter(Boolean),
      isActive: true,
      endsAt,
      createdAt: Date.now(),
    });
  },
});

export const closePoll = mutation({
  args: { pollId: v.id("roomPolls") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const poll = await ctx.db.get(args.pollId);
    if (!poll) throw new Error("التصويت غير موجود");
    const myMember = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", poll.roomId).eq("userId", userId)
      )
      .unique();
    if (!myMember || (myMember.role !== "owner" && myMember.role !== "admin"))
      throw new Error("ليس لديك صلاحية");
    await ctx.db.patch(args.pollId, { isActive: false });
  },
});

export const votePoll = mutation({
  args: { pollId: v.id("roomPolls"), optionIndex: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const poll = await ctx.db.get(args.pollId);
    if (!poll) throw new Error("التصويت غير موجود");
    if (!poll.isActive) throw new Error("انتهى وقت التصويت");
    if (poll.endsAt && Date.now() > poll.endsAt) {
      await ctx.db.patch(args.pollId, { isActive: false });
      throw new Error("انتهى وقت التصويت");
    }
    if (args.optionIndex < 0 || args.optionIndex >= poll.options.length)
      throw new Error("خيار غير صالح");
    const existing = await ctx.db
      .query("roomPollVotes")
      .withIndex("by_poll_and_user", (q) =>
        q.eq("pollId", args.pollId).eq("userId", userId)
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { optionIndex: args.optionIndex });
    } else {
      await ctx.db.insert("roomPollVotes", {
        pollId: args.pollId,
        userId,
        optionIndex: args.optionIndex,
        createdAt: Date.now(),
      });
    }
  },
});

export const getActivePoll = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const poll = await ctx.db
      .query("roomPolls")
      .withIndex("by_room_and_active", (q) =>
        q.eq("roomId", args.roomId).eq("isActive", true)
      )
      .first();
    if (!poll) return null;
    const votes = await ctx.db
      .query("roomPollVotes")
      .withIndex("by_poll", (q) => q.eq("pollId", poll._id))
      .collect();
    const myVote = userId
      ? votes.find((v) => v.userId === userId)?.optionIndex ?? null
      : null;
    const voteCounts = poll.options.map((_, i) =>
      votes.filter((v) => v.optionIndex === i).length
    );
    return { ...poll, voteCounts, totalVotes: votes.length, myVote };
  },
});

export const getRecentPolls = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const polls = await ctx.db
      .query("roomPolls")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(5);
    return await Promise.all(
      polls.map(async (poll) => {
        const votes = await ctx.db
          .query("roomPollVotes")
          .withIndex("by_poll", (q) => q.eq("pollId", poll._id))
          .collect();
        const myVote = userId
          ? votes.find((v) => v.userId === userId)?.optionIndex ?? null
          : null;
        const voteCounts = poll.options.map((_, i) =>
          votes.filter((v) => v.optionIndex === i).length
        );
        return { ...poll, voteCounts, totalVotes: votes.length, myVote };
      })
    );
  },
});

// ── Room Games ────────────────────────────────────────────────────────────────

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
    const myMember = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", userId)
      )
      .unique();
    if (!myMember || (myMember.role !== "owner" && myMember.role !== "admin"))
      throw new Error("ليس لديك صلاحية");
    if (args.question.trim().length === 0) throw new Error("السؤال فارغ");
    if (args.answer.trim().length === 0) throw new Error("الإجابة فارغة");
    // Close any existing active game
    const existing = await ctx.db
      .query("roomGames")
      .withIndex("by_room_and_active", (q) =>
        q.eq("roomId", args.roomId).eq("isActive", true)
      )
      .first();
    if (existing) await ctx.db.patch(existing._id, { isActive: false });
    return await ctx.db.insert("roomGames", {
      roomId: args.roomId,
      hostId: userId,
      type: args.type,
      question: args.question.trim(),
      answer: args.answer.trim().toLowerCase(),
      hint: args.hint?.trim(),
      isActive: true,
      prize: args.prize,
      createdAt: Date.now(),
    });
  },
});

export const submitGameAnswer = mutation({
  args: { gameId: v.id("roomGames"), answer: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("اللعبة غير موجودة");
    if (!game.isActive) throw new Error("انتهت اللعبة");
    // Check if already answered correctly
    const myAnswer = await ctx.db
      .query("roomGameAnswers")
      .withIndex("by_game_and_user", (q) =>
        q.eq("gameId", args.gameId).eq("userId", userId)
      )
      .unique();
    if (myAnswer?.isCorrect) throw new Error("لقد أجبت بشكل صحيح بالفعل");
    const isCorrect =
      args.answer.trim().toLowerCase() === game.answer.toLowerCase();
    if (myAnswer) {
      await ctx.db.patch(myAnswer._id, {
        answer: args.answer.trim(),
        isCorrect,
      });
    } else {
      await ctx.db.insert("roomGameAnswers", {
        gameId: args.gameId,
        userId,
        answer: args.answer.trim(),
        isCorrect,
        createdAt: Date.now(),
      });
    }
    if (isCorrect) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();
      // Award prize coins if set
      if (game.prize && game.prize > 0 && profile) {
        await ctx.db.patch(profile._id, {
          goldCoins: (profile.goldCoins ?? 0) + game.prize,
        });
      }
      await ctx.db.patch(args.gameId, {
        isActive: false,
        winnerId: userId,
        winnerName: profile?.name ?? "مجهول",
      });
    }
    return { isCorrect, winnerName: isCorrect ? (await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique())?.name ?? "مجهول" : null };
  },
});

export const closeGame = mutation({
  args: { gameId: v.id("roomGames") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("اللعبة غير موجودة");
    const myMember = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", game.roomId).eq("userId", userId)
      )
      .unique();
    if (!myMember || (myMember.role !== "owner" && myMember.role !== "admin"))
      throw new Error("ليس لديك صلاحية");
    await ctx.db.patch(args.gameId, { isActive: false });
  },
});

export const getActiveGame = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const game = await ctx.db
      .query("roomGames")
      .withIndex("by_room_and_active", (q) =>
        q.eq("roomId", args.roomId).eq("isActive", true)
      )
      .first();
    if (!game) return null;
    const answers = await ctx.db
      .query("roomGameAnswers")
      .withIndex("by_game", (q) => q.eq("gameId", game._id))
      .collect();
    const myAnswer = userId
      ? answers.find((a) => a.userId === userId)
      : null;
    const correctAnswers = answers.filter((a) => a.isCorrect).length;
    return {
      ...game,
      answer: undefined, // hide answer from client
      totalAnswers: answers.length,
      correctAnswers,
      myAnswer: myAnswer
        ? { answer: myAnswer.answer, isCorrect: myAnswer.isCorrect }
        : null,
    };
  },
});

export const getRecentGames = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const games = await ctx.db
      .query("roomGames")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(5);
    return games.map((g) => ({
      ...g,
      answer: g.isActive ? undefined : g.answer,
    }));
  },
});
