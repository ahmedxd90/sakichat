import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireMember(ctx: any, roomId: any, userId: any) {
  const room = await ctx.db.get(roomId);
  if (!room) throw new Error("الغرفة غير موجودة");
  const member = await ctx.db.query("roomMembers")
    .withIndex("by_room_and_user", (q: any) => q.eq("roomId", roomId).eq("userId", userId))
    .unique();
  if (!member) throw new Error("يجب أن تكون عضوًا في الغرفة");
  return { room, member };
}

async function canManage(ctx: any, roomId: any, userId: any) {
  const room = await ctx.db.get(roomId);
  if (!room) return false;
  if (room.ownerId === userId) return true;
  const member = await ctx.db.query("roomMembers")
    .withIndex("by_room_and_user", (q: any) => q.eq("roomId", roomId).eq("userId", userId))
    .unique();
  if (member?.role === "owner" || member?.role === "admin") return true;
  const admin = await ctx.db.query("roomAdmins")
    .withIndex("by_room_and_user", (q: any) => q.eq("roomId", roomId).eq("userId", userId))
    .unique();
  return Boolean(admin);
}

async function enrichQueue(ctx: any, entries: any[]) {
  return Promise.all(entries
    .sort((a, b) => a.position - b.position || a.addedAt - b.addedAt)
    .map(async (entry) => {
      const track = await ctx.db.get(entry.trackId);
      const profile = await ctx.db.query("profiles")
        .withIndex("by_userId", (q: any) => q.eq("userId", entry.singerId))
        .unique();
      let audioUrl = track?.audioUrl;
      if (track && !audioUrl) audioUrl = await ctx.storage.getUrl(track.audioStorageId) ?? undefined;
      return {
        ...entry,
        track: track ? { ...track, audioUrl } : null,
        singer: profile ? { userId: profile.userId, name: profile.name, avatarUrl: profile.avatarUrl } : null,
      };
    }));
}

export const getSongs = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    await requireMember(ctx, args.roomId, userId);
    const tracks = await ctx.db.query("roomMusic")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .collect();
    return Promise.all(tracks.map(async (track) => ({
      ...track,
      audioUrl: track.audioUrl ?? await ctx.storage.getUrl(track.audioStorageId) ?? undefined,
    })));
  },
});

export const getQueue = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    await requireMember(ctx, args.roomId, userId);
    const entries = await ctx.db.query("karaokeQueue")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    return enrichQueue(ctx, entries.filter((entry) => entry.status === "queued" || entry.status === "singing"));
  },
});

export const addToQueue = mutation({
  args: { roomId: v.id("rooms"), trackId: v.id("roomMusic") },
  handler: async (ctx, args) => {
    const singerId = await getAuthUserId(ctx);
    if (!singerId) throw new Error("غير مصرح");
    await requireMember(ctx, args.roomId, singerId);
    const track = await ctx.db.get(args.trackId);
    if (!track || track.roomId !== args.roomId) throw new Error("الأغنية غير موجودة في هذه الغرفة");
    const existing = await ctx.db.query("karaokeQueue")
      .withIndex("by_room_and_status", (q) => q.eq("roomId", args.roomId).eq("status", "queued"))
      .collect();
    const active = await ctx.db.query("karaokeQueue")
      .withIndex("by_room_and_status", (q) => q.eq("roomId", args.roomId).eq("status", "singing"))
      .collect();
    const profile = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", singerId))
      .unique();
    const maxPosition = Math.max(0, ...existing.map((item) => item.position), ...active.map((item) => item.position));
    return ctx.db.insert("karaokeQueue", {
      roomId: args.roomId,
      trackId: args.trackId,
      singerId,
      singerName: profile?.name ?? "مغنٍ",
      status: "queued",
      position: maxPosition + 1,
      addedAt: Date.now(),
    });
  },
});

export const removeFromQueue = mutation({
  args: { roomId: v.id("rooms"), queueId: v.id("karaokeQueue") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const entry = await ctx.db.get(args.queueId);
    if (!entry || entry.roomId !== args.roomId) throw new Error("العنصر غير موجود");
    if (entry.singerId !== userId && !(await canManage(ctx, args.roomId, userId))) throw new Error("لا تملك صلاحية إزالة هذا الدور");
    if (entry.status !== "queued") throw new Error("لا يمكن إزالة الأغنية الحالية");
    await ctx.db.delete(args.queueId);
  },
});

export const startNext = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const managerId = await getAuthUserId(ctx);
    if (!managerId) throw new Error("غير مصرح");
    if (!(await canManage(ctx, args.roomId, managerId))) throw new Error("فقط مالك الغرفة أو المشرف يمكنه بدء الدور");
    const active = await ctx.db.query("karaokeQueue")
      .withIndex("by_room_and_status", (q) => q.eq("roomId", args.roomId).eq("status", "singing"))
      .collect();
    for (const entry of active) await ctx.db.patch(entry._id, { status: "done", finishedAt: Date.now() });
    const queued = await ctx.db.query("karaokeQueue")
      .withIndex("by_room_and_status", (q) => q.eq("roomId", args.roomId).eq("status", "queued"))
      .collect();
    const next = queued.sort((a, b) => a.position - b.position || a.addedAt - b.addedAt)[0];
    if (!next) return null;
    const singerMember = await ctx.db.query("roomMembers")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", next.singerId))
      .unique();
    if (!singerMember || singerMember.seatIndex !== 0) {
      throw new Error("يجب أن يجلس المغني التالي على المقعد الرئيسي أولًا");
    }
    const track = await ctx.db.get(next.trackId);
    if (!track) throw new Error("ملف الأغنية غير موجود");
    const audioUrl = track.audioUrl ?? await ctx.storage.getUrl(track.audioStorageId) ?? undefined;
    const singerProfile = await ctx.db.query("profiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", next.singerId))
      .unique();
    await ctx.db.patch(next._id, { status: "singing", startedAt: Date.now() });
    await ctx.db.patch(args.roomId, {
      activeMusicId: next.trackId,
      activeMusicUrl: audioUrl,
      activeMusicName: track.name,
      activeMusicUploader: singerProfile?.name ?? next.singerName ?? "مغنٍ",
      musicVolume: 80,
    });
    return next._id;
  },
});

export const finishCurrent = mutation({
  args: { roomId: v.id("rooms"), queueId: v.id("karaokeQueue"), skipped: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const entry = await ctx.db.get(args.queueId);
    if (!entry || entry.roomId !== args.roomId || entry.status !== "singing") throw new Error("الدور غير نشط");
    if (entry.singerId !== userId && !(await canManage(ctx, args.roomId, userId))) throw new Error("لا تملك صلاحية إنهاء هذا الدور");
    await ctx.db.patch(args.queueId, { status: args.skipped ? "skipped" : "done", finishedAt: Date.now() });
    const room = await ctx.db.get(args.roomId);
    if (room?.activeMusicId === entry.trackId) {
      await ctx.db.patch(args.roomId, {
        activeMusicId: undefined,
        activeMusicUrl: undefined,
        activeMusicName: undefined,
        activeMusicUploader: undefined,
      });
    }
  },
});

export const clearQueue = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId || !(await canManage(ctx, args.roomId, userId))) throw new Error("لا تملك صلاحية تفريغ القائمة");
    const entries = await ctx.db.query("karaokeQueue")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    for (const entry of entries) {
      if (entry.status === "queued") await ctx.db.delete(entry._id);
    }
  },
});
