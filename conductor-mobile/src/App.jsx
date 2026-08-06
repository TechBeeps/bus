import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ShiftSelectScreen from './screens/ShiftSelectScreen';
import LiveVerificationScreen from './screens/LiveVerificationScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="ShiftSelect" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ShiftSelect" component={ShiftSelectScreen} />
        <Stack.Screen name="LiveVerification" component={LiveVerificationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
