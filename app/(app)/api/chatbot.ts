import axios from 'axios';
import { Medication } from './medications';
import { displayTime } from '../../utils/formatters';
import { format } from 'date-fns';
import { GEMINI_API_KEY } from '@env'

export interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface ChatRequest {
  prompt: any;
  context: any[];
  history: any[];
  message: string;
}

interface DrugInfo {
  name: string;
  generic_name: string;
  dosage_form: string;
}

<<<<<<< Updated upstream
const API_KEY = process.env.GEMINI_API_KEY;
=======
const API_KEY = GEMINI_API_KEY;
>>>>>>> Stashed changes
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

const MEDICAL_PROMPT = {
  role: 'model',
  parts: [{
    text: `You are a helpful medical assistant chatbot for an app called MedX that provides information about health, medications, and app navigation. The current date and time is ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}. Your responses MUST:
    1. For health inquiries and symptoms:
       - Consider their current medication list when discussing symptoms (if any exist)
       - Provide general health guidance and common remedies
       - For common symptoms like fever, cold, or flu:
         • Suggest basic over-the-counter treatments
         • Recommend general self-care measures
         • List warning signs that require immediate medical attention
       - For serious symptoms:
         • Emphasize the importance of seeking professional medical care
         • Explain why the symptom might need urgent attention
         • Provide immediate self-care steps while seeking help
       - Be empathetic and understanding

    2. For medication questions:
       - When asked about medication or schedules, only reference medication in medication list if they exist
       - Provide accurate schedule and dosage information from their stored data
       - Include any known interactions between their current medications
       - Consider the current date and time when discussing medication schedules
       - When asked about all medications, list them in number format for example "1. Medication (Dosage)"
       - When asked about schedule, tell them in format "Time: Medication (Dosage)"

    3. For app navigation questions:
       - Only use the exact paths and locations specified above
       - Give numbered steps starting with which tab to select
       - Use exact button names and locations as specified
       - If a feature isn't listed above, say you're not sure about that specific feature
       - Never make up or guess navigation paths
       - If multiple ways exist to do something, explain all available options

       App Navigation Guide:
        1. Bottom Tab Navigation:
          • Home (leftmost tab): Daily medication schedule
          • Chat (second tab): Get AI assistance
          • Scan (third tab): Add medications
          • Interactions (fourth tab): Check drug conflicts
          • Profile (rightmost tab): Settings and account

        2. Key Features and Exact Paths:

        HOME TAB:
        • View Schedule: Home tab shows today's medications automatically
        • Add Medication (2 ways):
          1. Quick Add: Tap "+" button (bottom left corner)
          2. Search: Use "Search Medications" bar at top of screen
        • Quick Actions: Available directly on medication cards

        SCAN TAB:
        • Add Medication (2 more ways):
          1. Search medication name in search bar
          2. Select from search results
          3. Set dosage
          4. Choose dates
          5. Set times
        • Barcode Scanner: Use camera to scan medication barcode

        PROFILE TAB:
        • Change Password:
          1. Tap "Personal Information"
          2. Tap "Change Password"
          3. Enter current password
          4. Enter new password
          5. Tap "Update Passwordi" button
        • Dark Mode: Toggle switch under "Preferences"
        • Notifications: Toggle switch under "Preferences"
        • Profile Picture: Tap profile image at top of screen
        • Export Data: Tap "Export Data" under "Account" section
        • Sign Out: Button at bottom of screen

    4. Always:
       - Answer only what they ask you
       - If they ask for a certain day's schedule, only answer that day's schedule
       - Maintain conversation context
       - Use current date/time for scheduling`
  }]
};

let TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);  // Set to midnight

// Reset TODAY at midnight
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    TODAY = new Date();
    TODAY.setHours(0, 0, 0, 0);
  }
}, 60000); // Check every minute

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

function formatMedicationContext(medications: Medication[], userName: string) {
  // Use the consistent TODAY date
  const scheduleInfo = Array.from({ length: 4 }).map((_, index) => {
    const date = new Date(TODAY);
    date.setDate(TODAY.getDate() + index);
    const meds = getMedicationsForDate(medications, date);
    
    // Group medications by time
    const medsByTime = meds.reduce((acc, med) => {
      if (!med.schedule?.times) return acc;
      
      med.schedule.times.forEach(time => {
        if (!acc[time]) acc[time] = [];
        acc[time].push({
          name: med.brand_name,
          dosage: med.schedule?.dosage || 'no dosage set'
        });
      });
      return acc;
    }, {} as Record<string, Array<{name: string, dosage: string}>>);

    // Sort times and format schedule
    const sortedTimes = Object.keys(medsByTime).sort((a, b) => {
      const [aHour, aMin] = a.split(':').map(Number);
      const [bHour, bMin] = b.split(':').map(Number);
      return (aHour * 60 + aMin) - (bHour * 60 + bMin);
    });

    const formattedSchedule = sortedTimes.map(time => {
      const timeStr = displayTime(time);
      const meds = medsByTime[time]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(med => `${med.name} (${med.dosage})`)
        .join(', ');
      return `${timeStr}: ${meds}`;
    }).join('\n');

    return {
      date: format(date, "EEEE, MMMM d"),
      schedule: formattedSchedule || 'No medications scheduled'
    };
  });

  const formattedText = scheduleInfo.map(day => 
    `${day.date}:\n${day.schedule}`
  ).join('\n\n');

  return [{
    role: 'model',
    parts: [{
      text: `${userName}'s medication schedule:\n\n${formattedText}`
    }]
  }];
}

// Convert ChatMessage to Gemini API format
function convertToGeminiFormat(message: ChatMessage) {
  return {
    role: message.role === 'user' ? 'user' : 'model',
    parts: [{ text: message.content }]
  };
}

export async function processChatMessage(
  message: string,
  chatHistory: ChatMessage[],
  medications: Medication[],
  userName: string
) {
  try {
    // Format medication context
    const medicationContext = formatMedicationContext(medications, userName);

    // Convert chat history to Gemini format
    const formattedHistory = chatHistory.map(convertToGeminiFormat);

    const response = await axios.post(API_URL, {
      contents: [
        MEDICAL_PROMPT,
        ...medicationContext,
        ...formattedHistory,
        { role: 'user', parts: [{ text: message }] }
      ]
    });

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from API');
    }

    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error in processChatMessage:', error);
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.response?.data);
    }
    throw error;
  }
}

export async function generateDrugInteractionResponse(medications: Medication[]): Promise<string> {
  const API_KEY = API_KEY; // Use the existing API_KEY constant
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

  // Format medications into a more detailed structure
  const drugList = medications.map((med): DrugInfo => ({
    name: med.brand_name,
    generic_name: med.generic_name,
    dosage_form: med.dosage_form
  }));

  const prompt = `As a pharmacist, analyze potential drug interactions between these medications:
${drugList.map(drug => `- ${drug.name} (${drug.generic_name}) - ${drug.dosage_form}`).join('\n')}

Please consider:
1. The active ingredients (generic names) of each medication
2. The dosage forms and how they might affect drug absorption and interactions
3. Any specific concerns based on the route of administration
4. Both pharmacokinetic and pharmacodynamic interactions
5. Severity levels of potential interactions

Provide a detailed but clear explanation of any potential interactions, risks, or safety concerns.`;

  try {
    const response = await axios.post(API_URL, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    });

    // Handle the response properly
    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return response.data.candidates[0].content.parts[0].text;
    } else {
      console.error('Unexpected API response structure:', response.data);
      return "I apologize, but I'm unable to analyze the drug interactions at the moment. Please consult with your healthcare provider.";
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    if (axios.isAxiosError(error)) {
      console.error('API Error details:', error.response?.data);
    }
    return "I apologize, but I'm unable to analyze the drug interactions at the moment. Please consult with your healthcare provider.";
  }
}

export { MEDICAL_PROMPT };

export default { processChatMessage }; 
