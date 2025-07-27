const Event = require('../models/event.model');

// Add a new custom event
exports.addEvent = async (req, res) => {
  try {
    const { title, date, description } = req.body;
    if (!title || !date) {
      return res.status(400).json({ message: 'Title and date are required' });
    }
    const event = new Event({
      title,
      date,
      description,
      createdBy: req.user ? req.user._id : undefined
    });
    const savedEvent = await event.save();
    res.status(201).json({ event: savedEvent });
  } catch (error) {
    res.status(500).json({ message: 'Error creating event', error: error.message });
  }
};

// Get all custom events
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.status(200).json({ events });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
}; 