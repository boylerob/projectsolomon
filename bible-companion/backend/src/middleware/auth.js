// Simple auth middleware placeholder
function authMiddleware(req, res, next) {
  // For now, just pass through
  // In production, this would validate authentication
  next();
}

module.exports = {
  authMiddleware
}; 