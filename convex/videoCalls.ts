// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const COST_PER_MINUTE = 2000;
const RECEIVER_SHARE = 0.7;

export const initiateCall = mutation({
  args: { receiverId: v.id("users") },
  handler: async (ctx, args) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new Error("غير مصرح");

    const callerProfile = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", callerId)).unique();
    if (!callerProfile) throw new Error("الملف الشخصي غير موجود");

    const receiverProfile = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.receiverId)).unique();
    if (!receiverProfile) throw new Error("المستخدم غير موجود");

    if ((callerProfile.goldCoins ?? 0) < COST_PER_MINUTE) {
      throw new Error(`رصيدك غير كافٍ. تحتاج ${COST_PER_MINUTE.toLocaleString()} عملة على الأقل`);
    }

    // إلغاء أي مكالمة قديمة
    const oldCalls = await ctx.db.query("videoCalls")
      .withIndex("by_caller", (q) => q.eq("callerId", callerId)).collect();
    for (const c of oldCalls) {
      if (c.status === "ringing" || c.status === "active") {
        await ctx.db.patch(c._id, { status: "ended", endedAt: Date.now() });
      }
    }

    const channelName = `vcall_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const callId = await ctx.db.insert("videoCalls", {
      callerId,
      receiverId: args.receiverId,
      callerName: callerProfile.name,
      callerAvatarUrl: callerProfile.avatarUrl,
      receiverName: receiverProfile.name,
      receiverAvatarUrl: receiverProfile.avatarUrl,
      status: "ringing",
      channelName,
      createdAt: Date.now(),
    });

    return { callId, channelName };
  },
});

export const acceptCall = mutation({
  args: { callId: v.id("videoCalls") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const call = await ctx.db.get(args.callId);
    if (!call || call.receiverId !== userId) throw new Error("غير مصرح");
    if (call.status !== "ringing") throw new Error("المكالمة لم تعد متاحة");
    await ctx.db.patch(args.callId, { status: "active", startedAt: Date.now() });
    return { channelName: call.channelName };
  },
});

export const declineCall = mutation({
  args: { callId: v.id("videoCalls") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const call = await ctx.db.get(args.callId);
    if (!call) throw new Error("المكالمة غير موجودة");
    if (call.receiverId !== userId && call.callerId !== userId) throw new Error("غير مصرح");
    await ctx.db.patch(args.callId, {
      status: call.receiverId === userId ? "declined" : "ended",
      endedAt: Date.now(),
    });
  },
});

export const endCall = mutation({
  args: { callId: v.id("videoCalls") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const call = await ctx.db.get(args.callId);
    if (!call) throw new Error("المكالمة غير موجودة");
    if (call.callerId !== userId && call.receiverId !== userId) throw new Error("غير مصرح");
    if (call.status === "ended" || call.status === "declined") return;

    const now = Date.now();
    const startedAt = call.startedAt ?? now;
    const durationSeconds = Math.floor((now - startedAt) / 1000);
    const durationMinutes = Math.ceil(durationSeconds / 60);
    const totalCost = durationMinutes * COST_PER_MINUTE;

    await ctx.db.patch(args.callId, { status: "ended", endedAt: now, durationSeconds, totalCost });

    if (call.status === "active" && durationSeconds > 0) {
      const callerProfile = await ctx.db.query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", call.callerId)).unique();
      const receiverProfile = await ctx.db.query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", call.receiverId)).unique();

      if (callerProfile) {
        await ctx.db.patch(callerProfile._id, {
          goldCoins: Math.max(0, (callerProfile.goldCoins ?? 0) - totalCost),
        });
      }
      if (receiverProfile) {
        const diamonds = Math.floor(totalCost * RECEIVER_SHARE);
        await ctx.db.patch(receiverProfile._id, {
          diamonds: (receiverProfile.diamonds ?? 0) + diamonds,
          totalCoinsReceived: (receiverProfile.totalCoinsReceived ?? 0) + totalCost,
        });
        await ctx.db.insert("notifications", {
          userId: call.receiverId,
          type: "call_ended",
          title: "انتهت المكالمة",
          body: `مكالمة مع ${call.callerName} · ${Math.floor(durationSeconds / 60)}:${String(durationSeconds % 60).padStart(2, "0")} · +${diamonds.toLocaleString()} 💎`,
          isRead: false,
          actorUserId: call.callerId,
          createdAt: Date.now(),
        });
      }
      await ctx.db.insert("callBillingTicks", {
        callId: args.callId,
        callerId: call.callerId,
        receiverId: call.receiverId,
        coinsCharged: totalCost,
        diamondsAwarded: Math.floor(totalCost * RECEIVER_SHARE),
        createdAt: Date.now(),
      });
    }
  },
});

export const billMinute = mutation({
  args: { callId: v.id("videoCalls") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const call = await ctx.db.get(args.callId);
    if (!call || call.status !== "active") return { ended: true };
    if (call.callerId !== userId) return { ended: false };

    const callerProfile = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", call.callerId)).unique();
    if (!callerProfile) return { ended: true };

    const coins = callerProfile.goldCoins ?? 0;
    if (coins < COST_PER_MINUTE) {
      await ctx.db.patch(args.callId, { status: "ended", endedAt: Date.now() });
      return { ended: true, reason: "insufficient_coins" };
    }

    await ctx.db.patch(callerProfile._id, { goldCoins: coins - COST_PER_MINUTE });

    const receiverProfile = await ctx.db.query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", call.receiverId)).unique();
    if (receiverProfile) {
      const diamonds = Math.floor(COST_PER_MINUTE * RECEIVER_SHARE);
      await ctx.db.patch(receiverProfile._id, {
        diamonds: (receiverProfile.diamonds ?? 0) + diamonds,
        totalCoinsReceived: (receiverProfile.totalCoinsReceived ?? 0) + COST_PER_MINUTE,
      });
    }

    await ctx.db.insert("callBillingTicks", {
      callId: args.callId,
      callerId: call.callerId,
      receiverId: call.receiverId,
      coinsCharged: COST_PER_MINUTE,
      diamondsAwarded: Math.floor(COST_PER_MINUTE * RECEIVER_SHARE),
      createdAt: Date.now(),
    });

    return { ended: false, remainingCoins: coins - COST_PER_MINUTE };
  },
});

export const getIncomingCall = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const call = await ctx.db.query("videoCalls")
      .withIndex("by_receiver", (q) => q.eq("receiverId", userId))
      .order("desc").first();
    if (!call || call.status !== "ringing") return null;
    if (Date.now() - call.createdAt > 35000) return null;
    return call;
  },
});

export const getOutgoingCall = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const call = await ctx.db.query("videoCalls")
      .withIndex("by_caller", (q) => q.eq("callerId", userId))
      .order("desc").first();
    if (!call) return null;
    if (call.status !== "ringing" && call.status !== "active") return null;
    return call;
  },
});

export const getCall = query({
  args: { callId: v.id("videoCalls") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.callId);
  },
});

export const getCallHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const asCaller = await ctx.db.query("videoCalls")
      .withIndex("by_caller", (q) => q.eq("callerId", userId)).order("desc").take(20);
    const asReceiver = await ctx.db.query("videoCalls")
      .withIndex("by_receiver", (q) => q.eq("receiverId", userId)).order("desc").take(20);
    return [...asCaller, ...asReceiver]
      .filter(c => c.status === "ended" || c.status === "declined" || c.status === "missed")
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 30)
      .map(c => ({ ...c, isCaller: c.callerId === userId }));
  },
});

export const cancelExpiredCalls = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const calls = await ctx.db.query("videoCalls")
      .withIndex("by_caller", (q) => q.eq("callerId", userId)).collect();
    for (const call of calls) {
      if (call.status === "ringing" && Date.now() - call.createdAt > 35000) {
        await ctx.db.patch(call._id, { status: "missed", endedAt: Date.now() });
      }
    }
  },
});
