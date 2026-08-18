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
    .unique();
  return !!adm;
}

// إنشاء تحدي مقاعد جديد (setup)
export const createSeatBattle = mutation({
  args: {
    roomId: v.id("rooms"),
    durationMinutes: v.number(),
    lionTeam: v.array(v.id("users")),
    tigerTeam: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const canManage = await isOwnerOrAdmin(ctx, args.roomId, userId);
    if (!canManage) throw new Error("فقط مالك الغرفة أو المشرف يمكنه إنشاء تحدي");

    if (args.lionTeam.length === 0 || args.tigerTeam.length === 0) {
      throw new Error("يجب أن يكون في كل فريق عضو واحد على الأقل");
    }

    // إنهاء أي تحدي نشط
    const existing = await ctx.db
      .query("seatBattles")
      .withIndex("by_room", (q: any) => q.eq("roomId", args.roomId))
      .filter((q: any) => q.neq(q.field("status"), "finished"))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { status: "finished" });
    }

    const now = Date.now();
    const endsAt = now + args.durationMinutes * 60 * 1000;

    const battleId = await ctx.db.insert("seatBattles", {
      roomId: args.roomId,
      hostId: userId,
      status: "active",
      durationMinutes: args.durationMinutes,
      lionTeam: args.lionTeam,
      tigerTeam: args.tigerTeam,
      lionCoins: 0,
      tigerCoins: 0,
      startedAt: now,
      endsAt,
      createdAt: now,
    });

    await ctx.scheduler.runAfter(
      args.durationMinutes * 60 * 1000,
      internal.seatBattle.finishSeatBattle,
      { battleId }
    );

    return battleId;
  },
});

// المساهمة في تحدي المقاعد
export const contributeToSeatBattle = mutation({
  args: {
    battleId: v.id("seatBattles"),
    team: v.union(v.literal("lion"), v.literal("tiger")),
    coins: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    if (args.coins <= 0) throw new Error("يجب أن تكون العملات أكبر من صفر");

    const battle = await ctx.db.get(args.battleId);
    if (!battle) throw new Error("التحدي غير موجود");
    if (battle.status !== "active") throw new Error("التحدي غير نشط");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    if ((profile.goldCoins ?? 0) < args.coins) throw new Error("رصيدك غير كافٍ");

    await ctx.db.patch(profile._id, { goldCoins: (profile.goldCoins ?? 0) - args.coins });

    const existing = await ctx.db
      .query("seatBattleContributions")
      .withIndex("by_battle_and_user", (q: any) =>
        q.eq("battleId", args.battleId).eq("userId", userId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { coins: existing.coins + args.coins });
    } else {
      await ctx.db.insert("seatBattleContributions", {
        battleId: args.battleId,
        userId,
        team: args.team,
        coins: args.coins,
        createdAt: Date.now(),
      });
    }

    if (args.team === "lion") {
      await ctx.db.patch(args.battleId, { lionCoins: battle.lionCoins + args.coins });
    } else {
      await ctx.db.patch(args.battleId, { tigerCoins: battle.tigerCoins + args.coins });
    }

    return null;
  },
});

// إنهاء التحدي مبكراً
export const endSeatBattleEarly = mutation({
  args: { battleId: v.id("seatBattles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const battle = await ctx.db.get(args.battleId);
    if (!battle) throw new Error("التحدي غير موجود");

    const canManage = await isOwnerOrAdmin(ctx, battle.roomId, userId);
    if (!canManage) throw new Error("فقط مالك الغرفة أو المشرف يمكنه إنهاء التحدي");
    if (battle.status !== "active") throw new Error("التحدي غير نشط");

    let winnerTeam: "lion" | "tiger" | undefined;
    if (battle.lionCoins > battle.tigerCoins) winnerTeam = "lion";
    else if (battle.tigerCoins > battle.lionCoins) winnerTeam = "tiger";

    await ctx.db.patch(args.battleId, { status: "finished", winnerTeam });
    return null;
  },
});

// إنهاء تلقائي
export const finishSeatBattle = internalMutation({
  args: { battleId: v.id("seatBattles") },
  handler: async (ctx, args) => {
    const battle = await ctx.db.get(args.battleId);
    if (!battle || battle.status !== "active") return null;

    let winnerTeam: "lion" | "tiger" | undefined;
    if (battle.lionCoins > battle.tigerCoins) winnerTeam = "lion";
    else if (battle.tigerCoins > battle.lionCoins) winnerTeam = "tiger";

    await ctx.db.patch(args.battleId, { status: "finished", winnerTeam });
    return null;
  },
});

// جلب التحدي النشط في الغرفة
export const getActiveSeatBattle = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const battle = await ctx.db
      .query("seatBattles")
      .withIndex("by_room", (q: any) => q.eq("roomId", args.roomId))
      .filter((q: any) => q.neq(q.field("status"), "finished"))
      .first();
    return battle ?? null;
  },
});

// جلب المساهمين
export const getSeatBattleContributions = query({
  args: { battleId: v.id("seatBattles") },
  handler: async (ctx, args) => {
    const contribs = await ctx.db
      .query("seatBattleContributions")
      .withIndex("by_battle", (q: any) => q.eq("battleId", args.battleId))
      .collect();

    const withProfiles = await Promise.all(
      contribs.map(async (c) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q: any) => q.eq("userId", c.userId))
          .unique();
        return { ...c, userName: profile?.name ?? "مجهول", avatarUrl: profile?.avatarUrl };
      })
    );

    return withProfiles.sort((a, b) => b.coins - a.coins);
  },
});

// جلب أعضاء الغرفة على المقاعد مع بياناتهم
export const getSeatedMembersForBattle = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q: any) => q.eq("roomId", args.roomId))
      .collect();

    const seated = members.filter((m) => m.seatIndex !== undefined && m.seatIndex !== null);

    const withProfiles = await Promise.all(
      seated.map(async (m) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q: any) => q.eq("userId", m.userId))
          .unique();
        return {
          userId: m.userId,
          seatIndex: m.seatIndex,
          name: profile?.name ?? "مجهول",
          avatarUrl: profile?.avatarUrl,
        };
      })
    );

    return withProfiles;
  },
});
