// @ts-nocheck
import UserAvatar from "./UserAvatar";

interface Props {
  userId: any;
  avatarUrl?: string;
  name: string;
  showRoom?: boolean;
  size?: number;
}

export default function AmbassadorAvatarFrame({ userId, avatarUrl, name, showRoom, size = 78 }: Props) {
  const inner = size - 8;
  return (
    <>
      <style>{`
        @keyframes ambassador-frame-spin {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes ambassador-shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
      <div className="relative inline-block">
        <div
          className="rounded-full p-[3px]"
          style={{
            background: "linear-gradient(135deg,#ffd700,#ff8c00,#ffd700,#ff8c00)",
            backgroundSize: "300% 300%",
            animation: "ambassador-frame-spin 3s ease infinite",
            boxShadow: "0 0 22px rgba(255,215,0,0.7)",
            width: size,
            height: size,
          }}
        >
          <div className="rounded-full overflow-hidden w-full h-full" style={{ border: "2px solid white" }}>
            <UserAvatar userId={userId} avatarUrl={avatarUrl} name={name} size={inner} showFrame={false} />
          </div>
        </div>
        <div
          className="absolute -bottom-1 -left-1 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
          style={{
            background: "linear-gradient(135deg,#ffd700,#ff8c00)",
            boxShadow: "0 0 8px rgba(255,215,0,0.8)",
            border: "1.5px solid white",
          }}
        >
          🌟
        </div>
        {showRoom && (
          <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white z-20" />
        )}
      </div>
    </>
  );
}
