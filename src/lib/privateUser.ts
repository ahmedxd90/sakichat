export const PRIVATE_AVATAR_URL = "/assets/privacy/private-person-icon.svg";
export const PRIVATE_DISPLAY_NAME = "مستخدم مخفي";
export const PRIVATE_TOAST = "هذا مستخدم خاص، لا يمكنك الدخول إلى ملفه الشخصي";

export function isPrivateUser(value: any, currentUserId?: string | null): boolean {
  const profile = value?.profile ?? value;
  const userId = profile?.userId ?? value?.userId ?? value?.senderId;
  return Boolean(profile?.isPrivateProfile && (!currentUserId || String(userId) !== String(currentUserId)));
}

export function getPrivateDisplayName(value: any, currentUserId?: string | null): string {
  return isPrivateUser(value, currentUserId) ? PRIVATE_DISPLAY_NAME : (value?.profile?.name ?? value?.name ?? value?.senderName ?? "مجهول");
}

export function getPrivateAvatar(value: any, currentUserId?: string | null): string | undefined {
  return isPrivateUser(value, currentUserId) ? PRIVATE_AVATAR_URL : (value?.profile?.avatarUrl ?? value?.avatarUrl ?? value?.senderAvatar);
}
