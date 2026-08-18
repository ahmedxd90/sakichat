// @ts-nocheck
import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

function getUtcDay(): number {
  return Math.floor(Date.now() / 86400000);
}

export const CHECKIN_REWARDS = [
  { day: 1, coins: 1000,  vipDays: 0, vipLevel: 0, label: "اليوم 1", icon: "💰" },
  { day: 2, coins: 500,   vipDays: 3, vipLevel: 1, label: "اليوم 2", icon: "🎖️" },
  { day: 3, coins: 20000, vipDays: 0, vipLevel: 0, label: "اليوم 3", icon: "💰" },
  { day: 4, coins: 30000, vipDays: 0, vipLevel: 0, label: "اليوم 4", icon: "💰" },
  { day: 5, coins: 50000, vipDays: 0, vipLevel: 0, label: "اليوم 5", icon: "💰" },
  { day: 6, coins: 10000, vipDays: 0, vipLevel: 0, label: "اليوم 6", icon: "💰" },
  { day: 7, coins: 5000,  vipDays: 3, vipLevel: 3, label: "اليوم 7", icon: "🎁" },
];

export const DAILY_TASKS = [
  { id: "enter_room",   label: "ادخل غرفة صوتية",          description: "ادخل أي غرفة صوتية",          target: 1, rewardCoins: 200, rewardVipDays: 0, rewardVipLevel: 0, icon: "🎙️", category: "room" },
  { id: "send_gift",    label: "أرسل هدية في غرفة",         description: "أرسل أي هدية لأي مستخدم",      target: 1, rewardCoins: 300, rewardVipDays: 0, rewardVipLevel: 0, icon: "🎁", category: "gift" },
  { id: "post_moment",  label: "انشر لحظة",                 description: "ارفع منشوراً في اللحظات",       target: 1, rewardCoins: 250, rewardVipDays: 0, rewardVipLevel: 0, icon: "📸", category: "content" },
  { id: "post_reel",    label: "انشر ريلز",                  description: "ارفع فيديو ريلز",               target: 1, rewardCoins: 300, rewardVipDays: 0, rewardVipLevel: 0, icon: "🎬", category: "content" },
  { id: "follow_user",  label: "تابع مستخدماً",              description: "تابع أي مستخدم",               target: 1, rewardCoins: 150, rewardVipDays: 0, rewardVipLevel: 0, icon: "👥", category: "social" },
  { id: "send_dm",      label: "أرسل رسالة خاصة",           description: "أرسل رسالة مباشرة لأي مستخدم", target: 1, rewardCoins: 150, rewardVipDays: 0, rewardVipLevel: 0, icon: "✉️", category: "social" },
  { id: "add_friend",   label: "أضف صديقاً",                description: "أرسل طلب صداقة",               target: 1, rewardCoins: 200, rewardVipDays: 0, rewardVipLevel: 0, icon: "🤝", category: "social" },
  { id: "like_content", label: "أعجب بـ 3 منشورات أو ريلز", description: "اضغط إعجاب على 3 منشورات",     target: 3, rewardCoins: 100, rewardVipDays: 0, rewardVipLevel: 0, icon: "❤️", category: "social" },
];

// دالة مساعدة لتحويل config DB إلى reward
function dbConfigToReward(c: any) {
  const icons: Record<string, string> = { coins: "🪙", gift: "🎁", frame: "🖼️", entry: "🚪", vip: "👑", aristocracy: "💎" };
  return {
    day: c.day,
    coins: c.rewardType === "coins" ? (c.coins ?? 0) : 0,
    vipDays: c.rewardType === "vip" ? (c.vipDays ?? 0) : 0,
    vipLevel: c.rewardType === "vip" ? (c.vipLevel ?? 0) : 0,
    label: c.label ?? `اليوم ${c.day}`,
    icon: icons[c.rewardType] ?? "🎁",
    rewardType: c.rewardType,
    giftId: c.giftId,
    giftName: c.giftName,
    giftImageUrl: c.giftImageUrl,
    storeItemId: c.storeItemId,
    storeItemName: c.storeItemName,
    storeItemImageUrl: c.storeItemImageUrl,
    durationDays: c.durationDays ?? 3,
    aristocracyLevel: c.aristocracyLevel,
    aristocracyDays: c.aristocracyDays,
  };
}

export const getCheckinStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const today = getUtcDay();
    const todayCheckin = await ctx.db
      .query("dailyCheckins")
      .withIndex("by_user_and_day", (q) => q.eq("userId", userId).eq("day", today))
      .unique();
    const yesterday = today - 1;
    const yesterdayCheckin = await ctx.db
      .query("dailyCheckins")
      .withIndex("by_user_and_day", (q) => q.eq("userId", userId).eq("day", yesterday))
      .unique();
    const checkedInToday = !!todayCheckin;
    let currentStreak = 0;
    if (checkedInToday) currentStreak = todayCheckin.streak;
    else if (yesterdayCheckin) currentStreak = yesterdayCheckin.streak;
    const nextDay = checkedInToday ? currentStreak : currentStreak + 1;
    const nextRewardIndex = Math.min((nextDay - 1) % 7, 6);
    const msUntilReset = 86400000 - (Date.now() % 86400000);
    // قراءة المكافآت من DB إذا وُجدت
    const dbConfigs = await ctx.db.query("dailyCheckinConfig").collect();
    const rewards = dbConfigs.length >= 7
      ? dbConfigs.sort((a, b) => a.day - b.day).map(dbConfigToReward)
      : CHECKIN_REWARDS;
    return { checkedInToday, currentStreak, nextDay, nextRewardIndex, rewards, msUntilReset };
  },
});

export const claimDailyCheckin = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const today = getUtcDay();
    const existing = await ctx.db
      .query("dailyCheckins")
      .withIndex("by_user_and_day", (q) => q.eq("userId", userId).eq("day", today))
      .unique();
    if (existing) throw new Error("لقد سجّلت دخولك اليوم بالفعل!");
    const yesterday = today - 1;
    const yesterdayCheckin = await ctx.db
      .query("dailyCheckins")
      .withIndex("by_user_and_day", (q) => q.eq("userId", userId).eq("day", yesterday))
      .unique();
    const streak = yesterdayCheckin ? yesterdayCheckin.streak + 1 : 1;
    const rewardIndex = Math.min((streak - 1) % 7, 6);

    // قراءة المكافأة من DB أو الافتراضية
    const dbConfigs = await ctx.db.query("dailyCheckinConfig").collect();
    let reward: any;
    if (dbConfigs.length >= 7) {
      const sorted = dbConfigs.sort((a, b) => a.day - b.day);
      reward = dbConfigToReward(sorted[rewardIndex]);
    } else {
      reward = CHECKIN_REWARDS[rewardIndex];
    }

    await ctx.db.insert("dailyCheckins", {
      userId, day: today, streak,
      rewardCoins: reward.coins ?? 0,
      rewardVipDays: reward.vipDays ?? 0,
      rewardVipLevel: reward.vipLevel ?? 0,
      createdAt: Date.now(),
    });

    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (profile) {
      // عملات
      if ((reward.coins ?? 0) > 0) {
        await ctx.db.patch(profile._id, { goldCoins: (profile.goldCoins ?? 0) + reward.coins });
      }
      // VIP
      if ((reward.vipDays ?? 0) > 0 && (reward.vipLevel ?? 0) > 0) {
        const now = Date.now();
        const currentExpiry = profile.vipExpiresAt && profile.vipExpiresAt > now ? profile.vipExpiresAt : now;
        await ctx.db.patch(profile._id, {
          isVip: true,
          vipLevel: Math.max(profile.vipLevel ?? 0, reward.vipLevel),
          vipExpiresAt: currentExpiry + reward.vipDays * 86400000,
        });
      }
      // استقراطية
      if (reward.rewardType === "aristocracy" && (reward.aristocracyLevel ?? 0) > 0 && (reward.aristocracyDays ?? 0) > 0) {
        const now = Date.now();
        const currentExpiry = (profile as any).aristocracyExpiresAt && (profile as any).aristocracyExpiresAt > now
          ? (profile as any).aristocracyExpiresAt : now;
        await ctx.db.patch(profile._id, {
          aristocracyLevel: Math.max((profile as any).aristocracyLevel ?? 0, reward.aristocracyLevel),
          aristocracyExpiresAt: currentExpiry + reward.aristocracyDays * 86400000,
        });
      }
      // إطار أو دخولية — أضف للحقيبة
      if ((reward.rewardType === "frame" || reward.rewardType === "entry") && reward.storeItemId) {
        const existing2 = await ctx.db.query("userStoreItems")
          .withIndex("by_user_and_type", (q) => q.eq("userId", userId).eq("type", reward.rewardType))
          .collect();
        if (!existing2.some((i: any) => i.storeItemId === reward.storeItemId)) {
          await ctx.db.insert("userStoreItems", {
            userId, storeItemId: reward.storeItemId, type: reward.rewardType,
            name: reward.storeItemName, imageUrl: reward.storeItemImageUrl,
            isActive: false, purchasedAt: Date.now(),
            expiresAt: Date.now() + (reward.durationDays ?? 3) * 86400000,
          });
        }
      }
      // هدية — أضف للمخزون
      if (reward.rewardType === "gift" && reward.giftId) {
        const existingGift = await ctx.db.query("giftInventory")
          .withIndex("by_user_and_gift", (q) => q.eq("userId", userId).eq("giftId", reward.giftId))
          .unique();
        if (existingGift) {
          await ctx.db.patch(existingGift._id, { quantity: existingGift.quantity + 1 });
        } else {
          const giftDoc = await ctx.db.get(reward.giftId);
          await ctx.db.insert("giftInventory", {
            userId,
            giftId: reward.giftId,
            giftName: reward.giftName ?? giftDoc?.name ?? "",
            giftImageUrl: reward.giftImageUrl ?? giftDoc?.imageUrl,
            quantity: 1,
            createdAt: Date.now(),
          });
        }
      }
    }
    return { success: true, reward, streak };
  },
});

export const getDailyTasksStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const today = getUtcDay();
    const progresses = await ctx.db
      .query("dailyTaskProgress")
      .withIndex("by_user_and_day", (q) => q.eq("userId", userId).eq("day", today))
      .collect();
    const progressMap: Record<string, any> = {};
    for (const p of progresses) progressMap[p.taskId] = p;
    const msUntilReset = 86400000 - (Date.now() % 86400000);
    return {
      tasks: DAILY_TASKS.map((task) => {
        const prog = progressMap[task.id];
        return {
          ...task,
          progress: prog?.progress ?? 0,
          completed: prog?.completed ?? false,
          rewardClaimed: prog?.rewardClaimed ?? false,
        };
      }),
      msUntilReset,
    };
  },
});

export const claimTaskReward = mutation({
  args: { taskId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("غير مصرح");
    const today = getUtcDay();
    const task = DAILY_TASKS.find((t) => t.id === args.taskId);
    if (!task) throw new Error("المهمة غير موجودة");
    const progress = await ctx.db
      .query("dailyTaskProgress")
      .withIndex("by_user_and_task_and_date", (q) =>
        q.eq("userId", userId).eq("taskId", args.taskId).eq("date", String(today))
      )
      .unique();
    if (!progress?.completed) throw new Error("لم تكمل المهمة بعد");
    if (progress?.rewardClaimed) throw new Error("تم استلام المكافأة بالفعل");
    await ctx.db.patch(progress._id, { rewardClaimed: true });
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (profile && task.rewardCoins > 0) {
      await ctx.db.patch(profile._id, { goldCoins: (profile.goldCoins ?? 0) + task.rewardCoins });
    }
    return { success: true, reward: task.rewardCoins };
  },
});

export const updateTaskProgress = internalMutation({
  args: {
    userId: v.id("users"),
    taskId: v.string(),
    increment: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const today = getUtcDay();
    const task = DAILY_TASKS.find((t) => t.id === args.taskId);
    if (!task) return;
    const existing = await ctx.db
      .query("dailyTaskProgress")
      .withIndex("by_user_and_task_and_date", (q) =>
        q.eq("userId", args.userId).eq("taskId", args.taskId).eq("date", String(today))
      )
      .unique();
    const increment = args.increment ?? 1;
    if (existing) {
      if (existing.completed) return;
      const newProgress = Math.min(existing.progress + increment, task.target);
      const completed = newProgress >= task.target;
      await ctx.db.patch(existing._id, { progress: newProgress, completed, day: today });
    } else {
      const newProgress = Math.min(increment, task.target);
      const completed = newProgress >= task.target;
      await ctx.db.insert("dailyTaskProgress", {
        userId: args.userId, taskId: args.taskId, date: String(today), day: today,
        progress: newProgress, completed, rewardClaimed: false, createdAt: Date.now(),
      });
    }
  },
});
