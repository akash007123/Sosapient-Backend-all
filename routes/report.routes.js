const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticateToken } = require('../middleware/auth');

// Get all reports (with filters)
router.get('/reports', authenticateToken, reportController.getReports);

// Add a new report
router.post('/reports', authenticateToken, reportController.addReport);

// Update a report
router.put('/reports/:id', authenticateToken, reportController.updateReport);

module.exports = router; 