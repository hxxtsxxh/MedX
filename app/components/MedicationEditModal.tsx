import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, Chip, useTheme } from 'react-native-paper';
import { TimePickerModal } from 'react-native-paper-dates';
import { Medication, MedicationSchedule } from '../(app)/api/medications';
import { useMedications } from '../context/MedicationContext';
import { displayTime, storeTime, formatDosage, getDosageUnit } from '../utils/formatters';
import { TimePickerWrapper } from './TimePickerWrapper';

interface MedicationEditModalProps {
  visible: boolean;
  onDismiss: () => void;
  medication: Medication;
  onDelete: () => void;
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

export const MedicationEditModal = ({ visible, onDismiss, medication, onDelete }: MedicationEditModalProps) => {
  const theme = useTheme();
  const { updateMedication } = useMedications();
  const [schedule, setSchedule] = useState<MedicationSchedule>(
    medication.schedule || {
      days: [],
      times: [],
      frequency: 'daily',
      dosage: '',
    }
  );
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const monthDays = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleSave = async () => {
    try {
      await updateMedication(medication.id, {
        ...medication,
        schedule,
      });
      onDismiss();
    } catch (error) {
      console.error('Error updating medication:', error);
    }
  };

  const handleFrequencyChange = (freq: 'daily' | 'weekly' | 'monthly') => {
    setSchedule(prev => ({
      ...prev,
      frequency: freq,
      days: freq === 'daily' ? weekDays.map(day => day.toLowerCase()) : [],
    }));
  };

  const handleDayToggle = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day],
    }));
  };

  const onTimeConfirm = ({ hours, minutes }: { hours: number; minutes: number }) => {
    const storedTime = storeTime(hours, minutes);
    setSchedule(prev => ({
      ...prev,
      times: [...prev.times, storedTime].sort(),
    }));
    setTimePickerVisible(false);
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
      >
        <Text variant="headlineSmall" style={styles.title}>Edit {medication.brand_name}</Text>
        <ScrollView style={styles.content}>
          <TextInput
            mode="outlined"
            label="Dosage"
            value={schedule.dosage.replace(/[^0-9]/g, '')}
            onChangeText={(text) => {
              const numericValue = text.replace(/[^0-9]/g, '');
              setSchedule(prev => ({
                ...prev,
                dosage: numericValue ? formatDosage(numericValue, medication.brand_name) : ''
              }));
            }}
            right={
              <TextInput.Affix 
                text={getDosageUnit(medication.brand_name)} 
                textStyle={{ color: theme.colors.onSurfaceVariant }}
              />
            }
            keyboardType="numeric"
            style={styles.input}
          />

          <Text variant="titleMedium" style={styles.sectionTitle}>Frequency</Text>
          <View style={styles.frequencyButtons}>
            <Button
              mode={schedule.frequency === 'daily' ? 'contained' : 'outlined'}
              onPress={() => handleFrequencyChange('daily')}
              style={styles.frequencyButton}
            >
              Daily
            </Button>
            <Button
              mode={schedule.frequency === 'weekly' ? 'contained' : 'outlined'}
              onPress={() => handleFrequencyChange('weekly')}
              style={styles.frequencyButton}
            >
              Weekly
            </Button>
            <Button
              mode={schedule.frequency === 'monthly' ? 'contained' : 'outlined'}
              onPress={() => handleFrequencyChange('monthly')}
              style={styles.frequencyButton}
            >
              Monthly
            </Button>
          </View>

          {schedule.frequency !== 'daily' && (
            <>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {schedule.frequency === 'weekly' ? 'Days of Week' : 'Days of Month'}
              </Text>
              <View style={styles.daysContainer}>
                {schedule.frequency === 'weekly' ? (
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
                ) : (
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
                )}
              </View>
            </>
          )}

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
        </ScrollView>

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={onDismiss}
            style={styles.button}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={onDelete}
            style={styles.button}
            buttonColor={theme.colors.error}
          >
            Delete
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.button}
          >
            Save
          </Button>
        </View>

        <TimePickerWrapper
          visible={timePickerVisible}
          onDismiss={() => setTimePickerVisible(false)}
          onConfirm={onTimeConfirm}
        />
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    padding: 20,
    margin: 20,
    borderRadius: 12,
    maxHeight: '90%',
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  content: {
    flexGrow: 1,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
  },
  frequencyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
  },
  daysContainer: {
    marginBottom: 16,
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
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    margin: 4,
  },
  addTimeButton: {
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 24,
  },
  button: {
    flex: 1,
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
});

export default MedicationEditModal;
