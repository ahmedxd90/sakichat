import { useState, useEffect } from "react";
import SVGAPlayer, { isSvgaUrl } from "./SVGAPlayer";
import { supabase } from "../lib/supabaseClient";

interface Props {
  userId: string | undefined | null;
  avatarUrl?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  showFrame?: boolean;
  isSuperAdmin?: boolean;
  isVip?: boolean;
  vipLevel?: number | null;
  maxFrameScale?: number;
  cpLevel?: number | null;
}

export function normalizeScale(raw: number | null | undefined): number {
  if (!raw || raw <= 0) return 1.3;
  return Math.min(2.5, Math.max(1.0, raw));
}

export default function UserAvatar({
  userId,
  avatarUrl,
  name,
  size = 40,
  className = "",
  showFrame = true,
  isSuperAdmin = false,
  isVip = false,
  vipLevel = null,
  maxFrameScale,
  cpLevel = 0,
}: Props) {
  const [publicProfile, setPublicProfile] = useState<any>(null);
  const [activeItems, setActiveItems] = useState<any>(null);
  const [vipConfig, setVipConfig] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
      setPublicProfile(profile);
    };
    fetchData();
  }, [userId]);

  const isPrivateProfile = Boolean((publicProfile as any)?.is_private_profile);
  const PRIVATE_AVATAR_URL = "/assets/privacy/private-person-icon.svg";
  const resolvedAvatarUrl = isPrivateProfile ? PRIVATE_AVATAR_URL : avatarUrl;
  const resolvedName = isPrivateProfile ? "شخصي" : name;
  const resolvedShowFrame = showFrame && !isPrivateProfile;
  const storeFrameUrl = (activeItems as any)?.frame?.mediaUrl ?? null;
  const storeFrameScale = (activeItems as any)?.frame?.frameScale;
  const storeFrameMediaType = (activeItems as any)?.frame?.mediaType ?? null;
  const vipFrameUrl = !storeFrameUrl && isVip && (vipConfig as any)?.frameUrl ? (vipConfig as any).frameUrl : null;
  const safeCpLevel = Math.min(5, Math.max(0, Number(cpLevel ?? 0)));
  const cpFrameUrl = !storeFrameUrl && !vipFrameUrl && safeCpLevel > 0
    ? `/assets/cp-preview-lv${safeCpLevel}.png`
    : null;
  const frameUrl = storeFrameUrl || vipFrameUrl || cpFrameUrl;
  const frameMediaType = storeFrameUrl ? storeFrameMediaType : null;
  const isSvgaFrame = frameMediaType === "svga" || isSvgaUrl(frameUrl);
  const rawScale = storeFrameUrl ? storeFrameScale : cpFrameUrl ? 1.16 : 1.3;
  let scale = normalizeScale(rawScale);
  if (maxFrameScale !== undefined) scale = Math.min(scale, maxFrameScale);
  const frameSize = frameUrl ? Math.round(size * scale) : size;
  // Keep the avatar and frame in one stable square box while allowing the frame to grow.
  const containerSize = size;

  return (
    <div
      className={`flex items-center justify-center flex-shrink-0 ${className}`}
      style={{
        width: containerSize,
        height: containerSize,
        minWidth: containerSize,
        minHeight: containerSize,
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "visible",
        isolation: "isolate",
        aspectRatio: "1 / 1",
      }}
    >
      {/* صورة الأفاتار — مركزية دائماً */}
      <div
        className="rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center"
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
              zIndex: 12,
          flexShrink: 0,
          aspectRatio: "1 / 1",
          clipPath: "circle(50% at 50% 50%)",
          overflow: "hidden",
        }}
      >
        {resolvedAvatarUrl ? (
          <img src={resolvedAvatarUrl} alt={resolvedName ?? ""} className="block h-full w-full object-cover object-center" draggable={false} />
        ) : (
          <span className="text-white font-bold" style={{ fontSize: Math.max(10, size * 0.38) }}>
            {resolvedName?.[0] ?? "ش"}
          </span>
        )}
      </div>

      {/* الإطار — يغطي الـ container بالكامل فوق الصورة */}
      {frameUrl && (
        isSvgaFrame ? (
          <SVGAPlayer
            src={frameUrl}
            width={frameSize}
            height={frameSize}
            loop={true}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 30,
              pointerEvents: "none",
              background: "transparent",
            }}
          />
        ) : (
          <img
            src={frameUrl}
            alt=""
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: frameSize,
              height: frameSize,
              zIndex: 30,
              pointerEvents: "none",
              objectFit: "contain",
              objectPosition: "center",
              display: "block",
              aspectRatio: "1 / 1",
              background: "transparent",
            }}
          />
        )
      )}
    </div>
  );
}
