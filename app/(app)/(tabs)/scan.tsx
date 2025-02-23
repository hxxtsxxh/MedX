import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, Pressable, Alert } from 'react-native';
import { useTheme, Text, Button, Card, ProgressBar, ActivityIndicator, TextInput, Chip, SegmentedButtons, Surface, List } from 'react-native-paper';
import { TimePickerModal } from 'react-native-paper-dates';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { Portal, Modal } from 'react-native-paper';
import { TouchableOpacity } from 'react-native';
import { searchMedications, type Medication, MedicationSchedule } from '../api/medications';
import { useMedications } from '../../context/MedicationContext';
import { SuccessAnimation } from '../../components/SuccessAnimation';
import { formatTime, formatDosage, getDosageUnit, storeTime, displayTime } from '../../utils/formatters';
import { useDebouncedCallback } from 'use-debounce';
import { TimePickerWrapper } from '../../components/TimePickerWrapper';
import { CameraView, useCameraPermissions, BarCodeScanningResult } from 'expo-camera';
import { Image } from 'expo-image';

interface Step {
  title: string;
  subtitle: string;
}

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAYS_OF_WEEK_FULL = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const DayCircle = ({ 
  label, 
  selected, 
  onPress 
}: { 
  label: string, 
  selected: boolean, 
  onPress: () => void 
}) => {
  const theme = useTheme();
  
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.dayCircle,
        {
          backgroundColor: selected ? theme.colors.primary : 'transparent',
          borderColor: selected ? theme.colors.primary : theme.colors.outline,
        }
      ]}
    >
      <Text
        style={[
          styles.dayText,
          { color: selected ? theme.colors.onPrimary : theme.colors.onSurface }
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const extractNDC = (barcode: string): { 
  ndc442: string;
  productNdc442: string;
  ndc532: string;
  productNdc532: string;
} => {
  // Remove first digit and get remaining digits
  const digits = barcode.slice(1);
  
  // Format as 4-4-2
  const ndc442 = `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 10)}`;
  const productNdc442 = `${digits.slice(0, 4)}-${digits.slice(4, 8)}`;

  // Format as 5-3-2
  const ndc532 = `${digits.slice(0, 5)}-${digits.slice(5, 8)}-${digits.slice(8, 10)}`;
  const productNdc532 = `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
  
  return { ndc442, productNdc442, ndc532, productNdc532 };
};

const fetchMedicationDetails = async (productNdc: string) => {
  const API_KEY = 'XqqfbY4r5ofStBBaqHIzfhPqwDmqYkTOGzsXoAaM';
  try {
    const response = await fetch(
      `https://api.fda.gov/drug/ndc.json?api_key=${API_KEY}&search=product_ndc:${productNdc}&limit=1`
    );
    const data = await response.json();
    return {
      brandName: data.results[0]?.brand_name || 'Not found',
      genericName: data.results[0]?.generic_name || 'Not found'
    };
  } catch (error) {
    return { brandName: 'Error', genericName: 'Error' };
  }
};

export default function Scan() {
  const theme = useTheme();
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [manualInputVisible, setManualInputVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
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
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [barcodeData, setBarcodeData] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isAlertShowing, setIsAlertShowing] = useState(false);
  
  const steps: Step[] = [
    {
      title: "Search Medication",
      subtitle: "Find your medication in our database"
    },
    {
      title: "Set Dosage",
      subtitle: "How much do you need to take?"
    },
    {
      title: "Schedule",
      subtitle: "When do you need to take it?"
    }
  ];

  // Add cleanup effect at the top level, right after other hooks
  useEffect(() => {
    return () => {
      if (cameraRef.current) {
        // Note: Since pause() isn't available, we'll need a different approach
        // We can just rely on React Native's automatic cleanup
        // when the component unmounts
      }
      setPhotoUri(null);
    };
  }, []);

  // First, add a useEffect to handle camera state
  useEffect(() => {
    if (manualInputVisible && cameraRef.current) {
      cameraRef.current.pausePreview();
    } else if (!manualInputVisible && cameraRef.current) {
      cameraRef.current.resumePreview();
    }
  }, [manualInputVisible]);

  // Create a debounced search function
  const debouncedSearch = useDebouncedCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const results = await searchMedications(query);
        setSuggestions(results);
      } catch (error) {
        console.error('Error searching medications:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
        setIsTyping(false);
      }
    },
    300 // 300ms delay
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
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setIsTyping(true);
    debouncedSearch(text);
  };

  const handleAddMedication = async () => {
    if (selectedMedication && schedule.dosage && schedule.times.length > 0) {
      try {
        // Create a complete medication object with schedule
        const medicationWithSchedule = {
          ...selectedMedication,
          schedule: {
            ...schedule,
            dosage: schedule.dosage,
            times: schedule.times,
            frequency: schedule.frequency,
            days: schedule.days
          }
        };

        await addMedication(medicationWithSchedule);
        setShowSuccess(true);
        handleCloseManualInput();
        // Reset camera state
        if (cameraRef.current) {
          cameraRef.current.resumePreview();
        }
        setTimeout(() => {
          setShowSuccess(false);
        }, 2000);
      } catch (error) {
        console.error('Error adding medication:', error);
        Alert.alert(
          'Error',
          'Failed to add medication. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } else {
      Alert.alert(
        'Missing Information',
        'Please fill in all required medication details.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleFrequencyChange = (freq: 'daily' | 'weekly' | 'monthly') => {
    setScheduleType(freq);
    setSchedule(prev => ({
      ...prev,
      frequency: freq,
      days: freq === 'daily' ? DAYS_OF_WEEK_FULL : [],
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

  const handleDayToggle = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day],
    }));
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {steps.map((_, index) => (
        <View key={index} style={styles.stepRow}>
          <View style={[
            styles.stepDot,
            {
              backgroundColor: index <= currentStep ? theme.colors.primary : theme.colors.surfaceVariant,
            }
          ]} />
          {index < steps.length - 1 && (
            <View style={[
              styles.stepLine,
              {
                backgroundColor: index < currentStep ? theme.colors.primary : theme.colors.surfaceVariant,
              }
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const getMedicationDosageForm = (medication: Medication) => {
    return medication.dosage_form || 'Unknown form';
  };

  const renderSuggestions = () => (
    <ScrollView style={styles.suggestionsContainer}>
      {suggestions.map((med, index) => (
        <Pressable
          key={index}
          onPress={() => setSelectedMedication(med)}
          style={({ pressed }) => [
            styles.suggestionItem,
            {
              backgroundColor: selectedMedication?.id === med.id
                ? theme.colors.primaryContainer
                : pressed 
                  ? theme.colors.surfaceVariant 
                  : theme.colors.surface,
              opacity: pressed ? 0.9 : 1,
            }
          ]}
        >
          <View style={styles.suggestionContent}>
            <View style={styles.suggestionTextContainer}>
              <Text 
                variant="titleMedium"
                style={[
                  styles.suggestionText,
                  { 
                    color: selectedMedication?.id === med.id
                      ? theme.colors.onPrimaryContainer 
                      : theme.colors.onSurface 
                  }
                ]}
              >
                {med.brand_name}
              </Text>
              <Text 
                variant="bodySmall" 
                style={{ 
                  color: theme.colors.onSurfaceVariant,
                  marginTop: 2,
                  opacity: 0.8
                }}
              >
                {med.generic_name}
              </Text>
              <View style={styles.dosageFormContainer}>
                <Ionicons 
                  name="medical-outline" 
                  size={14} 
                  color={theme.colors.secondary}
                  style={{ marginRight: 4 }} 
                />
                <Text 
                  variant="bodySmall" 
                  style={{ 
                    color: theme.colors.secondary,
                    marginTop: 2,
                    fontStyle: 'italic'
                  }}
                >
                  {getMedicationDosageForm(med)}
                </Text>
              </View>
            </View>
            {selectedMedication?.id === med.id && (
              <Ionicons 
                name="checkmark-circle" 
                size={24} 
                color={theme.colors.primary} 
                style={styles.checkIcon}
              />
            )}
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );

  const renderSearchStep = () => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={motiTransition}
    >
      <TextInput
        mode="outlined"
        label="Search Medications"
        placeholder="Type medication name..."
        value={searchQuery}
        onChangeText={handleSearch}
        right={
          <TextInput.Icon 
            icon={isTyping || loading ? "loading" : "magnify"} 
            animated={true}
          />
        }
        style={styles.searchInput}
      />
      {!isTyping && loading ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        renderSuggestions()
      )}
    </MotiView>
  );

  const renderDosageStep = () => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={motiTransition}
      style={styles.dosageContainer}
    >
      <Surface style={styles.selectedMedCard} elevation={1}>
        <Text variant="titleLarge">{selectedMedication?.brand_name}</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {selectedMedication?.generic_name}
        </Text>
      </Surface>

      <TextInput
        mode="outlined"
        label="Dosage"
        value={schedule.dosage.replace(/[^0-9]/g, '')}
        onChangeText={(text) => {
          const numericValue = text.replace(/[^0-9]/g, '');
          setSchedule(prev => ({
            ...prev,
            dosage: numericValue ? formatDosage(numericValue, selectedMedication?.brand_name || '') : ''
          }));
        }}
        right={
          <TextInput.Affix 
            text={getDosageUnit(selectedMedication?.brand_name || '')} 
            textStyle={{ color: theme.colors.onSurfaceVariant }}
          />
        }
        keyboardType="numeric"
        style={styles.dosageInput}
      />
    </MotiView>
  );

  const renderScheduleStep = () => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={motiTransition}
    >
      <View style={styles.frequencyContainer}>
        <SegmentedButtons
          value={schedule.frequency}
          onValueChange={(value) => handleFrequencyChange(value as 'daily' | 'weekly' | 'monthly')}
          buttons={[
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' }
          ]}
        />
      </View>

      {schedule.frequency === 'weekly' && (
        <View style={styles.daysContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Select Days</Text>
          <View style={styles.weekDaysRow}>
            {DAYS_OF_WEEK.map((day, index) => (
              <DayCircle
                key={`${day}_${index}`}
                label={day}
                selected={schedule.days.includes(DAYS_OF_WEEK_FULL[index])}
                onPress={() => handleDayToggle(DAYS_OF_WEEK_FULL[index])}
              />
            ))}
          </View>
        </View>
      )}

      {schedule.frequency === 'monthly' && (
        <View style={styles.daysContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Select Dates</Text>
          <View style={styles.monthDaysGrid}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <DayCircle
                key={day}
                label={day.toString()}
                selected={schedule.days.includes(day.toString())}
                onPress={() => handleDayToggle(day.toString())}
              />
            ))}
          </View>
        </View>
      )}

      <View style={styles.timesContainer}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Set Times</Text>
        <View style={styles.timeChips}>
          {schedule.times.map((time, index) => (
            <Chip
              key={index}
              onClose={() => {
                setSchedule(prev => ({
                  ...prev,
                  times: prev.times.filter((_, i) => i !== index)
                }));
              }}
              style={styles.timeChip}
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
      </View>
    </MotiView>
  );

  const resetManualInputStates = () => {
    setCurrentStep(0);
    setSelectedMedication(null);
    setSearchQuery('');
    setSchedule({
      days: [],
      times: [],
      frequency: 'daily',
      dosage: '',
    });
    setSuggestions([]);
    setScheduleType('daily');
    setMonthlyDays([]);
  };

  const handleCloseManualInput = () => {
    setManualInputVisible(false);
    resetManualInputStates();
    setIsScanning(true); // Re-enable scanning
    if (cameraRef.current) {
      cameraRef.current.resumePreview();
    }
  };

  // Handle camera permissions
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text variant="bodyLarge" style={{ textAlign: "center", marginBottom: 20 }}>
          We need your permission to scan medications
        </Text>
        <Button mode="contained" onPress={requestPermission}>
          Grant Camera Access
        </Button>
      </View>
    );
  }

  const handleInvalidBarcode = () => {
    if (cameraRef.current) {
      cameraRef.current.pausePreview();
    }
    
    // Show alert only if not already showing
    if (!isAlertShowing) {
      setIsAlertShowing(true);
      Alert.alert(
        'Invalid Barcode',
        'This barcode is not recognized as a valid medication. Please try a different barcode or enter details manually.',
        [{ 
          text: 'OK',
          onPress: () => {
            setIsAlertShowing(false);
            setIsScanning(true);
            if (cameraRef.current) {
              cameraRef.current.resumePreview();
            }
          }
        }],
        { cancelable: false } // Prevent dismissing by tapping outside
      );
    }
  };

  const renderCamera = () => (
    <View style={styles.cameraContainer}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        onBarcodeScanned={(!isScanning || isAlertShowing) ? undefined : async (result: BarCodeScanningResult) => {
          setIsScanning(false);
          
          try {
            const { productNdc442, productNdc532 } = extractNDC(result.data);
            let details = await fetchMedicationDetails(productNdc442);
            if (details.brandName === 'Error') {
              details = await fetchMedicationDetails(productNdc532);
            }
            
            if (details.brandName !== 'Error' && details.brandName !== 'Not found') {
              const scannedMedication: Medication = {
                id: result.data,
                brand_name: details.brandName,
                generic_name: details.genericName,
                product_ndc: productNdc442,
                dosage_form: '',
              };
              
              setSelectedMedication(scannedMedication);
              setCurrentStep(1);
              setManualInputVisible(true);
            } else {
              handleInvalidBarcode();
            }
          } catch (error) {
            handleInvalidBarcode();
          }
        }}
      >
        <View style={[
          StyleSheet.absoluteFill,
          styles.cameraOverlay,
          { backgroundColor: manualInputVisible ? 'rgba(0,0,0,0.8)' : 'transparent' }
        ]}>
          {!manualInputVisible && (
            <Text style={styles.overlayText}>
              Scan medication barcode
            </Text>
          )}
        </View>
      </CameraView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SuccessAnimation 
        visible={showSuccess}
        message="Medication added successfully!"
      />
      
      <View style={styles.mainContent}>
        {renderCamera()}
        
        <ScrollView style={styles.instructionsScroll}>
          <Card style={[styles.instructionsCard, {
            elevation: 0,
            backgroundColor: theme.colors.surface,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.18,
            shadowRadius: 1.0,
            borderWidth: Platform.OS === 'android' ? 1 : 0,
            borderColor: 'rgba(0, 0, 0, 0.1)',
          }]}>
            <Card.Content>
              <Text variant="titleLarge" style={{ marginBottom: 12, fontWeight: 'bold' }}>
                Scanning Instructions
              </Text>
              <View style={[styles.instruction, { marginBottom: 10 }]}>
                <Ionicons name="camera" size={24} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.instructionText}>
                  Position the medication label within the frame
                </Text>
              </View>
              <View style={[styles.instruction, { marginBottom: 10 }]}>
                <Ionicons name="sunny" size={24} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.instructionText}>
                  Ensure good lighting conditions
                </Text>
              </View>
              <View style={[styles.instruction, { marginBottom: 15 }]}>
                <Ionicons name="hand-left" size={24} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.instructionText}>
                  Hold the device steady while scanning
                </Text>
              </View>

              <Button
                mode="contained"
                onPress={() => setManualInputVisible(true)}
              >
                Enter Manually Instead
              </Button>
            </Card.Content>
          </Card>
        </ScrollView>
      </View>

      <Portal>
        <Modal
          visible={manualInputVisible}
          onDismiss={handleCloseManualInput}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: theme.colors.surface }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text variant="headlineSmall">{steps[currentStep].title}</Text>
            <Text 
              variant="bodyMedium" 
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {steps[currentStep].subtitle}
            </Text>
          </View>

          {renderStepIndicator()}

          <ScrollView style={styles.modalContent}>
            {currentStep === 0 && renderSearchStep()}
            {currentStep === 1 && renderDosageStep()}
            {currentStep === 2 && renderScheduleStep()}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              mode="outlined"
              onPress={() => {
                if (currentStep === 0) {
                  handleCloseManualInput();
                } else {
                  setCurrentStep(prev => prev - 1);
                }
              }}
            >
              {currentStep === 0 ? 'Cancel' : 'Back'}
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                if (currentStep === 2) {
                  handleAddMedication();
                } else {
                  setCurrentStep(prev => prev + 1);
                }
              }}
              disabled={
                (currentStep === 0 && !selectedMedication) ||
                (currentStep === 1 && !schedule.dosage) ||
                (currentStep === 2 && !schedule.times.length)
              }
            >
              {currentStep === 2 ? 'Add Medication' : 'Next'}
            </Button>
          </View>
        </Modal>
      </Portal>

      <TimePickerWrapper
        visible={timePickerVisible}
        onDismiss={() => setTimePickerVisible(false)}
        onConfirm={onTimeConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'column',
  },
  cameraContainer: {
    flex: 1,
    maxHeight: '65%',
    paddingTop: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
    width: '100%',
    borderRadius: 12,
  },
  instructionsScroll: {
    flex: 1,
    maxHeight: '35%',
    paddingVertical: 20,
  },
  instructionsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  shutterContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  shutterBtn: {
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: 'white',
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  previewContainer: {
    flex: 1,
    paddingTop: 120,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  preview: {
    width: '100%',
    aspectRatio: 3/4,
    borderRadius: 12,
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  instructionText: {
    flex: 1,
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
  modalHeader: {
    alignItems: 'center',
    paddingTop: 24,
  },
  modalContent: {
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedMedCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  dosageContainer: {
    padding: 16,
  },
  dosageInput: {
    marginTop: 16,
  },
  frequencyContainer: {
    padding: 16,
  },
  chipGrid: undefined,
  dayChip: undefined,
  monthlyScrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  monthlyWeekContainer: {
    marginRight: 16,
    minWidth: 280,
  },
  monthlyWeekLabel: {
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  monthlyWeekDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthlyDate: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  monthlyDateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  monthlyGrid: undefined,
  monthlyChip: undefined,
  timeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  timeChip: {
    margin: 4,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 4,
  },
  searchInput: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  suggestionsContainer: {
    maxHeight: 400,
  },
  suggestionItem: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 16,
  },
  checkIcon: {
    flexShrink: 0,
  },
  loading: {
    marginVertical: 24,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 12,
  },
  daysContainer: {
    marginBottom: 16,
  },
  timesContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  addTimeButton: {
    marginTop: 8,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
    gap: 4,
  },
  monthDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 4,
    paddingHorizontal: 0,
    width: 238,
  },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
  },
  medicationIcon: {
    marginRight: 12,
  },
  dosageFormContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  overlay: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  overlayText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cameraOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
