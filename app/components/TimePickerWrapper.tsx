import React from 'react';
import { StyleSheet } from 'react-native';
import { Portal, Modal, useTheme } from 'react-native-paper';
import { TimePickerModal } from 'react-native-paper-dates';

interface TimePickerWrapperProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (params: { hours: number; minutes: number }) => void;
}

export const TimePickerWrapper = ({ visible, onDismiss, onConfirm }: TimePickerWrapperProps) => {
  const theme = useTheme();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.colors.surface }
        ]}
      >
        <TimePickerModal
          visible={visible}
          onDismiss={onDismiss}
          onConfirm={onConfirm}
          hours={12}
          minutes={0}
        />
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
}); 

export default TimePickerWrapper;
