import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const profileTables = {
  profiles: defineTable({
    userId: v.id("users"),
    name: v.string(),
    sakiId: v.string(),
    premiumSakiId: v.optional(v.string()),
    country: v.string(),
    gender: v.union(v.literal("male"), v.literal("female")),
    avatarStorageId: v.optional(v.id("_storage")),
    avatarUrl: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    coverUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    goldCoins: v.optional(v.number()),
    diamonds: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    isVip: v.optional(v.boolean()),
    vipLevel: v.optional(v.number()),
    vipExpiresAt: v.optional(v.number()),
    vipCycleCharged: v.optional(v.number()),
    vipCycleStartedAt: v.optional(v.number()),
    isSuperAdmin: v.optional(v.boolean()),
    isAdmin: v.optional(v.boolean()),
    isBd: v.optional(v.boolean()),
    isPro: v.optional(v.boolean()),
    proLevel: v.optional(v.number()),
    proExpiresAt: v.optional(v.number()),
    proSettings: v.optional(v.object({
      glowingName: v.boolean(),
      lionEntry: v.boolean(),
      antiKick: v.boolean(),
      privateProfile: v.boolean(),
      hideRoomPresence: v.boolean(),
    })),
    adminPermissions: v.optional(v.array(v.string())),
    isAgent: v.optional(v.boolean()),
    bdAssignedAt: v.optional(v.number()),
    bdWelcomePackagesSent: v.optional(v.number()),
    hideRoomPresence: v.optional(v.boolean()),
    isPrivateProfile: v.optional(v.boolean()),
    familyId: v.optional(v.id("families")),
    coinsReceivedInRoom: v.optional(v.number()),
    followersCount: v.optional(v.number()),
    followingCount: v.optional(v.number()),
    totalCoinsSent: v.optional(v.number()),
    totalCoinsReceived: v.optional(v.number()),
    wealthLevel: v.optional(v.number()),
    charismaLevel: v.optional(v.number()),
    activeFrameId: v.optional(v.union(v.id("storeItems"), v.string())),
    activeEntryId: v.optional(v.union(v.id("storeItems"), v.string())),
    activeBubbleId: v.optional(v.union(v.id("storeItems"), v.string())),
    activeSeatSkinId: v.optional(v.union(v.id("storeItems"), v.string())),
    isBanned: v.optional(v.boolean()),
    banReason: v.optional(v.string()),
    bannedAt: v.optional(v.number()),
    bannedBy: v.optional(v.id("users")),
    banExpiresAt: v.optional(v.number()),
    banDuration: v.optional(v.string()),
    securityViolations: v.optional(v.number()),
    lastSecurityCheck: v.optional(v.number()),
    lastOnline: v.optional(v.number()),
    aristocracyLevel: v.optional(v.number()),
    aristocracyExpiresAt: v.optional(v.number()),
    aristocracyLastDailyClaim: v.optional(v.number()),
    profileBgStorageId: v.optional(v.id("_storage")),
    profileBgUrl: v.optional(v.string()),
    newUserRewardClaimed: v.optional(v.boolean()),
    newUserBadgeExpiresAt: v.optional(v.number()),
    newUserEntryExpiresAt: v.optional(v.number()),
    newUserFrameExpiresAt: v.optional(v.number()),
    bdWelcomePackageReceivedAt: v.optional(v.number()),
    hasNewUserFrame: v.optional(v.boolean()),
    referralCode: v.optional(v.string()),
    referralCount: v.optional(v.number()),
    referredByCode: v.optional(v.string()),
    referredByUserId: v.optional(v.id("users")),
    referralChargeEarnings: v.optional(v.number()),
    isSakiAmbassador: v.optional(v.boolean()),
    ambassadorSince: v.optional(v.number()),
    isDivorced: v.optional(v.boolean()),
    divorcedAt: v.optional(v.number()),
    divorcedFromUserId: v.optional(v.id("users")),
    isCustomerService: v.optional(v.boolean()),
    superAdminBadgeUrl: v.optional(v.string()),
    superAdminFrameUrl: v.optional(v.string()),
    superAdminBadgeStorageId: v.optional(v.id("_storage")),
    superAdminFrameStorageId: v.optional(v.id("_storage")),
    isMomentsKing: v.optional(v.boolean()),
    isMomentWriter: v.optional(v.boolean()),
    isMillionaireTitle: v.optional(v.boolean()),
    isReelsKing: v.optional(v.boolean()),
    isContentCreator: v.optional(v.boolean()),
    weeklyStarTitle: v.optional(v.object({ title: v.string(), iconUrl: v.optional(v.string()), expiresAt: v.number() })),
    totalCoinsCharged: v.optional(v.number()),
    totalMomentsPosted: v.optional(v.number()),
    totalMomentsLikesReceived: v.optional(v.number()),
    sakiIdIconStorageId: v.optional(v.id("_storage")),
    sakiIdIconUrl: v.optional(v.string()),
    sakiIdGradient: v.optional(v.string()),
    sakiIdCustomColor1: v.optional(v.string()),
    sakiIdCustomColor2: v.optional(v.string()),
    forcedLogoutAt: v.optional(v.number()),
    adminTitle: v.optional(v.string()),
    adminTitleColor1: v.optional(v.string()),
    adminTitleColor2: v.optional(v.string()),
    adminTitleIconUrl: v.optional(v.string()),
    adminTitleIconStorageId: v.optional(v.id("_storage")),
    adminTitleBg: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_sakiId", ["sakiId"])
    .index("by_banned", ["isBanned"])
    .index("by_referralCode", ["referralCode"]),
};

const securityTables = {
  deviceBans: defineTable({
    fingerprint: v.string(),
    userId: v.optional(v.id("users")),
    bannedBy: v.id("users"),
    reason: v.optional(v.string()),
    banExpiresAt: v.optional(v.number()),
    banDuration: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_fingerprint", ["fingerprint"])
    .index("by_userId", ["userId"]),
  deviceRegistry: defineTable({
    fingerprint: v.string(),
    userId: v.id("users"),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    lastSeen: v.number(),
    createdAt: v.number(),
  })
    .index("by_fingerprint", ["fingerprint"])
    .index("by_userId", ["userId"])
    .index("by_fingerprint_and_user", ["fingerprint", "userId"]),
  securityLogs: defineTable({
    userId: v.optional(v.id("users")),
    eventType: v.string(),
    fingerprint: v.optional(v.string()),
    details: v.optional(v.string()),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_severity", ["severity"])
    .index("by_createdAt", ["createdAt"]),
  rateLimitLogs: defineTable({
    userId: v.id("users"),
    action: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_action", ["userId", "action"]),
};

const roomTables = {
  rooms: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    roomNotice: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    coverUrl: v.optional(v.string()),
    type: v.optional(v.string()),
    background: v.optional(v.string()),
    isLocked: v.optional(v.boolean()),
    password: v.optional(v.string()),
    isVipOnly: v.optional(v.boolean()),
    maxSeats: v.optional(v.number()),
    totalCoinsReceived: v.optional(v.number()),
    totalCoinsSpent: v.optional(v.number()),
    likesCount: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    country: v.optional(v.string()),
    memberCount: v.optional(v.number()),
    roomNumericId: v.optional(v.string()),
    roomTheme: v.optional(v.string()),
    isFeatured: v.optional(v.boolean()),
    isOfficial: v.optional(v.boolean()),
    isAdminLocked: v.optional(v.boolean()),
    adminLockReason: v.optional(v.string()),
    isLive: v.optional(v.boolean()),
    lockedSeats: v.optional(v.array(v.number())),
    seatAccessMode: v.optional(v.string()),
    musicVolume: v.optional(v.number()),
    activeMusicId: v.optional(v.id("roomMusic")),
    activeMusicUrl: v.optional(v.string()),
    activeMusicName: v.optional(v.string()),
    activeMusicUploader: v.optional(v.string()),
    youtubeVideoId: v.optional(v.string()),
    youtubeVideoStartedAt: v.optional(v.number()),
    youtubeIsPlaying: v.optional(v.boolean()),
    youtubePosition: v.optional(v.number()),
    youtubeIsMuted: v.optional(v.boolean()),
    youtubeVolume: v.optional(v.number()),
    bgColor: v.optional(v.string()),
    bgStorageId: v.optional(v.id("_storage")),
    bgImageUrl: v.optional(v.string()),
    bgPresetKey: v.optional(v.string()),
    bgCustomExpiresAt: v.optional(v.number()),
    hideRoyalSeats: v.optional(v.boolean()),
    roomPassword: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isPinned: v.optional(v.boolean()),
    pinnedOrder: v.optional(v.number()),
    todayCoins: v.optional(v.number()),
    todayCoinsDate: v.optional(v.string()),
    footballStreamUrl: v.optional(v.string()),
    heartsCount: v.optional(v.number()),
    // Added for Ahleen-style Room Settings & Membership
    micPermission: v.optional(v.string()), // "all", "members", "admins"
    seatPermission: v.optional(v.string()), // "all", "members", "admins"
    membershipPrice: v.optional(v.number()), // Gold coins required to join room membership
    roomDecorationStyle: v.optional(v.string()), // Decoration theme style key
    roomCategory: v.optional(v.string()), // Room category (music, games, etc.)
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_active", ["isActive"])
    .index("by_country", ["country"])
    .index("by_featured", ["isFeatured"])
    .index("by_pinned", ["isPinned"]),
  roomPresence: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    joinedAt: v.number(),
    lastSeen: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_user", ["userId"])
    .index("by_room_and_user", ["roomId", "userId"]),
  roomMembers: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    role: v.optional(v.string()),
    isMuted: v.optional(v.boolean()),
    isChatMuted: v.optional(v.boolean()),
    mutedByName: v.optional(v.string()),
    chatMutedByName: v.optional(v.string()),
    seatIndex: v.optional(v.number()),
    seatStartedAt: v.optional(v.number()),
    isPaidMember: v.optional(v.boolean()),
    membershipJoinedAt: v.optional(v.number()),
    membershipPricePaid: v.optional(v.number()),
    joinedAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_user", ["userId"])
    .index("by_room_and_user", ["roomId", "userId"]),
  roomMembershipPayments: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    ownerId: v.id("users"),
    amount: v.number(),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_user", ["userId"])
    .index("by_room_and_user", ["roomId", "userId"]),
  roomRewardSettings: defineTable({
    roomId: v.id("rooms"),
    enabled: v.boolean(),
    giftRate: v.number(),
    membershipRate: v.number(),
    luckyRate: v.number(),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
  }).index("by_room", ["roomId"]),
  roomRewardClaims: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    dayKey: v.string(),
    points: v.number(),
    rate: v.number(),
    amount: v.number(),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_day", ["roomId", "dayKey"])
    .index("by_user_and_day", ["userId", "dayKey"]),
  roomSeats: defineTable({
    roomId: v.id("rooms"),
    seatIndex: v.number(),
    userId: v.optional(v.id("users")),
    isMuted: v.optional(v.boolean()),
    isLocked: v.optional(v.boolean()),
    isSpeaking: v.optional(v.boolean()),
    updatedAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_seat", ["roomId", "seatIndex"])
    .index("by_room_and_user", ["roomId", "userId"]),
  roomMessages: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    content: v.string(),
    type: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_room", ["roomId"]),
  roomAdmins: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    role: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    grantedAt: v.optional(v.number()),
  })
    .index("by_room", ["roomId"])
    .index("by_user", ["userId"])
    .index("by_room_and_user", ["roomId", "userId"]),
  roomBans: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    bannedBy: v.id("users"),
    bannedByName: v.optional(v.string()),
    reason: v.optional(v.string()),
    banDuration: v.optional(v.string()),
    banExpiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_user", ["userId"])
    .index("by_room_and_user", ["roomId", "userId"]),
  roomKicks: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    kickedBy: v.id("users"),
    kickedByName: v.optional(v.string()),
    kickDuration: v.optional(v.string()),
    kickExpiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_user", ["userId"])
    .index("by_room_and_user", ["roomId", "userId"]),
  roomMusic: defineTable({
    roomId: v.id("rooms"),
    uploaderId: v.id("users"),
    name: v.string(),
    audioStorageId: v.id("_storage"),
    audioUrl: v.optional(v.string()),
    duration: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_uploader", ["roomId", "uploaderId"]),
  karaokeQueue: defineTable({
    roomId: v.id("rooms"),
    trackId: v.id("roomMusic"),
    singerId: v.id("users"),
    singerName: v.optional(v.string()),
    status: v.union(v.literal("queued"), v.literal("singing"), v.literal("done"), v.literal("skipped")),
    position: v.number(),
    addedAt: v.number(),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_status", ["roomId", "status"])
    .index("by_room_and_singer", ["roomId", "singerId"]),
  roomEmojis: defineTable({
    roomId: v.optional(v.id("rooms")),
    uploaderId: v.optional(v.id("users")),
    createdBy: v.optional(v.id("users")),
    name: v.string(),
    imageStorageId: v.id("_storage"),
    imageUrl: v.optional(v.string()),
    isVipOnly: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    emojiType: v.optional(v.union(v.literal("normal"), v.literal("vip"))),
    svgaStorageId: v.optional(v.id("_storage")),
    svgaUrl: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.id("_storage")),
    thumbnailUrl: v.optional(v.string()),
    isAnimated: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_active", ["isActive"])
    .index("by_type", ["emojiType"]),
  roomEmojiEvents: defineTable({
    roomId: v.id("rooms"),
    seatIndex: v.number(),
    emojiId: v.id("roomEmojis"),
    imageUrl: v.string(),
    svgaUrl: v.optional(v.string()),
    isAnimated: v.optional(v.boolean()),
    emojiType: v.optional(v.string()),
    senderName: v.string(),
    createdAt: v.number(),
  }).index("by_room", ["roomId"]),
  roomLikes: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_user", ["roomId", "userId"]),
  roomFollowers: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_user", ["userId"])
    .index("by_room_and_user", ["roomId", "userId"]),
  roomAnnouncements: defineTable({
    roomId: v.id("rooms"),
    creatorId: v.id("users"),
    content: v.string(),
    isPinned: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"]),
  roomPolls: defineTable({
    roomId: v.id("rooms"),
    creatorId: v.id("users"),
    question: v.string(),
    options: v.array(v.string()),
    isActive: v.boolean(),
    endsAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_active", ["roomId", "isActive"]),
  roomPollVotes: defineTable({
    pollId: v.id("roomPolls"),
    userId: v.id("users"),
    optionIndex: v.number(),
    createdAt: v.number(),
  })
    .index("by_poll", ["pollId"])
    .index("by_poll_and_user", ["pollId", "userId"]),
  roomGames: defineTable({
    roomId: v.id("rooms"),
    hostId: v.id("users"),
    type: v.union(v.literal("quiz"), v.literal("guess"), v.literal("trivia")),
    question: v.string(),
    answer: v.string(),
    hint: v.optional(v.string()),
    isActive: v.boolean(),
    prize: v.optional(v.number()),
    winnerId: v.optional(v.id("users")),
    winnerName: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_active", ["roomId", "isActive"]),
  roomGameAnswers: defineTable({
    gameId: v.id("roomGames"),
    userId: v.id("users"),
    answer: v.string(),
    isCorrect: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_game", ["gameId"])
    .index("by_game_and_user", ["gameId", "userId"]),
  roomHearts: defineTable({
    roomId: v.id("rooms"),
    userId: v.optional(v.id("users")),
    userName: v.string(),
    color: v.string(),
    x: v.number(),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_created", ["roomId", "createdAt"]),
  roomLogs: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    targetUserId: v.optional(v.id("users")),
    action: v.string(), // "kick", "ban", "mute", "unmute", "chat_mute", "chat_unmute", "seat_lock", "seat_unlock", "clear_messages", "invite"
    details: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_action", ["roomId", "action"])
    .index("by_room_and_created", ["roomId", "createdAt"]),
};

const bombTables = {
  roomBombLevels: defineTable({
    roomId: v.id("rooms"),
    currentLevel: v.number(),
    totalCoinsInLevel: v.number(),
    isExploding: v.optional(v.boolean()),
    explodeAt: v.optional(v.number()),
    lastExplodedLevel: v.optional(v.number()),
    lastExplodedAt: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_room", ["roomId"]),
  roomBombContributions: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    level: v.number(),
    coins: v.number(),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_level", ["roomId", "level"]),
  bombExplosionEvents: defineTable({
    roomId: v.id("rooms"),
    level: v.number(),
    totalCoins: v.optional(v.number()),
    topContributorName: v.optional(v.string()),
    topContributorCoins: v.optional(v.number()),
    topContributorAvatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_room", ["roomId"]),
  bombLevelConfig: defineTable({
    level: v.number(),
    firstPlaceVipLevel: v.optional(v.number()),
    firstPlaceVipDays: v.optional(v.number()),
    firstPlaceCoins: v.optional(v.number()),
    secondPlaceCoins: v.optional(v.number()),
    secondPlaceVipLevel: v.optional(v.number()),
    thirdPlaceCoins: v.optional(v.number()),
    thirdPlaceVipLevel: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_level", ["level"]),
};

const fruitPartyTables = {
  fruitPartyRounds: defineTable({
    status: v.string(),
    endsAt: v.number(),
    winningFruit: v.optional(v.string()),
    winnerFruit: v.optional(v.string()),
    roundNumber: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    totalPool: v.optional(v.number()),
    createdAt: v.optional(v.number()),
  })
    .index("by_status", ["status"]),
  fruitPartyBets: defineTable({
    roundId: v.id("fruitPartyRounds"),
    userId: v.id("users"),
    fruitKey: v.string(),
    amount: v.number(),
    won: v.optional(v.boolean()),
    payout: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_round", ["roundId"])
    .index("by_round_and_user", ["roundId", "userId"])
    .index("by_user", ["userId"]),
  fruitPartyLeaderboard: defineTable({
    userId: v.id("users"),
    totalWon: v.number(),
    totalBet: v.optional(v.number()),
    gamesPlayed: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
};

const gameTables = {
  rouletteSessions: defineTable({
    roomId: v.id("rooms"),
    hostUserId: v.id("users"),
    status: v.union(v.literal("betting"), v.literal("spinning"), v.literal("ended")),
    bettingEndsAt: v.number(),
    winNumber: v.optional(v.number()),
    winColor: v.optional(v.string()),
    spinStartedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_room", ["roomId"]),
  rouletteBets: defineTable({
    sessionId: v.id("rouletteSessions"),
    userId: v.id("users"),
    betType: v.string(),
    betValue: v.string(),
    amount: v.number(),
    won: v.optional(v.boolean()),
    payout: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_session_and_user", ["sessionId", "userId"]),
  rouletteGames: defineTable({
    roomId: v.id("rooms"),
    hostId: v.id("users"),
    status: v.union(v.literal("waiting"), v.literal("spinning"), v.literal("finished")),
    players: v.array(v.object({ userId: v.string(), name: v.string(), bet: v.number(), color: v.string() })),
    winnerUserId: v.optional(v.id("users")),
    winnerName: v.optional(v.string()),
    winnerColor: v.optional(v.string()),
    totalPot: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_room", ["roomId"]),
  seatBattles: defineTable({
    roomId: v.id("rooms"),
    challengerId: v.id("users"),
    challengedId: v.id("users"),
    seatIndex: v.number(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected"), v.literal("finished")),
    winnerId: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_challenged", ["challengedId"]),
  pkReadyRooms: defineTable({
    roomId: v.id("rooms"),
    ownerId: v.id("users"),
    ownerName: v.optional(v.string()),
    roomName: v.optional(v.string()),
    roomCoverUrl: v.optional(v.string()),
    memberCount: v.optional(v.number()),
    durationMinutes: v.optional(v.number()),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_owner", ["ownerId"]),
  pkContributions: defineTable({
    pkId: v.id("pkBattles"),
    roomId: v.id("rooms"),
    userId: v.id("users"),
    userName: v.string(),
    coins: v.number(),
    createdAt: v.number(),
  })
    .index("by_pk", ["pkId"])
    .index("by_pk_and_room", ["pkId", "roomId"])
    .index("by_pk_room_user", ["pkId", "roomId", "userId"]),
  pkBattles: defineTable({
    roomId: v.optional(v.id("rooms")),
    challengerId: v.optional(v.id("users")),
    challengedId: v.optional(v.id("users")),
    challengerRoomId: v.optional(v.id("rooms")),
    challengedRoomId: v.optional(v.id("rooms")),
    status: v.string(),
    challengerScore: v.optional(v.number()),
    challengedScore: v.optional(v.number()),
    winnerId: v.optional(v.string()),
    duration: v.optional(v.number()),
    durationMinutes: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
    room1Id: v.optional(v.id("rooms")),
    room2Id: v.optional(v.id("rooms")),
    room1Name: v.optional(v.string()),
    room2Name: v.optional(v.string()),
    room1OwnerId: v.optional(v.id("users")),
    room2OwnerId: v.optional(v.id("users")),
    room1OwnerName: v.optional(v.string()),
    room2OwnerName: v.optional(v.string()),
    room1Coins: v.optional(v.number()),
    room2Coins: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_challenger", ["challengerId"])
    .index("by_challenged", ["challengedId"])
    .index("by_room1", ["room1Id"])
    .index("by_room2", ["room2Id"])
    .index("by_status", ["status"]),
  cardBattles: defineTable({
    roomId: v.id("rooms"),
    player1Id: v.id("users"),
    player2Id: v.optional(v.id("users")),
    player1Card: v.optional(v.string()),
    player2Card: v.optional(v.string()),
    player1Bet: v.optional(v.number()),
    player2Bet: v.optional(v.number()),
    status: v.union(v.literal("waiting"), v.literal("playing"), v.literal("finished")),
    winnerId: v.optional(v.id("users")),
    createdAt: v.number(),
  }).index("by_room", ["roomId"]),
  millionaireGames: defineTable({
    roomId: v.id("rooms"),
    hostId: v.id("users"),
    currentPlayerId: v.optional(v.id("users")),
    status: v.union(v.literal("waiting"), v.literal("active"), v.literal("finished")),
    currentQuestion: v.optional(v.number()),
    currentPrize: v.optional(v.number()),
    usedLifelines: v.optional(v.array(v.string())),
    lastAnswerAt: v.optional(v.number()),
    winnerId: v.optional(v.id("users")),
    finalPrize: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_room", ["roomId"]),
  inRoomPKBattles: defineTable({
    roomId: v.id("rooms"),
    hostId: v.id("users"),
    team1Name: v.string(),
    team2Name: v.string(),
    team1Coins: v.number(),
    team2Coins: v.number(),
    status: v.union(v.literal("active"), v.literal("finished")),
    winnerTeam: v.optional(v.union(v.literal("team1"), v.literal("team2"), v.literal("draw"))),
    durationMinutes: v.number(),
    startedAt: v.number(),
    endsAt: v.number(),
    finishedAt: v.optional(v.number()),
    isFeverTime: v.optional(v.boolean()),
    createdAt: v.number(),
  }).index("by_room", ["roomId"]),
  inRoomPKContributions: defineTable({
    pkId: v.id("inRoomPKBattles"),
    roomId: v.id("rooms"),
    userId: v.id("users"),
    userName: v.string(),
    userAvatarUrl: v.optional(v.string()),
    team: v.union(v.literal("team1"), v.literal("team2")),
    coins: v.number(),
    createdAt: v.number(),
  })
    .index("by_pk", ["pkId"])
    .index("by_pk_user", ["pkId", "userId"]),
  inRoomPKMembers: defineTable({
    pkId: v.id("inRoomPKBattles"),
    roomId: v.id("rooms"),
    userId: v.id("users"),
    userName: v.string(),
    userAvatarUrl: v.optional(v.string()),
    team: v.union(v.literal("team1"), v.literal("team2")),
    joinedAt: v.number(),
  })
    .index("by_pk", ["pkId"])
    .index("by_pk_user", ["pkId", "userId"]),
};

const messageTables = {
  messages: defineTable({
    senderId: v.id("users"),
    receiverId: v.optional(v.id("users")),
    roomId: v.optional(v.id("rooms")),
    content: v.string(),
    type: v.optional(v.string()),
    isRead: v.optional(v.boolean()),
    imageStorageId: v.optional(v.id("_storage")),
    giftEmoji: v.optional(v.string()),
    giftName: v.optional(v.string()),
    giftImageUrl: v.optional(v.string()),
    giftQuantity: v.optional(v.number()),
    luckMultiplier: v.optional(v.number()),
    luckWinAmount: v.optional(v.number()),
    receiverName: v.optional(v.string()),
    senderName: v.optional(v.string()),
    luckyBagCoins: v.optional(v.number()),
    luckyBagRecipients: v.optional(v.number()),
    senderAvatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_sender_and_receiver", ["senderId", "receiverId"])
    .index("by_room", ["roomId"]),
  directMessages: defineTable({
    senderId: v.id("users"),
    receiverId: v.id("users"),
    content: v.string(),
    type: v.optional(v.string()),
    isRead: v.optional(v.boolean()),
    imageStorageId: v.optional(v.id("_storage")),
    videoStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    voiceStorageId: v.optional(v.id("_storage")),
    voiceUrl: v.optional(v.string()),
    voiceDuration: v.optional(v.number()),
    replyToId: v.optional(v.id("directMessages")),
    replyToContent: v.optional(v.string()),
    replyToSenderName: v.optional(v.string()),
    reactions: v.optional(v.array(v.object({ emoji: v.string(), userId: v.string() }))),
    reelId: v.optional(v.string()),
    reelVideoUrl: v.optional(v.string()),
    reelThumbnailUrl: v.optional(v.string()),
    reelCaption: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_sender_and_receiver", ["senderId", "receiverId"])
    .index("by_receiver_and_read", ["receiverId", "isRead"]),
};

const roomSeatInvitesTable = {
  roomSeatInvites: defineTable({
    roomId: v.id("rooms"),
    senderId: v.optional(v.id("users")),
    targetUserId: v.optional(v.id("users")),
    fromUserId: v.optional(v.id("users")),
    toUserId: v.optional(v.id("users")),
    seatIndex: v.number(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected"), v.literal("expired")),
    expiresAt: v.optional(v.number()),
    respondedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_target", ["targetUserId"])
    .index("by_room_and_user", ["roomId", "targetUserId"]),
};

export default defineSchema({
  ...authTables,
  ...roomSeatInvitesTable,
  ...profileTables,
  ...securityTables,
  ...roomTables,
  ...bombTables,
  ...fruitPartyTables,
  ...gameTables,
  ...messageTables,
  visitors: defineTable({
    visitedUserId: v.id("users"),
    visitorUserId: v.id("users"),
    visitedAt: v.number(),
  })
    .index("by_visited", ["visitedUserId"])
    .index("by_visitor", ["visitorUserId"])
    .index("by_visited_and_visitor", ["visitedUserId", "visitorUserId"]),
  profileVisitors: defineTable({
    profileOwnerId: v.id("users"),
    visitorId: v.id("users"),
    visitorName: v.optional(v.string()),
    visitorAvatarUrl: v.optional(v.string()),
    visitorVipLevel: v.optional(v.number()),
    visitorIsVip: v.optional(v.boolean()),
    visitedAt: v.number(),
  })
    .index("by_owner", ["profileOwnerId"])
    .index("by_visitor", ["visitorId"])
    .index("by_owner_and_visitor", ["profileOwnerId", "visitorId"]),
  follows: defineTable({
    followerId: v.id("users"),
    followedId: v.optional(v.id("users")),
    followingId: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_follower", ["followerId"])
    .index("by_followed", ["followedId"])
    .index("by_following", ["followingId"])
    .index("by_follower_and_followed", ["followerId", "followedId"])
    .index("by_follower_and_following", ["followerId", "followingId"]),
  friends: defineTable({
    userId: v.id("users"),
    friendId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("blocked")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_friend", ["friendId"])
    .index("by_user_and_friend", ["userId", "friendId"]),
  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    data: v.optional(v.string()),
    isRead: v.optional(v.boolean()),
    fromUserId: v.optional(v.id("users")),
    fromUserName: v.optional(v.string()),
    fromUserAvatar: v.optional(v.string()),
    actorUserId: v.optional(v.id("users")),
    refId: v.optional(v.string()),
    cpRingId: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_read", ["userId", "isRead"]),
  storeItems: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(),
    price: v.number(),
    imageStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    videoStorageId: v.optional(v.id("_storage")),
    videoUrl: v.optional(v.string()),
    svgaStorageId: v.optional(v.id("_storage")),
    svgaUrl: v.optional(v.string()),
    soundStorageId: v.optional(v.id("_storage")),
    soundUrl: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.id("_storage")),
    thumbnailUrl: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    durationDays: v.optional(v.number()),
    category: v.optional(v.string()),
    cpStatus: v.optional(v.string()),
    cpPartnerId: v.optional(v.id("users")),
    partnerId: v.optional(v.id("users")),
    isActive2: v.optional(v.boolean()),
    expiresAt: v.optional(v.number()),
    activatedAt: v.optional(v.number()),
    showFullScreen: v.optional(v.boolean()),
    mediaType: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    mediaStorageId: v.optional(v.id("_storage")),
    mediaUrl: v.optional(v.string()),
    frameScale: v.optional(v.number()),
    isVipFrame: v.optional(v.boolean()),
    vipFrameMinLevel: v.optional(v.number()),
    isSuperAdminFrame: v.optional(v.boolean()),
    isVipSeatSkin: v.optional(v.boolean()),
    vipSeatSkinMinLevel: v.optional(v.number()),
    isVipEntry: v.optional(v.boolean()),
    vipEntryMinLevel: v.optional(v.number()),
    isVipBubble: v.optional(v.boolean()),
    vipBubbleMinLevel: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_active", ["isActive"])
    .index("by_category", ["category"]),
  userStoreItems: defineTable({
    userId: v.id("users"),
    storeItemId: v.id("storeItems"),
    type: v.string(),
    isActive: v.optional(v.boolean()),
    expiresAt: v.optional(v.number()),
    purchasedAt: v.number(),
    cpStatus: v.optional(v.string()),
    cpPartnerId: v.optional(v.id("users")),
    partnerId: v.optional(v.id("users")),
    activatedAt: v.optional(v.number()),
    createdAt: v.optional(v.number()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    receivedFromUserId: v.optional(v.id("users")),
    sentToUserId: v.optional(v.id("users")),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "type"])
    .index("by_user_and_item", ["userId", "storeItemId"]),
  customGifts: defineTable({
    name: v.string(),
    emoji: v.optional(v.string()),
    price: v.number(),
    imageStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    videoStorageId: v.optional(v.id("_storage")),
    videoUrl: v.optional(v.string()),
    svgaStorageId: v.optional(v.id("_storage")),
    svgaUrl: v.optional(v.string()),
    soundStorageId: v.optional(v.id("_storage")),
    soundUrl: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.id("_storage")),
    thumbnailUrl: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    showFullScreen: v.optional(v.boolean()),
    mediaType: v.optional(v.string()),
    category: v.optional(v.string()),
    luckMultiplierMax: v.optional(v.number()),
    alphaMaskColorFraction: v.optional(v.number()),
    alphaMaskInvert: v.optional(v.boolean()),
    alphaMaskSide: v.optional(v.string()),
    alphaMaskThreshold: v.optional(v.number()),
    creatorId: v.optional(v.id("users")),
    isPKGift: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_category", ["category"]),
  giftEvents: defineTable({
    roomId: v.id("rooms"),
    senderId: v.id("users"),
    receiverId: v.id("users"),
    giftId: v.optional(v.id("customGifts")),
    customGiftId: v.optional(v.id("customGifts")),
    senderName: v.string(),
    receiverName: v.string(),
    senderAvatarUrl: v.optional(v.string()),
    receiverAvatarUrl: v.optional(v.string()),
    giftName: v.string(),
    giftEmoji: v.optional(v.string()),
    giftImageUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    svgaUrl: v.optional(v.string()),
    soundUrl: v.optional(v.string()),
    price: v.number(),
    quantity: v.optional(v.number()),
    showFullScreen: v.optional(v.boolean()),
    mediaType: v.optional(v.string()),
    luckMultiplier: v.optional(v.number()),
    luckWinAmount: v.optional(v.number()),
    alphaMaskColorFraction: v.optional(v.number()),
    alphaMaskInvert: v.optional(v.boolean()),
    alphaMaskSide: v.optional(v.string()),
    alphaMaskThreshold: v.optional(v.number()),
    isGlobal: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_global", ["isGlobal"])
    .index("by_receiver", ["receiverId"]),
  families: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    ownerName: v.optional(v.string()),
    description: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    logoUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    avatarUrl: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    coverUrl: v.optional(v.string()),
    country: v.optional(v.string()),
    familyLevel: v.optional(v.number()),
    rankKey: v.optional(v.string()),
    memberCount: v.optional(v.number()),
    totalCoins: v.optional(v.number()),
    ownerDiamonds: v.optional(v.number()),
    totalDiamonds: v.optional(v.number()),
    totalPoints: v.optional(v.number()),
    weeklyPoints: v.optional(v.number()),
    aginsId: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    announcement: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_active", ["isActive"]),
  familyMembers: defineTable({
    familyId: v.id("families"),
    userId: v.id("users"),
    role: v.optional(v.string()),
    diamonds: v.optional(v.number()),
    pointsContributed: v.optional(v.number()),
    lastActiveAt: v.optional(v.number()),
    joinedAt: v.number(),
  })
    .index("by_family", ["familyId"])
    .index("by_user", ["userId"])
    .index("by_family_and_user", ["familyId", "userId"]),
  familyJoinRequests: defineTable({
    familyId: v.id("families"),
    userId: v.id("users"),
    userName: v.optional(v.string()),
    userAvatarUrl: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
    createdAt: v.number(),
  })
    .index("by_family", ["familyId"])
    .index("by_user", ["userId"])
    .index("by_family_and_user", ["familyId", "userId"]),
  vipConfigs: defineTable({
    level: v.number(),
    name: v.string(),
    price: v.number(),
    durationDays: v.number(),
    badgeStorageId: v.optional(v.id("_storage")),
    badgeUrl: v.optional(v.string()),
    frameStorageId: v.optional(v.id("_storage")),
    frameUrl: v.optional(v.string()),
    titleStorageId: v.optional(v.id("_storage")),
    titleUrl: v.optional(v.string()),
    chatBubbleStorageId: v.optional(v.id("_storage")),
    chatBubbleUrl: v.optional(v.string()),
    nameColor: v.optional(v.string()),
    nameGradient: v.optional(v.string()),
    nameAnimation: v.optional(v.string()),
    benefits: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
  }).index("by_level", ["level"]),
  vipPurchases: defineTable({
    userId: v.id("users"),
    level: v.number(),
    price: v.number(),
    durationDays: v.number(),
    expiresAt: v.number(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
  agentCharges: defineTable({
    agentId: v.id("users"),
    userId: v.id("users"),
    userName: v.optional(v.string()),
    userAvatarUrl: v.optional(v.string()),
    goldCoins: v.number(),
    diamonds: v.optional(v.number()),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_agent", ["agentId"])
    .index("by_user", ["userId"]),
  superAdminAssets: defineTable({
    title: v.optional(v.string()),
    badgeStorageId: v.optional(v.id("_storage")),
    badgeUrl: v.optional(v.string()),
    frameStorageId: v.optional(v.id("_storage")),
    frameUrl: v.optional(v.string()),
    updatedAt: v.number(),
  }),
  banners: defineTable({
    imageStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    linkType: v.optional(v.string()),
    linkValue: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    order: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_active", ["isActive"]),
  moments: defineTable({
    userId: v.id("users"),
    content: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    images: v.optional(v.array(v.object({ storageId: v.id("_storage"), url: v.optional(v.string()) }))),
    videoStorageId: v.optional(v.id("_storage")),
    videoUrl: v.optional(v.string()),
    likesCount: v.optional(v.number()),
    likes: v.optional(v.number()),
    likedBy: v.optional(v.array(v.string())),
    commentsCount: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    hashtags: v.optional(v.array(v.string())),
    visibility: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_active", ["isActive"]),
  momentLikes: defineTable({
    momentId: v.id("moments"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_moment", ["momentId"])
    .index("by_moment_and_user", ["momentId", "userId"]),
  momentComments: defineTable({
    momentId: v.id("moments"),
    userId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_moment", ["momentId"]),
  stories: defineTable({
    userId: v.id("users"),
    mediaStorageId: v.optional(v.id("_storage")),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.string()),
    text: v.optional(v.string()),
    viewsCount: v.optional(v.number()),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_expires", ["expiresAt"]),
  storyViews: defineTable({
    storyId: v.id("stories"),
    viewerId: v.id("users"),
    viewedAt: v.number(),
  })
    .index("by_story", ["storyId"])
    .index("by_story_and_viewer", ["storyId", "viewerId"]),
  reels: defineTable({
    userId: v.id("users"),
    videoStorageId: v.optional(v.id("_storage")),
    videoUrl: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.id("_storage")),
    thumbnailUrl: v.optional(v.string()),
    caption: v.optional(v.string()),
    likesCount: v.optional(v.number()),
    likes: v.optional(v.number()),
    likedBy: v.optional(v.array(v.string())),
    commentsCount: v.optional(v.number()),
    viewsCount: v.optional(v.number()),
    views: v.optional(v.number()),
    hashtags: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_active", ["isActive"]),
  reelLikes: defineTable({
    reelId: v.id("reels"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_reel", ["reelId"])
    .index("by_reel_and_user", ["reelId", "userId"]),
  reelComments: defineTable({
    reelId: v.id("reels"),
    userId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_reel", ["reelId"]),
  transfers: defineTable({
    senderId: v.id("users"),
    receiverId: v.id("users"),
    amount: v.number(),
    type: v.optional(v.string()),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"]),
  diamondSales: defineTable({
    sellerId: v.id("users"),
    agentId: v.optional(v.id("users")),
    diamonds: v.number(),
    coinsReceived: v.number(),
    status: v.optional(v.string()),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_seller", ["sellerId"])
    .index("by_agent", ["agentId"]),
  userReports: defineTable({
    reporterId: v.id("users"),
    reportedId: v.optional(v.id("users")),
    reason: v.string(),
    details: v.optional(v.string()),
    status: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_reporter", ["reporterId"])
    .index("by_reported", ["reportedId"]),
  supportTickets: defineTable({
    userId: v.id("users"),
    subject: v.string(),
    message: v.optional(v.string()),
    status: v.optional(v.string()),
    adminReply: v.optional(v.string()),
    lastMessageAt: v.optional(v.number()),
    userName: v.optional(v.string()),
    userSakiId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
  supportMessages: defineTable({
    ticketId: v.id("supportTickets"),
    senderId: v.id("users"),
    senderName: v.optional(v.string()),
    isAdmin: v.optional(v.boolean()),
    isRead: v.optional(v.boolean()),
    mediaStorageId: v.optional(v.id("_storage")),
    mediaType: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_ticket", ["ticketId"])
    .index("by_sender", ["senderId"]),
  luckyBags: defineTable({
    roomId: v.id("rooms"),
    senderId: v.id("users"),
    senderName: v.string(),
    senderAvatarUrl: v.optional(v.string()),
    totalCoins: v.number(),
    maxRecipients: v.number(),
    claimedCount: v.optional(v.number()),
    status: v.optional(v.string()),
    bagType: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    expiresAt: v.number(),
    createdAt: v.number(),
  }).index("by_room", ["roomId"]),
  luckyBagClaims: defineTable({
    bagId: v.id("luckyBags"),
    userId: v.id("users"),
    amount: v.optional(v.number()),
    coinsReceived: v.optional(v.number()),
    userName: v.optional(v.string()),
    claimedAt: v.number(),
  })
    .index("by_bag", ["bagId"])
    .index("by_bag_and_user", ["bagId", "userId"]),
  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"]),
  fcmSubscriptions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    platform: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_token", ["token"]),
  referrals: defineTable({
    referrerId: v.id("users"),
    referredId: v.id("users"),
    code: v.optional(v.string()),
    referralCode: v.optional(v.string()),
    status: v.optional(v.string()),
    chargeEarnings: v.optional(v.number()),
    rewardClaimed: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_referrer", ["referrerId"])
    .index("by_referred", ["referredId"])
    .index("by_code", ["code"])
    .index("by_referrer_and_referred", ["referrerId", "referredId"]),
  dailyCheckins: defineTable({
    userId: v.id("users"),
    day: v.number(),
    streak: v.optional(v.number()),
    reward: v.optional(v.number()),
    rewardCoins: v.optional(v.number()),
    rewardVipDays: v.optional(v.number()),
    rewardVipLevel: v.optional(v.number()),
    checkedInAt: v.optional(v.number()),
    createdAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_day", ["userId", "day"]),
  dailyCheckinConfig: defineTable({
    day: v.number(),
    reward: v.optional(v.number()),
    isSpecial: v.optional(v.boolean()),
    label: v.optional(v.string()),
    rewardType: v.optional(v.string()),
    giftId: v.optional(v.id("customGifts")),
    giftName: v.optional(v.string()),
    giftImageUrl: v.optional(v.string()),
    storeItemId: v.optional(v.id("storeItems")),
    storeItemName: v.optional(v.string()),
    storeItemImageUrl: v.optional(v.string()),
    durationDays: v.optional(v.number()),
    vipLevel: v.optional(v.number()),
    vipDays: v.optional(v.number()),
    aristocracyLevel: v.optional(v.number()),
    aristocracyDays: v.optional(v.number()),
    coinsAmount: v.optional(v.number()),
    coins: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    createdAt: v.optional(v.number()),
  }).index("by_day", ["day"]),
  weeklyStar: defineTable({
    userId: v.id("users"),
    weekStart: v.number(),
    coinsReceived: v.number(),
    rank: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_week", ["weekStart"]),
  weeklyStarEntries: defineTable({
    eventId: v.id("weeklyStarEvents"),
    userId: v.id("users"),
    userName: v.string(),
    userAvatarUrl: v.optional(v.string()),
    giftCount: v.number(),
    totalCoins: v.number(),
    updatedAt: v.number(),
  }).index("by_event", ["eventId"]).index("by_event_and_user", ["eventId", "userId"]),
  weeklyStarEvents: defineTable({
    weekStart: v.number(),
    weekEnd: v.optional(v.number()),
    isActive: v.boolean(),
    endsAt: v.optional(v.number()),
    giftId: v.optional(v.id("customGifts")),
    giftName: v.optional(v.string()),
    giftImageUrl: v.optional(v.string()),
    giftPrice: v.optional(v.number()),
    rewardCoins: v.optional(v.number()),
    prizePool: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_active", ["isActive"]),
  entryEffects: defineTable({
    userId: v.id("users"),
    storeItemId: v.optional(v.id("storeItems")),
    mediaStorageId: v.optional(v.id("_storage")),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
  entryEffectEvents: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    userName: v.string(),
    userAvatarUrl: v.optional(v.string()),
    proLevel: v.optional(v.number()),
    aristocracyLevel: v.optional(v.number()),
    frameUrl: v.optional(v.string()),
    frameMediaType: v.optional(v.string()),
    entryMediaUrl: v.optional(v.string()),
    entryMediaType: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_room", ["roomId"]),
  aristocracyConfigs: defineTable({
    level: v.number(),
    name: v.string(),
    price: v.number(),
    durationDays: v.number(),
    badgeStorageId: v.optional(v.id("_storage")),
    badgeUrl: v.optional(v.string()),
    frameStorageId: v.optional(v.id("_storage")),
    frameUrl: v.optional(v.string()),
    dailyCoins: v.optional(v.number()),
    benefits: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
  }).index("by_level", ["level"]),
  aristocracyLevels: defineTable({
    level: v.number(),
    name: v.string(),
    price30: v.optional(v.number()),
    price90: v.optional(v.number()),
    price365: v.optional(v.number()),
    dailyCoins: v.optional(v.number()),
    badgeStorageId: v.optional(v.id("_storage")),
    badgeUrl: v.optional(v.string()),
    frameStorageId: v.optional(v.id("_storage")),
    frameUrl: v.optional(v.string()),
    chatBubbleStorageId: v.optional(v.id("_storage")),
    chatBubbleUrl: v.optional(v.string()),
    entryEffectStorageId: v.optional(v.id("_storage")),
    entryEffectUrl: v.optional(v.string()),
    entryEffectType: v.optional(v.string()),
    heartStorageId: v.optional(v.id("_storage")),
    heartUrl: v.optional(v.string()),
    features: v.optional(v.array(v.object({ icon: v.string(), title: v.string(), desc: v.string() }))),
    createdAt: v.number(),
  }).index("by_level", ["level"]),
  aristocracyPurchases: defineTable({
    userId: v.id("users"),
    level: v.number(),
    price: v.number(),
    durationDays: v.number(),
    expiresAt: v.number(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
  aristocracyInventory: defineTable({
    ownerUserId: v.id("users"),
    level: v.number(),
    durationDays: v.number(),
    source: v.string(),
    price: v.number(),
    status: v.union(v.literal("available"), v.literal("activated"), v.literal("gifted")),
    giftedToSakiId: v.optional(v.string()),
    createdAt: v.number(),
    activatedAt: v.optional(v.number()),
  }).index("by_owner", ["ownerUserId"]).index("by_owner_status", ["ownerUserId", "status"]),
  seatSkins: defineTable({
    name: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    price: v.number(),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
  }).index("by_active", ["isActive"]),
  customBadges: defineTable({
    userId: v.optional(v.id("users")),
    name: v.string(),
    description: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    svgaStorageId: v.optional(v.id("_storage")),
    svgaUrl: v.optional(v.string()),
    mediaType: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    expiresAt: v.optional(v.number()),
    bgColor: v.optional(v.string()),
    textColor: v.optional(v.string()),
    glowColor: v.optional(v.string()),
    isGlobal: v.optional(v.boolean()),
    achievementKey: v.optional(v.string()),
    isAchievement: v.optional(v.boolean()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
  userCustomBadges: defineTable({
    userId: v.id("users"),
    badgeId: v.id("customBadges"),
    assignedAt: v.number(),
    assignedBy: v.optional(v.id("users")),
    expiresAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_badge", ["badgeId"])
    .index("by_user_and_badge", ["userId", "badgeId"]),
  titleAwards: defineTable({
    userId: v.id("users"),
    title: v.string(),
    awardedBy: v.id("users"),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
  splashAds: defineTable({
    imageStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    videoStorageId: v.optional(v.id("_storage")),
    videoUrl: v.optional(v.string()),
    title: v.optional(v.string()),
    linkType: v.optional(v.string()),
    linkValue: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    durationSeconds: v.optional(v.number()),
    mediaType: v.optional(v.string()),
    uploaderId: v.optional(v.id("users")),
    createdAt: v.number(),
  }).index("by_active", ["isActive"]),
  premiumSakiIds: defineTable({
    userId: v.id("users"),
    sakiId: v.string(),
    price: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_sakiId", ["sakiId"]),
  sakiIdStyles: defineTable({
    userId: v.id("users"),
    gradient: v.optional(v.string()),
    customColor1: v.optional(v.string()),
    customColor2: v.optional(v.string()),
    iconStorageId: v.optional(v.id("_storage")),
    iconUrl: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
  sakiWalletTransactions: defineTable({
    userId: v.id("users"),
    type: v.string(),
    amount: v.number(),
    description: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
  agentSakiWallets: defineTable({
    agentUserId: v.id("users"),
    sakiBalance: v.number(),
    totalSakiAdded: v.optional(v.number()),
    totalSakiUsed: v.optional(v.number()),
    commissionRate: v.optional(v.number()),
    updatedAt: v.number(),
    createdAt: v.number(),
  }).index("by_agent", ["agentUserId"]),
  sakiTransactions: defineTable({
    agentUserId: v.id("users"),
    adminUserId: v.optional(v.id("users")),
    targetUserId: v.optional(v.id("users")),
    targetName: v.optional(v.string()),
    targetSakiId: v.optional(v.string()),
    type: v.string(),
    sakiAmount: v.number(),
    coinsAmount: v.optional(v.number()),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_agent", ["agentUserId"])
    .index("by_target", ["targetUserId"]),
  hostAgencies: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    ownerName: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    logoUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    memberCount: v.optional(v.number()),
    totalEarnings: v.optional(v.number()),
    totalDiamonds: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    aginsId: v.optional(v.string()),
    country: v.optional(v.string()),
    status: v.optional(v.string()),
    isBanned: v.optional(v.boolean()),
    bannedAt: v.optional(v.number()),
    bannedBy: v.optional(v.id("users")),
    banReason: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_active", ["isActive"])
    .index("by_status", ["status"])
    .index("by_aginsId", ["aginsId"]),
  hostAgencyMembers: defineTable({
    agencyId: v.id("hostAgencies"),
    userId: v.id("users"),
    role: v.optional(v.string()),
    earnings: v.optional(v.number()),
    totalDiamonds: v.optional(v.number()),
    pendingDiamonds: v.optional(v.number()),
    withdrawnDiamonds: v.optional(v.number()),
    joinedAt: v.number(),
  })
    .index("by_agency", ["agencyId"])
    .index("by_user", ["userId"])
    .index("by_agency_and_user", ["agencyId", "userId"]),
  hostAgencyJoinRequests: defineTable({
    agencyId: v.id("hostAgencies"),
    userId: v.id("users"),
    userName: v.optional(v.string()),
    userAvatarUrl: v.optional(v.string()),
    userSakiId: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected"), v.literal("approved")),
    createdAt: v.number(),
  })
    .index("by_agency", ["agencyId"])
    .index("by_user", ["userId"])
    .index("by_agency_and_user", ["agencyId", "userId"]),
  subAgents: defineTable({
    agentId: v.id("users"),
    subAgentId: v.id("users"),
    commissionRate: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_agent", ["agentId"])
    .index("by_subagent", ["subAgentId"]),
  subAgentRelations: defineTable({
    parentAgentId: v.id("users"),
    subAgentId: v.id("users"),
    commissionRate: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_parent", ["parentAgentId"])
    .index("by_sub", ["subAgentId"]),
  videoCalls: defineTable({
    callerId: v.id("users"),
    receiverId: v.id("users"),
    status: v.union(v.literal("ringing"), v.literal("active"), v.literal("ended"), v.literal("missed")),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    duration: v.optional(v.number()),
    callerName: v.optional(v.string()),
    receiverName: v.optional(v.string()),
    channelName: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    totalCost: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_caller", ["callerId"])
    .index("by_receiver", ["receiverId"]),
  // Saki Live: keep legacy room co-host records compatible while supporting livestream co-hosts.
  liveCoHosts: defineTable({
    roomId: v.optional(v.id("rooms")),
    hostId: v.optional(v.id("users")),
    coHostId: v.optional(v.id("users")),
    status: v.optional(v.union(v.literal("pending"), v.literal("active"), v.literal("ended"))),
    livestreamId: v.optional(v.id("livestreams")),
    userId: v.optional(v.id("users")),
    userName: v.optional(v.string()),
    userAvatarUrl: v.optional(v.string()),
    joinedAt: v.optional(v.number()),
    createdAt: v.optional(v.number()),
  })
    .index("by_room", ["roomId"])
    .index("by_livestream", ["livestreamId"])
    .index("by_livestream_and_user", ["livestreamId", "userId"]),
  liveCoHostInvites: defineTable({
    livestreamId: v.id("livestreams"),
    hostId: v.id("users"),
    invitedUserId: v.id("users"),
    invitedUserName: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected"), v.literal("ended")),
    createdAt: v.number(),
  })
    .index("by_livestream", ["livestreamId"])
    .index("by_livestream_and_user", ["livestreamId", "invitedUserId"]),
  livePkSessions: defineTable({
    streamAId: v.id("livestreams"),
    streamBId: v.id("livestreams"),
    hostAId: v.id("users"),
    hostBId: v.id("users"),
    channelName: v.string(),
    status: v.union(v.literal("active"), v.literal("finished"), v.literal("cancelled")),
    durationSeconds: v.number(),
    startedAt: v.number(),
    endsAt: v.number(),
    scoreA: v.number(),
    scoreB: v.number(),
    winner: v.optional(v.union(v.literal("a"), v.literal("b"), v.literal("draw"))),
    createdAt: v.number(),
    endedAt: v.optional(v.number()),
  })
    .index("by_streamA", ["streamAId"])
    .index("by_streamB", ["streamBId"])
    .index("by_status", ["status"]),
  livePkInvites: defineTable({
    inviterStreamId: v.id("livestreams"),
    targetStreamId: v.id("livestreams"),
    inviterUserId: v.id("users"),
    targetUserId: v.id("users"),
    inviterName: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected"), v.literal("expired")),
    createdAt: v.number(),
  })
    .index("by_target_user", ["targetUserId"])
    .index("by_inviter_stream", ["inviterStreamId"]),
  livestreams: defineTable({
    // Legacy fields retained for existing records.
    userId: v.optional(v.id("users")),
    thumbnailUrl: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    // Saki Live fields.
    hostId: v.optional(v.id("users")),
    title: v.optional(v.string()),
    channelName: v.optional(v.string()),
    roomId: v.optional(v.id("rooms")),
    isLive: v.optional(v.boolean()),
    viewerCount: v.optional(v.number()),
    likeCount: v.optional(v.number()),
    totalCoins: v.optional(v.number()),
    country: v.optional(v.string()),
    sakiId: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_active", ["isActive"])
    .index("by_host", ["hostId"])
    .index("by_isLive", ["isLive"]),
  liveViewers: defineTable({
    livestreamId: v.id("livestreams"),
    userId: v.id("users"),
    userName: v.optional(v.string()),
    userAvatarUrl: v.optional(v.string()),
    isVip: v.optional(v.boolean()),
    vipLevel: v.optional(v.number()),
    aristocracyLevel: v.optional(v.number()),
    wealthLevel: v.optional(v.number()),
    charismaLevel: v.optional(v.number()),
    joinedAt: v.number(),
    lastSeen: v.number(),
  })
    .index("by_livestream", ["livestreamId"])
    .index("by_livestream_and_user", ["livestreamId", "userId"])
    .index("by_joinedAt", ["joinedAt"]),
  liveMessages: defineTable({
    livestreamId: v.id("livestreams"),
    userId: v.id("users"),
    content: v.string(),
    senderName: v.optional(v.string()),
    senderAvatarUrl: v.optional(v.string()),
    isVip: v.optional(v.boolean()),
    vipLevel: v.optional(v.number()),
    aristocracyLevel: v.optional(v.number()),
    type: v.optional(v.string()),
    giftName: v.optional(v.string()),
    giftEmoji: v.optional(v.string()),
    giftCoins: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_livestream", ["livestreamId"]),
  liveGiftEvents: defineTable({
    livestreamId: v.id("livestreams"),
    senderId: v.id("users"),
    senderName: v.optional(v.string()),
    senderAvatarUrl: v.optional(v.string()),
    receiverName: v.optional(v.string()),
    receiverAvatarUrl: v.optional(v.string()),
    giftName: v.string(),
    giftEmoji: v.optional(v.string()),
    giftCoins: v.number(),
    giftImageUrl: v.optional(v.string()),
    giftVideoUrl: v.optional(v.string()),
    pkSessionId: v.optional(v.id("livePkSessions")),
    quantity: v.number(),
    createdAt: v.number(),
  })
    .index("by_livestream", ["livestreamId"])
    .index("by_createdAt", ["createdAt"]),
  liveBans: defineTable({
    livestreamId: v.id("livestreams"),
    userId: v.id("users"),
    bannedBy: v.id("users"),
    reason: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_livestream", ["livestreamId"])
    .index("by_livestream_and_user", ["livestreamId", "userId"]),
  liveChatMutes: defineTable({
    livestreamId: v.id("livestreams"),
    userId: v.id("users"),
    mutedBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_livestream", ["livestreamId"])
    .index("by_livestream_and_user", ["livestreamId", "userId"]),
  chatBlocks: defineTable({
    blockerId: v.id("users"),
    blockedId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_blocker", ["blockerId"])
    .index("by_blocked", ["blockedId"])
    .index("by_blocker_and_blocked", ["blockerId", "blockedId"]),
  appBans: defineTable({
    userId: v.id("users"),
    reason: v.optional(v.string()),
    bannedBy: v.id("users"),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
  broadcastMessages: defineTable({
    senderId: v.id("users"),
    content: v.string(),
    type: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    expiresAt: v.optional(v.number()),
    senderName: v.optional(v.string()),
    senderAvatarUrl: v.optional(v.string()),
    senderSakiId: v.optional(v.string()),
    senderVipLevel: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_active", ["isActive"]),
  roomBgPurchases: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    bgKey: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_key", ["roomId", "bgKey"]),
  giftInventory: defineTable({
    userId: v.id("users"),
    giftId: v.id("customGifts"),
    giftName: v.optional(v.string()),
    quantity: v.number(),
    updatedAt: v.optional(v.number()),
    createdAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_gift", ["userId", "giftId"]),
  lucky77Games: defineTable({
    roomId: v.id("rooms"),
    hostId: v.id("users"),
    status: v.union(v.literal("waiting"), v.literal("active"), v.literal("finished")),
    targetNumber: v.optional(v.number()),
    winnerId: v.optional(v.id("users")),
    winnerName: v.optional(v.string()),
    prize: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_room", ["roomId"]),
  lucky77Bets: defineTable({
    gameId: v.id("lucky77Games"),
    userId: v.id("users"),
    number: v.number(),
    amount: v.number(),
    createdAt: v.number(),
  })
    .index("by_game", ["gameId"])
    .index("by_game_and_user", ["gameId", "userId"]),
  ludoGames: defineTable({
    roomId: v.id("rooms"),
    players: v.array(v.object({ userId: v.string(), name: v.string(), color: v.string() })),
    status: v.union(v.literal("waiting"), v.literal("active"), v.literal("finished")),
    currentTurn: v.optional(v.number()),
    winnerId: v.optional(v.id("users")),
    createdAt: v.number(),
  }).index("by_room", ["roomId"]),
  greedyCatGames: defineTable({
    roomId: v.id("rooms"),
    hostId: v.id("users"),
    status: v.union(v.literal("waiting"), v.literal("active"), v.literal("finished")),
    pot: v.optional(v.number()),
    winnerId: v.optional(v.id("users")),
    createdAt: v.number(),
  }).index("by_room", ["roomId"]),
  greedyCatRounds: defineTable({
    status: v.string(),
    endsAt: v.number(),
    winningFood: v.optional(v.string()),
    roundNumber: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    totalPool: v.optional(v.number()),
    createdAt: v.optional(v.number()),
  }).index("by_status", ["status"]),
  greedyCatBets: defineTable({
    roundId: v.id("greedyCatRounds"),
    userId: v.id("users"),
    foodKey: v.string(),
    amount: v.number(),
    won: v.optional(v.boolean()),
    payout: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_round", ["roundId"])
    .index("by_round_and_user", ["roundId", "userId"])
    .index("by_user", ["userId"]),
  greedyCatLeaderboard: defineTable({
    userId: v.id("users"),
    totalWon: v.number(),
    totalBet: v.optional(v.number()),
    gamesPlayed: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
  spinWheelGames: defineTable({
    roomId: v.id("rooms"),
    hostId: v.id("users"),
    status: v.union(v.literal("waiting"), v.literal("spinning"), v.literal("finished")),
    result: v.optional(v.string()),
    prize: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_room", ["roomId"]),
  slotsGames: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    bet: v.number(),
    result: v.optional(v.array(v.string())),
    won: v.optional(v.boolean()),
    payout: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_room", ["roomId"]),
  rouletteStandaloneGames: defineTable({
    roomId: v.id("rooms"),
    hostId: v.id("users"),
    status: v.union(v.literal("waiting"), v.literal("spinning"), v.literal("finished")),
    winNumber: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_room", ["roomId"]),
  contentCreators: defineTable({
    userId: v.id("users"),
    isActive: v.optional(v.boolean()),
    approvedBy: v.optional(v.id("users")),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
  reelShares: defineTable({
    reelId: v.id("reels"),
    sharerId: v.id("users"),
    roomId: v.optional(v.id("rooms")),
    createdAt: v.number(),
  })
    .index("by_reel", ["reelId"])
    .index("by_sharer", ["sharerId"]),
  bodyguards: defineTable({
    userId: v.id("users"),
    bodyguardId: v.id("users"),
    isActive: v.optional(v.boolean()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_bodyguard", ["bodyguardId"]),
  couples: defineTable({
    user1Id: v.id("users"),
    user2Id: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("active"), v.literal("ended")),
    anniversaryDate: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user1", ["user1Id"])
    .index("by_user2", ["user2Id"]),
  cpHomeGifts: defineTable({
    homeId: v.id("cpHomes"),
    senderId: v.id("users"),
    senderName: v.string(),
    giftType: v.string(),
    coins: v.number(),
    message: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_home", ["homeId"]).index("by_sender", ["senderId"]),
  cpCleanupRuns: defineTable({
    key: v.string(),
    executedAt: v.number(),
    executedBy: v.optional(v.id("users")),
  }).index("by_key", ["key"]),
  cpMarriageRequests: defineTable({
    senderId: v.id("users"),
    receiverId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
    notificationId: v.optional(v.id("notifications")),
    createdAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_sender_receiver", ["senderId", "receiverId"]),
  cpHomes: defineTable({
    // Legacy CP relationship fields
    user1Id: v.optional(v.id("users")),
    user2Id: v.optional(v.id("users")),
    name: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    coverUrl: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    // Current CP Love Home fields
    userId: v.optional(v.id("users")),
    partnerUserId: v.optional(v.id("users")),
    totalGiftsReceived: v.optional(v.number()),
    hasCat: v.optional(v.boolean()),
    hasDog: v.optional(v.boolean()),
    catName: v.optional(v.string()),
    dogName: v.optional(v.string()),
    marriageDayStart: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user1", ["user1Id"])
    .index("by_user2", ["user2Id"])
    .index("by_userId", ["userId"]),
  roomSocialEvents: defineTable({
    roomId: v.id("rooms"),
    type: v.string(),
    userId: v.optional(v.id("users")),
    data: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_room", ["roomId"]),
  pkBattleInvites: defineTable({
    fromRoomId: v.id("rooms"),
    toRoomId: v.id("rooms"),
    fromRoomName: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined")),
    createdAt: v.number(),
  })
    .index("by_from", ["fromRoomId"])
    .index("by_to", ["toRoomId"]),
  typing: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    userName: v.string(),
    updatedAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_user", ["roomId", "userId"]),
  typingIndicators: defineTable({
    userId: v.id("users"),
    otherUserId: v.id("users"),
    isTyping: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_other", ["userId", "otherUserId"]),
  adminLocks: defineTable({
    roomId: v.id("rooms"),
    lockedBy: v.id("users"),
    reason: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_room", ["roomId"]),
  newUserRewards: defineTable({
    userId: v.id("users"),
    claimed: v.boolean(),
    claimedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
  customerServiceAgents: defineTable({
    userId: v.id("users"),
    assignedBy: v.id("users"),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
  friendRequests: defineTable({
    senderId: v.id("users"),
    receiverId: v.id("users"),
    status: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_sender_receiver", ["senderId", "receiverId"]),
  friendships: defineTable({
    userId1: v.id("users"),
    userId2: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_user1", ["userId1"])
    .index("by_user2", ["userId2"])
    .index("by_users", ["userId1", "userId2"]),
  hostWithdrawals: defineTable({
    userId: v.id("users"),
    agencyId: v.id("hostAgencies"),
    agentId: v.optional(v.id("users")),
    agentSakiId: v.optional(v.string()),
    agentName: v.optional(v.string()),
    agentAvatarUrl: v.optional(v.string()),
    diamonds: v.number(),
    usdAmount: v.number(),
    method: v.string(),
    accountInfo: v.string(),
    whatsapp: v.optional(v.string()),
    status: v.string(),
    processedBy: v.optional(v.id("users")),
    processedAt: v.optional(v.number()),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_agency", ["agencyId"])
    .index("by_agent", ["agentId"]),
  vipLevels: defineTable({
    level: v.number(),
    name: v.optional(v.string()),
    price: v.optional(v.number()),
    durationDays: v.optional(v.number()),
    dailyCoins: v.optional(v.number()),
    dailyCoinsReward: v.optional(v.number()),
    benefits: v.optional(v.array(v.string())),
    badgeUrl: v.optional(v.string()),
    badgeStorageId: v.optional(v.id("_storage")),
    badgeMediaType: v.optional(v.string()),
    frameUrl: v.optional(v.string()),
    frameStorageId: v.optional(v.id("_storage")),
    frameMediaType: v.optional(v.string()),
    titleUrl: v.optional(v.string()),
    titleStorageId: v.optional(v.id("_storage")),
    titleMediaType: v.optional(v.string()),
    chatBubbleUrl: v.optional(v.string()),
    chatBubbleStorageId: v.optional(v.id("_storage")),
    entryUrl: v.optional(v.string()),
    entryStorageId: v.optional(v.id("_storage")),
    entryMediaType: v.optional(v.string()),
    entryThumbnailUrl: v.optional(v.string()),
    entryThumbnailStorageId: v.optional(v.id("_storage")),
    nameColor: v.optional(v.string()),
    chatNameColor: v.optional(v.string()),
    frameColor: v.optional(v.string()),
    voiceWaveColor: v.optional(v.string()),
    seatOrder: v.optional(v.number()),
    hasShinyName: v.optional(v.boolean()),
    hasShinyFrame: v.optional(v.boolean()),
    hasCustomSakiId: v.optional(v.boolean()),
    hasGifAvatar: v.optional(v.boolean()),
    hasCustomEntry: v.optional(v.boolean()),
    hasCustomMomentCard: v.optional(v.boolean()),
    canHideLastSeen: v.optional(v.boolean()),
    hasVoiceEffects: v.optional(v.boolean()),
    canHideRoomPresence: v.optional(v.boolean()),
    canPrivateProfile: v.optional(v.boolean()),
    canOwnVipRoom: v.optional(v.boolean()),
    maxVipRoomSeats: v.optional(v.number()),
    hasRoyalSeat: v.optional(v.boolean()),
    canKickProtection: v.optional(v.boolean()),
    canBanProtection: v.optional(v.boolean()),
    canMuteProtection: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
  }).index("by_level", ["level"]),
  userProfileCovers: defineTable({
    userId: v.id("users"),
    svgaStorageId: v.optional(v.id("_storage")),
    svgaUrl: v.string(),
    assignedBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_assignedBy", ["assignedBy"]),
  googlePlayPurchases: defineTable({
    userId: v.id("users"),
    productId: v.string(),
    purchaseToken: v.string(),
    transactionId: v.string(),
    coins: v.number(),
    dollars: v.number(),
    createdAt: v.number(),
  }).index("by_token", ["purchaseToken"]).index("by_user", ["userId"]),
  rechargeGiftPackages: defineTable({
    name: v.string(),
    minimumDollars: v.number(),
    acceptedSources: v.array(v.union(v.literal("google_play"), v.literal("agent"))),
    frameItemId: v.optional(v.id("storeItems")),
    entryItemId: v.optional(v.id("storeItems")),
    giftId: v.optional(v.id("customGifts")),
    giftQuantity: v.optional(v.number()),
    aristocracyLevel: v.optional(v.number()),
    aristocracyDays: v.optional(v.number()),
    proLevel: v.optional(v.number()),
    proDays: v.optional(v.number()),
    customTitle: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_active", ["isActive"]),
  rechargeGiftCredits: defineTable({
    userId: v.id("users"),
    source: v.union(v.literal("google_play"), v.literal("agent")),
    dollars: v.number(),
    externalReference: v.optional(v.string()),
    recordedBy: v.optional(v.id("users")),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
  rechargeGiftClaims: defineTable({
    packageId: v.id("rechargeGiftPackages"),
    userId: v.id("users"),
    claimedAt: v.number(),
    verifiedDollars: v.number(),
  }).index("by_package_and_user", ["packageId", "userId"]).index("by_user", ["userId"]),
  rechargeGiftSettings: defineTable({
    bannerStorageId: v.optional(v.id("_storage")),
    bannerUrl: v.optional(v.string()),
    updatedBy: v.id("users"),
    updatedAt: v.number(),
  }),
  appVersion: defineTable({
    version: v.string(),
    minVersion: v.string(),
    releaseNotes: v.optional(v.string()),
    forceUpdate: v.boolean(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  }),
  weeklyStarSettings: defineTable({
    weekKey: v.string(),
    currentGiftId: v.optional(v.id("customGifts")),
    nextGiftId: v.optional(v.id("customGifts")),
    title: v.string(),
    titleIconUrl: v.optional(v.string()),
    frameItemId: v.optional(v.id("storeItems")),
    entryItemId: v.optional(v.id("storeItems")),
    aristocracyLevel: v.optional(v.number()),
    aristocracyDays: v.optional(v.number()),
    firstGold: v.number(),
    secondGold: v.number(),
    thirdGold: v.number(),
    titleDays: v.number(),
    bannerStorageId: v.optional(v.id("_storage")),
    bannerUrl: v.optional(v.string()),
    updatedBy: v.id("users"),
    updatedAt: v.number(),
  }).index("by_week", ["weekKey"]),
  weeklyStarAwards: defineTable({
    weekKey: v.string(),
    userId: v.id("users"),
    rank: v.number(),
    goldCoins: v.number(),
    giftId: v.optional(v.id("customGifts")),
    giftQuantity: v.optional(v.number()),
    frameItemId: v.optional(v.id("storeItems")),
    entryItemId: v.optional(v.id("storeItems")),
    aristocracyLevel: v.optional(v.number()),
    aristocracyDays: v.optional(v.number()),
    title: v.optional(v.string()),
    titleIconUrl: v.optional(v.string()),
    claimedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_week_user", ["weekKey", "userId"]).index("by_week_rank", ["weekKey", "rank"]),
  welcomePackages: defineTable({
    name: v.string(),
    giftIds: v.array(v.id("customGifts")),
    frameId: v.optional(v.union(v.id("storeItems"), v.string())),
    goldCoins: v.number(),
    aristocracyLevel: v.optional(v.number()),
    isActive: v.boolean(),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
  }),
  sakiPartyTransactions: defineTable({
    roundId: v.id("fruitPartyRounds"),
    userId: v.id("users"),
    kind: v.union(v.literal("bet"), v.literal("payout")),
    fruitKey: v.optional(v.string()),
    amount: v.number(),
    balanceAfter: v.number(),
    createdAt: v.number(),
  })
    .index("by_round", ["roundId"])
    .index("by_user", ["userId"])
    .index("by_round_and_user", ["roundId", "userId"]),
});
