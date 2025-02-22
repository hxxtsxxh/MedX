import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, IconButton, Portal, Modal, Button, useTheme, TextInput, Chip } from 'react-native-paper';
import { MotiView } from 'moti';
import { TimePickerModal } from 'react-native-paper-dates';
import { Medication, MedicationSchedule } from '../(app)/api/medications';
import { useMedications } from '../context/MedicationContext';
import { displayTime, formatDosage, getDosageUnit, storeTime } from '../utils/formatters';

interface MedicationItemProps {
  medication: Medication;
  showTime?: boolean;
  showFrequency?: boolean;
  onEdit?: () => void;
}

export const MedicationItem = ({ 
  medication, 
  showTime = true,
  showFrequency = true,
}: MedicationItemProps) => {
  const theme = useTheme();
  const { deleteMedication, updateMedication } = useMedications();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [editedSchedule, setEditedSchedule] = useState<MedicationSchedule>(
    medication.schedule || {
      days: [],
      times: [],
      frequency: 'daily',
      dosage: '',
    }
  );

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const monthDays = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleDelete = async () => {
    try {
      await deleteMedication(medication.id);
      setDeleteModalVisible(false);
    } catch (error) {
      console.error('Error deleting medication:', error);
    }
  };

  const handleEdit = async () => {
    try {
      await updateMedication(medication.id, {
        ...medication,
        schedule: editedSchedule
      });
      setEditModalVisible(false);
    } catch (error) {
      console.error('Error updating medication:', error);
    }
  };

  const handleFrequencyChange = (freq: 'daily' | 'weekly' | 'monthly') => {
    setEditedSchedule(prev => ({
      ...prev,
      frequency: freq,
      days: freq === 'daily' ? weekDays.map(day => day.toLowerCase()) : [],
    }));
  };

  const renderEditSchedule = () => (
    <ScrollView style={styles.scheduleContainer}>
      <TextInput
        label="Dosage"
        value={editedSchedule.dosage}
        onChangeText={(text) => {
          const numericValue = text.replace(/[^0-9]/g, '');
          setEditedSchedule(prev => ({
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
          mode={editedSchedule.frequency === 'daily' ? 'contained' : 'outlined'}
          onPress={() => handleFrequencyChange('daily')}
          style={styles.frequencyButton}
        >
          Daily
        </Button>
        <Button
          mode={editedSchedule.frequency === 'weekly' ? 'contained' : 'outlined'}
          onPress={() => handleFrequencyChange('weekly')}
          style={styles.frequencyButton}
        >
          Weekly
        </Button>
        <Button
          mode={editedSchedule.frequency === 'monthly' ? 'contained' : 'outlined'}
          onPress={() => handleFrequencyChange('monthly')}
          style={styles.frequencyButton}
        >
          Monthly
        </Button>
      </View>

      {editedSchedule.frequency !== 'daily' && (
        <>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {editedSchedule.frequency === 'weekly' ? 'Select Days' : 'Select Dates'}
          </Text>
          <View style={styles.daysContainer}>
            {(editedSchedule.frequency === 'weekly' ? weekDays : monthDays).map((day, index) => (
              <Chip
                key={index}
                selected={editedSchedule.days.includes(
                  editedSchedule.frequency === 'weekly' ? day.toLowerCase() : day.toString()
                )}
                onPress={() => {
                  const dayValue = editedSchedule.frequency === 'weekly' ? day.toLowerCase() : day.toString();
                  setEditedSchedule(prev => ({
                    ...prev,
                    days: prev.days.includes(dayValue)
                      ? prev.days.filter(d => d !== dayValue)
                      : [...prev.days, dayValue]
                  }));
                }}
                style={styles.chip}
              >
                {day}
              </Chip>
            ))}
          </View>
        </>
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>Times</Text>
      <View style={styles.chipGroup}>
        {editedSchedule.times.map((time, index) => (
          <Chip
            key={index}
            onClose={() => {
              setEditedSchedule(prev => ({
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
  );

  return (
    <>
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}
      >
        <View style={styles.content}>
          <Text variant="titleMedium">{medication.brand_name}</Text>
          <Text variant="bodyMedium">
            {medication.schedule?.dosage} • {showTime && medication.schedule?.times.map(displayTime).join(', ')}
          </Text>
          {showFrequency && medication.schedule?.frequency !== 'daily' && (
            <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
              {medication.schedule?.frequency === 'weekly' 
                ? `Every ${medication.schedule.days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}`
                : `Monthly on day${medication.schedule.days.length > 1 ? 's' : ''} ${medication.schedule.days.join(', ')}`}
            </Text>
          )}
        </View>
        <View style={styles.actions}>
          <IconButton
            icon="pencil"
            size={20}
            onPress={() => setEditModalVisible(true)}
          />
          <IconButton
            icon="delete"
            size={20}
            onPress={() => setDeleteModalVisible(true)}
          />
        </View>
      </MotiView>

      <Portal>
        {/* Delete Confirmation Modal */}
        <Modal
          visible={deleteModalVisible}
          onDismiss={() => setDeleteModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="titleLarge">Delete Medication</Text>
          <Text variant="bodyMedium" style={styles.modalText}>
            Are you sure you want to delete {medication.brand_name}?
          </Text>
          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={() => setDeleteModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleDelete}
              style={styles.modalButton}
            >
              Delete
            </Button>
          </View>
        </Modal>

        {/* Edit Modal */}
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Edit {medication.brand_name}
          </Text>

          {renderEditSchedule()}

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setEditModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleEdit}
              style={styles.modalButton}
              disabled={!editedSchedule.dosage || !editedSchedule.times.length}
            >
              Save Changes
            </Button>
          </View>
        </Modal>

        <TimePickerModal
          visible={timePickerVisible}
          onDismiss={() => setTimePickerVisible(false)}
          onConfirm={({ hours, minutes }) => {
            setEditedSchedule(prev => ({
              ...prev,
              times: [...prev.times, storeTime(hours, minutes)].sort()
            }));
            setTimePickerVisible(false);
          }}
          locale="en-GB"
        />
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginVertical: 4,
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  modalText: {
    marginVertical: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    marginLeft: 8,
  },
  scheduleContainer: {
    maxHeight: 400,
    marginVertical: 16,
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
  },
  frequencyButton: {
    flex: 1,
    marginHorizontal: 4,
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
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
}); 

export default MedicationItem;
