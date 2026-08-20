// @ts-nocheck
import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

function calcLevelWealth(totalCoins: number): number {
  if (totalCoins < 200) return 0;
  let level = 0;
  let required = 200;
  let cumulative = 0;
  for (let i = 1; i <= 500; i++) {
    cumulative += required;
    if (totalCoins >= cumulative) level = i;
    else break;
    required = Math.floor(required * 2);
  }
  return level;
}

function calcLevelCharisma(totalCoins: number): number {
  if (totalCoins < 200) return 0;
  let level = 0;
  let required = 200;
  let cumulative = 0;
  for (let i = 1; i <= 500; i++) {
    cumulative += required;
    if (totalCoins >= cumulative) level = i;
    else break;
    required = Math.floor(required * 4);
  }
  return level;
}

const ROOM_ID_START = 548551239;

async function generateRoomNumericId(ctx: any): Promise<string> {
  const allRooms = await ctx.db.query("rooms").collect();
  const nextNum = ROOM_ID_START + allRooms.length;
  return String(nextNum).substring(0, 9);
}

function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

// ── مساعد: جلب URL من storage فقط إذا لم يكن موجوداً ──
async function resolveUrl(ctx: any, storedUrl: string | undefined, storageId: any): Promise<string | undefined> {
  if (storedUrl) return storedUrl;
  if (storageId) return (await ctx.storage.getUrl(storageId)) ?? undefined;
  return undefined;
}

export const listRooms = query({
  args: { country: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // تحديد بـ 150 غرفة فقط لتجنب الثقل
    let rooms;
    if (args.country && args.country !== "all") {
      rooms = await ctx.db.query("rooms").withIndex("by_country", (q) => q.eq("country", args.country!)).order("desc").take(150);
    } else {
      rooms = await ctx.db.query("rooms").order("desc").take(150);
    }
    const today = getTodayDateString();
    const result = await Promise.all(rooms.map(async (room) => {
      const ownerProfileCandidates = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", room.ownerId)).order("desc").take(1);
      const ownerProfile = ownerProfileCandidates[0];
      const coverUrl = await resolveUrl(ctx, room.coverUrl, room.coverStorageId);
      const bgImageUrl = await resolveUrl(ctx, room.bgImageUrl, room.bgStorageId);
      const ownerAvatarUrl = await resolveUrl(ctx, ownerProfile?.avatarUrl, ownerProfile?.avatarStorageId);
      const todayCoins = room.todayCoinsDate === today ? (room.todayCoins ?? 0) : 0;
      return {
        ...room, coverUrl, bgImageUrl,
        ownerName: ownerProfile?.name ?? "مجهول",
        ownerIsVip: ownerProfile?.isVip ?? false,
        ownerVipLevel: ownerProfile?.vipLevel ?? 0,
        ownerAvatarUrl,
        ownerAristocracyLevel: ownerProfile?.aristocracyLevel ?? 0,
        todayCoins,
      };
    }));
    const pinned = result.filter((r) => r.isPinned).sort((a, b) => (a.pinnedOrder ?? 99) - (b.pinnedOrder ?? 99));
    const rest = result.filter((r) => !r.isPinned).sort((a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0));
    return [...pinned, ...rest];
  },
});

export const getMyRoom = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.query("rooms").withIndex("by_owner", (q) => q.eq("ownerId", userId)).first() ?? null;
  },
});

export const getFeaturedRooms = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("rooms").withIndex("by_featured", (q) => q.eq("isFeatured", true)).collect();
  },
});

export const getRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return null;
    const ownerProfileCandidates = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", room.ownerId)).order("desc").take(1);
    const ownerProfile = ownerProfileCandidates[0];
    const coverUrl = await resolveUrl(ctx, room.coverUrl, room.coverStorageId);
    const bgImageUrl = await resolveUrl(ctx, room.bgImageUrl, room.bgStorageId);
    return { ...room, coverUrl, bgImageUrl, ownerName: ownerProfile?.name ?? "مجهول", ownerIsVip: ownerProfile?.isVip ?? false };
  },
});

export const getRoomByNumericId = query({
  args: { roomNumericId: v.string() },
  handler: async (ctx, args) => {
    // تحديد بـ 500 بدلاً من collect() الكامل
    const rooms = await ctx.db.query("rooms").take(500);
    const room = rooms.find((r) => r.roomNumericId === args.roomNumericId);
    if (!room) return null;
    return { _id: room._id, name: room.name, roomNumericId: room.roomNumericId };
  },
});

export const generateRoomCoverUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    return await ctx.storage.generateUploadUrl();
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    return await ctx.storage.generateUploadUrl();
  },
});

export const createRoom = mutation({
  args: {
    name: v.string(), description: v.optional(v.string()), country: v.string(),
    coverUrl: v.optional(v.string()), coverStorageId: v.optional(v.id("_storage")),
    tags: v.optional(v.array(v.string())), roomTheme: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("يجب إنشاء ملف شخصي أولاً");
    const existingRoom = await ctx.db.query("rooms").withIndex("by_owner", (q) => q.eq("ownerId", userId)).first();
    if (existingRoom) throw new Error("لديك غرفة بالفعل. يمكنك امتلاك غرفة واحدة فقط");
    const roomNumericId = await generateRoomNumericId(ctx);
    const roomId = await ctx.db.insert("rooms", {
      name: args.name, description: args.description, ownerId: userId,
      country: args.country, coverUrl: args.coverUrl, coverStorageId: args.coverStorageId,
      isLive: true, memberCount: 1, maxSeats: 8, isFeatured: false,
      tags: args.tags, roomNumericId, totalCoinsSpent: 0,
      roomTheme: args.roomTheme, createdAt: Date.now(),
    });
    const now = Date.now();
    await ctx.db.insert("roomMembers", { roomId, userId, role: "owner", isMuted: false, seatIndex: 0, isPaidMember: true, membershipJoinedAt: now, membershipPricePaid: 0, joinedAt: now });
    // المالك عضو ومتابع تلقائياً منذ لحظة الإنشاء، ولا يحتاج إلى الضغط على متابعة أو انضمام.
    const existingFollower = await ctx.db.query("roomFollowers")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", roomId).eq("userId", userId))
      .unique();
    if (!existingFollower) {
      await ctx.db.insert("roomFollowers", { roomId, userId, createdAt: now });
    }
    await ctx.db.insert("messages", { roomId, senderId: userId, content: "مرحباً بكم في ساكي شات 🎉 نتمنى لكم وقتاً ممتعاً 💜", type: "system", createdAt: now });
    return roomId;
  },
});

export const updateRoom = mutation({
  args: {
    roomId: v.id("rooms"), name: v.optional(v.string()), description: v.optional(v.string()),
    country: v.optional(v.string()), coverUrl: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")), bgColor: v.optional(v.string()),
    bgStorageId: v.optional(v.id("_storage")),     maxSeats: v.optional(v.number()),
    roomTheme: v.optional(v.string()),
    bgPresetKey: v.optional(v.string()),
    removeBg: v.optional(v.boolean()),
    hideRoyalSeats: v.optional(v.boolean()),
    footballStreamUrl: v.optional(v.string()),
    micPermission: v.optional(v.string()),
    seatPermission: v.optional(v.string()),
    membershipPrice: v.optional(v.number()),
    roomDecorationStyle: v.optional(v.string()),
    seatLayoutStyle: v.optional(v.string()),
    hostSeatCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    if (room.ownerId !== userId) throw new Error("ليس لديك صلاحية");
    const patch: any = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.description !== undefined) patch.description = args.description;
    if (args.country !== undefined) patch.country = args.country;
    if (args.coverUrl !== undefined) patch.coverUrl = args.coverUrl;
    if (args.coverStorageId !== undefined) patch.coverStorageId = args.coverStorageId;
    if (args.bgColor !== undefined) { patch.bgColor = args.bgColor; patch.bgStorageId = undefined; patch.bgImageUrl = undefined; patch.bgPresetKey = undefined; }
    if (args.bgStorageId !== undefined) {
      const bgUrl = await ctx.storage.getUrl(args.bgStorageId);
      patch.bgStorageId = args.bgStorageId; patch.bgImageUrl = bgUrl ?? undefined; patch.bgColor = undefined; patch.bgPresetKey = undefined;
    }
    if (args.bgPresetKey !== undefined) {
      patch.bgPresetKey = args.bgPresetKey || undefined;
      patch.bgStorageId = undefined; patch.bgImageUrl = undefined; patch.bgColor = undefined;
    }
    if (args.removeBg) {
      patch.bgStorageId = undefined; patch.bgImageUrl = undefined; patch.bgColor = undefined; patch.bgPresetKey = undefined;
    }
    if (args.maxSeats !== undefined) {
      if (!Number.isInteger(args.maxSeats) || args.maxSeats < 2 || args.maxSeats > 22) throw new Error("عدد المقاعد يجب أن يكون بين 2 و22");
      patch.maxSeats = args.maxSeats;
    }
    if (args.roomTheme !== undefined) patch.roomTheme = args.roomTheme === "" ? undefined : args.roomTheme;
    if (args.hideRoyalSeats !== undefined) patch.hideRoyalSeats = args.hideRoyalSeats;
    if (args.footballStreamUrl !== undefined) patch.footballStreamUrl = args.footballStreamUrl || undefined;
    if (args.micPermission !== undefined) patch.micPermission = args.micPermission;
    if (args.seatPermission !== undefined) {
      if (!["all", "members", "admins"].includes(args.seatPermission)) throw new Error("صلاحية المقاعد غير صحيحة");
      patch.seatPermission = args.seatPermission;
    }
    if (args.membershipPrice !== undefined) patch.membershipPrice = args.membershipPrice;
    if (args.roomDecorationStyle !== undefined) patch.roomDecorationStyle = args.roomDecorationStyle;
    if (args.seatLayoutStyle !== undefined) {
      if (!["royal_pairs", "legacy"].includes(args.seatLayoutStyle)) throw new Error("نمط المقاعد غير صحيح");
      patch.seatLayoutStyle = args.seatLayoutStyle;
    }
    if (args.hostSeatCount !== undefined) {
      if (!Number.isInteger(args.hostSeatCount) || args.hostSeatCount < 0 || args.hostSeatCount > 2) throw new Error("عدد مقاعد المضيفين يجب أن يكون بين 0 و2");
      if ((args.maxSeats ?? room.maxSeats ?? 8) < args.hostSeatCount + 1) throw new Error("عدد المقاعد لا يكفي لمقعد المالك والمضيفين");
      patch.hostSeatCount = args.hostSeatCount;
    }
    await ctx.db.patch(args.roomId, patch);
    await ctx.scheduler.runAfter(0, internal.roomLogs.createLog, {
      roomId: args.roomId, userId, action: "update_room", details: "تحديث إعدادات الغرفة"
    });
  },
});

export const setRoomLock = mutation({
  args: { roomId: v.id("rooms"), password: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const room = await ctx.db.get(args.roomId);
    if (!room || room.ownerId !== userId) throw new Error("فقط المالك يمكنه قفل الغرفة");
    if (args.password) {
      if (!/^\d{4}$/.test(args.password)) throw new Error("كلمة المرور يجب أن تكون 4 أرقام");
      await ctx.db.patch(args.roomId, { isLocked: true, roomPassword: args.password });
    } else {
      await ctx.db.patch(args.roomId, { isLocked: false, roomPassword: undefined });
    }
    await ctx.scheduler.runAfter(0, internal.roomLogs.createLog, {
      roomId: args.roomId, userId, action: args.password ? "lock_room" : "unlock_room"
    });
  },
});

export const verifyRoomPassword = mutation({
  args: { roomId: v.id("rooms"), password: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    return room.roomPassword === args.password;
  },
});

export const deleteRoom = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    if (room.ownerId !== userId) throw new Error("ليس لديك صلاحية");
    const members = await ctx.db.query("roomMembers").withIndex("by_room", (q) => q.eq("roomId", args.roomId)).collect();
    for (const m of members) await ctx.db.delete(m._id);
    await ctx.db.delete(args.roomId);
  },
});

export const joinRoom = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    const isRoomOwner = room.ownerId === userId;
    if (!isRoomOwner) {
      const now = Date.now();
      const banCandidates = await ctx.db.query("roomBans")
        .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", userId))
        .order("desc")
        .take(20);
      const ban = banCandidates.find((candidate) => !candidate.banExpiresAt || candidate.banExpiresAt > now);
      if (ban) throw new Error("BANNED");
      const kickCandidates = await ctx.db.query("roomKicks")
        .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", userId))
        .order("desc")
        .take(20);
      const kick = kickCandidates.find((candidate) => !candidate.kickExpiresAt || candidate.kickExpiresAt > now);
      if (kick) throw new Error("KICKED");
    }
    const membershipPrice = Math.max(0, Number((room as any).membershipPrice ?? 0));
    const memberCandidates = await ctx.db.query("roomMembers")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", userId))
      .order("desc")
      .take(20);
    const existingMember = memberCandidates[0];
    if (existingMember) {
      // Refresh the last successful entry time for Home > My Rooms > Recent.
      await ctx.db.patch(existingMember._id, { joinedAt: Date.now() });
      if (isRoomOwner && existingMember.role !== "owner") {
        await ctx.db.patch(existingMember._id, { role: "owner", isPaidMember: true, membershipJoinedAt: existingMember.membershipJoinedAt ?? Date.now() });
      } else if (!isRoomOwner && membershipPrice === 0 && existingMember.isPaidMember !== true) {
        await ctx.db.patch(existingMember._id, { isPaidMember: true, membershipJoinedAt: existingMember.membershipJoinedAt ?? Date.now(), membershipPricePaid: 0 });
      } else if (!isRoomOwner && existingMember.role !== "admin") {
        const permAdmin = await ctx.db.query("roomAdmins")
          .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", userId))
          .unique();
        if (permAdmin && existingMember.role !== "admin") {
          await ctx.db.patch(existingMember._id, { role: "admin" });
        }
      }
      // المستخدم الموجود مسبقًا قد يدخل الغرفة مرة أخرى. نعيد إطلاق الدخولية
      // من الحقيبة عند كل استدعاء دخول فعلي، مع حماية الشريط من التكرار داخل نفس الحدث.
      const existingProfile = await ctx.db.query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .order("desc")
        .take(1);
      const profile = existingProfile[0];
      if (profile?.activeEntryId) {
        await ctx.scheduler.runAfter(0, internal.entryEffects.fireEntryEvent, {
          roomId: args.roomId,
          userId,
          profileId: profile._id,
        });
      }
      return null;
    }
    const permanentAdmin = await ctx.db.query("roomAdmins")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", userId))
      .order("desc")
      .first();
    const role = isRoomOwner ? "owner" : (permanentAdmin ? "admin" : "member");
    await ctx.db.insert("roomMembers", {
      roomId: args.roomId, userId, role, isMuted: false, joinedAt: Date.now(),
      isPaidMember: isRoomOwner || membershipPrice === 0,
      membershipJoinedAt: isRoomOwner || membershipPrice === 0 ? Date.now() : undefined,
      membershipPricePaid: isRoomOwner || membershipPrice === 0 ? 0 : undefined,
    });
    await ctx.db.patch(args.roomId, { memberCount: (room.memberCount ?? 0) + 1 });
    const profileCandidates = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).order("desc").take(1);
    const profile = profileCandidates[0];
    if (profile && !profile.hideRoomPresence) {
      await ctx.db.insert("messages", { roomId: args.roomId, senderId: userId, content: "مرحبا بكم في ساكي ، نود إعلامكم أنه سیتم حظر\nأي محتوی غير لائق. نرجو أن يحترم كل منا الآخر\nوالاستمتاع!", type: "join", createdAt: Date.now() });
    }
    if (profile?.activeEntryId) {
      await ctx.scheduler.runAfter(0, internal.entryEffects.fireEntryEvent, { roomId: args.roomId, userId, profileId: profile._id });
    }
    return null;
  },
});

export const purchaseRoomMembership = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");

    const price = Math.max(0, Math.floor(Number((room as any).membershipPrice ?? 0)));
    const existingMember = await ctx.db.query("roomMembers")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", userId))
      .unique();
    const isOwner = room.ownerId === userId || existingMember?.role === "owner";
    const isAdmin = existingMember?.role === "admin" || existingMember?.role === "super_admin";

    if (isOwner || isAdmin) {
      if (existingMember && existingMember.isPaidMember !== true) {
        await ctx.db.patch(existingMember._id, { isPaidMember: true, membershipJoinedAt: existingMember.membershipJoinedAt ?? Date.now(), membershipPricePaid: 0 });
      }
      return { success: true, alreadyMember: true, price: 0 };
    }
    if (existingMember?.isPaidMember === true) return { success: true, alreadyMember: true, price };

    const now = Date.now();
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    const balance = profile.goldCoins ?? 0;
    if (balance < price) throw new Error(`رصيدك غير كافٍ. تحتاج ${price.toLocaleString()} عملة ذهبية`);

    if (price > 0) {
      await ctx.db.patch(profile._id, { goldCoins: balance - price });
      const ownerProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", room.ownerId)).unique();
      if (ownerProfile) await ctx.db.patch(ownerProfile._id, { goldCoins: (ownerProfile.goldCoins ?? 0) + price });
    }
    if (existingMember) {
      await ctx.db.patch(existingMember._id, { isPaidMember: true, membershipJoinedAt: now, membershipPricePaid: price });
    } else {
      await ctx.db.insert("roomMembers", {
        roomId: args.roomId, userId, role: "member", isMuted: false, joinedAt: now,
        isPaidMember: true, membershipJoinedAt: now, membershipPricePaid: price,
      });
      await ctx.db.patch(args.roomId, { memberCount: (room.memberCount ?? 0) + 1 });
    }
    if (price > 0) {
      await ctx.db.insert("roomMembershipPayments", { roomId: args.roomId, userId, ownerId: room.ownerId, amount: price, createdAt: now });
    }
    return { success: true, alreadyMember: false, price, balance: balance - price };
  },
});

export const getRoomMembershipStatus = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const room = await ctx.db.get(args.roomId);
    if (!room) return null;
    const member = userId
      ? await ctx.db.query("roomMembers").withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", userId)).unique()
      : null;
    const isOwner = !!userId && room.ownerId === userId;
    const isAdmin = member?.role === "admin" || member?.role === "super_admin";
    return {
      isOwner,
      isAdmin,
      isMember: !!member,
      isPaidMember: isOwner || isAdmin || member?.isPaidMember === true,
      price: Math.max(0, Math.floor(Number((room as any).membershipPrice ?? 0))),
      goldCoins: userId ? ((await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique())?.goldCoins ?? 0) : 0,
    };
  },
});

export const leaveRoom = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const members = await ctx.db.query("roomMembers").withIndex("by_room", (q) => q.eq("roomId", args.roomId)).collect();
    const mine = members.find((m) => m.userId === userId);
    if (!mine) return;
    await ctx.db.delete(mine._id);
    const room = await ctx.db.get(args.roomId);
    if (room) await ctx.db.patch(args.roomId, { memberCount: Math.max(0, (room.memberCount ?? 1) - 1) });
  },
});

export const takeSeat = mutation({
  args: { roomId: v.id("rooms"), seatIndex: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    const members = await ctx.db.query("roomMembers").withIndex("by_room", (q) => q.eq("roomId", args.roomId)).collect();
    const mine = members.find((m) => m.userId === userId);
    if (!mine) throw new Error("لست عضواً");

    const isOwner = room.ownerId === userId || mine.role === "owner";
    const isAdmin = mine.role === "admin" || mine.role === "super_admin";
    const micPermission = (room as any).micPermission ?? "all";
    const seatPermission = (room as any).seatPermission ?? "all";
    if (seatPermission === "admins" && !isOwner && !isAdmin) {
      throw new Error("استخدام المقاعد متاح للمالك والمشرفين فقط");
    }
    if (seatPermission === "members" && !mine) {
      throw new Error("استخدام المقاعد متاح لأعضاء الغرفة فقط");
    }
    if (micPermission === "admins" && !isOwner && !isAdmin) {
      throw new Error("الصعود إلى المايك متاح للمالك والمشرفين فقط");
    }
    if (micPermission === "members" && !isOwner && !isAdmin && (room as any).membershipPrice > 0 && mine.isPaidMember !== true) {
      throw new Error("الصعود إلى المايك متاح لأعضاء الغرفة فقط. انضم إلى العضوية أولاً");
    }
    if (args.seatIndex < 0 && !isOwner && !isAdmin) {
      throw new Error("هذا المقعد مخصص للمالك والمشرفين");
    }
    const effectiveSeatLimit = (room as any).roomTheme === "royal" ? 22 : room.maxSeats;
    if (args.seatIndex >= 0 && effectiveSeatLimit !== undefined && args.seatIndex >= effectiveSeatLimit) {
      throw new Error("المقعد غير موجود في هذه الغرفة");
    }
    if (((room as any).lockedSeats ?? []).includes(args.seatIndex) && !isOwner && !isAdmin) {
      throw new Error("هذا المقعد مقفول");
    }

    const occupant = members.find((member) => member.userId !== userId && member.seatIndex === args.seatIndex);
    if (occupant) throw new Error("المقعد مشغول حالياً");
    await ctx.db.patch(mine._id, { seatIndex: args.seatIndex });
    await ctx.scheduler.runAfter(0, internal.roomLogs.createLog, {
      roomId: args.roomId, userId, action: "take_seat", details: `المقعد رقم ${args.seatIndex + 1}`
    });
    return null;
  },
});

export const leaveSeat = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const members = await ctx.db.query("roomMembers").withIndex("by_room", (q) => q.eq("roomId", args.roomId)).collect();
    const mine = members.find((m) => m.userId === userId);
    if (mine) {
      const oldSeat = mine.seatIndex;
      await ctx.db.patch(mine._id, { seatIndex: undefined });
      await ctx.scheduler.runAfter(0, internal.roomLogs.createLog, {
        roomId: args.roomId, userId, action: "leave_seat", details: oldSeat !== undefined ? `المقعد رقم ${oldSeat + 1}` : undefined
      });
    }
    return null;
  },
});

// Deprecated: local microphone state must never overwrite administrative mute.
// Administrative mute is changed only by muteMember after role validation.
export const updateMuteStatus = mutation({
  args: { roomId: v.id("rooms"), isMuted: v.boolean() },
  handler: async () => null,
});

export const kickMember = mutation({
  args: { roomId: v.id("rooms"), targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const target = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", args.targetUserId))
      .unique();
    if (target) await ctx.db.delete(target._id);
    return null;
  },
});

export const banMember = mutation({
  args: { roomId: v.id("rooms"), targetUserId: v.id("users") },
  handler: async () => null,
});

export const unbanMember = mutation({
  args: { roomId: v.id("rooms"), targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const bans = await ctx.db.query("roomBans").withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", args.targetUserId)).collect();
    for (const b of bans) await ctx.db.delete(b._id);
    return null;
  },
});

// Microphone mute is local-only. Keep this endpoint for backwards-compatible clients,
// but do not allow an owner or admin to change another user's local microphone state.
export const muteMember = mutation({
  args: { roomId: v.id("rooms"), targetUserId: v.id("users"), isMuted: v.boolean() },
  handler: async () => {
    throw new Error("كتم الميكروفون محلي فقط؛ يمكن للمستخدم كتم نفسه أو إلغاء الكتم بنفسه");
  },
});

export const muteChatMember = mutation({
  args: { roomId: v.id("rooms"), targetUserId: v.id("users"), isMuted: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const target = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", args.targetUserId))
      .unique();
    if (target) await ctx.db.patch(target._id, { isChatMuted: args.isMuted });
    await ctx.scheduler.runAfter(0, internal.roomLogs.createLog, {
      roomId: args.roomId, userId, targetUserId: args.targetUserId,
      action: args.isMuted ? "chat_mute" : "chat_unmute"
    });
    return null;
  },
});

export const setAdminRole = mutation({
  args: { roomId: v.id("rooms"), targetUserId: v.id("users"), isAdmin: v.boolean() },
  handler: async (ctx, args) => {
    const target = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", args.targetUserId))
      .unique();
    if (target) await ctx.db.patch(target._id, { role: args.isAdmin ? "admin" : "member" });
    const ex = await ctx.db.query("roomAdmins").withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", args.targetUserId)).unique();
    if (args.isAdmin) {
      if (!ex) await ctx.db.insert("roomAdmins", { roomId: args.roomId, userId: args.targetUserId, role: "admin", grantedAt: Date.now(), createdAt: Date.now() });
      else await ctx.db.patch(ex._id, { role: "admin", grantedAt: Date.now() });
    } else {
      if (ex) await ctx.db.delete(ex._id);
    }
    const userId = await getAuthUserId(ctx);
    if (userId) {
      await ctx.scheduler.runAfter(0, internal.roomLogs.createLog, {
        roomId: args.roomId, userId, targetUserId: args.targetUserId,
        action: args.isAdmin ? "grant_admin" : "revoke_admin"
      });
    }
    return null;
  },
});

function rollLuckMultiplier(): number | null {
  const r = Math.random() * 1000;
  if (r < 1)   return 1000;
  if (r < 4)   return 500;
  if (r < 9)   return 250;
  if (r < 29)  return 50;
  if (r < 79)  return 20;
  if (r < 159) return 10;
  if (r < 239) return 5;
  return null;
}

export const sendCustomGift = mutation({
  args: {
    roomId: v.id("rooms"),
    giftId: v.optional(v.id("customGifts")),
    customGiftId: v.optional(v.id("customGifts")),
    receiverId: v.id("users"),
    quantity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const resolvedId = args.giftId ?? args.customGiftId;
    if (!resolvedId) throw new Error("الهدية غير موجودة");
    const gift = await ctx.db.get(resolvedId);
    if (!gift) throw new Error("الهدية غير موجودة");
    const qty = args.quantity ?? 1;
    const total = gift.price * qty;
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile || (profile.goldCoins ?? 0) < total) throw new Error("رصيد غير كافٍ");
    const receiverProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.receiverId)).unique();
    const receiverName = receiverProfile?.name ?? "مستخدم";
    const senderAvatarUrl = await resolveUrl(ctx, profile.avatarUrl, profile.avatarStorageId);
    const receiverAvatarUrl = await resolveUrl(ctx, receiverProfile?.avatarUrl, receiverProfile?.avatarStorageId);
    let giftImageUrl: string | undefined;
    if (gift.thumbnailStorageId) giftImageUrl = await ctx.storage.getUrl(gift.thumbnailStorageId) ?? undefined;
    let videoUrl: string | undefined;
    if (gift.videoStorageId) videoUrl = await ctx.storage.getUrl(gift.videoStorageId) ?? undefined;
    let soundUrl: string | undefined;
    if (gift.soundStorageId) soundUrl = await ctx.storage.getUrl(gift.soundStorageId) ?? undefined;
    const isLuckGift = gift.category === "luck";
    const luckMultiplier = isLuckGift ? rollLuckMultiplier() : undefined;
    const luckWinAmount = isLuckGift && luckMultiplier ? gift.price * luckMultiplier : 0;
    await ctx.db.patch(profile._id, {
      goldCoins: (profile.goldCoins ?? 0) - total + luckWinAmount,
      totalCoinsSent: (profile.totalCoinsSent ?? 0) + total,
      wealthLevel: calcLevelWealth((profile.totalCoinsSent ?? 0) + total),
    });
    if (receiverProfile) {
      await ctx.db.patch(receiverProfile._id, {
        diamonds: (receiverProfile.diamonds ?? 0) + Math.floor(total * 0.7),
        totalCoinsReceived: (receiverProfile.totalCoinsReceived ?? 0) + total,
        charismaLevel: calcLevelCharisma((receiverProfile.totalCoinsReceived ?? 0) + total),
      });
      const rm = await ctx.db.query("hostAgencyMembers").withIndex("by_user",(q)=>q.eq("userId",args.receiverId)).unique();
      if(rm){const ad=Math.floor(total*0.7);await ctx.db.patch(rm._id,{totalDiamonds:(rm.totalDiamonds??0)+ad,pendingDiamonds:(rm.pendingDiamonds??0)+ad});const ag=await ctx.db.get(rm.agencyId);if(ag)await ctx.db.patch(ag._id,{totalDiamonds:(ag.totalDiamonds??0)+ad});}
    }
    const room = await ctx.db.get(args.roomId);
    if (room) {
      const today = getTodayDateString();
      const todayCoins = room.todayCoinsDate === today ? (room.todayCoins ?? 0) : 0;
      await ctx.db.patch(args.roomId, {
        totalCoinsSpent: (room.totalCoinsSpent ?? 0) + total,
        todayCoins: todayCoins + total,
        todayCoinsDate: today,
      });
    }
    await ctx.db.insert("gifts", {
      senderId: userId, receiverId: args.receiverId, roomId: args.roomId,
      giftType: "custom", giftName: gift.name, giftEmoji: "🎁",
      price: total, customGiftId: resolvedId, createdAt: Date.now(),
    });
    // Only a luck result of x1000+ creates a global flying banner.
    // All other gifts keep delivery, balance changes, and gift records without banners.
    const isGlobal = isLuckGift && (luckMultiplier ?? 0) >= 1000;
    const giftEmoji = isLuckGift ? "🍀" : "🎁";
    await ctx.db.insert("giftEvents", {
      roomId: args.roomId, senderId: userId, receiverId: args.receiverId,
      senderName: profile.name, receiverName,
      senderAvatarUrl, receiverAvatarUrl,
      giftName: gift.name, giftEmoji,
      giftImageUrl, videoUrl,
      customGiftId: resolvedId, price: total,
      showFullScreen: gift.showFullScreen,
      mediaType: gift.mediaType ?? "video",
      soundUrl, isGlobal,
      luckMultiplier: luckMultiplier || undefined,
      createdAt: Date.now(),
    });
    const msgContent = isLuckGift
      ? (luckMultiplier ? `أرسل هدية حظ ${gift.name} إلى ${receiverName} وربح ×${luckMultiplier}! 🍀` : `أرسل هدية حظ ${gift.name} إلى ${receiverName} 🍀`)
      : `أرسل هدية ${gift.name} إلى ${receiverName}`;
    await ctx.db.insert("messages", {
      roomId: args.roomId, senderId: userId,
      content: msgContent, type: "gift",
      giftName: gift.name, giftEmoji,
      giftImageUrl, giftQuantity: qty,
      luckMultiplier: luckMultiplier || undefined,
      luckWinAmount: isLuckGift ? luckWinAmount : undefined,
      receiverName, senderName: profile.name,
      senderAvatarUrl, createdAt: Date.now(),
    });
    if (isLuckGift) {
      await ctx.db.insert("messages", {
        roomId: args.roomId,
        senderId: userId,
        content: `نظام ساكي: أرسل ${profile.name} هدية حظ إلى ${receiverName}${luckMultiplier ? ` وربح ×${luckMultiplier}` : ""} 🍀`,
        type: "system",
        createdAt: Date.now(),
      });
    }
    await ctx.runMutation(internal.cpHome.recordRoomGiftForCp, {
      senderId: userId,
      receiverId: args.receiverId,
      coins: total,
      giftName: gift.name,
    });
    // تُحتسب فعالية النجم الأسبوعي فقط للهدية المنشورة ضمن فئة الفعاليات.
    if ((gift as any).category === "events" || (gift as any).giftCategory === "events") {
      await ctx.runMutation(internal.weeklyStar.internalRecordEventGift, {
        senderId: userId,
        senderName: profile.name,
        senderAvatarUrl: senderAvatarUrl,
        giftId: gift._id,
        qty,
        totalPrice: total,
      });
    }
    return isLuckGift ? { luckMultiplier, luckWinAmount } : null;
  },
});

const PERIODS: Record<string, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

export const getLeaderboard = query({
  args: { roomId: v.id("rooms"), period: v.string() },
  handler: async (ctx, args) => {
    const periodMs = PERIODS[args.period] ?? PERIODS.daily;
    const since = Date.now() - periodMs;

    // جلب آخر 500 حدث فقط بدلاً من collect() الكامل
    const events = await ctx.db
      .query("giftEvents")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(500);

    const filtered = events.filter((e) => e.createdAt >= since);

    const map: Record<string, { totalCoins: number; senderName: string; senderAvatarUrl?: string }> = {};
    for (const ev of filtered) {
      const id = ev.senderId as string;
      if (!map[id]) {
        map[id] = { totalCoins: 0, senderName: ev.senderName, senderAvatarUrl: ev.senderAvatarUrl };
      }
      map[id].totalCoins += ev.price;
    }

    const sorted = Object.entries(map)
      .sort((a, b) => b[1].totalCoins - a[1].totalCoins)
      .slice(0, 20); // تقليل من 50 إلى 20

    return await Promise.all(sorted.map(async ([userId, data], i) => {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId as any)).unique();
      const avatarUrl = await resolveUrl(ctx, data.senderAvatarUrl ?? profile?.avatarUrl, profile?.avatarStorageId);
      return {
        rank: i + 1, userId,
        name: profile?.name ?? data.senderName ?? "مجهول",
        avatarUrl,
        isVip: profile?.isVip ?? false,
        vipLevel: profile?.vipLevel,
        sakiId: profile?.sakiId ?? "",
        totalCoins: data.totalCoins,
      };
    }));
  },
});

export const clearChat = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    const isOwner = room.ownerId === userId;
    const adminRec = await ctx.db.query("roomAdmins")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", userId)).unique();
    const prof = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!isOwner && !adminRec && !prof?.isSuperAdmin)
      throw new Error("ليس لديك صلاحية مسح الدردشة");
    // حذف دفعة أولى ثم جدولة الباقي
    const batch = await ctx.db.query("messages")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId)).take(100);
    for (const m of batch) await ctx.db.delete(m._id);
    if (batch.length === 100) {
      await ctx.scheduler.runAfter(0, internal.rooms.clearChatBatch, { roomId: args.roomId });
    }
    return null;
  },
});

export const clearChatBatch = internalMutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const batch = await ctx.db.query("messages")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId)).take(100);
    for (const m of batch) await ctx.db.delete(m._id);
    if (batch.length === 100) {
      await ctx.scheduler.runAfter(0, internal.rooms.clearChatBatch, { roomId: args.roomId });
    }
    return null;
  },
});

export const createCustomGift = mutation({
  args: {
    name: v.string(), price: v.number(), videoStorageId: v.id("_storage"),
    thumbnailStorageId: v.optional(v.id("_storage")), soundStorageId: v.optional(v.id("_storage")),
    category: v.string(), mediaType: v.string(), showFullScreen: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    return await ctx.db.insert("customGifts", { ...args, creatorId: userId, createdAt: Date.now() });
  },
});

export const setYoutubeVideo = mutation({
  args: { roomId: v.id("rooms"), videoId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roomId, {
      youtubeVideoId: args.videoId,
      youtubeVideoStartedAt: args.videoId ? Date.now() : undefined,
      youtubeIsPlaying: !!args.videoId,
      youtubePosition: 0,
      youtubeIsMuted: false,
      youtubeVolume: 80,
    });
    return null;
  },
});

export const setCinemaVideo = mutation({
  args: { roomId: v.id("rooms"), videoUrl: v.optional(v.string()), videoType: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roomId, { youtubeVideoId: args.videoUrl ?? undefined });
    return null;
  },
});

export const getRoomBans = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db.query("roomBans").withIndex("by_room", (q) => q.eq("roomId", args.roomId)).collect();
  },
});

export const getRoomKicks = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db.query("roomKicks").withIndex("by_room", (q) => q.eq("roomId", args.roomId)).collect();
  },
});

export const getLatestGlobalGiftEvent = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("giftEvents").withIndex("by_global", (q) => q.eq("isGlobal", true)).order("desc").take(1);
    if (!events.length) return null;
    const ev = events[0];
    let videoUrl: string | null = null;
    if (ev.customGiftId) {
      const gift = await ctx.db.get(ev.customGiftId);
      if (gift?.videoStorageId) videoUrl = await ctx.storage.getUrl(gift.videoStorageId);
    }
    return { ...ev, videoUrl };
  },
});

export const getUserCurrentRoom = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const targetUserId = args.userId ?? await getAuthUserId(ctx);
    if (!targetUserId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", targetUserId))
      .order("desc")
      .first();
    if (!profile || profile.hideRoomPresence === true) return null;

    // roomMembers is removed by leaveRoom, so this represents the user's
    // current in-app room membership rather than a recently visited room.
    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .collect();
    memberships.sort((a, b) => b.joinedAt - a.joinedAt);

    for (const membership of memberships) {
      const room = await ctx.db.get(membership.roomId);
      if (!room) continue;
      const members = await ctx.db
        .query("roomMembers")
        .withIndex("by_room", (q) => q.eq("roomId", room._id))
        .collect();
      if (!members.some((member) => member.userId === targetUserId)) continue;

      const coverUrl = room.coverUrl ?? (room.coverStorageId ? await ctx.storage.getUrl(room.coverStorageId) : null);
      return {
        roomId: room._id,
        roomName: room.name,
        coverUrl,
        memberCount: members.length,
        isLive: room.isLive !== false,
      };
    }

    return null;
  },
});

export const getLatestEntryEvent = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("entryEffectEvents")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(1);
    if (!events.length) return null;
    return events[0];
  },
});

export const getLatestGiftEvent = query({
  args: { roomId: v.optional(v.id("rooms")) },
  handler: async (ctx, args) => {
    if (!args.roomId) return null;
    const events = await ctx.db.query("giftEvents").withIndex("by_room", (q) => q.eq("roomId", args.roomId)).order("desc").take(1);
    if (!events.length) return null;
    const ev = events[0];
    let videoUrl: string | null = ev.videoUrl ?? null;
    let svgaUrl: string | null = (ev as any).svgaUrl ?? null;
    let giftImageUrl = ev.giftImageUrl;
    let mediaType: string | undefined = (ev as any).mediaType;
    let soundUrl: string | null = (ev as any).soundUrl ?? null;
    if (ev.customGiftId) {
      const gift = await ctx.db.get(ev.customGiftId);
      if (gift?.videoStorageId && !videoUrl) videoUrl = await ctx.storage.getUrl(gift.videoStorageId);
      if ((gift as any)?.svgaStorageId && !svgaUrl) svgaUrl = await ctx.storage.getUrl((gift as any).svgaStorageId);
      if ((gift as any)?.soundStorageId && !soundUrl) soundUrl = await ctx.storage.getUrl((gift as any).soundStorageId);
      if (!mediaType) mediaType = (gift as any)?.mediaType ?? (svgaUrl ? "svga" : undefined);
      if (gift?.thumbnailStorageId && !giftImageUrl) {
        giftImageUrl = await ctx.storage.getUrl(gift.thumbnailStorageId) ?? undefined;
      }
      if (!giftImageUrl && gift?.mediaType !== "video" && videoUrl) giftImageUrl = videoUrl;
      if (!mediaType) mediaType = (gift as any)?.mediaType ?? (svgaUrl ? "svga" : undefined);
      if (gift?.soundStorageId && !soundUrl) soundUrl = await ctx.storage.getUrl(gift.soundStorageId);
    }
    let senderAvatarUrl = ev.senderAvatarUrl;
    if (!senderAvatarUrl) {
      const senderProfileCandidates = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", ev.senderId)).order("desc").take(1);
      const senderProfile = senderProfileCandidates[0];
      senderAvatarUrl = await resolveUrl(ctx, senderProfile?.avatarUrl, senderProfile?.avatarStorageId);
    }
    let receiverAvatarUrl = ev.receiverAvatarUrl;
    if (!receiverAvatarUrl) {
      const receiverProfileCandidates = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", ev.receiverId)).order("desc").take(1);
      const receiverProfile = receiverProfileCandidates[0];
      receiverAvatarUrl = await resolveUrl(ctx, receiverProfile?.avatarUrl, receiverProfile?.avatarStorageId);
    }
    return { ...ev, videoUrl, svgaUrl, giftImageUrl, senderAvatarUrl, receiverAvatarUrl, mediaType, soundUrl };
  },
});

export const setCustomGiftVisibility = mutation({
  args: { giftId: v.id("customGifts"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) throw new Error("هذه الميزة للمدير فقط");
    const gift = await ctx.db.get(args.giftId);
    if (!gift) throw new Error("الهدية غير موجودة");
    await ctx.db.patch(args.giftId, { isActive: args.isActive });
    return { ok: true };
  },
});

export const deleteCustomGift = mutation({
  args: { giftId: v.id("customGifts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) throw new Error("هذه الميزة للمدير فقط");
    const gift = await ctx.db.get(args.giftId);
    if (!gift) throw new Error("الهدية غير موجودة");
    await ctx.db.delete(args.giftId);
    return { ok: true };
  },
});

export const listAllCustomGiftsForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) return [];
    const gifts = await ctx.db.query("customGifts").order("desc").collect();
    return await Promise.all(gifts.map(async (gift) => {
      const videoUrl = gift.videoUrl ?? await ctx.storage.getUrl(gift.videoStorageId) ?? undefined;
      const thumbnailUrl = gift.thumbnailUrl ?? (gift.thumbnailStorageId ? await ctx.storage.getUrl(gift.thumbnailStorageId) ?? undefined : undefined);
      return { ...gift, videoUrl, thumbnailUrl };
    }));
  },
});

export const getCustomGifts = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let gifts;
    if (args.category) {
      gifts = await ctx.db.query("customGifts").withIndex("by_category", (q) => q.eq("category", args.category)).collect();
    } else {
      gifts = await ctx.db.query("customGifts").collect();
    }
    gifts = gifts.filter((gift) => gift.isActive !== false);
    return await Promise.all(gifts.map(async (gift) => {
      const videoUrl = await ctx.storage.getUrl(gift.videoStorageId);
      const thumbnailUrl = gift.thumbnailStorageId ? await ctx.storage.getUrl(gift.thumbnailStorageId) : null;
      return { ...gift, videoUrl, thumbnailUrl };
    }));
  },
});

const ROOM_REWARD_DEFAULTS = { enabled: true, giftRate: 0.7, membershipRate: 0.5, luckyRate: 1 };

function rewardDayKey(offset = 0): string {
  const date = new Date(Date.now() + offset * 86400000);
  return date.toISOString().slice(0, 10);
}

function rewardRateForPoints(points: number): number {
  if (points >= 1000000) return 0.07;
  if (points >= 500000) return 0.06;
  if (points >= 200000) return 0.05;
  if (points >= 50000) return 0.04;
  if (points >= 5000) return 0.03;
  if (points >= 100) return 0.025;
  return 0;
}

async function getRoomRewardSettings(ctx: any, roomId: any) {
  const stored = await ctx.db.query("roomRewardSettings").withIndex("by_room", (q: any) => q.eq("roomId", roomId)).unique();
  return stored ? {
    enabled: stored.enabled,
    giftRate: stored.giftRate,
    membershipRate: stored.membershipRate,
    luckyRate: stored.luckyRate,
  } : ROOM_REWARD_DEFAULTS;
}

async function calculateRoomReward(ctx: any, roomId: any, dayKey: string) {
  const start = new Date(`${dayKey}T00:00:00.000Z`).getTime();
  const end = start + 86400000;
  const settings = await getRoomRewardSettings(ctx, roomId);
  if (!settings.enabled) return { points: 0, rate: 0, amount: 0, settings };

  const giftEvents = await ctx.db.query("giftEvents")
    .withIndex("by_room", (q: any) => q.eq("roomId", roomId))
    .order("desc")
    .take(500);
  let points = 0;
  for (const event of giftEvents) {
    if (event.createdAt < start || event.createdAt >= end) continue;
    const quantity = Math.max(1, event.quantity ?? 1);
    const amount = Math.max(0, event.price ?? 0) * quantity;
    const isLucky = event.luckMultiplier != null || event.luckWinAmount != null;
    points += amount * (isLucky ? settings.luckyRate : settings.giftRate);
  }

  const membershipPayments = await ctx.db.query("roomMembershipPayments")
    .withIndex("by_room", (q: any) => q.eq("roomId", roomId))
    .order("desc")
    .take(500);
  for (const payment of membershipPayments) {
    if (payment.createdAt >= start && payment.createdAt < end) {
      points += Math.max(0, payment.amount ?? 0) * settings.membershipRate;
    }
  }

  const roundedPoints = Math.floor(points);
  const rate = rewardRateForPoints(roundedPoints);
  return { points: roundedPoints, rate, amount: Math.floor(roundedPoints * rate), settings };
}

export const getRoomRewardStatus = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    const todayKey = rewardDayKey();
    const yesterdayKey = rewardDayKey(-1);
    const today = await calculateRoomReward(ctx, args.roomId, todayKey);
    const yesterday = await calculateRoomReward(ctx, args.roomId, yesterdayKey);
    const claim = await ctx.db.query("roomRewardClaims").withIndex("by_room_and_day", (q: any) => q.eq("roomId", args.roomId).eq("dayKey", yesterdayKey)).unique();
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q: any) => q.eq("userId", userId)).unique();
    const isOwner = room.ownerId === userId;
    return {
      isOwner,
      today: { ...today, dayKey: todayKey },
      yesterday: { ...yesterday, dayKey: yesterdayKey, claimed: Boolean(claim) },
      settings: today.settings,
      goldCoins: profile?.goldCoins ?? 0,
    };
  },
});

export const updateRoomRewardSettings = mutation({
  args: {
    roomId: v.id("rooms"),
    enabled: v.optional(v.boolean()),
    giftRate: v.optional(v.number()),
    membershipRate: v.optional(v.number()),
    luckyRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const room = await ctx.db.get(args.roomId);
    if (!room || room.ownerId !== userId) throw new Error("إعدادات المكافأة متاحة لمالك الغرفة فقط");
    const current = await getRoomRewardSettings(ctx, args.roomId);
    const clamp = (value: number | undefined, fallback: number) => Math.min(1, Math.max(0, Number.isFinite(value as number) ? value as number : fallback));
    const next = {
      enabled: args.enabled ?? current.enabled,
      giftRate: clamp(args.giftRate, current.giftRate),
      membershipRate: clamp(args.membershipRate, current.membershipRate),
      luckyRate: clamp(args.luckyRate, current.luckyRate),
    };
    const existing = await ctx.db.query("roomRewardSettings").withIndex("by_room", (q: any) => q.eq("roomId", args.roomId)).unique();
    if (existing) await ctx.db.patch(existing._id, { ...next, updatedAt: Date.now(), updatedBy: userId });
    else await ctx.db.insert("roomRewardSettings", { roomId: args.roomId, ...next, updatedAt: Date.now(), updatedBy: userId });
    return next;
  },
});

export const claimRoomReward = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const room = await ctx.db.get(args.roomId);
    if (!room || room.ownerId !== userId) throw new Error("مكافأة الغرفة متاحة لمالك الغرفة فقط");
    const dayKey = rewardDayKey(-1);
    const existing = await ctx.db.query("roomRewardClaims").withIndex("by_room_and_day", (q: any) => q.eq("roomId", args.roomId).eq("dayKey", dayKey)).unique();
    if (existing) throw new Error("تم استلام مكافأة هذا اليوم سابقاً");
    const reward = await calculateRoomReward(ctx, args.roomId, dayKey);
    if (reward.amount <= 0) throw new Error("لا توجد مكافأة متاحة للاستلام");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q: any) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    await ctx.db.patch(profile._id, { goldCoins: (profile.goldCoins ?? 0) + reward.amount });
    await ctx.db.insert("roomRewardClaims", { roomId: args.roomId, userId, dayKey, points: reward.points, rate: reward.rate, amount: reward.amount, createdAt: Date.now() });
    return { amount: reward.amount, points: reward.points, rate: reward.rate };
  },
});

export const getRoomMembers = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    // تحديد بـ 120 لتجنب تجاوز حدود Convex
    const members = await ctx.db.query("roomMembers").withIndex("by_room", (q) => q.eq("roomId", args.roomId)).take(120);

    // جلب giftEvents بحد أقصى 300 بدلاً من collect() الكامل
    const giftEvents = await ctx.db.query("giftEvents")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(300);
    const coinsPerReceiver: Record<string, number> = {};
    for (const ev of giftEvents) {
      const rid = ev.receiverId as string;
      coinsPerReceiver[rid] = (coinsPerReceiver[rid] ?? 0) + ev.price;
    }

    return await Promise.all(members.map(async (member) => {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", member.userId)).unique();
      const avatarUrl = await resolveUrl(ctx, profile?.avatarUrl, profile?.avatarStorageId);
      const effectiveRole = room && room.ownerId === member.userId ? "owner" : member.role;

      // جلب seatSkin
      let seatSkinUrl: string | undefined;
      if (profile?.activeSeatSkinId) {
        try {
          const skinItem = await ctx.db.get(profile.activeSeatSkinId as any);
          if (skinItem) {
            seatSkinUrl = await resolveUrl(ctx, skinItem.mediaUrl, skinItem.mediaStorageId);
          }
        } catch (_) {}
      }

      return { ...member, role: effectiveRole, name: profile?.name ?? "user", avatarUrl, isVip: profile?.isVip ?? false, vipLevel: profile?.vipLevel, isSuperAdmin: profile?.isSuperAdmin ?? false, sakiId: profile?.sakiId, goldCoins: profile?.goldCoins ?? 0, wealthLevel: profile?.wealthLevel, charismaLevel: profile?.charismaLevel, aristocracyLevel: profile?.aristocracyLevel, coinsReceivedInRoom: coinsPerReceiver[member.userId as string] ?? 0, seatSkinUrl, profile: profile ? { ...profile, avatarUrl } : null };
    }));
  },
});

export const fixOwnerRoles = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    if (room.ownerId !== userId) throw new Error("ليس لديك صلاحية");
    const members = await ctx.db.query("roomMembers").withIndex("by_room", (q) => q.eq("roomId", args.roomId)).collect();
    const ownerMember = members.find((m) => m.userId === room.ownerId);
    if (ownerMember && ownerMember.role !== "owner") {
      await ctx.db.patch(ownerMember._id, { role: "owner" });
    }
    return null;
  },
});

export const updateYoutubePlayback = mutation({
  args: {
    roomId: v.id("rooms"),
    isPlaying: v.optional(v.boolean()),
    position: v.optional(v.number()),
    isMuted: v.optional(v.boolean()),
    volume: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    
    // فقط المالك أو المشرف يمكنه التحكم في التشغيل
    const memberCandidates = await ctx.db.query("roomMembers")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", userId))
      .order("desc")
      .take(1);
    const member = memberCandidates[0];
    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      throw new Error("ليس لديك صلاحية للتحكم في التشغيل");
    }

    const patch: any = {};
    if (args.isPlaying !== undefined) patch.youtubeIsPlaying = args.isPlaying;
    if (args.position !== undefined) patch.youtubePosition = args.position;
    if (args.isMuted !== undefined) patch.youtubeIsMuted = args.isMuted;
    if (args.volume !== undefined) patch.youtubeVolume = args.volume;
    
    await ctx.db.patch(args.roomId, patch);
    return null;
  },
});
