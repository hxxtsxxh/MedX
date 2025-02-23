import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Linking, Platform } from 'react-native';
import { useTheme, Text, Button, Card, IconButton, Portal, Dialog, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { db, auth } from '../../firebaseConfig';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export default function EmergencyContacts() {
  const theme = useTheme();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [visible, setVisible] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '' });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    if (!auth.currentUser) return;
    const docRef = doc(db, 'users', auth.currentUser.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().emergencyContacts) {
      setContacts(docSnap.data().emergencyContacts);
    }
  };

  const handleCall = (phoneNumber: string) => {
    const formattedNumber = Platform.OS === 'android' ? `tel:${phoneNumber}` : `telprompt:${phoneNumber}`;
    Linking.openURL(formattedNumber);
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    const updatedContacts = [...contacts, { ...newContact, id: Date.now().toString() }];
    const docRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(docRef, { emergencyContacts: updatedContacts });
    setContacts(updatedContacts);
    setVisible(false);
    setNewContact({ name: '', phone: '', relation: '' });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="headlineMedium">Emergency Contacts</Text>
      </View>

      <Card style={styles.emergencyCard}>
        <Card.Content>
          <View style={styles.emergency911}>
            <Ionicons name="warning" size={24} color={theme.colors.error} />
            <Button 
              mode="contained" 
              buttonColor={theme.colors.error}
              onPress={() => handleCall('911')}
              style={styles.emergencyButton}
            >
              Call 911
            </Button>
          </View>
        </Card.Content>
      </Card>

      {contacts.map((contact) => (
        <Card 
          key={contact.id} 
          style={styles.contactCard}
          mode="elevated"
          pressable={false}
        >
          <Card.Content>
            <View 
              style={styles.contactInfo}
              pointerEvents="box-none"
            >
              <View>
                <Text 
                  variant="titleMedium"
                  selectable={false}
                >
                  {contact.name}
                </Text>
                <Text 
                  variant="bodyMedium" 
                  style={{ color: theme.colors.onSurfaceVariant }}
                  selectable={false}
                >
                  {contact.relation}
                </Text>
              </View>
              <IconButton 
                icon="phone" 
                mode="contained"
                containerColor={theme.colors.primaryContainer}
                iconColor={theme.colors.primary}
                onPress={() => handleCall(contact.phone)}
              />
            </View>
          </Card.Content>
        </Card>
      ))}

      <Button 
        mode="contained"
        onPress={() => setVisible(true)}
        style={styles.addButton}
        icon="plus"
      >
        Add Emergency Contact
      </Button>

      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)}>
          <Dialog.Title>Add Emergency Contact</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Name"
              value={newContact.name}
              onChangeText={(text) => setNewContact(prev => ({ ...prev, name: text }))}
              style={styles.input}
            />
            <TextInput
              label="Phone Number"
              value={newContact.phone}
              onChangeText={(text) => setNewContact(prev => ({ ...prev, phone: text }))}
              keyboardType="phone-pad"
              style={styles.input}
            />
            <TextInput
              label="Relation"
              value={newContact.relation}
              onChangeText={(text) => setNewContact(prev => ({ ...prev, relation: text }))}
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVisible(false)}>Cancel</Button>
            <Button onPress={handleSave}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
  },
  emergencyCard: {
    margin: 16,
    marginTop: 8,
  },
  emergency911: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emergencyButton: {
    flex: 1,
  },
  contactCard: {
    margin: 16,
    marginTop: 8,
  },
  contactInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    margin: 16,
  },
  input: {
    marginBottom: 12,
  },
}); 
