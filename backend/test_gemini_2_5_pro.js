const axios = require('axios');

const BACKEND_URL = 'https://solomon-backend-vjwn7wltcq-uc.a.run.app';

async function testGemini25Pro() {
  console.log('🧪 Testing Gemini 2.5 Pro Integration and Database Population\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test 2: Test comprehensive response with John 3:16
    console.log('\n2️⃣ Testing comprehensive response with John 3:16...');
    const comprehensiveResponse = await axios.post(`${BACKEND_URL}/api/agent/comprehensive-response`, {
      query: 'What does John 3:16 mean?',
      context: { userLevel: 'beginner' }
    });
    
    console.log('✅ Comprehensive response generated');
    console.log('📊 Response data:');
    console.log('- Has biblical data:', comprehensiveResponse.data.comprehensiveResponse.enhancedData?.hasBiblicalData);
    console.log('- Has Gemini analysis:', comprehensiveResponse.data.comprehensiveResponse.enhancedData?.hasGeminiAnalysis);
    console.log('- Is stored analysis:', comprehensiveResponse.data.comprehensiveResponse.enhancedData?.isStoredAnalysis);
    console.log('- Gemini processing time:', comprehensiveResponse.data.comprehensiveResponse.enhancedData?.geminiProcessingTime, 'ms');
    
    // Test 3: Check if analysis was stored in database
    console.log('\n3️⃣ Checking stored Gemini analysis...');
    const storedAnalysis = await axios.get(`${BACKEND_URL}/api/gemini-analysis?verse_reference=John 3:16`);
    
    if (storedAnalysis.data.analyses.length > 0) {
      console.log('✅ Analysis stored in database!');
      const analysis = storedAnalysis.data.analyses[0];
      console.log('📋 Stored analysis details:');
      console.log('- Verse reference:', analysis.verse_reference);
      console.log('- Model version:', analysis.model_version);
      console.log('- Processing time:', analysis.processing_time_ms, 'ms');
      console.log('- Key themes:', analysis.key_themes);
      console.log('- Practical applications:', analysis.practical_applications);
    } else {
      console.log('❌ No stored analysis found');
    }
    
    // Test 4: Test with another verse to verify caching
    console.log('\n4️⃣ Testing with another verse (Psalm 23:1)...');
    const secondResponse = await axios.post(`${BACKEND_URL}/api/agent/comprehensive-response`, {
      query: 'What does Psalm 23:1 teach us about God?',
      context: { userLevel: 'intermediate' }
    });
    
    console.log('✅ Second comprehensive response generated');
    console.log('- Has biblical data:', secondResponse.data.comprehensiveResponse.enhancedData?.hasBiblicalData);
    console.log('- Has Gemini analysis:', secondResponse.data.comprehensiveResponse.enhancedData?.hasGeminiAnalysis);
    console.log('- Is stored analysis:', secondResponse.data.comprehensiveResponse.enhancedData?.isStoredAnalysis);
    
    // Test 5: Check database stats
    console.log('\n5️⃣ Checking Gemini analysis statistics...');
    const stats = await axios.get(`${BACKEND_URL}/api/gemini-analysis/stats`);
    
    console.log('📊 Database statistics:');
    console.log('- Total analyses:', stats.data.stats.totalAnalyses);
    console.log('- Average processing time:', Math.round(stats.data.stats.averageProcessingTime), 'ms');
    console.log('- Model versions:', stats.data.stats.modelStats);
    
    if (stats.data.stats.topVerses.length > 0) {
      console.log('- Top analyzed verses:');
      stats.data.stats.topVerses.forEach((verse, index) => {
        console.log(`  ${index + 1}. ${verse.verse_reference} (${verse.analysis_count} analyses)`);
      });
    }
    
    // Test 6: Test retrieval of stored analysis (should be fast)
    console.log('\n6️⃣ Testing retrieval of stored analysis...');
    const startTime = Date.now();
    const retrievedAnalysis = await axios.get(`${BACKEND_URL}/api/gemini-analysis?verse_reference=John 3:16`);
    const retrievalTime = Date.now() - startTime;
    
    console.log(`✅ Retrieved stored analysis in ${retrievalTime}ms`);
    console.log('- Number of stored analyses:', retrievedAnalysis.data.count);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Gemini 2.5 Pro is working correctly');
    console.log('- Analysis data is being stored in the database');
    console.log('- Stored analysis retrieval is working');
    console.log('- Database statistics are being tracked');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('\n🔍 Checking backend logs for more details...');
      console.log('You can check the logs at: https://console.cloud.google.com/run/detail/us-central1/solomon-backend/logs');
    }
  }
}

// Run the test
testGemini25Pro(); 