import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTheme, Text, Surface, ActivityIndicator, Card } from 'react-native-paper';
import { MotiView } from 'moti';
import { useMedications } from '../../context/MedicationContext';
import { getDrugInteractions } from '../api/medications';
import { MedicationItem } from '../../components/MedicationItem';

export default function Interactions() {
  const theme = useTheme();
  const { medications, loading } = useMedications();
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
        transition={{ duration: 600 }}
        style={styles.header}
      >
        <Text variant="headlineMedium">Drug Interactions</Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          Analyze potential interactions between your medications
        </Text>
      </MotiView>

      <Card style={styles.section}>
        <Card.Title title="Current Medications" />
        <Card.Content>
          {loading ? (
            <ActivityIndicator />
          ) : medications.length > 0 ? (
            medications.map((med) => (
              <MedicationItem
                key={med.id}
                medication={med}
                showTime={false}
                showFrequency={true}
              />
            ))
          ) : (
            <Text variant="bodyMedium">No medications added yet</Text>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="Potential Interactions" />
        <Card.Content>
          {checkingInteractions ? (
            <ActivityIndicator />
          ) : interactions.length > 0 ? (
            interactions.map((interaction, index) => {
              const severity = getInteractionSeverity(interaction);
              return (
                <Surface
                  key={index}
                  style={[
                    styles.interactionItem,
                    { backgroundColor: theme.colors.surfaceVariant }
                  ]}
                >
                  <View style={styles.severityIndicator}>
                    <View
                      style={[
                        styles.severityDot,
                        { backgroundColor: getSeverityColor(severity) }
                      ]}
                    />
                    <Text
                      variant="labelSmall"
                      style={{ color: getSeverityColor(severity) }}
                    >
                      {severity.toUpperCase()}
                    </Text>
                  </View>
                  <Text variant="bodyMedium" style={styles.interactionText}>
                    {interaction}
                  </Text>
                </Surface>
              );
            })
          ) : medications.length < 2 ? (
            <Text variant="bodyMedium">Add at least two medications to check for interactions</Text>
          ) : (
            <Text variant="bodyMedium">No known interactions found</Text>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 24,
  },
  section: {
    margin: 16,
    marginTop: 8,
  },
  interactionItem: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 4,
  },
  severityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  interactionText: {
    flex: 1,
  },
});
