import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';

interface SuccessAnimationProps {
  message: string;
  visible: boolean;
}

export const SuccessAnimation = ({ message, visible }: SuccessAnimationProps) => {
  if (!visible) return null;

  return (
    <MotiView
      from={{
        opacity: 0,
        scale: 0.8,
        translateY: -20,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        translateY: 0,
      }}
      exit={{
        opacity: 0,
        scale: 0.8,
        translateY: -20,
      }}
      style={styles.container}
    >
      <View style={styles.content}>
        <MotiView
          from={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            delay: 100,
          }}
        >
          <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
        </MotiView>
        <Text variant="titleMedium" style={styles.message}>
          {message}
        </Text>
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    marginLeft: 16,
    flex: 1,
  },
}); 
