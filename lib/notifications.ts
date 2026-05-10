import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(userId: string): Promise<void> {
  if (Platform.OS === 'web') return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  // Store in profile so server-side push becomes possible later
  await (supabase as any)
    .from('profiles')
    .update({ push_token: token })
    .eq('id', userId);
}

export async function scheduleDropAlert(
  dropId: string,
  dropName: string,
  releaseDate: string,
): Promise<void> {
  const release = new Date(releaseDate);
  // Notify the morning of drop day at 09:00 local time
  const alertTime = new Date(release);
  alertTime.setHours(9, 0, 0, 0);

  const now = new Date();
  if (alertTime <= now) return; // Already released

  await Notifications.scheduleNotificationAsync({
    identifier: `drop-${dropId}`,
    content: {
      title: 'Drop Day 🔔',
      body: `${dropName} drops today. Time to cop or skip.`,
      data: { dropId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: alertTime,
    },
  });
}

export async function cancelDropAlert(dropId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`drop-${dropId}`);
}
