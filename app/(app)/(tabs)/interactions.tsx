import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { useTheme, Text, Card, Chip, Button, Surface, IconButton } from 'react-native-paper';
import { MotiView } from 'moti';
import { useMedications } from '../../context/MedicationContext';
import { getDrugInteractions } from '../api/medications';
import { Ionicons } from '@expo/vector-icons';
import { formatTime, formatDosage, displayTime } from '../../utils/formatters';
import { MedicationActions } from '../../components/MedicationActions';

export default function Interactions() {
  const theme = useTheme();
  const { medications, removeMedication, loading } = useMedications();
  const [interactions, setInteractions] = useState<string[]>([]);
  const [checkingInteractions, setCheckingInteractions] = useState(false);

  useEffect(() => {
    checkInteractions();
  }, [medications]);

  const checkInteractions = async () => {
    if (medications.length < 2) {
      setInteractions([]);
      return;
    }

    setCheckingInteractions(true);
    try {
      const results = await getDrugInteractions(medications);
      setInteractions(results);
    } catch (error) {
      console.error('Error checking interactions:', error);
    } finally {
      setCheckingInteractions(false);
    }
  };

  const getInteractionSeverity = (interaction: string): 'low' | 'medium' | 'high' => {
    const lowKeywords = ['mild', 'minor', 'minimal'];
    const highKeywords = ['severe', 'dangerous', 'avoid', 'serious'];
    
    const text = interaction.toLowerCase();
    if (highKeywords.some(keyword => text.includes(keyword))) return 'high';
    if (lowKeywords.some(keyword => text.includes(keyword))) return 'low';
    return 'medium';
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low': return theme.colors.primary;
      case 'medium': return '#FFA500';
      case 'high': return theme.colors.error;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{
          duration: 600
        }}
        style={styles.header}
      >
        <Text variant="headlineMedium">Drug Interactions</Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          Analyze potential interactions between your medications
        </Text>
      </MotiView>

      <Surface style={[styles.medicationList, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Current Medications</Text>
        {loading ? (
          <ActivityIndicator style={styles.loader} />
        ) : (
          <View style={styles.chipContainer}>
            {medications.map((med) => (
              <MotiView
                key={med.id}
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={styles.medicationCard}
              >
                <Surface style={[styles.medCardContent, { backgroundColor: theme.colors.surface }]}>
                  <View style={styles.medInfo}>
                    <Text variant="titleMedium">{med.brand_name}</Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      {formatDosage(med.schedule?.dosage || '')}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {med.schedule?.times.map(displayTime).join(', ')}
                    </Text>
                  </View>
                  <MedicationActions medication={med} />
                </Surface>
              </MotiView>
            ))}
          </View>
        )}
      </Surface>

      <Surface style={[styles.interactionsContainer, { backgroundColor: theme.colors.surface }]}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Potential Interactions</Text>
        {checkingInteractions ? (
          <ActivityIndicator style={styles.loader} />
        ) : interactions.length > 0 ? (
          interactions.map((interaction, index) => {
            const severity = getInteractionSeverity(interaction);
            return (
              <MotiView
                key={index}
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: index * 100 }}
                style={[
                  styles.interactionItem,
                  { borderLeftColor: getSeverityColor(severity) }
                ]}
              >
                <View style={styles.severityIndicator}>
                  <Ionicons
                    name={severity === 'high' ? 'warning' : 'information-circle'}
                    size={24}
                    color={getSeverityColor(severity)}
                  />
                  <Text
                    variant="labelSmall"
                    style={[styles.severityLabel, { color: getSeverityColor(severity) }]}
                  >
                    {severity.toUpperCase()} RISK
                  </Text>
                </View>
                <Text variant="bodyMedium">{interaction}</Text>
              </MotiView>
            );
          })
        ) : (
          <View style={styles.noInteractions}>
            <Ionicons name="checkmark-circle" size={48} color={theme.colors.primary} />
            <Text variant="titleMedium" style={{ textAlign: 'center', marginTop: 16 }}>
              No interactions detected
            </Text>
            <Text
              variant="bodyMedium"
              style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: 8 }}
            >
              Your current medication combination appears to be safe
            </Text>
          </View>
        )}
      </Surface>
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
  medicationList: {
    margin: 20,
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  chipContainer: {
    gap: 12,
  },
  medicationCard: {
    marginBottom: 8,
  },
  medCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
  },
  medInfo: {
    flex: 1,
  },
  interactionsContainer: {
    margin: 20,
    padding: 16,
    borderRadius: 16,
  },
  interactionItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderLeftWidth: 4,
  },
  severityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityLabel: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  loader: {
    margin: 20,
  },
  noInteractions: {
    alignItems: 'center',
    padding: 24,
  },
});
