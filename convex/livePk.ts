import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const getOwnedLiveStream = async (ctx: any, streamId: any, userId: any) => {
  const stream = await ctx.db.get(streamId);
  if (!stream || !stream.isLive || stream.hostId !== userId) throw new Error("يجب أن تكون مضيف البث الحالي");
  return stream;
};

export const getActivePkForLivestream = query({
  args: { livestreamId: v.id("livestreams") },
  handler: async (ctx, args) => {
    const a = await ctx.db.query("livePkSessions").withIndex("by_streamA", (q) => q.eq("streamAId", args.livestreamId)).filter((q) => q.eq(q.field("status"), "active")).unique();
    if (a) return a;
    return await ctx.db.query("livePkSessions").withIndex("by_streamB", (q) => q.eq("streamBId", args.livestreamId)).filter((q) => q.eq(q.field("status"), "active")).unique();
  },
});

export const getPendingPkInvites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const invites = await ctx.db.query("livePkInvites").withIndex("by_target_user", (q) => q.eq("targetUserId", userId)).filter((q) => q.eq(q.field("status"), "pending")).order("desc").take(10);
    return await Promise.all(invites.map(async (invite) => {
      const stream = await ctx.db.get(invite.inviterStreamId);
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", invite.inviterUserId)).unique();
      return { ...invite, streamTitle: stream?.title, inviterAvatarUrl: profile?.avatarUrl };
    }));
  },
});

export const sendPkInvite = mutation({
  args: { targetStreamId: v.id("livestreams") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const source = await ctx.db.query("livestreams").withIndex("by_host", (q) => q.eq("hostId", userId)).filter((q) => q.eq(q.field("isLive"), true)).unique();
    if (!source) throw new Error("لا يوجد بث نشط لك");
    const target = await ctx.db.get(args.targetStreamId);
    if (!target?.isLive || !target.hostId || target.hostId === userId) throw new Error("البث المستهدف غير متاح");
    const existing = await ctx.db.query("livePkInvites").withIndex("by_inviter_stream", (q) => q.eq("inviterStreamId", source._id)).filter((q) => q.eq(q.field("status"), "pending")).collect();
    if (existing.some((item: any) => item.targetStreamId === args.targetStreamId)) throw new Error("تم إرسال الدعوة بالفعل");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    return await ctx.db.insert("livePkInvites", { inviterStreamId: source._id, targetStreamId: args.targetStreamId, inviterUserId: userId, targetUserId: target.hostId, inviterName: profile?.name, status: "pending", createdAt: Date.now() });
  },
});

export const respondToPkInvite = mutation({
  args: { inviteId: v.id("livePkInvites"), accept: v.boolean(), durationSeconds: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const invite = await ctx.db.get(args.inviteId);
    if (!invite || invite.targetUserId !== userId || invite.status !== "pending") throw new Error("دعوة PK غير متاحة");
    if (!args.accept) { await ctx.db.patch(invite._id, { status: "rejected" }); return null; }
    const source = await ctx.db.get(invite.inviterStreamId);
    const target = await ctx.db.get(invite.targetStreamId);
    if (!source?.isLive || !target?.isLive) throw new Error("أحد البثين انتهى");
    const now = Date.now();
    const durationSeconds = Math.min(600, Math.max(60, args.durationSeconds ?? 180));
    const channelName = `pk${String(invite.inviterStreamId)}${String(invite.targetStreamId)}${now}`.replace(/[^a-zA-Z0-9]/g, "").slice(0, 90);
    const sessionId = await ctx.db.insert("livePkSessions", { streamAId: source._id, streamBId: target._id, hostAId: source.hostId!, hostBId: target.hostId!, channelName, status: "active", durationSeconds, startedAt: now, endsAt: now + durationSeconds * 1000, scoreA: 0, scoreB: 0, createdAt: now });
    await ctx.db.patch(invite._id, { status: "accepted" });
    return sessionId;
  },
});

export const endPk = mutation({
  args: { sessionId: v.id("livePkSessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const session = await ctx.db.get(args.sessionId);
    if (!session || (session.hostAId !== userId && session.hostBId !== userId)) throw new Error("Not authorized");
    const winner = session.scoreA === session.scoreB ? "draw" : session.scoreA > session.scoreB ? "a" : "b";
    await ctx.db.patch(session._id, { status: "finished", winner, endedAt: Date.now() });
    return winner;
  },
});

export const addPkScore = mutation({
  args: { sessionId: v.id("livePkSessions"), streamId: v.id("livestreams"), points: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== "active") return null;
    if (session.hostAId !== userId && session.hostBId !== userId) throw new Error("Not authorized");
    const points = Math.max(0, Math.floor(args.points));
    if (args.streamId === session.streamAId) await ctx.db.patch(session._id, { scoreA: session.scoreA + points });
    else if (args.streamId === session.streamBId) await ctx.db.patch(session._id, { scoreB: session.scoreB + points });
    return null;
  },
});
