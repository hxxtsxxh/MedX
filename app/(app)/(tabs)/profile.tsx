import React from 'react';
import { ScrollView, StyleSheet, View, Platform, Pressable } from 'react-native';
import { useTheme, Text, Avatar, Switch, List, Button, Divider, Portal, Modal } from 'react-native-paper';
import { MotiView } from 'moti';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import { 
  MediaTypeOptions, 
  launchImageLibraryAsync, 
  requestMediaLibraryPermissionsAsync,
  MediaType 
} from 'expo-image-picker';
import { router } from 'expo-router';
import { getAuth, signOut, updateProfile, updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential, sendEmailVerification } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';
import { TextInput } from 'react-native-paper';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useMedications } from '../../context/MedicationContext';
import { formatDosage, displayTime } from '../../utils/formatters';

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
  editIconContainer: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  editIcon: {
    fontSize: 16,
  },
  bottomSheetContent: {
    padding: 16,
  },
  bottomSheetTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  updateButton: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalAvatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
});

// Add this type at the top of the file
type MedicationSchedule = {
  days: string[];
  times: string[];
  frequency: 'daily' | 'weekly' | 'monthly';
  dosage: string;
};

type Medication = {
  id: string;
  brand_name: string;
  schedule?: MedicationSchedule;
};

export default function Profile() {
  const theme = useTheme();
  const { isDark, setTheme } = useAppTheme();
  const { medications } = useMedications();
  const [notifications, setNotifications] = React.useState(true);
  const [dataSharing, setDataSharing] = React.useState(false);
  const [profileImage, setProfileImage] = React.useState<string | null>(
    auth.currentUser?.photoURL || null
  );
  const [bottomSheetVisible, setBottomSheetVisible] = React.useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');

  // Initialize profile image from auth on mount
  React.useEffect(() => {
    if (auth.currentUser?.photoURL) {
      setProfileImage(auth.currentUser.photoURL);
    }
  }, []);

  const pickImage = async () => {
    const { status } = await requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to update your profile picture.');
      return;
    }

    try {
      const result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, {
            photoURL: imageUri
          });
        }
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      alert('Failed to update profile picture');
    }
  };

  const handleUpdatePassword = async () => {
    try {
      if (!currentPassword || !newPassword || !auth.currentUser?.email) {
        alert('Please enter your current password and new password');
        return;
      }

      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      
      alert('Password updated successfully');
      setNewPassword('');
      setCurrentPassword('');
      setBottomSheetVisible(false);
    } catch (error: any) {
      console.error('Error updating password:', error);
      alert(error.message || 'Failed to update password');
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleExportData = async () => {
    try {
      // Create a formatted string of medication data
      const medicationData = medications.map(med => {
        const schedule = med.schedule;
        return `
Medication: ${med.brand_name}
Dosage: ${schedule?.dosage || 'Not specified'}
Schedule: ${schedule?.times.map(displayTime).join(', ') || 'Not specified'}
Frequency: ${schedule?.frequency || 'Not specified'}${schedule?.frequency === 'daily' ? '' : 
  schedule?.frequency === 'weekly' ? 
    `\nDays: ${schedule?.days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}` :
    `\nDays of Month: ${schedule?.days.join(', ')}`}
-------------------`;
      }).join('\n');

      const header = `MEDICATION SCHEDULE
Generated on: ${new Date().toLocaleDateString()}
Patient: ${auth.currentUser?.displayName || 'Not specified'}
===================\n`;

      const fileContent = header + medicationData;

      // Create the file
      const fileUri = `${FileSystem.documentDirectory}medications.txt`;
      await FileSystem.writeAsStringAsync(fileUri, fileContent);

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Export Medications Data',
          UTI: 'public.plain-text'
        });
      } else {
        alert('Sharing is not available on your platform');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ duration: 600 }}
        style={styles.header}
      >
        <Pressable onPress={pickImage}>
          <Avatar.Image
            size={120}
            source={
              profileImage
                ? { uri: profileImage }
                : require('../../../assets/images/default-avatar.webp')
            }
          />
          <View style={styles.editIconContainer}>
            <Text style={styles.editIcon}>📷</Text>
          </View>
        </Pressable>
        <Text variant="headlineMedium" style={styles.name}>
          {auth.currentUser?.displayName || 'Guest User'}
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {auth.currentUser?.email || 'No email available'}
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
          onPress={() => setBottomSheetVisible(true)}
        />

        <List.Item
          title="Privacy Settings"
          left={props => <List.Icon {...props} icon="shield" />}
          onPress={() => {}}
        />

        <List.Item
          title="Export Data"
          left={props => <List.Icon {...props} icon="download" />}
          onPress={handleExportData}
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

      <Portal>
        <Modal
          visible={bottomSheetVisible}
          onDismiss={() => setBottomSheetVisible(false)}
          contentContainerStyle={[
            styles.bottomSheetContent,
            { 
              backgroundColor: theme.colors.surface,
              borderRadius: 28,
              margin: 16
            }
          ]}
        >
          <Text variant="titleLarge" style={styles.bottomSheetTitle}>
            Personal Information
          </Text>

          <View style={styles.modalAvatarContainer}>
            <Avatar.Image
              size={80}
              source={
                profileImage
                  ? { uri: profileImage }
                  : require('../../../assets/images/default-avatar.webp')
              }
            />
          </View>

          <View style={styles.infoRow}>
            <Text variant="labelLarge">Name</Text>
            <Text variant="bodyLarge">{auth.currentUser?.displayName || 'Guest User'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="labelLarge">Email</Text>
            <Text variant="bodyLarge">{auth.currentUser?.email || 'No email available'}</Text>
          </View>

          <Button
            mode="outlined"
            onPress={() => {
              setBottomSheetVisible(false);
              setTimeout(() => setPasswordModalVisible(true), 100);
            }}
            style={styles.updateButton}
          >
            Change Password
          </Button>
        </Modal>

        <Modal
          visible={passwordModalVisible}
          onDismiss={() => setPasswordModalVisible(false)}
          contentContainerStyle={[
            styles.bottomSheetContent,
            { 
              backgroundColor: theme.colors.surface,
              borderRadius: 28,
              margin: 16
            }
          ]}
        >
          <Text variant="titleLarge" style={styles.bottomSheetTitle}>
            Update Password
          </Text>
          
          <TextInput
            mode="outlined"
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            style={[styles.input, { borderRadius: 12 }]}
          />

          <TextInput
            mode="outlined"
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            style={[styles.input, { borderRadius: 12 }]}
          />

          <Button
            mode="contained"
            onPress={handleUpdatePassword}
            style={styles.updateButton}
            disabled={!newPassword || !currentPassword}
          >
            Update Password
          </Button>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

