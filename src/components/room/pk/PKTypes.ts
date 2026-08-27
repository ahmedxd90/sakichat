
export interface PKBattleSheetProps {
  roomId: string;
  isOwner: boolean;
  isAdmin?: boolean;
  myCoins: number;
  onClose: () => void;
}

export const DURATIONS = [
  { label: "5 دقائق", value: 5 },
  { label: "10 دقائق", value: 10 },
  { label: "15 دقائق", value: 15 },
  { label: "30 دقائق", value: 30 },
] as const;

export type PKTab = "active" | "ready_list" | "challenge";
