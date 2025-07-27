const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  project_name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  project_description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true,
    maxlength: [1000, 'Project description cannot exceed 1000 characters']
  },
  project_technology: {
    type: String,
    required: [true, 'Project technology is required'],
    trim: true,
    maxlength: [200, 'Project technology cannot exceed 200 characters']
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client is required']
  },
  team_members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  project_start_date: {
    type: Date,
    required: [true, 'Project start date is required']
  },
  project_end_date: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
projectSchema.index({ status: 1 });
projectSchema.index({ client: 1 });
projectSchema.index({ created_by: 1 });
projectSchema.index({ project_start_date: 1 });

// Virtual for project duration
projectSchema.virtual('duration').get(function() {
  if (!this.project_start_date) return null;
  
  const endDate = this.project_end_date || new Date();
  const diffTime = Math.abs(endDate - this.project_start_date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for formatted dates
projectSchema.virtual('formatted_start_date').get(function() {
  return this.project_start_date ? this.project_start_date.toLocaleDateString() : null;
});

projectSchema.virtual('formatted_end_date').get(function() {
  return this.project_end_date ? this.project_end_date.toLocaleDateString() : null;
});

module.exports = mongoose.model('Project', projectSchema); 