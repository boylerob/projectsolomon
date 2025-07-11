const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'storage' },
  transports: [
    new winston.transports.Console()
  ]
});

// Initialize storage service
async function initializeStorage() {
  try {
    logger.info('Initializing storage service...');
    
    // For now, just log that storage is not configured
    logger.info('Storage service initialized (placeholder mode)');
    
    return true;
  } catch (error) {
    logger.error('Failed to initialize storage:', error);
    // Don't throw error - storage is optional
    return false;
  }
}

module.exports = {
  initializeStorage,
  logger
}; 