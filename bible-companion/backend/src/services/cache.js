const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'cache' },
  transports: [
    new winston.transports.Console()
  ]
});

// Simple in-memory cache for development
const memoryCache = new Map();

// Initialize cache service
async function initializeCache() {
  try {
    logger.info('Initializing cache service...');
    
    // For now, use in-memory cache
    // In production, this would connect to Redis
    logger.info('Cache service initialized (in-memory mode)');
    
    return true;
  } catch (error) {
    logger.error('Failed to initialize cache:', error);
    // Don't throw error - cache is optional
    return false;
  }
}

// Get cached result
function getCachedResult(key) {
  const cached = memoryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }
  if (cached) {
    memoryCache.delete(key);
  }
  return null;
}

// Set cached result
function setCachedResult(key, value, ttlSeconds = 300) {
  const expiresAt = Date.now() + (ttlSeconds * 1000);
  memoryCache.set(key, { value, expiresAt });
}

// Clear cache
function clearCache() {
  memoryCache.clear();
}

// Get cache stats
function getCacheStats() {
  return {
    size: memoryCache.size,
    type: 'memory'
  };
}

module.exports = {
  initializeCache,
  getCachedResult,
  setCachedResult,
  clearCache,
  getCacheStats,
  logger
}; 