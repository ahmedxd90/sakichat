// @ts-nocheck
import { supabase } from "../lib/supabaseClient";
import { useState, useEffect } from "react";
import { toast } from "../lib/toast";
import UserAvatar from "../components/UserAvatar";
import { AristocracyName, getAristocracyConfig, AristocracyBadge } from "../components/AristocracyBadge";
import { getVipConfig, VipBadge } from "../components/VipBadge";

function formatTimeAgo(ts: number) {
  const d = Date.now() - ts, m = Math.floor(d / 60000), h = Math.floor(d / 3600000), dy = Math.floor(d / 86400000);
  if (m < 1) return "الآن"; if (m < 60) return `${m}د`; if (h < 24) return `${h}س`; if (dy < 7) return `${dy}ي`;
  return new Date(ts).toLocaleDateString("ar-SA");
}

function UserNameLuxury({ profile }: { profile: any }) {
  const now = Date.now();
  const aristLevel = profile?.aristocracyLevel ?? 0;
  const aristExpiry = profile?.aristocracyExpiresAt ?? 0;
  const aristActive = aristLevel > 0 && aristExpiry > now;
  const name = profile?.name ?? "مستخدم";
  
  if (aristActive) return <AristocracyName name={name} level={aristLevel} className="text-sm font-bold" />;
  
  const vipLevel = profile?.vipLevel;
  const vipCfg = profile?.isVip && vipLevel ? getVipConfig(vipLevel) : null;
  
  if (vipCfg) {
    return (
      <span className="font-bold text-sm" style={{ color: vipCfg.nameColor }}>
        {name}
      </span>
    );
  }
  
  return <span className="font-bold text-sm text-gray-900">{name}</span>;
}

// ── Image Grid Component ──
function PostImageGrid({ images, onImageClick }: { images: string[], onImageClick: (idx: number) => void }) {
  if (!images || images.length === 0) return null;
  
  const count = images.length;
  let gridClass = "grid-cols-1";
  if (count === 2) gridClass = "grid-cols-2";
  else if (count === 3) gridClass = "grid-cols-3";
  else if (count >= 4) gridClass = "grid-cols-2";

  return (
    <div className={`grid ${gridClass} gap-1.5 rounded-2xl overflow-hidden mt-3`}>
      {images.map((src, idx) => (
        <div 
          key={idx} 
          className="relative aspect-square bg-gray-100 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => onImageClick(idx)}
        >
          <img src={src} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
        </div>
      ))}
    </div>
  );
}

// ── Fullscreen Image Viewer ──
function ImageViewer({ images, initialIdx, onClose }: { images: string[], initialIdx: number, onClose: () => void }) {
  const [currentIdx, setCurrentIdx] = useState(initialIdx);
  
  return (
    <div className="fixed inset-0 z-[300] bg-black/95 flex flex-col animate-in fade-in duration-200" onClick={onClose}>
      <div className="flex items-center justify-between p-4 text-white z-10" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <span className="bg-white/10 px-4 py-1 rounded-full text-xs font-bold">
          {currentIdx + 1} / {images.length}
        </span>
        <div className="w-10" />
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
        <img src={images[currentIdx]} alt="" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
      </div>
      
      {images.length > 1 && (
        <div className="flex justify-between p-6 z-10" onClick={e => e.stopPropagation()}>
          <button 
            onClick={() => setCurrentIdx(prev => (prev > 0 ? prev - 1 : images.length - 1))}
            className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          <button 
            onClick={() => setCurrentIdx(prev => (prev < images.length - 1 ? prev + 1 : 0))}
            className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}

function ProfileCommentsSection({ momentId, myProfile }: { momentId: any; myProfile: any }) {
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
  const handleAdd = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try { await addComment({ momentId, content: text.trim() }); setText(""); }
    catch (e: any) { toast.error(e.message); }
    finally { setSending(false); }
  };
  return (
    <div className="mt-3 pt-3 space-y-3" style={{ borderTop: "1px solid #f0e8ff" }}>
      <div className="space-y-2.5 max-h-48 overflow-y-auto no-scrollbar">
        {!comments
          ? <div className="flex justify-center py-3"><div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>
          : comments.length === 0
            ? <p className="text-gray-400 text-[10px] text-center py-2 font-bold">لا توجد تعليقات بعد 💬</p>
            : comments.map((c: any) => (
              <div key={c.id} className="flex gap-2">
                <div className="flex-shrink-0">
                  <UserAvatar userId={c.userId} avatarUrl={c.profile?.avatarUrl} name={c.profile?.name} size={28} isVip={c.profile?.isVip} vipLevel={c.profile?.vipLevel} isSuperAdmin={c.profile?.isSuperAdmin} />
                </div>
                <div className="flex-1 px-3 py-1.5 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center justify-between mb-0.5">
                    <UserNameLuxury profile={c.profile} />
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{c.content}</p>
                </div>
              </div>
            ))}
      </div>
      <div className="flex gap-2 items-center">
        <div className="flex-1 flex gap-2 items-center rounded-2xl px-3 py-1.5 bg-gray-50 border border-gray-200">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="اكتب تعليقاً..." className="flex-1 bg-transparent text-xs placeholder-gray-400 focus:outline-none" style={{ color: "#333" }} />
          <button onClick={handleAdd} disabled={!text.trim() || sending}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white disabled:opacity-30 active:scale-95 shadow-sm"
            style={{ background: "linear-gradient(135deg, #5ce1e6, #3dbda7)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfileMomentsTab({ userId, canViewFull, myProfile, accentColor }: {
  userId: string; canViewFull: boolean; myProfile: any; accentColor: string;
}) {
  const [moments, setMoments] = useState<any[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('moments').select('*, profile:profiles(*)').eq('user_id', userId);
      setMoments(data || []);
    };
    fetchData();
  }, [userId]);

  const likeMoment = async (args: any) => {};
  const [openComments, setOpenComments] = useState<any>(null);
  const [viewerData, setViewerData] = useState<{ images: string[], idx: number } | null>(null);

  if (!canViewFull) return (
    <div className="text-center py-16 flex flex-col items-center gap-3">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
      <p className="font-bold text-sm text-gray-500">ملف شخصي خاص</p>
    </div>
  );
  if (!moments) return (
    <div className="flex justify-center py-10">
      <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (moments.length === 0) return (
    <div className="text-center py-16 flex flex-col items-center gap-3">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      </div>
      <p className="font-bold text-sm text-gray-500">لا توجد لحظات بعد</p>
    </div>
  );

  return (
    <div className="py-4 space-y-4 px-3 bg-[#f8f9fa] font-cairo">
      {moments.map((moment: any) => {
        const isLiked = moment.isLiked ?? Boolean(myProfile?.userId && (moment.likedBy ?? []).includes(myProfile.userId));
        
        // يدعم روابط الصور الجديدة والبيانات القديمة التي كانت تحفظ الصورة ككائن.
        let momentImages = (moment.images ?? [])
          .map((image: any) => typeof image === "string" ? image : image?.url)
          .filter(Boolean);
        if (moment.imageUrl && momentImages.length === 0) {
          momentImages = [moment.imageUrl];
        }

        const handleLike = async () => {
          try { await likeMoment({ momentId: moment.id }); } catch (e: any) { toast.error(e.message); }
        };

        return (
          <article key={moment.id} className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <UserAvatar userId={moment.userId} avatarUrl={moment.profile?.avatarUrl} name={moment.profile?.name} size={40} isVip={moment.profile?.isVip} vipLevel={moment.profile?.vipLevel} isSuperAdmin={moment.profile?.isSuperAdmin} />
              <div>
                <div className="flex items-center gap-1.5">
                  <UserNameLuxury profile={moment.profile} />
                  {moment.profile?.isVip && <VipBadge level={moment.profile.vipLevel} size="xs" />}
                  {moment.profile?.aristocracyLevel > 0 && <AristocracyBadge level={moment.profile.aristocracyLevel} size="xs" />}
                </div>
                <span className="text-[10px] text-gray-400 font-bold">{formatTimeAgo(moment.createdAt)}</span>
              </div>
            </div>
            
            {/* Content */}
            {moment.content && (
              <p className="text-sm text-gray-800 leading-relaxed font-medium mb-2">{moment.content}</p>
            )}
            
            {/* Images */}
            {momentImages.length > 0 && (
              <PostImageGrid 
                images={momentImages} 
                onImageClick={(idx) => setViewerData({ images: momentImages, idx })} 
              />
            )}
            
            {/* Hashtags */}
            {(moment.hashtags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(moment.hashtags as string[]).map((tag: string) => (
                  <span key={tag} className="text-[10px] font-black text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-100">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50">
              <button onClick={handleLike} className="flex items-center gap-1.5 active:scale-90 transition-transform">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isLiked ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-400"}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                </div>
                <span className={`text-xs font-black ${isLiked ? "text-red-500" : "text-gray-500"}`}>{moment.likes || 0}</span>
              </button>
              
              <button onClick={() => setOpenComments(openComments === moment.id ? null : moment.id)} className="flex items-center gap-1.5 active:scale-90 transition-transform">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${openComments === moment.id ? "bg-cyan-50 text-cyan-500" : "bg-gray-50 text-gray-400"}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
                </div>
                <span className={`text-xs font-black ${openComments === moment.id ? "text-cyan-500" : "text-gray-500"}`}>{moment.commentsCount || 0}</span>
              </button>
            </div>
            
            {openComments === moment.id && (
              <ProfileCommentsSection momentId={moment.id} myProfile={myProfile} />
            )}
          </article>
        );
      })}
      
      {viewerData && (
        <ImageViewer 
          images={viewerData.images} 
          initialIdx={viewerData.idx} 
          onClose={() => setViewerData(null)} 
        />
      )}
    </div>
  );
}
