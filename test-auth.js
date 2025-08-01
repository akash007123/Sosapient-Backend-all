const mongoose = require('mongoose');
const User = require('./models/user.model');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

async function testAuth() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sosapient';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if we have users in the database
    const users = await User.find({}).limit(5);
    console.log(`Found ${users.length} users in database:`);
    
    users.forEach(user => {
      console.log(`- ${user.first_name} ${user.last_name} (${user.email}) - Role: ${user.role}`);
    });

    // Create a test user with known credentials
    console.log('\nCreating test user with known credentials...');
    
    // Delete existing test user if exists
    await User.deleteOne({ email: 'test@example.com' });
    
    const testUser = new User({
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      password: 'testpassword123',
      role: 'admin',
      department: 'IT'
    });

    await testUser.save();
    console.log('Test user created:', testUser.email);

    // Test login flow
    console.log('\nTesting login flow...');
    
    // Simulate login request
    const loginEmail = 'test@example.com';
    const loginPassword = 'testpassword123';
    
    const user = await User.findOne({ email: loginEmail });
    if (!user) {
      console.error('User not found');
      return;
    }
    
    console.log('Found user:', user.email);
    
    // Test password comparison
    const isMatch = await user.comparePassword(loginPassword);
    console.log('Password match:', isMatch);

    if (isMatch) {
      // Generate token
      const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
      console.log('Generated token:', token);

      // Test token verification
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Token verification successful:', decoded);
        
        // Test API call simulation
        console.log('\nTesting API call simulation...');
        const authHeader = `Bearer ${token}`;
        console.log('Authorization header:', authHeader);
        
        // Simulate middleware check
        const tokenFromHeader = authHeader.split(' ')[1];
        console.log('Extracted token:', tokenFromHeader);
        
        if (tokenFromHeader) {
          const decodedFromHeader = jwt.verify(tokenFromHeader, JWT_SECRET);
          console.log('Middleware verification successful:', decodedFromHeader);
        }
        
      } catch (err) {
        console.error('Token verification failed:', err.message);
      }
    } else {
      console.error('Password comparison failed. This might indicate a hashing issue.');
    }

    // Clean up test user
    await User.deleteOne({ email: 'test@example.com' });
    console.log('\nTest user cleaned up');

    console.log('\nAuth test completed!');
  } catch (error) {
    console.error('Error testing auth:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testAuth(); 