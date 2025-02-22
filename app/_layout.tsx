import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { lightTheme, darkTheme } from './constants/theme';
import { MedicationProvider } from './context/MedicationContext';
import React from 'react';
import { ChatProvider } from './context/ChatContext';
import { NotesProvider } from './context/NotesContext';

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
    // Remove the window.frameworkReady call since it's not a valid property
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MedicationProvider>
        <NotesProvider>
          <ChatProvider>
            <PaperProvider theme={isDark ? darkTheme : lightTheme}>
              <Stack screenOptions={{
                headerShown: false,
                animation: 'fade',
              }}>
                <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
                <Stack.Screen name="(app)" options={{ animation: 'slide_from_right' }} />
              </Stack>
              <StatusBar style={isDark ? 'light' : 'dark'} />
            </PaperProvider>
          </ChatProvider>
        </NotesProvider>
      </MedicationProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}
