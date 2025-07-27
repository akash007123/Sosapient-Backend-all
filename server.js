const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const subscriberRoutes = require('./routes/subscribers');

const app = express();

// CORS configuration
app.use(cors());

// Body parser middleware (MOVE THIS BEFORE LOGGING)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (MOVED AFTER BODY PARSER)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Request headers:', req.headers);
  if (req.method === 'POST') {
    console.log('Request body:', req.body);
  }
  next();
});

// Serve static files (for uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const contactRoutes = require('./routes/contact.routes');
const careerRoutes = require('./routes/career.routes');
const authRoutes = require('./routes/auth.routes');
const hrmsProtected = require('./routes/hrms.protected');
const departmentRoutes = require('./routes/department.routes');
const eventRoutes = require('./routes/event.routes');
const reportRoutes = require('./routes/report.routes');
const employeeRoutes = require('./routes/employee.routes');
const clientRoutes = require('./routes/client.routes');
const projectRoutes = require('./routes/project.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const leaveRoutes = require('./routes/leave.routes');
const linkRoutes = require('./routes/link.routes');

// Use routes
app.use('/api/contact', contactRoutes);
app.use('/api/career', careerRoutes);
app.use('/api', subscriberRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/hrms', hrmsProtected);
app.use('/api/departments', departmentRoutes);
app.use('/api', eventRoutes);
app.use('/api', reportRoutes);
app.use('/api', employeeRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/links', linkRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sosapient';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

console.log('Attempting to connect to MongoDB at:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`JWT Secret: ${JWT_SECRET ? 'Set' : 'Using default'}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    console.error('Please make sure MongoDB is running or check your connection string');
    console.error('You can install MongoDB locally or use MongoDB Atlas');
    process.exit(1);
  }); 