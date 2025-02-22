import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { DailyNotes } from '../components/DailyNotes';
import { Stack } from 'expo-router';

export default function NotesScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen 
        options={{
          headerTitle: 'Daily Notes',
          headerShown: true,
        }} 
      />
      <DailyNotes />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 