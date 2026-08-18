// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createTicket = mutation({
  args: { subject: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    const existing = await ctx.db.query("supportTickets").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const open = existing.find((t) => t.status !== "closed");
    if (open) return open._id;
    const ticketId = await ctx.db.insert("supportTickets", {
      userId,
      userName: profile.name,
      userAvatarUrl: profile.avatarUrl,
      userSakiId: profile.sakiId,
      subject: args.subject,
      status: "open",
      lastMessageAt: Date.now(),
      createdAt: Date.now(),
    });
    return ticketId;
  },
});

export const sendSupportMessage = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    content: v.string(),
    mediaStorageId: v.optional(v.id("_storage")),
    mediaType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("التذكرة غير موجودة");
    const isAdmin = profile.isSuperAdmin ?? false;
    if (!isAdmin && ticket.userId !== userId) throw new Error("غير مصرح");
    let mediaUrl: string | undefined;
    if (args.mediaStorageId) {
      mediaUrl = (await ctx.storage.getUrl(args.mediaStorageId)) ?? undefined;
    }
    await ctx.db.insert("supportMessages", {
      ticketId: args.ticketId,
      senderId: userId,
      senderName: profile.name,
      senderAvatarUrl: profile.avatarUrl,
      isAdmin,
      content: args.content,
      mediaStorageId: args.mediaStorageId,
      mediaUrl,
      mediaType: args.mediaType,
      isRead: false,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.ticketId, {
      lastMessageAt: Date.now(),
      status: isAdmin ? "in_progress" : ticket.status,
    });
    return { success: true };
  },
});

export const getMyTicket = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const tickets = await ctx.db.query("supportTickets").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const open = tickets.find((t) => t.status !== "closed");
    return open ?? null;
  },
});

export const getTicketMessages = query({
  args: { ticketId: v.id("supportTickets") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) return [];
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    const isAdmin = profile?.isSuperAdmin ?? false;
    if (!isAdmin && ticket.userId !== userId) return [];
    return await ctx.db.query("supportMessages").withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId)).order("asc").collect();
  },
});

export const getAllTickets = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) return [];
    const tickets = await ctx.db.query("supportTickets").order("desc").take(100);
    return await Promise.all(tickets.map(async (t) => {
      const msgs = await ctx.db.query("supportMessages").withIndex("by_ticket", (q) => q.eq("ticketId", t._id)).order("desc").take(1);
      const unread = (await ctx.db.query("supportMessages").withIndex("by_ticket", (q) => q.eq("ticketId", t._id)).collect()).filter((m) => !m.isRead && !m.isAdmin).length;
      return { ...t, lastMessage: msgs[0]?.content ?? "", unreadCount: unread };
    }));
  },
});

export const closeTicket = mutation({
  args: { ticketId: v.id("supportTickets") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isSuperAdmin) throw new Error("غير مصرح");
    await ctx.db.patch(args.ticketId, { status: "closed" });
  },
});

export const markMessagesRead = mutation({
  args: { ticketId: v.id("supportTickets") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    const isAdmin = profile?.isSuperAdmin ?? false;
    const msgs = await ctx.db.query("supportMessages").withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId)).collect();
    for (const m of msgs) {
      if (!m.isRead && m.isAdmin !== isAdmin) {
        await ctx.db.patch(m._id, { isRead: true });
      }
    }
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
