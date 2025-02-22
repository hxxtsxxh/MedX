import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useMedications } from './MedicationContext';
import { auth } from '../../firebaseConfig';
import { processChatMessage, type ChatMessage, MEDICAL_PROMPT } from '../(app)/api/chatbot';
import { Medication } from '../(app)/api/medications';
import { format } from 'date-fns';
import { displayTime } from '../utils/formatters';

interface MedicationSchedule {
  date: string;
  medications: {
    name: string;
    dosage: string;
    times: string[];
  }[];
}

interface ChatContextType {
  processChatMessage: (message: string, chatHistory: ChatMessage[]) => Promise<string>;
  medicationSchedule: MedicationSchedule[];
}

const ChatContext = createContext<ChatContextType>({
  processChatMessage: async () => '',
  medicationSchedule: [],
});

function getMedicationsForDate(medications: Medication[], targetDate: Date): Medication[] {
  const targetDay = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const targetDayOfMonth = targetDate.getDate().toString();

  return medications.filter(med => {
    if (!med.schedule) return false;
    const { frequency, days } = med.schedule;
    return (
      frequency === 'daily' ||
      (frequency === 'weekly' && days.includes(targetDay)) ||
      (frequency === 'monthly' && days.includes(targetDayOfMonth))
    );
  });
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { medications, loading, refreshMedications } = useMedications();
  const [currentMeds, setCurrentMeds] = useState<Medication[]>([]);
  const [medicationSchedule, setMedicationSchedule] = useState<MedicationSchedule[]>([]);

  // Create a memoized function to update the schedule
  const updateSchedule = useCallback((meds: Medication[]) => {
    const now = new Date();
    const scheduleInfo = Array.from({ length: 4 }).map((_, index) => {
      const date = new Date(now);
      date.setDate(date.getDate() + index);
      const dailyMeds = getMedicationsForDate(meds, date);
      
      return {
        date: format(date, "EEEE, MMMM d"),
        medications: dailyMeds
          .filter(med => med.schedule) // Ensure medication has a schedule
          .map(med => ({
            name: med.brand_name,
            dosage: med.schedule?.dosage || 'no dosage set',
            times: med.schedule?.times.map(t => displayTime(t)).sort() || []
          }))
          .sort((a, b) => a.name.localeCompare(b.name)) // Sort medications by name
      };
    });
    
    setMedicationSchedule(scheduleInfo);
  }, []);

  // Update medication schedule when medications change
  useEffect(() => {
    if (!loading) {
      const validMeds = (medications || []).filter(med => 
        med && med.brand_name && med.schedule && 
        med.schedule.frequency && 
        med.schedule.days && 
        med.schedule.times
      );
      setCurrentMeds(validMeds);
      updateSchedule(validMeds);
    }
  }, [medications, loading, updateSchedule]);

  const handleChatMessage = async (message: string, chatHistory: ChatMessage[]) => {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    if (loading) {
      return "Loading your medication information...";
    }

    try {
      // Always refresh medications before processing any message
      console.log('Refreshing medications before processing message...');
      const latestMeds = await refreshMedications();
      
      if (!latestMeds || latestMeds.length === 0) {
        console.log('No medications found after refresh');
        if (message.toLowerCase().includes('medication')) {
          return "I don't see any medications in your current list. Would you like to add some medications?";
        }
      } else {
        console.log(`Found ${latestMeds.length} medications after refresh`);
      }

      // Update current meds and schedule
      const validMeds = latestMeds.filter(med => 
        med && med.brand_name && med.schedule && 
        med.schedule.frequency && 
        med.schedule.days && 
        med.schedule.times
      );
      setCurrentMeds(validMeds);
      updateSchedule(validMeds);

      // Process the message with latest medications
      return processChatMessage(
        message,
        chatHistory,
        validMeds,
        auth.currentUser?.displayName || 'User'
      );
    } catch (error) {
      console.error('Error processing chat message:', error);
      return "I'm having trouble accessing your medication information. Please try again in a moment.";
    }
  };

  return (
    <ChatContext.Provider value={{ 
      processChatMessage: handleChatMessage,
      medicationSchedule 
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);

export default ChatProvider; 