import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
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
}

export const MedicationEditModal = ({ visible, onDismiss, medication }: MedicationEditModalProps) => {
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
            label="Dosage"
            value={schedule.dosage}
            onChangeText={(text) => {
              const numericValue = text.replace(/[^0-9]/g, '');
              setSchedule(prev => ({
                ...prev,
                dosage: numericValue ? formatDosage(numericValue, medication.brand_name) : ''
              }));
            }}
            placeholder={`Enter dosage (${getDosageUnit(medication.brand_name)})`}
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
                {(schedule.frequency === 'weekly' ? weekDays : monthDays).map((day) => (
                  <Chip
                    key={day}
                    selected={schedule.days.includes(
                      typeof day === 'number' ? day.toString() : day.toLowerCase()
                    )}
                    onPress={() => handleDayToggle(
                      typeof day === 'number' ? day.toString() : day.toLowerCase()
                    )}
                    style={styles.chip}
                  >
                    {typeof day === 'number' ? day : day.slice(0, 3)}
                  </Chip>
                ))}
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
          <Button onPress={onDismiss}>Cancel</Button>
          <Button 
            mode="contained" 
            onPress={handleSave}
            disabled={!schedule.dosage || !schedule.times.length}
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
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
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 8,
  },
}); 

export default MedicationEditModal;
