// Push notifications removed
export function usePushNotifications() {
  return {
    permission: 'default' as NotificationPermission,
    isSubscribed: false,
    isLoading: false,
    subscribe: async () => false,
    unsubscribe: async () => {},
    vapidPublicKey: null,
  };
}
