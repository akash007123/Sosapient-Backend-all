const Report = require('../models/report.model');
const User = require('../models/user.model');

// GET /api/reports?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD&employee_id=xxx
exports.getReports = async (req, res) => {
  try {
    const { from_date, to_date, employee_id } = req.query;
    const filter = {};
    
    // Date filtering
    if (from_date && to_date) {
      filter.created_at = {
        $gte: new Date(from_date + 'T00:00:00.000Z'),
        $lte: new Date(to_date + 'T23:59:59.999Z'),
      };
    }
    
    // Role-based filtering
    if (req.user.role === 'employee') {
      // Employees can only see their own reports
      filter.employee_id = req.user.id;
    } else if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      // Admins can see all reports, optionally filtered by employee_id
      if (employee_id) {
        filter.employee_id = employee_id;
      }
    } else {
      // Unknown role - return empty
      return res.json({ reports: [] });
    }
    
    const reports = await Report.find(filter)
      .populate('employee_id', 'first_name last_name')
      .sort({ created_at: -1 });
    const formatted = reports.map(r => ({
      id: r._id,
      employee_id: r.employee_id?._id?.toString() || '',
      full_name: r.employee_id ? `${r.employee_id.first_name} ${r.employee_id.last_name}` : '',
      report: r.report,
      start_time: r.start_time,
      end_time: r.end_time,
      break_duration_in_minutes: r.break_duration_in_minutes,
      todays_working_hours: r.todays_working_hours,
      todays_total_hours: r.todays_total_hours,
      created_at: r.created_at,
      note: r.note,
    }));
    res.json({ reports: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reports', error: error.message });
  }
};

// POST /api/reports
exports.addReport = async (req, res) => {
  try {
    console.log('addReport - req.user:', req.user); // Debug log
    console.log('addReport - req.body:', req.body); // Debug log
    const { report, start_time, end_time, break_duration_in_minutes, note } = req.body;
    if (!report || !start_time || !end_time) {
      return res.status(400).json({ message: 'Report, start time, and end time are required' });
    }
    const employee_id = req.user?.id; // FIXED: use id instead of _id
    console.log('addReport - employee_id:', employee_id); // Debug log
    if (!employee_id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const newReport = new Report({
      employee_id,
      report,
      start_time,
      end_time,
      break_duration_in_minutes,
      note,
    });
    await newReport.save();
    res.status(201).json({ report: newReport });
  } catch (error) {
    console.error('addReport error:', error); // Debug log
    res.status(500).json({ message: 'Error creating report', error: error.message });
  }
};

// PUT /api/reports/:id
exports.updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { report, start_time, end_time, break_duration_in_minutes, todays_working_hours, todays_total_hours, note } = req.body;
    const updated = await Report.findByIdAndUpdate(
      id,
      {
        report,
        start_time,
        end_time,
        break_duration_in_minutes,
        todays_working_hours,
        todays_total_hours,
        note,
      },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json({ report: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error updating report', error: error.message });
  }
}; 