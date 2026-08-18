// @ts-nocheck
import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// ── PK داخل الغرفة الواحدة بين المستخدمين ──

export const startInRoomPK = mutation({
  args: {
    roomId: v.id("rooms"),
    durationMinutes: v.number(),
    team1Name: v.optional(v.string()),
    team2Name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    if (room.roomTheme !== "pk") throw new Error("هذه الميزة متاحة فقط في غرف PK");

    // Check if owner or admin
    const isOwner = room.ownerId === userId;
    const adm = await ctx.db.query("roomAdmins")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", userId))
      .unique();
    if (!isOwner && !adm) throw new Error("فقط مالك الغرفة أو المشرف يمكنه بدء تحدي PK");

    // Check no active PK
    const existing = await ctx.db.query("inRoomPKBattles")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.neq(q.field("status"), "finished"))
      .first();
    if (existing) throw new Error("يوجد تحدي PK نشط بالفعل في هذه الغرفة");

    const now = Date.now();
    const endsAt = now + args.durationMinutes * 60 * 1000;

    const pkId = await ctx.db.insert("inRoomPKBattles", {
      roomId: args.roomId,
      hostId: userId,
      team1Name: args.team1Name ?? "الفريق الأحمر 🔴",
      team2Name: args.team2Name ?? "الفريق الأزرق 🔵",
      team1Coins: 0,
      team2Coins: 0,
      status: "active",
      durationMinutes: args.durationMinutes,
      startedAt: now,
      endsAt,
      createdAt: now,
    });

    await ctx.scheduler.runAfter(
      args.durationMinutes * 60 * 1000,
      internal.pkInRoom.finishInRoomPK,
      { pkId }
    );

    // Fever time: 1 min before end
    if (args.durationMinutes > 1) {
      await ctx.scheduler.runAfter(
        (args.durationMinutes * 60 - 60) * 1000,
        internal.pkInRoom.triggerFeverTime,
        { pkId }
      );
    }

    return pkId;
  },
});

export const finishInRoomPK = internalMutation({
  args: { pkId: v.id("inRoomPKBattles") },
  handler: async (ctx, args) => {
    const pk = await ctx.db.get(args.pkId);
    if (!pk || pk.status !== "active") return null;

    let winnerTeam: "team1" | "team2" | "draw" = "draw";
    if (pk.team1Coins > pk.team2Coins) winnerTeam = "team1";
    else if (pk.team2Coins > pk.team1Coins) winnerTeam = "team2";

    await ctx.db.patch(args.pkId, {
      status: "finished",
      winnerTeam,
      finishedAt: Date.now(),
    });
    return null;
  },
});

export const triggerFeverTime = internalMutation({
  args: { pkId: v.id("inRoomPKBattles") },
  handler: async (ctx, args) => {
    const pk = await ctx.db.get(args.pkId);
    if (!pk || pk.status !== "active") return null;
    await ctx.db.patch(args.pkId, { isFeverTime: true });
    return null;
  },
});

export const endInRoomPKEarly = mutation({
  args: { pkId: v.id("inRoomPKBattles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const pk = await ctx.db.get(args.pkId);
    if (!pk) throw new Error("التحدي غير موجود");
    if (pk.status !== "active") throw new Error("التحدي غير نشط");

    const room = await ctx.db.get(pk.roomId);
    const isOwner = room?.ownerId === userId;
    const adm = await ctx.db.query("roomAdmins")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", pk.roomId).eq("userId", userId))
      .unique();
    if (!isOwner && !adm) throw new Error("غير مصرح");

    let winnerTeam: "team1" | "team2" | "draw" = "draw";
    if (pk.team1Coins > pk.team2Coins) winnerTeam = "team1";
    else if (pk.team2Coins > pk.team1Coins) winnerTeam = "team2";

    await ctx.db.patch(args.pkId, {
      status: "finished",
      winnerTeam,
      finishedAt: Date.now(),
    });
    return null;
  },
});

export const addGiftToInRoomPK = internalMutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
    userName: v.string(),
    coins: v.number(),
    team: v.union(v.literal("team1"), v.literal("team2")),
  },
  handler: async (ctx, args) => {
    const pk = await ctx.db.query("inRoomPKBattles")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    if (!pk) return null;

    const multiplier = pk.isFeverTime ? 2 : 1;
    const effectiveCoins = args.coins * multiplier;

    if (args.team === "team1") {
      await ctx.db.patch(pk._id, { team1Coins: (pk.team1Coins ?? 0) + effectiveCoins });
    } else {
      await ctx.db.patch(pk._id, { team2Coins: (pk.team2Coins ?? 0) + effectiveCoins });
    }

    // Track contributor
    const existing = await ctx.db.query("inRoomPKContributions")
      .withIndex("by_pk_user", (q) => q.eq("pkId", pk._id).eq("userId", args.userId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { coins: existing.coins + effectiveCoins });
    } else {
      await ctx.db.insert("inRoomPKContributions", {
        pkId: pk._id,
        roomId: args.roomId,
        userId: args.userId,
        userName: args.userName,
        team: args.team,
        coins: effectiveCoins,
        createdAt: Date.now(),
      });
    }
    return null;
  },
});

export const getActiveInRoomPK = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db.query("inRoomPKBattles")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.neq(q.field("status"), "finished"))
      .first();
  },
});

export const getLastFinishedInRoomPK = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
    const pk = await ctx.db.query("inRoomPKBattles")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("status"), "finished"))
      .order("desc")
      .first();
    if (!pk) return null;
    if ((pk.finishedAt ?? pk._creationTime) < fiveMinsAgo) return null;
    return pk;
  },
});

export const getInRoomPKContributors = query({
  args: { pkId: v.id("inRoomPKBattles") },
  handler: async (ctx, args) => {
    const contribs = await ctx.db.query("inRoomPKContributions")
      .withIndex("by_pk", (q) => q.eq("pkId", args.pkId))
      .collect();
    return contribs.sort((a, b) => b.coins - a.coins);
  },
});

export const getInRoomPKHistory = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db.query("inRoomPKBattles")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("status"), "finished"))
      .order("desc")
      .take(20);
  },
});

export const joinPKTeam = mutation({
  args: {
    pkId: v.id("inRoomPKBattles"),
    team: v.union(v.literal("team1"), v.literal("team2")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const pk = await ctx.db.get(args.pkId);
    if (!pk || pk.status !== "active") throw new Error("التحدي غير نشط");

    const existing = await ctx.db.query("inRoomPKMembers")
      .withIndex("by_pk_user", (q) => q.eq("pkId", args.pkId).eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { team: args.team });
    } else {
      const profile = await ctx.db.query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();
      await ctx.db.insert("inRoomPKMembers", {
        pkId: args.pkId,
        roomId: pk.roomId,
        userId,
        userName: profile?.name ?? "مجهول",
        userAvatarUrl: profile?.avatarUrl,
        team: args.team,
        joinedAt: Date.now(),
      });
    }
    return null;
  },
});

export const getInRoomPKMembers = query({
  args: { pkId: v.id("inRoomPKBattles") },
  handler: async (ctx, args) => {
    return await ctx.db.query("inRoomPKMembers")
      .withIndex("by_pk", (q) => q.eq("pkId", args.pkId))
      .collect();
  },
});

export const getMyPKTeam = query({
  args: { pkId: v.id("inRoomPKBattles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const member = await ctx.db.query("inRoomPKMembers")
      .withIndex("by_pk_user", (q) => q.eq("pkId", args.pkId).eq("userId", userId))
      .unique();
    return member?.team ?? null;
  },
});
