const axios = require('axios');
const readline = require('readline');

// Replace with your Gemini API key
const API_KEY = 'AIzaSyBv4-T7H8BIPqyoWx7BXisXy7mCVeSnGiA';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

// Medical assistant prompt to guide responses
const MEDICAL_PROMPT = {
  role: 'model',
  parts: [{
    text: `You are a medical assistant chatbot. Your responses MUST:
    1. First ask specific questions about symptoms (location, severity, duration)
    2. Be kind and understanding
    3. Stay concise and focused
    4. Only after getting symptom details, provide brief recommendations
    5. For first-time symptoms, always ask:
       - Where is the pain/discomfort?
       - How long have you had it?
       - How severe is it (1-10)?
       - Any other symptoms?`
  }]
};

// Create readline interface for terminal input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'You: '  // Set default prompt
});

// Store chat history
let chatHistory = [MEDICAL_PROMPT];

// Separate storage for important context
const CONTEXT_MEMORY = {
  medical_topics: new Set(),  // Store discussed medical topics
  important_context: [],      // Store critical information
  max_context: 10,           // Maximum number of important contexts to keep
};

// Function to send a message to the Gemini API
async function sendMessage(message) {
  try {
    // Update context based on message content
    updateContext(message);

    const response = await axios.post(
      API_URL,
      {
        contents: [
          MEDICAL_PROMPT,
          // Include relevant stored context
          ...getRelevantContext(message),
          // Include recent conversation history
          ...chatHistory.slice(-4),
          { role: 'user', parts: [{ text: message }] }
        ]
      }
    );

    // Safer response parsing
    let botResponse;
    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      botResponse = response.data.candidates[0].content.parts[0].text;
    } else {
      botResponse = "I apologize, but I couldn't process that request properly.";
    }

    // Update chat history with just the current exchange
    chatHistory = chatHistory.slice(-4); // Keep only recent messages
    chatHistory.push(
      { role: 'user', parts: [{ text: message }] },
      { role: 'model', parts: [{ text: botResponse }] }
    );

    return botResponse;
  } catch (error) {
    console.error('Error occurred:', error.message);
    return 'I apologize, but I encountered an error. Please try your question again.';
  }
}

function updateContext(message) {
  // Example medical topics to track
  const medicalKeywords = ['medication', 'symptoms', 'condition', 'treatment', 'disease'];
  
  // Extract and store important medical topics
  medicalKeywords.forEach(keyword => {
    if (message.toLowerCase().includes(keyword)) {
      CONTEXT_MEMORY.medical_topics.add(keyword);
    }
  });

  // Store important context (e.g., mentioned conditions or medications)
  if (isImportantInformation(message)) {
    CONTEXT_MEMORY.important_context.push({
      timestamp: Date.now(),
      content: message
    });
    
    // Keep only the most recent important contexts
    if (CONTEXT_MEMORY.important_context.length > CONTEXT_MEMORY.max_context) {
      CONTEXT_MEMORY.important_context.shift();
    }
  }
}

function getRelevantContext(message) {
  // Find and return relevant context based on current message
  const relevantContext = CONTEXT_MEMORY.important_context
    .filter(ctx => isRelevantToMessage(ctx.content, message))
    .map(ctx => ({
      role: 'model',
      parts: [{ text: `Previous relevant information: ${ctx.content}` }]
    }));

  return relevantContext;
}

function isImportantInformation(message) {
  // Add logic to identify important medical information
  const importantPatterns = [
    /allerg(y|ies|ic)/i,
    /medication/i,
    /diagnos(is|ed)/i,
    /condition/i,
    /symptom/i
  ];
  
  return importantPatterns.some(pattern => pattern.test(message));
}

function isRelevantToMessage(context, message) {
  // Add logic to determine if stored context is relevant to current message
  const words = message.toLowerCase().split(' ');
  const contextWords = context.toLowerCase().split(' ');
  
  return words.some(word => 
    contextWords.includes(word) && word.length > 3  // Avoid matching short words
  );
}

// Main chat loop
function startChat() {
  console.log('Medical Assistant Bot (Type "exit" to end)');
  console.log('Note: Always consult healthcare professionals for medical advice.');
  console.log('\nBot: What medical concerns can I help you with today?');
  
  rl.prompt();

  rl.on('line', async (input) => {
    if (input.toLowerCase() === 'exit') {
      console.log('Take care! Remember to consult healthcare professionals for medical advice.');
      rl.close();
      return;
    }

    const botResponse = await sendMessage(input);
    console.log(`Bot: ${botResponse}`);
    rl.prompt();
  });
}

// Start the chatbot
startChat();
