// @ts-nocheck
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface MessageButtonProps {
  userId: Id<"users">;
  onMessage: (userId: Id<"users">) => void;
}

export default function MessageButton({ userId, onMessage }: MessageButtonProps) {
  const areFriends = useQuery(api.friends.areFriends, { otherUserId: userId });

  const handleClick = () => {
    if (areFriends === false) {
      toast.error("يجب أن تكونا أصدقاء لإرسال رسالة خاصة 👥");
      return;
    }
    onMessage(userId);
  };

  const isFriend = areFriends === true;

  return (
    <button
      onClick={handleClick}
      className="flex-1 py-3 rounded-2xl text-sm font-black active:scale-[0.98] transition-all"
      style={
        isFriend
          ? { background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.4)", color: "#a855f7" }
          : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#6b7280" }
      }
    >
      {isFriend ? "💬 رسالة" : "🔒 رسالة"}
    </button>
  );
}
