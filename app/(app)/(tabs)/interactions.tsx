import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTheme, Text, Card, Chip, Button, DataTable } from 'react-native-paper';
import { MotiView } from 'moti';

export default function Interactions() {
  const theme = useTheme();

  const interactions = [
    {
      medications: ['Aspirin', 'Warfarin'],
      severity: 'High',
      description: 'Increased risk of bleeding when taken together',
      recommendation: 'Consult healthcare provider for alternative medications',
    },
    {
      medications: ['Lisinopril', 'Potassium supplements'],
      severity: 'Medium',
      description: 'May cause high potassium levels',
      recommendation: 'Monitor potassium levels regularly',
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 600 }}
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
          <View style={styles.chipContainer}>
            <Chip mode="outlined" onPress={() => {}}>Aspirin</Chip>
            <Chip mode="outlined" onPress={() => {}}>Lisinopril</Chip>
            <Chip mode="outlined" onPress={() => {}}>Metformin</Chip>
          </View>
          <Button
            mode="contained"
            onPress={() => {}}
            style={styles.addButton}
          >
            Add Medication
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="Detected Interactions" />
        <Card.Content>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Medications</DataTable.Title>
              <DataTable.Title>Severity</DataTable.Title>
            </DataTable.Header>

            {interactions.map((interaction, index) => (
              <MotiView
                key={index}
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 600, delay: index * 100 }}
              >
                <DataTable.Row>
                  <DataTable.Cell>{interaction.medications.join(' + ')}</DataTable.Cell>
                  <DataTable.Cell>
                    <Chip
                      mode="flat"
                      style={{
                        backgroundColor:
                          interaction.severity === 'High'
                            ? theme.colors.error
                            : theme.colors.primary,
                      }}
                    >
                      {interaction.severity}
                    </Chip>
                  </DataTable.Cell>
                </DataTable.Row>
                <View style={styles.interactionDetails}>
                  <Text variant="bodyMedium">{interaction.description}</Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Recommendation: {interaction.recommendation}
                  </Text>
                </View>
              </MotiView>
            ))}
          </DataTable>
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="AI Analysis" />
        <Card.Content>
          <Text variant="bodyMedium">
            Our AI system has analyzed your medication combinations using:
          </Text>
          <View style={styles.aiFeatures}>
            <Chip icon="database" mode="outlined">FDA Database</Chip>
            <Chip icon="brain" mode="outlined">ML Predictions</Chip>
            <Chip icon="chart-bubble" mode="outlined">Knowledge Graph</Chip>
          </View>
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
    padding: 20,
    paddingTop: 40,
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  addButton: {
    marginTop: 16,
  },
  interactionDetails: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 8,
    marginBottom: 16,
  },
  aiFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
});