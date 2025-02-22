import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme, Text, Button, Card, ProgressBar, ActivityIndicator, TextInput, Chip } from 'react-native-paper';
import { TimePickerModal } from 'react-native-paper-dates';
import { enGB, registerTranslation } from 'react-native-paper-dates';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { Portal, Modal } from 'react-native-paper';
import { TouchableOpacity } from 'react-native';
import { searchMedications, type Medication, MedicationSchedule } from '../api/medications';
import { useMedications } from '../../context/MedicationContext';
import { SuccessAnimation } from '../../components/SuccessAnimation';
import { formatTime, formatDosage, getDosageUnit, storeTime, displayTime } from '../../utils/formatters';
import debounce from 'lodash/debounce';

// Register the English locale
registerTranslation('en-GB', enGB);

export default function Scan() {
  const theme = useTheme();
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [manualInputVisible, setManualInputVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const { addMedication } = useMedications();
  const [scheduleStep, setScheduleStep] = useState(false);
  const [schedule, setSchedule] = useState<MedicationSchedule>({
    days: [],
    times: [],
    frequency: 'daily',
    dosage: '',
  });
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [scheduleType, setScheduleType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [monthlyDays, setMonthlyDays] = useState<number[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const monthDays = Array.from({ length: 31 }, (_, i) => i + 1);

  // Create a debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (query.length < 2) {
          setSuggestions([]);
          return;
        }
        
        setLoading(true);
        try {
          const results = await searchMedications(query);
          setSuggestions(results);
        } catch (error) {
          console.error('Error searching medications:', error);
        } finally {
          setLoading(false);
        }
      }, 300), // Wait 300ms after last keystroke before searching
    []
  );

  const startScan = () => {
    setScanning(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 1) {
          clearInterval(interval);
          setScanning(false);
          return 1;
        }
        return p + 0.1;
      });
    }, 500);
  };

  // Update the search handler
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handleAddMedication = async () => {
    if (selectedMedication) {
      try {
        const medicationWithSchedule = {
          ...selectedMedication,
          schedule: {
            ...schedule,
            dosage: formatDosage(schedule.dosage, selectedMedication.brand_name)
          },
        };
        
        // Close the modal immediately for better UX
        setManualInputVisible(false);
        setShowSuccess(true);
        
        await addMedication(medicationWithSchedule);
        
        // Reset form state
        setSelectedMedication(null);
        setSearchQuery('');
        setSchedule({
          days: [],
          times: [],
          frequency: 'daily',
          dosage: '',
        });
        setScheduleStep(false);
        
        // Hide success message after delay
        setTimeout(() => {
          setShowSuccess(false);
        }, 2000);
      } catch (error) {
        console.error('Error adding medication:', error);
        setManualInputVisible(true); // Reopen modal if there was an error
      }
    }
  };

  const handleFrequencyChange = (freq: 'daily' | 'weekly' | 'monthly') => {
    setScheduleType(freq);
    setSchedule(prev => ({
      ...prev,
      frequency: freq,
      days: freq === 'daily' ? weekDays.map(day => day.toLowerCase()) : [],
    }));
  };

  const motiTransition = {
    type: 'timing',
    duration: 600,
    delay: 0,
  } as const;

  const onTimeConfirm = ({ hours, minutes }: { hours: number; minutes: number }) => {
    const storedTime = storeTime(hours, minutes);
    setSchedule(prev => ({
      ...prev,
      times: [...prev.times, storedTime].sort()
    }));
    setTimePickerVisible(false);
  };

  const renderScheduleStep = () => (
    <ScrollView style={styles.scheduleContainer}>
      <TextInput
        label="Dosage"
        value={schedule.dosage}
        onChangeText={(text) => {
          const numericValue = text.replace(/[^0-9]/g, '');
          setSchedule(prev => ({
            ...prev,
            dosage: numericValue ? formatDosage(numericValue, selectedMedication?.brand_name || '') : ''
          }));
        }}
        placeholder={`Enter dosage (${getDosageUnit(selectedMedication?.brand_name || '')})`}
        keyboardType="numeric"
        style={styles.input}
      />

      <Text variant="titleMedium" style={styles.sectionTitle}>Frequency</Text>
      <View style={styles.chipGroup}>
        {['daily', 'weekly', 'monthly'].map(freq => (
          <Chip
            key={freq}
            selected={scheduleType === freq}
            onPress={() => handleFrequencyChange(freq as 'daily' | 'weekly' | 'monthly')}
            style={styles.chip}
          >
            {freq.charAt(0).toUpperCase() + freq.slice(1)}
          </Chip>
        ))}
      </View>

      {scheduleType === 'monthly' ? (
        <>
          <Text variant="titleMedium" style={styles.sectionTitle}>Days of Month</Text>
          <View style={styles.chipGroup}>
            {monthDays.map(day => (
              <Chip
                key={day}
                selected={monthlyDays.includes(day)}
                onPress={() => {
                  setMonthlyDays(prev => 
                    prev.includes(day) 
                      ? prev.filter(d => d !== day)
                      : [...prev, day]
                  );
                  setSchedule(prev => ({
                    ...prev,
                    days: monthlyDays.map(d => d.toString())
                  }));
                }}
                style={styles.monthDayChip}
              >
                {day}
              </Chip>
            ))}
          </View>
        </>
      ) : scheduleType === 'weekly' ? (
        <>
          <Text variant="titleMedium" style={styles.sectionTitle}>Days of Week</Text>
          <View style={styles.chipGroup}>
            {weekDays.map(day => (
              <Chip
                key={day}
                selected={schedule.days.includes(day.toLowerCase())}
                onPress={() => {
                  setSchedule(prev => ({
                    ...prev,
                    days: prev.days.includes(day.toLowerCase())
                      ? prev.days.filter(d => d !== day.toLowerCase())
                      : [...prev.days, day.toLowerCase()]
                  }));
                }}
                style={styles.chip}
              >
                {day.slice(0, 3)}
              </Chip>
            ))}
          </View>
        </>
      ) : null}

      <Text variant="titleMedium" style={styles.sectionTitle}>Times</Text>
      <View style={styles.chipGroup}>
        {schedule.times.map((time, index) => (
          <Chip
            key={index}
            onClose={() => {
              setSchedule(prev => ({
                ...prev,
                times: prev.times.filter((_, i) => i !== index)
              }));
            }}
            style={styles.chip}
          >
            {displayTime(time)}
          </Chip>
        ))}
      </View>
      <Button
        mode="outlined"
        onPress={() => setTimePickerVisible(true)}
        icon="clock"
        style={styles.addTimeButton}
      >
        Add Time
      </Button>

      <TimePickerModal
        visible={timePickerVisible}
        onDismiss={() => setTimePickerVisible(false)}
        onConfirm={({ hours, minutes }) => {
          setSchedule(prev => ({
            ...prev,
            times: [...prev.times, storeTime(hours, minutes)]
          }));
          setTimePickerVisible(false);
        }}
        locale="en-GB"
      />
    </ScrollView>
  );

  return (
    <>
      <SuccessAnimation 
        visible={showSuccess}
        message="Medication added successfully!"
      />
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={motiTransition}
          style={styles.header}
        >
          <Text variant="headlineMedium">Scan Medication</Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            Use your camera to scan medication labels
          </Text>
        </MotiView>

        <View style={styles.scanArea}>
          <MotiView
            animate={{
              scale: scanning ? [1, 1.1, 1] : 1,
            }}
            transition={{
              loop: scanning,
              duration: 2000,
            }}
          >
            <Ionicons
              name="scan-outline"
              size={150}
              color={theme.colors.primary}
            />
          </MotiView>
          {scanning && (
            <View style={styles.progressContainer}>
              <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progress} />
              <Text variant="bodyMedium">Analyzing label...</Text>
            </View>
          )}
        </View>

        <Card style={styles.instructionsCard}>
          <Card.Title title="Scanning Instructions" />
          <Card.Content>
            <View style={styles.instruction}>
              <Ionicons name="camera" size={24} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.instructionText}>
                Position the medication label within the frame
              </Text>
            </View>
            <View style={styles.instruction}>
              <Ionicons name="sunny" size={24} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.instructionText}>
                Ensure good lighting conditions
              </Text>
            </View>
            <View style={styles.instruction}>
              <Ionicons name="hand-left" size={24} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.instructionText}>
                Hold the device steady while scanning
              </Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={startScan}
            style={styles.button}
            disabled={scanning}
          >
            {scanning ? 'Scanning...' : 'Start Scan'}
          </Button>
          <Button
            mode="outlined"
            onPress={() => setManualInputVisible(true)}
            style={styles.button}
          >
            Enter Manually
          </Button>
        </View>

        <Portal>
          <Modal
            visible={manualInputVisible}
            onDismiss={() => setManualInputVisible(false)}
            contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
          >
            <Text variant="headlineMedium" style={styles.modalTitle}>
              {scheduleStep ? 'Set Schedule' : 'Add Medication'}
            </Text>

            {scheduleStep ? renderScheduleStep() : (
              <>
                <TextInput
                  label="Search Medications"
                  value={searchQuery}
                  onChangeText={handleSearch}
                  style={styles.searchInput}
                />
                {loading ? (
                  <ActivityIndicator style={styles.loading} />
                ) : (
                  <ScrollView style={styles.suggestionsContainer}>
                    {suggestions.map((med, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.suggestionItem,
                          selectedMedication?.brand_name === med.brand_name && styles.selectedItem,
                          { backgroundColor: theme.colors.surfaceVariant }
                        ]}
                        onPress={() => setSelectedMedication(med)}
                      >
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                          {med.brand_name}
                        </Text>
                        {selectedMedication?.brand_name === med.brand_name && (
                          <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </>
            )}

            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => {
                  if (scheduleStep) {
                    setScheduleStep(false);
                  } else {
                    setManualInputVisible(false);
                  }
                }}
              >
                {scheduleStep ? 'Back' : 'Cancel'}
              </Button>
              <Button
                mode="contained"
                onPress={() => {
                  if (scheduleStep) {
                    handleAddMedication();
                  } else {
                    setScheduleStep(true);
                  }
                }}
                disabled={!selectedMedication || (scheduleStep && (!schedule.dosage || !schedule.times.length))}
              >
                {scheduleStep ? 'Add' : 'Next'}
              </Button>
            </View>
          </Modal>
        </Portal>
      </ScrollView>
    </>
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
  scanArea: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginVertical: 20,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  progress: {
    width: '80%',
    height: 6,
    borderRadius: 3,
    marginBottom: 10,
  },
  instructionsCard: {
    margin: 20,
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionText: {
    marginLeft: 16,
    flex: 1,
  },
  buttonContainer: {
    padding: 20,
  },
  button: {
    marginBottom: 10,
  },
  modalContainer: {
    position: 'absolute',
    top: '5%',
    left: '5%',
    right: '5%',
    backgroundColor: 'white',
    borderRadius: 28,
    padding: 24,
    maxHeight: '100%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    marginBottom: 24,
    textAlign: 'center',
  },
  searchInput: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  suggestionsContainer: {
    maxHeight: 400,
    marginBottom: 20,
  },
  suggestionItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: 'rgba(103, 80, 164, 0.12)',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  modalButton: {
    minWidth: 100,
  },
  loading: {
    marginVertical: 24,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    margin: 4,
  },
  input: {
    marginBottom: 24,
  },
  addTimeButton: {
    marginTop: 12,
    marginBottom: 24,
  },
  monthDayChip: {
    minWidth: 45,
    margin: 4,
  },
  scheduleContainer: {
    paddingBottom: 24,
  },
});
