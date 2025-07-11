const express = require('express');
const router = express.Router();

// Placeholder data routes
router.get('/', (req, res) => {
  res.json({ message: 'Data routes placeholder' });
});

module.exports = router; 