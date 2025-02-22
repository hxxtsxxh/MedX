import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTheme, Text, Card, Button, Searchbar, FAB, Portal, Modal } from 'react-native-paper';
import { MotiView } from 'moti';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../../firebaseConfig';

export default function Home() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [historyVisible, setHistoryVisible] = useState(false);

  const recentMedications = [
    { name: 'Aspirin', dosage: '81mg', time: '8:00 AM' },
    { name: 'Lisinopril', dosage: '10mg', time: '9:00 AM' },
    { name: 'Metformin', dosage: '500mg', time: '1:00 PM' },
  ];

  const upcomingDoses = [
    { name: 'Vitamin D', dosage: '2000 IU', time: '3:00 PM' },
    { name: 'Omega-3', dosage: '1000mg', time: '6:00 PM' },
  ];

  const medicationHistory = [
    { date: '2024-02-20', medications: ['Aspirin', 'Lisinopril'] },
    { date: '2024-02-19', medications: ['Metformin', 'Vitamin D'] },
    { date: '2024-02-18', medications: ['Aspirin', 'Omega-3'] },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
          style={styles.header}
        >
          <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
            Welcome back,{' '}
            <Text style={{ color: theme.colors.primary }}>
              {auth.currentUser?.displayName}
            </Text>
            !
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            Track your medications and stay healthy
          </Text>
        </MotiView>

        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search medications..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
        </View>

        <Card style={styles.section}>
          <Card.Title title="Today's Schedule" />
          <Card.Content>
            {recentMedications.map((med, index) => (
              <MotiView
                key={index}
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 600, delay: index * 100 }}
                style={styles.medicationItem}
              >
                <View style={styles.medicationInfo}>
                  <Text variant="titleMedium">{med.name}</Text>
                  <Text variant="bodyMedium">{med.dosage}</Text>
                </View>
                <Text variant="bodySmall">{med.time}</Text>
              </MotiView>
            ))}
          </Card.Content>
        </Card>

        <Card style={styles.section}>
          <Card.Title title="Upcoming Doses" />
          <Card.Content>
            {upcomingDoses.map((med, index) => (
              <MotiView
                key={index}
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 600, delay: index * 100 }}
                style={styles.medicationItem}
              >
                <View style={styles.medicationInfo}>
                  <Text variant="titleMedium">{med.name}</Text>
                  <Text variant="bodyMedium">{med.dosage}</Text>
                </View>
                <Text variant="bodySmall">{med.time}</Text>
              </MotiView>
            ))}
          </Card.Content>
        </Card>

        <Card style={styles.section}>
          <Card.Title title="Quick Actions" />
          <Card.Content style={styles.quickActions}>
            <Button
              mode="contained-tonal"
              icon="camera"
              onPress={() => router.push('/scan')}
              style={styles.actionButton}
            >
              Scan Medicine
            </Button>
            <Button
              mode="contained-tonal"
              icon="pill"
              onPress={() => router.push('/scan')}
              style={styles.actionButton}
            >
              Add Medication
            </Button>
            <Button
              mode="contained-tonal"
              icon="chart-timeline-variant"
              onPress={() => setHistoryVisible(true)}
              style={styles.actionButton}
            >
              View History
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <Portal>
        <Modal
          visible={historyVisible}
          onDismiss={() => setHistoryVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: theme.colors.surface }
          ]}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>Medication History</Text>
          {medicationHistory.map((entry, index) => (
            <MotiView
              key={index}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 300, delay: index * 100 }}
              style={styles.historyItem}
            >
              <Text variant="titleMedium">{entry.date}</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {entry.medications.join(', ')}
              </Text>
            </MotiView>
          ))}
          <Button
            mode="contained"
            onPress={() => setHistoryVisible(false)}
            style={styles.modalButton}
          >
            Close
          </Button>
        </Modal>
      </Portal>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('/scan')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  searchContainer: {
    padding: 20,
    paddingTop: 0,
  },
  searchBar: {
    elevation: 2,
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  medicationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  medicationInfo: {
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 20,
  },
  historyItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  modalButton: {
    marginTop: 20,
  },
});
