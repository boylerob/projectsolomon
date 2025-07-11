const express = require('express');
const router = express.Router();
const TinyLLamaAgentService = require('../services/TinyLLamaAgentService');

// Initialize TinyLLama Agent Service
const tinyLLamaAgent = new TinyLLamaAgentService();

// Initialize the agent service
tinyLLamaAgent.initialize().catch(console.error);

/**
 * Generate comprehensive response to user query (BTLAS primary function)
 * This provides the largest possible response by pulling from smart DB and knowledge base
 */
router.post('/comprehensive-response', async (req, res) => {
  try {
    const { query, context } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    console.log('🤖 BTLAS generating comprehensive response for:', query);
    
    const comprehensiveResponse = await tinyLLamaAgent.generateComprehensiveResponse(query, context);
    res.json({ 
      success: true, 
      comprehensiveResponse,
      message: 'BTLAS has provided comprehensive response ready for CTLAS refinement'
    });
  } catch (error) {
    console.error('Error in BTLAS comprehensive response:', error);
    res.status(500).json({ error: 'Failed to generate comprehensive response' });
  }
});

/**
 * Analyze ingested content for structure, authority, and conflicts
 */
router.post('/analyze-content', async (req, res) => {
  try {
    const { content, taskType, context } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const analysis = await tinyLLamaAgent.processContent(content, taskType, context);
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Error in agent content analysis:', error);
    res.status(500).json({ error: 'Failed to analyze content' });
  }
});

/**
 * Analyze user queries for intent and response strategy
 */
router.post('/analyze-query', async (req, res) => {
  try {
    const { query, context } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const analysis = await tinyLLamaAgent.analyzeUserQuery(query, context);
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Error in agent query analysis:', error);
    res.status(500).json({ error: 'Failed to analyze query' });
  }
});

/**
 * Validate content against biblical authority and existing knowledge
 */
router.post('/validate-content', async (req, res) => {
  try {
    const { content, context } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const validation = await tinyLLamaAgent.validateContent(content, context);
    res.json({ success: true, validation });
  } catch (error) {
    console.error('Error in agent content validation:', error);
    res.status(500).json({ error: 'Failed to validate content' });
  }
});

/**
 * Synthesize knowledge from multiple sources
 */
router.post('/synthesize-knowledge', async (req, res) => {
  try {
    const { sources, context } = req.body;
    
    if (!sources || !Array.isArray(sources)) {
      return res.status(400).json({ error: 'Sources array is required' });
    }
    
    const synthesis = await tinyLLamaAgent.synthesizeKnowledge(sources, context);
    res.json({ success: true, synthesis });
  } catch (error) {
    console.error('Error in agent knowledge synthesis:', error);
    res.status(500).json({ error: 'Failed to synthesize knowledge' });
  }
});

/**
 * Get agent status
 */
router.get('/status', async (req, res) => {
  try {
    const status = tinyLLamaAgent.getStatus();
    res.json({ success: true, status });
  } catch (error) {
    console.error('Error getting agent status:', error);
    res.status(500).json({ error: 'Failed to get agent status' });
  }
});

module.exports = router; 