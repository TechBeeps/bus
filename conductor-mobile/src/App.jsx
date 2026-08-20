import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ShiftSelectScreen from './screens/ShiftSelectScreen';
import LiveVerificationScreen from './screens/LiveVerificationScreen';
import NotificationScreen from './screens/NotificationScreen';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { createNavigationContainerRef } from '@react-navigation/native';
import { Platform } from 'react-native';
import colors from './theme/colors';
const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const responseListener = useRef();

  const API_PUSH_TOKEN_URL = 'https://api.shreemateshwaribus.com/api/v1/push-token';

  const sendTokenToServer = async (token) => {
    if (!token) return;
    try {
      await fetch(API_PUSH_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

    } catch (e) {
      console.log('Failed to send push token to server', e);
    }
  };

  useEffect(() => {
    const setup = async () => {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

           if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: colors.success,
          });
        }
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus === 'granted') {

          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: '4016f9fc-6631-4114-bfcd-bf8ef9a0c31d',
          });

          const token = tokenData?.data;

          sendTokenToServer(token);
        }


      } else {
        console.log('Must use physical device for push notifications');
      }
    };

    setup();

 responseListener.current =
  Notifications.addNotificationResponseReceivedListener(async response => {
    const data =
      response.notification?.request?.content?.data || {};
    if (navigationRef.isReady()) {
      navigationRef.navigate('Notification', {
        notification: response.notification,
      });

      await Notifications.clearLastNotificationResponseAsync();
    }
  });


const checkInitialNotification = async () => {
  try {
    const response =
      await Notifications.getLastNotificationResponseAsync();

    await Notifications.clearLastNotificationResponseAsync();

    if (!response.notification.request.content.data?.razorpay_payment_id) {

      return;
    }

    const navigateToNotification = () => {
      if (!navigationRef.isReady()) {
        return false;
      }

      navigationRef.navigate('Notification', {
        notification: response.notification,
      });

      return true;
    };

    if (!navigateToNotification()) {
      const interval = setInterval(() => {
        if (navigateToNotification()) {
          clearInterval(interval);
        }
      }, 100);
    }

  } catch (error) {
    console.log('Initial notification error:',error);
  }
};

    checkInitialNotification();

    return () => {
      if (responseListener.current && typeof responseListener.current.remove === 'function') {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName="ShiftSelect" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ShiftSelect" component={ShiftSelectScreen}  />
        <Stack.Screen name="LiveVerification" component={LiveVerificationScreen} />
        <Stack.Screen name="Notification" component={NotificationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
