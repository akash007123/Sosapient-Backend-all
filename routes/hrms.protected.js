const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const User = require('../models/user.model');
const Department = require('../models/department.model');
const Holiday = require('../models/holiday.model'); // Added Holiday model

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
const profilesDir = path.join(uploadsDir, 'profiles');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profilesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Example protected route
router.get('/dashboard', auth, (req, res) => {
  res.json({ message: 'Welcome to HRMS dashboard!', user: req.user });
});

// Get departments for signup (no auth required)
router.get('/departments', async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    res.json({ departments });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching departments', error: error.message });
  }
});

// Get all employees
router.get('/employees', auth, async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('-password');
    res.json({ employees });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees', error: error.message });
  }
});

// Get single employee
router.get('/employees/:id', auth, async (req, res) => {
  try {
    const employee = await User.findById(req.params.id).select('-password');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ employee });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employee', error: error.message });
  }
});

// Delete employee
router.delete('/employees/:id', auth, async (req, res) => {
  try {
    const employee = await User.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting employee', error: error.message });
  }
});

// Create new employee with profile picture upload
router.post('/employees', auth, upload.single('profile'), async (req, res) => {
  try {
    const employeeData = { ...req.body, role: 'employee' };
    
    // If a file was uploaded, save the file path
    if (req.file) {
      employeeData.profile = `/uploads/profiles/${req.file.filename}`;
    }
    
    const employee = new User(employeeData);
    await employee.save();
    res.status(201).json({ message: 'Employee created successfully', employee });
  } catch (error) {
    // If there was an error and a file was uploaded, delete it
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }
    res.status(500).json({ message: 'Error creating employee', error: error.message });
  }
});

// Update employee with profile picture upload
router.put('/employees/:id', auth, upload.single('profile'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // If a file was uploaded, save the file path
    if (req.file) {
      updateData.profile = `/uploads/profiles/${req.file.filename}`;
      
      // Delete old profile picture if it exists
      const oldEmployee = await User.findById(req.params.id);
      if (oldEmployee && oldEmployee.profile && oldEmployee.profile.startsWith('/uploads/')) {
        const oldFilePath = path.join(__dirname, '..', oldEmployee.profile);
        if (fs.existsSync(oldFilePath)) {
          fs.unlink(oldFilePath, (err) => {
            if (err) console.error('Error deleting old profile file:', err);
          });
        }
      }
    }
    
    const employee = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee updated successfully', employee });
  } catch (error) {
    // If there was an error and a file was uploaded, delete it
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }
    res.status(500).json({ message: 'Error updating employee', error: error.message });
  }
});

// Get all admins
router.get('/admins', auth, async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password');
    res.json({ admins });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admins', error: error.message });
  }
});

// Get single admin
router.get('/admins/:id', auth, async (req, res) => {
  try {
    const admin = await User.findById(req.params.id).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json({ admin });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin', error: error.message });
  }
});

// Create new admin
router.post('/admins', auth, upload.single('profile'), async (req, res) => {
  try {
    const adminData = { ...req.body, role: 'admin' };
    
    // If a file was uploaded, save the file path
    if (req.file) {
      adminData.profile = `/uploads/profiles/${req.file.filename}`;
    }
    
    const admin = new User(adminData);
    await admin.save();
    res.status(201).json({ message: 'Admin created successfully', admin });
  } catch (error) {
    // If there was an error and a file was uploaded, delete it
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }
    res.status(500).json({ message: 'Error creating admin', error: error.message });
  }
});

// Update admin
router.put('/admins/:id', auth, upload.single('profile'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // If a file was uploaded, save the file path
    if (req.file) {
      updateData.profile = `/uploads/profiles/${req.file.filename}`;
      
      // Delete old profile picture if it exists
      const oldAdmin = await User.findById(req.params.id);
      if (oldAdmin && oldAdmin.profile && oldAdmin.profile.startsWith('/uploads/')) {
        const oldFilePath = path.join(__dirname, '..', oldAdmin.profile);
        if (fs.existsSync(oldFilePath)) {
          fs.unlink(oldFilePath, (err) => {
            if (err) console.error('Error deleting old profile file:', err);
          });
        }
      }
    }
    
    const admin = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json({ message: 'Admin updated successfully', admin });
  } catch (error) {
    // If there was an error and a file was uploaded, delete it
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }
    res.status(500).json({ message: 'Error updating admin', error: error.message });
  }
});

// Delete admin
router.delete('/admins/:id', auth, async (req, res) => {
  try {
    const admin = await User.findByIdAndDelete(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting admin', error: error.message });
  }
});

// Holiday routes
router.get('/holidays', auth, async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json({ holidays });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching holidays', error: error.message });
  }
});

router.post('/holidays', auth, async (req, res) => {
  try {
    const { title, date } = req.body;
    
    if (!title || !date) {
      return res.status(400).json({ message: 'Title and date are required' });
    }

    const holiday = new Holiday({
      title,
      date
    });

    const savedHoliday = await holiday.save();
    res.status(201).json({ holiday: savedHoliday });
  } catch (error) {
    res.status(500).json({ message: 'Error creating holiday', error: error.message });
  }
});

router.put('/holidays/:id', auth, async (req, res) => {
  try {
    const { title, date } = req.body;
    
    if (!title || !date) {
      return res.status(400).json({ message: 'Title and date are required' });
    }

    const holiday = await Holiday.findByIdAndUpdate(
      req.params.id,
      { title, date },
      { new: true }
    );

    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }

    res.json({ holiday });
  } catch (error) {
    res.status(500).json({ message: 'Error updating holiday', error: error.message });
  }
});

router.delete('/holidays/:id', auth, async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }

    res.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting holiday', error: error.message });
  }
});

// Unified events endpoint: holidays + employee/admin birthdays
router.get('/events', auth, async (req, res) => {
  try {
    // Holidays
    const holidays = await Holiday.find().select('title date').lean();
    const holidayEvents = holidays.map(h => ({
      _id: h._id,
      title: h.title,
      date: h.date,
      type: 'holiday',
    }));

    // Employee birthdays
    const employees = await User.find({ role: 'employee', dob: { $exists: true, $ne: null } }).select('first_name last_name dob').lean();
    const employeeBirthdayEvents = employees.map(e => ({
      _id: e._id,
      title: `${e.first_name} ${e.last_name} (Employee Birthday)`,
      date: e.dob,
      type: 'employee_birthday',
    }));

    // Admin birthdays
    const admins = await User.find({ role: 'admin', dob: { $exists: true, $ne: null } }).select('first_name last_name dob').lean();
    const adminBirthdayEvents = admins.map(a => ({
      _id: a._id,
      title: `${a.first_name} ${a.last_name} (Admin Birthday)`,
      date: a.dob,
      type: 'admin_birthday',
    }));

    const events = [
      ...holidayEvents,
      ...employeeBirthdayEvents,
      ...adminBirthdayEvents,
    ];

    res.json({ events });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
});

module.exports = router; 