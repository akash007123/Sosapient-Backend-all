const Todo = require('../models/todo.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

// Get all todos with role-based filtering
const getAllTodos = async (req, res) => {
  try {
    const { 
      status = '', 
      employee_id = '', 
      logged_in_employee_id, 
      role,
      search = '',
      priority = '',
      project_id = ''
    } = req.query;
    
    console.log('getAllTodos - Query params:', { 
      status, 
      employee_id, 
      logged_in_employee_id, 
      role,
      search,
      priority,
      project_id
    });
    
    let query = {};
    
    // Role-based filtering
    if (role === 'employee' && logged_in_employee_id) {
      // Employees can only see their own todos
      query.employee_id = logged_in_employee_id;
      query.is_hidden_for_employee = { $ne: true };
    } else if ((role === 'admin' || role === 'super_admin') && logged_in_employee_id) {
      // Admins can see todos they assigned or all todos if they're super_admin
      if (role === 'super_admin') {
        // Super admin can see all todos
        if (employee_id) {
          query.employee_id = employee_id;
        }
      } else {
        // Regular admin can see todos they assigned
        query.assigned_by = logged_in_employee_id;
        if (employee_id) {
          query.employee_id = employee_id;
        }
      }
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Priority filter
    if (priority) {
      query.priority = priority;
    }
    
    // Project filter
    if (project_id) {
      query.project_id = project_id;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('Final query:', JSON.stringify(query, null, 2));
    
    const todos = await Todo.findWithEmployeeData(query);
    
    console.log('Found todos count:', todos.length);
    
    res.json({
      status: 'success',
      data: todos
    });
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching todos',
      error: error.message
    });
  }
};

// Get todo by ID
const getTodoById = async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id)
      .populate('employee_id', 'first_name last_name email profile')
      .populate('assigned_by', 'first_name last_name')
      .populate('project_id', 'project_name');
    
    if (!todo) {
      return res.status(404).json({
        status: 'error',
        message: 'Todo not found'
      });
    }
    
    res.json({
      status: 'success',
      data: todo
    });
  } catch (error) {
    console.error('Error fetching todo:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching todo',
      error: error.message
    });
  }
};

// Create new todo
const createTodo = async (req, res) => {
  try {
    const {
      title,
      description = '',
      due_date,
      priority = 'medium',
      employee_id,
      project_id = null,
      tags = [],
      notes = '',
      logged_in_employee_id,
      logged_in_employee_role
    } = req.body;
    
    // Validate required fields
    if (!title || !due_date || !employee_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Title, due date, and employee assignment are required'
      });
    }
    
    // Validate due date is not in the past
    const dueDate = new Date(due_date);
    const now = new Date();
    if (dueDate < now) {
      return res.status(400).json({
        status: 'error',
        message: 'Due date cannot be in the past'
      });
    }
    
    // Validate priority
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid priority value'
      });
    }
    
    // Check if employee exists
    const employee = await User.findById(employee_id);
    if (!employee) {
      return res.status(400).json({
        status: 'error',
        message: 'Employee not found'
      });
    }
    
    // Create todo
    const todo = new Todo({
      title: title.trim(),
      description: description.trim(),
      due_date: dueDate,
      priority,
      employee_id,
      assigned_by: logged_in_employee_id,
      project_id: project_id || null,
      tags: Array.isArray(tags) ? tags : [],
      notes: notes.trim()
    });
    
    await todo.save();
    
    // Populate employee data for response
    await todo.populate('employee_id', 'first_name last_name email profile');
    await todo.populate('assigned_by', 'first_name last_name');
    
    res.status(201).json({
      status: 'success',
      message: 'Todo created successfully',
      data: todo
    });
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error creating todo',
      error: error.message
    });
  }
};

// Update todo
const updateTodo = async (req, res) => {
  try {
    const {
      title,
      description,
      due_date,
      priority,
      employee_id,
      project_id,
      tags,
      notes,
      logged_in_employee_id,
      logged_in_employee_role
    } = req.body;
    
    const todoId = req.params.id;
    
    // Find the todo
    const todo = await Todo.findById(todoId);
    if (!todo) {
      return res.status(404).json({
        status: 'error',
        message: 'Todo not found'
      });
    }
    
    // Check permissions
    if (logged_in_employee_role === 'employee') {
      // Employees can only update their own todos
      if (todo.employee_id.toString() !== logged_in_employee_id) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only update your own todos'
        });
      }
    } else if (logged_in_employee_role === 'admin') {
      // Admins can only update todos they assigned
      if (todo.assigned_by.toString() !== logged_in_employee_id) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only update todos you assigned'
        });
      }
    }
    // Super admin can update any todo
    
    // Validate due date if provided
    if (due_date) {
      const dueDate = new Date(due_date);
      const now = new Date();
      if (dueDate < now) {
        return res.status(400).json({
          status: 'error',
          message: 'Due date cannot be in the past'
        });
      }
    }
    
    // Validate priority if provided
    if (priority) {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid priority value'
        });
      }
    }
    
    // Check if employee exists if employee_id is being updated
    if (employee_id) {
      const employee = await User.findById(employee_id);
      if (!employee) {
        return res.status(400).json({
          status: 'error',
          message: 'Employee not found'
        });
      }
    }
    
    // Update fields
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (due_date !== undefined) updateData.due_date = new Date(due_date);
    if (priority !== undefined) updateData.priority = priority;
    if (employee_id !== undefined) updateData.employee_id = employee_id;
    if (project_id !== undefined) updateData.project_id = project_id || null;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (notes !== undefined) updateData.notes = notes.trim();
    
    const updatedTodo = await Todo.findByIdAndUpdate(
      todoId,
      updateData,
      { new: true, runValidators: true }
    ).populate('employee_id', 'first_name last_name email profile')
     .populate('assigned_by', 'first_name last_name');
    
    res.json({
      status: 'success',
      message: 'Todo updated successfully',
      data: updatedTodo
    });
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating todo',
      error: error.message
    });
  }
};

// Update todo status
const updateTodoStatus = async (req, res) => {
  try {
    const { status, logged_in_employee_id } = req.body;
    const todoId = req.params.id;
    
    // Validate status
    const validStatuses = ['pending', 'completed', 'overdue'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status value'
      });
    }
    
    // Find the todo
    const todo = await Todo.findById(todoId);
    if (!todo) {
      return res.status(404).json({
        status: 'error',
        message: 'Todo not found'
      });
    }
    
    // Check permissions - employees can only update their own todos
    if (todo.employee_id.toString() !== logged_in_employee_id) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only update your own todos'
      });
    }
    
    // Update status
    const updateData = { status };
    if (status === 'completed') {
      updateData.completed_at = new Date();
    } else {
      updateData.completed_at = null;
    }
    
    const updatedTodo = await Todo.findByIdAndUpdate(
      todoId,
      updateData,
      { new: true, runValidators: true }
    ).populate('employee_id', 'first_name last_name email profile')
     .populate('assigned_by', 'first_name last_name');
    
    res.json({
      status: 'success',
      message: 'Todo status updated successfully',
      data: updatedTodo
    });
  } catch (error) {
    console.error('Error updating todo status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating todo status',
      error: error.message
    });
  }
};

// Delete todo
const deleteTodo = async (req, res) => {
  try {
    const { logged_in_employee_id, logged_in_employee_role } = req.body;
    const todoId = req.params.id;
    
    // Find the todo
    const todo = await Todo.findById(todoId);
    if (!todo) {
      return res.status(404).json({
        status: 'error',
        message: 'Todo not found'
      });
    }
    
    // Check permissions
    if (logged_in_employee_role === 'employee') {
      // Employees cannot delete todos
      return res.status(403).json({
        status: 'error',
        message: 'Employees cannot delete todos'
      });
    } else if (logged_in_employee_role === 'admin') {
      // Admins can only delete todos they assigned
      if (todo.assigned_by.toString() !== logged_in_employee_id) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only delete todos you assigned'
        });
      }
    }
    // Super admin can delete any todo
    
    await Todo.findByIdAndDelete(todoId);
    
    res.json({
      status: 'success',
      message: 'Todo deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting todo',
      error: error.message
    });
  }
};

// Get todo statistics
const getTodoStats = async (req, res) => {
  try {
    const { logged_in_employee_id, role } = req.query;
    
    let query = {};
    
    // Role-based filtering
    if (role === 'employee' && logged_in_employee_id) {
      query.employee_id = logged_in_employee_id;
      query.is_hidden_for_employee = { $ne: true };
    } else if (role === 'admin' && logged_in_employee_id) {
      query.assigned_by = logged_in_employee_id;
    }
    // Super admin can see all stats
    
    const stats = await Todo.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get overdue todos count
    const overdueCount = await Todo.countDocuments({
      ...query,
      status: { $in: ['pending', 'overdue'] },
      due_date: { $lt: new Date() }
    });
    
    // Get total todos count
    const totalCount = await Todo.countDocuments(query);
    
    // Format stats
    const statusStats = {
      pending: 0,
      completed: 0,
      overdue: 0,
      total: totalCount,
      overdue_count: overdueCount
    };
    
    stats.forEach(stat => {
      statusStats[stat._id] = stat.count;
    });
    
    res.json({
      status: 'success',
      data: statusStats
    });
  } catch (error) {
    console.error('Error fetching todo stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching todo statistics',
      error: error.message
    });
  }
};

// Get employees for dropdown (for admin/super_admin)
const getEmployeesForDropdown = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' })
      .select('first_name last_name email profile')
      .sort({ first_name: 1, last_name: 1 });
    
    res.json({
      status: 'success',
      data: employees
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching employees',
      error: error.message
    });
  }
};

// Bulk update todo status
const bulkUpdateTodoStatus = async (req, res) => {
  try {
    const { todo_ids, status, logged_in_employee_id, logged_in_employee_role } = req.body;
    
    if (!Array.isArray(todo_ids) || todo_ids.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Todo IDs array is required'
      });
    }
    
    // Validate status
    const validStatuses = ['pending', 'completed', 'overdue'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status value'
      });
    }
    
    // Check permissions for all todos
    const todos = await Todo.find({ _id: { $in: todo_ids } });
    
    for (const todo of todos) {
      if (logged_in_employee_role === 'employee') {
        if (todo.employee_id.toString() !== logged_in_employee_id) {
          return res.status(403).json({
            status: 'error',
            message: 'You can only update your own todos'
          });
        }
      } else if (logged_in_employee_role === 'admin') {
        if (todo.assigned_by.toString() !== logged_in_employee_id) {
          return res.status(403).json({
            status: 'error',
            message: 'You can only update todos you assigned'
          });
        }
      }
    }
    
    // Update all todos
    const updateData = { status };
    if (status === 'completed') {
      updateData.completed_at = new Date();
    } else {
      updateData.completed_at = null;
    }
    
    await Todo.updateMany(
      { _id: { $in: todo_ids } },
      updateData
    );
    
    res.json({
      status: 'success',
      message: 'Todos updated successfully'
    });
  } catch (error) {
    console.error('Error bulk updating todos:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating todos',
      error: error.message
    });
  }
};

module.exports = {
  getAllTodos,
  getTodoById,
  createTodo,
  updateTodo,
  updateTodoStatus,
  deleteTodo,
  getTodoStats,
  getEmployeesForDropdown,
  bulkUpdateTodoStatus
}; 