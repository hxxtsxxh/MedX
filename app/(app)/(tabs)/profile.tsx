import React from 'react';
import { ScrollView, StyleSheet, View, Platform } from 'react-native';
import { useTheme, Text, Avatar, Switch, List, Button, Divider } from 'react-native-paper';
import { MotiView } from 'moti';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import { auth } from '../../../firebaseConfig';
import { router } from 'expo-router';

export default function Profile() {
  const theme = useTheme();
  const { isDark, setTheme } = useAppTheme();
  const [notifications, setNotifications] = React.useState(true);
  const [dataSharing, setDataSharing] = React.useState(false);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 600 }}
        style={styles.header}
      >
        <Avatar.Image
          size={80}
          source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop' }}
        />
        <Text variant="headlineMedium" style={styles.name}>John Doe</Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          john.doe@example.com
        </Text>
      </MotiView>

      <List.Section>
        <List.Subheader>Preferences</List.Subheader>
        
        <List.Item
          title="Dark Mode"
          left={props => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => (
            <Switch
              value={isDark}
              onValueChange={() => setTheme(isDark ? 'light' : 'dark')}
            />
          )}
        />
        
        <List.Item
          title="Notifications"
          left={props => <List.Icon {...props} icon="bell" />}
          right={() => (
            <Switch
              value={notifications}
              onValueChange={setNotifications}
            />
          )}
        />

        <Divider />

        <List.Subheader>Health Data</List.Subheader>
        
        <List.Item
          title="Connected Services"
          description="Manage your connected health services"
          left={props => <List.Icon {...props} icon="link" />}
          onPress={() => {}}
        />

        <List.Item
          title="Data Sharing"
          description="Share anonymized data for research"
          left={props => <List.Icon {...props} icon="database" />}
          right={() => (
            <Switch
              value={dataSharing}
              onValueChange={setDataSharing}
            />
          )}
        />

        <Divider />

        <List.Subheader>Account</List.Subheader>

        <List.Item
          title="Personal Information"
          left={props => <List.Icon {...props} icon="account" />}
          onPress={() => {}}
        />

        <List.Item
          title="Privacy Settings"
          left={props => <List.Icon {...props} icon="shield" />}
          onPress={() => {}}
        />

        <List.Item
          title="Export Data"
          left={props => <List.Icon {...props} icon="download" />}
          onPress={() => {}}
        />
      </List.Section>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained-tonal"
          icon="logout"
          onPress={handleSignOut}
          style={styles.button}
        >
          Sign Out
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  name: {
    marginTop: 16,
    marginBottom: 4,
  },
  buttonContainer: {
    padding: 20,
  },
  button: {
    marginTop: 10,
  },
});
