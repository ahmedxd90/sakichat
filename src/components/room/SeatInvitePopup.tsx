import React, { memo, useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "../../lib/toast";

interface SeatInvitePopupProps {
  roomId: string;
}

export default memo(function SeatInvitePopup({ roomId }: SeatInvitePopupProps) {
  const [invite, setInvite] = useState<any>(null);

  useEffect(() => {
    const fetchInvite = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('seat_invites').select('*').eq('room_id', roomId).eq('target_user_id', user.id).eq('status', 'pending').single();
      setInvite(data);
    };
    fetchInvite();
    const sub = supabase.channel(`seat_invites_${roomId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'seat_invites' }, fetchInvite).subscribe();
    return () => { sub.unsubscribe(); };
  }, [roomId]);

  const respond = async (args: any) => {};

  if (!invite) return null;

  const handleRespond = async (accept: boolean) => {
    try {
      await respond({ inviteId: invite.id, accept });
      if (accept) {
        toast.success(`🎉 صعدت إلى المقعد رقم ${invite.seat_index + 1}!`);
      }
    } catch (e: any) {
      toast.error(e?.message || "حدث خطأ");
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative w-full max-w-xs rounded-3xl p-6 text-center shadow-2xl animate-scale-up"
        style={{
          background: "linear-gradient(135deg, #1e1b4b, #311042)",
          border: "1.5px solid rgba(168,85,247,0.4)",
        }}
      >
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl overflow-hidden shadow-lg border-2 border-purple-400/50">
          <img
            src={invite.sender_avatar || "https://j.top4top.io/p_37559m1p51.jpg"}
            alt={invite.sender_name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="inline-block px-3 py-1 rounded-full text-xs font-black text-purple-200 mb-2"
          style={{ background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)" }}>
          دعوة صعود مقعد 🎙️
        </div>

        <h3 className="text-white font-black text-base mb-1">
          {invite.sender_name}
        </h3>
        <p className="text-gray-300 text-xs mb-5">
          دعاك للصعود إلى المقعد رقم <span className="text-yellow-400 font-bold">{invite.seat_index + 1}</span>
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => handleRespond(false)}
            className="flex-1 py-3 rounded-2xl font-bold text-sm text-gray-300 active:scale-95 transition-transform"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            رفض
          </button>
          <button
            onClick={() => handleRespond(true)}
            className="flex-1 py-3 rounded-2xl font-black text-sm text-white active:scale-95 transition-transform shadow-lg shadow-purple-500/30"
            style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)" }}
          >
            موافقة وصعود
          </button>
        </div>
      </div>
    </div>
  );
});
