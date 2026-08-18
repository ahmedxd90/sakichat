// @ts-nocheck
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "../../lib/toast";
import { PKBattleSheetProps, PKTab } from "./pk/PKTypes";
import PKStatusTab from "./pk/PKStatusTab";
import PKReadyListTab from "./pk/PKReadyListTab";
import PKChallengeTab from "./pk/PKChallengeTab";
import PKPendingView from "./pk/PKPendingView";
import PKActiveView from "./pk/PKActiveView";

export default function PKBattleSheet({
  roomId,
  isOwner,
  isAdmin = false,
  myCoins,
  onClose,
}: PKBattleSheetProps) {
  const canManage = isOwner || isAdmin;
  const [tab, setTab] = useState<PKTab>("active");
  const [selectedDuration, setSelectedDuration] = useState(10);
  const [loading, setLoading] = useState(false);

  // ── Queries ──
  const activePK = useQuery(api.pk.getActivePKBattle, { roomId });
  const myReadyStatus = useQuery(api.pk.getMyReadyStatus, { roomId });
  const readyRooms = useQuery(api.pk.getReadyRoomsForPK, { excludeRoomId: roomId });
  const availableRooms = useQuery(api.pk.getAvailableRoomsForPK, { excludeRoomId: roomId });

  const room1Contribs = useQuery(
    api.pk.getPKContributors,
    activePK?.status === "active" ? { pkId: activePK._id, roomId: activePK.room1Id } : "skip"
  );
  const room2Contribs = useQuery(
    api.pk.getPKContributors,
    activePK?.status === "active" ? { pkId: activePK._id, roomId: activePK.room2Id } : "skip"
  );

  // ── Mutations ──
  const sendChallenge = useMutation(api.pk.sendPKChallenge);
  const acceptChallenge = useMutation(api.pk.acceptPKChallenge);
  const declineChallenge = useMutation(api.pk.declinePKChallenge);
  const endEarly = useMutation(api.pk.endPKBattleEarly);
  const declareReady = useMutation(api.pk.declareReadyForPK);
  const cancelReady = useMutation(api.pk.cancelReadyForPK);

  // ── Timers ──
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!activePK || activePK.status !== "active") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [activePK?.status]);

  const [readyNow, setReadyNow] = useState(() => Date.now());
  useEffect(() => {
    if (!myReadyStatus) return;
    const t = setInterval(() => setReadyNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [myReadyStatus?._id]);

  const timeLeft = activePK?.endsAt ? Math.max(0, activePK.endsAt - now) : 0;
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  const readyTimeLeft = myReadyStatus ? Math.max(0, myReadyStatus.expiresAt - readyNow) : 0;
  const readyMins = Math.floor(readyTimeLeft / 60000);
  const readySecs = Math.floor((readyTimeLeft % 60000) / 1000);

  // ── Handlers ──
  const handleDeclareReady = async () => {
    setLoading(true);
    try {
      await declareReady({ roomId, durationMinutes: selectedDuration });
      toast.success("تم الإعلان عن جاهزيتك للتحدي! ⚔️");
      setTab("active");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleCancelReady = async () => {
    setLoading(true);
    try {
      await cancelReady({ roomId });
      toast.success("تم إلغاء الإعلان");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleSendChallenge = async (targetRoomId: Id<"rooms">, duration?: number) => {
    const dur = duration ?? selectedDuration;
    setLoading(true);
    try {
      await sendChallenge({ challengerRoomId: roomId, targetRoomId, durationMinutes: dur });
      toast.success("تم إرسال تحدي PK! ⚔️");
      setTab("active");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleAccept = async () => {
    if (!activePK) return;
    setLoading(true);
    try {
      await acceptChallenge({ pkId: activePK._id });
      toast.success("تم قبول التحدي! المعركة بدأت ⚔️");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleDecline = async () => {
    if (!activePK) return;
    setLoading(true);
    try {
      await declineChallenge({ pkId: activePK._id });
      toast.success("تم رفض التحدي");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleEndEarly = async () => {
    if (!activePK) return;
    setLoading(true);
    try {
      await endEarly({ pkId: activePK._id });
      toast.success("تم إنهاء المعركة");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const isPending = activePK?.status === "pending";
  const isActive = activePK?.status === "active";

  return (
    <div className="fixed inset-0 z-[65] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative rounded-t-3xl border-t border-orange-500/30 animate-slide-up-sheet max-h-[85vh] overflow-hidden flex flex-col"
        style={{ background: "linear-gradient(180deg,#050015 0%,#0a0005 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round">
              <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/>
              <line x1="13" y1="19" x2="19" y2="13"/>
              <line x1="16" y1="16" x2="20" y2="20"/>
              <line x1="19" y1="21" x2="21" y2="19"/>
            </svg>
            <div>
              <h2 className="text-white font-black text-base">تحدي PK</h2>
              <p className="text-orange-400/70 text-xs">الدعم عبر الهدايا فقط للأعضاء على المقاعد</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tabs — only when no active/pending PK */}
        {!activePK && (
          <div className="flex gap-1.5 px-5 mb-3 flex-shrink-0">
            {[
              { id: "active" as PKTab, label: "الحالة" },
              { id: "ready_list" as PKTab, label: `الجاهزون${readyRooms?.length ? ` (${readyRooms.length})` : ""}` },
              { id: "challenge" as PKTab, label: "تحدي مباشر" },
            ].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                style={tab === t.id
                  ? { background: "rgba(249,115,22,0.25)", border: "1px solid rgba(249,115,22,0.5)", color: "#fb923c" }
                  : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#6b7280" }
                }>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {!activePK && tab === "active" && (
            <PKStatusTab
              canManage={canManage}
              myReadyStatus={myReadyStatus}
              selectedDuration={selectedDuration}
              onDurationChange={setSelectedDuration}
              onDeclareReady={handleDeclareReady}
              onCancelReady={handleCancelReady}
              onGoReadyList={() => setTab("ready_list")}
              onGoChallenge={() => setTab("challenge")}
              loading={loading}
              readyMins={readyMins}
              readySecs={readySecs}
            />
          )}

          {!activePK && tab === "ready_list" && (
            <PKReadyListTab
              readyRooms={readyRooms}
              canManage={canManage}
              loading={loading}
              onChallenge={handleSendChallenge}
              onGoDirectChallenge={() => setTab("challenge")}
            />
          )}

          {!activePK && tab === "challenge" && (
            <PKChallengeTab
              availableRooms={availableRooms}
              canManage={canManage}
              loading={loading}
              selectedDuration={selectedDuration}
              onDurationChange={setSelectedDuration}
              onSendChallenge={handleSendChallenge}
            />
          )}

          {activePK && isPending && (
            <PKPendingView
              activePK={activePK}
              roomId={roomId}
              canManage={canManage}
              loading={loading}
              onAccept={handleAccept}
              onDecline={handleDecline}
            />
          )}

          {activePK && isActive && (
            <PKActiveView
              activePK={activePK}
              roomId={roomId}
              canManage={canManage}
              myCoins={myCoins}
              loading={loading}
              minutes={minutes}
              seconds={seconds}
              room1Contribs={room1Contribs}
              room2Contribs={room2Contribs}
              onEndEarly={handleEndEarly}
            />
          )}
        </div>
      </div>
    </div>
  );
}
