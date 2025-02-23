import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Platform, Pressable, Linking } from 'react-native';
import { useTheme, Text, Avatar, Switch, List, Button, Divider, Portal, Modal, ActivityIndicator, IconButton, Dialog, SegmentedButtons, TextInput, Chip } from 'react-native-paper';
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
import { TextInput as RNPPTextInput } from 'react-native-paper';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useMedications } from '../../context/MedicationContext';
import { formatDosage, displayTime } from '../../utils/formatters';
import * as Print from 'expo-print';
import axios from 'axios';
import { DailyNotes } from '../../components/DailyNotes';
import { useNotes } from '../../context/NotesContext';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

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
    marginBottom: 12,
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
  medicalInput: {
    backgroundColor: '#F3F4F6',
    marginBottom: 0,
    height: 45,
  },
  medicalLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: '#374151',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    marginTop: 18,
    marginBottom: 12,
    fontWeight: '600',
  },
  inputGroup: {
    gap: 20,
  },
  unitButtons: {
    width: 140,
    backgroundColor: '#F3F4F6',
  },
  unitButtonsContainer: {
    marginLeft: 12,
  },
  unitText: {
    color: '#6B7280',
    fontSize: 14,
    marginLeft: 6,
    alignSelf: 'center',
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

// Add this interface
interface EmergencyContact {
  id: string;
  name: string;
  type: 'contact' | 'doctor' | 'emergency';  // Make this a literal union type
  phone: string;
  relation?: string;
}

// Add this interface near the top with other interfaces
interface MedicalInformation {
  age: string;
  weight: string;
  heightFt: string;  // Change height to separate ft and inches
  heightIn: string;
  bloodType: string;
  allergies: string[];
  medicalConditions: string[];
  weightUnit: 'lbs';
}

// Add this validation function at the top level
const isValidPhoneNumber = (phone: string): boolean => {
  // Basic US phone number validation (accepts formats like: 1234567890, 123-456-7890, (123) 456-7890)
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  return phoneRegex.test(phone);
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
  const { notes, addNote, deleteNote, loading: loadingNotes } = useNotes();
  const [notesVisible, setNotesVisible] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [newContact, setNewContact] = useState<EmergencyContact>({
    id: '',
    name: '',
    type: 'contact',
    phone: '',
    relation: ''
  });
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [medicalModalVisible, setMedicalModalVisible] = useState(false);
  const [medicalInfo, setMedicalInfo] = useState<MedicalInformation>({
    age: '',
    weight: '',
    heightFt: '',
    heightIn: '',
    bloodType: '',
    allergies: [],
    medicalConditions: [],
    weightUnit: 'lbs'
  });
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');

  // Initialize profile image from auth on mount
  React.useEffect(() => {
    if (auth.currentUser?.photoURL) {
      setProfileImage(auth.currentUser.photoURL);
    }
  }, []);

  React.useEffect(() => {
    // Hide the header for this screen
    router.setParams({
      headerShown: 'false'
    });
  }, []);

  // Load emergency contacts on mount
  useEffect(() => {
    loadEmergencyContacts();
  }, []);

  const loadEmergencyContacts = async () => {
    if (!auth.currentUser) return;
    const docRef = doc(db, 'users', auth.currentUser.uid);
    const docSnap = await getDoc(docRef);
    
    // Create default emergency contact
    const emergency911 = {
      id: 'emergency-911',
      name: 'Emergency Services',
      type: 'emergency' as const, // Explicitly type as 'emergency'
      phone: '911'
    };
    
    if (!docSnap.exists()) {
      // Create new document with default emergency contact
      await setDoc(docRef, { 
        emergencyContacts: [emergency911]
      });
      setEmergencyContacts([emergency911]);
    } else {
      let contacts = docSnap.data().emergencyContacts || [];
      
      // Add 911 if no contacts exist
      if (contacts.length === 0) {
        contacts = [emergency911];
        await updateDoc(docRef, { emergencyContacts: contacts });
      }
      
      setEmergencyContacts(contacts);
    }
  };

  // Helper function to format contact type
  const formatContactType = (type: string): string => {
    switch (type) {
      case 'emergency':
        return 'Emergency';
      case 'doctor':
        return 'Doctor';
      case 'contact':
        return 'Contact';
      default:
        return type;
    }
  };

  // Helper function to get contact title
  const getContactTitle = (contact: EmergencyContact): string => {
    if (contact.type === 'emergency') {
      return 'Emergency Services (911)';
    }
    return contact.name || '';
  };

  const handleCall = (contact: EmergencyContact) => {
    // Format phone number by removing any non-numeric characters
    const phoneNumber = contact.phone.replace(/\D/g, '');
    
    let phoneUrl = Platform.OS === 'ios' 
      ? `telprompt:${phoneNumber}`
      : `tel:${phoneNumber}`;
    
    // For emergency calls (911), use a direct tel: link
    if (contact.type === 'emergency') {
      phoneUrl = 'tel:911';
    }
    
    Linking.canOpenURL(phoneUrl)
      .then(supported => {
        if (!supported) {
          console.error('Phone number is not available');
          return;
        }
        return Linking.openURL(phoneUrl);
      })
      .catch(err => {
        console.error('Error making call:', err);
        // Fallback for emergency calls
        if (contact.type === 'emergency') {
          // Try direct emergency number
          Linking.openURL('tel:911');
        }
      });
  };

  const handleDeleteContact = async (contactId: string, contactType: string) => {
    // Don't allow deletion of the main emergency contact (911)
    if (contactType === 'emergency' && contactId === 'emergency-911') {
      alert('The emergency services contact cannot be removed');
      return;
    }

    if (!auth.currentUser) return;

    try {
      const updatedContacts = emergencyContacts.filter(contact => contact.id !== contactId);
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, { emergencyContacts: updatedContacts });
      setEmergencyContacts(updatedContacts);
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const handleEditContact = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setNewContact(contact); // Populate the form with existing contact data
    setContactModalVisible(true);
  };

  const handleAddContact = async () => {
    if (!auth.currentUser) return;
    
    // Check for duplicate emergency contact
    if (newContact.type === 'emergency' && 
        emergencyContacts.some(contact => contact.type === 'emergency' && contact.id !== editingContact?.id)) {
      alert('Emergency Services (911) is already in your contacts');
      return;
    }

    // Validate phone number for non-emergency contacts
    if (newContact.type !== 'emergency' && !isValidPhoneNumber(newContact.phone)) {
      alert('Please enter a valid phone number');
      return;
    }

    try {
      let updatedContacts: EmergencyContact[];
      if (editingContact) {
        // Update existing contact
        updatedContacts = emergencyContacts.map(contact => 
          contact.id === editingContact.id ? { ...newContact, id: contact.id } : contact
        );
      } else {
        // Add new contact
        const contact: EmergencyContact = {
          ...newContact,
          id: Date.now().toString(),
          name: newContact.type === 'emergency' ? 'Emergency Services' : newContact.name,
          phone: newContact.type === 'emergency' ? '911' : newContact.phone,
          type: newContact.type
        };
        updatedContacts = [...emergencyContacts, contact];
      }
      
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await setDoc(docRef, { emergencyContacts: updatedContacts });
      } else {
        await updateDoc(docRef, { emergencyContacts: updatedContacts });
      }

      setEmergencyContacts(updatedContacts);
      setContactModalVisible(false);
      setEditingContact(null);
      setNewContact({
        id: '',
        name: '',
        type: 'contact',
        phone: '',
        relation: ''
      });
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Failed to save contact. Please try again.');
    }
  };

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

  /**
   * @action Change Password
   * @description Update user account password
   * @steps
   * 1. Click "Personal Information"
   * 2. Click "Change Password"
   * 3. Enter current password
   * 4. Enter new password
   * 5. Click "Update Password"
   */
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

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      await addNote(newNote.trim());
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  // Update the render function to use the new title helper
  const renderEmergencyContacts = () => (
    <>
      <List.Subheader>Emergency Contacts</List.Subheader>
      
      {emergencyContacts.map((contact) => (
        <List.Item
          key={contact.id}
          title={getContactTitle(contact)}
          description={contact.type === 'emergency' 
            ? 'Emergency • 911'
            : `${contact.type === 'contact' ? contact.relation : formatContactType(contact.type)} • ${contact.phone}`}
          left={props => (
            <List.Icon
              {...props}
              icon={
                contact.type === 'doctor' ? 'doctor' :
                contact.type === 'emergency' ? 'ambulance' : 'account'
              }
            />
          )}
          right={props => (
            <IconButton
              {...props}
              icon="phone"
              mode="contained"
              containerColor={theme.colors.primary}
              iconColor={theme.colors.onPrimary}
              onPress={() => handleCall(contact)}
            />
          )}
          onPress={() => {
            if (contact.type === 'emergency' && contact.id === 'emergency-911') {
              // Don't allow editing of main emergency contact
              return;
            }
            handleEditContact(contact);
          }}
        />
      ))}

      <Button
        mode="contained-tonal"
        icon="plus"
        onPress={() => setContactModalVisible(true)}
        style={{ margin: 16 }}
      >
        Add Emergency Contact
      </Button>

      <Portal>
        <Dialog visible={contactModalVisible} onDismiss={() => {
          setContactModalVisible(false);
          setEditingContact(null);
          setNewContact({
            id: '',
            name: '',
            type: 'contact',
            phone: '',
            relation: ''
          });
        }}>
          <Dialog.Title>{editingContact ? 'Edit Contact' : 'Add Emergency Contact'}</Dialog.Title>
          <Dialog.Content>
            <SegmentedButtons
              value={newContact.type}
              onValueChange={(value) => 
                setNewContact(prev => ({ ...prev, type: value as EmergencyContact['type'] }))}
              buttons={[
                { value: 'contact', label: 'Contact' },
                { value: 'doctor', label: 'Doctor' },
                { value: 'emergency', label: '911' }
              ]}
              style={{ marginBottom: 16 }}
            />
            
            {newContact.type !== 'emergency' && (
              <>
                <TextInput
                  label="Name"
                  value={newContact.name}
                  onChangeText={(text) => setNewContact(prev => ({ ...prev, name: text }))}
                  style={{ marginBottom: 16 }}
                />
                <TextInput
                  label="Phone Number"
                  value={newContact.phone}
                  onChangeText={(text) => setNewContact(prev => ({ ...prev, phone: text }))}
                  keyboardType="phone-pad"
                  style={{ marginBottom: 16 }}
                  error={newContact.phone.length > 0 && !isValidPhoneNumber(newContact.phone)}
                  helperText={
                    newContact.phone.length > 0 && !isValidPhoneNumber(newContact.phone) 
                      ? "Please enter a valid phone number (e.g., 123-456-7890)"
                      : ""
                  }
                />
                {newContact.type === 'contact' && (
                  <TextInput
                    label="Relation"
                    value={newContact.relation}
                    onChangeText={(text) => setNewContact(prev => ({ ...prev, relation: text }))}
                    style={{ marginBottom: 16 }}
                  />
                )}
              </>
            )}
            {newContact.type === 'emergency' && (
              <Text style={{ marginBottom: 16, color: theme.colors.onSurfaceVariant }}>
                Call this number immediately if you are experiencing a medical emergency. Emergency services (911) will connect you with local first responders, ambulance, and emergency medical care.
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            {editingContact && (
              <Button 
                textColor={theme.colors.error}
                onPress={() => {
                  handleDeleteContact(editingContact.id, editingContact.type);
                  setContactModalVisible(false);
                  setEditingContact(null);
                }}
              >
                Delete
              </Button>
            )}
            <Button onPress={() => {
              setContactModalVisible(false);
              setEditingContact(null);
              setNewContact({
                id: '',
                name: '',
                type: 'contact',
                phone: '',
                relation: ''
              });
            }}>
              Cancel
            </Button>
            <Button 
              onPress={handleAddContact}
              disabled={
                newContact.type === 'emergency' ? false :
                !newContact.name || !newContact.phone
              }
            >
              {editingContact ? 'Save Changes' : 'Save'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );

  // Add this useEffect to load medical information
  useEffect(() => {
    loadMedicalInformation();
  }, []);

  // Add these functions to handle medical information
  const loadMedicalInformation = async () => {
    if (!auth.currentUser) return;
    
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data().medicalInfo || {};
        setMedicalInfo({
          age: data.age || '',
          weight: data.weight || '',
          heightFt: data.heightFt || '',
          heightIn: data.heightIn || '',
          bloodType: data.bloodType || '',
          allergies: data.allergies || [],
          medicalConditions: data.medicalConditions || [],
          weightUnit: 'lbs'
        });
      }
    } catch (error) {
      console.error('Error loading medical information:', error);
    }
  };

  const saveMedicalInformation = async () => {
    if (!auth.currentUser) return;
    
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, {
        medicalInfo: medicalInfo
      });
      setMedicalModalVisible(false);
    } catch (error) {
      console.error('Error saving medical information:', error);
      alert('Failed to save medical information');
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

        <Divider />

        <List.Subheader>Health Data</List.Subheader>
        
        <List.Item
          title="Daily Journal"
          description="Track your daily thoughts and observations"
          left={props => <List.Icon {...props} icon="notebook" />}
          onPress={() => router.push('/(app)/notes')}
        />

        {renderEmergencyContacts()}

        <Divider />

        <List.Subheader>Account</List.Subheader>

        <List.Item
          title="Medical Information"
          description="Update your health details"
          left={props => <List.Icon {...props} icon="medical-bag" />}
          onPress={() => setMedicalModalVisible(true)}
        />

        <List.Item
          title="Privacy Settings"
          description="Password and privacy policy"
          left={props => <List.Icon {...props} icon="shield" />}
          onPress={() => router.push('/(app)/privacy-settings')}
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

        <Modal
          visible={medicalModalVisible}
          onDismiss={() => setMedicalModalVisible(false)}
          contentContainerStyle={[
            styles.bottomSheetContent,
            { 
              backgroundColor: theme.colors.surface,
              borderRadius: 25,
              margin: 20,
              marginTop: 75,
              marginBottom: 75,
              maxHeight: '100%',
              paddingHorizontal: 20,
              paddingTop: 25,
              paddingBottom: 15,
            }
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>
              Medical Information
            </Text>

            <Text style={[styles.medicalLabel, { color: theme.colors.onSurface }]}>
              Basic Information
            </Text>

            <View style={styles.inputGroup}>
              <View>
                <Text style={[styles.medicalLabel, { color: theme.colors.onSurface }]}>
                  Age
                </Text>
                <TextInput
                  mode="outlined"
                  value={medicalInfo.age}
                  onChangeText={(text) => setMedicalInfo(prev => ({ ...prev, age: text }))}
                  keyboardType="numeric"
                  style={styles.medicalInput}
                  outlineStyle={{ borderRadius: 8 }}
                  textColor="#000000"
                  dense
                />
              </View>

              <View>
                <Text style={[styles.medicalLabel, { color: theme.colors.onSurface }]}>
                  Weight
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    mode="outlined"
                    value={medicalInfo.weight}
                    onChangeText={(text) => setMedicalInfo(prev => ({ ...prev, weight: text }))}
                    keyboardType="numeric"
                    style={[styles.medicalInput, { flex: 1 }]}
                    outlineStyle={{ borderRadius: 8 }}
                    placeholder="Enter weight"
                    dense
                    textColor="#000000"
                  />
                  <Text style={styles.unitText}>lbs</Text>
                </View>
              </View>

              <View>
                <Text style={[styles.medicalLabel, { color: theme.colors.onSurface }]}>
                  Height
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                      mode="outlined"
                      value={medicalInfo.heightFt}
                      onChangeText={(text) => {
                        // Ensure only numbers and limit to reasonable height
                        const cleanText = text.replace(/[^0-9]/g, '');
                        const numValue = parseInt(cleanText);
                        if (numValue <= 9) {
                          setMedicalInfo(prev => ({ ...prev, heightFt: cleanText }));
                        }
                      }}
                      keyboardType="numeric"
                      style={[styles.medicalInput, { flex: 1, marginBottom: 0 }]}
                      outlineStyle={{ borderRadius: 8 }}
                      placeholder="0"
                      maxLength={1}
                      dense
                      textColor="#000000"
                    />
                    <Text style={styles.unitText}>ft</Text>
                  </View>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                      mode="outlined"
                      value={medicalInfo.heightIn}
                      onChangeText={(text) => {
                        // Ensure only numbers and limit to 11 inches
                        const cleanText = text.replace(/[^0-9]/g, '');
                        const numValue = parseInt(cleanText);
                        if (numValue <= 11) {
                          setMedicalInfo(prev => ({ ...prev, heightIn: cleanText }));
                        }
                      }}
                      keyboardType="numeric"
                      style={[styles.medicalInput, { flex: 1, marginBottom: 0 }]}
                      outlineStyle={{ borderRadius: 8 }}
                      placeholder="0"
                      maxLength={2}
                      dense
                      textColor="#000000"
                    />
                    <Text style={styles.unitText}>in</Text>
                  </View>
                </View>
              </View>

              <View style={{ marginBottom: 15 }}>
                <Text style={[styles.medicalLabel, { color: theme.colors.onSurface }]}>
                  Blood Type
                </Text>
                <TextInput
                  mode="outlined"
                  value={medicalInfo.bloodType}
                  onChangeText={(text) => setMedicalInfo(prev => ({ ...prev, bloodType: text }))}
                  style={styles.medicalInput}
                  outlineStyle={{ borderRadius: 8 }}
                  textColor="#000000"
                  dense
                />
              </View>
            </View>

            <Text style={[styles.medicalLabel, { color: theme.colors.onSurface }]}>
              Allergies
            </Text>
            <View style={{ marginBottom: 0 }}>
              <TextInput
                mode="outlined"
                placeholder="Add Allergy"
                value={newAllergy}
                onChangeText={setNewAllergy}
                style={[styles.medicalInput, { marginBottom: 8 }]}
                outlineStyle={{ borderRadius: 8 }}
                textColor="#000000"
                right={
                  <TextInput.Icon
                    icon="plus"
                    onPress={() => {
                      if (newAllergy.trim()) {
                        setMedicalInfo(prev => ({
                          ...prev,
                          allergies: [...prev.allergies, newAllergy.trim()]
                        }));
                        setNewAllergy('');
                      }
                    }}
                  />
                }
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {medicalInfo?.allergies?.map((allergy, index) => (
                  <Chip
                    key={index}
                    onClose={() => {
                      setMedicalInfo(prev => ({
                        ...prev,
                        allergies: prev.allergies.filter((_, i) => i !== index)
                      }));
                    }}
                    style={{ margin: 2 }}
                  >
                    {allergy}
                  </Chip>
                ))}
              </View>
            </View>

            <Text style={[styles.medicalLabel, { color: theme.colors.onSurface }]}>
              Medical Conditions
            </Text>
            <View style={{ marginBottom: 0 }}>
              <TextInput
                mode="outlined"
                placeholder="Add Medical Condition"
                value={newCondition}
                onChangeText={setNewCondition}
                style={[styles.medicalInput, { marginBottom: 8 }]}
                outlineStyle={{ borderRadius: 8 }}
                textColor="#000000"
                right={
                  <TextInput.Icon
                    icon="plus"
                    onPress={() => {
                      if (newCondition.trim()) {
                        setMedicalInfo(prev => ({
                          ...prev,
                          medicalConditions: [...prev.medicalConditions, newCondition.trim()]
                        }));
                        setNewCondition('');
                      }
                    }}
                  />
                }
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {medicalInfo?.medicalConditions?.map((condition, index) => (
                  <Chip
                    key={index}
                    onClose={() => {
                      setMedicalInfo(prev => ({
                        ...prev,
                        medicalConditions: prev.medicalConditions.filter((_, i) => i !== index)
                      }));
                    }}
                    style={{ margin: 2 }}
                  >
                    {condition}
                  </Chip>
                ))}
              </View>
            </View>

            <Button
              mode="contained"
              onPress={saveMedicalInformation}
              style={{ marginTop: 24, marginBottom: 8 }}
            >
              Save Medical Information
            </Button>
          </ScrollView>
        </Modal>
      </Portal>
    </ScrollView>
  );
}
