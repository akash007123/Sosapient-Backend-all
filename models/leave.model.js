const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employee is required']
  },
  from_date: {
    type: Date,
    required: [true, 'From date is required']
  },
  to_date: {
    type: Date,
    required: [true, 'To date is required']
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  is_half_day: {
    type: Boolean,
    default: false
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
leaveSchema.index({ employee_id: 1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ from_date: 1 });
leaveSchema.index({ created_by: 1 });

// Virtual for leave duration
leaveSchema.virtual('duration').get(function() {
  if (!this.from_date || !this.to_date) return null;
  
  const diffTime = Math.abs(this.to_date - this.from_date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
  return diffDays;
});

// Virtual for formatted dates
leaveSchema.virtual('formatted_from_date').get(function() {
  return this.from_date ? this.from_date.toLocaleDateString() : null;
});

leaveSchema.virtual('formatted_to_date').get(function() {
  return this.to_date ? this.to_date.toLocaleDateString() : null;
});

module.exports = mongoose.model('Leave', leaveSchema); 