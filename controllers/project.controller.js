const Project = require('../models/project.model');
const Client = require('../models/client.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

// Get all projects with search and filtering
const getAllProjects = async (req, res) => {
  try {
    const { search = '', status = '', client = '', logged_in_employee_id, role } = req.query;
    
    console.log('getAllProjects - Query params:', { search, status, client, logged_in_employee_id, role });
    
    const query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { project_name: { $regex: search, $options: 'i' } },
        { project_description: { $regex: search, $options: 'i' } },
        { project_technology: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Client filter
    if (client) {
      query.client = client;
    }

    // Role-based filtering (similar to reference Dashboard.js)
    if (role === 'employee' && logged_in_employee_id) {
      // Convert string ID to ObjectId for proper comparison
      const employeeObjectId = new mongoose.Types.ObjectId(logged_in_employee_id);
      query.team_members = { $in: [employeeObjectId] };
      console.log('Employee filtering applied:', { role, logged_in_employee_id, employeeObjectId, query });
    }
    
    console.log('Final query:', JSON.stringify(query, null, 2));
    
    const projects = await Project.find(query)
      .populate('client', 'name email')
      .populate('team_members', 'first_name last_name email profile')
      .populate('created_by', 'first_name last_name')
      .sort({ createdAt: -1 });
    
    console.log('Found projects count:', projects.length);
    
    res.json({
      success: true,
      projects: projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects',
      error: error.message
    });
  }
};

// Get project by ID
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name email')
      .populate('team_members', 'first_name last_name email profile')
      .populate('created_by', 'first_name last_name');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project',
      error: error.message
    });
  }
};

// Create new project
const createProject = async (req, res) => {
  try {
    const {
      project_name,
      project_description,
      project_technology,
      client,
      team_members,
      project_start_date,
      project_end_date,
      status
    } = req.body;
    
    // Validate required fields
    if (!project_name || !project_description || !project_technology || !client || !team_members || !project_start_date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Validate client exists
    const clientExists = await Client.findById(client);
    if (!clientExists) {
      return res.status(400).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    // Validate team members exist
    const teamMembersExist = await User.find({ _id: { $in: team_members } });
    if (teamMembersExist.length !== team_members.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more team members not found'
      });
    }
    
    const project = new Project({
      project_name,
      project_description,
      project_technology,
      client,
      team_members,
      project_start_date: new Date(project_start_date),
      project_end_date: project_end_date ? new Date(project_end_date) : null,
      status: status || 'active',
      created_by: req.user.id
    });
    
    await project.save();
    
    // Populate the saved project
    const populatedProject = await Project.findById(project._id)
      .populate('client', 'name email')
      .populate('team_members', 'first_name last_name email profile')
      .populate('created_by', 'first_name last_name');
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: populatedProject
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating project',
      error: error.message
    });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const {
      project_name,
      project_description,
      project_technology,
      client,
      team_members,
      project_start_date,
      project_end_date,
      status
    } = req.body;
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Validate client exists if provided
    if (client) {
      const clientExists = await Client.findById(client);
      if (!clientExists) {
        return res.status(400).json({
          success: false,
          message: 'Client not found'
        });
      }
    }
    
    // Validate team members exist if provided
    if (team_members && team_members.length > 0) {
      const teamMembersExist = await User.find({ _id: { $in: team_members } });
      if (teamMembersExist.length !== team_members.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more team members not found'
        });
      }
    }
    
    // Update fields
    if (project_name) project.project_name = project_name;
    if (project_description) project.project_description = project_description;
    if (project_technology) project.project_technology = project_technology;
    if (client) project.client = client;
    if (team_members) project.team_members = team_members;
    if (project_start_date) project.project_start_date = new Date(project_start_date);
    if (project_end_date !== undefined) project.project_end_date = project_end_date ? new Date(project_end_date) : null;
    if (status) project.status = status;
    
    await project.save();
    
    // Populate the updated project
    const updatedProject = await Project.findById(project._id)
      .populate('client', 'name email')
      .populate('team_members', 'first_name last_name email profile')
      .populate('created_by', 'first_name last_name');
    
    res.json({
      success: true,
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating project',
      error: error.message
    });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    await Project.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting project',
      error: error.message
    });
  }
};

// Get project statistics
const getProjectStats = async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    const activeProjects = await Project.countDocuments({ status: 'active' });
    const inactiveProjects = await Project.countDocuments({ status: 'inactive' });
    
    // Get projects by client
    const projectsByClient = await Project.aggregate([
      {
        $lookup: {
          from: 'clients',
          localField: 'client',
          foreignField: '_id',
          as: 'clientInfo'
        }
      },
      {
        $group: {
          _id: '$client',
          count: { $sum: 1 },
          clientName: { $first: '$clientInfo.name' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    res.json({
      success: true,
      stats: {
        total: totalProjects,
        active: activeProjects,
        inactive: inactiveProjects
      },
      projectsByClient
    });
  } catch (error) {
    console.error('Error fetching project stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project statistics',
      error: error.message
    });
  }
};

// Get clients for dropdown
const getClientsForDropdown = async (req, res) => {
  try {
    const clients = await Client.find({ status: 'active' })
      .select('name email')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      clients
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

// Get employees for team member selection
const getEmployeesForTeam = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' })
      .select('first_name last_name email profile department')
      .sort({ first_name: 1 });
    
    res.json({
      success: true,
      employees
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message
    });
  }
};

// Get projects by client ID
const getProjectsByClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required'
      });
    }
    
    const projects = await Project.find({ client: clientId })
      .populate('client', 'name email')
      .populate('team_members', 'first_name last_name email profile department')
      .populate('created_by', 'first_name last_name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      projects: projects
    });
  } catch (error) {
    console.error('Error fetching projects by client:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects by client',
      error: error.message
    });
  }
};

// Get projects assigned to a specific employee
const getProjectsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // Convert string ID to ObjectId for proper comparison
    const employeeObjectId = new mongoose.Types.ObjectId(employeeId);
    
    // Find projects where the employee is in the team_members array
    const projects = await Project.find({
      team_members: { $in: [employeeObjectId] }
    })
      .populate('client', 'name email')
      .populate('team_members', 'first_name last_name email profile')
      .populate('created_by', 'first_name last_name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      projects: projects
    });
  } catch (error) {
    console.error('Error fetching employee projects:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee projects',
      error: error.message
    });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  getClientsForDropdown,
  getEmployeesForTeam,
  getProjectsByClient,
  getProjectsByEmployee
}; 