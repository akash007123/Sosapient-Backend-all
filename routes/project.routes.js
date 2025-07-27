const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  getClientsForDropdown,
  getEmployeesForTeam,
  getProjectsByClient
} = require('../controllers/project.controller');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all projects with pagination, search, and filtering
router.get('/', getAllProjects);

// Get project statistics
router.get('/stats/overview', getProjectStats);

// Get clients for dropdown
router.get('/dropdown/clients', getClientsForDropdown);

// Get employees for team member selection
router.get('/dropdown/employees', getEmployeesForTeam);

// Get projects by client ID
router.get('/client/:clientId', getProjectsByClient);

// Create new project
router.post('/', createProject);

// Get project by ID (must be after specific routes)
router.get('/:id', getProjectById);

// Update project
router.put('/:id', updateProject);

// Delete project
router.delete('/:id', deleteProject);

module.exports = router; 