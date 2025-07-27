const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const auth = require('../middleware/auth');

// Get all employees
router.get('/employees', auth, employeeController.getEmployees);

module.exports = router; 