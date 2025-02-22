const axios = require('axios');
const readline = require('readline');

// Replace with your API key
const API_KEY = 'AIzaSyBv4-T7H8BIPqyoWx7BXisXy7mCVeSnGiA';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

// Medical assistant prompt focused on existing medication data
const MEDICAL_PROMPT = {
  role: 'model',
  parts: [{
    text: `You are a helpful medical assistant chatbot that provides information about the user's existing medications. Your responses MUST:
    1. For medication questions:
       - Only reference medications that are already in their medication list
       - Provide accurate schedule and dosage information from their stored data
       - Include any known interactions between their current medications
       - Never suggest adding or removing medications
    2. For health inquiries:
       - Consider their current medication list when discussing symptoms
       - Be empathetic and understanding
       - Recommend consulting their healthcare provider when appropriate
    3. Always:
       - Reference only their existing medication data
       - Be clear about their current schedules and dosages
       - Emphasize medication adherence
       - Maintain context of their medication history
    4. Important disclaimers:
       - Remind users this is informational only
       - Direct them to the app's medication management features to make changes
       - Encourage consulting healthcare providers for medical advice`
  }]
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'You: '
});

// Store chat history
let chatHistory = [MEDICAL_PROMPT];

// Function to get medication context from MedicationContext
function getMedicationContext() {
  // This would be replaced with actual data from MedicationContext
  // Example of how it would integrate with your React Native app:
  const { medications } = useMedications();
  return medications.map(med => ({
    brand_name: med.brand_name,
    schedule: med.schedule,
    dosage: med.schedule?.dosage,
    frequency: med.schedule?.frequency,
    times: med.schedule?.times
  }));
}

// Function to get relevant context for the current query
function getRelevantContext(message) {
  const medications = getMedicationContext();
  const relevantContext = [];

  // Add medication context
  if (medications.length > 0) {
    relevantContext.push({
      role: 'model',
      parts: [{
        text: `User's current medications:\n${medications.map(med => 
          `- ${med.brand_name}: ${med.schedule.dosage} ${med.schedule.frequency}, at ${med.schedule.times.join(', ')}`
        ).join('\n')}`
      }]
    });
  }

  return relevantContext;
}

// Function to format medication context
function formatMedicationContext(medications) {
  if (!medications.length) return [];

  return [{
    role: 'model',
    parts: [{
      text: `User's current medications:\n${medications.map(med => 
        `- ${med.brand_name}: ${med.schedule?.dosage} ${med.schedule?.frequency}, at ${med.schedule?.times.join(', ')}`
      ).join('\n')}`
    }]
  }];
}

// Main function to process chat messages
async function processChatMessage(message, medications, chatHistory = []) {
  try {
    const response = await axios.post(API_URL, {
      contents: [
        MEDICAL_PROMPT,
        ...formatMedicationContext(medications),
        ...chatHistory.slice(-4).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ]
    });

    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return response.data.candidates[0].content.parts[0].text;
    }
    
    return "I apologize, but I couldn't process that request properly.";
  } catch (error) {
    console.error('Error processing chat message:', error);
    throw new Error('Failed to process chat message');
  }
}

// Start chat with medication management focus
function startChat() {
  console.log('Medical Assistant Bot (Type "exit" to end)');
  console.log('I can help answer questions about your current medications.');
  console.log('Note: Always consult healthcare professionals for medical advice.');
  console.log('\nBot: What would you like to know about your medications?');
  
  rl.prompt();

  rl.on('line', async (input) => {
    if (input.toLowerCase() === 'exit') {
      console.log('Take care! Remember to follow your prescribed medication schedule.');
      rl.close();
      return;
    }

    const botResponse = await processChatMessage(input, getMedicationContext(), chatHistory);
    console.log(`Bot: ${botResponse}`);
    rl.prompt();
  });
}

// Start the chatbot
startChat();

module.exports = {
  processChatMessage,
  formatMedicationContext,
  MEDICAL_PROMPT
};