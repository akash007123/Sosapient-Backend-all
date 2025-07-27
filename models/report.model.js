const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  report: {
    type: String,
    required: true
  },
  start_time: {
    type: Date,
    required: true
  },
  end_time: {
    type: Date,
    required: true
  },
  break_duration_in_minutes: {
    type: Number,
    default: 0
  },
  todays_working_hours: {
    type: String
  },
  todays_total_hours: {
    type: String
  },
  note: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', reportSchema); 