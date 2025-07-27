const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
  getAllLeaves,
  getLeaveById,
  createLeave,
  updateLeave,
  deleteLeave,
  getLeaveStats,
  getEmployeesForDropdown
} = require('../controllers/leave.controller');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all leaves with filtering and pagination
router.get('/', getAllLeaves);

// Get leave statistics
router.get('/stats', getLeaveStats);

// Get employees for dropdown
router.get('/dropdown/employees', getEmployeesForDropdown);

// Get leave by ID
router.get('/:id', getLeaveById);

// Create new leave
router.post('/', createLeave);

// Update leave
router.put('/:id', updateLeave);

// Delete leave
router.delete('/:id', deleteLeave);

module.exports = router; 