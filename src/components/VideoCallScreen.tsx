// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAgoraVideoCall } from "../hooks/useAgoraVideoCall";
import { toast } from "sonner";
import { GIFT_CATEGORIES } from "../types/room";
import { formatNumber } from "../lib/formatNumber";

const COST_PER_MINUTE = 2000;

interface Props {
  callId: Id<"videoCalls">;
  channelName: string;
  myUserId: string;
  isCallerSide: boolean;
  otherName: string;
  otherAvatarUrl?: string;
  myCoins: number;
  onEnd: () => void;
}

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function VideoCallScreen({ callId, channelName, myUserId, isCallerSide, otherName, otherAvatarUrl, myCoins, onEnd }: Props) {
  const endCall = useMutation(api.videoCalls.endCall);
  const billMinute = useMutation(api.videoCalls.billMinute);
  const callData = useQuery(api.videoCalls.getCall, { callId });
  const customGifts = useQuery(api.store.getCustomGifts);

  const [duration, setDuration] = useState(0);
  const [showGifts, setShowGifts] = useState(false);
  const [giftsCategory, setGiftsCategory] = useState("general");
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [sendingGift, setSendingGift] = useState(false);
  const [coins, setCoins] = useState(myCoins);
  const [callEnded, setCallEnded] = useState(false);
  const [endReason, setEndReason] = useState<string | null>(null);

  const billingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { isConnected, isConnecting, isMuted, isCameraOff, remoteUser, error, localVideoRef, remoteVideoRef, toggleMute, toggleCamera, switchCamera, leave } =
    useAgoraVideoCall(channelName, myUserId, !callEnded);

  // مراقبة حالة المكالمة
  useEffect(() => {
    if (!callData) return;
    if ((callData.status === "ended" || callData.status === "declined") && !callEnded) {
      setCallEnded(true);
      setEndReason(callData.status === "declined" ? "رُفضت المكالمة" : "انتهت المكالمة");
      leave();
      setTimeout(onEnd, 2500);
    }
  }, [callData?.status]);

  // عداد الوقت
  useEffect(() => {
    if (!isConnected) return;
    durationTimerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    return () => { if (durationTimerRef.current) clearInterval(durationTimerRef.current); };
  }, [isConnected]);

  // فوترة كل دقيقة (المتصل فقط)
  useEffect(() => {
    if (!isConnected || !isCallerSide) return;
    billingRef.current = setInterval(async () => {
      try {
        const result = await billMinute({ callId });
        if (result?.ended) {
          setCallEnded(true);
          setEndReason(result.reason === "insufficient_coins" ? "انتهى رصيدك 💰" : "انتهت المكالمة");
          leave();
          setTimeout(onEnd, 2500);
        } else if (result?.remainingCoins !== undefined) {
          setCoins(result.remainingCoins);
        }
      } catch (e) { console.error(e); }
    }, 60000);
    return () => { if (billingRef.current) clearInterval(billingRef.current); };
  }, [isConnected, isCallerSide, callId]);

  const handleEnd = useCallback(async () => {
    if (billingRef.current) clearInterval(billingRef.current);
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    try { await endCall({ callId }); } catch (_) {}
    await leave();
    onEnd();
  }, [callId, leave, onEnd]);

  const handleSendGift = async () => {
    if (!selectedGift || sendingGift) return;
    if (coins < selectedGift.price) { toast.error("رصيدك غير كافٍ"); return; }
    setSendingGift(true);
    try {
      toast.success(`تم إرسال ${selectedGift.name} 🎁`);
      setCoins(c => c - selectedGift.price);
      setSelectedGift(null);
      setShowGifts(false);
    } finally { setSendingGift(false); }
  };

  const filteredGifts = customGifts?.filter(g => g.category === giftsCategory) ?? [];

  // شاشة انتهاء المكالمة
  if (callEnded) {
    return (
      <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/95" dir="rtl">
        <div className="text-center px-8">
          <div className="w-24 h-24 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center mx-auto mb-5">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7 2 2 0 011.72 2v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.42 19.42 0 013.43 9.65 19.79 19.79 0 01.36 1a2 2 0 012-2.18h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.34 6.68" />
              <line x1="23" y1="1" x2="1" y2="23" />
            </svg>
          </div>
          <p className="text-white font-black text-2xl mb-2">{endReason ?? "انتهت المكالمة"}</p>
          <p className="text-gray-400 text-base mb-2">⏱️ {fmt(duration)}</p>
          {isCallerSide && duration > 0 && (
            <p className="text-yellow-400 text-sm">💰 التكلفة: {(Math.ceil(duration / 60) * COST_PER_MINUTE).toLocaleString()} عملة</p>
          )}
          {!isCallerSide && duration > 0 && (
            <p className="text-green-400 text-sm">💎 ربحت: {Math.floor(Math.ceil(duration / 60) * COST_PER_MINUTE * 0.7).toLocaleString()} ماسة</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[500] bg-black flex flex-col" dir="rtl">
      {/* Remote Video - ALWAYS in DOM so Agora can play into it */}
      <div className="absolute inset-0">
        {/* The actual video container - always mounted */}
        <div
          ref={remoteVideoRef}
          className="w-full h-full"
          style={{ display: remoteUser?.videoTrack ? "block" : "none" }}
        />
        {/* Avatar fallback when no remote video */}
        {!remoteUser?.videoTrack && (
          <div
            className="w-full h-full flex flex-col items-center justify-center"
            style={{ background: "linear-gradient(180deg,#0d0020 0%,#1a0035 50%,#0d0020 100%)" }}
          >
            <div
              className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-500/60 mb-5 shadow-2xl"
              style={{ boxShadow: "0 0 40px rgba(168,85,247,0.4)" }}
            >
              {otherAvatarUrl
                ? <img src={otherAvatarUrl} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-5xl font-black">{otherName?.[0]}</div>
              }
            </div>
            <p className="text-white font-black text-2xl mb-3">{otherName}</p>
            {isConnecting ? (
              <div className="flex items-center gap-2">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            ) : isConnected ? (
              <p className="text-gray-400 text-sm">الكاميرا مغلقة</p>
            ) : error ? (
              <p className="text-red-400 text-xs text-center px-4">{error}</p>
            ) : (
              <p className="text-gray-500 text-sm">في انتظار الاتصال...</p>
            )}
          </div>
        )}
      </div>

      {/* Top gradient */}
      <div className="absolute inset-x-0 top-0 h-44 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)" }} />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-12 pb-3">
        <div className="flex items-center gap-2 bg-black/50 rounded-2xl px-3 py-1.5 backdrop-blur-sm">
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-yellow-400"}`} />
          <span className="text-white font-black text-lg">{fmt(duration)}</span>
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-sm drop-shadow-lg">{otherName}</p>
          {isConnecting && <p className="text-purple-300 text-xs animate-pulse">جارٍ الاتصال...</p>}
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
        {isCallerSide ? (
          <div className="flex items-center gap-1.5 bg-black/50 rounded-2xl px-3 py-1.5 backdrop-blur-sm">
            <span className="text-yellow-400 text-sm">🪙</span>
            <span className="text-yellow-400 text-sm font-bold">{formatNumber(coins)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-black/50 rounded-2xl px-3 py-1.5 backdrop-blur-sm">
            <span className="text-green-400 text-sm">💎</span>
            <span className="text-green-400 text-xs font-bold">+{Math.floor(COST_PER_MINUTE * 0.7 * Math.ceil(duration / 60)).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Local Video (PiP) - ALWAYS in DOM */}
      <div className="absolute top-28 left-4 z-20 w-28 h-40 rounded-2xl overflow-hidden shadow-2xl"
        style={{ border: "2px solid rgba(255,255,255,0.3)" }}>
        {/* Always mount the div so Agora can play into it */}
        <div
          ref={localVideoRef}
          className="w-full h-full bg-black"
          style={{ display: isCameraOff ? "none" : "block" }}
        />
        {isCameraOff && (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
              <path d="M16 16v1a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h2m5.66 0H14a2 2 0 012 2v3.34" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          </div>
        )}
      </div>

      {/* Cost indicator */}
      {isCallerSide && isConnected && (
        <div className="absolute top-28 right-4 z-20 bg-black/60 backdrop-blur-sm rounded-2xl px-3 py-2 text-center">
          <p className="text-yellow-400 text-xs font-black">{COST_PER_MINUTE.toLocaleString()}</p>
          <p className="text-gray-400 text-[9px]">🪙/دقيقة</p>
        </div>
      )}

      {/* Gifts Sheet */}
      {showGifts && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end" onClick={() => setShowGifts(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative rounded-t-3xl overflow-hidden flex flex-col"
            style={{ height: "65%", background: "#181828" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
              <div className="w-8 h-1 rounded-full bg-white/20" />
            </div>
            <div className="flex items-center justify-between px-4 pb-2 flex-shrink-0">
              <p className="text-white font-black text-sm">إرسال هدية 🎁</p>
              <div className="flex items-center gap-1 bg-yellow-500/10 rounded-xl px-2 py-1">
                <span className="text-yellow-400 text-xs">🪙</span>
                <span className="text-yellow-400 text-xs font-bold">{formatNumber(coins)}</span>
              </div>
            </div>
            <div className="flex gap-1.5 px-3 pb-2 overflow-x-auto scrollbar-hide flex-shrink-0">
              {GIFT_CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setGiftsCategory(cat.id)}
                  className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all"
                  style={giftsCategory === cat.id
                    ? { borderColor: "#fbbf24", background: "rgba(251,191,36,0.18)", color: "#fbbf24" }
                    : { borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#6b7280" }}>
                  <span>{cat.emoji}</span><span>{cat.label}</span>
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-2 min-h-0">
              {filteredGifts.length === 0
                ? <div className="flex flex-col items-center justify-center py-8"><span className="text-3xl">🎁</span><p className="text-gray-400 text-xs mt-2">لا توجد هدايا</p></div>
                : <div className="grid grid-cols-4 gap-2">
                    {filteredGifts.map(gift => {
                      const isSel = selectedGift?._id === gift._id;
                      return (
                        <button key={gift._id} onClick={() => setSelectedGift(isSel ? null : gift)}
                          className="flex flex-col rounded-xl border overflow-hidden transition-all active:scale-95"
                          style={isSel ? { borderColor: "#fbbf24", background: "#2a2a3e" } : { borderColor: "rgba(255,255,255,0.08)", background: "#1e1e30" }}>
                          <div className="aspect-square bg-black relative overflow-hidden">
                            {gift.thumbnailUrl || gift.videoUrl
                              ? <img src={gift.thumbnailUrl || gift.videoUrl} alt={gift.name} className="absolute inset-0 w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-2xl">🎁</div>}
                            {isSel && (
                              <div className="absolute inset-0 bg-yellow-500/20 flex items-center justify-center">
                                <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="px-1 py-1">
                            <p className="text-white text-[8px] font-bold truncate">{gift.name}</p>
                            <p className="text-yellow-400 text-[8px] font-bold">{gift.price >= 1000 ? `${(gift.price / 1000).toFixed(1)}k` : gift.price}🪙</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
              }
            </div>
            <div className="px-4 py-3 border-t border-white/5 flex-shrink-0">
              <button onClick={handleSendGift} disabled={!selectedGift || sendingGift}
                className="w-full py-3 rounded-2xl font-black text-black text-sm disabled:opacity-40 active:scale-95 transition-all"
                style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}>
                {sendingGift ? "جارٍ الإرسال..." : selectedGift ? `إرسال ${selectedGift.name} (${formatNumber(selectedGift.price)}🪙)` : "اختر هدية"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-52 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)" }} />

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-10 px-6">
        {/* Secondary controls row */}
        <div className="flex items-center justify-center gap-4 mb-5">
          {/* Camera toggle */}
          <button onClick={toggleCamera}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: isCameraOff ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.15)", border: `2px solid ${isCameraOff ? "#ef4444" : "rgba(255,255,255,0.3)"}` }}>
            {isCameraOff
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M16 16v1a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h2m5.66 0H14a2 2 0 012 2v3.34l4-4v14l-4-4"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            }
          </button>

          {/* Switch camera */}
          <button onClick={switchCamera}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
              <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
            </svg>
          </button>

          {/* Gifts */}
          <button onClick={() => setShowGifts(true)}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: "rgba(251,191,36,0.2)", border: "2px solid rgba(251,191,36,0.5)" }}>
            <span className="text-xl">🎁</span>
          </button>
        </div>

        {/* Main controls row */}
        <div className="flex items-center justify-center gap-6">
          {/* Mute */}
          <button onClick={toggleMute}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: isMuted ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.15)", border: `2px solid ${isMuted ? "#ef4444" : "rgba(255,255,255,0.3)"}` }}>
            {isMuted
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6"/><path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            }
          </button>

          {/* End Call */}
          <button onClick={handleEnd}
            className="rounded-full flex items-center justify-center active:scale-90 transition-all"
            style={{ width: 72, height: 72, background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: "0 0 30px rgba(239,68,68,0.6)" }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7 2 2 0 011.72 2v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.42 19.42 0 013.43 9.65 19.79 19.79 0 01.36 1a2 2 0 012-2.18h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.34 6.68" />
              <line x1="23" y1="1" x2="1" y2="23" />
            </svg>
          </button>

          {/* Speaker placeholder */}
          <div className="w-14 h-14" />
        </div>
      </div>
    </div>
  );
}
