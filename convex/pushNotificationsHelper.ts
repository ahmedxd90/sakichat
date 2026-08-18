import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ── Helper: notify user about a direct message ──────────────────
export const notifyDirectMessage = internalAction({
  args: {
    receiverId: v.id("users"),
    senderId: v.optional(v.id("users")),
    senderName: v.string(),
    content: v.string(),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let body = args.content;
    if (args.type === "image") body = "📷 أرسل لك صورة";
    else if (args.type === "voice") body = "🎤 أرسل لك رسالة صوتية";
    else if (args.type === "video") body = "🎥 أرسل لك فيديو";
    else if (args.type === "gift") body = args.content;

    await ctx.runAction(internal.pushNotifications.sendPushToUser, {
      userId: args.receiverId,
      title: `💬 رسالة من ${args.senderName}`,
      body,
      tag: `dm-${args.receiverId}`,
      url: "/?page=messages",
      data: args.senderId ? { type: "direct_message", otherUserId: args.senderId } : { type: "messages" },
    });
  },
});

// ── Helper: notify user about any notification ───────────────────
export const notifyUser = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    tag: v.optional(v.string()),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.runAction(internal.pushNotifications.sendPushToUser, {
      userId: args.userId,
      title: args.title,
      body: args.body,
      tag: args.tag,
      url: args.url || "/",
    });
  },
});
