const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todo.controller');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/todos - Get all todos with filtering
router.get('/', todoController.getAllTodos);

// GET /api/todos/stats - Get todo statistics
router.get('/stats', todoController.getTodoStats);

// GET /api/todos/employees - Get employees for dropdown
router.get('/employees', todoController.getEmployeesForDropdown);

// GET /api/todos/:id - Get todo by ID
router.get('/:id', todoController.getTodoById);

// POST /api/todos - Create new todo
router.post('/', todoController.createTodo);

// PUT /api/todos/:id - Update todo
router.put('/:id', todoController.updateTodo);

// PATCH /api/todos/:id/status - Update todo status
router.patch('/:id/status', todoController.updateTodoStatus);

// POST /api/todos/bulk-status - Bulk update todo status
router.post('/bulk-status', todoController.bulkUpdateTodoStatus);

// DELETE /api/todos/:id - Delete todo
router.delete('/:id', todoController.deleteTodo);

module.exports = router; 