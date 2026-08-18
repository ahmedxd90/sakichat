// @ts-nocheck
import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

async function isOwnerOrAdmin(ctx: any, roomId: any, userId: any) {
  const room = await ctx.db.get(roomId);
  if (!room) return false;
  if (room.ownerId === userId) return true;
  const adm = await ctx.db
    .query("roomAdmins")
    .withIndex("by_room_and_user", (q: any) =>
      q.eq("roomId", roomId).eq("userId", userId)
    )
    .first();
  return !!adm;
}

// ── Called automatically from sendCustomGift when gift sent to seated member ──
export const addGiftContributionToPK = internalMutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
    userName: v.string(),
    coins: v.number(),
  },
  handler: async (ctx, args) => {
    const pk1 = await ctx.db.query("pkBattles")
      .withIndex("by_room1", (q) => q.eq("room1Id", args.roomId))
      .filter((q) => q.eq(q.field("status"), "active")).first();
    const pk2 = await ctx.db.query("pkBattles")
      .withIndex("by_room2", (q) => q.eq("room2Id", args.roomId))
      .filter((q) => q.eq(q.field("status"), "active")).first();
    const pk = pk1 ?? pk2;
    if (!pk) return null;

    const existing = await ctx.db.query("pkContributions")
      .withIndex("by_pk_room_user", (q) =>
        q.eq("pkId", pk._id).eq("roomId", args.roomId).eq("userId", args.userId)
      ).unique();

    if (existing) {
      await ctx.db.patch(existing._id, { coins: existing.coins + args.coins });
    } else {
      await ctx.db.insert("pkContributions", {
        pkId: pk._id, roomId: args.roomId,
        userId: args.userId, userName: args.userName,
        coins: args.coins, createdAt: Date.now(),
      });
    }

    if (pk.room1Id === args.roomId) {
      await ctx.db.patch(pk._id, { room1Coins: (pk.room1Coins ?? 0) + args.coins });
    } else {
      await ctx.db.patch(pk._id, { room2Coins: (pk.room2Coins ?? 0) + args.coins });
    }
    return null;
  },
});

export const sendPKChallenge = mutation({
  args: {
    challengerRoomId: v.id("rooms"),
    targetRoomId: v.id("rooms"),
    durationMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const challengerRoom = await ctx.db.get(args.challengerRoomId);
    if (!challengerRoom) throw new Error("الغرفة غير موجودة");
    const canSend = await isOwnerOrAdmin(ctx, args.challengerRoomId, userId);
    if (!canSend) throw new Error("فقط مالك الغرفة أو المشرف يمكنه إرسال تحدي PK");

    const targetRoom = await ctx.db.get(args.targetRoomId);
    if (!targetRoom) throw new Error("الغرفة المستهدفة غير موجودة");

    const existing = await ctx.db
      .query("pkBattles")
      .withIndex("by_room1", (q) => q.eq("room1Id", args.challengerRoomId))
      .filter((q) => q.neq(q.field("status"), "finished"))
      .filter((q) => q.neq(q.field("status"), "declined"))
      .first();
    if (existing) throw new Error("لديك تحدي PK نشط بالفعل");

    const existing2 = await ctx.db
      .query("pkBattles")
      .withIndex("by_room2", (q) => q.eq("room2Id", args.challengerRoomId))
      .filter((q) => q.neq(q.field("status"), "finished"))
      .filter((q) => q.neq(q.field("status"), "declined"))
      .first();
    if (existing2) throw new Error("غرفتك في تحدي PK بالفعل");

    const challengerProfileCandidates = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(1);
    const challengerProfile = challengerProfileCandidates[0];

    const targetOwnerProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", targetRoom.ownerId))
      .unique();

    const pkId = await ctx.db.insert("pkBattles", {
      room1Id: args.challengerRoomId,
      room2Id: args.targetRoomId,
      room1Name: challengerRoom.name,
      room2Name: targetRoom.name,
      room1OwnerId: userId,
      room2OwnerId: targetRoom.ownerId,
      room1OwnerName: challengerProfile?.name ?? "مجهول",
      room2OwnerName: targetOwnerProfile?.name ?? "مجهول",
      room1Coins: 0,
      room2Coins: 0,
      status: "pending",
      durationMinutes: args.durationMinutes,
      createdAt: Date.now(),
    });

    const ready1 = await ctx.db
      .query("pkReadyRooms")
      .withIndex("by_room", (q) => q.eq("roomId", args.challengerRoomId))
      .first();
    if (ready1) await ctx.db.delete(ready1._id);

    const ready2 = await ctx.db
      .query("pkReadyRooms")
      .withIndex("by_room", (q) => q.eq("roomId", args.targetRoomId))
      .first();
    if (ready2) await ctx.db.delete(ready2._id);

    return pkId;
  },
});

export const acceptPKChallenge = mutation({
  args: { pkId: v.id("pkBattles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const pk = await ctx.db.get(args.pkId);
    if (!pk) throw new Error("التحدي غير موجود");
    const canAccept = await isOwnerOrAdmin(ctx, pk.room2Id, userId);
    if (!canAccept) throw new Error("فقط مالك الغرفة المستهدفة أو مشرفها يمكنه قبول التحدي");
    if (pk.status !== "pending") throw new Error("التحدي لم يعد في انتظار القبول");

    const now = Date.now();
    const endsAt = now + pk.durationMinutes * 60 * 1000;

    await ctx.db.patch(args.pkId, { status: "active", startedAt: now, endsAt });

    await ctx.scheduler.runAfter(
      pk.durationMinutes * 60 * 1000,
      internal.pk.finishPKBattle,
      { pkId: args.pkId }
    );

    return { endsAt };
  },
});

export const declinePKChallenge = mutation({
  args: { pkId: v.id("pkBattles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const pk = await ctx.db.get(args.pkId);
    if (!pk) throw new Error("التحدي غير موجود");
    const canDecline =
      (await isOwnerOrAdmin(ctx, pk.room2Id, userId)) ||
      (await isOwnerOrAdmin(ctx, pk.room1Id, userId));
    if (!canDecline) throw new Error("غير مصرح");
    if (pk.status !== "pending") throw new Error("التحدي لم يعد في انتظار القبول");

    await ctx.db.patch(args.pkId, { status: "declined" });
    return null;
  },
});

export const finishPKBattle = internalMutation({
  args: { pkId: v.id("pkBattles") },
  handler: async (ctx, args) => {
    const pk = await ctx.db.get(args.pkId);
    if (!pk || pk.status !== "active") return null;

    let winnerId: any = undefined;
    if (pk.room1Coins > pk.room2Coins) winnerId = pk.room1Id;
    else if (pk.room2Coins > pk.room1Coins) winnerId = pk.room2Id;

    await ctx.db.patch(args.pkId, { status: "finished", winnerId });
    return null;
  },
});

export const endPKBattleEarly = mutation({
  args: { pkId: v.id("pkBattles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const pk = await ctx.db.get(args.pkId);
    if (!pk) throw new Error("المعركة غير موجودة");
    if (pk.room1OwnerId !== userId && pk.room2OwnerId !== userId) {
      const canEnd1 = await isOwnerOrAdmin(ctx, pk.room1Id, userId);
      const canEnd2 = await isOwnerOrAdmin(ctx, pk.room2Id, userId);
      if (!canEnd1 && !canEnd2) throw new Error("فقط مالك الغرفة أو المشرف يمكنه إنهاء المعركة");
    }
    if (pk.status !== "active") throw new Error("المعركة غير نشطة");

    let winnerId: any = undefined;
    if (pk.room1Coins > pk.room2Coins) winnerId = pk.room1Id;
    else if (pk.room2Coins > pk.room1Coins) winnerId = pk.room2Id;

    await ctx.db.patch(args.pkId, { status: "finished", winnerId });
    return null;
  },
});

export const getActivePKBattle = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const asRoom1 = await ctx.db
      .query("pkBattles")
      .withIndex("by_room1", (q) => q.eq("room1Id", args.roomId))
      .filter((q) =>
        q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "active"))
      )
      .first();
    if (asRoom1) return asRoom1;

    const asRoom2 = await ctx.db
      .query("pkBattles")
      .withIndex("by_room2", (q) => q.eq("room2Id", args.roomId))
      .filter((q) =>
        q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "active"))
      )
      .first();
    return asRoom2 ?? null;
  },
});

export const getPKBattle = query({
  args: { pkId: v.id("pkBattles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.pkId);
  },
});

export const getLastFinishedPKBattle = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const tenMinsAgo = Date.now() - 10 * 60 * 1000;
    const r1 = await ctx.db.query("pkBattles")
      .withIndex("by_room1", (q) => q.eq("room1Id", args.roomId))
      .filter((q) => q.eq(q.field("status"), "finished"))
      .order("desc").first();
    const r2 = await ctx.db.query("pkBattles")
      .withIndex("by_room2", (q) => q.eq("room2Id", args.roomId))
      .filter((q) => q.eq(q.field("status"), "finished"))
      .order("desc").first();
    const cands = [r1, r2].filter(Boolean) as any[];
    cands.sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0));
    const latest = cands[0];
    if (!latest) return null;
    if (latest._creationTime < tenMinsAgo) return null;
    return latest;
  },
});

export const getPKContributors = query({
  args: { pkId: v.id("pkBattles"), roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const contribs = await ctx.db
      .query("pkContributions")
      .withIndex("by_pk_and_room", (q) =>
        q.eq("pkId", args.pkId).eq("roomId", args.roomId)
      )
      .collect();
    return contribs.sort((a, b) => b.coins - a.coins).slice(0, 20);
  },
});

export const getRecentPKBattles = query({
  args: { roomId: v.id("rooms"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const asRoom1 = await ctx.db
      .query("pkBattles")
      .withIndex("by_room1", (q) => q.eq("room1Id", args.roomId))
      .filter((q) => q.eq(q.field("status"), "finished"))
      .order("desc")
      .take(limit);
    const asRoom2 = await ctx.db
      .query("pkBattles")
      .withIndex("by_room2", (q) => q.eq("room2Id", args.roomId))
      .filter((q) => q.eq(q.field("status"), "finished"))
      .order("desc")
      .take(limit);
    const all = [...asRoom1, ...asRoom2];
    all.sort((a, b) => b.createdAt - a.createdAt);
    return all.slice(0, limit);
  },
});

export const getAvailableRoomsForPK = query({
  args: { excludeRoomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .take(50);

    const filtered = rooms.filter((r) => r._id !== args.excludeRoomId);

    const activePKs = await ctx.db
      .query("pkBattles")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    const pendingPKs = await ctx.db
      .query("pkBattles")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const busyRoomIds = new Set<string>();
    for (const pk of [...activePKs, ...pendingPKs]) {
      busyRoomIds.add(pk.room1Id);
      busyRoomIds.add(pk.room2Id);
    }

    return filtered.filter((r) => !busyRoomIds.has(r._id));
  },
});

export const declareReadyForPK = mutation({
  args: {
    roomId: v.id("rooms"),
    durationMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const canDeclare = await isOwnerOrAdmin(ctx, args.roomId, userId);
    if (!canDeclare) throw new Error("فقط مالك الغرفة أو المشرف يمكنه الإعلان");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    const existing = await ctx.db
      .query("pkReadyRooms")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .first();
    if (existing) await ctx.db.delete(existing._id);

    const expiresAt = Date.now() + 10 * 60 * 1000;
    await ctx.db.insert("pkReadyRooms", {
      roomId: args.roomId,
      roomName: room.name,
      roomCoverUrl: room.coverUrl,
      ownerId: userId,
      ownerName: profile?.name ?? "مجهول",
      memberCount: room.memberCount,
      durationMinutes: args.durationMinutes,
      expiresAt,
      createdAt: Date.now(),
    });

    return null;
  },
});

export const cancelReadyForPK = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const existing = await ctx.db
      .query("pkReadyRooms")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .first();
    if (existing) await ctx.db.delete(existing._id);
    return null;
  },
});

export const getReadyRoomsForPK = query({
  args: { excludeRoomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const readyRooms = await ctx.db.query("pkReadyRooms").collect();

    const valid = readyRooms.filter(
      (r) => r.expiresAt > now && r.roomId !== args.excludeRoomId
    );

    const activePKs = await ctx.db
      .query("pkBattles")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    const pendingPKs = await ctx.db
      .query("pkBattles")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const busyRoomIds = new Set<string>();
    for (const pk of [...activePKs, ...pendingPKs]) {
      busyRoomIds.add(pk.room1Id);
      busyRoomIds.add(pk.room2Id);
    }

    return valid.filter((r) => !busyRoomIds.has(r.roomId));
  },
});

export const getMyReadyStatus = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ready = await ctx.db
      .query("pkReadyRooms")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .first();
    if (!ready || ready.expiresAt <= now) return null;
    return ready;
  },
});
