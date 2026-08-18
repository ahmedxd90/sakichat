import { registerPlugin } from "@capacitor/core";

export interface RoomBubbleNativePlugin {
  show(options: { roomId: string; roomName: string; coverUrl?: string }): Promise<{ shown: boolean; needsPermission?: boolean }>;
  hide(): Promise<void>;
  openOverlaySettings(): Promise<void>;
  isOverlayGranted(): Promise<{ granted: boolean }>;
  consumeResumeRequest(): Promise<{ requested: boolean; roomId?: string }>;
  requestMediaPermissions(): Promise<void>;
  requestOverlayAndMediaPermissions(): Promise<void>;
}

export const RoomBubbleNative = registerPlugin<RoomBubbleNativePlugin>("RoomBubble");
