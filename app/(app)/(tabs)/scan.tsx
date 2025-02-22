import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, Text, Button, Card, ProgressBar } from 'react-native-paper';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView } from 'react-native-gesture-handler';

export default function Scan() {
  const theme = useTheme();
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);

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

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 600 }}
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
          onPress={() => {}}
          style={styles.button}
        >
          Enter Manually
        </Button>
      </View>
    </ScrollView>
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
});
