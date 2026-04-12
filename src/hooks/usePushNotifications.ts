import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  } as any),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const router = useRouter();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // You can handle notification received in foreground
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // Handle Tap Action (Navigate to specific screen)
      const data = response.notification.request.content.data;
      console.log('Push Notif Tapped! Data:', data);
      
      if (data && data.tripId) {
        // Add a delay to let the app finish mounting if it was completely closed
        setTimeout(() => {
          router.push(`/trip/${data.tripId}` as any);
        }, 1500);
      }
    });

    return () => {
      if (notificationListener.current?.remove) {
        notificationListener.current.remove();
      }
      if (responseListener.current?.remove) {
        responseListener.current.remove();
      }
    };
  }, []);

  return { expoPushToken };
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFC800',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get notification permissions');
      return undefined;
    }
    
    try {
      const projectId = (Constants as any)?.expoConfig?.extra?.eas?.projectId ?? (Constants as any)?.easConfig?.projectId;
      if (!projectId) {
         try {
           token = (await Notifications.getExpoPushTokenAsync({ projectId: 'bf16467c-fc99-4d6d-8a58-861fbc6c06a3' })).data;
         } catch (innerErr) {
           console.log("Failed to get Expo token:", innerErr);
         }
      } else {
         token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      }
      if (token) console.log("Expo Push Token:", token);
    } catch (e: any) {
      console.log('Skipping push tokens on dev client without project ID', e?.message);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
