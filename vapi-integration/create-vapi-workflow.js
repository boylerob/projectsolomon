const axios = require('axios');

// Replace with your actual Vapi API key (private key for creating workflows)
const VAPI_API_KEY = '575a1968-8424-4e94-87f7-34202adfbeed'; // Your PRIVATE key

async function createVapiWorkflow() {
  try {
    const payload = {
      name: "Prayer Partner Workflow",
      nodes: {
        start: {
          type: "conversation",
          firstMessage: "Hello! I'm your Prayer Partner. I'm here to help guide you in prayer and provide spiritual support. What would you like to pray about today?",
          prompt: `You are a compassionate Prayer Partner, a wise spiritual guide who helps people connect with God through prayer. \n\nYour role is to:\n1. Listen empathetically to the person's needs and concerns\n2. Help them formulate meaningful, personalized prayers\n3. Incorporate relevant biblical wisdom and scripture references\n4. Guide them through prayer step-by-step when appropriate\n5. Provide spiritual encouragement and comfort\n6. Suggest relevant Bible verses that relate to their situation\n7. Speak in a warm, caring, and spiritually wise tone\n\nRespond as a caring Prayer Partner who speaks with warmth, wisdom, and biblical insight. Keep responses conversational but spiritually meaningful. When appropriate, suggest specific Bible verses or prayer structures that would be helpful.\n\nSpeak naturally and conversationally, as if you're having a real prayer session with a friend.`
        }
      },
      edges: [],
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
        provider: "11labs",
        voiceId: "pNInz6obpgDQGcFmaJgB"
      },
      transcriber: {
        provider: "deepgram",
        language: "en"
      }
    };
    console.log('Payload to be sent to Vapi API:', JSON.stringify(payload, null, 2));
    const response = await axios.post('https://api.vapi.ai/workflow', payload, {
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Workflow created successfully!');
    console.log('Workflow ID:', response.data.id);
    console.log('Workflow Name:', response.data.name);
    
    // Update the config file with the workflow ID
    console.log('\n📝 Next steps:');
    console.log('1. Copy the Workflow ID above');
    console.log('2. Update src/config/vapi.ts with the new WORKFLOW_ID');
    
  } catch (error) {
    console.error('❌ Error creating workflow:', error.response?.data || error.message);
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
  createVapiWorkflow();
} 