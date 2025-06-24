const axios = require('axios');

// Test different API keys
const API_KEYS = [
  '9366cd45-330b-4c1d-9af5-d4d390991506', // New key provided by user
];

async function testApiKey(apiKey) {
  try {
    console.log(`\n🔑 Testing API key: ${apiKey.substring(0, 8)}...`);
    
    // Test 1: Get assistants list
    try {
      const assistantsResponse = await axios.get('https://api.vapi.ai/assistant', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ API key is valid for assistants endpoint!');
      console.log(`📋 Found ${assistantsResponse.data.length} assistants`);
      
      // Show first few assistants
      assistantsResponse.data.slice(0, 3).forEach((assistant, index) => {
        console.log(`   ${index + 1}. ${assistant.name} (${assistant.id})`);
      });
      
      return true;
    } catch (assistantError) {
      console.log(`❌ Assistants endpoint failed: ${assistantError.response?.data?.message || assistantError.message}`);
    }
    
    // Test 2: Try to get account info
    try {
      const accountResponse = await axios.get('https://api.vapi.ai/account', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ API key is valid for account endpoint!');
      console.log(`📊 Account info: ${JSON.stringify(accountResponse.data, null, 2)}`);
      
      return true;
    } catch (accountError) {
      console.log(`❌ Account endpoint failed: ${accountError.response?.data?.message || accountError.message}`);
    }
    
    // Test 3: Try to create a test call (this might work with public key)
    try {
      const callResponse = await axios.post('https://api.vapi.ai/call/web', {
        assistant: "test-assistant-id"
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ API key is valid for call endpoint!');
      return true;
    } catch (callError) {
      console.log(`❌ Call endpoint failed: ${callError.response?.data?.message || callError.message}`);
    }
    
    return false;
    
  } catch (error) {
    console.log(`❌ General API key test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testAllKeys() {
  console.log('🧪 Testing Vapi API Keys...\n');
  
  for (const apiKey of API_KEYS) {
    const isValid = await testApiKey(apiKey);
    if (isValid) {
      console.log(`\n🎉 Found working API key: ${apiKey}`);
      console.log('📝 Update your src/config/vapi.ts with this key!');
      break;
    }
  }
  
  console.log('\n💡 If none work, you need to:');
  console.log('1. Go to https://vapi.ai/dashboard');
  console.log('2. Get a fresh API key (public key for Web SDK)');
  console.log('3. Add it to the API_KEYS array above');
  console.log('4. Run this script again');
}

// Instructions for adding your working key
console.log('📋 To test your working API key:');
console.log('1. Add your working API key to the API_KEYS array above');
console.log('2. Run: node test-vapi-key.js');
console.log('3. Copy the working key to src/config/vapi.ts\n');

testAllKeys(); 