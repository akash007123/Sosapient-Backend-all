const Leave = require('../models/leave.model');
const User = require('../models/user.model');

// Get all leaves with filtering and pagination
const getAllLeaves = async (req, res) => {
  try {
    const { 
      search = '', 
      status = '', 
      employee_id = '', 
      from_date = '', 
      to_date = '',
      page = 1,
      limit = 10,
      logged_in_employee_id,
      role
    } = req.query;
    
    const query = {};
    
    // Role-based filtering
    if (role === 'employee' && logged_in_employee_id) {
      query.employee_id = logged_in_employee_id;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { reason: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Employee filter
    if (employee_id) {
      query.employee_id = employee_id;
    }
    
    // Date range filter
    if (from_date || to_date) {
      query.from_date = {};
      if (from_date) {
        query.from_date.$gte = new Date(from_date);
      }
      if (to_date) {
        query.from_date.$lte = new Date(to_date);
      }
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const leaves = await Leave.find(query)
      .populate('employee_id', 'first_name last_name email profile department')
      .populate('created_by', 'first_name last_name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Leave.countDocuments(query);
    
    res.json({
      success: true,
      leaves: leaves,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaves',
      error: error.message
    });
  }
};

// Get leave by ID
const getLeaveById = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('employee_id', 'first_name last_name email profile department')
      .populate('created_by', 'first_name last_name');
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found'
      });
    }
    
    res.json({
      success: true,
      leave
    });
  } catch (error) {
    console.error('Error fetching leave:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave',
      error: error.message
    });
  }
};

// Create new leave
const createLeave = async (req, res) => {
  try {
    const {
      employee_id,
      from_date,
      to_date,
      reason,
      status,
      is_half_day
    } = req.body;
    
    // Validate required fields
    if (!employee_id || !from_date || !to_date || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Validate dates
    const fromDate = new Date(from_date);
    const toDate = new Date(to_date);
    
    if (fromDate > toDate) {
      return res.status(400).json({
        success: false,
        message: 'From date cannot be after to date'
      });
    }
    
    // Check if employee exists
    const employee = await User.findById(employee_id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    const leave = new Leave({
      employee_id,
      from_date: fromDate,
      to_date: toDate,
      reason,
      status: status || 'pending',
      is_half_day: is_half_day || false,
      created_by: req.user.id
    });
    
    const savedLeave = await leave.save();
    
    const populatedLeave = await Leave.findById(savedLeave._id)
      .populate('employee_id', 'first_name last_name email profile department')
      .populate('created_by', 'first_name last_name');
    
    res.status(201).json({
      success: true,
      message: 'Leave created successfully',
      leave: populatedLeave
    });
  } catch (error) {
    console.error('Error creating leave:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating leave',
      error: error.message
    });
  }
};

// Update leave
const updateLeave = async (req, res) => {
  try {
    const {
      employee_id,
      from_date,
      to_date,
      reason,
      status,
      is_half_day
    } = req.body;
    
    const leave = await Leave.findById(req.params.id);
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found'
      });
    }
    
    // Validate dates if provided
    if (from_date && to_date) {
      const fromDate = new Date(from_date);
      const toDate = new Date(to_date);
      
      if (fromDate > toDate) {
        return res.status(400).json({
          success: false,
          message: 'From date cannot be after to date'
        });
      }
    }
    
    // Update fields
    if (employee_id) leave.employee_id = employee_id;
    if (from_date) leave.from_date = new Date(from_date);
    if (to_date) leave.to_date = new Date(to_date);
    if (reason) leave.reason = reason;
    if (status) leave.status = status;
    if (typeof is_half_day === 'boolean') leave.is_half_day = is_half_day;
    
    const updatedLeave = await leave.save();
    
    const populatedLeave = await Leave.findById(updatedLeave._id)
      .populate('employee_id', 'first_name last_name email profile department')
      .populate('created_by', 'first_name last_name');
    
    res.json({
      success: true,
      message: 'Leave updated successfully',
      leave: populatedLeave
    });
  } catch (error) {
    console.error('Error updating leave:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating leave',
      error: error.message
    });
  }
};

// Delete leave
const deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found'
      });
    }
    
    await Leave.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Leave deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting leave:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting leave',
      error: error.message
    });
  }
};

// Get leave statistics
const getLeaveStats = async (req, res) => {
  try {
    const { logged_in_employee_id, role } = req.query;
    
    const query = {};
    
    // Role-based filtering
    if (role === 'employee' && logged_in_employee_id) {
      query.employee_id = logged_in_employee_id;
    }
    
    const totalLeaves = await Leave.countDocuments(query);
    const pendingLeaves = await Leave.countDocuments({ ...query, status: 'pending' });
    const approvedLeaves = await Leave.countDocuments({ ...query, status: 'approved' });
    const rejectedLeaves = await Leave.countDocuments({ ...query, status: 'rejected' });
    const cancelledLeaves = await Leave.countDocuments({ ...query, status: 'cancelled' });
    
    res.json({
      success: true,
      stats: {
        totalLeaves,
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,
        cancelledLeaves
      }
    });
  } catch (error) {
    console.error('Error fetching leave stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave statistics',
      error: error.message
    });
  }
};

// Get employees for dropdown
const getEmployeesForDropdown = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }, 'first_name last_name email')
      .sort({ first_name: 1 });
    
    res.json({
      success: true,
      employees: employees
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message
    });
  }
};

module.exports = {
  getAllLeaves,
  getLeaveById,
  createLeave,
  updateLeave,
  deleteLeave,
  getLeaveStats,
  getEmployeesForDropdown
}; 