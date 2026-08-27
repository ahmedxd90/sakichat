// @ts-nocheck
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import CenteredToaster from "./components/CenteredToaster";
import { useState, useEffect, useRef, lazy, Suspense, memo, useCallback } from "react";
import { BackgroundRoomProvider, useBackgroundRoom } from "./contexts/BackgroundRoomContext";
import { useHardwareBack } from "./hooks/useHardwareBack";
import { useDeviceFingerprint } from "./hooks/useDeviceFingerprint";
import { useSecurityGuard } from "./hooks/useSecurityGuard";
import { Id } from "../convex/_generated/dataModel";
import { usePWAUpdate } from "./hooks/usePWAUpdate";
import PWAUpdatePopup from "./components/PWAUpdatePopup";
import PushNotificationManager from "./components/PushNotificationManager";
import GoogleAuthDeepLinkHandler from "./components/GoogleAuthDeepLinkHandler";
import { leaveAgoraGlobal } from "./lib/agoraGlobal";
import SplashAdScreen from "./components/SplashAdScreen";
import { useSupabase } from "./contexts/SupabaseContext";
import { ProfileProvider, useProfile } from "./components/ProfileManager";
import { Capacitor } from "@capacitor/core";
import { AppUpdate, AppUpdateAvailability } from "@capawesome/capacitor-app-update";
import ForceUpdateScreen from "./components/ForceUpdateScreen";
import "./vip-animations.css";

const CURRENT_APP_VERSION = "1.1.3";

// ── Lazy imports ──────────────────────────────────────────────────────────
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const MomentsPage = lazy(() => import("./pages/MomentsPage"));
const CreateMomentPage = lazy(() => import("./pages/CreateMomentPage"));
const ReelsPage = lazy(() => import("./pages/ReelsPage"));
const CreateReelPage = lazy(() => import("./pages/CreateReelPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const MePage = lazy(() => import("./pages/MePage"));
const RoomPage = lazy(() => import("./pages/RoomPage"));
const CreateRoomPage = lazy(() => import("./pages/CreateRoomPage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const GlobalGiftBanner = lazy(() => import("./components/GlobalGiftBanner"));
const GlobalBombBanner = lazy(() => import("./components/GlobalBombBanner"));
const GlobalLuckyBagBanner = lazy(() => import("./components/GlobalLuckyBagBanner"));
const GlobalLiveEventBanner = lazy(() => import("./components/GlobalLiveEventBanner"));
const BackgroundRoomBubble = lazy(() => import("./components/BackgroundRoomBubble"));
const BannedScreen = lazy(() => import("./components/BannedScreen"));
const AdminBanPage = lazy(() => import("./pages/AdminBanPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const AdminAristocracyPage = lazy(() => import("./pages/AdminAristocracyPage"));
const CustomerServiceDashboard = lazy(() => import("./pages/CustomerServiceDashboard"));
const CreateStoryPage = lazy(() => import("./pages/CreateStoryPage"));
const StoryViewerPage = lazy(() => import("./pages/StoryViewerPage"));
const ActivitiesPage = lazy(() => import("./pages/ActivitiesPage"));
const DailyRewardsPage = lazy(() => import("./pages/DailyRewardsPage"));
const LiveStreamPage = lazy(() => import("./pages/LiveStreamPage"));
const AristocracyPage = lazy(() => import("./pages/AristocracyPage"));
const CpHomePage = lazy(() => import("./pages/CpHomePage"));
const SecurityBlockScreen = lazy(() => import("./components/SecurityBlockScreen"));
const VipFeaturesPage = lazy(() => import("./pages/VipFeaturesPage"));
const ProMembershipPage = lazy(() => import("./pages/ProMembershipPage"));
const ProSettingsPage = lazy(() => import("./pages/ProSettingsPage"));
const HostAgencyPage = lazy(() => import("./pages/HostAgencyPage"));
const IncomingCallPopup = lazy(() => import("./components/IncomingCallPopup"));
const OutgoingCallScreen = lazy(() => import("./components/OutgoingCallScreen"));
const VideoCallScreen = lazy(() => import("./components/VideoCallScreen"));
const DailyRewardsPopup = lazy(() => import("./components/DailyRewardsPopup"));
const NewUserWelcomePopup = lazy(() => import("./components/NewUserWelcomePopup"));
const BottomNavComponent = lazy(() => import("./components/BottomNav"));
const GlobalChatNotification = lazy(() => import("./components/GlobalChatNotification"));

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export type Page =
  | "home" | "moments" | "reels" | "messages" | "me" | "compatibility" | "games"
  | "room" | "create-room" | "create-moment" | "create-reel" | "create-story"
  | "user-profile" | "activities" | "dailyRewards" | "aristocracy" | "live";

// ── VideoCallsManager ──
const VideoCallsManager = memo(function VideoCallsManager({ profile, activeCall, setActiveCall, showOutgoing, setShowOutgoing }: {
  profile: any; activeCall: any;
  setActiveCall: (c: any) => void;
  showOutgoing: boolean; setShowOutgoing: (v: boolean) => void;
}) {
  const incomingCall = useQuery(api.videoCalls.getIncomingCall);
  const outgoingCall = useQuery(api.videoCalls.getOutgoingCall);
  const cancelExpiredCalls = useMutation(api.videoCalls.cancelExpiredCalls);

  useEffect(() => {
    if (!outgoingCall) { setShowOutgoing(false); return; }
    if (outgoingCall.status === "ringing") {
      setShowOutgoing(true);
    } else if (outgoingCall.status === "active" && !activeCall) {
      setShowOutgoing(false);
      setActiveCall({ callId: outgoingCall._id, channelName: outgoingCall.channelName, isCallerSide: true, otherName: outgoingCall.receiverName, otherAvatarUrl: outgoingCall.receiverAvatarUrl });
    } else if (["ended", "declined", "missed"].includes(outgoingCall.status)) {
      setShowOutgoing(false);
    }
  }, [outgoingCall?.status, outgoingCall?._id]);

  useEffect(() => {
    const interval = setInterval(() => { cancelExpiredCalls().catch(() => {}); }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Suspense fallback={null}>
      {incomingCall && !activeCall && (
        <IncomingCallPopup
          callId={incomingCall._id}
          callerName={incomingCall.callerName}
          callerAvatarUrl={incomingCall.callerAvatarUrl}
          onAccept={(channelName) => setActiveCall({ callId: incomingCall._id, channelName, isCallerSide: false, otherName: incomingCall.callerName, otherAvatarUrl: incomingCall.callerAvatarUrl })}
          onDecline={() => {}}
        />
      )}
      {showOutgoing && outgoingCall && outgoingCall.status === "ringing" && !activeCall && (
        <OutgoingCallScreen callId={outgoingCall._id} receiverName={outgoingCall.receiverName} receiverAvatarUrl={outgoingCall.receiverAvatarUrl} onCancel={() => setShowOutgoing(false)} />
      )}
      {activeCall && (
        <VideoCallScreen
          callId={activeCall.callId} channelName={activeCall.channelName}
          myUserId={profile?.userId ?? ""} isCallerSide={activeCall.isCallerSide}
          otherName={activeCall.otherName} otherAvatarUrl={activeCall.otherAvatarUrl}
          myCoins={profile?.goldCoins ?? 0} onEnd={() => setActiveCall(null)}
        />
      )}
    </Suspense>
  );
});

function compareVersions(v1: string, v2: string): number {
  const p1 = v1.split(".").map(Number);
  const p2 = v2.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const a = p1[i] ?? 0, b = p2[i] ?? 0;
    if (a < b) return -1;
    if (a > b) return 1;
  }
  return 0;
}

function GooglePlayUpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState<{ current: string; available?: string } | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return;
    let cancelled = false;
    const checkForUpdate = async () => {
      try {
        const info = await AppUpdate.getAppUpdateInfo();
        if (!cancelled && info.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE) {
          setUpdateInfo({ current: info.currentVersionName, available: info.availableVersionName ?? info.availableVersionCode });
        }
      } catch (error) {
        console.warn("Google Play update check failed", error);
      }
    };
    void checkForUpdate();
    return () => { cancelled = true; };
  }, []);

  if (!updateInfo) return null;

  const updateNow = async () => {
    setChecking(true);
    try {
      await AppUpdate.performImmediateUpdate();
    } catch (error) {
      console.warn("Immediate update unavailable; opening Google Play", error);
      try {
        await AppUpdate.openAppStore({ androidPackageName: "saki.chat.co" });
      } catch {
        window.open("https://play.google.com/store/apps/details?id=saki.chat.co", "_blank", "noopener,noreferrer");
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/55 px-5 backdrop-blur-sm" dir="rtl">
      <div className="w-full max-w-sm rounded-[28px] border border-white/60 bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">↻</div>
        <h2 className="text-xl font-black text-slate-900">يوجد تحديث جديد</h2>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-500">يتوفر إصدار أحدث من Saki Chat. حدّث التطبيق الآن للحصول على آخر الإصلاحات والمميزات.</p>
        <div className="mt-4 flex items-center justify-center gap-3 text-xs font-bold text-slate-500">
          <span>الإصدار الحالي {updateInfo.current}</span><span className="text-blue-600">←</span><span className="text-blue-700">الإصدار {updateInfo.available ?? "الجديد"}</span>
        </div>
        <button onClick={updateNow} disabled={checking} className="mt-6 w-full rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition active:scale-[.98] disabled:opacity-60">{checking ? "جارٍ فتح التحديث..." : "تحديث الآن"}</button>
      </div>
    </div>
  );
}

function ForceUpdateChecker({ children }: { children: React.ReactNode }) {
  const versionData = useQuery(api.appVersion.getAppVersion);
  if (versionData === undefined) return <>{children}</>;

  if (versionData && versionData.forceUpdate) {
    const needsUpdate = compareVersions(CURRENT_APP_VERSION, versionData.minVersion) < 0;
    if (needsUpdate) {
      const handleUpdate = async () => {
        if (Capacitor.getPlatform() === "android") {
          try {
            await AppUpdate.performImmediateUpdate();
            return;
          } catch {
            try {
              await AppUpdate.openAppStore({ androidPackageName: "saki.chat.co" });
            } catch {
              window.open("https://play.google.com/store/apps/details?id=saki.chat.co", "_blank", "noopener,noreferrer");
            }
            // Never fall through to location.reload() on Android. Reloading the
            // WebView while the force-update overlay is active triggers the
            // native "Leave page? Unsaved changes" dialog and causes a loop.
            return;
          }
        }
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.update())).catch(() => {});
        }
        window.location.reload();
      };
      return (
        <ForceUpdateScreen
          currentVersion={CURRENT_APP_VERSION}
          requiredVersion={versionData.version}
          releaseNotes={versionData.releaseNotes}
          onUpdate={handleUpdate}
        />
      );
    }
  }
  return <>{children}</>;
}

export default function App() {
  const splashDone = true;
  const { updateReady, registration, dismiss } = usePWAUpdate();
  const [splashAdDone, setSplashAdDone] = useState(false);

  useEffect(() => {
    (window as any).__sakiStartupMark?.("App mounted");
    if ((window as any).__hideSplash) (window as any).__hideSplash();
    const blockCtx = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', blockCtx);
    return () => document.removeEventListener('contextmenu', blockCtx);
  }, []);

  return (
    <BackgroundRoomProvider>
      <div className="h-full bg-white text-slate-900 flex flex-col" dir="rtl">
        <ForceUpdateChecker>
          {!splashAdDone && <SplashAdScreen onDone={() => setSplashAdDone(true)} />}
          {!splashDone && null}
          <Suspense fallback={null}>
            <SecurityWrapper />
            <GooglePlayUpdateChecker />
            <BackgroundRoomBubble />
          </Suspense>
          <CenteredToaster />
          {updateReady && registration && (
            <PWAUpdatePopup registration={registration} onDismiss={dismiss} />
          )}
        </ForceUpdateChecker>
      </div>
    </BackgroundRoomProvider>
  );
}

function SecurityWrapper() {
  const security = useSecurityGuard();
  const { user, isLoading } = useSupabase();

  if (security.isThreat && security.threatType) {
    return (
      <Suspense fallback={<PageLoader />}>
        <SecurityBlockScreen threatType={security.threatType} message={security.threatMessage} />
      </Suspense>
    );
  }

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <GoogleAuthDeepLinkHandler />
      {user ? (
        <ProfileProvider>
          <PushNotificationManager />
          <AuthenticatedApp />
        </ProfileProvider>
      ) : (
        <UnauthenticatedWithBanCheck />
      )}
      <Suspense fallback={null}>
        <GlobalBombBanner />
        <GlobalGiftBanner />
      </Suspense>
    </div>
  );
}

function UnauthenticatedWithBanCheck() {
  const fingerprint = useDeviceFingerprint();
  const banStatus = useQuery(api.appBan.checkBanStatus, fingerprint ? { fingerprint } : "skip");
  if (fingerprint && banStatus?.isBanned) {
    return (
      <Suspense fallback={<PageLoader />}>
        <BannedScreen reason={banStatus.reason ?? "تم حظر جهازك"} type={banStatus.type} banExpiresAt={banStatus.banExpiresAt} banDuration={banStatus.banDuration} />
      </Suspense>
    );
  }
  return <Suspense fallback={<PageLoader />}><LoginPage /></Suspense>;
}

function AuthenticatedApp() {
  const { profile, isLoading: profileLoading } = useProfile();
  const fingerprint = useDeviceFingerprint();
  const banStatus = null; // Will implement with Supabase RPC
  const registerDevice = async () => {}; // Will implement with Supabase RPC

  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [selectedRoomId, setSelectedRoomId] = useState<Id<"rooms"> | null>(null);
  const [bgRoomId, setBgRoomId] = useState<Id<"rooms"> | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);
  const [chatUserId, setChatUserId] = useState<Id<"users"> | null>(null);
  const [showRegisterProfile, setShowRegisterProfile] = useState(false);
  const [meSubPage, setMeSubPage] = useState<string | null>(null);
  const [homeSubActive, setHomeSubActive] = useState(false);
  const homeBackFnRef = useRef<(() => void) | null>(null);
  const [storyViewer, setStoryViewer] = useState<{ groups: any[]; initialIndex: number } | null>(null);
  const { setBgRoom, setReturnToRoom } = useBackgroundRoom();

  const [activeCall, setActiveCall] = useState<{
    callId: Id<"videoCalls">; channelName: string; isCallerSide: boolean;
    otherName: string; otherAvatarUrl?: string;
  } | null>(null);
  const [showOutgoing, setShowOutgoing] = useState(false);
  const [showDailyPopup, setShowDailyPopup] = useState(false);
  const [showNewUserPopup, setShowNewUserPopup] = useState(false);
  const checkinStatus = useQuery(api.dailyRewards.getCheckinStatus);
  const newUserStatus = useQuery(api.newUserRewards.getNewUserStatus);
  const liftExpiredBan = useMutation(api.appBan.liftExpiredBan);
  const forcedLogoutCheck = useQuery(api.appBan.checkForcedLogout);

  useEffect(() => {
    // Do not reload the WebView when the forced-logout query changes. The old
    // unconditional reload caused the Android confirmation dialog and startup loop.
    if (!forcedLogoutCheck?.shouldLogout) return;
    leaveAgoraGlobal();
  }, [forcedLogoutCheck?.shouldLogout]);

  useEffect(() => {
    const handlePushAction = (event: Event) => {
      const data = (event as CustomEvent<Record<string, any>>).detail ?? {};
      const otherUserId = data.otherUserId as Id<"users"> | undefined;
      const roomId = (data.roomId || data.room_id) as Id<"rooms"> | undefined;
      if (otherUserId && data.type === "direct_message") {
        setSelectedUserId(otherUserId);
        setChatUserId(otherUserId);
        setCurrentPage("user-profile");
      } else if (roomId) {
        setChatUserId(null);
        setSelectedUserId(null);
        setSelectedRoomId(roomId);
        setCurrentPage("room");
      } else if (data.type === "messages") {
        setCurrentPage("messages");
      }
    };
    window.addEventListener("saki:push-action", handlePushAction);
    return () => window.removeEventListener("saki:push-action", handlePushAction);
  }, []);

  useEffect(() => {
    if (fingerprint && profile) {
      fetch("https://api.ipify.org?format=json")
        .then((r) => r.json())
        .then((data) => { registerDevice({ fingerprint, userAgent: navigator.userAgent, ipAddress: data.ip }).catch(() => {}); })
        .catch(() => { registerDevice({ fingerprint, userAgent: navigator.userAgent }).catch(() => {}); });
      liftExpiredBan({ fingerprint }).catch(() => {});
    }
  }, [fingerprint, profile?.userId]);

  useEffect(() => {
    if (!profileLoading) {
      if (!profile) setShowRegisterProfile(true);
      else setShowRegisterProfile(false);
    }
  }, [profile, profileLoading]);

  useEffect(() => {
    if (!profile || checkinStatus === undefined) return;
    const todayKey = `daily_popup_shown_${Math.floor(Date.now() / 86400000)}`;
    if (!localStorage.getItem(todayKey)) {
      const t = setTimeout(() => { setShowDailyPopup(true); localStorage.setItem(todayKey, "1"); }, 1200);
      return () => clearTimeout(t);
    }
  }, [profile?._id, checkinStatus !== undefined]);

  useEffect(() => {
    if (!profile || newUserStatus === undefined) return;
    if (newUserStatus && !newUserStatus.claimed && newUserStatus.isNewUser) {
      const t = setTimeout(() => setShowNewUserPopup(true), 800);
      return () => clearTimeout(t);
    }
  }, [profile?._id, newUserStatus?.claimed]);

  if (fingerprint && banStatus?.isBanned) {
    return (
      <Suspense fallback={<PageLoader />}>
        <BannedScreen reason={banStatus.reason ?? "تم حظرك من التطبيق"} type={banStatus.type} banExpiresAt={banStatus.banExpiresAt} banDuration={banStatus.banDuration} />
      </Suspense>
    );
  }

  const canGoBack = !!meSubPage || !!chatUserId || homeSubActive ||
    currentPage !== "home" || !!storyViewer;

  useHardwareBack(() => {
    if (storyViewer) { setStoryViewer(null); return; }
    if (meSubPage) { setMeSubPage(null); return; }
    if (chatUserId) { setChatUserId(null); return; }
    if (currentPage === "dailyRewards") { setCurrentPage("me"); return; }
    if (currentPage === "aristocracy") { setCurrentPage("me"); return; }
    if (currentPage === "activities") { setCurrentPage("home"); return; }
    if (currentPage === "live") {
      if ((window as any).__sakiLiveHostActive) return;
      setCurrentPage("home");
      return;
    }
    if (currentPage === "user-profile") {
      if (selectedRoomId) { setCurrentPage("room"); setSelectedUserId(null); }
      else { setCurrentPage("home"); setSelectedUserId(null); }
      return;
    }
    if (currentPage === "create-room") { setCurrentPage("home"); return; }
    if (currentPage === "create-moment") { setCurrentPage("moments"); return; }
    if (currentPage === "create-reel") { setCurrentPage("reels"); return; }
    if (currentPage === "create-story") { setCurrentPage("moments"); return; }
    if (homeSubActive && homeBackFnRef.current) { homeBackFnRef.current(); return; }
    
    // Handle main navigation back to home
    if (currentPage !== "home") {
      setCurrentPage("home");
      return;
    }
  }, canGoBack);

  if (profile === undefined || banStatus === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a]">
        <div className="flex flex-col items-center gap-4">
          <img src="https://j.top4top.io/p_37559m1p51.jpg" alt="ساكي" style={{ width: 64, height: 64, borderRadius: 18, border: "2px solid rgba(168,85,247,0.5)" }} />
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (showRegisterProfile) {
    return <Suspense fallback={<PageLoader />}><RegisterPage onBack={() => {}} isProfileSetup /></Suspense>;
  }

  const activeRoomId = (currentPage === "room" || currentPage === "user-profile") ? selectedRoomId : bgRoomId;

  const handleBackgroundLeave = (capturedRoomId: Id<"rooms">) => {
    setBgRoomId(capturedRoomId);
    setReturnToRoom(() => {
      setBgRoom(null); setReturnToRoom(null); setSelectedRoomId(capturedRoomId);
      setBgRoomId(null); setMeSubPage(null); setChatUserId(null); setSelectedUserId(null); setCurrentPage("room");
    });
    setCurrentPage("home");
  };

  const handleRoomBack = () => {
    leaveAgoraGlobal(); setBgRoom(null); setReturnToRoom(null);
    setBgRoomId(null); setSelectedRoomId(null); setCurrentPage("home");
  };

  if (currentPage === "create-room") return <Suspense fallback={<PageLoader />}><CreateRoomPage onBack={() => setCurrentPage("home")} onSuccess={(id) => { setSelectedRoomId(id); setCurrentPage("room"); }} /></Suspense>;
  if (currentPage === "create-moment") return <Suspense fallback={<PageLoader />}><CreateMomentPage onBack={() => setCurrentPage("moments")} onSuccess={() => setCurrentPage("moments")} /></Suspense>;
  if (currentPage === "create-reel") return <Suspense fallback={<PageLoader />}><CreateReelPage onBack={() => setCurrentPage("reels")} onSuccess={() => setCurrentPage("reels")} /></Suspense>;
  if (currentPage === "create-story") return <Suspense fallback={<PageLoader />}><CreateStoryPage onBack={() => setCurrentPage("moments")} onSuccess={() => setCurrentPage("moments")} /></Suspense>;

  if (currentPage === "user-profile" && selectedUserId && !activeRoomId) {
    return (
      <Suspense fallback={<PageLoader />}>
        <>
          <GlobalGiftBanner />
          <UserProfilePage
            userId={selectedUserId}
            onBack={() => { setCurrentPage("home"); setSelectedUserId(null); setChatUserId(null); }}
            onMessage={(uid) => setChatUserId(uid)}
            onRoomSelect={(id) => { setSelectedRoomId(id); setSelectedUserId(null); setCurrentPage("room"); }}
          />
          {chatUserId && (
            <div className="fixed inset-0 z-[200] bg-[#0f0f1a] animate-slide-up-sheet">
              <ChatPage otherUserId={chatUserId} onBack={() => setChatUserId(null)}
                onViewProfile={(uid) => { setChatUserId(null); setSelectedUserId(uid); setCurrentPage("user-profile"); }}
                onStartVideoCall={(callId, channelName, otherName, otherAvatarUrl) => { setActiveCall({ callId, channelName, isCallerSide: true, otherName, otherAvatarUrl }); setShowOutgoing(true); }}
              />
            </div>
          )}
          <VideoCallsManager profile={profile} activeCall={activeCall} setActiveCall={setActiveCall} showOutgoing={showOutgoing} setShowOutgoing={setShowOutgoing} />
        </>
      </Suspense>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden">
      {activeRoomId && (
        <div className="fixed inset-0 z-[100]" style={{ display: (currentPage === "room" || (currentPage === "user-profile" && !!activeRoomId)) ? "flex" : "none", flexDirection: "column" }}>
          <Suspense fallback={null}>
            <GlobalGiftBanner />
            <RoomPage
              roomId={activeRoomId} onBack={handleRoomBack}
              onBackgroundLeave={() => handleBackgroundLeave(activeRoomId)}
              onViewProfile={(uid) => { setSelectedUserId(uid); setCurrentPage("user-profile"); }}
              onMessage={(uid) => setChatUserId(uid)}
              isSubPageOpen={currentPage === "user-profile" || !!chatUserId}
            />
            {chatUserId && currentPage === "room" && (
              <div className="fixed inset-0 z-[200] bg-[#0f0f1a] animate-slide-up-sheet">
                <ChatPage otherUserId={chatUserId} onBack={() => setChatUserId(null)}
                  onViewProfile={(uid) => { setChatUserId(null); setSelectedUserId(uid); setCurrentPage("user-profile"); }}
                  onStartVideoCall={(callId, channelName, otherName, otherAvatarUrl) => { setActiveCall({ callId, channelName, isCallerSide: true, otherName, otherAvatarUrl }); }}
                />
              </div>
            )}
            {currentPage === "user-profile" && selectedUserId && activeRoomId && (
              <div className="fixed inset-0 z-[160] bg-[#0f0f1a] animate-slide-up-sheet" style={{ overflowY: "auto", overflowX: "hidden" }}>
                <UserProfilePage userId={selectedUserId}
                  onBack={() => { setCurrentPage("room"); setSelectedUserId(null); }}
                  onMessage={(uid) => { setSelectedUserId(null); setCurrentPage("room"); setChatUserId(uid); }}
                  onRoomSelect={(id) => { setSelectedRoomId(id); setSelectedUserId(null); setCurrentPage("room"); }}
                />
              </div>
            )}
          </Suspense>
        </div>
      )}

      <Suspense fallback={null}>
        <GlobalChatNotification />
        <GlobalGiftBanner />
        <GlobalLiveEventBanner />
        <GlobalLuckyBagBanner onGoToRoom={(roomId) => { setBgRoomId(null); setBgRoom(null); setReturnToRoom(null); setSelectedRoomId(roomId as Id<"rooms">); setCurrentPage("room"); }} />
      </Suspense>

      <div style={{ display: currentPage === "room" ? "none" : "flex", flexDirection: "column", flex: 1, minHeight: 0, overflowX: "hidden", overflowY: currentPage === "aristocracy" ? "auto" : "hidden", WebkitOverflowScrolling: "touch", touchAction: currentPage === "aristocracy" ? "pan-y" : undefined, paddingBottom: (currentPage !== "activities" && currentPage !== "aristocracy" && !homeSubActive) ? "calc(60px + env(safe-area-inset-bottom))" : 0 }}>
        <Suspense fallback={<PageLoader />}>
          {currentPage === "activities" && <ActivitiesPage onBack={() => setCurrentPage("home")} />}
          {currentPage === "live" && <LiveStreamPage onBack={() => setCurrentPage("home")} onRoomSelect={(id) => { setSelectedRoomId(id); setCurrentPage("room"); }} />}
          {currentPage === "dailyRewards" && <DailyRewardsPage onBack={() => setCurrentPage("me")} />}
          {currentPage === "aristocracy" && <AristocracyPage onBack={() => setCurrentPage("me")} onAdminAristocracy={profile?.isSuperAdmin ? () => setMeSubPage("admin-aristocracy") : undefined} />}
          {currentPage === "home" && (
            <HomePage
              onRoomSelect={(id) => { setSelectedRoomId(id); setCurrentPage("room"); }}
              setCurrentPage={setCurrentPage}
              onUserSelect={(id) => { setSelectedUserId(id); setCurrentPage("user-profile"); }}
              onSubPageChange={(active, backFn) => { setHomeSubActive(active); homeBackFnRef.current = backFn ?? null; }}
            />
          )}
          {currentPage === "moments" && <MomentsPage setCurrentPage={setCurrentPage} onUserSelect={(id) => { setSelectedUserId(id); setCurrentPage("user-profile"); }} onOpenStoryViewer={(groups, idx) => setStoryViewer({ groups, initialIndex: idx })} />}
          {currentPage === "reels" && <ReelsPage setCurrentPage={setCurrentPage} onUserSelect={(id) => { setSelectedUserId(id); setCurrentPage("user-profile"); }} />}
          {currentPage === "messages" && <MessagesPage onUserSelect={(id) => { setSelectedUserId(id); setCurrentPage("user-profile"); }} />}
          {currentPage === "me" && (
            <MePage
              setCurrentPage={setCurrentPage}
              onOpenProfile={() => { if (profile?.userId) { setSelectedUserId(profile.userId); setCurrentPage("user-profile"); } }}
              onOpenWallet={() => setMeSubPage("wallet")} onOpenStore={() => setMeSubPage("store")}
              onOpenPro={() => setMeSubPage("pro")} onOpenProSettings={() => setMeSubPage("pro-settings")} onOpenFamily={() => setMeSubPage("host-agency")}
              onOpenAgent={() => setMeSubPage("agent")} onOpenSettings={() => setMeSubPage("settings")}
              onOpenEdit={() => setMeSubPage("edit")} onOpenLevel={() => setMeSubPage("level")}
              onOpenVipFeatures={() => setMeSubPage("vip-features")} onOpenBan={() => setMeSubPage("ban")}
              onOpenAdminDashboard={() => setMeSubPage("admin-dashboard")}
              onOpenAristocracy={() => setCurrentPage("aristocracy")} onOpenCpHome={() => setMeSubPage("cp-home")}
            />
          )}
        </Suspense>
      </div>

      {currentPage !== "room" && currentPage !== "activities" && currentPage !== "aristocracy" && currentPage !== "user-profile" && !homeSubActive && (
        <Suspense fallback={null}><BottomNavComponent currentPage={currentPage} setCurrentPage={setCurrentPage} /></Suspense>
      )}

      {chatUserId && currentPage !== "room" && (
        <div className="fixed inset-0 z-[200] bg-[#0f0f1a] animate-slide-up-sheet">
          <Suspense fallback={<PageLoader />}>
            <ChatPage otherUserId={chatUserId} onBack={() => setChatUserId(null)}
              onViewProfile={(uid) => { setChatUserId(null); setSelectedUserId(uid); setCurrentPage("user-profile"); }}
              onStartVideoCall={(callId, channelName, otherName, otherAvatarUrl) => { setActiveCall({ callId, channelName, isCallerSide: true, otherName, otherAvatarUrl }); }}
            />
          </Suspense>
        </div>
      )}

      {storyViewer && (
        <Suspense fallback={null}>
          <StoryViewerPage storyGroups={storyViewer.groups} initialGroupIndex={storyViewer.initialIndex} myUserId={profile?.userId} onClose={() => setStoryViewer(null)} onOpenChat={(uid) => { setStoryViewer(null); setChatUserId(uid); }} />
        </Suspense>
      )}

      <Suspense fallback={null}>
        {meSubPage === "host-agency" && <div className="fixed inset-0 z-[300] bg-[#0f0f1a]"><HostAgencyPage onBack={() => setMeSubPage(null)} /></div>}
        {meSubPage === "ban" && <div className="fixed inset-0 z-[300] bg-[#0f0f1a]"><AdminBanPage onBack={() => setMeSubPage(null)} /></div>}
        {meSubPage === "admin-dashboard" && (
          <div className="fixed inset-0 z-[300] bg-[#0f0f1a]">
            {profile?.isSuperAdmin ? <AdminDashboardPage onBack={() => setMeSubPage(null)} onOpenBan={() => setMeSubPage("ban")} />
              : (profile as any)?.isCustomerService ? <CustomerServiceDashboard onBack={() => setMeSubPage(null)} /> : null}
          </div>
        )}
        {meSubPage === "admin-aristocracy" && profile?.isSuperAdmin && <div className="fixed inset-0 z-[300] bg-[#0f0f1a]"><AdminAristocracyPage onBack={() => setMeSubPage(null)} /></div>}
        {meSubPage === "vip-features" && <div className="fixed inset-0 z-[300] bg-[#0f0f1a]"><VipFeaturesPage onBack={() => setMeSubPage(null)} /></div>}
        {meSubPage === "pro" && <div className="fixed inset-0 z-[300] bg-white"><ProMembershipPage onBack={() => setMeSubPage(null)} onOpenSettings={() => setMeSubPage("pro-settings")} /></div>}
        {meSubPage === "pro-settings" && <div className="fixed inset-0 z-[300] bg-white"><ProSettingsPage onBack={() => setMeSubPage("pro")} /></div>}
        {meSubPage === "cp-home" && profile && (
          <div className="fixed inset-0 z-[300] bg-[#0f0f1a]">
            <CpHomePage userId={profile.userId} onBack={() => setMeSubPage(null)}
              onMessage={(uid) => { setMeSubPage(null); setChatUserId(uid); }}
              onProfile={(uid) => { setMeSubPage(null); setSelectedUserId(uid); setCurrentPage("user-profile"); }}
            />
          </div>
        )}
        {meSubPage && !["ban","admin-dashboard","admin-aristocracy","vip-features","cp-home","host-agency","pro","pro-settings"].includes(meSubPage) && (
          <div className="fixed inset-0 z-[300] bg-[#0f0f1a]">
            <ProfilePage setCurrentPage={setCurrentPage} onVipOpen={() => {}} initialSubPage={meSubPage as any}
              onBack={() => setMeSubPage(null)}
              onMessage={(uid) => { setMeSubPage(null); setChatUserId(uid); }}
              onViewProfile={(uid) => { setMeSubPage(null); setSelectedUserId(uid); setCurrentPage("user-profile"); }}
            />
          </div>
        )}
      </Suspense>

      <VideoCallsManager profile={profile} activeCall={activeCall} setActiveCall={setActiveCall} showOutgoing={showOutgoing} setShowOutgoing={setShowOutgoing} />

      <Suspense fallback={null}>
        {showDailyPopup && !showNewUserPopup && <DailyRewardsPopup onClose={() => setShowDailyPopup(false)} />}
        {showNewUserPopup && <NewUserWelcomePopup onClose={() => setShowNewUserPopup(false)} />}
      </Suspense>
    </div>
  );
}
