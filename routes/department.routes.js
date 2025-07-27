const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Department = require('../models/department.model');

// Get all departments
router.get('/', auth, async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    res.json({ departments });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching departments', error: error.message });
  }
});

// Get single department
router.get('/:id', auth, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.json({ department });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching department', error: error.message });
  }
});

// Create new department
router.post('/', auth, async (req, res) => {
  try {
    const department = new Department(req.body);
    await department.save();
    res.status(201).json({ message: 'Department created successfully', department });
  } catch (error) {
    res.status(500).json({ message: 'Error creating department', error: error.message });
  }
});

// Update department
router.put('/:id', auth, async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.json({ message: 'Department updated successfully', department });
  } catch (error) {
    res.status(500).json({ message: 'Error updating department', error: error.message });
  }
});

// Delete department
router.delete('/:id', auth, async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting department', error: error.message });
  }
});

module.exports = router; 