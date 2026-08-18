// PWA removed
export function usePWA() {
  return {
    notifPermission: 'default' as NotificationPermission,
    isInstalled: false,
    installable: false,
    requestPermission: async () => 'default' as NotificationPermission,
    notify: () => {},
    install: async () => false,
  };
}
