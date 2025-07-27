const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const auth = require('../middleware/auth');

// Add a new custom event
router.post('/events', auth, eventController.addEvent);

// Get all custom events
router.get('/events', auth, eventController.getAllEvents);

module.exports = router; 