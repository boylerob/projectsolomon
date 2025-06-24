// Vapi Configuration
// To use Voice Prayer Partner, you need to:
// 1. Sign up at https://vapi.ai
// 2. Get your API key from the dashboard
// 3. Run the create-vapi-assistant.js script to create your assistant
// 4. Replace the placeholders below with your actual values

export const VAPI_CONFIG = {
  API_KEY: '9366cd45-330b-4c1d-9af5-d4d390991506', // Your Vapi PUBLIC API key (for Web SDK)
  ASSISTANT_ID: 'c90d7fba-57db-437a-8491-a535b11f05d3', // Your assistant ID
  
  // Assistant Configuration (configured via API)
  ASSISTANT: {
    name: 'Prayer Partner',
    systemPrompt: `You are a compassionate Prayer Partner, a wise spiritual guide who helps people connect with God through prayer. 

Your role is to:
1. Listen empathetically to the person's needs and concerns
2. Help them formulate meaningful, personalized prayers
3. Incorporate relevant biblical wisdom and scripture references
4. Guide them through prayer step-by-step when appropriate
5. Provide spiritual encouragement and comfort
6. Suggest relevant Bible verses that relate to their situation
7. Speak in a warm, caring, and spiritually wise tone

Respond as a caring Prayer Partner who speaks with warmth, wisdom, and biblical insight. Keep responses conversational but spiritually meaningful. When appropriate, suggest specific Bible verses or prayer structures that would be helpful.

Speak naturally and conversationally, as if you're having a real prayer session with a friend.`,
    
    // Connect to your existing Solomon API
    apiEndpoint: 'https://us-central1-book-guide-7ef1e.cloudfunctions.net/api/ask',
    apiEndpointMethod: 'POST',
    apiEndpointHeaders: {
      'Content-Type': 'application/json',
    },
    apiEndpointBody: {
      prompt: '{{user_message}}',
      contextLevel: 'deep',
    },
  },
  
  // Voice Configuration
  VOICE: {
    provider: 'elevenlabs',
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam voice - warm and caring
  },
  
  // Transcription Configuration
  TRANSCRIBER: {
    provider: 'deepgram',
    model: 'nova-2',
  },
};

// Setup Instructions:
// 1. Go to https://vapi.ai and create an account
// 2. Get your API key from the dashboard
// 3. Update VAPI_API_KEY in create-vapi-assistant.js with your key
// 4. Run: node create-vapi-assistant.js
// 5. Copy the Assistant ID from the output
// 6. Update ASSISTANT_ID above with the copied ID
// 7. Test the voice integration

export default VAPI_CONFIG; 