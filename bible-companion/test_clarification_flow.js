const AgentService = require('./src/services/AgentService.ts').default;

async function testClarificationFlow() {
  console.log('Testing Clarification Flow...\n');
  
  try {
    // Initialize the service
    await AgentService.initializeUserContext();
    
    // Test 1: Ask a broad question that should trigger clarification
    console.log('Test 1: Asking broad question...');
    const question1 = "What does the Bible say about love?";
    const response1 = await AgentService.askQuestion(question1);
    console.log('Response type:', response1.immediateResponse?.type);
    console.log('Response:', response1.immediateResponse?.text);
    console.log('Has pending clarification:', !!AgentService.pendingClarification);
    console.log('');
    
    // Test 2: Provide a clarification
    console.log('Test 2: Providing clarification...');
    const clarification = "Focus on romantic love in marriage";
    const response2 = await AgentService.askQuestion(clarification);
    console.log('Clarification response:', response2.content);
    console.log('Has pending clarification after:', !!AgentService.pendingClarification);
    console.log('');
    
    // Test 3: Ask another question to reset the flow
    console.log('Test 3: Asking new question to reset flow...');
    const question3 = "What does John 3:16 mean?";
    const response3 = await AgentService.askQuestion(question3);
    console.log('New question response:', response3.immediateResponse?.text);
    console.log('Has pending clarification after new question:', !!AgentService.pendingClarification);
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

testClarificationFlow(); 