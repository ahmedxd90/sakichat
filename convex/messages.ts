// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// حجب الشتائم والإهانات والمحتوى الجنسي قبل الحفظ والبث.
// لا يتم تخزين النص المخالف أو تسجيله بصورته الأصلية.
const INAPPROPRIATE_CHAT_PATTERNS = [
  /(?:porn|porno|xxx|sexcam|nudes?|onlyfans|hentai|blowjob|fuck|dick|pussy|cum|sexvideo)/i,
  /(?:سكس|اباحي|إباحي|عاري|عارية|جنس صريح|محتوى جنسي|صور عارية|فيديو عاري|ممارسة جنسية|فيديو جنسي)/i,
  /(?:fuck|fucking|shit|bitch|bastard|asshole|idiot|stupid|moron|dumbass|slut|whore|cunt|nigg(?:er|a))/i,
  /(?:كلب|حيوان|خنزير|حقير|تافه|غبي|أحمق|قذر|وسخ|زبالة|لعنة|تباً|تبًا|يلعن|شرموط|شرموطة|قحبة|منيك|كس|طيز|خرا|عرص|ديوث|متناك)/i,
];
function containsInappropriateChatContent(content: string): boolean {
  const spaced = content
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06EDـ]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .toLowerCase();
  const compact = spaced.replace(/[^\p{L}\p{N}]/gu, "");
  return INAPPROPRIATE_CHAT_PATTERNS.some((pattern) => pattern.test(spaced) || pattern.test(compact));
}

export const clearRoomMessages = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const myMember = await ctx.db.query("roomMembers")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", userId))
      .unique();
    if (!myMember || (myMember.role !== "owner" && myMember.role !== "admin")) {
      throw new Error("ليس لديك صلاحية");
    }
    const msgs = await ctx.db.query("messages").withIndex("by_room", (q) => q.eq("roomId", args.roomId)).collect();
    for (const m of msgs) {
      await ctx.db.delete(m._id);
    }
    await ctx.scheduler.runAfter(0, internal.roomLogs.createLog, {
      roomId: args.roomId, userId, action: "clear_messages"
    });
  },
});

export const sendMessage = mutation({
  args: { roomId: v.id("rooms"), content: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const content = args.content.trim();
    if (!content) throw new Error("الرسالة فارغة");
    if (containsInappropriateChatContent(content)) {
      throw new Error("لا يمكن إرسال الشتائم أو المحتوى غير اللائق في دردشة الغرفة");
    }
    await ctx.db.insert("messages", { roomId: args.roomId, senderId: userId, content, type: "text", createdAt: Date.now() });
  },
});

export const sendImageMessage = mutation({
  args: { roomId: v.id("rooms"), imageStorageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile?.isVip || (profile.vipLevel ?? 0) < 5) throw new Error("إرسال الصور متاح فقط لأعضاء VIP 5 وما فوق 💎");
    const member = await ctx.db.query("roomMembers").withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", userId)).unique();
    if (member?.isChatMuted) throw new Error("أنت مكتوم في الدردشة");
    const imageUrl = await ctx.storage.getUrl(args.imageStorageId);
    await ctx.db.insert("messages", { roomId: args.roomId, senderId: userId, content: imageUrl ?? "", type: "image", imageStorageId: args.imageStorageId, createdAt: Date.now() });
  },
});

export const sendSystemMessage = mutation({
  args: { roomId: v.id("rooms"), content: v.string(), type: v.union(v.literal("system"), v.literal("join"), v.literal("leave")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    await ctx.db.insert("messages", { roomId: args.roomId, senderId: userId, content: args.content, type: args.type, createdAt: Date.now() });
  },
});

export const getRoomMessages = query({
  args: { roomId: v.id("rooms"), joinedAt: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const messages = await ctx.db.query("messages").withIndex("by_room", (q) => q.eq("roomId", args.roomId)).order("desc").take(60);
    const filtered = args.joinedAt ? messages.filter((m) => m.createdAt >= args.joinedAt!) : messages;
    return await Promise.all(filtered.reverse().map(async (msg) => {
      const profileCandidates = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", msg.senderId)).order("desc").take(1);
      const profile = profileCandidates[0];
      let avatarUrl = profile?.avatarUrl;
      if (profile?.avatarStorageId && !avatarUrl) avatarUrl = await ctx.storage.getUrl(profile.avatarStorageId) ?? undefined;
      let imageUrl;
      if (msg.type === "image" && msg.imageStorageId) imageUrl = await ctx.storage.getUrl(msg.imageStorageId) ?? undefined;
      const now = Date.now();
      const aristLevel = profile?.aristocracyLevel ?? 0;
      const aristExpiry = profile?.aristocracyExpiresAt ?? 0;
      const senderAristocracyLevel = aristLevel > 0 && aristExpiry > now ? aristLevel : 0;
      // Resolve gift image URL if stored as storageId reference
      let giftImageUrl = (msg as any).giftImageUrl;
      return {
        ...msg,
        senderName: profile?.name ?? "مجهول",
        senderAvatar: avatarUrl,
        senderIsVip: profile?.isVip ?? false,
        senderVipLevel: profile?.vipLevel,
        senderWealthLevel: profile?.wealthLevel,
        senderCharismaLevel: profile?.charismaLevel,
        senderAristocracyLevel,
        imageUrl,
        giftImageUrl,
      };
    }));
  },
});

export const getDirectMessages = query({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const sent = await ctx.db.query("directMessages").withIndex("by_sender_and_receiver", (q) => q.eq("senderId", userId).eq("receiverId", args.otherUserId)).collect();
    const received = await ctx.db.query("directMessages").withIndex("by_sender_and_receiver", (q) => q.eq("senderId", args.otherUserId).eq("receiverId", userId)).collect();
    const all = [...sent, ...received].sort((a, b) => a.createdAt - b.createdAt);
    return await Promise.all(all.map(async (msg) => {
      let imageUrl, videoUrl, voiceUrl;
      if (msg.imageStorageId) imageUrl = await ctx.storage.getUrl(msg.imageStorageId) ?? undefined;
      if (msg.videoStorageId) videoUrl = await ctx.storage.getUrl(msg.videoStorageId) ?? undefined;
      if (msg.voiceStorageId) voiceUrl = await ctx.storage.getUrl(msg.voiceStorageId) ?? undefined;
      return { ...msg, imageUrl, videoUrl, voiceUrl };
    }));
  },
});

export const sendDirectMessage = mutation({
  args: { receiverId: v.id("users"), content: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const iBlocked = await ctx.db.query("chatBlocks").withIndex("by_blocker_and_blocked", (q) => q.eq("blockerId", userId).eq("blockedId", args.receiverId)).unique();
    if (iBlocked) throw new Error("لقد قمت بحظر هذا المستخدم");
    const theyBlocked = await ctx.db.query("chatBlocks").withIndex("by_blocker_and_blocked", (q) => q.eq("blockerId", args.receiverId).eq("blockedId", userId)).unique();
    if (theyBlocked) throw new Error("لا يمكنك إرسال رسائل لهذا المستخدم");
    await ctx.db.insert("directMessages", { senderId: userId, receiverId: args.receiverId, content: args.content, type: "text", isRead: false, createdAt: Date.now() });
    const senderProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    await ctx.scheduler.runAfter(0, internal.pushNotificationsHelper.notifyDirectMessage, {
      receiverId: args.receiverId, senderId: userId, senderName: senderProfile?.name ?? "مستخدم", content: args.content, type: "text",
    });
    // Daily task: send_dm
    await ctx.scheduler.runAfter(0, internal.dailyRewards.updateTaskProgress, { taskId: "send_dm", increment: 1, userId });
  },
});

export const sendDirectImage = mutation({
  args: { receiverId: v.id("users"), imageStorageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const iBlocked = await ctx.db.query("chatBlocks").withIndex("by_blocker_and_blocked", (q) => q.eq("blockerId", userId).eq("blockedId", args.receiverId)).unique();
    if (iBlocked) throw new Error("لقد قمت بحظر هذا المستخدم");
    const theyBlocked = await ctx.db.query("chatBlocks").withIndex("by_blocker_and_blocked", (q) => q.eq("blockerId", args.receiverId).eq("blockedId", userId)).unique();
    if (theyBlocked) throw new Error("لا يمكنك إرسال رسائل لهذا المستخدم");
    await ctx.db.insert("directMessages", { senderId: userId, receiverId: args.receiverId, content: "📷 صورة", type: "image", imageStorageId: args.imageStorageId, isRead: false, createdAt: Date.now() });
    const senderProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    await ctx.scheduler.runAfter(0, internal.pushNotificationsHelper.notifyDirectMessage, {
      receiverId: args.receiverId, senderId: userId, senderName: senderProfile?.name ?? "مستخدم", content: "📷 صورة", type: "image",
    });
  },
});

export const sendDirectVideo = mutation({
  args: { receiverId: v.id("users"), videoStorageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const iBlocked = await ctx.db.query("chatBlocks").withIndex("by_blocker_and_blocked", (q) => q.eq("blockerId", userId).eq("blockedId", args.receiverId)).unique();
    if (iBlocked) throw new Error("لقد قمت بحظر هذا المستخدم");
    const theyBlocked = await ctx.db.query("chatBlocks").withIndex("by_blocker_and_blocked", (q) => q.eq("blockerId", args.receiverId).eq("blockedId", userId)).unique();
    if (theyBlocked) throw new Error("لا يمكنك إرسال رسائل لهذا المستخدم");
    await ctx.db.insert("directMessages", { senderId: userId, receiverId: args.receiverId, content: "🎥 فيديو", type: "video", videoStorageId: args.videoStorageId, isRead: false, createdAt: Date.now() });
    const senderProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    await ctx.scheduler.runAfter(0, internal.pushNotificationsHelper.notifyDirectMessage, {
      receiverId: args.receiverId, senderId: userId, senderName: senderProfile?.name ?? "مستخدم", content: "🎥 فيديو", type: "video",
    });
  },
});

export const sendDirectVoice = mutation({
  args: { receiverId: v.id("users"), voiceStorageId: v.id("_storage"), voiceDuration: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const iBlocked = await ctx.db.query("chatBlocks").withIndex("by_blocker_and_blocked", (q) => q.eq("blockerId", userId).eq("blockedId", args.receiverId)).unique();
    if (iBlocked) throw new Error("لقد قمت بحظر هذا المستخدم");
    const theyBlocked = await ctx.db.query("chatBlocks").withIndex("by_blocker_and_blocked", (q) => q.eq("blockerId", args.receiverId).eq("blockedId", userId)).unique();
    if (theyBlocked) throw new Error("لا يمكنك إرسال رسائل لهذا المستخدم");
    await ctx.db.insert("directMessages", { senderId: userId, receiverId: args.receiverId, content: "🎤 رسالة صوتية", type: "voice", voiceStorageId: args.voiceStorageId, voiceDuration: args.voiceDuration, isRead: false, createdAt: Date.now() });
    const senderProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    await ctx.scheduler.runAfter(0, internal.pushNotificationsHelper.notifyDirectMessage, {
      receiverId: args.receiverId, senderId: userId, senderName: senderProfile?.name ?? "مستخدم", content: "🎤 رسالة صوتية", type: "voice",
    });
  },
});

export const sendDirectGift = mutation({
  args: { receiverId: v.id("users"), giftEmoji: v.string(), giftName: v.string(), giftCoins: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const iBlocked = await ctx.db.query("chatBlocks").withIndex("by_blocker_and_blocked", (q) => q.eq("blockerId", userId).eq("blockedId", args.receiverId)).unique();
    if (iBlocked) throw new Error("لقد قمت بحظر هذا المستخدم");
    const theyBlocked = await ctx.db.query("chatBlocks").withIndex("by_blocker_and_blocked", (q) => q.eq("blockerId", args.receiverId).eq("blockedId", userId)).unique();
    if (theyBlocked) throw new Error("لا يمكنك إرسال هدايا لهذا المستخدم");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (!profile) throw new Error("الملف الشخصي غير موجود");
    const coins = profile.goldCoins ?? 0;
    if (coins < args.giftCoins) throw new Error(`رصيدك غير كافٍ. تحتاج ${args.giftCoins.toLocaleString()} عملة`);
    await ctx.db.patch(profile._id, { goldCoins: coins - args.giftCoins });
    const receiverProfile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", args.receiverId)).unique();
    if (receiverProfile) await ctx.db.patch(receiverProfile._id, { goldCoins: (receiverProfile.goldCoins ?? 0) + Math.floor(args.giftCoins * 0.8) });
    await ctx.db.insert("directMessages", { senderId: userId, receiverId: args.receiverId, content: `🎁 أرسل هدية: ${args.giftName}`, type: "gift", giftEmoji: args.giftEmoji, giftName: args.giftName, giftCoins: args.giftCoins, isRead: false, createdAt: Date.now() });
    await ctx.db.insert("notifications", { userId: args.receiverId, type: "gift", title: `🎁 هدية من ${profile.name}`, body: `أرسل لك ${profile.name} هدية "${args.giftName}" بقيمة ${args.giftCoins} عملة`, isRead: false, actorUserId: userId, createdAt: Date.now() });
    await ctx.scheduler.runAfter(0, internal.pushNotificationsHelper.notifyDirectMessage, {
      receiverId: args.receiverId, senderId: userId, senderName: profile.name, content: `🎁 أرسل لك هدية: ${args.giftName}`, type: "gift",
    });
  },
});

export const addReaction = mutation({
  args: { messageId: v.id("directMessages"), emoji: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const msg = await ctx.db.get(args.messageId);
    if (!msg) throw new Error("الرسالة غير موجودة");
    const reactions = msg.reactions ?? [];
    const existingIdx = reactions.findIndex((r) => r.userId === userId && r.emoji === args.emoji);
    if (existingIdx >= 0) {
      await ctx.db.patch(args.messageId, { reactions: reactions.filter((_, i) => i !== existingIdx) });
    } else {
      await ctx.db.patch(args.messageId, { reactions: [...reactions.filter((r) => r.userId !== userId), { emoji: args.emoji, userId }] });
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

export const markAsRead = mutation({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const unread = await ctx.db.query("directMessages").withIndex("by_sender_and_receiver", (q) => q.eq("senderId", args.otherUserId).eq("receiverId", userId)).collect();
    for (const msg of unread) { if (!msg.isRead) await ctx.db.patch(msg._id, { isRead: true }); }
  },
});

export const getConversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const sent = await ctx.db.query("directMessages").withIndex("by_sender", (q) => q.eq("senderId", userId)).collect();
    const received = await ctx.db.query("directMessages").withIndex("by_receiver", (q) => q.eq("receiverId", userId)).collect();
    const all = [...sent, ...received];
    const convMap = new Map();
    for (const msg of all) {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const key = String(otherId);
      if (!convMap.has(key) || convMap.get(key).createdAt < msg.createdAt) convMap.set(key, { ...msg, otherId });
    }
    const convs = Array.from(convMap.values()).sort((a, b) => b.createdAt - a.createdAt);
    return await Promise.all(convs.map(async (c) => {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", c.otherId)).unique();
      let avatarUrl = profile?.avatarUrl;
      if (profile?.avatarStorageId && !avatarUrl) avatarUrl = await ctx.storage.getUrl(profile.avatarStorageId) ?? undefined;
      const unreadCount = received.filter((m) => m.senderId === c.otherId && !m.isRead).length;
      return { ...c, otherProfile: profile ? { ...profile, avatarUrl } : null, unreadCount };
    }));
  },
});

export const getTotalUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;
    const unread = await ctx.db.query("directMessages").withIndex("by_receiver", (q) => q.eq("receiverId", userId)).collect();
    return unread.filter((m) => !m.isRead).length;
  },
});

export const deleteMyDirectMessages = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const sent = await ctx.db.query("directMessages").withIndex("by_sender", (q) => q.eq("senderId", userId)).collect();
    const received = await ctx.db.query("directMessages").withIndex("by_receiver", (q) => q.eq("receiverId", userId)).collect();
    const ids = new Set([...sent, ...received].map((message) => String(message._id)));
    for (const message of [...sent, ...received]) {
      if (ids.has(String(message._id))) await ctx.db.delete(message._id);
    }
    return { deleted: ids.size };
  },
});
