// @ts-nocheck
import React, { useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useState, useEffect, useMemo } from "react";
import UserAvatar from "../components/UserAvatar";
import { AristocracyName, AristocracyBadge } from "../components/AristocracyBadge";
import { getVipConfig, VipBadge } from "../components/VipBadge";
import { toast } from "../lib/toast";
import { PRIVATE_AVATAR_URL, PRIVATE_DISPLAY_NAME } from "../lib/privateUser";

const BRAND = {
  cyan: "#5ce1e6",
  teal: "#3dbda7",
  background: "#f2f4f7",
};

function formatMomentTime(timestamp?: number) {
  if (!timestamp) return "الآن";
  const diff = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "الآن";
  if (minutes < 60) return `${minutes}د`;
  if (hours < 24) return `${hours}س`;
  if (days < 7) return `${days}ي`;
  return new Date(timestamp).toLocaleDateString("ar-SA");
}

function UserNameLuxury({ profile, className = "" }: { profile: any; className?: string }) {
  const isPrivate = Boolean(profile?.isPrivateProfile);
  const name = isPrivate ? PRIVATE_DISPLAY_NAME : (profile?.name || "مستخدم");
  const aristocracyLevel = isPrivate ? 0 : (profile?.aristocracyLevel ?? 0);
  const vipLevel = isPrivate ? 0 : (profile?.vipLevel ?? 0);
  const vipConfig = !isPrivate && profile?.isVip && vipLevel ? getVipConfig(vipLevel) : null;

  if (profile?.isSuperAdmin) {
    return <span className={`font-extrabold text-amber-500 ${className}`}>{name}</span>;
  }

  if (aristocracyLevel > 0) {
    return <AristocracyName level={aristocracyLevel} name={name} className={className} />;
  }

  if (vipConfig) {
    return (
      <span className={`font-extrabold ${className}`} style={{ color: vipConfig.nameColor }}>
        {name}
      </span>
    );
  }

  return <span className={`font-extrabold text-gray-900 ${className}`}>{name}</span>;
}

function PostImageGrid({ images, onImageClick }: { images: string[]; onImageClick: (index: number) => void }) {
  if (!images.length) return null;

  const gridClass = images.length === 1
    ? "grid-cols-1"
    : images.length === 2
      ? "grid-cols-2"
      : images.length === 3
        ? "grid-cols-3"
        : "grid-cols-2";

  return (
    <div className={`grid ${gridClass} gap-1.5 rounded-xl overflow-hidden mt-3`}>
      {images.map((src, index) => (
        <button
          key={`${src}-${index}`}
          type="button"
          onClick={() => onImageClick(index)}
          className={`relative overflow-hidden bg-gray-100 ${images.length === 1 ? "max-h-[420px]" : "aspect-square"} active:scale-[0.985] transition-transform`}
          aria-label={`عرض الصورة ${index + 1}`}
        >
          <img
            src={src}
            alt=""
            className={`w-full h-full ${images.length === 1 ? "object-contain" : "object-cover"} hover:scale-105 transition-transform duration-300`}
            loading="lazy"
          />
        </button>
      ))}
    </div>
  );
}

function ImageViewer({ images, initialIndex, onClose }: { images: string[]; initialIndex: number; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!images.length) return null;

  const goPrevious = () => setCurrentIndex((value) => value === 0 ? images.length - 1 : value - 1);
  const goNext = () => setCurrentIndex((value) => value === images.length - 1 ? 0 : value + 1);

  return (
    <div className="fixed inset-0 z-[1000] bg-black/95 flex flex-col animate-in fade-in duration-200" onClick={onClose}>
      <div className="flex items-center justify-between p-4 text-white" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition-transform" aria-label="إغلاق">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
        <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold">{currentIndex + 1} / {images.length}</span>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative" onClick={(event) => event.stopPropagation()}>
        <img src={images[currentIndex]} alt="" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
        {images.length > 1 && (
          <>
            <button type="button" onClick={goPrevious} className="absolute right-4 w-11 h-11 rounded-full bg-black/40 text-white flex items-center justify-center active:scale-95" aria-label="الصورة السابقة">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button type="button" onClick={goNext} className="absolute left-4 w-11 h-11 rounded-full bg-black/40 text-white flex items-center justify-center active:scale-95" aria-label="الصورة التالية">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CommentsModal({ momentId, onClose, onUserSelect }: { momentId: string; onClose: () => void; onUserSelect?: (id: string, profile?: any) => void }) {
  const [comments, setComments] = useState<any[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('moment_comments').select('*, profile:profiles(*)').eq('moment_id', momentId);
      setComments(data || []);
    };
    fetchData();
  }, [momentId]);

  const addComment = async (args: any) => {};
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    try {
      await addComment({ momentId, content: value });
      setText("");
    } catch (error: any) {
      toast.error(error?.message || "فشل إرسال التعليق");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] bg-black/50 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-t-2xl max-h-[78vh] flex flex-col animate-slide-up-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5" />
        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-gray-900">التعليقات ({comments?.length ?? 0})</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 text-sm font-bold">إغلاق</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px]">
          {comments === undefined ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xs font-bold">لا توجد تعليقات بعد. كن أول من يكتب تعليقاً!</div>
          ) : (
            comments.map((comment: any) => (
              <div key={comment.id} className="flex items-start gap-2.5">
                  <button type="button" onClick={() => onUserSelect?.(comment.userId, comment.profile)} className="flex-shrink-0 active:scale-95 transition-transform">
                  <UserAvatar userId={comment.userId} avatarUrl={comment.profile?.isPrivateProfile ? PRIVATE_AVATAR_URL : comment.profile?.avatarUrl} name={comment.profile?.isPrivateProfile ? PRIVATE_DISPLAY_NAME : comment.profile?.name} size={30} isVip={!comment.profile?.isPrivateProfile && comment.profile?.isVip} vipLevel={comment.profile?.isPrivateProfile ? 0 : comment.profile?.vipLevel} isSuperAdmin={!comment.profile?.isPrivateProfile && comment.profile?.isSuperAdmin} showFrame={!comment.profile?.isPrivateProfile} />
                </button>
                <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <UserNameLuxury profile={comment.profile} className="text-xs" />
                    <span className="text-[9px] text-gray-400">{formatMomentTime(comment.createdAt ?? comment._creationTime)}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mt-0.5">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-gray-100 bg-gray-50 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5">
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleSend()}
              placeholder="اكتب تعليقاً لطيفاً..."
              className="flex-1 bg-transparent outline-none text-xs text-gray-700 placeholder-gray-400"
              autoFocus
            />
            <button type="button" onClick={handleSend} disabled={!text.trim() || sending} className="w-8 h-8 rounded-full flex items-center justify-center text-white disabled:opacity-40 active:scale-95 transition-transform" style={{ background: `linear-gradient(135deg, ${BRAND.cyan}, ${BRAND.teal})` }} aria-label="إرسال التعليق">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MomentsPage({ setCurrentPage, onUserSelect }: { setCurrentPage: (page: any) => void; onUserSelect?: (id: string) => void }) {
  const [tab, setTab] = useState<"all" | "following">("all");
  const [activeComments, setActiveComments] = useState<string | null>(null);
  const [activeImages, setActiveImages] = useState<{ images: string[]; index: number } | null>(null);
  const [optimisticLikes, setOptimisticLikes] = useState<Record<string, boolean>>({});
  const [moments, setMoments] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('moments').select('*, profile:profiles(*)').order('created_at', { ascending: false });
      setMoments(data || []);
    };
    fetchData();
  }, [tab]);

  const likeMoment = async (args: any) => {};

  const safeMoments = useMemo(() => Array.isArray(moments) ? moments : [], [moments]);

  const toggleLike = async (moment: any) => {
    const key = String(moment.id);
    const currentlyLiked = optimisticLikes[key] ?? Boolean(moment.isLiked);
    setOptimisticLikes((current) => ({ ...current, [key]: !currentlyLiked }));
    try {
      await likeMoment({ momentId: moment.id });
    } catch (error: any) {
      setOptimisticLikes((current) => ({ ...current, [key]: currentlyLiked }));
      toast.error(error?.message || "تعذر تحديث الإعجاب");
    }
  };

  const shareMoment = async (moment: any) => {
    const shareText = moment.content?.trim() || "لحظة جميلة من ساكي";
    try {
      if (navigator.share) {
        await navigator.share({ title: "لحظة من ساكي", text: shareText });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        toast.success("تم نسخ نص المنشور");
      }
    } catch {
      // إلغاء نافذة المشاركة لا يحتاج إلى رسالة خطأ.
    }
  };

  const handleUserSelect = (userId: string, profile?: any) => {
    if (profile?.isPrivateProfile) {
      toast("هذا ملف شخصي خاص، لا يمكنك الدخول إليه", { duration: 2500 });
      return;
    }
    onUserSelect?.(userId);
  };

  const normalizeImages = (moment: any): string[] => {
    const images = Array.isArray(moment?.images) ? moment.images.filter(Boolean) : [];
    if (images.length) return images;
    return moment?.imageUrl ? [moment.imageUrl] : [];
  };

  return (
    <div className="flex-1 min-h-0 flex justify-center bg-[#f2f4f7] font-cairo" dir="rtl">
      <div className="w-full max-w-md min-h-0 bg-white flex flex-col shadow-sm relative">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-lg font-bold">
              <button type="button" onClick={() => setTab("following")} className={`transition-colors ${tab === "following" ? "text-gray-900 border-b-2 pb-0.5" : "text-gray-400"}`} style={tab === "following" ? { borderColor: BRAND.cyan } : undefined}>متابعة</button>
              <button type="button" onClick={() => setTab("all")} className={`transition-colors ${tab === "all" ? "text-gray-900 border-b-2 pb-0.5 font-extrabold text-xl" : "text-gray-400"}`} style={tab === "all" ? { borderColor: BRAND.cyan } : undefined}>الكل</button>
            </div>

            <button type="button" onClick={() => setCurrentPage("create-moment")} className="active:scale-95 transition-transform" aria-label="إنشاء منشور">
              <img src="/manus-storage/ic_dynamic_message_0fc3d5d9.webp" alt="" className="w-8 h-8 object-contain" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 space-y-4 pb-6">
          {moments === undefined ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold">جاري تحميل اللحظات...</p>
            </div>
          ) : safeMoments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
              </div>
              <p className="font-extrabold text-sm">{tab === "following" ? "لا توجد لحظات من المتابعين" : "لا توجد لحظات حالياً"}</p>
              <p className="text-[11px] text-gray-400 mt-1">كن أول من يشارك لحظة جديدة</p>
            </div>
          ) : (
            safeMoments.map((moment: any) => {
              const images = normalizeImages(moment);
              const key = String(moment.id);
              const isLiked = optimisticLikes[key] ?? Boolean(moment.isLiked);
              const likes = Math.max(0, (moment.likes ?? moment.likeCount ?? 0) + (optimisticLikes[key] !== undefined ? (isLiked === Boolean(moment.isLiked) ? 0 : isLiked ? 1 : -1) : 0));
              const timestamp = moment.createdAt ?? moment._creationTime;

              return (
                <article key={moment.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button type="button" onClick={() => handleUserSelect(moment.userId, moment.profile)} className="flex-shrink-0 active:scale-95 transition-transform" aria-label="فتح ملف المستخدم">
                        <UserAvatar userId={moment.userId} avatarUrl={moment.profile?.isPrivateProfile ? PRIVATE_AVATAR_URL : moment.profile?.avatarUrl} name={moment.profile?.isPrivateProfile ? PRIVATE_DISPLAY_NAME : moment.profile?.name} size={40} isVip={!moment.profile?.isPrivateProfile && moment.profile?.isVip} vipLevel={moment.profile?.isPrivateProfile ? 0 : moment.profile?.vipLevel} isSuperAdmin={!moment.profile?.isPrivateProfile && moment.profile?.isSuperAdmin} showFrame={!moment.profile?.isPrivateProfile} />
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <UserNameLuxury profile={moment.profile} className="text-sm truncate" />
                          {!moment.profile?.isPrivateProfile && moment.profile?.isVip && <VipBadge level={moment.profile.vipLevel} size="xs" />}
                          {!moment.profile?.isPrivateProfile && moment.profile?.aristocracyLevel > 0 && <AristocracyBadge level={moment.profile.aristocracyLevel} size="xs" />}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-0.5">
                          <span>{formatMomentTime(timestamp)}</span>
                          <span>•</span>
                          <span>حول العالم</span>
                        </div>
                      </div>
                    </div>
                    <button type="button" className="text-gray-300 hover:text-gray-500 text-sm p-1" aria-label="المزيد">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
                    </button>
                  </div>

                  {moment.content && <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line font-medium">{moment.content}</p>}

                  {moment.hashtags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {moment.hashtags.map((tag: string) => <span key={tag} className="text-xs font-bold" style={{ color: BRAND.teal }}>#{tag}</span>)}
                    </div>
                  )}

                  <PostImageGrid images={images} onImageClick={(index) => setActiveImages({ images, index })} />

                  <div className="text-left text-[10px] text-gray-400 font-medium">{timestamp ? new Date(timestamp).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) : ""}</div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-gray-500 text-xs">
                    <div className="flex items-center gap-6">
                      <button type="button" onClick={() => toggleLike(moment)} className={`flex items-center gap-1.5 transition active:scale-95 ${isLiked ? "text-red-500" : "hover:text-red-500"}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                        <span className="font-extrabold">{likes}</span>
                      </button>

                      <button type="button" onClick={() => setActiveComments(moment.id)} className="flex items-center gap-1.5 hover:text-cyan-500 transition active:scale-95">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                        <span className="font-extrabold">{moment.commentsCount ?? moment.commentCount ?? 0}</span>
                      </button>
                    </div>

                    <button type="button" onClick={() => shareMoment(moment)} className="text-gray-400 hover:text-gray-700 transition active:scale-95" aria-label="مشاركة المنشور">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M16 6l-4-4-4 4M12 2v14" /></svg>
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </main>
      </div>

      {activeComments && <CommentsModal momentId={activeComments} onClose={() => setActiveComments(null)} onUserSelect={handleUserSelect} />}
      {activeImages && <ImageViewer images={activeImages.images} initialIndex={activeImages.index} onClose={() => setActiveImages(null)} />}
    </div>
  );
}
