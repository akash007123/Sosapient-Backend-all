const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Todo title is required'],
    trim: true,
    maxlength: [200, 'Todo title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Todo description cannot exceed 1000 characters']
  },
  due_date: {
    type: Date,
    required: [true, 'Due date is required']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    required: [true, 'Priority is required']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'overdue'],
    default: 'pending'
  },
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employee assignment is required']
  },
  assigned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned by is required']
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  is_hidden_for_employee: {
    type: Boolean,
    default: false
  },
  completed_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
todoSchema.index({ employee_id: 1 });
todoSchema.index({ status: 1 });
todoSchema.index({ priority: 1 });
todoSchema.index({ due_date: 1 });
todoSchema.index({ assigned_by: 1 });
todoSchema.index({ project_id: 1 });
todoSchema.index({ created_at: -1 });

// Virtual for overdue status
todoSchema.virtual('is_overdue').get(function() {
  if (this.status === 'completed') return false;
  return this.due_date < new Date();
});

// Virtual for formatted due date
todoSchema.virtual('formatted_due_date').get(function() {
  return this.due_date ? this.due_date.toLocaleDateString() : null;
});

// Virtual for days remaining
todoSchema.virtual('days_remaining').get(function() {
  if (this.status === 'completed') return 0;
  
  const now = new Date();
  const dueDate = new Date(this.due_date);
  const diffTime = dueDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Virtual for priority color
todoSchema.virtual('priority_color').get(function() {
  switch (this.priority) {
    case 'high':
      return 'danger';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
    default:
      return 'secondary';
  }
});

// Pre-save middleware to update status based on due date
todoSchema.pre('save', function(next) {
  if (this.isModified('due_date') || this.isModified('status')) {
    const now = new Date();
    const dueDate = new Date(this.due_date);
    
    // If status is not completed and due date is in the past, mark as overdue
    if (this.status !== 'completed' && dueDate < now) {
      this.status = 'overdue';
    }
  }
  next();
});

// Static method to get todos with populated employee data
todoSchema.statics.findWithEmployeeData = function(query = {}) {
  return this.find(query)
    .populate('employee_id', 'first_name last_name email profile')
    .populate('assigned_by', 'first_name last_name')
    .populate('project_id', 'project_name')
    .sort({ due_date: 1, priority: -1 });
};

// Static method to get todos by employee
todoSchema.statics.findByEmployee = function(employeeId, options = {}) {
  const query = { employee_id: employeeId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.hideHidden !== false) {
    query.is_hidden_for_employee = { $ne: true };
  }
  
  return this.findWithEmployeeData(query);
};

// Static method to get todos by assigner (admin/super_admin)
todoSchema.statics.findByAssigner = function(assignerId, options = {}) {
  const query = { assigned_by: assignerId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.employee_id) {
    query.employee_id = options.employee_id;
  }
  
  return this.findWithEmployeeData(query);
};

module.exports = mongoose.model('Todo', todoSchema); 