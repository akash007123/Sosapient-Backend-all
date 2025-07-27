const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  link: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        // If no link provided, it's valid (file can be used instead)
        if (!v) return true;
        // Basic URL validation
        const urlPattern = /^https?:\/\/.+/;
        return urlPattern.test(v);
      },
      message: 'Please provide a valid URL starting with http:// or https://'
    }
  },
  file: {
    type: String,
    trim: true
  },
  tab: {
    type: String,
    enum: ['Git', 'Excel', 'Codebase'],
    required: [true, 'Tab is required']
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
linkSchema.index({ tab: 1 });
linkSchema.index({ created_by: 1 });
linkSchema.index({ created_at: -1 });

// Virtual for formatted dates
linkSchema.virtual('formatted_created_at').get(function() {
  return this.created_at ? this.created_at.toLocaleDateString() : null;
});

linkSchema.virtual('formatted_updated_at').get(function() {
  return this.updated_at ? this.updated_at.toLocaleDateString() : null;
});

// Pre-save middleware to ensure either link or file is provided
linkSchema.pre('save', function(next) {
  if (!this.link && !this.file) {
    return next(new Error('Either link or file is required'));
  }
  next();
});

module.exports = mongoose.model('Link', linkSchema); 