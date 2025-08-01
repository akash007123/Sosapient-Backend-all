const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { authenticateToken } = require('../middleware/auth');

// Get all employees
router.get('/employees', authenticateToken, employeeController.getEmployees);

module.exports = router; 