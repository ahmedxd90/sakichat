import { VIP1_FRAME_URL } from "./VipBadge";

export default function Vip1FramePreview() {
  return (
    <div className="flex items-center justify-center gap-4 mb-4">
      <div className="flex flex-col items-center gap-1.5">
        <div className="relative" style={{ width: 64, height: 64 }}>
          <div
            className="rounded-full overflow-hidden flex items-center justify-center"
            style={{
              width: 48, height: 48,
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)", zIndex: 1,
              background: "linear-gradient(135deg,#a855f7,#ec4899)",
            }}
          >
            <span className="text-white font-bold text-xl">أ</span>
          </div>
          <img
            src={VIP1_FRAME_URL}
            alt="إطار VIP1"
            style={{
              position: "absolute", top: 0, left: 0,
              width: 64, height: 64, zIndex: 10,
              objectFit: "contain", pointerEvents: "none",
              background: "transparent",
            }}
          />
        </div>
        <span style={{ fontSize: 10, fontWeight: 900, color: "#ff8c42" }}>إطار VIP1 🖼️</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs" style={{ color: "#888" }}>يُضاف تلقائياً</span>
        <span className="text-xs" style={{ color: "#888" }}>لحقيبتك 🎒</span>
      </div>
    </div>
  );
}
