const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sosapient';

async function migrateProjectStatus() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Get the Project model
    const Project = require('./models/project.model');

    // Update projects with old status values
    const updateResult = await Project.updateMany(
      { status: { $in: ['ongoing', 'completed', 'on-hold', 'cancelled'] } },
      [
        {
          $set: {
            status: {
              $switch: {
                branches: [
                  { case: { $eq: ['$status', 'ongoing'] }, then: 'active' },
                  { case: { $eq: ['$status', 'completed'] }, then: 'active' },
                  { case: { $eq: ['$status', 'on-hold'] }, then: 'inactive' },
                  { case: { $eq: ['$status', 'cancelled'] }, then: 'inactive' }
                ],
                default: 'active'
              }
            }
          }
        }
      ]
    );

    console.log(`Migration completed! Updated ${updateResult.modifiedCount} projects.`);
    
    // Show the current status distribution
    const statusCounts = await Project.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    console.log('Current project status distribution:');
    statusCounts.forEach(item => {
      console.log(`- ${item._id}: ${item.count} projects`);
    });

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrateProjectStatus(); 