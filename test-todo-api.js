const mongoose = require('mongoose');
const Todo = require('./models/todo.model');
const User = require('./models/user.model');

// Test script for Todo API
async function testTodoAPI() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sosapient';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if we have users in the database
    const users = await User.find({ role: 'employee' }).limit(1);
    if (users.length === 0) {
      console.log('No employees found in database. Please create some users first.');
      return;
    }

    const employee = users[0];
    console.log('Using employee:', employee.first_name, employee.last_name);

    // Create a test todo
    const testTodo = new Todo({
      title: 'Test Todo Item',
      description: 'This is a test todo for API verification',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      priority: 'medium',
      employee_id: employee._id,
      assigned_by: employee._id, // For testing, assign to self
      tags: ['test', 'api'],
      notes: 'Test notes for the todo'
    });

    await testTodo.save();
    console.log('Test todo created:', testTodo._id);

    // Test finding todos
    const todos = await Todo.findWithEmployeeData({ employee_id: employee._id });
    console.log('Found todos for employee:', todos.length);

    // Test statistics
    const stats = await Todo.aggregate([
      { $match: { employee_id: employee._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('Todo statistics:', stats);

    // Clean up test todo
    await Todo.findByIdAndDelete(testTodo._id);
    console.log('Test todo cleaned up');

    console.log('Todo API test completed successfully!');
  } catch (error) {
    console.error('Error testing Todo API:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testTodoAPI();
}

module.exports = { testTodoAPI }; 