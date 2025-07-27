const User = require('../models/user.model');

// GET /api/employees
exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('first_name last_name');
    const formatted = employees.map(e => ({
      id: e._id,
      first_name: e.first_name,
      last_name: e.last_name,
    }));
    res.json({ employees: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees', error: error.message });
  }
}; 