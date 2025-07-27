const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const auth = require('../middleware/auth');

// Get all reports (with filters)
router.get('/reports', auth, reportController.getReports);

// Add a new report
router.post('/reports', auth, reportController.addReport);

// Update a report
router.put('/reports/:id', auth, reportController.updateReport);

module.exports = router; 