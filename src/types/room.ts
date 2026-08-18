// @ts-nocheck
import { Id } from "../../convex/_generated/dataModel";

export interface RoomPageProps {
  roomId: Id<"rooms">;
  onBack: () => void;
  onViewProfile?: (userId: Id<"users">) => void;
  onMessage?: (userId: Id<"users">) => void;
}

export interface GiftVideoShow {
  videoUrl: string;
  senderName: string;
  receiverName: string;
  giftName: string;
  showFullScreen?: boolean;
  senderAvatarUrl?: string;
  giftImageUrl?: string;
  mediaType?: string;
  soundUrl?: string;
}

export interface LuckWin {
  multiplier: number;
  giftName: string;
  giftPrice: number;
}

export interface FlyingBanner {
  id: string;
  key?: string;
  senderName: string;
  receiverName: string;
  senderAvatar?: string;
  receiverAvatar?: string;
  giftName: string;
  giftImageUrl?: string;
  giftEmoji?: string;
  quantity?: number;
  luckMultiplier?: number;
  luckWinAmount?: number;
  price: number;
  isGlobal?: boolean;
  roomName?: string;
  roomId?: Id<"rooms">;
}

export interface SeatEmojiItem {
  seatIndex: number;
  imageUrl: string;
  senderName: string;
  id: string;
}

export const GIFT_CATEGORIES = [
  { id: "general", label: "عامة", emoji: "✨" },
  { id: "celebrities", label: "مشاهير", emoji: "⭐" },
  { id: "cp", label: "CP", emoji: "💑" },
  { id: "countries", label: "الدول", emoji: "🌍" },
  { id: "luck", label: "الحظ", emoji: "🍀" },
  { id: "horoscope", label: "أبراج", emoji: "♈" },
  { id: "comedy", label: "فكاهة", emoji: "😂" },
  { id: "events", label: "الفعاليات", emoji: "⭐" },
];

export const GIFT_QUANTITIES = [1, 7, 17, 77, 777];

export interface FlyingSeatGift {
  id: string;
  giftImageUrl: string;
  giftName: string;
  soundUrl?: string;
  fromSeatIndex: number;
  toSeatIndex: number;
}
