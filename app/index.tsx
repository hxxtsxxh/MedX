import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import DashboardScreen from "../screens/DashboardScreen";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import StartScreen from "../screens/StartScreen";

const Stack = createStackNavigator();

export default function Index() {
  return (
      <Stack.Navigator initialRouteName="Start" 
      screenOptions={{
        headerShown: false  // This removes all headers from the stack navigator
      }}>
        <Stack.Screen name="Start" component={StartScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      </Stack.Navigator>
  );
}
