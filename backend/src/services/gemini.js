const axios = require('axios');
const { logger } = require('./database');

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Search Gemini for biblical and theological information
async function searchGemini(query) {
  if (!GEMINI_API_KEY) {
    logger.warn('Gemini API key not configured');
    return [];
  }

  try {
    logger.info('Searching Gemini for:', query);

    const prompt = `
      Please provide authoritative biblical and theological information about: "${query}"
      
      Please provide:
      1. Direct biblical references and quotes
      2. Historical and theological context
      3. Relevant commentary from respected biblical scholars
      4. Practical applications
      
      Format the response as structured data that can be easily parsed.
      Focus on accuracy and biblical authority.
    `;

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 2048,
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
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000 // 10 second timeout
      }
    );

    if (response.data && response.data.candidates && response.data.candidates[0]) {
      const content = response.data.candidates[0].content.parts[0].text;
      
      // Parse and structure the response
      const structuredResult = parseGeminiResponse(content, query);
      
      logger.info('Gemini search completed successfully');
      return structuredResult;
    } else {
      logger.warn('Gemini returned empty response');
      return [];
    }

  } catch (error) {
    logger.error('Gemini search failed:', error.message);
    
    // Return a fallback response
    return [{
      source: 'gemini_fallback',
      content: `Unable to find specific information about "${query}" in our biblical database. Consider rephrasing your question or asking about a different biblical topic.`,
      confidence: 0.1,
      metadata: {
        error: error.message,
        fallback: true
      }
    }];
  }
}

// Parse Gemini response into structured format
function parseGeminiResponse(content, originalQuery) {
  try {
    // Extract biblical references
    const bibleRefs = extractBibleReferences(content);
    
    // Extract key points
    const keyPoints = extractKeyPoints(content);
    
    // Extract theological insights
    const theologicalInsights = extractTheologicalInsights(content);
    
    return [{
      source: 'gemini',
      original_query: originalQuery,
      content: content,
      structured_data: {
        biblical_references: bibleRefs,
        key_points: keyPoints,
        theological_insights: theologicalInsights
      },
      confidence: 0.8,
      metadata: {
        parsed: true,
        word_count: content.split(' ').length
      }
    }];
    
  } catch (error) {
    logger.error('Failed to parse Gemini response:', error);
    
    return [{
      source: 'gemini',
      original_query: originalQuery,
      content: content,
      confidence: 0.6,
      metadata: {
        parsed: false,
        error: error.message
      }
    }];
  }
}

// Extract Bible references from text
function extractBibleReferences(text) {
  const bibleRefPattern = /([1-3]?\s*[A-Za-z]+\s+\d+:\d+(?:-\d+)?)/gi;
  const matches = text.match(bibleRefPattern) || [];
  return [...new Set(matches)]; // Remove duplicates
}

// Extract key points from text
function extractKeyPoints(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  return sentences.slice(0, 5); // Return first 5 meaningful sentences
}

// Extract theological insights
function extractTheologicalInsights(text) {
  const theologicalKeywords = [
    'theology', 'theological', 'doctrine', 'biblical', 'scripture',
    'faith', 'salvation', 'grace', 'redemption', 'covenant',
    'kingdom', 'discipleship', 'worship', 'prayer', 'repentance'
  ];
  
  const sentences = text.split(/[.!?]+/);
  return sentences.filter(sentence => 
    theologicalKeywords.some(keyword => 
      sentence.toLowerCase().includes(keyword)
    )
  ).slice(0, 3);
}

// Enhanced search with context
async function searchGeminiWithContext(query, context = {}) {
  const enhancedQuery = `
    Context: ${JSON.stringify(context)}
    
    Query: ${query}
    
    Please provide biblical and theological information that addresses this specific query in the given context.
    Focus on practical application and biblical authority.
  `;
  
  return await searchGemini(enhancedQuery);
}

// Search for specific Bible verses
async function searchGeminiForVerse(verseReference) {
  const query = `Please provide the full text and context for the Bible verse: ${verseReference}`;
  return await searchGemini(query);
}

// Search for theological concepts
async function searchGeminiForTheology(concept) {
  const query = `Please explain the theological concept of: ${concept}. Include biblical references and historical context.`;
  return await searchGemini(query);
}

module.exports = {
  searchGemini,
  searchGeminiWithContext,
  searchGeminiForVerse,
  searchGeminiForTheology,
  parseGeminiResponse
}; 