export default function HardwareBackExitSheet({
  isCp, onBackground, onLeave, onClose,
  isOwner, isAdmin, isSuperAdmin, onShowSettings, onShowGames,
}: {
  isCp: boolean;
  onBackground: () => void;
  onLeave: () => void;
  onClose: () => void;
  isOwner?: boolean;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  onShowSettings?: () => void;
  onShowGames?: () => void;
}) {
  const canManage = isOwner || isAdmin || isSuperAdmin;

  const CircleBtn = ({
    onClick, label, children,
  }: { onClick: () => void; label: string; children: React.ReactNode }) => (
    <div style={{ textAlign: "center", color: "#fff" }}>
      <button
        onClick={onClick}
        style={{
          width: 70, height: 70,
          background: "rgba(255,255,255,0.92)",
          borderRadius: "50%",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
          transition: "transform 0.15s",
        }}
        onTouchStart={(e) => (e.currentTarget.style.transform = "scale(0.92)")}
        onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {children}
      </button>
      <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "Cairo, sans-serif" }}>{label}</div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[200]"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
      dir="rtl"
    >
      {/* Buttons row - centered, near top */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 0, right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 36,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* خروج */}
        <CircleBtn onClick={onLeave} label="خروج">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64" />
            <line x1="12" y1="2" x2="12" y2="12" />
          </svg>
        </CircleBtn>

        {/* احتفظ */}
        <CircleBtn onClick={onBackground} label="احتفظ">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </CircleBtn>

        {/* إعدادات — للمالك فقط */}
        {isOwner && onShowSettings && (
          <CircleBtn onClick={() => { onClose(); onShowSettings(); }} label="إعدادات">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </CircleBtn>
        )}
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@700&display=swap');`}</style>
    </div>
  );
}
