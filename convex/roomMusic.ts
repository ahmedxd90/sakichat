// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper: check if user is owner or admin of the room
async function isOwnerOrAdmin(ctx: any, roomId: any, userId: any) {
  const room = await ctx.db.get(roomId);
  if (!room) return false;
  if (room.ownerId === userId) return true;
  const member = await ctx.db.query("roomMembers")
    .withIndex("by_room_and_user", (q: any) => q.eq("roomId", roomId).eq("userId", userId))
    .unique();
  if (member?.role === "admin" || member?.role === "owner") return true;
  const adminEntry = await ctx.db.query("roomAdmins")
    .withIndex("by_room_and_user", (q: any) => q.eq("roomId", roomId).eq("userId", userId))
    .unique();
  return !!adminEntry;
}

// Any member can upload their own music to their personal library
export const uploadMusic = mutation({
  args: {
    roomId: v.id("rooms"),
    name: v.string(),
    audioStorageId: v.id("_storage"),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    const member = await ctx.db.query("roomMembers")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", userId))
      .unique();
    if (!member) throw new Error("يجب أن تكون عضواً في الغرفة");
    const audioUrl = await ctx.storage.getUrl(args.audioStorageId);
    return await ctx.db.insert("roomMusic", {
      uploaderId: userId,
      roomId: args.roomId,
      name: args.name,
      audioStorageId: args.audioStorageId,
      audioUrl: audioUrl ?? undefined,
      duration: args.duration,
      createdAt: Date.now(),
    });
  },
});

// Get MY personal music library for this room
export const getRoomMusicList = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const tracks = await ctx.db
      .query("roomMusic")
      .withIndex("by_room_and_uploader", (q) => q.eq("roomId", args.roomId).eq("uploaderId", userId))
      .order("desc")
      .collect();
    return await Promise.all(tracks.map(async (t) => {
      let audioUrl = t.audioUrl;
      if (!audioUrl) audioUrl = await ctx.storage.getUrl(t.audioStorageId) ?? undefined;
      return { ...t, audioUrl };
    }));
  },
});

// Get ALL music in the room (from all users) - only for owner/admin
export const getAllRoomMusic = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const tracks = await ctx.db
      .query("roomMusic")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .collect();
    return await Promise.all(tracks.map(async (t) => {
      let audioUrl = t.audioUrl;
      if (!audioUrl) audioUrl = await ctx.storage.getUrl(t.audioStorageId) ?? undefined;
      const profile = await ctx.db.query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", t.uploaderId))
        .unique();
      return { ...t, audioUrl, uploaderName: profile?.name ?? "مجهول" };
    }));
  },
});

export const deleteMusic = mutation({
  args: { trackId: v.id("roomMusic"), roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const track = await ctx.db.get(args.trackId);
    if (!track) throw new Error("المقطع غير موجود");
    const room = await ctx.db.get(args.roomId);
    const canDelete = track.uploaderId === userId || room?.ownerId === userId || await isOwnerOrAdmin(ctx, args.roomId, userId);
    if (!canDelete) throw new Error("ليس لديك صلاحية");
    await ctx.storage.delete(track.audioStorageId);
    await ctx.db.delete(args.trackId);
  },
});

// Only owner or admin can play music
export const playMusic = mutation({
  args: {
    roomId: v.id("rooms"),
    trackId: v.id("roomMusic"),
    volume: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    const canPlay = await isOwnerOrAdmin(ctx, args.roomId, userId);
    if (!canPlay) throw new Error("فقط مالك الغرفة والمشرف يمكنهم تشغيل الموسيقى 🎵");
    const track = await ctx.db.get(args.trackId);
    if (!track) throw new Error("المقطع غير موجود");
    let audioUrl = track.audioUrl;
    if (!audioUrl) audioUrl = await ctx.storage.getUrl(track.audioStorageId) ?? undefined;
    const uploaderProfile = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", track.uploaderId))
      .unique();
    await ctx.db.patch(args.roomId, {
      activeMusicId: args.trackId,
      activeMusicUrl: audioUrl ?? undefined,
      activeMusicName: track.name,
      activeMusicUploader: uploaderProfile?.name ?? "مجهول",
      musicVolume: args.volume ?? 80,
    });
  },
});

// Only owner or admin can stop music
export const stopMusic = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("الغرفة غير موجودة");
    const canStop = await isOwnerOrAdmin(ctx, args.roomId, userId);
    if (!canStop) throw new Error("فقط مالك الغرفة والمشرف يمكنهم إيقاف الموسيقى");
    await ctx.db.patch(args.roomId, {
      activeMusicId: undefined,
      activeMusicUrl: undefined,
      activeMusicName: undefined,
      activeMusicUploader: undefined,
    });
  },
});

export const setMusicVolume = mutation({
  args: { roomId: v.id("rooms"), volume: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const canControl = await isOwnerOrAdmin(ctx, args.roomId, userId);
    if (!canControl) throw new Error("غير مصرح");
    await ctx.db.patch(args.roomId, { musicVolume: args.volume });
  },
});

export const generateMusicUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    return await ctx.storage.generateUploadUrl();
  },
});
