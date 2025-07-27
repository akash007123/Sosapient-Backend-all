const User = require('../models/user.model');
const Holiday = require('../models/holiday.model');
const Event = require('../models/event.model');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get counts for different entities
    const totalUsers = await User.countDocuments({ role: 'admin' });
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const totalHolidays = await Holiday.countDocuments();
    const totalEvents = await Event.countDocuments();

    res.json({
      success: true,
      totalUsers,
      totalEmployees,
      totalHolidays,
      totalEvents
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats
}; 