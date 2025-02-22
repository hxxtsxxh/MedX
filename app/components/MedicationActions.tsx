import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton, Portal, Dialog, Button, Text, useTheme } from 'react-native-paper';
import { Medication } from '../(app)/api/medications';
import { useMedications } from '../context/MedicationContext';
import { MedicationEditModal } from './MedicationEditModal';

interface MedicationActionsProps {
  medication: Medication;
  showTakeAction?: boolean;
}

export const MedicationActions = ({ medication, showTakeAction = true }: MedicationActionsProps) => {
  const theme = useTheme();
  const { removeMedication, takeMedication, untakeMedication, getTakenMedications } = useMedications();
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const isTaken = getTakenMedications().includes(medication.id);

  const handleDelete = async () => {
    try {
      await removeMedication(medication.id);
      setDeleteDialogVisible(false);
    } catch (error) {
      console.error('Error deleting medication:', error);
    }
  };

  return (
    <>
      <View style={styles.container}>
        {showTakeAction && (
          <IconButton
            icon={isTaken ? "undo" : "check"}
            iconColor={isTaken ? theme.colors.error : theme.colors.primary}
            size={20}
            onPress={() => {
              if (isTaken) {
                untakeMedication(medication.id);
              } else {
                takeMedication(medication.id);
              }
            }}
          />
        )}
        <IconButton
          icon="information"
          iconColor={theme.colors.primary}
          size={20}
          onPress={() => {/* Show medication details */}}
        />
        <IconButton
          icon="pencil"
          size={20}
          onPress={() => setEditModalVisible(true)}
        />
        <IconButton
          icon="delete"
          size={20}
          onPress={() => setDeleteDialogVisible(true)}
        />
      </View>

      <Portal>
        <Dialog 
          visible={deleteDialogVisible} 
          onDismiss={() => setDeleteDialogVisible(false)}
          style={[styles.dialog, { backgroundColor: theme.colors.surface }]}
        >
          <Dialog.Title>Delete Medication</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete {medication.brand_name}? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button 
              onPress={handleDelete}
              textColor={theme.colors.error}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <MedicationEditModal
        visible={editModalVisible}
        onDismiss={() => setEditModalVisible(false)}
        medication={medication}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dialog: {
    borderRadius: 12,
    marginHorizontal: 20,
  },
}); 

export default MedicationActions;
