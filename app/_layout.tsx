import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { lightTheme, darkTheme } from './constants/theme';
import React from 'react';

declare global {
  var user: {
    name: string;
    email: string;
    avatar: string;
  } | null;
}

function RootLayoutNav() {
  const { isDark } = useTheme();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!global.user) {
      router.replace('/login');
    }
    window.frameworkReady?.();
  }, []);

  return (
    <PaperProvider theme={isDark ? darkTheme : lightTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}>
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(app)" options={{ animation: 'slide_from_right' }} />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </GestureHandlerRootView>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}