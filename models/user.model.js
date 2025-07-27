const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  role: { type: String, enum: ['admin', 'employee'], required: true },
  department: { type: String },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  profile: { type: String },
  dob: { type: Date },
  gender: { type: String },
  password: { type: String, required: true },
  joining_date: { type: Date },
  mobile_no1: { type: String },
  mobile_no2: { type: String },
  address_line1: { type: String },
  address_line2: { type: String },
  emergency_contact1: { type: String },
  emergency_contact2: { type: String },
  emergency_contact3: { type: String },
  frontend_skills: { type: String },
  backend_skills: { type: String },
  account_holder_name: { type: String },
  account_number: { type: String },
  ifsc_code: { type: String },
  bank_name: { type: String },
  bank_address: { type: String },
  aadhar_card_number: { type: String },
  aadhar_card_file: { type: String },
  pan_card_number: { type: String },
  pan_card_file: { type: String },
  driving_license_number: { type: String },
  driving_license_file: { type: String },
  facebook_url: { type: String },
  twitter_url: { type: String },
  linkedin_url: { type: String },
  instagram_url: { type: String },
  upwork_profile_url: { type: String },
  resume: { type: String },
  // Admin specific
  Mobile: { type: String },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 