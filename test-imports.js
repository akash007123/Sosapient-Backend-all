// Test script to verify all imports are working
console.log('Testing imports...');

try {
  console.log('Testing auth middleware...');
  const auth = require('./middleware/auth');
  console.log('✅ Auth middleware imported successfully');

  console.log('Testing imageUpload middleware...');
  const { upload, handleImageUploadError } = require('./middleware/imageUpload');
  console.log('✅ ImageUpload middleware imported successfully');

  console.log('Testing cloudinary utility...');
  const { uploadToCloudinary } = require('./utils/cloudinary');
  console.log('✅ Cloudinary utility imported successfully');

  console.log('Testing client model...');
  const Client = require('./models/client.model');
  console.log('✅ Client model imported successfully');

  console.log('Testing client controller...');
  const clientController = require('./controllers/client.controller');
  console.log('✅ Client controller imported successfully');

  console.log('Testing client routes...');
  const clientRoutes = require('./routes/client.routes');
  console.log('✅ Client routes imported successfully');

  console.log('All imports successful! ✅');
} catch (error) {
  console.error('❌ Import error:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
} 