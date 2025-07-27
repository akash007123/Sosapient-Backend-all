const Link = require('../models/link.model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/links';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'application/pdf', // .pdf
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'text/plain' // .txt
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only Excel, PDF, Word, and Text files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get all links with filtering and pagination
const getAllLinks = async (req, res) => {
  try {
    const { page = 1, limit = 10, tab, search } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    
    if (tab) {
      query.tab = tab;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { link: { $regex: search, $options: 'i' } }
      ];
    }

    const links = await Link.find(query)
      .populate('created_by', 'first_name last_name email')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Link.countDocuments(query);

    res.json({
      success: true,
      links,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching links:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch links',
      error: error.message
    });
  }
};

// Get link by ID
const getLinkById = async (req, res) => {
  try {
    const link = await Link.findById(req.params.id)
      .populate('created_by', 'first_name last_name email');

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found'
      });
    }

    res.json({
      success: true,
      link
    });
  } catch (error) {
    console.error('Error fetching link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch link',
      error: error.message
    });
  }
};

// Create new link
const createLink = async (req, res) => {
  try {
    const { title, link, tab } = req.body;
    const created_by = req.user.id;

    // Validate required fields
    if (!title || !tab) {
      return res.status(400).json({
        success: false,
        message: 'Title and tab are required'
      });
    }

    // For Git tab, link is required
    if (tab === 'Git' && !link) {
      return res.status(400).json({
        success: false,
        message: 'Link is required for Git tab'
      });
    }

    // For Excel and Codebase, either link or file is required
    if ((tab === 'Excel' || tab === 'Codebase') && !link && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'Either link or file is required for Excel and Codebase tabs'
      });
    }

    const linkData = {
      title,
      link: link || '',
      tab,
      created_by
    };

    // Add file path if file was uploaded
    if (req.file) {
      linkData.file = req.file.path;
    }

    const newLink = new Link(linkData);
    await newLink.save();

    const populatedLink = await Link.findById(newLink._id)
      .populate('created_by', 'first_name last_name email');

    res.status(201).json({
      success: true,
      message: 'Link created successfully',
      link: populatedLink
    });
  } catch (error) {
    console.error('Error creating link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create link',
      error: error.message
    });
  }
};

// Update link
const updateLink = async (req, res) => {
  try {
    const { title, link, tab } = req.body;
    const linkId = req.params.id;

    const existingLink = await Link.findById(linkId);
    if (!existingLink) {
      return res.status(404).json({
        success: false,
        message: 'Link not found'
      });
    }

    // Validate required fields
    if (!title || !tab) {
      return res.status(400).json({
        success: false,
        message: 'Title and tab are required'
      });
    }

    // For Git tab, link is required
    if (tab === 'Git' && !link) {
      return res.status(400).json({
        success: false,
        message: 'Link is required for Git tab'
      });
    }

    // For Excel and Codebase, either link or file is required
    if ((tab === 'Excel' || tab === 'Codebase') && !link && !req.file && !existingLink.file) {
      return res.status(400).json({
        success: false,
        message: 'Either link or file is required for Excel and Codebase tabs'
      });
    }

    const updateData = {
      title,
      link: link || '',
      tab
    };

    // Add file path if new file was uploaded
    if (req.file) {
      // Delete old file if exists
      if (existingLink.file && fs.existsSync(existingLink.file)) {
        fs.unlinkSync(existingLink.file);
      }
      updateData.file = req.file.path;
    }

    const updatedLink = await Link.findByIdAndUpdate(
      linkId,
      updateData,
      { new: true, runValidators: true }
    ).populate('created_by', 'first_name last_name email');

    res.json({
      success: true,
      message: 'Link updated successfully',
      link: updatedLink
    });
  } catch (error) {
    console.error('Error updating link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update link',
      error: error.message
    });
  }
};

// Delete link
const deleteLink = async (req, res) => {
  try {
    const linkId = req.params.id;

    const link = await Link.findById(linkId);
    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found'
      });
    }

    // Delete associated file if exists
    if (link.file && fs.existsSync(link.file)) {
      fs.unlinkSync(link.file);
    }

    await Link.findByIdAndDelete(linkId);

    res.json({
      success: true,
      message: 'Link deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete link',
      error: error.message
    });
  }
};

// Get link statistics
const getLinkStats = async (req, res) => {
  try {
    const [gitCount, excelCount, codebaseCount, totalCount] = await Promise.all([
      Link.countDocuments({ tab: 'Git' }),
      Link.countDocuments({ tab: 'Excel' }),
      Link.countDocuments({ tab: 'Codebase' }),
      Link.countDocuments()
    ]);

    res.json({
      success: true,
      stats: {
        gitLinks: gitCount,
        excelLinks: excelCount,
        codebaseLinks: codebaseCount,
        totalLinks: totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching link stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch link statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllLinks,
  getLinkById,
  createLink,
  updateLink,
  deleteLink,
  getLinkStats,
  upload
}; 