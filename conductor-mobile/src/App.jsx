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
            lightColor: '#FF231F7C',
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

console.log('Push token:', tokenData.data);
        }


      } else {
        console.log('Must use physical device for push notifications');
      }
    };

    setup();

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification?.request?.content?.data || {};
      if (navigationRef.isReady()) {
        navigationRef.navigate('Notification', { notification: response.notification });
      }
    });

    return () => {
      if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
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
