import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getNotificationsEnabled } from './notificationSettings';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request permissions
export async function requestNotificationPermissions() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('medications', {
      name: 'Medication Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return status === 'granted';
}

// Schedule medication notifications
export async function scheduleMedicationNotification(
  medicationName: string,
  dosage: string,
  times: string[],
  days: string[],
  frequency: 'daily' | 'weekly' | 'monthly'
) {
  // Check if notifications are enabled
  const notificationsEnabled = await getNotificationsEnabled();
  if (!notificationsEnabled) {
    console.log('Notifications are disabled, skipping schedule');
    return;
  }

  // Cancel any existing notifications for this medication
  // You'll need to store and manage notification IDs
  
  for (const time of times) {
    const [hours, minutes] = time.split(':').map(Number);
    
    let trigger: any;
    
    switch (frequency) {
      case 'daily':
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        };
        break;
        
      case 'weekly':
        for (const day of days) {
          const weekday = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
            .indexOf(day.toLowerCase()) + 1;
            
          trigger = {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday,
            hour: hours,
            minute: minutes,
          };
        }
        break;
        
      case 'monthly':
        for (const day of days) {
          trigger = {
            type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
            day: parseInt(day),
            hour: hours,
            minute: minutes,
          };
        }
        break;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to take your medication! 💊",
        body: dosage 
          ? `Take ${dosage} of ${medicationName}`
          : `Time to take ${medicationName}`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { 
          medicationName, 
          dosage,
          screen: '/(app)/(tabs)/index' // Navigate to home screen when tapped
        },
      },
      trigger,
    });
  }
} 