const axios = require('axios');

// Replace with your actual Vapi API key
const VAPI_API_KEY = '9366cd45-330b-4c1d-9af5-d4d390991506';

async function createVapiAssistant() {
  try {
    const response = await axios.post('https://api.vapi.ai/assistant', {
      name: "Prayer Partner Web",
      model: {
        type: "apiRequest",
        method: "POST",
        url: "https://us-central1-book-guide-7ef1e.cloudfunctions.net/api/ask",
        body: {
          type: "string",
          value: JSON.stringify({
            prompt: "{{user_message}}",
            contextLevel: "deep"
          })
        },
        headers: {
          type: "string",
          value: JSON.stringify({
            "Content-Type": "application/json"
          })
        }
      },
      voice: {
        provider: "elevenlabs",
        voiceId: "pNInz6obpgDQGcFmaJgB"
      },
      transcriber: {
        provider: "deepgram",
        language: "en"
      },
      firstMessage: "Hello! I'm your Prayer Partner. I'm here to help guide you in prayer and provide spiritual support. What would you like to pray about today?",
      firstMessageMode: "assistant-speaks-first",
      // Web SDK specific configuration
      clientMessages: ["conversation-update", "function-call", "hang", "model-output", "speech-update", "status-update", "transcript", "tool-calls", "user-interrupted", "voice-input"],
      serverMessages: ["conversation-update", "end-of-call-report", "function-call", "hang", "speech-update", "status-update", "tool-calls", "user-interrupted"],
      // Add web-specific settings
      backgroundSound: "off",
      silenceTimeoutSeconds: 30,
      maxDurationSeconds: 600
    }, {
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Web Assistant created successfully!');
    console.log('Assistant ID:', response.data.id);
    console.log('Assistant Name:', response.data.name);
    
    // Update the config file with the assistant ID
    console.log('\n📝 Next steps:');
    console.log('1. Copy the Assistant ID above');
    console.log('2. Update src/config/vapi.ts with the new ASSISTANT_ID');
    
  } catch (error) {
    console.error('❌ Error creating assistant:', error.response?.data || error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure you have a valid Vapi API key');
    console.log('2. Check that your Vapi account is active');
    console.log('3. Verify the API endpoint is accessible');
  }
}

// Check if API key is provided
if (VAPI_API_KEY === 'YOUR_VAPI_API_KEY') {
  console.log('❌ Please update the VAPI_API_KEY in this script with your actual API key');
  console.log('You can get your API key from: https://vapi.ai/dashboard');
} else {
  createVapiAssistant();
} 