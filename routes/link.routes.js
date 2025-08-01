const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllLinks,
  getLinkById,
  createLink,
  updateLink,
  deleteLink,
  getLinkStats,
  upload
} = require('../controllers/link.controller');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/links - Get all links with filtering and pagination
router.get('/', getAllLinks);

// GET /api/links/stats - Get link statistics
router.get('/stats', getLinkStats);

// GET /api/links/:id - Get link by ID
router.get('/:id', getLinkById);

// POST /api/links - Create new link (with file upload support)
router.post('/', upload.single('file'), createLink);

// PUT /api/links/:id - Update link (with file upload support)
router.put('/:id', upload.single('file'), updateLink);

// DELETE /api/links/:id - Delete link
router.delete('/:id', deleteLink);

module.exports = router; 