/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminExtra from "../adminExtra.js";
import type * as adminLock from "../adminLock.js";
import type * as adminRecharge from "../adminRecharge.js";
import type * as agentCharge from "../agentCharge.js";
import type * as agora from "../agora.js";
import type * as ai from "../ai.js";
import type * as appBan from "../appBan.js";
import type * as appVersion from "../appVersion.js";
import type * as aristocracy from "../aristocracy.js";
import type * as aristocracyAdmin from "../aristocracyAdmin.js";
import type * as aristocracyExtra from "../aristocracyExtra.js";
import type * as auth from "../auth.js";
import type * as banners from "../banners.js";
import type * as bodyguards from "../bodyguards.js";
import type * as broadcast from "../broadcast.js";
import type * as cardBattle from "../cardBattle.js";
import type * as chatBlocks from "../chatBlocks.js";
import type * as contentCreator from "../contentCreator.js";
import type * as couples from "../couples.js";
import type * as cpHome from "../cpHome.js";
import type * as customBadges from "../customBadges.js";
import type * as customerService from "../customerService.js";
import type * as dailyCheckinAdmin from "../dailyCheckinAdmin.js";
import type * as dailyRewards from "../dailyRewards.js";
import type * as entryEffects from "../entryEffects.js";
import type * as families from "../families.js";
import type * as fcmSubscriptions from "../fcmSubscriptions.js";
import type * as followAll from "../followAll.js";
import type * as friends from "../friends.js";
import type * as fruitParty from "../fruitParty.js";
import type * as giftInventory from "../giftInventory.js";
import type * as googleBilling from "../googleBilling.js";
import type * as googleBillingMutations from "../googleBillingMutations.js";
import type * as googleNative from "../googleNative.js";
import type * as greedyCat from "../greedyCat.js";
import type * as hostAgency from "../hostAgency.js";
import type * as hostAgencyExtra from "../hostAgencyExtra.js";
import type * as http from "../http.js";
import type * as leaderboards from "../leaderboards.js";
import type * as legacyAristocracyCleanup from "../legacyAristocracyCleanup.js";
import type * as levelConfig from "../levelConfig.js";
import type * as liveCoHost from "../liveCoHost.js";
import type * as livestreams from "../livestreams.js";
import type * as lucky77 from "../lucky77.js";
import type * as luckyBag from "../luckyBag.js";
import type * as messages from "../messages.js";
import type * as millionaire from "../millionaire.js";
import type * as moments from "../moments.js";
import type * as momentsExtra from "../momentsExtra.js";
import type * as myRooms from "../myRooms.js";
import type * as newUserRewards from "../newUserRewards.js";
import type * as notifications from "../notifications.js";
import type * as pk from "../pk.js";
import type * as pkInRoom from "../pkInRoom.js";
import type * as premiumSakiId from "../premiumSakiId.js";
import type * as presence from "../presence.js";
import type * as proMembership from "../proMembership.js";
import type * as profileCovers from "../profileCovers.js";
import type * as profiles from "../profiles.js";
import type * as pushNotifications from "../pushNotifications.js";
import type * as pushNotificationsHelper from "../pushNotificationsHelper.js";
import type * as pushSubscriptions from "../pushSubscriptions.js";
import type * as rechargeGifts from "../rechargeGifts.js";
import type * as reelShare from "../reelShare.js";
import type * as reels from "../reels.js";
import type * as referrals from "../referrals.js";
import type * as roomAccess from "../roomAccess.js";
import type * as roomBgPurchase from "../roomBgPurchase.js";
import type * as roomBomb from "../roomBomb.js";
import type * as roomEmojis from "../roomEmojis.js";
import type * as roomGames from "../roomGames.js";
import type * as roomHearts from "../roomHearts.js";
import type * as roomLogs from "../roomLogs.js";
import type * as roomMembersHelper from "../roomMembersHelper.js";
import type * as roomMusic from "../roomMusic.js";
import type * as roomSocial from "../roomSocial.js";
import type * as rooms from "../rooms.js";
import type * as roomsExtra from "../roomsExtra.js";
import type * as roomsExtra2 from "../roomsExtra2.js";
import type * as roulette from "../roulette.js";
import type * as rouletteStandalone from "../rouletteStandalone.js";
import type * as router from "../router.js";
import type * as sakiIdStyle from "../sakiIdStyle.js";
import type * as sakiWallet from "../sakiWallet.js";
import type * as seatBattle from "../seatBattle.js";
import type * as seatInvites from "../seatInvites.js";
import type * as seatLock from "../seatLock.js";
import type * as seatSkins from "../seatSkins.js";
import type * as security from "../security.js";
import type * as slots from "../slots.js";
import type * as social from "../social.js";
import type * as socialLists from "../socialLists.js";
import type * as spinWheel from "../spinWheel.js";
import type * as splashAds from "../splashAds.js";
import type * as store from "../store.js";
import type * as stories from "../stories.js";
import type * as subAgents from "../subAgents.js";
import type * as superAdmin from "../superAdmin.js";
import type * as superAdminCS from "../superAdminCS.js";
import type * as support from "../support.js";
import type * as titleAwards from "../titleAwards.js";
import type * as transfers from "../transfers.js";
import type * as typing from "../typing.js";
import type * as userReports from "../userReports.js";
import type * as videoCalls from "../videoCalls.js";
import type * as vip from "../vip.js";
import type * as weeklyStar from "../weeklyStar.js";
import type * as youtubeSearch from "../youtubeSearch.js";
import type * as zego from "../zego.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  adminExtra: typeof adminExtra;
  adminLock: typeof adminLock;
  adminRecharge: typeof adminRecharge;
  agentCharge: typeof agentCharge;
  agora: typeof agora;
  ai: typeof ai;
  appBan: typeof appBan;
  appVersion: typeof appVersion;
  aristocracy: typeof aristocracy;
  aristocracyAdmin: typeof aristocracyAdmin;
  aristocracyExtra: typeof aristocracyExtra;
  auth: typeof auth;
  banners: typeof banners;
  bodyguards: typeof bodyguards;
  broadcast: typeof broadcast;
  cardBattle: typeof cardBattle;
  chatBlocks: typeof chatBlocks;
  contentCreator: typeof contentCreator;
  couples: typeof couples;
  cpHome: typeof cpHome;
  customBadges: typeof customBadges;
  customerService: typeof customerService;
  dailyCheckinAdmin: typeof dailyCheckinAdmin;
  dailyRewards: typeof dailyRewards;
  entryEffects: typeof entryEffects;
  families: typeof families;
  fcmSubscriptions: typeof fcmSubscriptions;
  followAll: typeof followAll;
  friends: typeof friends;
  fruitParty: typeof fruitParty;
  giftInventory: typeof giftInventory;
  googleBilling: typeof googleBilling;
  googleBillingMutations: typeof googleBillingMutations;
  googleNative: typeof googleNative;
  greedyCat: typeof greedyCat;
  hostAgency: typeof hostAgency;
  hostAgencyExtra: typeof hostAgencyExtra;
  http: typeof http;
  leaderboards: typeof leaderboards;
  legacyAristocracyCleanup: typeof legacyAristocracyCleanup;
  levelConfig: typeof levelConfig;
  liveCoHost: typeof liveCoHost;
  livestreams: typeof livestreams;
  lucky77: typeof lucky77;
  luckyBag: typeof luckyBag;
  messages: typeof messages;
  millionaire: typeof millionaire;
  moments: typeof moments;
  momentsExtra: typeof momentsExtra;
  myRooms: typeof myRooms;
  newUserRewards: typeof newUserRewards;
  notifications: typeof notifications;
  pk: typeof pk;
  pkInRoom: typeof pkInRoom;
  premiumSakiId: typeof premiumSakiId;
  presence: typeof presence;
  proMembership: typeof proMembership;
  profileCovers: typeof profileCovers;
  profiles: typeof profiles;
  pushNotifications: typeof pushNotifications;
  pushNotificationsHelper: typeof pushNotificationsHelper;
  pushSubscriptions: typeof pushSubscriptions;
  rechargeGifts: typeof rechargeGifts;
  reelShare: typeof reelShare;
  reels: typeof reels;
  referrals: typeof referrals;
  roomAccess: typeof roomAccess;
  roomBgPurchase: typeof roomBgPurchase;
  roomBomb: typeof roomBomb;
  roomEmojis: typeof roomEmojis;
  roomGames: typeof roomGames;
  roomHearts: typeof roomHearts;
  roomLogs: typeof roomLogs;
  roomMembersHelper: typeof roomMembersHelper;
  roomMusic: typeof roomMusic;
  roomSocial: typeof roomSocial;
  rooms: typeof rooms;
  roomsExtra: typeof roomsExtra;
  roomsExtra2: typeof roomsExtra2;
  roulette: typeof roulette;
  rouletteStandalone: typeof rouletteStandalone;
  router: typeof router;
  sakiIdStyle: typeof sakiIdStyle;
  sakiWallet: typeof sakiWallet;
  seatBattle: typeof seatBattle;
  seatInvites: typeof seatInvites;
  seatLock: typeof seatLock;
  seatSkins: typeof seatSkins;
  security: typeof security;
  slots: typeof slots;
  social: typeof social;
  socialLists: typeof socialLists;
  spinWheel: typeof spinWheel;
  splashAds: typeof splashAds;
  store: typeof store;
  stories: typeof stories;
  subAgents: typeof subAgents;
  superAdmin: typeof superAdmin;
  superAdminCS: typeof superAdminCS;
  support: typeof support;
  titleAwards: typeof titleAwards;
  transfers: typeof transfers;
  typing: typeof typing;
  userReports: typeof userReports;
  videoCalls: typeof videoCalls;
  vip: typeof vip;
  weeklyStar: typeof weeklyStar;
  youtubeSearch: typeof youtubeSearch;
  zego: typeof zego;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  presence: import("@convex-dev/presence/_generated/component.js").ComponentApi<"presence">;
};
