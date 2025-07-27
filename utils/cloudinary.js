const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary only if environment variables are set
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Upload image to Cloudinary
const uploadToCloudinary = async (filePath, folder = 'general') => {
  try {
    console.log('Starting upload for file:', filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.log('Cloudinary not configured, using local storage');
      // Return local file path as fallback
      return {
        secure_url: `/uploads/${path.basename(filePath)}`,
        public_id: null
      };
    }

    console.log('Uploading to Cloudinary...');
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
        { quality: 'auto' }
      ]
    });

    console.log('Cloudinary upload successful:', result.secure_url);

    // Delete local file after upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Local file deleted');
    }

    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    
    // If Cloudinary fails, try to use local storage
    if (fs.existsSync(filePath)) {
      console.log('Falling back to local storage');
      return {
        secure_url: `/uploads/${path.basename(filePath)}`,
        public_id: null
      };
    }
    
    throw new Error(`Upload failed: ${error.message}`);
  }
};

// Delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !publicId) {
      return { result: 'ok' };
    }

    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return { result: 'ok' }; // Return success even if delete fails
  }
};

// Get Cloudinary URL with transformations
const getCloudinaryUrl = (publicId, transformations = []) => {
  if (!publicId) return null;
  
  const baseUrl = cloudinary.url(publicId, {
    transformation: transformations
  });
  
  return baseUrl;
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getCloudinaryUrl
}; 