// @ts-nocheck
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";

interface MessageButtonProps {
  userId: string;
  onMessage: (userId: string) => void;
}

export default function MessageButton({ userId, onMessage }: MessageButtonProps) {
  const [isFriend, setIsFriend] = useState(false);

  useEffect(() => {
    const checkFriendship = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('friends').select('*').or(`and(user1_id.eq.${user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${user.id})`).single();
      setIsFriend(!!data);
    };
    checkFriendship();
  }, [userId]);

  const handleClick = () => {
    if (!isFriend) {
      toast.error("يجب أن تكونا أصدقاء لإرسال رسالة خاصة 👥");
      return;
    }
    onMessage(userId);
  };

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
