const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Simple agent endpoint
app.post('/api/agent/comprehensive-response', (req, res) => {
  const { query, context } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }
  
  console.log('🤖 BTLAS generating comprehensive response for:', query);
  
  // Simple response for now
  const comprehensiveResponse = {
    primaryAnswer: `This is a comprehensive response to: "${query}"`,
    supportingReferences: ['John 3:16', 'Romans 10:9'],
    relatedInsights: ['Key insight 1', 'Key insight 2'],
    conflictsOrCaveats: [],
    practicalApplications: ['Apply this teaching in daily life'],
    furtherStudySuggestions: ['Study related passages'],
    biblicalContext: ['Biblical context for this topic'],
    historicalContext: ['Historical background'],
    theologicalInsights: ['Theological understanding'],
    scholarlyPerspectives: ['Academic perspectives'],
    relatedTopics: ['salvation', 'grace'],
    authoritySources: ['Bible', 'Commentaries'],
    complexity: 'intermediate',
    intent: 'factual',
    responseStrategy: 'direct_answer',
    confidence: 0.8,
    processingTime: Date.now()
  };
  
  res.json({ 
    success: true, 
    comprehensiveResponse,
    message: 'BTLAS has provided comprehensive response ready for CTLAS refinement'
  });
});

// Simple search endpoint
app.post('/api/search/priority', (req, res) => {
  const { query } = req.body;
  
  res.json({
    success: true,
    data: {
      jesus_quotes: [],
      biblical_texts: [],
      lexicon: [],
      gemini_results: []
    },
    source: 'database',
    responseTime: 100,
    totalResults: 0
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
}); 