import { Stack } from 'expo-router';
import React from 'react';
import { ChatProvider } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { darkTheme, lightTheme } from '../constants/theme';
import { MedicationProvider } from '../context/MedicationContext';
import { useNotificationHandler } from '../utils/notificationHandler';

export default function AppLayout() {
  const { isDark } = useTheme();

  useNotificationHandler();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MedicationProvider>
        <ChatProvider>
          <PaperProvider theme={isDark ? darkTheme : lightTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="notes" options={{ headerShown: false }} />
            </Stack>
          </PaperProvider>
        </ChatProvider>
      </MedicationProvider>
    </GestureHandlerRootView>
  );
} 
