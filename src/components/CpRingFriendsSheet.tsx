// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "../lib/toast";

interface Props {
  onClose: () => void;
  onSent: () => void;
}

export default function CpRingFriendsSheet({ onClose, onSent }: Props) {
  const [selectedFriendId, setSelectedFriendId] = useState<Id<"users"> | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const friends = useQuery(api.friends.getMyFriends) ?? [];
  const sendMarriageRequest = useMutation(api.cpHome.sendMarriageRequest);
  const selectedFriend = friends.find((friend: any) => friend?.userId === selectedFriendId);

  const submit = async () => {
    if (!selectedFriendId) return;
    setSending(true);
    try {
      await sendMarriageRequest({ targetUserId: selectedFriendId });
      toast.success("تم إرسال طلب الزواج. انتظر موافقة صديقك 💍");
      onSent();
    } catch (error: any) {
      toast.error(error?.message ?? "تعذر إرسال طلب الزواج");
    } finally {
      setSending(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[400] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <section className="fixed bottom-0 left-0 right-0 z-[401] max-h-[85vh] overflow-hidden rounded-t-[30px] bg-white shadow-2xl" dir="rtl">
        <div className="flex justify-center pt-3"><div className="h-1 w-11 rounded-full bg-slate-200" /></div>
        <header className="flex items-center justify-between border-b border-pink-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <img src="/assets/cp-love-ring.svg" alt="خاتم الحب" className="h-12 w-12 rounded-2xl bg-pink-50 object-contain p-1" />
            <div><h2 className="font-black text-pink-700">إضافة شريك CP 💍</h2><p className="text-xs font-bold text-pink-400">اختر مستخدمًا واحدًا فقط</p></div>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-full bg-slate-100 text-slate-500">×</button>
        </header>
        <div className="px-5 py-3 text-xs font-bold leading-6 text-pink-700">سيصل إلى المستخدم طلب: «هل توافق على الزواج؟». عند الموافقة يُخصم 300,000 عملة ذهبية من المرسل ويُفتح بيت الحب لكما.</div>
        <div className="max-h-[50vh] overflow-y-auto space-y-2 px-4 pb-4">
          {!friends.length ? <div className="py-14 text-center"><div className="text-5xl">👥</div><p className="mt-3 font-black text-slate-500">لا يوجد أصدقاء بعد</p><p className="mt-1 text-xs text-slate-400">أضف أصدقاء أولًا لاختيار شريك CP</p></div> : friends.map((friend: any) => {
            const selected = selectedFriendId === friend.userId;
            return <button key={friend._id} onClick={() => setSelectedFriendId(selected ? null : friend.userId)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-right ${selected ? "border-pink-400 bg-pink-50" : "border-slate-100 bg-slate-50"}`}>
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-pink-200 bg-gradient-to-br from-pink-400 to-purple-500">{friend.avatarUrl ? <img src={friend.avatarUrl} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center font-black text-white">{friend.name?.[0] ?? "؟"}</span>}</div>
              <span className="min-w-0 flex-1"><b className="block truncate text-sm text-slate-800">{friend.name}</b><small className="text-slate-400">#{friend.sakiId}</small></span>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full ${selected ? "bg-pink-500 text-white" : "border border-slate-300 bg-white"}`}>{selected ? "✓" : ""}</span>
            </button>;
          })}
        </div>
        <div className="border-t border-slate-100 p-4">
          <button disabled={!selectedFriendId} onClick={() => setShowConfirm(true)} className="w-full rounded-full py-4 font-black text-white disabled:opacity-40" style={{ background: "linear-gradient(135deg,#ff4d8d,#a855f7)" }}>💍 {selectedFriend ? `طلب الزواج من ${selectedFriend.name}` : "اختر مستخدمًا أولًا"}</button>
        </div>
      </section>
      {showConfirm && selectedFriend && <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 px-6" dir="rtl">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
          <img src="/assets/cp-love-ring.svg" alt="خاتم الحب" className="mx-auto h-24 w-24 object-contain" />
          <h3 className="mt-2 text-lg font-black text-pink-700">هل أنت متأكد من الزواج؟</h3>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-500">سيكلفك هذا الارتباط <b className="text-amber-600">300,000 عملة ذهبية</b> عند موافقة الطرف الآخر.</p>
          <div className="mt-5 flex gap-3"><button onClick={() => setShowConfirm(false)} className="flex-1 rounded-full bg-slate-100 py-3 font-bold text-slate-500">إلغاء</button><button onClick={submit} disabled={sending} className="flex-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 py-3 font-black text-white disabled:opacity-60">{sending ? "جارٍ الإرسال..." : "موافق 💍"}</button></div>
        </div>
      </div>}
    </>
  );
}
