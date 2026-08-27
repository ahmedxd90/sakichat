import { supabase } from "../../lib/supabaseClient";
import { useMemo, useState } from "react";
import { ARAB_COUNTRIES } from "../../data/countries";
import { VipFrame, VipName, VipBadge } from "../VipBadge";
import { PRIVATE_AVATAR_URL, PRIVATE_DISPLAY_NAME, isPrivateUser } from "../../lib/privateUser";
import UserAvatar from "../UserAvatar";
import { toast } from "sonner";

interface RoomInfoSheetProps {
  roomId: string;
  isCp: boolean;
  isOwner: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenLeaderboard: () => void;
}

type ActiveTab = "data" | "member";
type RoomMember = any;

const roomModeLabels: Record<string, string> = {
  cp: "ثيم CP",
  music: "موسيقى",
  astronomy: "فلك",
  desert: "صحراء",
  radio: "راديو",
  cinema: "سينما",
  millionaire: "مليونير",
};

export default function RoomInfoSheet({
  roomId,
  isOwner,
  onClose,
  onOpenSettings,
}: RoomInfoSheetProps) {
  const [room, setRoom] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [followStatus, setFollowStatus] = useState<any>(null);
  const [membershipStatus, setMembershipStatus] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>("data");
  const [followLoading, setFollowLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: roomData } = await supabase.from('rooms').select('*').eq('id', roomId).single();
      setRoom(roomData);
      
      const { data: membersData } = await supabase.from('room_members').select('*, profile:profiles(*)').eq('room_id', roomId);
      setMembers(membersData || []);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: followData } = await supabase.from('room_follows').select('*').eq('room_id', roomId).eq('user_id', user.id).maybeSingle();
        setFollowStatus({ isFollowing: !!followData });

        const { data: memberData } = await supabase.from('room_members').select('*').eq('room_id', roomId).eq('user_id', user.id).maybeSingle();
        setMembershipStatus({ isPaidMember: !!memberData });
      }
    };
    fetchData();
  }, [roomId]);

  const handleToggleFollow = async () => {
    if (isOwner || followLoading) return;
    setFollowLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("يجب تسجيل الدخول");

      if (followStatus?.isFollowing) {
        await supabase.from('room_follows').delete().eq('room_id', roomId).eq('user_id', user.id);
        setFollowStatus({ isFollowing: false });
        toast.success("تم إلغاء متابعة الغرفة");
      } else {
        await supabase.from('room_follows').insert({ room_id: roomId, user_id: user.id });
        setFollowStatus({ isFollowing: true });
        toast.success("تمت متابعة الغرفة ✅");
      }
    } catch (error: any) {
      toast.error(error?.message ?? "تعذر تحديث المتابعة");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleJoin = async () => {
    if (isOwner || joinLoading || isPaidMember) return;
    setJoinLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("يجب تسجيل الدخول");

      const { error } = await supabase.from('room_members').insert({ room_id: roomId, user_id: user.id, role: 'member' });
      if (error) throw error;

      setShowJoinModal(false);
      setMembershipStatus({ isPaidMember: true });
      toast.success("تم الانضمام كعضو مجاناً ✅");
    } catch (error: any) {
      toast.error(error?.message ?? "تعذر إتمام الانضمام");
    } finally {
      setJoinLoading(true);
    }
  };

  const country = ARAB_COUNTRIES.find((c) => c.code === room?.country);
  const membershipPrice = membershipStatus?.price ?? Math.max(0, Number((room as any)?.membershipPrice ?? 0));
  const isFollowing = !isOwner && (followStatus?.isFollowing ?? false);
  const isPaidMember = membershipStatus?.isPaidMember ?? false;
  const canShowJoin = !isOwner && !isPaidMember;

  const orderedMembers = useMemo(() => {
    const source = [...((members ?? []) as RoomMember[])];
    const roleRank = (role: string) => role === "owner" ? 0 : role === "admin" ? 1 : 2;
    return source.sort((a, b) => {
      const rankDiff = roleRank(a.role) - roleRank(b.role);
      if (rankDiff !== 0) return rankDiff;
      const aName = String(a.name ?? a.profile?.name ?? "");
      const bName = String(b.name ?? b.profile?.name ?? "");
      return aName.localeCompare(bName, "ar");
    });
  }, [members]);

  const owners = orderedMembers.filter((member) => member.role === "owner");
  const admins = orderedMembers.filter((member) => member.role === "admin");
  const regularMembers = orderedMembers.filter((member) => member.role !== "owner" && member.role !== "admin");



  const renderMemberGroup = (title: string, group: RoomMember[], tone: "owner" | "admin" | "member") => {
    if (group.length === 0) return null;
    const toneStyles = {
      owner: { dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700 border-amber-100", label: "المالك" },
      admin: { dot: "bg-teal-500", badge: "bg-teal-50 text-teal-700 border-teal-100", label: "مشرف" },
      member: { dot: "bg-slate-300", badge: "bg-slate-50 text-slate-500 border-slate-100", label: "عضو" },
    }[tone];

    return (
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${toneStyles.dot}`} />
            <h3 className="text-sm font-black text-gray-700">{title}</h3>
          </div>
          <span className="text-[11px] font-bold text-gray-400">{group.length}</span>
        </div>
        <div className="space-y-2">
          {group.map((member, index) => (
            <MemberCard key={`${member.user_id}-${member.role}-${index}`} member={member} badge={toneStyles.label} badgeClass={toneStyles.badge} />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end" onClick={onClose} dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md mx-auto h-[90vh] sm:h-[85vh] bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{ fontFamily: "Cairo, sans-serif", animation: "roomInfoSlideUp .3s cubic-bezier(.1,.9,.2,1)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <style>{`@keyframes roomInfoSlideUp{from{transform:translateY(100%);opacity:.35}to{transform:translateY(0);opacity:1}}`}</style>

        <button onClick={onClose} className="w-full pt-3 pb-1 flex justify-center" aria-label="إغلاق معلومات الغرفة">
          <span className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </button>

        <div className="sticky top-0 bg-white border-b border-gray-100 z-10 px-6 pt-2 flex justify-around items-center text-lg font-bold">
          <button onClick={() => setActiveTab("data")} className={`relative pb-3 transition-colors ${activeTab === "data" ? "text-teal-600" : "text-gray-400"}`}>
            البيانات
            {activeTab === "data" && <span className="absolute bottom-0 inset-x-0 h-1 bg-teal-500 rounded-full" />}
          </button>
          <button onClick={() => setActiveTab("member")} className={`relative pb-3 transition-colors ${activeTab === "member" ? "text-teal-600" : "text-gray-400"}`}>
            الأعضاء
            {activeTab === "member" && <span className="absolute bottom-0 inset-x-0 h-1 bg-teal-500 rounded-full" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5" style={{ scrollbarWidth: "thin" }}>
          <div className="bg-gray-50/80 rounded-2xl p-4 flex items-center justify-between border border-gray-100 shadow-sm">
            {isOwner ? (
              <button onClick={onOpenSettings} title="إعدادات الغرفة" className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-100 transition">
                <i className="fa-solid fa-gear text-lg" />
              </button>
            ) : <div className="w-9 h-9" />}

            <div className="flex items-center gap-3 min-w-0">
              <div className="text-right min-w-0">
                <h2 className="text-xl font-black text-gray-800 tracking-wide truncate max-w-[190px]">{room?.name ?? "..."}</h2>
                <div className="flex items-center justify-end gap-1 text-xs text-gray-400 mt-1 font-semibold">
                  <span>ID: {room?.roomNumericId ?? "..."}</span>
                  <button onClick={() => { navigator.clipboard?.writeText(String(room?.roomNumericId ?? "")); toast.success("تم نسخ ID الغرفة"); }} className="hover:text-gray-600" title="نسخ ID">
                    <i className="fa-regular fa-copy" />
                  </button>
                </div>
              </div>
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-md flex-shrink-0 bg-gray-100">
                {room?.coverUrl ? <img src={room.coverUrl} alt="صورة الغرفة" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-teal-100 to-cyan-50"><i className="fa-solid fa-house text-teal-600" /></div>}
              </div>
            </div>
          </div>

          {activeTab === "data" ? (
            <div className="space-y-1 pt-2 border-t border-gray-100 text-sm font-semibold">
              <DetailRow label="الأعضاء" value={String(room?.memberCount ?? orderedMembers.length)} />
              <DetailRow label="اللغة" value="العربية" />
              <DetailRow label="البلد" value={country ? `${country.name} ${country.flag}` : "—"} />
              <DetailRow label="التصنيف" value={room?.roomTheme ? (roomModeLabels[room.roomTheme] ?? "دردشة") : "دردشة"} />
            </div>
          ) : (
            <div className="space-y-5 pt-1">
              <div className="rounded-2xl p-4 bg-teal-50/70 border border-teal-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white text-teal-600 flex items-center justify-center shadow-sm"><i className="fa-solid fa-user-group text-lg" /></div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-gray-800">أعضاء الغرفة</h3>
                    <p className="text-xs text-gray-500 mt-0.5">المالك ثم المشرفون ثم الأعضاء الحقيقيون</p>
                  </div>
                </div>
              </div>
              {renderMemberGroup("مالك الغرفة", owners, "owner")}
              {renderMemberGroup("المشرفون", admins, "admin")}
              {renderMemberGroup("الأعضاء", regularMembers, "member")}
              {members && orderedMembers.length === 0 && <div className="text-center py-12 text-sm text-gray-400">لا يوجد أعضاء ظاهرون حالياً</div>}
              {!members && <div className="text-center py-12 text-sm text-gray-400">جارٍ تحميل الأعضاء...</div>}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex items-center gap-2 shadow-lg z-10">
          {isOwner ? (
            <button onClick={onOpenSettings} title="إعدادات الغرفة" className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold p-3 rounded-xl transition flex items-center justify-center gap-2">
              <i className="fa-solid fa-gear text-lg" />
              <span>إعدادات الغرفة</span>
            </button>
          ) : (
            <>
              <button onClick={handleToggleFollow} disabled={followLoading} className={`flex-1 font-bold py-3 px-3 rounded-xl transition flex items-center justify-center gap-1.5 text-sm ${isFollowing ? "bg-teal-500 text-white" : "bg-teal-50 text-teal-600 hover:bg-teal-100"}`}>
                <i className="fa-solid fa-plus text-xs" />
                <span>{isFollowing ? "متابَع" : "متابعة"}</span>
              </button>
              {canShowJoin ? (
                <button onClick={() => setShowJoinModal(true)} disabled={joinLoading} className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold py-3 px-3 rounded-xl shadow-md shadow-teal-200 transition flex items-center justify-center gap-1.5 text-sm">
                  <i className="fa-solid fa-user-plus text-xs" />
                  <span>{membershipPrice > 0 ? "انضمام عضو" : "انضمام مجاني"}</span>
                </button>
              ) : (
                <div className="flex-1 bg-emerald-50 text-emerald-600 font-bold py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 text-sm"><i className="fa-solid fa-circle-check" /> عضو بالفعل</div>
              )}
            </>
          )}
        </div>
      </div>

      {showJoinModal && !isOwner && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !joinLoading && setShowJoinModal(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl text-center" onClick={(event) => event.stopPropagation()}>
            <div className="w-16 h-16 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><i className="fa-solid fa-user-group" /></div>
            <h3 className="text-lg font-black text-gray-800 mb-2">تأكيد الانضمام</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">{membershipPrice > 0 ? <>سيتم خصم <span className="font-extrabold text-teal-600">{membershipPrice.toLocaleString()} عملة ذهبية</span> من رصيدك للانضمام كعضو.</> : "الانضمام إلى عضوية الغرفة مجاني."}</p>
            <div className="flex items-center gap-3">
              <button onClick={handleJoin} disabled={joinLoading} className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-bold py-2.5 rounded-xl transition disabled:opacity-50">{joinLoading ? "جارٍ..." : "نعم"}</button>
              <button onClick={() => setShowJoinModal(false)} disabled={joinLoading} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2.5 rounded-xl transition">لا</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between items-center py-3 border-b border-gray-50"><span className="text-gray-800 font-bold">{value}</span><span className="text-gray-400">{label}</span></div>;
}

function MemberCard({ member, badge, badgeClass }: { member: RoomMember; badge: string; badgeClass: string }) {
  const isPrivate = isPrivateUser(member);
  const name = isPrivate ? PRIVATE_DISPLAY_NAME : (member.name ?? member.profile?.name ?? "مجهول");
  const isVip = !isPrivate && Boolean(member.isVip ?? member.profile?.isVip);
  const vipLevel = member.vipLevel ?? member.profile?.vipLevel;
  const avatarUrl = isPrivate ? PRIVATE_AVATAR_URL : (member.avatarUrl ?? member.profile?.avatarUrl);

  return (
    <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5 bg-white border border-gray-100 shadow-sm">
      <VipFrame isVip={isVip} level={vipLevel}>
        <UserAvatar userId={member.user_id} avatarUrl={avatarUrl} name={name} size={42} showFrame={!isPrivate} />
      </VipFrame>
      <div className="flex-1 min-w-0 text-right">
        <div className="flex items-center gap-1 min-w-0">
          {isVip ? <VipName name={name} level={vipLevel} /> : <span className="text-gray-800 font-bold text-sm truncate">{name}</span>}
          {isVip && <VipBadge size="sm" level={vipLevel} />}
        </div>
        <div className="text-[10px] text-gray-400 mt-0.5">{isPrivate ? "حساب خاص" : (member.sakiId ? `Saki ID: ${member.sakiId}` : "عضو في الغرفة")}</div>
      </div>
      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border whitespace-nowrap ${badgeClass}`}>{badge}</span>
    </div>
  );
}
