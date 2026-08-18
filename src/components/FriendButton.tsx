// @ts-nocheck
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "../lib/toast";

interface FriendButtonProps {
  targetUserId: Id<"users">;
  compact?: boolean;
  compactGrid?: boolean;
}

export default function FriendButton({ targetUserId, compact, compactGrid }: FriendButtonProps) {
  const status = useQuery(api.friends.getFriendshipStatus, { targetUserId });
  const sendRequest = useMutation(api.friends.sendFriendRequest);
  const cancelRequest = useMutation(api.friends.cancelFriendRequest);
  const acceptRequest = useMutation(api.friends.acceptFriendRequest);
  const rejectRequest = useMutation(api.friends.rejectFriendRequest);
  const removeFriend = useMutation(api.friends.removeFriend);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!status) return null;

  const handleAction = async () => {
    if (loading) return;
    if (status.status === "friends") { setShowConfirm(true); return; }
    setLoading(true);
    try {
      if (status.status === "none") {
        const res = await sendRequest({ targetUserId });
        toast.success(res.status === "accepted" ? "🎉 أصبحتما أصدقاء!" : "✅ تم إرسال طلب الصداقة");
      } else if (status.status === "sent") {
        await cancelRequest({ targetUserId });
        toast.success("تم إلغاء الطلب");
      } else if (status.status === "received") {
        await acceptRequest({ requestId: status.requestId });
        toast.success("🎉 تمت قبول طلب الصداقة!");
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleRemoveFriend = async () => {
    setLoading(true);
    try {
      await removeFriend({ friendUserId: targetUserId });
      toast.success("تم إلغاء الصداقة");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); setShowConfirm(false); }
  };

  const handleReject = async () => {
    if (!status.requestId) return;
    setLoading(true);
    try {
      await rejectRequest({ requestId: status.requestId });
      toast.success("تم رفض الطلب");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  // ── CompactGrid mode (full-width for 2x2 grid) ──
  if (compactGrid) {
    const label = loading ? "..." : status.status === "friends" ? "👥 أصدقاء" : status.status === "sent" ? "⏳ بانتظار" : status.status === "received" ? "✅ قبول" : "🤝 طلب صداقة";
    const bg = status.status === "friends" ? "#4caf50" : status.status === "sent" ? "#9ca3af" : status.status === "received" ? "#10b981" : "#2196f3";
    return (
      <button onClick={handleAction} disabled={loading}
        className="w-full h-full py-3 flex items-center justify-center gap-2 font-bold text-sm text-white active:scale-95 transition-transform disabled:opacity-60"
        style={{ background: bg, borderRadius: "1rem" }}>
        {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
        {label}
      </button>
    );
  }

  // ── Compact icon-only mode ──
  if (compact) {
    const bg =
      status.status === "friends" ? "linear-gradient(135deg,#4ade80,#22c55e)"
      : status.status === "sent" ? "linear-gradient(135deg,#9ca3af,#6b7280)"
      : status.status === "received" ? "linear-gradient(135deg,#10b981,#059669)"
      : "linear-gradient(135deg,#a855f7,#7c3aed)";
    return (
      <button
        onClick={handleAction}
        disabled={loading}
        className="rounded-2xl flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
        style={{ width: 52, height: 52, background: bg }}
      >
        {loading
          ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : status.status === "friends" ? <span className="text-xl">👥</span>
          : status.status === "sent" ? <span className="text-xl">⏳</span>
          : status.status === "received" ? <span className="text-xl">✅</span>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
        }
      </button>
    );
  }

  // ── Full mode ──
  const getButtonStyle = () => {
    switch (status.status) {
      case "friends": return { background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.4)", color: "#4ade80" };
      case "sent": return { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#9ca3af" };
      case "received": return { background: "linear-gradient(135deg, #10b981, #059669)", color: "white", boxShadow: "0 4px 15px rgba(16,185,129,0.3)" };
      default: return { background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.4)", color: "#a855f7" };
    }
  };

  const getLabel = () => {
    if (loading) return "...";
    switch (status.status) {
      case "friends": return "👥 أصدقاء";
      case "sent": return "⏳ بانتظار القبول";
      case "received": return "✅ قبول الطلب";
      default: return "👤+ إضافة صديق";
    }
  };

  return (
    <>
      <div className="flex-1 flex gap-1.5">
        <button
          onClick={handleAction}
          disabled={loading}
          className="flex-1 py-3 rounded-2xl text-sm font-black transition-all active:scale-[0.98] disabled:opacity-50"
          style={getButtonStyle()}
        >
          {getLabel()}
        </button>
        {status.status === "received" && (
          <button
            onClick={handleReject}
            disabled={loading}
            className="px-3 py-3 rounded-2xl text-sm font-black active:scale-[0.98]"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
          >
            ✕
          </button>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center px-6" onClick={() => setShowConfirm(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-sm rounded-3xl p-6"
            style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-white font-black text-lg">إلغاء الصداقة</h3>
              <p className="text-gray-400 text-sm mt-1">هل تريد إلغاء الصداقة؟ لن تتمكن من مراسلته بعد ذلك.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-gray-400"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                إلغاء
              </button>
              <button
                onClick={handleRemoveFriend}
                disabled={loading}
                className="flex-1 py-3 rounded-2xl text-sm font-black text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
              >
                {loading ? "..." : "إلغاء الصداقة"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
