const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  about: {
    type: String,
    trim: true,
    maxlength: [500, 'About cannot exceed 500 characters']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    maxlength: [50, 'Country cannot exceed 50 characters']
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [50, 'State cannot exceed 50 characters']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [50, 'City cannot exceed 50 characters']
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  profile_pic: {
    type: String,
    default: null
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
clientSchema.index({ email: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ created_by: 1 });

// Virtual for full address
clientSchema.virtual('fullAddress').get(function() {
  return `${this.city}, ${this.state}, ${this.country}`;
});

// Pre-save middleware to ensure email is unique
clientSchema.pre('save', async function(next) {
  if (this.isModified('email')) {
    const existingClient = await this.constructor.findOne({ 
      email: this.email, 
      _id: { $ne: this._id } 
    });
    if (existingClient) {
      throw new Error('Email already exists');
    }
  }
  next();
});

module.exports = mongoose.model('Client', clientSchema); 