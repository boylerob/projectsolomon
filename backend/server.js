const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Storage } = require('@google-cloud/storage');
const TinyLLamaAgentService = require('./services/TinyLLamaAgentService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8081'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (admin interface)
app.use(express.static('public'));

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Cache management (in-memory for now)
const memoryCache = new Map();

// Google AI setup
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Google Cloud Storage setup
const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || 'solomon-biblical-data';

// Initialize database tables
async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database tables...');
    
    // Create learning system tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS query_patterns (
        id SERIAL PRIMARY KEY,
        pattern_hash VARCHAR(32) UNIQUE NOT NULL,
        normalized_pattern TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'general',
        keywords TEXT[] DEFAULT '{}',
        usage_count INTEGER DEFAULT 1,
        confidence_score DECIMAL(3,2) DEFAULT 0.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_responses (
        id SERIAL PRIMARY KEY,
        original_query TEXT NOT NULL,
        response_summary TEXT NOT NULL,
        response_length INTEGER NOT NULL,
        biblical_references JSONB DEFAULT '[]',
        key_topics TEXT[] DEFAULT '{}',
        sentiment_score DECIMAL(3,2) DEFAULT 0.0,
        complexity_level INTEGER DEFAULT 1,
        user_context JSONB DEFAULT '{}',
        pattern_id INTEGER REFERENCES query_patterns(id),
        success_metrics JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create knowledge base tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS knowledge_sources (
        id SERIAL PRIMARY KEY,
        source_name VARCHAR(255) NOT NULL,
        source_type VARCHAR(50) NOT NULL,
        source_url TEXT,
        file_path TEXT,
        author VARCHAR(255),
        publication_date DATE,
        authority_level INTEGER NOT NULL DEFAULT 3,
        content_length INTEGER,
        processing_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS knowledge_chunks (
        id SERIAL PRIMARY KEY,
        source_id INTEGER REFERENCES knowledge_sources(id) ON DELETE CASCADE,
        chunk_text TEXT NOT NULL,
        chunk_summary TEXT,
        key_concepts TEXT[] DEFAULT '{}',
        biblical_references TEXT[] DEFAULT '{}',
        theological_themes TEXT[] DEFAULT '{}',
        authority_score DECIMAL(3,2) DEFAULT 0.0,
        consensus_score DECIMAL(3,2) DEFAULT 0.0,
        conflict_flags TEXT[] DEFAULT '{}',
        chunk_type VARCHAR(50) DEFAULT 'general',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS authority_levels (
        id SERIAL PRIMARY KEY,
        level_name VARCHAR(100) NOT NULL,
        level_number INTEGER UNIQUE NOT NULL,
        weight DECIMAL(3,2) NOT NULL,
        description TEXT,
        examples TEXT[]
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS concept_consensus (
        id SERIAL PRIMARY KEY,
        concept_text TEXT NOT NULL,
        concept_hash VARCHAR(64) UNIQUE NOT NULL,
        supporting_sources INTEGER DEFAULT 1,
        opposing_sources INTEGER DEFAULT 0,
        biblical_alignment DECIMAL(3,2) DEFAULT 1.0,
        consensus_score DECIMAL(3,2) DEFAULT 0.0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS authority_conflicts (
        id SERIAL PRIMARY KEY,
        source_id INTEGER REFERENCES knowledge_sources(id) ON DELETE CASCADE,
        chunk_id INTEGER REFERENCES knowledge_chunks(id) ON DELETE CASCADE,
        conflict_type VARCHAR(50) NOT NULL,
        conflict_description TEXT NOT NULL,
        biblical_reference TEXT,
        severity_level INTEGER DEFAULT 1,
        resolved BOOLEAN DEFAULT FALSE,
        resolution_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS processing_jobs (
        id SERIAL PRIMARY KEY,
        source_id INTEGER REFERENCES knowledge_sources(id) ON DELETE CASCADE,
        job_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        progress_percentage INTEGER DEFAULT 0,
        error_message TEXT,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes for performance
    await pool.query('CREATE INDEX IF NOT EXISTS idx_patterns_hash ON query_patterns(pattern_hash)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_patterns_category ON query_patterns(category)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_patterns_usage ON query_patterns(usage_count DESC)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_patterns_keywords ON query_patterns USING GIN(keywords)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_responses_pattern ON ai_responses(pattern_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_responses_created ON ai_responses(created_at DESC)');
    
    // Knowledge base indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sources_type ON knowledge_sources(source_type)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sources_authority ON knowledge_sources(authority_level)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sources_status ON knowledge_sources(processing_status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_chunks_source ON knowledge_chunks(source_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_chunks_concepts ON knowledge_chunks USING GIN(key_concepts)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_chunks_biblical ON knowledge_chunks USING GIN(biblical_references)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_chunks_themes ON knowledge_chunks USING GIN(theological_themes)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_chunks_authority ON knowledge_chunks(authority_score DESC)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_consensus_concept ON concept_consensus(concept_hash)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_consensus_score ON concept_consensus(consensus_score DESC)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_conflicts_source ON authority_conflicts(source_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_jobs_status ON processing_jobs(status)');
    
    // Create Gemini analysis table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gemini_analysis (
        id SERIAL PRIMARY KEY,
        verse_reference VARCHAR(100) NOT NULL,
        book VARCHAR(50) NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        user_query TEXT NOT NULL,
        historical_context TEXT,
        theological_significance TEXT,
        key_themes TEXT[] DEFAULT '{}',
        practical_applications TEXT[] DEFAULT '{}',
        related_concepts TEXT[] DEFAULT '{}',
        scholarly_perspectives TEXT,
        analysis_confidence DECIMAL(3,2) DEFAULT 0.0,
        processing_time_ms INTEGER,
        model_version VARCHAR(50) DEFAULT 'gemini-2.0-flash-exp',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes for Gemini analysis
    await pool.query('CREATE INDEX IF NOT EXISTS idx_gemini_verse_ref ON gemini_analysis(verse_reference)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_gemini_book_chapter_verse ON gemini_analysis(book, chapter, verse)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_gemini_created_at ON gemini_analysis(created_at DESC)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_gemini_themes ON gemini_analysis USING GIN(key_themes)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_gemini_applications ON gemini_analysis USING GIN(practical_applications)');
    
    // Insert authority levels if they don't exist
    await pool.query(`
      INSERT INTO authority_levels (level_name, level_number, weight, description, examples) VALUES
      ('Biblical Authority', 1, 1.0, 'Direct words of God, Jesus, Apostles, and Prophets', ARRAY['Jesus teachings', 'Apostolic letters', 'Prophetic writings']),
      ('Apostolic Tradition', 2, 0.9, 'Early church fathers and apostolic successors', ARRAY['Church fathers', 'Early creeds', 'Apostolic tradition']),
      ('Scholarly Consensus', 3, 0.7, 'Academic theological scholarship and research', ARRAY['Biblical commentaries', 'Theological journals', 'Academic research']),
      ('Personal Opinion', 4, 0.3, 'Individual perspectives and personal interpretations', ARRAY['Blog posts', 'Personal websites', 'Opinion pieces'])
      ON CONFLICT (level_number) DO NOTHING
    `);
    
    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Biblical data search endpoint
app.get('/api/search', async (req, res) => {
  try {
    const { query, book, chapter, verse, topic, limit = 50 } = req.query;
    
    if (!query && !book && !chapter && !verse && !topic) {
      return res.status(400).json({ error: 'At least one search parameter is required' });
    }

    let sqlQuery = `
      SELECT 
        book, chapter, verse, text, 
        ts_rank(to_tsvector('english', text), plainto_tsquery('english', $1)) as relevance
      FROM biblical_verses 
      WHERE 1=1
    `;
    const params = [query || ''];
    let paramIndex = 2;

    if (book) {
      sqlQuery += ` AND LOWER(book) = LOWER($${paramIndex})`;
      params.push(book);
      paramIndex++;
    }

    if (chapter) {
      sqlQuery += ` AND chapter = $${paramIndex}`;
      params.push(parseInt(chapter));
      paramIndex++;
    }

    if (verse) {
      sqlQuery += ` AND verse = $${paramIndex}`;
      params.push(parseInt(verse));
      paramIndex++;
    }

    if (topic) {
      sqlQuery += ` AND to_tsvector('english', text) @@ plainto_tsquery('english', $${paramIndex})`;
      params.push(topic);
      paramIndex++;
    }

    sqlQuery += ` ORDER BY relevance DESC, book, chapter, verse LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await pool.query(sqlQuery, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      results: result.rows
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Jesus quotes endpoint
app.get('/api/jesus-quotes', async (req, res) => {
  try {
    const { topic, book, keyword, limit = 20 } = req.query;
    
    let sqlQuery = `
      SELECT book, chapter, verse, text, context
      FROM jesus_quotes 
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (topic) {
      sqlQuery += ` AND LOWER(topic) LIKE LOWER($${paramIndex})`;
      params.push(`%${topic}%`);
      paramIndex++;
    }

    if (book) {
      sqlQuery += ` AND LOWER(book) = LOWER($${paramIndex})`;
      params.push(book);
      paramIndex++;
    }

    if (keyword) {
      sqlQuery += ` AND to_tsvector('english', text) @@ plainto_tsquery('english', $${paramIndex})`;
      params.push(keyword);
      paramIndex++;
    }

    sqlQuery += ` ORDER BY book, chapter, verse LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await pool.query(sqlQuery, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      quotes: result.rows
    });

  } catch (error) {
    console.error('Jesus quotes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI-enhanced search endpoint
app.post('/api/ai-search', async (req, res) => {
  try {
    const { query, context, useGemini = true } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // First, get relevant biblical data
    const biblicalResults = await pool.query(`
      SELECT book, chapter, verse, text
      FROM biblical_verses 
      WHERE to_tsvector('english', text) @@ plainto_tsquery('english', $1)
      ORDER BY ts_rank(to_tsvector('english', text), plainto_tsquery('english', $1)) DESC
      LIMIT 10
    `, [query]);

    if (useGemini && genAI) {
      // Enhance with Gemini AI
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `
        Based on the following biblical context and the user's question, provide a thoughtful, 
        theologically sound response that draws from the provided verses and general biblical wisdom.
        
        User Question: ${query}
        Context: ${context || 'General biblical inquiry'}
        
        Relevant Biblical Verses:
        ${biblicalResults.rows.map(row => `${row.book} ${row.chapter}:${row.verse} - ${row.text}`).join('\n')}
        
        Please provide a response that:
        1. Addresses the user's question directly
        2. References specific biblical passages when relevant
        3. Maintains theological accuracy
        4. Is helpful and encouraging
        5. Keeps the response concise but comprehensive
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      res.json({
        success: true,
        query,
        biblicalContext: biblicalResults.rows,
        aiResponse: text,
        timestamp: new Date().toISOString()
      });
    } else {
      // Return just the biblical data
      res.json({
        success: true,
        query,
        results: biblicalResults.rows,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('AI search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cache management endpoint
app.post('/api/cache/clear', async (req, res) => {
  try {
    memoryCache.clear();
    res.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// ===== LEARNING SYSTEM ENDPOINTS =====

// Store learning query and response
app.post('/api/learning/store', async (req, res) => {
  try {
    const { 
      originalQuery, 
      aiResponse, 
      biblicalReferences, 
      userContext, 
      patternHash,
      successMetrics = {}
    } = req.body;
    
    if (!originalQuery || !aiResponse) {
      return res.status(400).json({ error: 'Original query and AI response are required' });
    }

    // Generate pattern hash if not provided
    const hash = patternHash || generatePatternHash(originalQuery);
    
    // Store or update pattern
    let patternId = await getOrCreatePattern(hash, originalQuery);
    
    // Store AI response
    const responseId = await storeAIResponse({
      originalQuery,
      aiResponse,
      biblicalReferences,
      userContext,
      patternId,
      successMetrics
    });
    
    res.json({ 
      success: true, 
      patternId, 
      responseId,
      patternHash: hash
    });
  } catch (error) {
    console.error('Learning store error:', error);
    res.status(500).json({ error: 'Failed to store learning data' });
  }
});

// Find similar queries
app.get('/api/learning/find-similar', async (req, res) => {
  try {
    const { query, limit = 5 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const similar = await findSimilarQueries(query, parseInt(limit));
    res.json({ success: true, results: similar });
  } catch (error) {
    console.error('Learning find error:', error);
    res.status(500).json({ error: 'Failed to find similar queries' });
  }
});

// Get top patterns
app.get('/api/learning/patterns', async (req, res) => {
  try {
    const { limit = 50, category } = req.query;
    const patterns = await getTopPatterns(parseInt(limit), category);
    res.json({ success: true, patterns });
  } catch (error) {
    console.error('Patterns error:', error);
    res.status(500).json({ error: 'Failed to get patterns' });
  }
});

// Get response statistics
app.get('/api/learning/stats', async (req, res) => {
  try {
    const stats = await getLearningStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get learning stats' });
  }
});

// ===== KNOWLEDGE BASE ENDPOINTS =====

// Add a new knowledge source
app.post('/api/knowledge/sources', async (req, res) => {
  try {
    const { 
      sourceName, 
      sourceType, 
      sourceUrl, 
      filePath, 
      author, 
      publicationDate, 
      authorityLevel = 3 
    } = req.body;
    
    if (!sourceName || !sourceType) {
      return res.status(400).json({ error: 'Source name and type are required' });
    }

    const result = await pool.query(
      `INSERT INTO knowledge_sources 
       (source_name, source_type, source_url, file_path, author, publication_date, authority_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [sourceName, sourceType, sourceUrl, filePath, author, publicationDate, authorityLevel]
    );
    
    const sourceId = result.rows[0].id;
    
    // Create processing job
    const jobType = sourceUrl ? 'web_scrape' : 'file_upload';
    await pool.query(
      `INSERT INTO processing_jobs (source_id, job_type, status) VALUES ($1, $2, 'pending')`,
      [sourceId, jobType]
    );
    
    res.json({ 
      success: true, 
      sourceId, 
      message: 'Source added and queued for processing' 
    });
  } catch (error) {
    console.error('Knowledge source error:', error);
    res.status(500).json({ error: 'Failed to add knowledge source' });
  }
});

// Get all knowledge sources
app.get('/api/knowledge/sources', async (req, res) => {
  try {
    const { status, type, limit = 50 } = req.query;
    
    let query = `
      SELECT ks.*, pj.status as job_status, pj.progress_percentage
      FROM knowledge_sources ks
      LEFT JOIN processing_jobs pj ON ks.id = pj.source_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND ks.processing_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (type) {
      query += ` AND ks.source_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    query += ` ORDER BY ks.created_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    res.json({ success: true, sources: result.rows });
  } catch (error) {
    console.error('Get sources error:', error);
    res.status(500).json({ error: 'Failed to get knowledge sources' });
  }
});

// Search knowledge base
app.get('/api/knowledge/search', async (req, res) => {
  try {
    const { query, authorityLevel, theme, limit = 20 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    let sqlQuery = `
      SELECT 
        kc.id,
        kc.chunk_text,
        kc.chunk_summary,
        kc.key_concepts,
        kc.biblical_references,
        kc.theological_themes,
        kc.authority_score,
        kc.consensus_score,
        ks.source_name,
        ks.source_type,
        al.level_name,
        al.weight as authority_weight
      FROM knowledge_chunks kc
      JOIN knowledge_sources ks ON kc.source_id = ks.id
      JOIN authority_levels al ON ks.authority_level = al.level_number
      WHERE ks.processing_status = 'completed'
    `;
    const params = [query];
    let paramIndex = 2;

    // Add search conditions
    sqlQuery += ` AND (
      to_tsvector('english', kc.chunk_text) @@ plainto_tsquery('english', $1) OR
      kc.key_concepts && $1::text[] OR
      kc.theological_themes && $1::text[]
    )`;

    if (authorityLevel) {
      sqlQuery += ` AND ks.authority_level <= $${paramIndex}`;
      params.push(parseInt(authorityLevel));
      paramIndex++;
    }

    if (theme) {
      sqlQuery += ` AND $${paramIndex} = ANY(kc.theological_themes)`;
      params.push(theme);
      paramIndex++;
    }

    sqlQuery += ` ORDER BY kc.authority_score DESC, kc.consensus_score DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await pool.query(sqlQuery, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      results: result.rows
    });
  } catch (error) {
    console.error('Knowledge search error:', error);
    res.status(500).json({ error: 'Failed to search knowledge base' });
  }
});

// Get consensus data
app.get('/api/knowledge/consensus', async (req, res) => {
  try {
    const { concept, limit = 20 } = req.query;
    
    let query = `
      SELECT concept_text, supporting_sources, opposing_sources, 
             biblical_alignment, consensus_score, last_updated
      FROM concept_consensus
    `;
    const params = [];
    
    if (concept) {
      query += ` WHERE concept_text ILIKE $1`;
      params.push(`%${concept}%`);
    }
    
    query += ` ORDER BY consensus_score DESC, biblical_alignment DESC LIMIT $1`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    res.json({ success: true, consensus: result.rows });
  } catch (error) {
    console.error('Consensus error:', error);
    res.status(500).json({ error: 'Failed to get consensus data' });
  }
});

// Get conflicts
app.get('/api/knowledge/conflicts', async (req, res) => {
  try {
    const { severity, resolved, limit = 20 } = req.query;
    
    let query = `
      SELECT 
        ac.id,
        ac.conflict_type,
        ac.conflict_description,
        ac.biblical_reference,
        ac.severity_level,
        ac.resolved,
        ks.source_name,
        kc.chunk_summary
      FROM authority_conflicts ac
      JOIN knowledge_sources ks ON ac.source_id = ks.id
      LEFT JOIN knowledge_chunks kc ON ac.chunk_id = kc.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (severity) {
      query += ` AND ac.severity_level >= $${paramIndex}`;
      params.push(parseInt(severity));
      paramIndex++;
    }
    
    if (resolved !== undefined) {
      query += ` AND ac.resolved = $${paramIndex}`;
      params.push(resolved === 'true');
      paramIndex++;
    }
    
    query += ` ORDER BY ac.severity_level DESC, ac.created_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    res.json({ success: true, conflicts: result.rows });
  } catch (error) {
    console.error('Conflicts error:', error);
    res.status(500).json({ error: 'Failed to get conflicts' });
  }
});

// Get processing jobs
app.get('/api/knowledge/jobs', async (req, res) => {
  try {
    const { status, limit = 20 } = req.query;
    
    let query = `
      SELECT 
        pj.*,
        ks.source_name,
        ks.source_type
      FROM processing_jobs pj
      JOIN knowledge_sources ks ON pj.source_id = ks.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND pj.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    query += ` ORDER BY pj.created_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    res.json({ success: true, jobs: result.rows });
  } catch (error) {
    console.error('Jobs error:', error);
    res.status(500).json({ error: 'Failed to get processing jobs' });
  }
});

// Update job status
app.put('/api/knowledge/jobs/:sourceId', async (req, res) => {
  try {
    const { sourceId } = req.params;
    const { status, progressPercentage, errorMessage } = req.body;
    
    const result = await pool.query(
      `UPDATE processing_jobs 
       SET status = $1, progress_percentage = $2, error_message = $3,
           started_at = CASE WHEN $1 = 'processing' AND started_at IS NULL THEN CURRENT_TIMESTAMP ELSE started_at END,
           completed_at = CASE WHEN $1 IN ('completed', 'failed') THEN CURRENT_TIMESTAMP ELSE completed_at END
       WHERE source_id = $4 RETURNING *`,
      [status, progressPercentage, errorMessage, sourceId]
    );
    
    if (result.rows.length > 0) {
      res.json({ success: true, job: result.rows[0] });
    } else {
      res.status(404).json({ error: 'Job not found' });
    }
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// Get source by ID
app.get('/api/knowledge/sources/:sourceId', async (req, res) => {
  try {
    const { sourceId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM knowledge_sources WHERE id = $1',
      [sourceId]
    );
    
    if (result.rows.length > 0) {
      res.json({ success: true, source: result.rows[0] });
    } else {
      res.status(404).json({ error: 'Source not found' });
    }
  } catch (error) {
    console.error('Get source error:', error);
    res.status(500).json({ error: 'Failed to get source' });
  }
});

// Store content chunks
app.post('/api/knowledge/chunks', async (req, res) => {
  try {
    const {
      sourceId,
      chunkText,
      chunkSummary,
      keyConcepts,
      biblicalReferences,
      theologicalThemes,
      authorityScore,
      consensusScore,
      conflictFlags,
      chunkType
    } = req.body;
    
    if (!sourceId || !chunkText) {
      return res.status(400).json({ error: 'Source ID and chunk text are required' });
    }
    
    const result = await pool.query(
      `INSERT INTO knowledge_chunks 
       (source_id, chunk_text, chunk_summary, key_concepts, biblical_references, 
        theological_themes, authority_score, consensus_score, conflict_flags, chunk_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [sourceId, chunkText, chunkSummary, keyConcepts, biblicalReferences,
       theologicalThemes, authorityScore, consensusScore, conflictFlags, chunkType]
    );
    
    // Update source processing status if this is the first chunk
    await pool.query(
      'UPDATE knowledge_sources SET processing_status = $1 WHERE id = $2',
      ['completed', sourceId]
    );
    
    res.json({ success: true, chunkId: result.rows[0].id });
  } catch (error) {
    console.error('Store chunk error:', error);
    res.status(500).json({ error: 'Failed to store chunk' });
  }
});

// ===== LEARNING SYSTEM HELPER FUNCTIONS =====

// Generate pattern hash
function generatePatternHash(query) {
  const crypto = require('crypto');
  const normalized = query.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .sort()
    .join(' ');
  return crypto.createHash('md5').update(normalized).digest('hex');
}

// Get or create pattern
async function getOrCreatePattern(patternHash, originalQuery) {
  try {
    // Check if pattern exists
    const existing = await pool.query(
      'SELECT id FROM query_patterns WHERE pattern_hash = $1',
      [patternHash]
    );
    
    if (existing.rows.length > 0) {
      // Update usage count
      await pool.query(
        'UPDATE query_patterns SET usage_count = usage_count + 1 WHERE pattern_hash = $1',
        [patternHash]
      );
      return existing.rows[0].id;
    }
    
    // Create new pattern
    const keywords = extractKeywords(originalQuery);
    const category = categorizeQuery(originalQuery);
    
    const result = await pool.query(
      `INSERT INTO query_patterns (pattern_hash, normalized_pattern, category, keywords, confidence_score)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [patternHash, originalQuery.toLowerCase(), category, keywords, 0.0]
    );
    
    return result.rows[0].id;
  } catch (error) {
    console.error('Error in getOrCreatePattern:', error);
    throw error;
  }
}

// Store AI response
async function storeAIResponse({ originalQuery, aiResponse, biblicalReferences, userContext, patternId, successMetrics }) {
  try {
    const responseSummary = aiResponse.substring(0, 500);
    const responseLength = aiResponse.length;
    const keyTopics = extractKeywords(aiResponse);
    const sentimentScore = analyzeSentiment(aiResponse);
    const complexityLevel = calculateComplexity(aiResponse);
    
    const result = await pool.query(
      `INSERT INTO ai_responses 
       (original_query, response_summary, response_length, biblical_references, key_topics, 
        sentiment_score, complexity_level, user_context, pattern_id, success_metrics)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [originalQuery, responseSummary, responseLength, biblicalReferences, keyTopics,
       sentimentScore, complexityLevel, userContext, patternId, successMetrics]
    );
    
    return result.rows[0].id;
  } catch (error) {
    console.error('Error in storeAIResponse:', error);
    throw error;
  }
}

// Find similar queries
async function findSimilarQueries(query, limit) {
  try {
    const queryKeywords = extractKeywords(query);
    const queryHash = generatePatternHash(query);
    
    // Find patterns with similar keywords
    const result = await pool.query(
      `SELECT 
         qp.id as pattern_id,
         qp.pattern_hash,
         qp.normalized_pattern,
         qp.category,
         qp.usage_count,
         ar.id as response_id,
         ar.original_query,
         ar.response_summary,
         ar.biblical_references,
         ar.success_metrics
       FROM query_patterns qp
       LEFT JOIN ai_responses ar ON qp.id = ar.pattern_id
       WHERE qp.keywords && $1 OR qp.pattern_hash = $2
       ORDER BY qp.usage_count DESC, qp.confidence_score DESC
       LIMIT $3`,
      [queryKeywords, queryHash, limit]
    );
    
    return result.rows.map(row => ({
      patternHash: row.pattern_hash,
      originalQuery: row.original_query,
      responseSummary: row.response_summary,
      biblicalReferences: row.biblical_references,
      usageCount: row.usage_count,
      category: row.category,
      similarity: calculateSimilarity(query, row.normalized_pattern)
    }));
  } catch (error) {
    console.error('Error in findSimilarQueries:', error);
    throw error;
  }
}

// Get top patterns
async function getTopPatterns(limit, category = null) {
  try {
    let query = `
      SELECT 
        pattern_hash,
        normalized_pattern,
        category,
        usage_count,
        confidence_score,
        created_at
      FROM query_patterns
    `;
    const params = [];
    
    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }
    
    query += ' ORDER BY usage_count DESC, confidence_score DESC LIMIT $' + (params.length + 1);
    params.push(limit);
    
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error in getTopPatterns:', error);
    throw error;
  }
}

// Get learning statistics
async function getLearningStats() {
  try {
    const patternsResult = await pool.query('SELECT COUNT(*) as total_patterns FROM query_patterns');
    const responsesResult = await pool.query('SELECT COUNT(*) as total_responses FROM ai_responses');
    const topCategoryResult = await pool.query(`
      SELECT category, COUNT(*) as count 
      FROM query_patterns 
      GROUP BY category 
      ORDER BY count DESC 
      LIMIT 1
    `);
    
    return {
      totalPatterns: parseInt(patternsResult.rows[0].total_patterns),
      totalResponses: parseInt(responsesResult.rows[0].total_responses),
      topCategory: topCategoryResult.rows[0] || null
    };
  } catch (error) {
    console.error('Error in getLearningStats:', error);
    throw error;
  }
}

// Helper functions
function extractKeywords(text) {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 10); // Limit to top 10 keywords
}

function categorizeQuery(query) {
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('pray') || lowerQuery.includes('prayer')) return 'prayer';
  if (lowerQuery.includes('bible') || lowerQuery.includes('scripture')) return 'interpretation';
  if (lowerQuery.includes('how') || lowerQuery.includes('what') || lowerQuery.includes('why')) return 'guidance';
  if (lowerQuery.includes('jesus') || lowerQuery.includes('christ')) return 'christology';
  return 'general';
}

function analyzeSentiment(text) {
  // Simple sentiment analysis - can be enhanced later
  const positiveWords = ['love', 'joy', 'peace', 'hope', 'faith', 'bless', 'good', 'great'];
  const negativeWords = ['sin', 'evil', 'sad', 'bad', 'wrong', 'hate', 'anger'];
  
  const words = text.toLowerCase().split(/\s+/);
  const positiveCount = words.filter(word => positiveWords.includes(word)).length;
  const negativeCount = words.filter(word => negativeWords.includes(word)).length;
  
  return (positiveCount - negativeCount) / Math.max(words.length, 1);
}

function calculateComplexity(text) {
  // Simple complexity calculation based on sentence length and vocabulary
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
  
  if (avgSentenceLength < 10) return 1;
  if (avgSentenceLength < 15) return 2;
  if (avgSentenceLength < 20) return 3;
  if (avgSentenceLength < 25) return 4;
  return 5;
}

function calculateSimilarity(query1, query2) {
  const words1 = new Set(extractKeywords(query1));
  const words2 = new Set(extractKeywords(query2));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

// Initialize TinyLLama Agent Service
const tinyLLamaAgent = new TinyLLamaAgentService();

// TinyLLama Agent Endpoints
app.post('/api/agent/analyze-content', async (req, res) => {
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

app.post('/api/agent/comprehensive-response', async (req, res) => {
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

app.post('/api/agent/analyze-query', async (req, res) => {
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

app.post('/api/agent/validate-content', async (req, res) => {
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

app.post('/api/agent/synthesize-knowledge', async (req, res) => {
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

app.get('/api/agent/status', async (req, res) => {
  try {
    const status = tinyLLamaAgent.getStatus();
    res.json({ success: true, status });
  } catch (error) {
    console.error('Error getting agent status:', error);
    res.status(500).json({ error: 'Failed to get agent status' });
  }
});

// Gemini Analysis Endpoints
app.get('/api/gemini-analysis', async (req, res) => {
  try {
    const { verse_reference, book, chapter, verse, limit = 50 } = req.query;
    
    let sqlQuery = `
      SELECT * FROM gemini_analysis 
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (verse_reference) {
      sqlQuery += ` AND verse_reference ILIKE $${paramIndex}`;
      params.push(`%${verse_reference}%`);
      paramIndex++;
    }

    if (book) {
      sqlQuery += ` AND LOWER(book) = LOWER($${paramIndex})`;
      params.push(book);
      paramIndex++;
    }

    if (chapter) {
      sqlQuery += ` AND chapter = $${paramIndex}`;
      params.push(parseInt(chapter));
      paramIndex++;
    }

    if (verse) {
      sqlQuery += ` AND verse = $${paramIndex}`;
      params.push(parseInt(verse));
      paramIndex++;
    }

    sqlQuery += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await pool.query(sqlQuery, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      analyses: result.rows
    });

  } catch (error) {
    console.error('Gemini analysis retrieval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/gemini-analysis/stats', async (req, res) => {
  try {
    // Get total count
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM gemini_analysis');
    
    // Get average processing time
    const avgTimeResult = await pool.query('SELECT AVG(processing_time_ms) as avg_time FROM gemini_analysis');
    
    // Get most analyzed verses
    const topVersesResult = await pool.query(`
      SELECT verse_reference, COUNT(*) as analysis_count 
      FROM gemini_analysis 
      GROUP BY verse_reference 
      ORDER BY analysis_count DESC 
      LIMIT 10
    `);
    
    // Get analysis by model version
    const modelStatsResult = await pool.query(`
      SELECT model_version, COUNT(*) as count 
      FROM gemini_analysis 
      GROUP BY model_version
    `);
    
    res.json({
      success: true,
      stats: {
        totalAnalyses: parseInt(totalResult.rows[0].total),
        averageProcessingTime: parseFloat(avgTimeResult.rows[0].avg_time || 0),
        topVerses: topVersesResult.rows,
        modelStats: modelStatsResult.rows
      }
    });

  } catch (error) {
    console.error('Gemini analysis stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Solomon Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  
  // Initialize database tables
  await initializeDatabase();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await pool.end();
  process.exit(0);
}); 