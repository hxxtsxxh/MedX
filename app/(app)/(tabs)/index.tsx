import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Platform, Pressable, Image, useWindowDimensions, ImageBackground } from 'react-native';
import { useTheme, Text, Card, Button, Searchbar, FAB, Portal, Modal, Chip, IconButton, MD3Theme } from 'react-native-paper';
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
import { useAnimatedStyle, useSharedValue, interpolate } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

type GeminiResponse = {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
};

const createStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 140,
  },
  section: {
    marginHorizontal: 10,
    marginBottom: 20,
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
    borderWidth: 1,
    borderColor: 'transparent',
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    } : {
      elevation: 3, // Android shadow
    }),
  },
  medicationInfo: {
    flex: 1,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    backgroundColor: theme.colors.primary,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    includeFontPadding: false,
  },
  medicationDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    color: theme.colors.primary,
    includeFontPadding: false,
  },
  dosageText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    includeFontPadding: false,
  },
  divider: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    includeFontPadding: false,
  },
  scheduleText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
    includeFontPadding: false,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 10,
    fontWeight: 'bold',
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
    includeFontPadding: false,
  },
  overviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

function getFirstName(fullName: string | null): string {
  if (!fullName) return 'Guest';
  return fullName.split(' ')[0];
}

export default function Home() {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [searchQuery, setSearchQuery] = useState('');
  const [historyVisible, setHistoryVisible] = useState(false);
  const { medications, loading, getTakenMedications } = useMedications();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { height } = useWindowDimensions();
  const scrollY = useSharedValue(0);

  const backgroundStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, height],
      [0, height * 0.2]  // Slightly less intense parallax for dashboard
    );

    return {
      transform: [{ translateY }],
    };
  });

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

  const recentMedications = [
    { name: 'Aspirin', dosage: '81mg', time: '8:00 AM' },
    { name: 'Lisinopril', dosage: '10mg', time: '9:00 AM' },
    { name: 'Metformin', dosage: '500mg', time: '1:00 PM' },
  ];

  const upcomingDoses = [
    { name: 'Vitamin D', dosage: '2000 IU', time: '3:00 PM' },
    { name: 'Omega-3', dosage: '1000mg', time: '6:00 PM' },
  ];

  const medicationHistory = [
    { date: '2024-02-20', medications: ['Aspirin', 'Lisinopril'] },
    { date: '2024-02-19', medications: ['Metformin', 'Vitamin D'] },
    { date: '2024-02-18', medications: ['Aspirin', 'Omega-3'] },
  ];

  const renderDailyOverview = () => {
    const totalMeds = groupedMedications.morning.length;
    const takenMeds = getTakenMedications().reduce((count, takenId) => {
      return groupedMedications.morning.some(med => med.id === takenId) ? count + 1 : count;
    }, 0);
    
    return (
      <View style={styles.sectionContainer}>
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>Daily Overview</Text>
        <View style={styles.overviewContainer}>
          <View style={[styles.overviewCard, { 
            backgroundColor: theme.colors.primary + '15',  // 15% opacity
            borderWidth: 1,
            borderColor: theme.colors.primary,
          }]}>
            <Ionicons name="calendar" size={24} color={theme.colors.primary} />
            <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
              {totalMeds}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
              Medications Today
            </Text>
          </View>

          <View style={[styles.overviewCard, { 
            backgroundColor: theme.colors.secondary + '15',  // 15% opacity
            borderWidth: 1,
            borderColor: theme.colors.secondary,
          }]}>
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.secondary} />
            <Text variant="titleLarge" style={{ color: theme.colors.secondary }}>
              {takenMeds}/{totalMeds}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>
              Taken
            </Text>
          </View>

          <View style={[styles.overviewCard, { 
            backgroundColor: theme.colors.tertiary + '15',  // 15% opacity
            borderWidth: 1,
            borderColor: theme.colors.tertiary,
          }]}>
            <Ionicons name="time" size={24} color={theme.colors.tertiary} />
            <Text variant="titleLarge" style={{ color: theme.colors.tertiary }}>
              {totalMeds - takenMeds}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.tertiary }}>
              Remaining
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.sectionContainer}>
      <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <Pressable
          onPress={() => router.push('/(app)/(tabs)/scan')}
          style={({ pressed }) => [
            styles.actionCard,
            { 
              backgroundColor: theme.colors.surface,
              opacity: pressed ? 0.8 : 1,
              borderColor: theme.colors.surface,
              borderWidth: 1,
              ...(Platform.OS === 'ios' ? {
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.1,
                shadowRadius: 3,
              } : {
                elevation: 3, // Android shadow
              }),
            }
          ]}
        >
          <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
          <Text variant="bodyMedium" style={[styles.actionText, { color: theme.colors.primary }]}>Add Medication</Text>
        </Pressable>

        <Pressable
          onPress={handleExportData}
          style={({ pressed }) => [
            styles.actionCard,
            { 
              backgroundColor: theme.colors.surface,
              opacity: pressed ? 0.8 : 1,
              borderColor: theme.colors.surface,
              borderWidth: 1,
              ...(Platform.OS === 'ios' ? {
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.1,
                shadowRadius: 3,
              } : {
                elevation: 3, // Android shadow
              }),
            }
          ]}
        >
          <Ionicons name="document-text-outline" size={24} color={theme.colors.primary} />
          <Text variant="bodyMedium" style={[styles.actionText, { color: theme.colors.primary }]}>Export Report</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(app)/(tabs)/profile')}
          style={({ pressed }) => [
            styles.actionCard,
            { 
              backgroundColor: theme.colors.surface,
              opacity: pressed ? 0.8 : 1,
              borderColor: theme.colors.surface,
              borderWidth: 1,
              ...(Platform.OS === 'ios' ? {
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.1,
                shadowRadius: 3,
              } : {
                elevation: 3, // Android shadow
              }),
            }
          ]}
        >
          <Ionicons name="settings-outline" size={24} color={theme.colors.primary} />
          <Text variant="bodyMedium" style={[styles.actionText, { color: theme.colors.primary }]}>Settings</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(app)/notes')}
          style={({ pressed }) => [
            styles.actionCard,
            { 
              backgroundColor: theme.colors.surface,
              opacity: pressed ? 0.8 : 1,
              borderColor: theme.colors.surface,
              borderWidth: 1,
              ...(Platform.OS === 'ios' ? {
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.1,
                shadowRadius: 3,
              } : {
                elevation: 3, // Android shadow
              }),
            }
          ]}
        >
          <Ionicons name="journal-outline" size={24} color={theme.colors.primary} />
          <Text variant="bodyMedium" style={[styles.actionText, { color: theme.colors.primary }]}>Daily Journal</Text>
        </Pressable>
      </View>
    </View>
  );

  const generateMedicationReport = async (medications: Medication[]): Promise<string> => {
    const GEMINI_API_KEY = 'AIzaSyBv4-T7H8BIPqyoWx7BXisX7mCVeSnGiA';
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
        style={{ flex: 1 }}
        onScroll={(event) => {
          scrollY.value = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
          style={[styles.header, theme.dark && { backgroundColor: 'rgba(0, 0, 0, 0.0)' }]}
        >
          <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
            Welcome back,{' '}
            <Text style={{ 
              color: theme.colors.primary,
              fontWeight: 'bold'
            }}>
              {getFirstName(auth.currentUser?.displayName)}!
            </Text>
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            Track your medications and stay healthy
          </Text>
        </MotiView>

        {renderDailyOverview()}

        <Card style={[styles.section, {
          elevation: 0,
          backgroundColor: theme.colors.secondary + '0',
          ...(Platform.OS === 'android' ? {
            borderWidth: 1,
            borderColor: theme.colors.surface,
          } : {
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 1,
            },
            shadowOpacity: 0.0,
            shadowRadius: 1.0,
          }),
        }]}>
          <Card.Title 
            title={<Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>Today's Schedule</Text>}
            titleStyle={{
              fontWeight: '700',
              includeFontPadding: false,
            }}
          />
          <Card.Content style={{ elevation: 0, }}>
            {loading ? (
              <ActivityIndicator />
            ) : groupedMedications.morning.length > 0 ? (
              groupedMedications.morning.map((med, index) => (
                <MotiView
                  key={med.id}
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: 'timing', duration: 300, delay: index * 100 }}
                  style={[
                    styles.medicationItem,
                    getTakenMedications().includes(med.id) && {
                      backgroundColor: theme.colors.primary + '10', // 10% opacity background
                      borderColor: theme.colors.primary,
                    }
                  ]}
                >
                  <View style={styles.medicationInfo}>
                    <Text style={styles.medicationName}>{med.brand_name}</Text>
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
                          : `Monthly on day${med.schedule.days.length > 1 ? 's' : ''} ${med.schedule.days.join(', ')}`
                        }
                      </Text>
                    )}
                  </View>

                  <View style={styles.actionsContainer}>
                    <MedicationActions medication={med} showTakeAction={true} />
                  </View>
                </MotiView>
              ))
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
          backgroundColor: theme.colors.secondary + '0',
          ...(Platform.OS === 'android' ? {
            borderWidth: 1,
            borderColor: theme.colors.surface,
          } : {
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 1,
            },
            shadowOpacity: 0.0,
            shadowRadius: 1.0,
          }),
        }]}>
          <Card.Title 
            title={<Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>Upcoming Doses</Text>}
            titleStyle={{
              fontWeight: '700',
              includeFontPadding: false,
            }}
          />
          <Card.Content style={{ elevation: 0, }}>
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
                      { backgroundColor: theme.colors.surface }
                    ]}
                  >
                    <View style={styles.medicationInfo}>
                      <Text style={styles.medicationName}>{med.brand_name}</Text>
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
                          : `Monthly on day${med.schedule.days.length > 1 ? 's' : ''} ${med.schedule.days.join(', ')}`
                        }
                      </Text>

                      <Text 
                        style={[styles.scheduleText, { color: theme.colors.secondary }]}
                      >
                        {formatDaysUntil(med.daysUntil)}
                      </Text>
                    </View>

                    <View style={styles.actionsContainer}>
                      <MedicationActions medication={med} showTakeAction={false} />
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