const Client = require('../models/client.model');
const { uploadToCloudinary } = require('../utils/cloudinary');

// Get all clients
const getAllClients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    
    // Build query
    let query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    const clients = await Client.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('created_by', 'first_name last_name');
    
    const total = await Client.countDocuments(query);
    
    res.status(200).json({
      success: true,
      clients,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalClients: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching clients',
      error: error.message
    });
  }
};

// Get single client by ID
const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await Client.findById(id)
      .populate('created_by', 'first_name last_name');
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    res.status(200).json({
      success: true,
      client
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching client',
      error: error.message
    });
  }
};

// Create new client
const createClient = async (req, res) => {
  try {
    const {
      name,
      email,
      about,
      country,
      state,
      city,
      status = 'active'
    } = req.body;
    
    // Check if email already exists
    const existingClient = await Client.findOne({ email: email.toLowerCase() });
    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    // Handle profile picture upload
    let profilePicUrl = null;
    if (req.file) {
      try {
        console.log('File received:', req.file);
        console.log('File path:', req.file.path);
        
        // Check if file exists
        if (!req.file.path) {
          console.error('No file path provided');
          return res.status(400).json({
            success: false,
            message: 'No file uploaded'
          });
        }
        
        const result = await uploadToCloudinary(req.file.path, 'clients');
        profilePicUrl = result.secure_url;
        console.log('Upload successful, URL:', profilePicUrl);
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Error uploading profile picture: ' + uploadError.message
        });
      }
    }
    
    const clientData = {
      name,
      email: email.toLowerCase(),
      about,
      country,
      state,
      city,
      status,
      profile_pic: profilePicUrl,
      created_by: req.user.id
    };
    
    const client = new Client(clientData);
    await client.save();
    
    const populatedClient = await Client.findById(client._id)
      .populate('created_by', 'first_name last_name');
    
    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      client: populatedClient
    });
  } catch (error) {
    console.error('Error creating client:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating client',
      error: error.message
    });
  }
};

// Update client
const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      about,
      country,
      state,
      city,
      status
    } = req.body;
    
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    // Check if email already exists (excluding current client)
    if (email && email !== client.email) {
      const existingClient = await Client.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: id }
      });
      if (existingClient) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }
    
    // Handle profile picture upload
    let profilePicUrl = client.profile_pic;
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.path, 'clients');
        profilePicUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Error uploading profile picture'
        });
      }
    }
    
    const updateData = {
      name: name || client.name,
      email: email ? email.toLowerCase() : client.email,
      about: about !== undefined ? about : client.about,
      country: country || client.country,
      state: state || client.state,
      city: city || client.city,
      status: status || client.status,
      profile_pic: profilePicUrl
    };
    
    const updatedClient = await Client.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('created_by', 'first_name last_name');
    
    res.status(200).json({
      success: true,
      message: 'Client updated successfully',
      client: updatedClient
    });
  } catch (error) {
    console.error('Error updating client:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating client',
      error: error.message
    });
  }
};

// Delete client
const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    await Client.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting client',
      error: error.message
    });
  }
};

// Get client statistics
const getClientStats = async (req, res) => {
  try {
    const totalClients = await Client.countDocuments();
    const activeClients = await Client.countDocuments({ status: 'active' });
    const inactiveClients = await Client.countDocuments({ status: 'inactive' });
    
    // Get clients by country
    const clientsByCountry = await Client.aggregate([
      {
        $group: {
          _id: '$country',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    // Get recent clients
    const recentClients = await Client.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('created_by', 'first_name last_name');
    
    res.status(200).json({
      success: true,
      stats: {
        totalClients,
        activeClients,
        inactiveClients,
        clientsByCountry,
        recentClients
      }
    });
  } catch (error) {
    console.error('Error fetching client stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching client statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientStats
}; 