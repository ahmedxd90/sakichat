interface NewUserBadgeProps {
  size?: "sm" | "md" | "lg";
}

export default function NewUserBadge({ size = "md" }: NewUserBadgeProps) {
  const configs = {
    sm: { px: "px-1.5 py-0.5", text: "text-[9px]", icon: 18 },
    md: { px: "px-2 py-1", text: "text-[10px]", icon: 22 },
    lg: { px: "px-3 py-1.5", text: "text-xs", icon: 28 },
  } as const;
  const c = configs[size];

  return (
    <div
      className={`inline-flex items-center gap-1 ${c.px} rounded-full font-black`}
      title="وسام مستخدم جديد"
      style={{
        background: "linear-gradient(135deg,rgba(6,182,212,.14),rgba(139,92,246,.14),rgba(236,72,153,.12))",
        border: "1px solid rgba(6,182,212,.42)",
        boxShadow: "0 0 10px rgba(6,182,212,.2), 0 0 20px rgba(139,92,246,.14)",
        animation: "badgeGlow 2s ease-in-out infinite",
      }}
    >
      <img src="/assets/new-user/new-user-badge.svg" alt="" width={c.icon} height={c.icon} className="object-contain" />
      <span
        className={`${c.text} font-black`}
        style={{
          background: "linear-gradient(135deg,#0891b2,#7c3aed,#db2777)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        مستخدم جديد
      </span>
      <style>{`
        @keyframes badgeGlow {
          0%,100% { box-shadow: 0 0 8px rgba(6,182,212,.22), 0 0 16px rgba(139,92,246,.12); }
          50% { box-shadow: 0 0 16px rgba(6,182,212,.42), 0 0 28px rgba(139,92,246,.24); }
        }
      `}</style>
    </div>
  );
}
