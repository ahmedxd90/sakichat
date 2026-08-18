// Native app mode - PWA disabled

export async function registerPWA() { return null; }
export function setupInstallPrompt() {}
export async function promptInstall() { return false; }
export function canInstall() { return false; }
export function isInstalledPWA() { return true; }
export async function requestNotificationPermission(): Promise<NotificationPermission> { return 'denied'; }
export async function showLocalNotification() {}
export function suppressMediaNotifications() {}
export function blockMediaContextMenu() {}
export function blockPullToRefresh() {}
