import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Button, TextInput, Divider, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { auth } from '../../firebaseConfig';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 60,
  },
  section: {
    marginBottom: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
  },
  policyText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  }
});

export default function PrivacySettings() {
  const theme = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    // Show the header for this screen
    router.setParams({
      headerShown: true,
      title: 'Privacy Settings'
    });
  }, []);

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user?.email) throw new Error('No user email found');

      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      alert('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      alert(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          Change Password
        </Text>
        <TextInput
          mode="outlined"
          placeholder="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          style={styles.input}
          outlineStyle={{ borderRadius: 12 }}
          dense
        />
        <TextInput
          mode="outlined"
          placeholder="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          style={styles.input}
          outlineStyle={{ borderRadius: 12 }}
          dense
        />
        <TextInput
          mode="outlined"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={styles.input}
          outlineStyle={{ borderRadius: 12 }}
          dense
        />
        <Button 
          mode="contained"
          onPress={handleUpdatePassword}
          loading={loading}
          disabled={loading || !currentPassword || !newPassword || !confirmPassword}
        >
          Update Password
        </Button>
      </View>

      <Divider style={{ marginVertical: 16 }} />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          Privacy Policy
        </Text>
        <Text style={[styles.policyText, { color: theme.colors.onSurfaceVariant }]}>
          We take your privacy seriously. This app collects and stores your medical information
          securely to provide you with medication management services. Your data is encrypted
          and stored in compliance with healthcare privacy standards.
        </Text>
        <Text style={[styles.policyText, { color: theme.colors.onSurfaceVariant }]}>
          We do not share your personal information with third parties without your explicit
          consent, except where required by law. Your medical data is used solely for the
          purpose of providing you with accurate medication tracking and health management
          features.
        </Text>
        <Text style={[styles.policyText, { color: theme.colors.onSurfaceVariant }]}>
          You can request the deletion of your account and associated data at any time
          through the app settings. For more information about our privacy practices,
          please contact our support team.
        </Text>
      </View>
    </ScrollView>
  );
} 
