import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

export function useNotificationHandler() {
  useEffect(() => {
    let isMounted = true;

    // Handle notifications received while app is running - don't navigate
    const notificationSubscription = 
      Notifications.addNotificationReceivedListener(() => {
        // Just show the notification, no navigation
      });

    // Handle notification responses (when user taps notification)
    const responseSubscription = 
      Notifications.addNotificationResponseReceivedListener(response => {
        if (!isMounted) return;
        
        // Always navigate to home screen when notification is tapped
        try {
          router.push('/(app)/(tabs)/');
        } catch (error) {
          console.error('Navigation error:', error);
        }
      });

    // Cleanup
    return () => {
      isMounted = false;
      notificationSubscription.remove();
      responseSubscription.remove();
    };
  }, []);
} 

export default useNotificationHandler;
