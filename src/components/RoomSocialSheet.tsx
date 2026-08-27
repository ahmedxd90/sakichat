// @ts-nocheck
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "../lib/toast";

interface RoomSocialSheetProps {
  roomId: string;
  isOwner: boolean;
  isAdmin: boolean;
  myProfile: any;
  onClose: () => void;
}

type Tab = "likes" | "announcements" | "poll" | "game";

export default function RoomSocialSheet({
  roomId,
  isOwner,
  isAdmin,
  myProfile,
  onClose,
}: RoomSocialSheetProps) {
  const [tab, setTab] = useState<Tab>("likes");

  return (
    <div className="fixed inset-0 z-[65] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#12121f] rounded-t-3xl border-t border-white/10 animate-slide-up-sheet flex flex-col"
        style={{ height: "88%" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <span className="text-white font-bold text-base">فعاليات القاعة</span>
          <div className="w-8" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-3 py-2 border-b border-white/10 flex-shrink-0 overflow-x-auto scrollbar-hide">
          {([
            { id: "likes", label: "الإعجابات", emoji: "❤️" },
            { id: "announcements", label: "الإعلانات", emoji: "📢" },
            { id: "poll", label: "التصويت", emoji: "📊" },
            { id: "game", label: "الألعاب", emoji: "🎮" },
          ] as { id: Tab; label: string; emoji: string }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all ${
                tab === t.id
                  ? "bg-purple-600 text-white"
                  : "bg-white/5 text-gray-400"
              }`}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {tab === "likes" && (
            <LikesTab roomId={roomId} myProfile={myProfile} />
          )}
          {tab === "announcements" && (
            <AnnouncementsTab
              roomId={roomId}
              isOwner={isOwner}
              isAdmin={isAdmin}
            />
          )}
          {tab === "poll" && (
            <PollTab
              roomId={roomId}
              isOwner={isOwner}
              isAdmin={isAdmin}
            />
          )}
          {tab === "game" && (
            <GameTab
              roomId={roomId}
              isOwner={isOwner}
              isAdmin={isAdmin}
              myProfile={myProfile}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Likes Tab ─────────────────────────────────────────────────────────────────
function LikesTab({ roomId, myProfile }: { roomId: string; myProfile: any }) {
  const [likesData, setLikesData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLikes = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: likers } = await supabase.from('room_likes').select('*, profiles(*)').eq('room_id', roomId);
      const isLiked = user ? likers?.some(l => l.user_id === user.id) : false;
      setLikesData({
        count: likers?.length || 0,
        isLiked,
        likers: likers?.map(l => l.profiles) || []
      });
    };
    fetchLikes();
  }, [roomId]);

  const toggleLike = async (args: any) => {};

  const handleToggle = async () => {
    if (!myProfile) { toast.error("يجب تسجيل الدخول"); return; }
    setLoading(true);
    try {
      const result = await toggleLike({ roomId });
      toast.success(result ? "❤️ أعجبك هذه القاعة!" : "تم إلغاء الإعجاب");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Like button */}
      <div className="flex flex-col items-center gap-3 py-4">
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-90 ${
            likesData?.isLiked
              ? "bg-red-500/30 border-2 border-red-500"
              : "bg-white/5 border-2 border-white/20"
          }`}
        >
          <span className="text-4xl">{likesData?.isLiked ? "❤️" : "🤍"}</span>
        </button>
        <div className="text-center">
          <p className="text-white font-black text-3xl">{likesData?.count ?? 0}</p>
          <p className="text-gray-400 text-sm">إعجاب</p>
        </div>
      </div>

      {/* Likers list */}
      {likesData && likesData.likers.length > 0 && (
        <div>
          <p className="text-gray-400 text-xs font-bold mb-3 px-1">من أعجبهم القاعة</p>
          <div className="grid grid-cols-4 gap-3">
            {likesData.likers.map((liker) => (
              <div key={liker.userId} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10">
                  {liker.avatarUrl ? (
                    <img src={liker.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{liker.name[0]}</span>
                    </div>
                  )}
                </div>
                <span className="text-gray-300 text-[10px] truncate max-w-[52px] text-center">{liker.name}</span>
                {liker.isVip && <span className="text-[8px] text-amber-500">PRO</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Announcements Tab ─────────────────────────────────────────────────────────
function AnnouncementsTab({
  roomId,
  isOwner,
  isAdmin,
}: {
  roomId: string;
  isOwner: boolean;
  isAdmin: boolean;
}) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  useEffect(() => {
    const fetchAnn = async () => {
      const { data } = await supabase.from('room_announcements').select('*').eq('room_id', roomId).order('created_at', { ascending: false });
      setAnnouncements(data || []);
    };
    fetchAnn();
  }, [roomId]);

  const createAnn = async (args: any) => {};
  const deleteAnn = async (args: any) => {};
  const pinAnn = async (args: any) => {};

  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);

  const canManage = isOwner || isAdmin;

  const handleCreate = async () => {
    if (!content.trim()) { toast.error("اكتب محتوى الإعلان"); return; }
    setLoading(true);
    try {
      await createAnn({ roomId, content, isPinned });
      toast.success("✅ تم نشر الإعلان");
      setContent("");
      setIsPinned(false);
      setShowForm(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const pinned = announcements?.filter((a) => a.isPinned) ?? [];
  const regular = announcements?.filter((a) => !a.isPinned) ?? [];

  return (
    <div className="p-4 space-y-3">
      {canManage && (
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full py-3 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-300 font-bold text-sm flex items-center justify-center gap-2"
        >
          <span>📢</span>
          <span>نشر إعلان جديد</span>
        </button>
      )}

      {showForm && canManage && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="اكتب الإعلان هنا..."
            maxLength={500}
            rows={3}
            className="w-full bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none resize-none"
            dir="rtl"
          />
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-xs">{content.length}/500</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-gray-400 text-xs">تثبيت</span>
              <div
                onClick={() => setIsPinned(!isPinned)}
                className={`w-10 h-5 rounded-full transition-all ${isPinned ? "bg-purple-600" : "bg-white/10"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-all ${isPinned ? "mr-0.5 ml-auto" : "ml-0.5"}`} />
              </div>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={loading || !content.trim()}
              className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-sm disabled:opacity-40"
            >
              {loading ? "جارٍ النشر..." : "نشر"}
            </button>
            <button
              onClick={() => { setShowForm(false); setContent(""); }}
              className="px-4 py-2.5 rounded-xl bg-white/5 text-gray-400 text-sm"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {pinned.length > 0 && (
        <div className="space-y-2">
          <p className="text-yellow-500 text-xs font-bold flex items-center gap-1">
            <span>📌</span> مثبت
          </p>
          {pinned.map((a) => (
            <AnnouncementCard
              key={a.id}
              ann={a}
              canManage={canManage}
              isOwner={isOwner}
              onDelete={() => deleteAnn({ announcementId: a.id }).catch((e) => toast.error(e.message))}
              onPin={() => pinAnn({ announcementId: a.id, isPinned: !a.isPinned }).catch((e) => toast.error(e.message))}
            />
          ))}
        </div>
      )}

      {regular.length > 0 && (
        <div className="space-y-2">
          {pinned.length > 0 && <p className="text-gray-500 text-xs font-bold">الإعلانات</p>}
          {regular.map((a) => (
            <AnnouncementCard
              key={a.id}
              ann={a}
              canManage={canManage}
              isOwner={isOwner}
              onDelete={() => deleteAnn({ announcementId: a.id }).catch((e) => toast.error(e.message))}
              onPin={() => pinAnn({ announcementId: a.id, isPinned: !a.isPinned }).catch((e) => toast.error(e.message))}
            />
          ))}
        </div>
      )}

      {(!announcements || announcements.length === 0) && !showForm && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <span className="text-5xl">📢</span>
          <p className="text-gray-400 text-sm">لا توجد إعلانات بعد</p>
          {canManage && <p className="text-gray-600 text-xs">انشر أول إعلان للقاعة</p>}
        </div>
      )}
    </div>
  );
}

function AnnouncementCard({
  ann,
  canManage,
  isOwner,
  onDelete,
  onPin,
}: {
  ann: any;
  canManage: boolean;
  isOwner: boolean;
  onDelete: () => void;
  onPin: () => void;
}) {
  return (
    <div
      className="rounded-2xl p-3 space-y-2"
      style={{
        background: ann.is_pinned ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.04)",
        border: ann.is_pinned ? "1px solid rgba(251,191,36,0.25)" : "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
          {ann.creator_avatar ? (
            <img src={ann.creator_avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">{ann.creator_name[0]}</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-purple-300 text-xs font-bold">{ann.creator_name}</span>
            {ann.is_pinned && <span className="text-[9px] text-yellow-500">📌</span>}
          </div>
          <p className="text-white text-sm leading-relaxed">{ann.content}</p>
          <p className="text-gray-600 text-[10px] mt-1">
            {new Date(ann.created_at).toLocaleString("ar-SA", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
          </p>
        </div>
        {canManage && (
          <div className="flex flex-col gap-1 flex-shrink-0">
            {isOwner && (
              <button
                onClick={onPin}
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: ann.is_pinned ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.05)" }}
              >
                <span className="text-[10px]">📌</span>
              </button>
            )}
            <button
              onClick={onDelete}
              className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Poll Tab ──────────────────────────────────────────────────────────────────
function PollTab({
  roomId,
  isOwner,
  isAdmin,
}: {
  roomId: string;
  isOwner: boolean;
  isAdmin: boolean;
}) {
  const [activePoll, setActivePoll] = useState<any>(null);
  const [recentPolls, setRecentPolls] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('room_polls').select('*').eq('room_id', roomId).eq('status', 'active').maybeSingle().then(({ data }) => setActivePoll(data));
    supabase.from('room_polls').select('*').eq('room_id', roomId).eq('status', 'closed').order('created_at', { ascending: false }).limit(5).then(({ data }) => setRecentPolls(data || []));
  }, [roomId]);

  const createPoll = async (args: any) => {
    await supabase.from('room_polls').insert({ room_id: args.roomId, question: args.question, options: args.options, status: 'active' });
  };
  const closePoll = async (args: any) => {
    await supabase.from('room_polls').update({ status: 'closed' }).eq('id', args.pollId);
  };
  const votePoll = async (args: any) => {
    await supabase.from('room_poll_votes').insert({ poll_id: args.pollId, option_index: args.optionIndex });
  };

  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [duration, setDuration] = useState(5);
  const [loading, setLoading] = useState(false);
  const [voting, setVoting] = useState(false);

  const canManage = isOwner || isAdmin;

  const handleCreate = async () => {
    const validOptions = options.filter((o) => o.trim());
    if (!question.trim()) { toast.error("اكتب السؤال"); return; }
    if (validOptions.length < 2) { toast.error("أضف خيارين على الأقل"); return; }
    setLoading(true);
    try {
      await createPoll({ roomId, question, options: validOptions, durationMinutes: duration });
      toast.success("✅ تم إنشاء التصويت");
      setShowForm(false);
      setQuestion("");
      setOptions(["", ""]);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId: string, optionIndex: number) => {
    setVoting(true);
    try {
      await votePoll({ pollId, optionIndex });
      toast.success("✅ تم تسجيل صوتك");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {canManage && !activePoll && (
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full py-3 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-300 font-bold text-sm flex items-center justify-center gap-2"
        >
          <span>📊</span>
          <span>إنشاء تصويت جديد</span>
        </button>
      )}

      {showForm && canManage && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="اكتب السؤال..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none"
            dir="rtl"
          />
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={opt}
                  onChange={(e) => {
                    const n = [...options];
                    n[i] = e.target.value;
                    setOptions(n);
                  }}
                  placeholder={`الخيار ${i + 1}`}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none"
                  dir="rtl"
                />
                {options.length > 2 && (
                  <button
                    onClick={() => setOptions(options.filter((_, j) => j !== i))}
                    className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <button
                onClick={() => setOptions([...options, ""])}
                className="w-full py-2 rounded-xl bg-white/5 border border-dashed border-white/20 text-gray-400 text-xs"
              >
                + إضافة خيار
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs">المدة:</span>
            {[2, 5, 10, 15, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${duration === d ? "bg-blue-600 text-white" : "bg-white/5 text-gray-400"}`}
              >
                {d}د
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm disabled:opacity-40"
            >
              {loading ? "جارٍ الإنشاء..." : "إنشاء"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl bg-white/5 text-gray-400 text-sm"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {activePoll && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5 font-bold">● مباشر</span>
                <span className="text-gray-500 text-[10px]">{activePoll.totalVotes} صوت</span>
              </div>
              <p className="text-white font-bold text-sm">{activePoll.question}</p>
            </div>
            {canManage && (
              <button
                onClick={() => closePoll({ pollId: activePoll._id }).then(() => toast.success("تم إغلاق التصويت")).catch((e) => toast.error(e.message))}
                className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold flex-shrink-0"
              >
                إغلاق
              </button>
            )}
          </div>
          <div className="space-y-2">
            {activePoll.options.map((opt: string, i: number) => {
              const count = activePoll.voteCounts[i] ?? 0;
              const pct = activePoll.totalVotes > 0 ? Math.round((count / activePoll.totalVotes) * 100) : 0;
              const isMyVote = activePoll.myVote === i;
              return (
                <button
                  key={i}
                  onClick={() => !voting && handleVote(activePoll._id, i)}
                  disabled={voting}
                  className="w-full relative overflow-hidden rounded-xl text-right transition-all active:scale-98"
                  style={{
                    background: isMyVote ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)",
                    border: isMyVote ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    className="absolute inset-y-0 right-0 transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: isMyVote ? "rgba(59,130,246,0.25)" : "rgba(255,255,255,0.05)",
                    }}
                  />
                  <div className="relative flex items-center justify-between px-3 py-2.5">
                    <span className="text-blue-300 text-xs font-bold">{pct}% ({count})</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm">{opt}</span>
                      {isMyVote && <span className="text-blue-400 text-xs">✓</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent closed polls */}
      {recentPolls && recentPolls.filter((p) => !p.isActive).length > 0 && (
        <div className="space-y-2">
          <p className="text-gray-500 text-xs font-bold">تصويتات سابقة</p>
          {recentPolls.filter((p) => !p.isActive).map((poll) => (
            <div key={poll._id} className="bg-white/3 border border-white/8 rounded-2xl p-3 space-y-2 opacity-70">
              <p className="text-gray-300 text-sm font-bold">{poll.question}</p>
              <div className="space-y-1">
                {poll.options.map((opt: string, i: number) => {
                  const count = poll.voteCounts[i] ?? 0;
                  const pct = poll.totalVotes > 0 ? Math.round((count / poll.totalVotes) * 100) : 0;
                  const isWinner = count === Math.max(...poll.voteCounts);
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-purple-500/60" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-gray-400 text-[10px] w-8 text-left">{pct}%</span>
                      <span className={`text-[11px] flex-1 text-right ${isWinner ? "text-white font-bold" : "text-gray-500"}`}>{opt}</span>
                      {isWinner && <span className="text-[10px]">🏆</span>}
                    </div>
                  );
                })}
              </div>
              <p className="text-gray-600 text-[10px]">{poll.totalVotes} صوت</p>
            </div>
          ))}
        </div>
      )}

      {!activePoll && (!recentPolls || recentPolls.length === 0) && !showForm && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <span className="text-5xl">📊</span>
          <p className="text-gray-400 text-sm">لا يوجد تصويت نشط</p>
          {canManage && <p className="text-gray-600 text-xs">أنشئ تصويتاً لإشراك الجمهور</p>}
        </div>
      )}
    </div>
  );
}

// ── Game Tab ──────────────────────────────────────────────────────────────────
function GameTab({
  roomId,
  isOwner,
  isAdmin,
  myProfile,
}: {
  roomId: string;
  isOwner: boolean;
  isAdmin: boolean;
  myProfile: any;
}) {
  const [activeGame, setActiveGame] = useState<any>(null);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('room_games').select('*').eq('room_id', roomId).eq('status', 'active').maybeSingle().then(({ data }) => setActiveGame(data));
    supabase.from('room_games').select('*').eq('room_id', roomId).eq('status', 'closed').order('created_at', { ascending: false }).limit(5).then(({ data }) => setRecentGames(data || []));
  }, [roomId]);

  const createGame = async (args: any) => {
    await supabase.from('room_games').insert({ room_id: args.roomId, type: args.type, status: 'active' });
  };
  const submitAnswer = async (args: any) => {
    await supabase.from('room_game_answers').insert({ game_id: args.gameId, answer: args.answer });
  };
  const closeGame = async (args: any) => {
    await supabase.from('room_games').update({ status: 'closed' }).eq('id', args.gameId);
  };

  const [showForm, setShowForm] = useState(false);
  const [gameType, setGameType] = useState<"quiz" | "guess" | "trivia">("quiz");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState("");
  const [prize, setPrize] = useState(0);
  const [loading, setLoading] = useState(false);
  const [myAnswer, setMyAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const canManage = isOwner || isAdmin;

  const GAME_TYPES = [
    { id: "quiz" as const, label: "اختبار", emoji: "🧠" },
    { id: "guess" as const, label: "تخمين", emoji: "🔮" },
    { id: "trivia" as const, label: "معلومات", emoji: "📚" },
  ];

  const handleCreate = async () => {
    if (!question.trim()) { toast.error("اكتب السؤال"); return; }
    if (!answer.trim()) { toast.error("اكتب الإجابة"); return; }
    setLoading(true);
    try {
      await createGame({
        roomId,
        type: gameType,
        question,
        answer,
        hint: hint || undefined,
        prize: prize > 0 ? prize : undefined,
      });
      toast.success("✅ تم إنشاء اللعبة");
      setShowForm(false);
      setQuestion("");
      setAnswer("");
      setHint("");
      setPrize(0);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!myAnswer.trim() || !activeGame) return;
    setSubmitting(true);
    try {
      const result = await submitAnswer({ gameId: activeGame._id, answer: myAnswer });
      if (result.isCorrect) {
        toast.success(`🎉 إجابة صحيحة! ${activeGame.prize ? `ربحت ${activeGame.prize} عملة 🪙` : ""}`);
      } else {
        toast.error("❌ إجابة خاطئة، حاول مرة أخرى");
      }
      setMyAnswer("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {canManage && !activeGame && (
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full py-3 rounded-2xl bg-green-600/20 border border-green-500/40 text-green-300 font-bold text-sm flex items-center justify-center gap-2"
        >
          <span>🎮</span>
          <span>إنشاء لعبة جديدة</span>
        </button>
      )}

      {showForm && canManage && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
          {/* Game type */}
          <div className="flex gap-2">
            {GAME_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setGameType(t.id)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 ${
                  gameType === t.id ? "bg-green-600 text-white" : "bg-white/5 text-gray-400"
                }`}
              >
                <span>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="السؤال..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none"
            dir="rtl"
          />
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="الإجابة الصحيحة..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none"
            dir="rtl"
          />
          <input
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="تلميح (اختياري)..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none"
            dir="rtl"
          />
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs">جائزة:</span>
            {[0, 100, 500, 1000, 5000].map((p) => (
              <button
                key={p}
                onClick={() => setPrize(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${prize === p ? "bg-yellow-500 text-black" : "bg-white/5 text-gray-400"}`}
              >
                {p === 0 ? "بدون" : `${p}🪙`}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-green-600 text-white font-bold text-sm disabled:opacity-40"
            >
              {loading ? "جارٍ الإنشاء..." : "إنشاء"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl bg-white/5 text-gray-400 text-sm"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {activeGame && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5 font-bold">
                  {GAME_TYPES.find((t) => t.id === activeGame.type)?.emoji} {GAME_TYPES.find((t) => t.id === activeGame.type)?.label}
                </span>
                {activeGame.prize && (
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full px-2 py-0.5 font-bold">
                    🪙 {activeGame.prize}
                  </span>
                )}
              </div>
              <p className="text-white font-bold text-base">{activeGame.question}</p>
            </div>
            {canManage && (
              <button
                onClick={() => closeGame({ gameId: activeGame._id }).then(() => toast.success("تم إغلاق اللعبة")).catch((e) => toast.error(e.message))}
                className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold flex-shrink-0"
              >
                إغلاق
              </button>
            )}
          </div>

          {activeGame.hint && (
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2">
              <span className="text-sm">💡</span>
              <span className="text-yellow-300 text-xs">{activeGame.hint}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <span>📝 {activeGame.totalAnswers} محاولة</span>
            <span>•</span>
            <span>✅ {activeGame.correctAnswers} صحيحة</span>
          </div>

          {activeGame.myAnswer?.isCorrect ? (
            <div className="bg-green-500/20 border border-green-500/40 rounded-xl px-4 py-3 text-center">
              <p className="text-green-400 font-bold">🎉 أجبت بشكل صحيح!</p>
              {activeGame.prize && <p className="text-yellow-400 text-sm mt-1">ربحت {activeGame.prize} عملة 🪙</p>}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={myAnswer}
                onChange={(e) => setMyAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="اكتب إجابتك..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none"
                dir="rtl"
              />
              <button
                onClick={handleSubmit}
                disabled={submitting || !myAnswer.trim()}
                className="px-4 py-2.5 rounded-xl bg-green-600 text-white font-bold text-sm disabled:opacity-40"
              >
                {submitting ? "..." : "إرسال"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recent games */}
      {recentGames && recentGames.filter((g) => !g.isActive).length > 0 && (
        <div className="space-y-2">
          <p className="text-gray-500 text-xs font-bold">ألعاب سابقة</p>
          {recentGames.filter((g) => !g.isActive).map((game) => (
            <div key={game._id} className="bg-white/3 border border-white/8 rounded-2xl p-3 opacity-70">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-gray-300 text-sm font-bold">{game.question}</p>
                  {game.answer && (
                    <p className="text-green-400 text-xs mt-1">✅ الإجابة: {game.answer}</p>
                  )}
                  {game.winnerName && (
                    <p className="text-yellow-400 text-xs mt-0.5">🏆 الفائز: {game.winnerName}</p>
                  )}
                </div>
                <span className="text-lg flex-shrink-0">
                  {GAME_TYPES.find((t) => t.id === game.type)?.emoji}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!activeGame && (!recentGames || recentGames.filter((g) => !g.isActive).length === 0) && !showForm && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <span className="text-5xl">🎮</span>
          <p className="text-gray-400 text-sm">لا توجد ألعاب نشطة</p>
          {canManage && <p className="text-gray-600 text-xs">أنشئ لعبة لإشراك الجمهور</p>}
        </div>
      )}
    </div>
  );
}
