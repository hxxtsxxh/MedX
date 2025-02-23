import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from 'react-native-paper';
import { auth } from '../../../firebaseConfig';
import { User } from 'firebase/auth';
import { usePathname, router } from 'expo-router';

export default function TabLayout() {
  const theme = useTheme();
  const pathname = usePathname();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerTitle: '',
        headerLeft: () => (
          route.name !== 'scan' && route.name !== 'profile' ? (
            <Pressable onPress={() => router.push('/profile')}>
              <Avatar.Image
                size={45}
                style={{ 
                  marginLeft: 20,
                  marginBottom: 8
                }}
                source={
                  (auth.currentUser as User)?.photoURL
                    ? { uri: (auth.currentUser as User).photoURL }
                    : require('../../../assets/images/default-avatar.webp')
                }
              />
            </Pressable>
          ) : null
        ),
        headerStyle: {
          backgroundColor: theme.dark 
            ? 'rgba(32, 37, 45,0.9)'  // Completely transparent in dark mode
            : 'rgba(255, 255, 255, 0.6)',  // Light semi-transparent
          height: route.name === 'scan' ? 0 : route.name === 'profile' ? 110 : 120,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.outline,
        },
        tabBarActiveTintColor: theme.colors.primary,
        headerTintColor: theme.colors.onSurface,
        headerTransparent: true,
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="scan" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="interactions"
        options={{
          title: 'Interactions',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="git-network" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,  // Hide header for profile screen
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}