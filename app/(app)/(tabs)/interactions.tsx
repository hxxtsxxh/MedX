import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, ImageBackground, RefreshControl } from 'react-native';
import { useTheme, Text, Chip, Surface, IconButton } from 'react-native-paper';
import { MotiView } from 'moti';
import { useMedications } from '../../context/MedicationContext';
import { analyzeDrugInteractions, type InteractionSeverity, type DrugInteraction } from '../api/drugInteractions';

type GeminiResponse = {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
};

interface Medication {
  id: string;
  brand_name: string;
  generic_name: string;
  dosage_form: string;
  schedule?: {
    dosage: string;
    frequency: string;
    times: string[];
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  noInteractions: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  interactionsContainer: {
    padding: 16,
  },
  interactionCard: {
    marginBottom: 16,
  },
  cardWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
    gap: 12,
  },
  severityContainer: {
    marginBottom: 4,
  },
  medicationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  medicationChip: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  infoContainer: {
    gap: 12,
  },
  infoSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    padding: 12,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  header: {
    padding: 20,
    paddingTop: 130,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medicationCard: {
    marginBottom: 16,
  },
  medicationHeader: {
    padding: 12,
    gap: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
});

export default function Interactions() {
  const theme = useTheme();
  const { medications } = useMedications();
  const [loading, setLoading] = useState(false);
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const analyzeInteractions = async () => {
    if (medications.length <= 1) {
      setInteractions([]);
      return;
    }
    
    setLoading(true);
    try {
      const results = await analyzeDrugInteractions(medications);
      setInteractions(results);
    } catch (error) {
      console.error('Error analyzing interactions:', error);
      setInteractions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const medicationIds = medications.map(med => med.id).sort().join(',');
    
    const timeoutId = setTimeout(() => {
      analyzeInteractions();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [medications]);

  const getSeverityColor = (severity: InteractionSeverity) => {
    const isDark = theme.dark;
    switch (severity) {
      case 'HIGH':
        return isDark ? '#FF8A80' : '#D32F2F'; 
      case 'MODERATE':
        return isDark ? '#FFD180' : '#F57C00'; 
      case 'LOW':
        return isDark ? '#80CBC4' : '#00796B'; 
      default:
        return theme.colors.surfaceVariant;
    }
  };

  const getSeverityBackground = (severity: InteractionSeverity) => {
    const isDark = theme.dark;
    switch (severity) {
      case 'HIGH':
        return isDark ? 'rgba(255, 138, 128, 0.2)' : 'rgba(211, 47, 47, 0.1)'; 
      case 'MODERATE':
        return isDark ? 'rgba(255, 209, 128, 0.2)' : 'rgba(245, 124, 0, 0.1)'; 
      case 'LOW':
        return isDark ? 'rgba(128, 203, 196, 0.2)' : 'rgba(0, 121, 107, 0.1)';
      default:
        return theme.colors.surfaceVariant;
    }
  };

  const getSeverityRank = (severity: InteractionSeverity): number => {
    switch (severity) {
      case 'HIGH': return 0;
      case 'MODERATE': return 1;
      case 'LOW': return 2;
      default: return 3;
    }
  };

  const renderInteractionCard = (medication: Medication, index: number) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500, delay: index * 100 }}
    >
      <Surface style={styles.medicationCard} elevation={1}>
        <View style={styles.medicationHeader}>
          <View style={styles.titleContainer}>
            <Text variant="titleMedium">{medication.brand_name}</Text>
            <Text 
              variant="bodySmall" 
              style={{ 
                color: theme.colors.secondary,
                marginLeft: 8,
                fontStyle: 'italic'
              }}
            >
              {medication.dosage_form}
            </Text>
          </View>
          <Text 
            variant="bodyMedium" 
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {medication.generic_name}
          </Text>
        </View>
      </Surface>
    </MotiView>
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await analyzeInteractions();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Analyzing drug interactions...</Text>
        </View>
      </View>
    );
  }

  if (medications.length <= 1) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.noInteractions}>
          <Text variant="titleMedium">No Potential Interactions</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
            Add more medications to analyze potential interactions
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={theme.dark 
          ? require('../../../assets/images/Dark_Background.png') 
          : require('../../../assets/images/Background.png')}
        style={{ flex: 1, position: 'absolute', width: '100%', height: '100%' }}
        resizeMode="cover"
      />
      <ScrollView 
        style={[styles.container, { backgroundColor: 'transparent' }]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={styles.header}
        >
          <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
            Drug Interaction
          </Text>
          <IconButton
            icon="reload"
            color={theme.colors.primary}
            size={24}
            onPress={handleRefresh}
          />
        </MotiView>
        
        {interactions.length === 0 ? (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
            style={styles.noInteractions}
          >
            <Text variant="titleMedium">No Known Interactions</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
              Your current medications appear to be safe to take together
            </Text>
          </MotiView>
        ) : (
          <View style={styles.interactionsContainer}>
            {interactions
              .sort((a, b) => getSeverityRank(a.severity) - getSeverityRank(b.severity))
              .map((interaction, index) => (
                <MotiView
                  key={index}
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 500, delay: index * 100 }}
                >
                  <Surface
                    style={[
                      styles.interactionCard,
                      { backgroundColor: theme.colors.surface }
                    ]}
                    elevation={1}
                  >
                    <View style={styles.cardWrapper}>
                      <View style={styles.cardContent}>
                        <View style={styles.severityContainer}>
                          <Chip
                            style={{ backgroundColor: getSeverityBackground(interaction.severity) }}
                            textStyle={{ color: getSeverityColor(interaction.severity) }}
                          >
                            {interaction.severity} RISK
                          </Chip>
                        </View>

                        <View style={styles.medicationsContainer}>
                          {interaction.medications.map((med, idx) => (
                            <Chip
                              key={idx}
                              style={styles.medicationChip}
                              textStyle={{ color: theme.colors.onSurfaceVariant }}
                            >
                              {med}
                            </Chip>
                          ))}
                        </View>

                        <View style={styles.infoContainer}>
                          <View style={styles.infoSection}>
                            <Text style={[styles.infoTitle, { color: theme.colors.primary }]}>Description:</Text>
                            <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
                              {interaction.description}
                            </Text>
                          </View>
                          
                          {interaction.dosageImpact && (
                            <View style={styles.infoSection}>
                              <Text style={[styles.infoTitle, { color: theme.colors.primary }]}>
                                Dosage Impact:
                              </Text>
                              <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
                                {interaction.dosageImpact}
                              </Text>
                            </View>
                          )}
                          
                          <View style={styles.infoSection}>
                            <Text style={[styles.infoTitle, { color: theme.colors.primary }]}>
                              Recommendation:
                            </Text>
                            <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
                              {interaction.recommendation}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </Surface>
                </MotiView>
              ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
