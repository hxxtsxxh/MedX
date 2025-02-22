import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Platform, Pressable } from 'react-native';
import { useTheme, Text, Avatar, Switch, List, Button, Divider, Portal, Modal, ActivityIndicator } from 'react-native-paper';
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
import * as Print from 'expo-print';
import axios from 'axios';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 110,
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

type GeminiResponse = {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
};

export default function Profile() {
  const theme = useTheme();
  const { isDark, setTheme } = useAppTheme();
  const { medications, getTakenMedications } = useMedications();
  const [notifications, setNotifications] = React.useState(true);
  const [dataSharing, setDataSharing] = React.useState(false);
  const [profileImage, setProfileImage] = React.useState<string | null>(
    auth.currentUser?.photoURL || null
  );
  const [bottomSheetVisible, setBottomSheetVisible] = React.useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

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

  const generateMedicationReport = async (medications: Medication[]): Promise<string> => {
    const GEMINI_API_KEY = 'AIzaSyBv4-T7H8BIPqyoWx7BXisXy7mCVeSnGiA';
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

    try {
      const medicationInfo = medications.map(med => ({
        name: med.brand_name,
        genericName: med.generic_name,
        dosage: med.schedule?.dosage,
        timing: med.schedule?.times.map(displayTime).join(', '),
        frequency: med.schedule?.frequency,
        days: med.schedule?.frequency === 'daily' ? 'Daily' :
              med.schedule?.frequency === 'weekly' ? 
                med.schedule.days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ') :
                `Monthly on days: ${med.schedule?.days.join(', ')}`,
        adherence: getTakenMedications().includes(med.id) ? 'Taken today' : 'Not taken today'
      }));

      const prompt = `Create a concise medication report with these sections:

1. MEDICATION REGIMEN OVERVIEW
A brief, one-paragraph summary of the overall medication schedule.

2. DETAILED MEDICATION INFORMATION
For each medication, list:
• Brand name in CAPS (generic name)
• Dosage: [amount]
• Schedule: [time and frequency]
• Status: [adherence]

3. ADHERENCE SUMMARY
A brief statement about medication adherence.

4. RECOMMENDATIONS
3-4 bullet points for optimal medication management.

Keep sections clearly separated with single line breaks. Use minimal formatting.

Data:
${JSON.stringify(medicationInfo, null, 2)}`;

      const response = await axios.post<GeminiResponse>(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        }
      );

      const content = response.data.candidates[0].content.parts[0].text
        .replace(/```/g, '')
        .replace(/\n\n+/g, '\n\n')
        .trim();

      return content;
    } catch (error) {
      console.error('Error generating report with Gemini:', error);
      throw new Error('Failed to generate medication report');
    }
  };

  const handleExportData = async () => {
    try {
      setIsGeneratingReport(true);
      const reportContent = await generateMedicationReport(medications);

      const date = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.4;
        color: #333;
        padding: 20px;
        margin: 0;
      }
      .header {
        text-align: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #0D47A1;
        padding-bottom: 15px;
      }
      .title {
        color: #0D47A1;
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 8px;
      }
      .subtitle {
        color: #666;
        font-size: 14px;
        margin: 2px 0;
      }
      .section {
        margin: 15px 0;
      }
      .section-title {
        color: #1976D2;
        font-size: 16px;
        font-weight: bold;
        margin: 15px 0 8px 0;
        border-bottom: 1px solid #1976D2;
        padding-bottom: 3px;
      }
      .content {
        margin: 8px 0;
        font-size: 14px;
      }
      ul {
        margin: 5px 0;
        padding-left: 20px;
      }
      li {
        margin: 3px 0;
      }
      p {
        margin: 8px 0;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="title">MEDICATION MANAGEMENT REPORT</div>
      <div class="subtitle">Generated: ${date}</div>
      <div class="subtitle">Patient: ${auth.currentUser?.displayName || 'Not specified'}</div>
    </div>
    ${reportContent
      .split('\n\n')
      .map(section => {
        if (section.includes(':')) {
          const [title, ...content] = section.split('\n');
          return `
            <div class="section">
              <div class="section-title">${title.trim()}</div>
              <div class="content">
                ${content.join('<br>')}
              </div>
            </div>`;
        }
        return `<div class="content">${section}</div>`;
      })
      .join('')}
  </body>
</html>`;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export Medication Report',
          UTI: 'com.adobe.pdf'
        });
      } else {
        alert('Sharing is not available on your platform');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
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
          title="Export Report"
          left={props => <List.Icon {...props} icon="file-export" />}
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

        <Modal
          visible={isGeneratingReport}
          dismissable={false}
          contentContainerStyle={{
            backgroundColor: theme.colors.surface,
            padding: 24,
            margin: 20,
            borderRadius: 12,
            alignItems: 'center',
            gap: 16,
          }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyLarge">Generating your report...</Text>
        </Modal>
      </Portal>
    </ScrollView>
  );
}
