// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { formatNumber } from "../../lib/formatNumber";
import { toast } from "sonner";

interface PKDetailsSheetProps {
  roomId: Id<"rooms">;
  isOwner: boolean;
  isAdmin?: boolean;
  onClose: () => void;
  onOpenFullSheet: () => void;
}

export default function PKDetailsSheet({ roomId, isOwner, isAdmin = false, onClose, onOpenFullSheet }: PKDetailsSheetProps) {
  const canManage = isOwner || isAdmin;
  const activePK = useQuery(api.pk.getActivePKBattle, { roomId });
  const [now, setNow] = useState(() => Date.now());

  const room1Contribs = useQuery(
    api.pk.getPKContributors,
    activePK?.status === "active" ? { pkId: activePK._id, roomId: activePK.room1Id } : "skip"
  );
  const room2Contribs = useQuery(
    api.pk.getPKContributors,
    activePK?.status === "active" ? { pkId: activePK._id, roomId: activePK.room2Id } : "skip"
  );

  const acceptChallenge = useMutation(api.pk.acceptPKChallenge);
  const declineChallenge = useMutation(api.pk.declinePKChallenge);
  const endEarly = useMutation(api.pk.endPKBattleEarly);
  const [loading, setLoading] = useState(false);

  const timeLeft = activePK?.endsAt ? Math.max(0, activePK.endsAt - now) : 0;
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  const handleAccept = async () => {
    if (!activePK) return;
    setLoading(true);
    try { await acceptChallenge({ pkId: activePK._id }); toast.success("تم قبول التحدي! ⚔️"); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleDecline = async () => {
    if (!activePK) return;
    setLoading(true);
    try { await declineChallenge({ pkId: activePK._id }); toast.success("تم رفض التحدي"); onClose(); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleEndEarly = async () => {
    if (!activePK) return;
    setLoading(true);
    try { await endEarly({ pkId: activePK._id }); toast.success("تم إنهاء المعركة"); onClose(); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  if (!activePK) {
    return (
      <div className="fixed inset-0 z-[65] flex flex-col justify-end" onClick={onClose}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="relative rounded-t-3xl border-t border-orange-500/30 animate-slide-up-sheet p-6"
          style={{ background: "linear-gradient(180deg,#1a0a00 0%,#0f0800 100%)" }}
          onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-center mb-4"><div className="w-10 h-1 bg-white/20 rounded-full" /></div>
          <div className="text-center py-8">
            <span className="text-4xl">⚔️</span>
            <p className="text-gray-400 text-sm mt-3">لا يوجد تحدي PK نشط</p>
            <button onClick={onOpenFullSheet} className="mt-4 px-6 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", color: "white" }}>
              إدارة PK
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPending = activePK.status === "pending";
  const isActive = activePK.status === "active";
  const isTarget = activePK.room2Id === roomId;
  const isChallenger = activePK.room1Id === roomId;

  const totalCoins = (activePK.room1Coins ?? 0) + (activePK.room2Coins ?? 0);
  const room1Pct = totalCoins > 0 ? ((activePK.room1Coins ?? 0) / totalCoins) * 100 : 50;
  const room2Pct = 100 - room1Pct;

  const blueColor = "#3b82f6";
  const redColor = "#ef4444";

  return (
    <div className="fixed inset-0 z-[65] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative rounded-t-3xl border-t border-orange-500/30 animate-slide-up-sheet max-h-[80vh] overflow-hidden flex flex-col"
        style={{ background: "linear-gradient(180deg,#050015 0%,#0a0005 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl animate-pk-sword">⚔️</span>
            <div>
              <h2 className="text-white font-black text-sm">
                {isPending ? "تحدي PK معلّق" : "معركة PK نشطة 🔥"}
              </h2>
              {isActive && (
                <p className="text-orange-400 text-xs tabular-nums font-bold">
                  ⏱ {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")} متبقي
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-3">
          {/* Score */}
          <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-center flex-1">
                <p className="text-xs font-black truncate" style={{ color: blueColor }}>{activePK.room1Name}</p>
                <p className="text-[9px]" style={{ color: blueColor }}>🐯 النمور</p>
                <p className="text-yellow-400 font-black text-base">{formatNumber(activePK.room1Coins ?? 0)}</p>
                <p className="text-gray-500 text-[9px]">🎁</p>
              </div>
              <div className="text-orange-400 font-black text-lg px-2">VS</div>
              <div className="text-center flex-1">
                <p className="text-xs font-black truncate" style={{ color: redColor }}>{activePK.room2Name}</p>
                <p className="text-[9px]" style={{ color: redColor }}>🦁 الأسود</p>
                <p className="text-yellow-400 font-black text-base">{formatNumber(activePK.room2Coins ?? 0)}</p>
                <p className="text-gray-500 text-[9px]">🎁</p>
              </div>
            </div>
            {isActive && (
              <div className="h-2.5 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full transition-all duration-700" style={{ width: `${room1Pct}%`, background: `linear-gradient(90deg,${blueColor},#60a5fa)`, borderRadius: "9999px 0 0 9999px" }} />
                <div className="h-full transition-all duration-700" style={{ width: `${room2Pct}%`, background: "linear-gradient(90deg,#dc2626,#ef4444)", borderRadius: "0 9999px 9999px 0" }} />
              </div>
            )}
          </div>

          {/* Top contributors */}
          {isActive && ((room1Contribs?.length ?? 0) > 0 || (room2Contribs?.length ?? 0) > 0) && (
            <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-white font-bold text-xs mb-2">🏅 أكثر المرسلين هدايا</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[9px] font-bold mb-1.5" style={{ color: blueColor }}>🐯 {activePK.room1Name}</p>
                  {(room1Contribs ?? []).slice(0, 3).map((c, i) => (
                    <div key={c._id} className="flex items-center gap-1.5 mb-1">
                      <span className="text-[9px] text-gray-500 w-3">{i + 1}</span>
                      <span className="text-white text-[9px] truncate flex-1">{c.userName}</span>
                      <span className="text-yellow-400 text-[9px] font-bold">{formatNumber(c.coins)}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-[9px] font-bold mb-1.5" style={{ color: redColor }}>🦁 {activePK.room2Name}</p>
                  {(room2Contribs ?? []).slice(0, 3).map((c, i) => (
                    <div key={c._id} className="flex items-center gap-1.5 mb-1">
                      <span className="text-[9px] text-gray-500 w-3">{i + 1}</span>
                      <span className="text-white text-[9px] truncate flex-1">{c.userName}</span>
                      <span className="text-yellow-400 text-[9px] font-bold">{formatNumber(c.coins)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Gift support info */}
          {isActive && (
            <div className="rounded-2xl p-3 text-center" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
              <p className="text-yellow-400 text-xs font-bold">🎁 ادعم غرفتك بإرسال الهدايا!</p>
              <p className="text-gray-400 text-[10px] mt-0.5">أرسل هدايا لأعضاء غرفتك على المقاعد لزيادة نقاطها</p>
            </div>
          )}

          {/* Pending actions */}
          {isPending && isTarget && canManage && (
            <div className="flex gap-3">
              <button onClick={handleDecline} disabled={loading}
                className="flex-1 py-3 rounded-2xl font-bold text-sm bg-red-500/15 border border-red-500/30 text-red-400 disabled:opacity-50">
                رفض
              </button>
              <button onClick={handleAccept} disabled={loading}
                className="flex-1 py-3 rounded-2xl font-bold text-sm disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", color: "white" }}>
                {loading ? "..." : "قبول ⚔️"}
              </button>
            </div>
          )}

          {isPending && isChallenger && canManage && (
            <button onClick={handleDecline} disabled={loading}
              className="w-full py-3 rounded-2xl font-bold text-sm bg-red-500/10 border border-red-500/25 text-red-400 disabled:opacity-50">
              إلغاء التحدي
            </button>
          )}

          {isActive && canManage && (
            <button onClick={handleEndEarly} disabled={loading}
              className="w-full py-3 rounded-2xl font-bold text-sm bg-red-500/10 border border-red-500/25 text-red-400 disabled:opacity-50">
              إنهاء المعركة مبكراً
            </button>
          )}

          {/* Full management */}
          <button onClick={() => { onClose(); onOpenFullSheet(); }}
            className="w-full py-2.5 rounded-2xl font-bold text-xs"
            style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)", color: "#fb923c" }}>
            إدارة PK الكاملة ⚙️
          </button>
        </div>
      </div>
    </div>
  );
}
