const express = require('express');
const { executeQuery } = require('../services/database');
const { getCachedResult, setCachedResult } = require('../services/cache');
const { searchGemini } = require('../services/gemini');
const { logger } = require('../services/database');

const router = express.Router();

// Priority-based search endpoint
router.post('/priority', async (req, res) => {
  const startTime = Date.now();
  const { query, priorities = [1, 2, 3], limit = 10 } = req.body;
  
  try {
    logger.info('Priority search request', { query, priorities });
    
    // Check cache first
    const cacheKey = `search:${query}:${priorities.join(',')}:${limit}`;
    const cachedResult = await getCachedResult(cacheKey);
    
    if (cachedResult) {
      logger.info('Returning cached result');
      return res.json({
        success: true,
        data: cachedResult,
        source: 'cache',
        responseTime: Date.now() - startTime
      });
    }
    
    const results = {
      jesus_quotes: [],
      biblical_texts: [],
      lexicon: [],
      gemini_results: []
    };
    
    // Search Jesus quotes (Priority 1)
    if (priorities.includes(1)) {
      const jesusResults = await searchJesusQuotes(query, limit);
      results.jesus_quotes = jesusResults;
    }
    
    // Search biblical texts (Priority 2)
    if (priorities.includes(2)) {
      const biblicalResults = await searchBiblicalTexts(query, limit);
      results.biblical_texts = biblicalResults;
    }
    
    // Search lexicon (Priority 3)
    if (priorities.includes(3)) {
      const lexiconResults = await searchLexicon(query, limit);
      results.lexicon = lexiconResults;
    }
    
    // If no results from biblical sources, search Gemini
    const totalBiblicalResults = results.jesus_quotes.length + 
                                results.biblical_texts.length + 
                                results.lexicon.length;
    
    if (totalBiblicalResults === 0) {
      logger.info('No biblical results found, searching Gemini');
      const geminiResults = await searchGemini(query);
      results.gemini_results = geminiResults;
    }
    
    // Log search analytics
    await logSearchQuery(query, totalBiblicalResults, Date.now() - startTime);
    
    // Cache results for 5 minutes
    await setCachedResult(cacheKey, results, 300);
    
    res.json({
      success: true,
      data: results,
      source: 'database',
      responseTime: Date.now() - startTime,
      totalResults: totalBiblicalResults
    });
    
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error.message
    });
  }
});

// Search Jesus quotes
async function searchJesusQuotes(query, limit) {
  const sql = `
    SELECT id, quote, reference, book, topic, keywords, priority
    FROM jesus_quotes 
    WHERE to_tsvector('english', quote) @@ plainto_tsquery('english', $1)
       OR $1 = ANY(keywords)
       OR topic ILIKE $2
    ORDER BY priority ASC, ts_rank(to_tsvector('english', quote), plainto_tsquery('english', $1)) DESC
    LIMIT $3
  `;
  
  const result = await executeQuery(sql, [query, `%${query}%`, limit]);
  return result.rows;
}

// Search biblical texts
async function searchBiblicalTexts(query, limit) {
  const sql = `
    SELECT id, book, chapter, verse, text, translation, metadata
    FROM biblical_texts 
    WHERE to_tsvector('english', text) @@ plainto_tsquery('english', $1)
       OR book ILIKE $2
    ORDER BY ts_rank(to_tsvector('english', text), plainto_tsquery('english', $1)) DESC
    LIMIT $3
  `;
  
  const result = await executeQuery(sql, [query, `%${query}%`, limit]);
  return result.rows;
}

// Search lexicon
async function searchLexicon(query, limit) {
  const sql = `
    SELECT id, term, definition, examples, priority
    FROM biblical_lexicon 
    WHERE to_tsvector('english', definition) @@ plainto_tsquery('english', $1)
       OR term ILIKE $2
    ORDER BY priority ASC, ts_rank(to_tsvector('english', definition), plainto_tsquery('english', $1)) DESC
    LIMIT $3
  `;
  
  const result = await executeQuery(sql, [query, `%${query}%`, limit]);
  return result.rows;
}

// Log search query for analytics
async function logSearchQuery(query, resultsCount, responseTime) {
  const sql = `
    INSERT INTO search_queries (query, results_count, response_time_ms, source)
    VALUES ($1, $2, $3, $4)
  `;
  
  try {
    await executeQuery(sql, [query, resultsCount, responseTime, 'api']);
  } catch (error) {
    logger.error('Failed to log search query:', error);
  }
}

// Get search statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await executeQuery(`
      SELECT 
        COUNT(*) as total_searches,
        AVG(response_time_ms) as avg_response_time,
        COUNT(CASE WHEN results_count > 0 THEN 1 END) as successful_searches,
        COUNT(CASE WHEN results_count = 0 THEN 1 END) as no_result_searches
      FROM search_queries 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `);
    
    res.json({
      success: true,
      data: stats.rows[0]
    });
    
  } catch (error) {
    logger.error('Failed to get search stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
});

// Get popular searches
router.get('/popular', async (req, res) => {
  try {
    const popular = await executeQuery(`
      SELECT query, COUNT(*) as search_count
      FROM search_queries 
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY query 
      ORDER BY search_count DESC 
      LIMIT 10
    `);
    
    res.json({
      success: true,
      data: popular.rows
    });
    
  } catch (error) {
    logger.error('Failed to get popular searches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get popular searches'
    });
  }
});

module.exports = router; 