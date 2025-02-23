import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Platform, Pressable } from 'react-native';
import { useTheme, Text, Card, Button, Searchbar, FAB, Portal, Modal, Chip, IconButton } from 'react-native-paper';
import { MotiView } from 'moti';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMedications } from '../../context/MedicationContext';
import { format } from 'date-fns';
import { displayTime, getNextDoseDay, formatDaysUntil } from '../../utils/formatters';
import { auth } from '../../../firebaseConfig';
import { MedicationActions } from '../../components/MedicationActions';
import type { Medication } from '../api/medications';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

type GeminiResponse = {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 120,
  },
  searchContainer: {
    padding: 20,
    paddingTop: 0,
  },
  searchBar: {
    elevation: 2,
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    flex: 1,
  },
  medicationDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  timeText: {
    fontSize: 14,
    color: theme.colors.primary,
  },
  dosageText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  divider: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  scheduleText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  takenBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
  },
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 20,
  },
  historyItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  modalButton: {
    marginTop: 20,
  },
  sectionContainer: {
    margin: 20,
  },
  sectionTitle: {
    fontWeight: '500',
    marginBottom: 10,
  },
  recentMedsContainer: undefined,
  recentMedCard: undefined,
  recentMedIcon: undefined,
  medInitial: undefined,
  recentMedName: undefined,
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    padding: 8,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    textAlign: 'center',
  },
  overviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medicationNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    flex: 1,
  },
});

function getFirstName(fullName: string | null): string {
  if (!fullName) return 'Guest';
  return fullName.split(' ')[0];
}

const getDosageFormIcon = (dosageForm: string): string => {
  const form = dosageForm?.toLowerCase() || '';
  
  if (form.includes('tablet') || form.includes('pill')) {
    return 'medical-outline';
  } else if (form.includes('capsule')) {
    return 'medical-outline';
  } else if (form.includes('injection') || form.includes('injectable')) {
    return 'fitness-outline';
  } else if (form.includes('solution') && !form.includes('injection')) {
    return 'beaker-outline';
  } else if (form.includes('cream') || form.includes('ointment') || form.includes('gel')) {
    return 'bandage-outline';
  } else if (form.includes('inhaler') || form.includes('aerosol')) {
    return 'cloud-outline';
  } else if (form.includes('drops') || form.includes('ophthalmic')) {
    return 'water-outline';
  } else if (form.includes('patch')) {
    return 'bandage-outline';
  } else if (form.includes('powder')) {
    return 'flask-outline';
  } else if (form.includes('suspension')) {
    return 'beaker-outline';
  } else if (form.includes('spray')) {
    return 'cloud-outline';
  } else if (form.includes('syrup')) {
    return 'beaker-outline';
  } else {
    return 'medical-outline'; // Default icon
  }
};

export default function Home() {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [searchQuery, setSearchQuery] = useState('');
  const [historyVisible, setHistoryVisible] = useState(false);
  const { medications, loading, getTakenMedications } = useMedications();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const groupMedicationsByTime = (medications: Medication[]) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentDate = now.getDate();
    
    return medications.reduce((groups, med) => {
      if (!med.schedule) return groups;

      const { times, days, frequency } = med.schedule;
      
      // Check if medication should be taken today
      const shouldTakeToday = 
        frequency === 'daily' || 
        (frequency === 'weekly' && days.includes(currentDay.toLowerCase())) ||
        (frequency === 'monthly' && days.includes(currentDate.toString()));

      times.forEach(time => {
        const [hours] = time.split(':').map(Number);

        if (shouldTakeToday) {
          // Today's medications go to Today's Schedule
          if (hours < 12) {
            groups.morning.push(med);
          } else if (hours < 17) {
            groups.morning.push(med); // Add to morning section if it's for today
          } else {
            groups.morning.push(med); // Add to morning section if it's for today
          }
        } else {
          // Only add to upcoming if it's not for today
          const daysUntilNext = getNextDoseDay(days, frequency);
          if (daysUntilNext > 0) {
            const existingMed = groups.upcoming.find(m => m.id === med.id);
            if (!existingMed) {
              groups.upcoming.push({
                ...med,
                daysUntil: daysUntilNext
              });
            }
          }
        }
      });
      
      return groups;
    }, { 
      morning: [] as Medication[], 
      upcoming: [] as (Medication & { daysUntil: number })[]
    });
  };

  const groupedMedications = groupMedicationsByTime(medications);

  const renderDailyOverview = () => {
    const totalMeds = groupedMedications.morning.length;
    const takenMeds = getTakenMedications().reduce((count, takenId) => {
      return groupedMedications.morning.some(med => med.id === takenId) ? count + 1 : count;
    }, 0);
    
    return (
      <View style={styles.sectionContainer}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Daily Overview</Text>
        <View style={styles.overviewContainer}>
          <View style={[styles.overviewCard, { backgroundColor: theme.colors.primaryContainer }]}>
            <Ionicons name="calendar" size={24} color={theme.colors.primary} />
            <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
              {totalMeds}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer }}>
              Medications Today
            </Text>
          </View>

          <View style={[styles.overviewCard, { backgroundColor: theme.colors.secondaryContainer }]}>
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.secondary} />
            <Text variant="titleLarge" style={{ color: theme.colors.secondary }}>
              {takenMeds}/{totalMeds}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSecondaryContainer }}>
              Taken
            </Text>
          </View>

          <View style={[styles.overviewCard, { backgroundColor: theme.colors.tertiaryContainer }]}>
            <Ionicons name="time" size={24} color={theme.colors.tertiary} />
            <Text variant="titleLarge" style={{ color: theme.colors.tertiary }}>
              {totalMeds - takenMeds}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onTertiaryContainer }}>
              Remaining
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.sectionContainer}>
      <Text variant="titleMedium" style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <Pressable
          onPress={() => router.push('/(app)/(tabs)/scan')}
          style={({ pressed }) => [
            styles.actionCard,
            { 
              backgroundColor: theme.colors.primaryContainer,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            }
          ]}
        >
          <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
          <Text variant="bodyMedium" style={styles.actionText}>Add Medication</Text>
        </Pressable>

        <Pressable
          onPress={handleExportData}
          style={({ pressed }) => [
            styles.actionCard,
            { 
              backgroundColor: theme.colors.secondaryContainer,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            }
          ]}
        >
          <Ionicons name="document-text-outline" size={24} color={theme.colors.secondary} />
          <Text variant="bodyMedium" style={styles.actionText}>Export Report</Text>
        </Pressable>

        <Pressable
          onPress={() => {/* Handle reminder settings */}}
          style={({ pressed }) => [
            styles.actionCard,
            { 
              backgroundColor: theme.colors.tertiaryContainer,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            }
          ]}
        >
          <Ionicons name="notifications-outline" size={24} color={theme.colors.tertiary} />
          <Text variant="bodyMedium" style={styles.actionText}>Reminder Settings</Text>
        </Pressable>

        <Pressable
          onPress={() => {/* Handle sharing */}}
          style={({ pressed }) => [
            styles.actionCard,
            { 
              backgroundColor: theme.colors.surfaceVariant,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            }
          ]}
        >
          <Ionicons name="share-social-outline" size={24} color={theme.colors.primary} />
          <Text variant="bodyMedium" style={styles.actionText}>Share With Doctor</Text>
        </Pressable>
      </View>
    </View>
  );

  const generateMedicationReport = async (medications: Medication[]): Promise<string> => {
    const GEMINI_API_KEY = 'AIzaSyBv4-T7H8BIPqyoWx7BXisXy7mCVeSnGiA';
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

    try {
      const medicationInfo = medications.map(med => ({
        name: med.brand_name,
        genericName: med.generic_name,
        dosage: med.schedule?.dosage,
        timing: med.schedule?.times.map(displayTime).join(', '),
        frequency: med.schedule?.frequency,
        days: med.schedule?.frequency === 'daily' ? 'Daily' :
              med.schedule?.frequency === 'weekly' ? 
                med.schedule.days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ') :
                `Monthly on days: ${med.schedule?.days.join(', ')}`,
        adherence: getTakenMedications().includes(med.id) ? 'Taken today' : 'Not taken today'
      }));

      const prompt = `Create a concise medication report with these sections:

1. MEDICATION REGIMEN OVERVIEW
A brief, one-paragraph summary of the overall medication schedule.

2. DETAILED MEDICATION INFORMATION
For each medication, list:
• Brand name in CAPS (generic name)
• Dosage: [amount]
• Schedule: [time and frequency]
• Status: [adherence]

3. ADHERENCE SUMMARY
A brief statement about medication adherence.

4. RECOMMENDATIONS
3-4 bullet points for optimal medication management.

Keep sections clearly separated with single line breaks. Use minimal formatting.

Data:
${JSON.stringify(medicationInfo, null, 2)}`;

      const response = await axios.post<GeminiResponse>(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        }
      );

      // Process the response to ensure proper formatting
      const content = response.data.candidates[0].content.parts[0].text
        .replace(/```/g, '') // Remove any markdown code blocks
        .replace(/\n\n+/g, '\n\n') // Reduce multiple line breaks to double
        .trim();

      return content;
    } catch (error) {
      console.error('Error generating report with Gemini:', error);
      throw new Error('Failed to generate medication report');
    }
  };

  const handleExportData = async () => {
    try {
      setIsGeneratingReport(true);
      const reportContent = await generateMedicationReport(medications);

      const date = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.4;
        color: #333;
        padding: 20px;
        margin: 0;
      }
      .header {
        text-align: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #0D47A1;
        padding-bottom: 15px;
      }
      .title {
        color: #0D47A1;
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 8px;
      }
      .subtitle {
        color: #666;
        font-size: 14px;
        margin: 2px 0;
      }
      .section {
        margin: 15px 0;
      }
      .section-title {
        color: #1976D2;
        font-size: 16px;
        font-weight: bold;
        margin: 15px 0 8px 0;
        border-bottom: 1px solid #1976D2;
        padding-bottom: 3px;
      }
      .content {
        margin: 8px 0;
        font-size: 14px;
      }
      ul {
        margin: 5px 0;
        padding-left: 20px;
      }
      li {
        margin: 3px 0;
      }
      p {
        margin: 8px 0;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="title">MEDICATION MANAGEMENT REPORT</div>
      <div class="subtitle">Generated: ${date}</div>
      <div class="subtitle">Patient: ${auth.currentUser?.displayName || 'Not specified'}</div>
    </div>
    ${reportContent
      .split('\n\n')
      .map(section => {
        if (section.includes(':')) {
          const [title, ...content] = section.split('\n');
          return `
            <div class="section">
              <div class="section-title">${title.trim()}</div>
              <div class="content">
                ${content.join('<br>')}
              </div>
            </div>`;
        }
        return `<div class="content">${section}</div>`;
      })
      .join('')}
  </body>
</html>`;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export Medication Report',
          UTI: 'com.adobe.pdf'
        });
      } else {
        alert('Sharing is not available on your platform');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const renderMedicationItem = (med: Medication, index: number) => (
    <MotiView
      key={med.id}
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 300, delay: index * 100 }}
      style={[
        styles.medicationItem,
        getTakenMedications().includes(med.id) && {
          opacity: 0.7,
          backgroundColor: theme.colors.surfaceVariant,
        }
      ]}
    >
      <View style={styles.medicationInfo}>
        <View style={styles.medicationNameContainer}>
          <Text 
            style={styles.medicationName}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {med.brand_name}
          </Text>
          <Ionicons 
            name={getDosageFormIcon(med.dosage_form)}
            size={16}
            color={theme.colors.secondary}
            style={{ marginLeft: 8 }}
          />
        </View>
        <View style={styles.medicationDetails}>
          <Text style={styles.timeText}>
            {med.schedule?.times.map(displayTime).join(', ')}
          </Text>
          <Text style={styles.divider}>•</Text>
          <Text style={styles.dosageText}>
            {med.schedule?.dosage}
          </Text>
        </View>
        {med.schedule?.frequency !== 'daily' && (
          <Text style={styles.scheduleText}>
            {med.schedule?.frequency === 'weekly' 
              ? `Every ${med.schedule.days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}`
              : `Monthly on day${med.schedule.days.length > 1 ? 's' : ''} ${med.schedule.days.join(', ')}`}
          </Text>
        )}
      </View>

      <View style={styles.actionsContainer}>
        <MedicationActions medication={med} showTakeAction={true} showInfo={false} />
        {getTakenMedications().includes(med.id) && (
          <View style={styles.takenBadge}>
            <Text style={{ color: theme.colors.onPrimary, fontSize: 12 }}>
              Taken
            </Text>
          </View>
        )}
      </View>
    </MotiView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
          style={styles.header}
        >
          <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
            Welcome back,{' '}
            <Text style={{ 
              color: theme.colors.primary,
              fontWeight: 'bold' 
            }}>
              {getFirstName(auth.currentUser?.displayName)}
            </Text>
            !
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            Track your medications and stay healthy
          </Text>
        </MotiView>

        {renderDailyOverview()}

        <Card style={[styles.section, {
          elevation: 0,
          backgroundColor: theme.colors.surface,
          ...(Platform.OS === 'android' ? {
            borderWidth: 1,
            borderColor: 'rgba(0, 0, 0, 0.1)',
          } : {
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 1,
            },
            shadowOpacity: 0.18,
            shadowRadius: 1.0,
          }),
        }]}>
          <Card.Title 
            title="Today's Schedule" 
            titleStyle={{
              fontWeight: '500',
              includeFontPadding: false,
            }}
          />
          <Card.Content style={{ elevation: 0 }}>
            {loading ? (
              <ActivityIndicator />
            ) : groupedMedications.morning.length > 0 ? (
              groupedMedications.morning.map((med, index) => renderMedicationItem(med, index))
            ) : (
              <Text variant="bodyMedium" style={{
                includeFontPadding: false,
                textAlign: 'left',
                letterSpacing: 0,
              }}>No medications scheduled for today</Text>
            )}
          </Card.Content>
        </Card>

        <Card style={[styles.section, {
          elevation: 0,
          backgroundColor: theme.colors.surface,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.18,
          shadowRadius: 1.0,
          borderWidth: Platform.OS === 'android' ? 1 : 0,
          borderColor: 'rgba(0, 0, 0, 0.1)',
        }]}>
          <Card.Title title="Upcoming Doses" />
          <Card.Content>
            {loading ? (
              <ActivityIndicator />
            ) : groupedMedications.upcoming.length > 0 ? (
              groupedMedications.upcoming
                .sort((a, b) => a.daysUntil - b.daysUntil)
                .map((med, index) => (
                  <MotiView
                    key={`${med.id}-upcoming`}
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'timing', duration: 600, delay: index * 100 }}
                    style={[
                      styles.medicationItem,
                      { backgroundColor: theme.colors.surfaceVariant + '10' }
                    ]}
                  >
                    <View style={styles.medicationInfo}>
                      <View style={styles.medicationNameContainer}>
                        <Text 
                          style={styles.medicationName}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {med.brand_name}
                        </Text>
                        <Ionicons 
                          name={getDosageFormIcon(med.dosage_form)}
                          size={16}
                          color={theme.colors.secondary}
                          style={{ marginRight: 50 }}
                        />
                      </View>
                      <View style={styles.medicationDetails}>
                        <Text style={styles.timeText}>
                          {med.schedule?.times.map(displayTime).join(', ')}
                        </Text>
                        <Text style={styles.divider}>•</Text>
                        <Text style={styles.dosageText}>
                          {med.schedule?.dosage}
                        </Text>
                      </View>

                      <Text style={styles.scheduleText}>
                        {med.schedule?.frequency === 'weekly' 
                          ? `Every ${med.schedule.days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}`
                          : `Monthly on day${med.schedule.days.length > 1 ? 's' : ''} ${med.schedule.days.join(', ')}`}
                      </Text>
                      
                      <Text 
                        style={[styles.scheduleText, { color: theme.colors.secondary }]}
                      >
                        {formatDaysUntil(med.daysUntil)}
                      </Text>
                    </View>

                    <View style={styles.actionsContainer}>
                      <MedicationActions medication={med} showTakeAction={false} showInfo={false} />
                    </View>
                  </MotiView>
                ))
            ) : (
              <Text variant="bodyMedium">No upcoming doses</Text>
            )}
          </Card.Content>
        </Card>

        {renderQuickActions()}
      </ScrollView>

      <Portal>
        <Modal
          visible={isGeneratingReport}
          dismissable={false}
          contentContainerStyle={{
            backgroundColor: theme.colors.surface,
            padding: 24,
            margin: 20,
            borderRadius: 12,
            alignItems: 'center',
            gap: 16,
          }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyLarge">Generating your report...</Text>
        </Modal>
      </Portal>
    </View>
  );
}
