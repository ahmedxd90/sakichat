// @ts-nocheck
import { BadgeCard } from "../components/BadgeSystem";
import { CustomBadgeCard, useUserCustomBadges } from "../components/CustomBadgeDisplay";
import { HostAgencyBadgeCard } from "../components/HostAgencyBadge";

export default function BadgesTabContent({ userId, badges, accentColor }: {
  userId: any;
  badges: any[];
  accentColor: string;
}) {
  const customBadges = useUserCustomBadges(userId);
  const allEmpty = !customBadges || customBadges.length === 0;

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Host Agency Badge */}
      <HostAgencyBadgeCard userId={userId} />

      {/* Custom badges from admin */}
      {customBadges && customBadges.length > 0 && (
        <div>
          <p className="text-xs font-black mb-3 px-1" style={{ color: accentColor }}>
            🏅 أوسمة مميزة
          </p>
          <div className="grid grid-cols-3 gap-3">
            {customBadges.map((b: any) => (
              <CustomBadgeCard key={b._id} badge={b} size="md" />
            ))}
          </div>
        </div>
      )}

      {allEmpty && (
        <div className="text-center py-16 flex flex-col items-center gap-3">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center opacity-30"
            style={{ background: "#f0e8ff" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5">
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
            </svg>
          </div>
          <p className="font-bold text-base" style={{ color: "#888" }}>لا توجد أوسمة بعد</p>
        </div>
      )}
    </div>
  );
}
