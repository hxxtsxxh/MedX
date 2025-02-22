import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import { useTheme, Text, Card, Button, Searchbar, FAB, Portal, Modal } from 'react-native-paper';
import { MotiView } from 'moti';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMedications } from '../../context/MedicationContext';
import { format } from 'date-fns';
import { displayTime, getNextDoseDay, formatDaysUntil } from '../../utils/formatters';
import { auth } from '../../../firebaseConfig';

export default function Home() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [historyVisible, setHistoryVisible] = useState(false);
  const { medications, loading } = useMedications();

  const groupMedicationsByTime = (medications: Medication[]) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentDate = now.getDate();
    
    return medications.reduce((groups, med) => {
      if (!med.schedule) return groups;

      const { times, days, frequency } = med.schedule;
      
      // Check if medication should be taken today
      const shouldTakeToday = 
        frequency === 'daily' || 
        (frequency === 'weekly' && days.includes(currentDay.toLowerCase())) ||
        (frequency === 'monthly' && days.includes(currentDate.toString()));

      times.forEach(time => {
        const [hours] = time.split(':').map(Number);

        if (shouldTakeToday) {
          // Today's medications go to Today's Schedule
          if (hours < 12) {
            groups.morning.push(med);
          } else if (hours < 17) {
            groups.morning.push(med); // Add to morning section if it's for today
          } else {
            groups.morning.push(med); // Add to morning section if it's for today
          }
        } else {
          // Only add to upcoming if it's not for today
          const daysUntilNext = getNextDoseDay(days, frequency);
          if (daysUntilNext > 0) {
            const existingMed = groups.upcoming.find(m => m.id === med.id);
            if (!existingMed) {
              groups.upcoming.push({
                ...med,
                daysUntil: daysUntilNext
              });
            }
          }
        }
      });
      
      return groups;
    }, { 
      morning: [] as Medication[], 
      upcoming: [] as (Medication & { daysUntil: number })[]
    });
  };

  const groupedMedications = groupMedicationsByTime(medications);

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

        <Card style={[styles.section, {
          elevation: 0,
          backgroundColor: theme.colors.surface,
          ...(Platform.OS === 'android' ? {
            borderWidth: 1,
            borderColor: 'rgba(0, 0, 0, 0.1)',
          } : {
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 1,
            },
            shadowOpacity: 0.18,
            shadowRadius: 1.0,
          }),
        }]}>
          <Card.Title 
            title="Today's Schedule" 
            titleStyle={{
              fontWeight: '500',
              includeFontPadding: false,
            }}
          />
          <Card.Content style={{ elevation: 0 }}>
            {loading ? (
              <ActivityIndicator />
            ) : groupedMedications.morning.length > 0 ? (
              groupedMedications.morning.map((med, index) => (
                <MotiView
                  key={med.id}
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: 'timing', duration: 300, delay: index * 100 }}
                  style={[styles.medicationItem, {
                    elevation: 0,
                    backgroundColor: 'transparent',
                  }]}
                >
                  <View style={[styles.medicationInfo, {
                    elevation: 0,
                    backgroundColor: 'transparent',
                  }]}>
                    <Text variant="titleMedium" style={{
                      fontWeight: '500',
                      color: theme.colors.onSurface,
                      includeFontPadding: false,
                      textAlign: 'left',
                      letterSpacing: 0,
                    }}>{med.brand_name}</Text>
                    <Text variant="bodyMedium" style={{
                      color: theme.colors.onSurfaceVariant,
                      includeFontPadding: false,
                      textAlign: 'left',
                      letterSpacing: 0,
                    }}>
                      {med.schedule?.dosage} • {med.schedule?.times.map(displayTime).join(', ')}
                    </Text>
                    {med.schedule?.frequency !== 'daily' && (
                      <Text variant="bodySmall" style={{
                        color: theme.colors.primary,
                        includeFontPadding: false,
                        textAlign: 'left',
                        letterSpacing: 0,
                      }}>
                        {med.schedule?.frequency === 'weekly' 
                          ? `Every ${med.schedule.days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}`
                          : `Monthly on day${med.schedule.days.length > 1 ? 's' : ''} ${med.schedule.days.join(', ')}`}
                      </Text>
                    )}
                  </View>
                  <Text variant="bodySmall" style={{
                    includeFontPadding: false,
                    textAlign: 'right',
                    letterSpacing: 0,
                  }}>Today</Text>
                </MotiView>
              ))
            ) : (
              <Text variant="bodyMedium" style={{
                includeFontPadding: false,
                textAlign: 'left',
                letterSpacing: 0,
              }}>No medications scheduled for today</Text>
            )}
          </Card.Content>
        </Card>

        <Card style={[styles.section, {
          elevation: 0,
          backgroundColor: theme.colors.surface,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.18,
          shadowRadius: 1.0,
          borderWidth: Platform.OS === 'android' ? 1 : 0,
          borderColor: 'rgba(0, 0, 0, 0.1)',
        }]}>
          <Card.Title title="Upcoming Doses" />
          <Card.Content>
            {loading ? (
              <ActivityIndicator />
            ) : groupedMedications.upcoming.length > 0 ? (
              groupedMedications.upcoming
                .sort((a, b) => a.daysUntil - b.daysUntil)
                .map((med, index) => (
                  <MotiView
                    key={`${med.id}-upcoming`}
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'timing', duration: 600, delay: index * 100 }}
                    style={styles.medicationItem}
                  >
                    <View style={styles.medicationInfo}>
                      <Text variant="titleMedium">{med.brand_name}</Text>
                      <Text variant="bodyMedium">
                        {med.schedule?.dosage} • {med.schedule?.times.map(displayTime).join(', ')}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                        {med.schedule?.frequency === 'weekly' 
                          ? `Every ${med.schedule.days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}`
                          : `Monthly on day${med.schedule.days.length > 1 ? 's' : ''} ${med.schedule.days.join(', ')}`}
                      </Text>
                      <Text 
                        variant="bodySmall" 
                        style={{ 
                          color: theme.colors.secondary,
                          fontWeight: '500',
                          marginTop: 2
                        }}
                      >
                        {formatDaysUntil(med.daysUntil)}
                      </Text>
                    </View>
                    <Text variant="bodySmall">Upcoming</Text>
                  </MotiView>
                ))
            ) : (
              <Text variant="bodyMedium">No upcoming doses</Text>
            )}
          </Card.Content>
        </Card>

        <Card style={[styles.section, {
          elevation: 0,
          backgroundColor: theme.colors.surface,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.18,
          shadowRadius: 1.0,
          borderWidth: Platform.OS === 'android' ? 1 : 0,
          borderColor: 'rgba(0, 0, 0, 0.1)',
        }]}>
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
        color="white"
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
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'transparent',
  },
  medicationInfo: {
    flex: 1,
    backgroundColor: 'transparent',
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
