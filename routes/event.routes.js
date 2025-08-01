const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { authenticateToken } = require('../middleware/auth');

// Add a new custom event
router.post('/events', authenticateToken, eventController.addEvent);

// Get all custom events
router.get('/events', authenticateToken, eventController.getAllEvents);

module.exports = router; 