const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');
const authenticateToken = require('../middleware/auth');
const { upload, handleImageUploadError } = require('../middleware/imageUpload');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all clients with pagination and search
router.get('/', clientController.getAllClients);

// Get client statistics
router.get('/stats', clientController.getClientStats);

// Get single client by ID
router.get('/:id', clientController.getClientById);

// Create new client (with image upload)
router.post('/', upload.single('profile_pic'), handleImageUploadError, clientController.createClient);

// Update client (with image upload)
router.put('/:id', upload.single('profile_pic'), handleImageUploadError, clientController.updateClient);

// Delete client
router.delete('/:id', clientController.deleteClient);

module.exports = router; 