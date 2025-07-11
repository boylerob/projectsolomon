const { Pool } = require('pg');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'database' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/database.log' })
  ]
});

let pool = null;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'solomon_biblical',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Initialize database connection
async function initializeDatabase() {
  try {
    logger.info('Initializing database connection...');
    
    pool = new Pool(dbConfig);
    
    // Test connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    logger.info('Database connection established successfully');
    
    // Create tables if they don't exist
    await createTables();
    
    return pool;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

// Create database tables
async function createTables() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Biblical texts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS biblical_texts (
        id SERIAL PRIMARY KEY,
        book VARCHAR(50) NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        text TEXT NOT NULL,
        translation VARCHAR(20) DEFAULT 'ASV',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(book, chapter, verse, translation)
      )
    `);
    
    // Jesus quotes table (Priority 1)
    await client.query(`
      CREATE TABLE IF NOT EXISTS jesus_quotes (
        id SERIAL PRIMARY KEY,
        quote TEXT NOT NULL,
        reference VARCHAR(50) NOT NULL,
        book VARCHAR(50) NOT NULL,
        topic VARCHAR(100),
        keywords TEXT[],
        priority INTEGER DEFAULT 1,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Biblical lexicon table (Priority 2)
    await client.query(`
      CREATE TABLE IF NOT EXISTS biblical_lexicon (
        id SERIAL PRIMARY KEY,
        term VARCHAR(100) NOT NULL UNIQUE,
        definition TEXT NOT NULL,
        examples TEXT[],
        priority INTEGER DEFAULT 2,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Search queries table for analytics
    await client.query(`
      CREATE TABLE IF NOT EXISTS search_queries (
        id SERIAL PRIMARY KEY,
        query TEXT NOT NULL,
        user_id VARCHAR(100),
        results_count INTEGER,
        response_time_ms INTEGER,
        source VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_biblical_texts_search 
      ON biblical_texts USING gin(to_tsvector('english', text))
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_jesus_quotes_search 
      ON jesus_quotes USING gin(to_tsvector('english', quote))
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_lexicon_search 
      ON biblical_lexicon USING gin(to_tsvector('english', definition))
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_biblical_reference 
      ON biblical_texts(book, chapter, verse)
    `);
    
    await client.query('COMMIT');
    logger.info('Database tables created successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to create tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Get database pool
function getPool() {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
}

// Execute query with error handling
async function executeQuery(query, params = []) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(query, params);
    return result;
  } catch (error) {
    logger.error('Query execution failed:', { query, params, error: error.message });
    throw error;
  } finally {
    client.release();
  }
}

// Close database connection
async function closeDatabase() {
  if (pool) {
    await pool.end();
    logger.info('Database connection closed');
  }
}

module.exports = {
  initializeDatabase,
  getPool,
  executeQuery,
  closeDatabase,
  logger
}; 