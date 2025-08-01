const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboard.controller');
const { authenticateToken } = require('../middleware/auth');

// Get dashboard statistics
router.get('/stats', authenticateToken, getDashboardStats);

module.exports = router; 