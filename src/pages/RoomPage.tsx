// @ts-nocheck
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useEffect, useRef, useMemo, useCallback, memo, Component, type ReactNode } from "react";
import RoomAccessGate from "../components/room/RoomAccessGate";
import CpBackground from "../components/CpBackground";
import MusicBackground from "../components/MusicBackground";
import AstronomyBackground from "../components/AstronomyBackground";
import DesertBackground from "../components/DesertBackground";
import PKRoomBackground from "../components/PKBackground_room";
import usePresence from "@convex-dev/presence/react";
import { useAgoraVoiceRoom } from "../hooks/useAgoraVoiceRoom";
import { useZegoVoiceRoom } from "../hooks/useZegoVoiceRoom";
import { useHardwareBack } from "../hooks/useHardwareBack";
import { toast } from "../lib/toast";
import { PRIVATE_TOAST, isPrivateUser } from "../lib/privateUser";
import { stopBackgroundAudio } from "../lib/backgroundAudio";
import { cleanErrorMessage } from "../lib/errorMessages";
import { containsInappropriateChatContent, INAPPROPRIATE_CONTENT_MESSAGE } from "../lib/contentModeration";
import RoomSettingsPage from "./RoomSettingsPage";
import UploadGiftPage from "./UploadGiftPage";
import UploadEmojiPage from "./UploadEmojiPage";
import GiftVideoOverlay from "../components/GiftVideoOverlay";
import SVGAGiftOverlay from "../components/SVGAGiftOverlay";
import { isSvgaUrl } from "../components/SVGAPlayer";
import RoomMenuSheet from "../components/RoomMenuSheet";
import RoomActivitiesSheet from "../components/RoomActivitiesSheet";
import UserProfileSheet from "../components/UserProfileSheet";
import { useBackgroundRoom } from "../contexts/BackgroundRoomContext";
import UserProfilePage from "./UserProfilePage";
import GiftFlyingBanner from "../components/GiftFlyingBanner";
import EmojiPickerSheet from "../components/EmojiPickerSheet";
import RoomSocialSheet from "../components/RoomSocialSheet";
import AdminRoomLockScreen from "../components/AdminRoomLockScreen";

// Sub-components
import RoomHeader from "../components/room/RoomHeader";
import RoomSeatsGrid from "../components/room/RoomSeatsGrid";
import RoomChatArea from "../components/room/RoomChatArea";
import RoomBottomBar from "../components/room/RoomBottomBar";
import RoomGiftsSheet from "../components/room/RoomGiftsSheet";
import RoomLeaderboard from "../components/room/RoomLeaderboard";
import RoomMembersSheet from "../components/room/RoomMembersSheet";
import RoomSeatActionSheet from "../components/room/RoomSeatActionSheet";
import SeatInvitePopup from "../components/room/SeatInvitePopup";
import RoomInfoSheet from "../components/room/RoomInfoSheet";
import RoomSocialBar from "../components/room/RoomSocialBar";
import RoomMusicPlayer, { useRoomMusicGlobal, stopGlobalMusic } from "../components/room/RoomMusicPlayer";
import RoomMusicIcon from "../components/room/RoomMusicIcon";
import RoomBombSheet from "../components/room/RoomBombSheet";
import BombExplosionOverlay from "../components/room/BombExplosionOverlay";
import HardwareBackExitSheet from "../components/room/HardwareBackExitSheet";
import LuckyBagSheet from "../components/LuckyBagSheet";
import LuckyBagOverlay from "../components/LuckyBagOverlay";
import SuperLuckyBagSideIcon from "../components/SuperLuckyBagSideIcon";
import SuperLuckyBagExplosion from "../components/SuperLuckyBagExplosion";
import GlobalLuckyBagBanner from "../components/GlobalLuckyBagBanner";
import RoomAccessAlert from "../components/room/RoomAccessAlert";
import PKBattleSheet from "../components/room/PKBattleSheet";
import PKBackground from "../components/room/PKBackground";
import PKDetailsSheet from "../components/room/PKDetailsSheet";
import PKResultsOverlay from "../components/room/PKResultsOverlay";

import ModalAlert from "../components/ModalAlert";
import FlyingSeatGift from "../components/room/FlyingSeatGift";
import { useModalAlert } from "../hooks/useModalAlert";
import MillionaireBackground from "../components/room/MillionaireBackground";
import MillionaireGameSheet from "../components/room/MillionaireGameSheet";
import { MillionaireChair } from "../components/room/MillionaireSeats";
import RouletteGameSheet, { RouletteIcon } from "../components/room/RouletteGameSheet";
import RadioBackground from "../components/RadioBackground";
import CinemaBackground from "../components/CinemaBackground";
import CinemaScreen from "../components/CinemaScreen";
import RoomVideoScreen from "../components/room/RoomVideoScreen";
import YoutubePlayerSheet from "../components/YoutubePlayerSheet";
import FootballBackground from "../components/FootballBackground";
import FootballScreen from "../components/FootballScreen";
import FootballStreamSheet from "../components/FootballStreamSheet";
import FootballSeatsGrid from "../components/room/FootballSeatsGrid";
import RoomMessagesSheet from "../components/room/RoomMessagesSheet";
import ChatPage from "./ChatPage";

import {
  GiftVideoShow,
  FlyingBanner,
  SeatEmojiItem,
  FlyingSeatGift as FlyingSeatGiftType,
} from "../types/room";

import EntryEffectOverlay from "../components/EntryEffectOverlay";

// يمنع عرض نفس حدث الدخول مرتين عند إعادة تصيير الغرفة أو استعادة الاتصال.
const seenRoomEntryEventIds = new Set<string>();
import RoomEffectsSheet, { loadRoomEffectsPrefs, RoomEffectsPrefs } from "../components/RoomEffectsSheet";
import RoomEntryGate from "../components/room/RoomEntryGate";


class RoomRenderBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("[RoomRenderBoundary]", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0f0f1a] text-white" dir="rtl">
          <div className="w-full max-w-md rounded-3xl p-6 text-center border border-red-400/30 bg-red-950/30">
            <div className="text-3xl mb-3">⚠️</div>
            <h2 className="font-black text-lg mb-2">تعذر تحميل الغرفة</h2>
            <p className="text-red-200 text-sm break-words">{this.state.error.message || "خطأ غير معروف"}</p>
            <button onClick={() => window.location.reload()} className="mt-5 px-5 py-3 rounded-2xl bg-amber-500 text-black font-black text-sm">إعادة المحاولة</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface RoomPageProps {
  roomId: Id<"rooms">;
  onBack: () => void;
  onBackgroundLeave?: (roomId: Id<"rooms">) => void;
  onViewProfile?: (userId: Id<"users">) => void;
  onMessage?: (userId: Id<"users">) => void;
  isSubPageOpen?: boolean;
}

export default function RoomPage({ roomId, onBack, onBackgroundLeave, onViewProfile, onMessage, isSubPageOpen = false }: RoomPageProps) {
  return (
    <RoomAccessGate roomId={roomId} onLeave={onBack}>
      <RoomEntryGate roomId={roomId}>
        <RoomRenderBoundary>
        <RoomPageInner
          roomId={roomId}
          onBack={onBack}
          onBackgroundLeave={onBackgroundLeave}
          onViewProfile={onViewProfile}
          onMessage={onMessage}
          isSubPageOpen={isSubPageOpen}
        />
        </RoomRenderBoundary>
      </RoomEntryGate>
    </RoomAccessGate>
  );
}

function RoomPageInner({ roomId, onBack, onBackgroundLeave, onViewProfile, onMessage, isSubPageOpen = false }: RoomPageProps) {
  // تفعيل دعوات المقاعد فقط بعد نشر دوال Convex في نفس البيئة؛ يمنع ذلك انهيار الغرفة عند غيابها.
  const seatInvitesEnabled = import.meta.env.VITE_ENABLE_SEAT_INVITES === "true";
  const seatInvitesAvailable = seatInvitesEnabled && Boolean((api as any).seatInvites?.getMyPendingInvite && (api as any).seatInvites?.respondToSeatInvite);
  // ── QUERIES ──
  const room = useQuery(api.rooms.getRoom, { roomId });
  const members = useQuery(api.roomMembersHelper.getRoomMembersEnhanced, { roomId });
  const [joinedAt] = useState(() => Date.now());
  const adminLockStatus = useQuery(api.adminLock.getRoomAdminLockStatus, { roomId });
  const muteInfo = useQuery(api.roomAccess.getMuteInfo, { roomId });

  const messages = useQuery(api.messages.getRoomMessages, { roomId, joinedAt });
  const myProfile = useQuery(api.profiles.getMyProfile);
  const userId = useQuery(api.presence.getUserId);
  const latestGiftEvent = useQuery(api.rooms.getLatestGiftEvent, { roomId });
  const latestEmojiEvent = useQuery(api.roomEmojis.getLatestRoomEmojiEvent, { roomId });
  const latestEntryEvent = useQuery(api.rooms.getLatestEntryEvent, { roomId });
  const activeLuckyBag = useQuery(api.luckyBag.getActiveLuckyBag, { roomId });

  // ── PK QUERY ──
  const activePK = useQuery(api.pk.getActivePKBattle, { roomId });
  const lastFinishedPK = useQuery(api.pk.getLastFinishedPKBattle, { roomId });

  // ── IN-ROOM PK (disabled) ──
  const activeInRoomPK = null;
  const lastFinishedInRoomPK = null;

  // ── UI STATE (moved up to fix usage before declaration) ──
  const [showGifts, setShowGifts] = useState(false);
  const [giftsCategory, setGiftsCategory] = useState("general");

  const customGifts = useQuery(api.rooms.getCustomGifts,
    showGifts ? { category: giftsCategory === "all" ? undefined : giftsCategory } : "skip"
  );

  const [leaderboardPeriod, setLeaderboardPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const leaderboard = useQuery(
    api.rooms.getLeaderboard,
    showLeaderboard ? { period: leaderboardPeriod, roomId } : "skip"
  );

  // ── MUTATIONS ──
  const joinRoom = useMutation(api.rooms.joinRoom);
  const leaveRoom = useMutation(api.rooms.leaveRoom);
  const fixOwnerRoles = useMutation(api.rooms.fixOwnerRoles);
  const sendMessage = useMutation(api.messages.sendMessage);
  const takeSeat = useMutation(api.rooms.takeSeat);
  const leaveSeat = useMutation(api.rooms.leaveSeat);
  const updateMuteStatus = useMutation(api.rooms.updateMuteStatus);
  const kickMember = useMutation(api.rooms.kickMember);
  const banMember = useMutation(api.rooms.banMember);
  const muteMember = useMutation(api.rooms.muteMember);
  const muteChatMember = useMutation(api.rooms.muteChatMember);
  const sendCustomGift = useMutation(api.rooms.sendCustomGift);
  const setAdminRole = useMutation(api.rooms.setAdminRole);
  const updateRoom = useMutation(api.rooms.updateRoom);

  // ── UI STATE ──
  const [messageText, setMessageText] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showActivities, setShowActivities] = useState(false);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [inviteTargetUser, setInviteTargetUser] = useState<any>(null);
  const [giftTarget, setGiftTarget] = useState<any>(null);
  const [giftTargets, setGiftTargets] = useState<any[]>([]);
  const [selectedCustomGift, setSelectedCustomGift] = useState<any>(null);
  const [giftQuantity, setGiftQuantity] = useState(1);
  const [comboState, setComboState] = useState<{ gift: any; targets: any[]; quantity: number; expiresAt: number } | null>(null);
  const [comboSeconds, setComboSeconds] = useState(0);
  const [showQuantityMenu, setShowQuantityMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUploadGift, setShowUploadGift] = useState(false);
  const [showUploadEmoji, setShowUploadEmoji] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSocial, setShowSocial] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [showHardwareBackSheet, setShowHardwareBackSheet] = useState(false);
  const [showBomb, setShowBomb] = useState(false);
  const [showLuckyBag, setShowLuckyBag] = useState(false);
  const [showPK, setShowPK] = useState(false);
  const [showPKDetails, setShowPKDetails] = useState(false);
  const [showInRoomPK, setShowInRoomPK] = useState(false);
  const [showInRoomPKResults, setShowInRoomPKResults] = useState(false);
  const [lastShownInRoomPKId, setLastShownInRoomPKId] = useState<string | null>(null);
  const [showMillionaire, setShowMillionaire] = useState(false);
  const [showYoutube, setShowYoutube] = useState(false);
  const [showRoulette, setShowRoulette] = useState(false);
  const [showFootballStream, setShowFootballStream] = useState(false);
  const [showPKResults, setShowPKResults] = useState(false);
  const [showRoomMessages, setShowRoomMessages] = useState(false);
  const [roomChatUserId, setRoomChatUserId] = useState<Id<"users"> | null>(null);
  const unreadMessagesCount = useQuery(api.messages.getTotalUnreadCount) ?? 0;
  const [lastShownPKResultId, setLastShownPKResultId] = useState<string | null>(null);
  const [dismissedLuckyBagId, setDismissedLuckyBagId] = useState<string | null>(null);
  const [showSuperExplosion, setShowSuperExplosion] = useState(false);
  const [viewProfileUserId, setViewProfileUserId] = useState<Id<"users"> | null>(null);
  const [giftVideoShow, setGiftVideoShow] = useState<GiftVideoShow | null>(null);
  const [svgaGiftShow, setSvgaGiftShow] = useState<{
    svgaUrl: string; senderName: string; receiverName: string;
    giftName: string; senderAvatarUrl?: string; quantity?: number; soundUrl?: string;
  } | null>(null);
  const [flyingBanners, setFlyingBanners] = useState<FlyingBanner[]>([]);
  const [lastGiftEventId, setLastGiftEventId] = useState<string | null>(null);
  const [activeEmojis, setActiveEmojis] = useState<SeatEmojiItem[]>([]);
  const [lastEmojiEventId, setLastEmojiEventId] = useState<string | null>(null);
  const [mentionText, setMentionText] = useState<string | undefined>(undefined);
  const [roomAccessAlert, setRoomAccessAlert] = useState<any>(null);
  const [seatPositions, setSeatPositions] = useState<Array<{ x: number; y: number } | null>>([]);
  const [flyingSeatGifts, setFlyingSeatGifts] = useState<FlyingSeatGiftType[]>([]);
  const [activeEntryEffect, setActiveEntryEffect] = useState<{ mediaUrl?: string; mediaType?: "gif" | "mp4" | "svga"; userName: string; userAvatarUrl?: string; proLevel?: number; aristocracyLevel?: number; frameUrl?: string; frameMediaType?: string } | null>(null);
  const [showEffects, setShowEffects] = useState(false);
  const [effectsPrefs, setEffectsPrefs] = useState<RoomEffectsPrefs>(() => loadRoomEffectsPrefs());
  const [lastEntryEventId, setLastEntryEventId] = useState<string | null>("init");

  const { alert: modalAlert, hideAlert, showChatMuteAlert, showMuteAlert } = useModalAlert();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const seatsGridRef = useRef<HTMLDivElement>(null);

  // Keep members in a ref so gift effect doesn't re-run on every coin update
  const membersRef = useRef(members);
  useEffect(() => { membersRef.current = members; }, [members]);

  // Seat signature: only changes when seats are taken/left (not on coin updates)
  const seatedSignature = useMemo(() => {
    if (!members) return "";
    return members.filter((m) => m.seatIndex != null).map((m) => `${m.seatIndex}:${m.userId}`).sort().join("|");
  }, [members]);

  // ── DERIVED STATE ──
  const myMember = members?.find((m) => m.userId === myProfile?.userId || m.profile?.userId === myProfile?.userId);
  const isOnSeat = myMember?.seatIndex !== undefined && myMember?.seatIndex !== null;
  // isOwner: check role OR if this user is the room's ownerId (permanent ownership)
  const isOwner = myMember?.role === "owner" || (room && (room as any).ownerId === myProfile?.userId);
  const isAdmin = myMember?.role === "admin" && !isOwner;
  const isSuperAdmin = myProfile?.isSuperAdmin ?? false;
  const adminPermissions: string[] = (myProfile as any)?.adminPermissions ?? [];
  const isRootAdmin = isSuperAdmin && adminPermissions.length === 0;
  const canUploadGifts = isRootAdmin || adminPermissions.includes("uploadGifts");
  const canUploadEmoji = isRootAdmin || adminPermissions.includes("uploadEmoji");
  const isVip = myProfile?.isVip ?? false;
  const vipLevel = myProfile?.vipLevel;
  const ownerMember = members?.find((m) => m.role === "owner");
  const ownerIsVip = ownerMember?.profile?.isVip ?? false;
  const ownerVipLevel = ownerMember?.profile?.vipLevel;
  const ownerIsVip12 = ownerIsVip && ownerVipLevel === 12;
  const totalCoinsSpent = room?.totalCoinsSpent ?? 0;
  const roomTheme = (room as any)?.roomTheme ?? "";
  const isCp = roomTheme === "cp";
  const isMusic = roomTheme === "music";
  const isAstronomy = roomTheme === "astronomy";
  const isDesert = roomTheme === "desert";
  const isRadio = roomTheme === "radio";
  const isCinema = roomTheme === "cinema";
  const isMillionaire = roomTheme === "millionaire";
  const isFootball = roomTheme === "football";
  const isPKTheme = false; // PK theme disabled
  // Football theme: always 5 seats max
  const maxSeats = isFootball ? Math.min(room?.maxSeats ?? 10, 5) : (room?.maxSeats ?? 10);
  const millionaireGame = useQuery(api.millionaire.getActiveGame, isMillionaire ? { roomId } : "skip");
  const rouletteSession = useQuery(api.roulette.getActiveSession, { roomId });
  const seatedMembers = members?.filter((m) => m.seatIndex !== undefined && m.seatIndex !== null) ?? [];
  const coins = myProfile?.goldCoins ?? 0;
  const mySeatIndex = isOnSeat ? (myMember?.seatIndex ?? null) : null;
  const bgImageUrl = (room as any)?.bgImageUrl ?? null;

  // ── PK DERIVED STATE ──
  const isPKActive = activePK?.status === "active" || activePK?.status === "pending";
  const pkRoom1Id = activePK?.room1Id;
  const pkRoom2Id = activePK?.room2Id;

  // Music state from room
  const activeMusicUrl = (room as any)?.activeMusicUrl;
  const activeMusicName = (room as any)?.activeMusicName;
  const musicVolume = (room as any)?.musicVolume ?? 80;

  // ── STORE QUERIES ──
  const selectedUserActualId = selectedUser?.userId;
  const selectedUserActiveItems = useQuery(api.store.getUserActiveItems, selectedUserActualId ? { userId: selectedUserActualId as Id<"users"> } : "skip");
  const selectedUserCpPartner = useQuery(api.store.getActiveCpPartner, selectedUserActualId ? { userId: selectedUserActualId as Id<"users"> } : "skip");

  // ── AGORA VOICE ──
  const zegoChannel = `r${roomId}`.replace(/[^a-zA-Z0-9_-]/g, "").substring(0, 64);
  const zegoUserId = (myProfile?.userId ?? userId ?? "").replace(/[^a-zA-Z0-9_-]/g, "").substring(0, 64);
  const zegoUserName = myProfile?.name ?? "user";

  // ── BACKGROUND ROOM ──
  const { setBgRoom } = useBackgroundRoom();
  const isGoingToBackgroundRef = useRef(false);

  const handleBackgroundLeave = () => {
    isGoingToBackgroundRef.current = true;
    if (room) {
      setBgRoom({
        roomId,
        roomName: room.name,
        coverUrl: room.coverUrl,
        zegoChannel,
        zegoUserId,
        zegoUserName,
      });
    }
    // تمرير رقم الغرفة إلى App ضروري حتى تُحفظ الفقاعة في الغرفة الصحيحة.
    onBackgroundLeave?.(roomId);
  };

  const zegoTestEnabled = import.meta.env.VITE_ENABLE_ZEGO_TEST === "true" && Boolean(import.meta.env.VITE_ZEGO_APP_ID && import.meta.env.VITE_ZEGO_SERVER);
  const agoraVoice = useAgoraVoiceRoom(zegoChannel, zegoUserId, zegoUserName, !!myProfile && !!userId && !zegoTestEnabled, isOnSeat, null);
  const zegoVoice = useZegoVoiceRoom(roomId, zegoUserId, zegoUserName, !!myProfile && !!userId && zegoTestEnabled, isOnSeat, null);
  const voiceState = zegoTestEnabled
    ? { ...zegoVoice, squirrelVoiceEnabled: false, setSquirrelVoiceEnabled: async (_enabled: boolean) => {} }
    : agoraVoice;
  const {
    isConnected,
    isConnecting,
    isMuted,
    isSpeakerOff,
    speakingUsers: speakingUsersRaw,
    error: zegoError,
    toggleMute,
    toggleSpeaker,
    leaveVoiceRoom,
    squirrelVoiceEnabled,
    setSquirrelVoiceEnabled,
  } = voiceState;

  // ── Stable speakingUsers: only update when content changes ──
  const speakingUsersRef = useRef<Set<string>>(new Set());
  const speakingUsers = useMemo(() => {
    const prev = speakingUsersRef.current;
    const next = speakingUsersRaw;
    if (prev.size === next.size && [...next].every((u) => prev.has(u))) return prev;
    speakingUsersRef.current = next;
    return next;
  }, [speakingUsersRaw]);

  // ── PRESENCE ──
  const presenceState = usePresence(api.presence, userId ? roomId : "skip", userId ?? "", 10000);
  const isEmperor = (myProfile?.aristocracyLevel ?? 0) === 6 && (!myProfile?.aristocracyExpiresAt || myProfile.aristocracyExpiresAt > Date.now());

  // ── GLOBAL MUSIC PLAYER (plays for ALL users in the room) ──
  useRoomMusicGlobal(activeMusicUrl, musicVolume);

  // Stop music on room leave
  useEffect(() => {
    return () => { stopGlobalMusic(); };
  }, [roomId]);

  // ── HARDWARE BACK ──
  // الرجوع يحفظ الغرفة ويعرض الفقاعة، بينما الخروج النهائي يتم من زر «خروج» داخل الغرفة.
  useHardwareBack(() => {
    // Gift flow owns the first back presses: close the gift box before any room navigation.
    if (showGifts) { handleCloseGifts(); return; }
    if (showQuantityMenu) { setShowQuantityMenu(false); return; }
    if (viewProfileUserId) { setViewProfileUserId(null); return; }
    if (showSettings) { setShowSettings(false); return; }
    if (showUploadGift) { setShowUploadGift(false); return; }
    if (showUploadEmoji) { setShowUploadEmoji(false); return; }
    handleBackgroundLeave();
  }, !isSubPageOpen);

  // ── EFFECTS ──
  useEffect(() => {
    if (myProfile?.userId) updateMuteStatus({ roomId, isMuted }).catch(() => {});
  }, [isMuted, myProfile?.userId]);

  useEffect(() => {
    let cancelled = false;
    const enterRoom = async () => {
      try {
        // joinRoom يقوم أيضاً بتصحيح دور المالك في السجلات القديمة؛ لا نستدعي
        // fixOwnerRoles هنا لأنه مخصص للمالك وقد يضيف فشلاً غير لازم للزائر.
        await joinRoom({ roomId });
      } catch (e: any) {
        const msg = e?.message ?? String(e);
        if (!cancelled && msg !== "BANNED" && msg !== "KICKED") {
          toast.error(cleanErrorMessage(e));
        }
      }
    };
    void enterRoom();

    return () => {
      cancelled = true;
      if (!isGoingToBackgroundRef.current) {
        leaveVoiceRoom();
      }
      void leaveRoom({ roomId }).catch(() => {});
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const update = () => {
      if (!seatsGridRef.current) return;
      const gridRect = seatsGridRef.current.getBoundingClientRect();
      const btns = seatsGridRef.current.querySelectorAll<HTMLButtonElement>("button[data-seat]");
      const pos: Array<{ x: number; y: number } | null> = Array.from({ length: maxSeats }, () => null);
      btns.forEach((btn) => {
        const idx = parseInt(btn.getAttribute("data-seat") ?? "-1", 10);
        if (idx < 0) return;
        const r = btn.getBoundingClientRect();
        pos[idx] = { x: r.left - gridRect.left + r.width / 2, y: r.top - gridRect.top + r.height / 2 };
      });
      setSeatPositions(pos);
    };
    update();
    const t = setTimeout(update, 300);
    return () => clearTimeout(t);
  }, [maxSeats, seatedSignature]);

  useEffect(() => {
    if (!latestGiftEvent) return;
    if (lastGiftEventId === null) { setLastGiftEventId(latestGiftEvent._id); return; }
    if (latestGiftEvent._id !== lastGiftEventId) {
      setLastGiftEventId(latestGiftEvent._id);
      const ev = latestGiftEvent as any;
      // كل هدية ذات فيديو تظهر في شاشة الهدية الكاملة؛ هدايا الحظ تستخدم الشريط الطائر فقط.
      const eventMediaUrl = ev.videoUrl ?? ev.svgaUrl;
      const isSvgaGift = ev.mediaType === "svga" || isSvgaUrl(eventMediaUrl);
      const isLuckGift = Number(ev.luckMultiplier ?? 0) > 0;
      // لا تُفتح الشاشة الكاملة إلا إذا فعّل مدير الهدية الخيار صراحةً.
      // هدايا الحظ تبقى في الشريط الطائر فقط مهما كان نوع ملفها.
      if (eventMediaUrl && !isLuckGift && ev.showFullScreen === true) {
        if (isSvgaGift) {
          setSvgaGiftShow({
            svgaUrl: eventMediaUrl,
            senderName: ev.senderName,
            receiverName: ev.receiverName,
            giftName: ev.giftName,
            senderAvatarUrl: ev.senderAvatarUrl,
            quantity: 1,
            soundUrl: ev.soundUrl ?? undefined,
          });
        } else {
          setGiftVideoShow({
            videoUrl: eventMediaUrl,
            senderName: ev.senderName,
            receiverName: ev.receiverName,
            giftName: ev.giftName,
            senderAvatarUrl: ev.senderAvatarUrl,
            giftImageUrl: ev.giftImageUrl,
            mediaType: ev.mediaType,
            showFullScreen: ev.showFullScreen === true,
            soundUrl: ev.soundUrl ?? undefined,
          });
        }
      }

      // ── Flying gift visible to ALL users ──
      const giftUrl = ev.giftImageUrl;
      if (giftUrl && membersRef.current) {
        const receiverMember = (membersRef.current as any[]).find((m) => m.userId === ev.receiverId);
        if (receiverMember && receiverMember.seatIndex != null) {
          setFlyingSeatGifts((prev) => {
            const next = [...prev.slice(-2), {
              id: ev._id + Date.now(),
              giftImageUrl: giftUrl,
              giftName: ev.giftName,
              soundUrl: ev.soundUrl ?? undefined,
              fromSeatIndex: 0,
              toSeatIndex: receiverMember.seatIndex,
            }];
            return next;
          });
        }
      }

      const bannerKey = `${ev.senderName}|${ev.receiverName}|${ev.giftName}`;
      setFlyingBanners((prev) => {
        const existing = prev.find((b) => b.key === bannerKey);
        if (existing) {
          return prev.map((b) => b.key === bannerKey ? { ...b, quantity: (b.quantity ?? 1) + 1 } : b);
        }
        return [...prev.slice(-1), {
          id: latestGiftEvent._id,
          key: bannerKey,
          senderName: ev.senderName,
          receiverName: ev.receiverName,
          senderAvatar: ev.senderAvatarUrl,
          receiverAvatar: ev.receiverAvatarUrl,
          giftName: ev.giftName,
          giftImageUrl: ev.giftImageUrl,
          giftEmoji: ev.giftEmoji,
          quantity: 1,
          luckMultiplier: ev.luckMultiplier,
          luckWinAmount: ev.luckMultiplier ? ev.price * ev.luckMultiplier : undefined,
          price: ev.price,
          isGlobal: ev.isGlobal,
        }];
      });
    }
  }, [latestGiftEvent?._id]);

  useEffect(() => {
    if (!latestEmojiEvent) return;
    if (lastEmojiEventId === null) { setLastEmojiEventId(latestEmojiEvent._id); return; }
    if (latestEmojiEvent._id !== lastEmojiEventId) {
      setLastEmojiEventId(latestEmojiEvent._id);
      const ev = latestEmojiEvent as any;
      const newItem: SeatEmojiItem = { id: ev._id + Date.now(), seatIndex: ev.seatIndex, imageUrl: ev.imageUrl, senderName: ev.senderName };
      setActiveEmojis((prev) => [...prev, newItem]);
      setTimeout(() => setActiveEmojis((prev) => prev.filter((x) => x.id !== newItem.id)), 7000);
    }
  }, [latestEmojiEvent?._id]);

  // ── PK RESULTS: auto-show when battle finishes ──
  useEffect(() => {
    if (!lastFinishedPK) return;
    if (lastFinishedPK._id === lastShownPKResultId) return;
    setLastShownPKResultId(lastFinishedPK._id);
    setShowPKResults(true);
  }, [lastFinishedPK?._id]);

  // ── IN-ROOM PK RESULTS ──
  useEffect(() => {
    if (!lastFinishedInRoomPK) return;
    if (lastFinishedInRoomPK._id === lastShownInRoomPKId) return;
    setLastShownInRoomPKId(lastFinishedInRoomPK._id);
    setShowInRoomPKResults(true);
  }, [lastFinishedInRoomPK?._id]);

  // ── ENTRY EFFECT ──
  useEffect(() => {
    if (!latestEntryEvent) return;
    const eventId = String(latestEntryEvent._id);
    if (seenRoomEntryEventIds.has(eventId)) {
      setLastEntryEventId(latestEntryEvent._id);
      return;
    }
    if (lastEntryEventId === "init") {
      // أول مرة يصل الـ query — اعرض الحدث الحديث مرة واحدة فقط.
      const isRecent = (Date.now() - (latestEntryEvent as any).createdAt) < 15000;
      setLastEntryEventId(latestEntryEvent._id);
      if (isRecent) {
        seenRoomEntryEventIds.add(eventId);
        const ev = latestEntryEvent as any;
        setActiveEntryEffect({
          mediaUrl: ev.entryMediaUrl ?? undefined,
          mediaType: ev.entryMediaType === "gif" || ev.entryMediaType === "svga" || ev.entryMediaType === "mp4" ? ev.entryMediaType : undefined,
          userName: ev.userName,
          userAvatarUrl: ev.userAvatarUrl,
          proLevel: ev.proLevel ?? 0,
          aristocracyLevel: ev.aristocracyLevel ?? 0,
          frameUrl: ev.frameUrl,
          frameMediaType: ev.frameMediaType,
        });
      }
      return;
    }
    if (latestEntryEvent._id !== lastEntryEventId) {
      seenRoomEntryEventIds.add(eventId);
      setLastEntryEventId(latestEntryEvent._id);
      const ev = latestEntryEvent as any;
      setActiveEntryEffect({
        mediaUrl: ev.entryMediaUrl ?? undefined,
        mediaType: ev.entryMediaType === "gif" || ev.entryMediaType === "svga" || ev.entryMediaType === "mp4" ? ev.entryMediaType : undefined,
        userName: ev.userName,
        userAvatarUrl: ev.userAvatarUrl,
        proLevel: ev.proLevel ?? 0,
        aristocracyLevel: ev.aristocracyLevel ?? 0,
        frameUrl: ev.frameUrl,
        frameMediaType: ev.frameMediaType,
      });
    }
  }, [latestEntryEvent?._id]);

  // ── HANDLERS ──
  const triggerFlyingSeatGift = (gift: any, targetMember: any) => {
    // هدايا الحظ لا تستخدم أي شريط أو مؤثر طائر.
    if (gift?.category === "luck" || gift?.giftCategory === "luck") return;
    const targetSeat = targetMember?.seatIndex;
    const url = gift.thumbnailUrl || gift.thumbnailUrl || gift.videoUrl || gift.mediaUrl;
    if (targetSeat == null || !url) return;
    setFlyingSeatGifts((prev) => [...prev, {
      id: Date.now().toString() + Math.random(), giftImageUrl: url,
      giftName: gift.name, soundUrl: gift.category === "comedy" ? gift.soundUrl : undefined,
      fromSeatIndex: 0, toSeatIndex: targetSeat,
    }]);
  };

  const handleSend = async () => {
    const content = messageText.trim();
    if (!content) return;
    if (containsInappropriateChatContent(content)) {
      toast.error(INAPPROPRIATE_CONTENT_MESSAGE);
      setMessageText("");
      return;
    }
    if (myMember?.isChatMuted) {
      showChatMuteAlert((myMember as any).chatMutedByName ?? "مشرف");
      return;
    }
    try {
      await sendMessage({ roomId, content });
      setMessageText("");
      inputRef.current?.focus();
    } catch (error) {
      toast.error(cleanErrorMessage(error));
    }
  };

  const handleSeatPress = useCallback((seatIndex: number) => {
    setSelectedSeat(seatIndex);
    setInviteTargetUser(null);
    setSelectedUser(null);
  }, []);

  const handleInviteUserToSeat = useCallback((member: any) => {
    if (!member?.userId && !member?.profile?.userId) {
      toast.error("بيانات المستخدم غير مكتملة");
      return;
    }
    if (!seatInvitesAvailable) {
      toast.error("دعوات المقاعد ستتفعّل بعد نشر تحديث Convex");
      return;
    }
    const occupied = new Set((members ?? []).map((m: any) => m.seatIndex).filter((i: any) => i !== undefined && i !== null));
    const locked = new Set(((room as any)?.lockedSeats ?? []) as number[]);
    const nextSeat = Array.from({ length: maxSeats }, (_, index) => index).find((index) => !occupied.has(index) && !locked.has(index));
    if (nextSeat === undefined) {
      toast.error("لا يوجد مقعد فارغ متاح حالياً");
      return;
    }
    setInviteTargetUser(member);
    setSelectedUser(null);
    setSelectedSeat(nextSeat);
  }, [maxSeats, members, room, seatInvitesAvailable]);

  const handleTakeSeat = async (seatIndex: number) => {
    if (myMember?.isMuted && !isOwner && !isAdmin && !isSuperAdmin) {
      showMuteAlert((myMember as any).mutedByName ?? "مشرف");
      return;
    }
    try { await takeSeat({ roomId, seatIndex }); setSelectedSeat(null); setInviteTargetUser(null); }
    catch (e: any) { toast.error(e); }
  };

  const handleLeaveSeat = async () => {
    try { await leaveSeat({ roomId }); setSelectedSeat(null); setInviteTargetUser(null); }
    catch (e: any) { toast.error(e); }
  };

  useEffect(() => {
    if (!comboState) { setComboSeconds(0); return; }
    const update = () => {
      const remaining = Math.max(0, Math.ceil((comboState.expiresAt - Date.now()) / 1000));
      setComboSeconds(remaining);
      if (remaining <= 0) setComboState(null);
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [comboState?.expiresAt]);

  const handleComboSend = async () => {
    if (!comboState || comboSeconds <= 0) return;
    const { gift, targets, quantity } = comboState;
    const total = gift.price * quantity * targets.length;
    if (coins < total) { toast.error("رصيدك غير كافٍ لإرسال COMBO"); setComboState(null); return; }
    try {
      for (const target of targets) {
        await sendCustomGift({ roomId, receiverId: target.userId, customGiftId: gift._id, quantity });
      }
      setComboState({ ...comboState, expiresAt: Date.now() + 10000 });
    } catch (e: any) { toast.error(e?.message ?? "تعذر إرسال COMBO"); }
  };

  const handleSendGift = async () => {
    const tgts = giftTargets.length > 0 ? giftTargets : (giftTarget ? [giftTarget] : []);
    if (!selectedCustomGift || tgts.length === 0) { toast.error(!selectedCustomGift ? "اختر هدية" : "اختر مستلماً"); return; }
    if (coins < selectedCustomGift.price * giftQuantity * tgts.length) { toast.error("رصيدك غير كافٍ"); return; }
    const gc = { ...selectedCustomGift };
    try {
      for (const t of tgts) {
        const r = await sendCustomGift({ roomId, receiverId: t.userId, customGiftId: gc._id, quantity: giftQuantity });
        // Flying gift is now triggered for ALL via latestGiftEvent effect
      }
      setComboState({ gift: gc, targets: tgts, quantity: giftQuantity, expiresAt: Date.now() + 10000 });
      setShowGifts(false);
      setSelectedCustomGift(null);
      setGiftQuantity(1);
      setShowQuantityMenu(false);
      setGiftTargets([]);
      setGiftTarget(null);
    } catch (e: any) { toast.error(e); }
  };

  const handleOpenGifts = () => {
    setShowGifts(true); setGiftTarget(null); setGiftTargets([]);
    setSelectedCustomGift(null); setGiftQuantity(1); setShowQuantityMenu(false);
  };

  const handleCloseGifts = () => {
    setShowGifts(false); setSelectedCustomGift(null); setGiftQuantity(1);
    setShowQuantityMenu(false); setGiftTargets([]); setGiftTarget(null);
  };

  if (!room) return (
    <div className="min-h-screen flex items-center justify-center" dir="rtl"
      style={{ background: "linear-gradient(180deg,#0a0a14,#1a1200)" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#3B4D2E,#232F1A)", border: "2px solid rgba(212,175,55,0.4)", boxShadow: "0 0 20px rgba(212,175,55,0.2)" }}>
          <span className="text-2xl">🎙️</span>
        </div>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "#D4AF37", borderTopColor: "transparent" }} />
      </div>
    </div>
  );

  const bgPresetKey = (room as any)?.bgPresetKey ?? "";
  const PRESET_BG_STYLES: Record<string, string> = {
    stars_planets: "radial-gradient(ellipse at 20% 50%,#1a0050 0%,#000020 40%,#000510 100%)",
    city_night: "linear-gradient(180deg,#0a0a2e 0%,#1a1a4e 30%,#2a1a3e 60%,#1a0a2e 100%)",
    desert_night: "linear-gradient(180deg,#050510 0%,#0a0820 30%,#1a1008 60%,#2d1a05 100%)",
  };

  // ── BACKGROUND STYLE ──
  const roomBgStyle = isPKActive
    ? { background: "linear-gradient(180deg,#000820 0%,#050010 40%,#100005 70%,#000820 100%)" }
    : isMillionaire
      ? { background: "linear-gradient(180deg,#000d2e 0%,#000510 100%)" }
      : isCinema
        ? { background: "linear-gradient(180deg,#0d0000 0%,#1a0000 40%,#120000 70%,#080000 100%)" }
        : isFootball
          ? { background: "linear-gradient(180deg,#0a1628 0%,#0d2040 40%,#0a1a30 70%,#051005 100%)" }
          : isCp
      ? { background: "linear-gradient(180deg,#1a0010 0%,#2d0020 30%,#1a000d 60%,#0d0008 100%)" }
      : isMusic
        ? { background: "linear-gradient(180deg,#050010 0%,#0a0020 40%,#050015 70%,#000008 100%)" }
        : isAstronomy
          ? { background: "linear-gradient(180deg,#000510 0%,#020818 40%,#050a1a 70%,#030610 100%)" }
          : isRadio
            ? { background: "linear-gradient(180deg,#0a0500 0%,#150800 40%,#1a0a00 70%,#0d0600 100%)" }
            : isDesert
              ? { background: "linear-gradient(180deg,#050510 0%,#0a0820 30%,#1a1008 60%,#2d1a05 100%)" }
              : bgPresetKey && PRESET_BG_STYLES[bgPresetKey]
                ? { background: PRESET_BG_STYLES[bgPresetKey] }
                : bgPresetKey && bgPresetKey.startsWith("https://")
                  ? { background: "#000" }
                  : room.bgColor && !bgImageUrl ? { backgroundColor: room.bgColor }
              : { background: "linear-gradient(180deg,#5c0a1a 0%,#3d0610 40%,#1a0202 100%)" };

  return (
    <>
    <div className="flex flex-col h-screen overflow-hidden relative" style={roomBgStyle} dir="rtl">
      {comboState && comboSeconds > 0 && (
        <button type="button" onClick={handleComboSend} className="fixed bottom-[118px] left-4 z-[180] flex h-[76px] w-[76px] flex-col items-center justify-center rounded-full text-white shadow-2xl active:scale-90" style={{ background: `conic-gradient(#fbbf24 ${(comboSeconds / 10) * 360}deg, rgba(255,255,255,.18) 0deg)`, filter: "drop-shadow(0 6px 14px rgba(245,158,11,.4))" }} aria-label="إرسال COMBO">
          <span className="flex h-[62px] w-[62px] flex-col items-center justify-center rounded-full bg-[#26120a] text-center"><span className="text-[13px] font-black leading-none">COMBO</span><span className="mt-1 text-[11px] font-bold">{comboSeconds}s</span></span>
        </button>
      )}

      {/* ── ADMIN LOCK SCREEN ── */}
      {adminLockStatus?.isAdminLocked && (
        <AdminRoomLockScreen roomId={roomId} onBack={onBack} />
      )}

      {/* ── BACKGROUND ── */}
      {isPKActive ? (
        <PKRoomBackground active={true} />
      ) : isCp ? (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%,#3d0020 0%,#1a000d 40%,#0d0008 100%)" }} />
          <CpBackground />
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.3)" }} />
        </div>
      ) : isMusic ? (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <MusicBackground />
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.25)" }} />
        </div>
      ) : isAstronomy ? (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <AstronomyBackground />
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.15)" }} />
        </div>
      ) : isDesert ? (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <DesertBackground />
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.1)" }} />
        </div>
      ) : isRadio ? (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <RadioBackground />
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.2)" }} />
        </div>
      ) : isCinema ? (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <CinemaBackground />
        </div>
      ) : isFootball ? (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <FootballBackground />
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.15)" }} />
        </div>
      ) : isMillionaire ? (
        <MillionaireBackground />
      ) : bgImageUrl ? (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img src={bgImageUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/55" />
        </div>
      ) : bgPresetKey && bgPresetKey.startsWith("https://") ? (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img src={bgPresetKey} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      ) : !room.bgColor ? (
        <div className="absolute inset-0 bg-[#0f0f1a] z-0 pointer-events-none" />
      ) : null}

      {/* ── MAIN CONTENT ── */}
      <div className="relative z-10 flex flex-col h-full overflow-hidden">

        {/* ── MODAL ALERT ── */}
        {modalAlert && <ModalAlert alert={modalAlert} onClose={hideAlert} />}

        {/* ── BOMB EXPLOSION OVERLAY ── */}
        <BombExplosionOverlay roomId={roomId} />

        {/* Flying Gift Banners */}
        {effectsPrefs.showGiftBanner && flyingBanners.map((banner) => (
          <GiftFlyingBanner
            key={banner.id}
            senderName={banner.senderName}
            receiverName={banner.receiverName}
            senderAvatar={banner.senderAvatar}
            receiverAvatar={banner.receiverAvatar}
            giftName={banner.giftName}
            giftImageUrl={banner.giftImageUrl}
            giftEmoji={banner.giftEmoji}
            quantity={banner.quantity}
            luckMultiplier={banner.luckMultiplier}
            luckWinAmount={banner.luckWinAmount}
            price={banner.price}
            isGlobal={banner.isGlobal}
            onDone={() => setFlyingBanners((prev) => prev.filter((b) => b.id !== banner.id))}
          />
        ))}

        {/* Gift Video Overlay */}
        {giftVideoShow && (
          <GiftVideoOverlay
            videoUrl={giftVideoShow.videoUrl}
            senderName={giftVideoShow.senderName}
            receiverName={giftVideoShow.receiverName}
            giftName={giftVideoShow.giftName}
            senderAvatarUrl={giftVideoShow.senderAvatarUrl}
            giftImageUrl={giftVideoShow.giftImageUrl}
            isGif={giftVideoShow.mediaType === "gif" || giftVideoShow.videoUrl?.toLowerCase().includes(".gif")}
            mediaType={giftVideoShow.mediaType}
            showFullScreen={giftVideoShow.showFullScreen === true}
            soundUrl={giftVideoShow.soundUrl}
            onDone={() => setGiftVideoShow(null)}
          />
        )}
        {svgaGiftShow && (
          <SVGAGiftOverlay
            svgaUrl={svgaGiftShow.svgaUrl}
            senderName={svgaGiftShow.senderName}
            receiverName={svgaGiftShow.receiverName}
            giftName={svgaGiftShow.giftName}
            senderAvatarUrl={svgaGiftShow.senderAvatarUrl}
            quantity={svgaGiftShow.quantity}
            soundUrl={svgaGiftShow.soundUrl}
            onDone={() => setSvgaGiftShow(null)}
          />
        )}

        {/* Entry Effect Overlay */}
        {activeEntryEffect && (
          <EntryEffectOverlay
            mediaUrl={activeEntryEffect.mediaUrl}
            mediaType={activeEntryEffect.mediaType}
            userName={activeEntryEffect.userName}
            userAvatarUrl={activeEntryEffect.userAvatarUrl}
            proLevel={activeEntryEffect.proLevel}
            aristocracyLevel={activeEntryEffect.aristocracyLevel}
            frameUrl={activeEntryEffect.frameUrl}
            frameMediaType={activeEntryEffect.frameMediaType}
            onDone={() => setActiveEntryEffect(null)}
          />
        )}

        {/* Menu Sheet */}
        {showMenu && (
          <RoomMenuSheet
            roomId={roomId}
            isOwner={isOwner}
            isAdmin={isAdmin}
            isVip={isVip}
            isEmperor={isEmperor}
            squirrelVoiceEnabled={squirrelVoiceEnabled}
            onToggleSquirrelVoice={async (enabled) => { await setSquirrelVoiceEnabled(enabled); }}
            proLevel={myProfile?.proLevel ?? 0}
            myCoins={coins}
            onClose={() => setShowMenu(false)}
            onShowMusic={() => setShowMusic(true)}
            onShowLuckyBag={() => setShowLuckyBag(true)}
            onShowActivities={() => setShowActivities(true)}
            onShowPK={() => setShowPK(true)}
            onShowEffects={() => setShowEffects(true)}
          />
        )}

        {/* Games Sheet */}
        {showActivities && (
          <RoomActivitiesSheet onClose={() => setShowActivities(false)} />
        )}

        {/* Social Sheet */}
        {showSocial && (
          <RoomSocialSheet
            roomId={roomId}
            isOwner={isOwner}
            isAdmin={isAdmin}
            myProfile={myProfile}
            onClose={() => setShowSocial(false)}
          />
        )}

        {/* Emoji Picker Sheet */}
        {showEmojiPicker && (
          <EmojiPickerSheet
            roomId={roomId}
            mySeatIndex={mySeatIndex}
            myVipLevel={vipLevel}
            isVip={isVip}
            isSuperAdmin={canUploadEmoji}
            onClose={() => setShowEmojiPicker(false)}
            onUploadEmoji={() => { setShowEmojiPicker(false); setShowUploadEmoji(true); }}
          />
        )}

        {/* Music Player Sheet - only owner/admin can open */}
        {showMusic && (isOwner || isAdmin) && (
          <RoomMusicPlayer
            roomId={roomId}
            isCp={isCp}
            isOwner={isOwner}
            isAdmin={isAdmin}
            isOnSeat={isOnSeat}
            activeMusicUrl={activeMusicUrl}
            activeMusicName={activeMusicName}
            musicVolume={musicVolume}
            onClose={() => setShowMusic(false)}
          />
        )}

        {/* ── HEADER ── */}
        <RoomHeader
          room={room}
          isCp={isCp}
          isMusic={isMusic}
          isAstronomy={isAstronomy}
          isDesert={isDesert}
          isRadio={isRadio}
          isOwner={isOwner}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
          isConnected={isConnected}
          isConnecting={isConnecting}
          totalCoinsSpent={totalCoinsSpent}
          memberCount={room.memberCount ?? 0}
          members={members ?? []}
          activeMusicName={activeMusicName}
          onLeaveRoom={async () => { await stopBackgroundAudio(); await leaveVoiceRoom(); onBack(); }}
          onBackgroundLeave={handleBackgroundLeave}
          onShowLeaderboard={() => setShowLeaderboard(true)}
          onShowMembers={() => setShowMembers(true)}
          onShowRoomInfo={() => setShowRoomInfo(true)}
          onShowSettings={() => setShowSettings(true)}
          onShowMusic={() => setShowMusic(true)}
        />

        {/* Zego Error */}
        {zegoError && (
          <div className="flex-shrink-0 mx-3 mt-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="text-red-400 text-xs">{zegoError}</span>
          </div>
        )}

        {/* ── VIDEO SCREEN — فوق المقاعد مباشرة ── */}
        {(isCinema || (room as any)?.youtubeVideoId) && (
          <RoomVideoScreen
            videoId={(room as any)?.youtubeVideoId ?? null}
            videoStartedAt={(room as any)?.youtubeVideoStartedAt ?? null}
            isPlaying={(room as any)?.youtubeIsPlaying ?? false}
            position={(room as any)?.youtubePosition ?? 0}
            isMutedByOwner={(room as any)?.youtubeIsMuted ?? false}
            volume={(room as any)?.youtubeVolume ?? 80}
            isOwner={isOwner}
            onOpenSheet={() => setShowYoutube(true)}
            roomId={roomId}
          />
        )}

        {/* ── FOOTBALL SCREEN ── */}
        {isFootball && (
          <FootballScreen
            streamUrl={(room as any)?.footballStreamUrl ?? null}
            isOwner={isOwner}
            onOpenSheet={() => setShowFootballStream(true)}
          />
        )}

        {/* ── SEATS GRID ── */}
        {isMillionaire && (
          <div className="flex-shrink-0 px-4 pt-3 pb-1 flex justify-center gap-10">
            {[0, 1].map((si) => {
              const mem = (members ?? []).find((m: any) => m.seatIndex === si);
              return (
                <MillionaireChair key={si} type={si === 0 ? "host" : "contestant"}
                  member={mem} isMe={mem?.profile?.userId === myProfile?.userId}
                  seatIndex={si} onClick={() => handleSeatPress(si)} />
              );
            })}
          </div>
        )}
        {isFootball && !isPKActive && (
          <FootballSeatsGrid
            members={members ?? []}
            myProfile={myProfile}
            maxSeats={maxSeats}
            isMuted={isMuted}
            speakingUsers={speakingUsers}
            activeEmojis={activeEmojis}
            seatPositions={seatPositions}
            seatsGridRef={seatsGridRef}
            lockedSeats={(room as any)?.lockedSeats ?? []}
            onSeatPress={handleSeatPress}
          />
        )}
        {!isFootball && (
        <RoomSeatsGrid
          members={members ?? []}
          myProfile={myProfile}
          maxSeats={maxSeats}
          isCp={isPKActive ? false : isCp}
          isMusic={isPKActive ? false : isMusic}
          isAstronomy={isPKActive ? false : isAstronomy}
          isDesert={isPKActive ? false : isDesert}
          isRadio={isPKActive ? false : isRadio}
          isFootball={false}
          isPK={isPKActive}
          pkRoom1Id={pkRoom1Id}
          pkRoom2Id={pkRoom2Id}
          roomId={roomId}
          ownerIsVip12={ownerIsVip12}
          isMuted={isMuted}
          speakingUsers={speakingUsers}
          activeEmojis={activeEmojis}
          seatPositions={seatPositions}
          seatsGridRef={seatsGridRef}
          lockedSeats={(room as any)?.lockedSeats ?? []}
          hideRoyalSeats={(room as any)?.hideRoyalSeats ?? false}
          isOwner={isOwner}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
          onSeatPress={handleSeatPress}
          onViewProfile={(uid) => setViewProfileUserId(uid)}
        />
        )}

        {/* ── FLYING SEAT GIFTS ── */}
        {effectsPrefs.showFlyingGift && flyingSeatGifts.map((fg) => {
          const relPos = seatPositions[fg.toSeatIndex] ?? null;
          const gridEl = seatsGridRef.current;
          let absPos = null;
          if (relPos && gridEl) {
            const rect = gridEl.getBoundingClientRect();
            absPos = { x: rect.left + relPos.x, y: rect.top + relPos.y };
          }
          return (
            <FlyingSeatGift key={fg.id} giftImageUrl={fg.giftImageUrl} giftName={fg.giftName}
              soundUrl={fg.soundUrl} toPos={absPos}
              onDone={() => setFlyingSeatGifts((prev) => prev.filter((x) => x.id !== fg.id))} />
          );
        })}

        {/* ── PK BATTLE BAR (below seats, above social bar) ── */}
        {isPKActive && <PKBackground roomId={roomId} />}

        {/* ── SOCIAL BAR ── */}
        <RoomSocialBar
          isCp={isPKActive ? false : isCp}
          isMusic={isPKActive ? false : isMusic}
          isPK={isPKActive}
          isCinema={isCinema}
          roomId={roomId}
          isOwner={isOwner}
          isAdmin={isAdmin}
          onShowSocial={() => setShowSocial(true)}
          onShowBomb={() => setShowBomb(true)}
          onShowPKDetails={() => setShowPKDetails(true)}
          isMillionaire={isMillionaire}
          hasActiveMillionaireGame={!!millionaireGame}
          onShowMillionaire={() => setShowMillionaire(true)}
          hasActiveRouletteSession={!!rouletteSession && rouletteSession.status !== "ended"}
          onShowRoulette={() => setShowRoulette(true)}
          onShowYoutube={() => setShowYoutube(true)}
        />

        {/* ── CHAT AREA ── */}
        <RoomChatArea
          messages={messages ?? []}
          myProfile={myProfile}
          members={members ?? []}
          isCp={isPKActive ? false : isCp}
          isMusic={isPKActive ? false : isMusic}
          roomId={roomId}
          messagesEndRef={messagesEndRef}
          onSelectUser={(member) => { if (isPrivateUser(member, myProfile?.userId)) { toast(PRIVATE_TOAST); return; } setSelectedUser(member); }}
        />

        {/* ── BOTTOM BAR ── */}
        <RoomBottomBar
          isCp={isPKActive ? false : isCp}
          isMusic={isPKActive ? false : isMusic}
          isAstronomy={isPKActive ? false : isAstronomy}
          isDesert={isPKActive ? false : isDesert}
          isOnSeat={isOnSeat}
          isMuted={isMuted}
          isSpeakerOff={isSpeakerOff}
          messageText={messageText}
          inputRef={inputRef}
          roomId={roomId}
          onToggleMute={toggleMute}
          onToggleSpeaker={toggleSpeaker}
          onShowEmojiPicker={() => setShowEmojiPicker(true)}
          onMessageChange={setMessageText}
          onSend={handleSend}
          onShowGifts={handleOpenGifts}
          onShowActivities={() => setShowActivities(true)}
          onShowMenu={() => setShowMenu(true)}
          onShowBomb={() => setShowBomb(true)}
          onShowMessages={() => setShowRoomMessages(true)}
          unreadMessagesCount={unreadMessagesCount}
          mentionText={mentionText}
          onMentionConsumed={() => setMentionText(undefined)}
        />

        {/* ── SEAT ACTION SHEET ── */}
        {selectedSeat !== null && (
          <RoomSeatActionSheet
            selectedSeat={selectedSeat}
            members={members ?? []}
            myProfile={myProfile}
            isCp={isCp}
            isOwner={isOwner}
            isAdmin={isAdmin}
            roomId={roomId}
            lockedSeats={(room as any)?.lockedSeats ?? []}
            inviteTargetUser={inviteTargetUser}
            onClose={() => { setSelectedSeat(null); setInviteTargetUser(null); }}
            onTakeSeat={handleTakeSeat}
            onLeaveSeat={handleLeaveSeat}
            onSelectUser={(member) => { if (isPrivateUser(member, myProfile?.userId)) { toast(PRIVATE_TOAST); setSelectedSeat(null); setInviteTargetUser(null); return; } setSelectedUser(member); setSelectedSeat(null); setInviteTargetUser(null); }}
            onViewMyProfile={myProfile?.userId ? () => { setViewProfileUserId(myProfile.userId as Id<"users">); setSelectedSeat(null); } : undefined}
          />
        )}

        {/* ── SEAT INVITE POPUP ── */}
        {seatInvitesAvailable && <SeatInvitePopup roomId={roomId} />}

        {/* ── USER PROFILE SHEET ── */}
        {selectedUser && (
          <UserProfileSheet
            selectedUser={selectedUser}
            myProfile={myProfile}
            isOwner={isOwner}
            isAdmin={isAdmin}
            roomId={roomId}
            userActiveItems={selectedUserActiveItems}
            userCpPartner={selectedUserCpPartner}
            onClose={() => setSelectedUser(null)}
            onSendGift={(user) => { setGiftTarget(user); setShowGifts(true); setSelectedUser(null); }}
            onViewProfile={(uid) => { setSelectedUser(null); onViewProfile?.(uid); }}
            onMessage={(uid) => { setSelectedUser(null); onMessage?.(uid); }}
            muteMember={muteMember}
            muteChatMember={muteChatMember}
            kickMember={kickMember}
            banMember={banMember}
            setAdminRole={setAdminRole}
            onMention={(name) => { setSelectedUser(null); setMentionText(name); }}
            onInviteToSeat={handleInviteUserToSeat}
          />
        )}

        {/* ── GIFTS SHEET ── */}
        {showGifts && (
          <RoomGiftsSheet
            roomId={roomId}
            isCp={isCp}
            isSuperAdmin={canUploadGifts}
            coins={coins}
            seatedMembers={seatedMembers}
            myProfile={myProfile}
            customGifts={customGifts ?? []}
            giftsCategory={giftsCategory}
            giftTarget={giftTarget}
            giftTargets={giftTargets}
            selectedCustomGift={selectedCustomGift}
            giftQuantity={giftQuantity}
            showQuantityMenu={showQuantityMenu}
            onClose={handleCloseGifts}
            onCategoryChange={(cat) => { setGiftsCategory(cat); setSelectedCustomGift(null); }}
            onSelectTarget={(m) => { setGiftTargets((prev) => { const ex = prev.find((t) => t._id === m._id); return ex ? prev.filter((t) => t._id !== m._id) : [...prev, m]; }); setGiftTarget(null); }}
            onSelectAll={(all) => { setGiftTargets(all); setGiftTarget(null); }}
            onSelectGift={(gift) => setSelectedCustomGift(gift)}
            onSendGift={handleSendGift}
            onQuantityChange={(q) => { setGiftQuantity(q); setShowQuantityMenu(false); }}
            onToggleQuantityMenu={() => setShowQuantityMenu(!showQuantityMenu)}
            onUploadGift={() => { setShowGifts(false); setShowUploadGift(true); }}
          />
        )}

        {/* ── MEMBERS SHEET ── */}
        {showMembers && (
          <RoomMembersSheet
            members={members ?? []}
            myProfile={myProfile}
            isMuted={isMuted}
            onClose={() => setShowMembers(false)}
            onSelectUser={(member) => { if (isPrivateUser(member, myProfile?.userId)) { toast(PRIVATE_TOAST); setShowMembers(false); return; } setSelectedUser(member); setShowMembers(false); }}
          />
        )}

        {/* ── LEADERBOARD SHEET ── */}
        {showLeaderboard && (
          <RoomLeaderboard
            leaderboard={leaderboard}
            leaderboardPeriod={leaderboardPeriod}
            onClose={() => setShowLeaderboard(false)}
            onPeriodChange={setLeaderboardPeriod}
          />
        )}

        {/* ── ROOM INFO SHEET ── */}
        {showRoomInfo && (
          <RoomInfoSheet
            roomId={roomId}
            isCp={isCp}
            isOwner={isOwner}
            onClose={() => setShowRoomInfo(false)}
            onOpenSettings={() => { setShowRoomInfo(false); setShowSettings(true); }}
            onOpenLeaderboard={() => { setShowRoomInfo(false); setShowLeaderboard(true); }}
          />
        )}

        {/* ── BOMB SHEET ── */}
        {showBomb && (
          <RoomBombSheet
            roomId={roomId}
            onClose={() => setShowBomb(false)}
          />
        )}

        {/* ── LUCKY BAG SHEET ── */}
        {showLuckyBag && (
          <LuckyBagSheet
            roomId={roomId}
            myCoins={coins}
            onClose={() => setShowLuckyBag(false)}
          />
        )}

                {/* صندوق الكنز: يظهر أسفل يسار المقاعد لكل حقيبة نشطة، والضغط يفتح نافذة المكافأة العشوائية. */}
        {activeLuckyBag && activeLuckyBag._id !== dismissedLuckyBagId && (
          <SuperLuckyBagSideIcon
            bagId={activeLuckyBag._id}
            bagType={activeLuckyBag.bagType}
            expiresAt={activeLuckyBag.expiresAt}
            totalCoins={activeLuckyBag.totalCoins}
            senderName={activeLuckyBag.senderName}
            onExpired={() => setDismissedLuckyBagId(activeLuckyBag._id)}
            onClick={() => setShowSuperExplosion(true)}
          />
        )}
        {activeLuckyBag && showSuperExplosion && (
          <LuckyBagOverlay
            bagId={activeLuckyBag._id}
            bagType={activeLuckyBag.bagType}
            senderName={activeLuckyBag.senderName}
            senderAvatarUrl={activeLuckyBag.senderAvatarUrl}
            totalCoins={activeLuckyBag.totalCoins}
            maxRecipients={activeLuckyBag.maxRecipients}
            expiresAt={activeLuckyBag.expiresAt}
            onClose={() => setShowSuperExplosion(false)}
          />
        )}
        <GlobalLuckyBagBanner onGoToRoom={(targetRoomId) => {
          if (targetRoomId !== roomId) onBackgroundLeave?.(targetRoomId);
        }} />
        {/* ── PK BATTLE FULL SHEET (from menu) ── */}
        {showPK && (
          <PKBattleSheet
            roomId={roomId}
            isOwner={isOwner}
            isAdmin={isAdmin}
            myCoins={coins}
            onClose={() => setShowPK(false)}
          />
        )}

        {/* ── PK DETAILS SHEET (from floating icon) ── */}
        {showPKDetails && (
          <PKDetailsSheet
            roomId={roomId}
            isOwner={isOwner}
            isAdmin={isAdmin}
            onClose={() => setShowPKDetails(false)}
            onOpenFullSheet={() => { setShowPKDetails(false); setShowPK(true); }}
          />
        )}

        {/* ── PK RESULTS OVERLAY ── */}
        {showPKResults && lastFinishedPK && (
          <PKResultsOverlay
            pkId={lastFinishedPK._id}
            roomId={roomId}
            onClose={() => setShowPKResults(false)}
          />
        )}

                {/* أشرطة وأيقونات وانفجارات هدايا الحظ الطائرة ملغاة بالكامل. */}

        {/* ── HARDWARE BACK EXIT SHEET (disabled - auto back now) ── */}

        {/* ── MILLIONAIRE GAME ── */}
        {isMillionaire && (
          <MillionaireGameSheet
            roomId={roomId}
            myUserId={myProfile?.userId ?? ""}
            members={members ?? []}
            isOwner={isOwner}
            isAdmin={isAdmin}
            onClose={() => setShowMillionaire(false)}
          />
        )}

        {/* ── YOUTUBE PLAYER SHEET ── */}
        {showYoutube && (
          <YoutubePlayerSheet
            roomId={roomId}
            isOwner={isOwner}
            currentVideoId={(room as any)?.youtubeVideoId}
            onClose={() => setShowYoutube(false)}
          />
        )}

        {/* ── FOOTBALL STREAM SHEET ── */}
        {showFootballStream && isOwner && (
          <FootballStreamSheet
            streamUrl={(room as any)?.footballStreamUrl ?? null}
            isOwner={isOwner}
            onClose={() => setShowFootballStream(false)}
            onSave={async (url) => {
              try {
                await (updateRoom as any)({ roomId, footballStreamUrl: url ?? undefined });
              } catch (e: any) { /* ignore */ }
            }}
          />
        )}

        {/* ── ROULETTE GAME ── */}
        {showRoulette && (
          <RouletteGameSheet
            roomId={roomId}
            myUserId={myProfile?.userId ?? ""}
            isOwner={isOwner}
            isAdmin={isAdmin}
            onClose={() => setShowRoulette(false)}
          />
        )}

        {/* ── ROOM MESSAGES SHEET ── */}
        {showRoomMessages && (
          <RoomMessagesSheet
            onClose={() => setShowRoomMessages(false)}
            onOpenChat={(uid) => {
              setShowRoomMessages(false);
              setRoomChatUserId(uid);
            }}
          />
        )}

        {/* ── EFFECTS SHEET ── */}
        {showEffects && (
          <RoomEffectsSheet
            onClose={() => setShowEffects(false)}
            prefs={effectsPrefs}
            onChange={setEffectsPrefs}
          />
        )}

      </div>
    </div>

    {/* ── PAGE OVERLAYS ── */}
    {showSettings && (
      <div className="fixed inset-0 z-[150] bg-[#0f0f1a]">
        <RoomSettingsPage roomId={roomId} onBack={() => setShowSettings(false)} />
      </div>
    )}
    {showUploadGift && (
      <div className="fixed inset-0 z-[150] bg-[#0f0f1a]">
        <UploadGiftPage onBack={() => setShowUploadGift(false)} />
      </div>
    )}
    {showUploadEmoji && (
      <div className="fixed inset-0 z-[150] bg-[#0f0f1a]">
        <UploadEmojiPage onBack={() => setShowUploadEmoji(false)} />
      </div>
    )}
    {viewProfileUserId && (
      <div className="fixed inset-0 z-[150] bg-[#0f0f1a]" style={{ overflowY: "auto", overflowX: "hidden" }}>
        <UserProfilePage
          userId={viewProfileUserId}
          onBack={() => setViewProfileUserId(null)}
          onMessage={(uid) => { setViewProfileUserId(null); onMessage?.(uid); }}
        />
      </div>
    )}
    {roomChatUserId && (
      <div className="fixed inset-0 z-[200] bg-[#0f0f1a] animate-slide-up-sheet">
        <ChatPage
          otherUserId={roomChatUserId}
          onBack={() => setRoomChatUserId(null)}
          onViewProfile={(uid) => { setRoomChatUserId(null); setViewProfileUserId(uid); }}
          onStartVideoCall={(callId, channelName, otherName, otherAvatarUrl) => {
            setRoomChatUserId(null);
            onMessage?.(roomChatUserId);
          }}
        />
      </div>
    )}
    </>
  );
}
