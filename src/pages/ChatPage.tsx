// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from "react";
import { VipFrame, VipName, VipBadge, getVipConfig } from "../components/VipBadge";
import UserAvatar from "../components/UserAvatar";
import { toast } from "../lib/toast";
import LevelBadgeInline from "../components/LevelBadgeInline";
import AiChatPanel from "../components/AiChatPanel";
import SharedReelBubble from "../components/SharedReelBubble";
import { useHardwareBack } from "../hooks/useHardwareBack";
import { useLang } from "../hooks/useLang";
import { supabase } from "../lib/supabaseClient";
import { useProfile } from "../components/ProfileManager";

interface ChatPageProps {
  otherUserId: string;
  onBack: () => void;
  onViewProfile?: (userId: string) => void;
  onStartVideoCall?: (callId: any, channelName: string, otherName: string, otherAvatarUrl?: string) => void;
}

function LineIcon({ name, className = "w-6 h-6" }: { name: string; className?: string }) {
  const common = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const icons: Record<string, React.ReactNode> = {
    "arrow-right": <path d="M5 12h14M12 5l7 7-7 7" />,
    "plus": <path d="M12 5v14M5 12h14" />,
    "mic": <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />,
    "send": <path d="m22 2-7 20-4-9-9-4Z" />,
    "image": <><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>,
    "video": <><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></>,
    "play": <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />,
    "info": <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
    "flag": <><path d="M5 21V4" /><path d="M5 4c5-3 8 3 14 0v10c-6 3-9-3-14 0" /></>,
    "x": <path d="M18 6L6 18M6 6l12 12" />,
  };
  return <svg {...common}>{icons[name] || null}</svg>;
}

function aristocracyBubble(level: number, isMe: boolean) {
  const palette: Record<number, { bg: string; border: string; color: string }> = {
    1: { bg: "linear-gradient(135deg,#fff7ed,#ffedd5)", border: "#fdba74", color: "#9a3412" },
    2: { bg: "linear-gradient(135deg,#eff6ff,#dbeafe)", border: "#93c5fd", color: "#1e40af" },
    3: { bg: "linear-gradient(135deg,#f5f3ff,#ede9fe)", border: "#c4b5fd", color: "#5b21b6" },
    4: { bg: "linear-gradient(135deg,#fdf4ff,#fae8ff)", border: "#f0abfc", color: "#86198f" },
    5: { bg: "linear-gradient(135deg,#fff7ed,#fef3c7)", border: "#fbbf24", color: "#92400e" },
    6: { bg: "linear-gradient(135deg,#fff1f2,#fce7f3)", border: "#fb7185", color: "#9f1239" },
  };
  const tone = palette[Math.max(0, Math.min(level, 6))];
  if (!tone) return isMe ? { background: "#2563eb", color: "#fff", border: "1px solid #1d4ed8" } : { background: "#fff", color: "#374151", border: "1px solid #e5e7eb" };
  return { background: tone.bg, color: tone.color, border: `1px solid ${tone.border}`, boxShadow: `0 4px 14px ${tone.border}55` };
}

export default function ChatPage({ otherUserId, onBack, onViewProfile, onStartVideoCall }: ChatPageProps) {
  const { lang } = useLang();
  const { profile: myProfile } = useProfile();
  const [messages, setMessages] = useState<any[]>([]);
  const [otherProfile, setOtherProfile] = useState<any>(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', otherUserId).single();
      setOtherProfile(profile);
      
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${myProfile?.user_id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${myProfile?.user_id})`)
        .order('created_at', { ascending: false })
        .limit(50);
      
      setMessages((msgs || []).reverse());
      setIsLoading(false);
    };
    if (myProfile) fetchData();

    const channel = supabase.channel(`chat:${otherUserId}`)
      .on('postgres_changes', { event: 'INSERT', table: 'messages' }, (payload) => {
        const msg = payload.new;
        if ((msg.sender_id === otherUserId && msg.receiver_id === myProfile?.user_id) || 
            (msg.sender_id === myProfile?.user_id && msg.receiver_id === otherUserId)) {
          setMessages(prev => [...prev, msg]);
        }
      })
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [otherUserId, myProfile]);

  const isPrivateOther = Boolean(otherProfile?.isPrivateProfile);
  const otherDisplayName = isPrivateOther ? "شخصي" : (otherProfile?.name ?? "...");

  const sendMessage = async ({ receiverId, content }: any) => {
    await supabase.from('messages').insert({
      sender_id: myProfile?.user_id,
      receiver_id: receiverId,
      content: content,
      type: 'text'
    });
  };
  const markAsRead = async () => {
    await supabase.from('messages').update({ is_read: true }).eq('sender_id', otherUserId).eq('receiver_id', myProfile?.user_id);
  };
  const setTyping = async ({ otherUserId, isTyping }: any) => {};
  const generateUploadUrl = async () => "";
  const sendImage = async ({ receiverId, imageStorageId }: any) => {};
  const sendVideo = async ({ receiverId, videoStorageId }: any) => {};
  const sendVoice = async ({ receiverId, voiceStorageId, voiceDuration }: any) => {};
  const submitReport = async ({ sakiId, reason, details }: any) => {};

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showMediaSheet, setShowMediaSheet] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useHardwareBack(onBack, true);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (myProfile) markAsRead();
  }, [otherUserId, myProfile]);

  useEffect(() => {
    return () => {
      setTyping({ otherUserId, isTyping: false }).catch(() => {});
    };
  }, [otherUserId]);

  const handleTextChange = (val: string) => {
    setText(val);
    setTyping({ otherUserId, isTyping: val.length > 0 }).catch(() => {});
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setTyping({ otherUserId, isTyping: false }).catch(() => {});
    }, 3000);
  };

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    setTyping({ otherUserId, isTyping: false }).catch(() => {});
    try {
      await sendMessage({ receiverId: otherUserId, content: text.trim() });
      setText("");
      inputRef.current?.focus();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file || uploadingMedia) return;
    setUploadingMedia(true);
    setShowMediaSheet(false);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!result.ok) throw new Error("فشل رفع الملف إلى التخزين");
      const payload = await result.json();
      const storageId = payload?.storageId;
      if (!storageId) throw new Error("لم يتم إرجاع معرف الملف");
      if (type === "image") {
        await sendImage({ receiverId: otherUserId, imageStorageId: storageId });
      } else {
        await sendVideo({ receiverId: otherUserId, videoStorageId: storageId });
      }
      toast.success(lang === "en" ? "Media sent" : "تم إرسال الوسائط");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploadingMedia(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch {
      toast.error(lang === "en" ? "Mic access denied" : "لا يمكن الوصول للميكروفون");
    }
  };

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    const duration = recordingDuration;
    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      if (duration < 1) {
        toast.error(lang === "en" ? "Voice message too short" : "الرسالة قصيرة جداً");
        return;
      }
      try {
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": audioBlob.type || "audio/webm" }, body: audioBlob });
        if (!res.ok) throw new Error("فشل رفع التسجيل الصوتي");
        const payload = await res.json();
        const storageId = payload?.storageId;
        if (!storageId) throw new Error("لم يتم حفظ التسجيل الصوتي");
        await sendVoice({ receiverId: otherUserId, voiceStorageId: storageId, voiceDuration: duration });
      } catch (e: any) {
        toast.error(e.message);
      }
    };
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  }, [isRecording, recordingDuration, otherUserId, sendVoice, generateUploadUrl, lang]);

  useEffect(() => () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
  }, []);

  const handleReport = async () => {
    const reason = reportReason.trim();
    if (!reason || submittingReport || !otherProfile?.sakiId) return;
    setSubmittingReport(true);
    try {
      await submitReport({ sakiId: otherProfile.sakiId, reason, details: `بلاغ من الدردشة الخاصة مع SAKI_ID: ${otherProfile.sakiId}` });
      toast.success(lang === "en" ? "Report submitted" : "تم إرسال البلاغ للإدارة بنجاح");
      setReportReason("");
      setShowReportSheet(false);
    } catch (e: any) {
      toast.error(e?.message || (lang === "en" ? "Report failed" : "فشل إرسال البلاغ"));
    } finally {
      setSubmittingReport(false);
    }
  };

  const toggleVoicePlay = (msgId: string, url: string) => {
    if (playingVoice === msgId) {
      audioRefs.current[msgId]?.pause();
      setPlayingVoice(null);
    } else {
      if (playingVoice && audioRefs.current[playingVoice]) {
        audioRefs.current[playingVoice].pause();
      }
      if (!audioRefs.current[msgId]) {
        audioRefs.current[msgId] = new Audio(url);
        audioRefs.current[msgId].onended = () => setPlayingVoice(null);
      }
      audioRefs.current[msgId].play();
      setPlayingVoice(msgId);
    }
  };

  const renderMessage = (msg: any) => {
    const isMe = msg.sender_id === myProfile?.user_id;
    const timeStr = new Date(msg.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
    const rawLevel = isMe ? (myProfile?.aristocracy_level ?? 0) : (otherProfile?.aristocracy_level ?? 0);
    const expiresAt = isMe ? (myProfile?.aristocracy_expires_at ?? 0) : (otherProfile?.aristocracy_expires_at ?? 0);
    const activeLevel = rawLevel > 0 && (!expiresAt || expiresAt > Date.now()) ? rawLevel : 0;

    if (msg.type === "system") {
      return (
        <div key={msg.id} className="flex justify-center my-4">
          <span className="system-msg-pill">{msg.content}</span>
        </div>
      );
    }

    return (
      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} items-start gap-2.5 mb-4`}>
        {!isMe && (
          <div onClick={() => onViewProfile?.(otherUserId)} className="cursor-pointer">
            <UserAvatar userId={otherUserId} avatarUrl={otherProfile?.avatar_url} name={otherDisplayName} size={36} showFrame={!isPrivateOther} />
          </div>
        )}
        <div className={`flex flex-col space-y-1 max-w-[78%] ${isMe ? "items-end" : "items-start"}`}>
          {!isMe && <span className="sender-name">{otherDisplayName}</span>}
          
          <div className={`bubble ${isMe ? "bubble-me" : "bubble-other"}`} style={aristocracyBubble(activeLevel, isMe)}>
            {msg.type === "text" && <p className="text-sm font-medium leading-relaxed">{msg.content}</p>}
            {msg.type === "image" && (
              <a href={msg.image_url} target="_blank" rel="noreferrer" className="block relative overflow-hidden rounded-xl">
                <img src={msg.image_url} alt="chat" className="max-h-60 max-w-full object-cover" loading="lazy" />
              </a>
            )}
            {msg.type === "video" && (
              <video src={msg.video_url} controls playsInline preload="metadata" className="max-h-72 max-w-full rounded-xl bg-black" />
            )}
            {msg.type === "voice" && (
              <div className="flex items-center gap-3 min-w-[140px]">
                <button 
                  onClick={() => toggleVoicePlay(msg.id, msg.voice_url)}
                  className="voice-play-btn"
                >
                  <LineIcon name={playingVoice === msg.id ? "x" : "play"} className="w-4 h-4" />
                </button>
                <div className="flex-1 space-y-1">
                  <div className="voice-progress-bg">
                    <div className={`voice-progress-bar ${playingVoice === msg.id ? "animate-pulse" : ""}`} style={{ width: "60%" }}></div>
                  </div>
                  <span className="voice-duration">{Math.floor(msg.voiceDuration || msg.duration || 0)}s</span>
                </div>
                <LineIcon name="mic" className="w-3.5 h-3.5 opacity-60" />
              </div>
            )}
          </div>
          <span className="msg-time">{timeStr}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="chat-container" dir="rtl">
      {/* ==================== HEADER ==================== */}
      <header className="chat-header">
        <button onClick={onBack} className="header-back-btn">
          <LineIcon name="arrow-right" className="w-6 h-6" />
        </button>
        <div className="header-user-info" onClick={() => onViewProfile?.(otherUserId)}>
          <UserAvatar userId={otherUserId} avatarUrl={otherProfile?.avatar_url} name={otherDisplayName} size={40} showFrame={!isPrivateOther} />
          <div className="flex flex-col">
            <h3 className="header-user-name">{otherDisplayName}</h3>
            <span className="header-user-status">
              {isOtherTyping ? (lang === "en" ? "typing..." : "يكتب الآن...") : (otherProfile?.isOnline ? (lang === "en" ? "Online" : "متصل الآن") : (lang === "en" ? "Offline" : "غير متصل"))}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowReportSheet(true)} className="header-info-btn" aria-label="إبلاغ عن المستخدم">
            <LineIcon name="flag" className="w-5 h-5" />
          </button>
          <button onClick={() => onViewProfile?.(otherUserId)} className="header-info-btn" aria-label="معلومات المستخدم">
            <LineIcon name="info" className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* ==================== MESSAGES ==================== */}
      <main className="chat-messages-area">
        {messages?.map((msg, idx) => {
          const prev = messages[idx - 1];
          const showDate = !prev || new Date(msg.created_at).toDateString() !== new Date(prev.createdAt).toDateString();
          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-6">
                  <span className="date-pill">
                    {new Date(msg.created_at).toLocaleDateString("ar-SA", { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                </div>
              )}
              {renderMessage(msg)}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* ==================== INPUT AREA ==================== */}
      <footer className="chat-input-footer">
        {blockStatus?.isBlockedByMe ? (
          <div className="w-full text-center py-3 bg-gray-100 text-gray-500 text-sm font-bold rounded-2xl">
            {lang === "en" ? "You blocked this user" : "لقد قمت بحظر هذا المستخدم"}
          </div>
        ) : blockStatus?.isBlockedByOther ? (
          <div className="w-full text-center py-3 bg-gray-100 text-gray-500 text-sm font-bold rounded-2xl">
            {lang === "en" ? "User blocked you" : "هذا المستخدم قام بحظرك"}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowMediaSheet(true)} className="input-action-btn">
              <LineIcon name="plus" className="w-6 h-6" />
            </button>
            
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={lang === "en" ? "Write a message..." : "اكتب رسالة..."}
                className="chat-text-input"
              />
            </div>

            {text.trim() ? (
              <button onClick={handleSend} disabled={sending} className="send-msg-btn">
                <LineIcon name="send" className="w-5 h-5 text-white" />
              </button>
            ) : (
              <button 
                onPointerDown={(event) => { event.currentTarget.setPointerCapture?.(event.pointerId); void startRecording(); }}
                onPointerUp={() => { void stopRecording(); }}
                onPointerCancel={() => { void stopRecording(); }}
                style={{ touchAction: "none" }}
                className={`voice-record-btn ${isRecording ? "recording-active" : ""}`}
              >
                <LineIcon name="mic" className="w-6 h-6" />
              </button>
            )}
          </div>
        )}
      </footer>

      {showReportSheet && (
        <div className="fixed inset-0 z-[600] flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowReportSheet(false)}>
          <div className="w-full max-w-md rounded-t-[30px] bg-white p-6" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-black text-gray-900">إبلاغ عن المستخدم</h3><button onClick={() => setShowReportSheet(false)} className="p-2 rounded-full bg-gray-100"><LineIcon name="x" className="w-5 h-5" /></button></div>
            <p className="text-xs text-gray-500 mb-3">سيصل البلاغ إلى لوحة الإدارة للمراجعة. لا تستخدم البلاغات الكاذبة.</p>
            <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="اكتب سبب البلاغ بالتفصيل..." className="w-full min-h-28 rounded-2xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 outline-none focus:border-red-400" />
            <button disabled={!reportReason.trim() || submittingReport} onClick={handleReport} className="mt-4 w-full rounded-2xl bg-red-600 py-3.5 text-sm font-black text-white disabled:opacity-50">{submittingReport ? "جارٍ إرسال البلاغ..." : "إرسال البلاغ"}</button>
          </div>
        </div>
      )}

      {/* ==================== MEDIA SHEET ==================== */}
      {showMediaSheet && (
        <div className="fixed inset-0 z-[500] flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowMediaSheet(false)}>
          <div className="w-full max-w-md bg-white rounded-t-[32px] p-6 space-y-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-gray-800">{lang === "en" ? "Send Media" : "إرسال وسائط"}</h3>
              <button onClick={() => setShowMediaSheet(false)} className="p-2 bg-gray-100 rounded-full"><LineIcon name="x" className="w-5 h-5" /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <label className="media-upload-card">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMediaUpload(e, "image")} />
                <div className="media-icon-circle bg-gradient-to-tr from-blue-500 to-indigo-600">
                  <LineIcon name="image" className="w-7 h-7 text-white" />
                </div>
                <span className="media-label">{lang === "en" ? "Send Image" : "إرسال صورة"}</span>
              </label>
              
              <label className="media-upload-card">
                <input type="file" accept="video/*" className="hidden" onChange={(e) => handleMediaUpload(e, "video")} />
                <div className="media-icon-circle bg-gradient-to-tr from-purple-500 to-pink-600">
                  <LineIcon name="video" className="w-7 h-7 text-white" />
                </div>
                <span className="media-label">{lang === "en" ? "Send Video" : "إرسال فيديو"}</span>
              </label>
            </div>

            <button onClick={() => setShowMediaSheet(false)} className="w-full py-4 bg-gray-100 text-gray-700 font-bold text-sm rounded-2xl">
              {lang === "en" ? "Cancel" : "إلغاء"}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
        
        .chat-container {
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, #EBF5FF 0%, #F5F9FF 30%, #FFFFFF 100%);
          display: flex;
          flex-direction: column;
          font-family: 'Tajawal', sans-serif;
        }

        .chat-header {
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid #f1f5f9;
        }

        .header-back-btn {
          padding: 8px;
          color: #374151;
          border: none;
          background: none;
          cursor: pointer;
        }

        .header-user-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        .header-user-name {
          font-size: 15px;
          font-weight: 800;
          color: #1f2937;
        }

        .header-user-status {
          font-size: 10px;
          font-weight: 600;
          color: #10b981;
        }

        .header-info-btn {
          padding: 8px;
          color: #9ca3af;
          border: none;
          background: none;
          cursor: pointer;
        }

        .chat-messages-area {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
        }

        .date-pill {
          font-size: 10px;
          font-weight: 800;
          background: rgba(0, 0, 0, 0.05);
          color: #6b7280;
          padding: 4px 12px;
          border-radius: 999px;
        }

        .system-msg-pill {
          font-size: 10px;
          font-weight: 700;
          color: #9ca3af;
          background: rgba(243, 244, 246, 0.8);
          padding: 4px 14px;
          border-radius: 999px;
        }

        .sender-name {
          font-size: 11px;
          font-weight: 700;
          color: #9ca3af;
          margin-right: 4px;
        }

        .bubble {
          padding: 10px 14px;
          border-radius: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .bubble-me {
          background: #2563eb;
          color: white;
          border-top-left-radius: 4px;
        }

        .bubble-other {
          background: white;
          color: #374151;
          border-top-right-radius: 4px;
          border: 1px solid #f1f5f9;
        }

        .msg-time {
          font-size: 9px;
          font-weight: 600;
          color: #9ca3af;
          margin-top: 2px;
        }

        .chat-input-footer {
          padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
          background: white;
          border-top: 1px solid #f1f5f9;
        }

        .input-action-btn {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: #f3f4f6;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
        }

        .chat-text-input {
          width: 100%;
          background: #f3f4f6;
          border-radius: 14px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          border: none;
          outline: none;
        }

        .send-msg-btn {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        .voice-record-btn {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: #f3f4f6;
          color: #374151;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .recording-active {
          background: #ef4444;
          color: white;
          animation: pulse-red 1.5s infinite;
        }

        @keyframes pulse-red {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        .media-upload-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 20px;
          background: #f9fafb;
          border-radius: 24px;
          border: 1px solid #f1f5f9;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .media-upload-card:active {
          transform: scale(0.95);
        }

        .media-icon-circle {
          width: 56px;
          height: 56px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .media-label {
          font-size: 12px;
          font-weight: 800;
          color: #374151;
        }

        .voice-play-btn {
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          color: white;
        }

        .bubble-other .voice-play-btn {
          background: #eff6ff;
          color: #2563eb;
        }

        .voice-progress-bg {
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 999px;
          overflow: hidden;
        }

        .bubble-other .voice-progress-bg {
          background: #f3f4f6;
        }

        .voice-progress-bar {
          height: 100%;
          background: white;
        }

        .bubble-other .voice-progress-bar {
          background: #2563eb;
        }

        .voice-duration {
          font-size: 9px;
          font-weight: 700;
          opacity: 0.8;
        }

        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
