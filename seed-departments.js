const mongoose = require('mongoose');
require('dotenv').config();

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  head: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Department = mongoose.model('Department', departmentSchema);

const sampleDepartments = [
  {
    name: 'Information Technology',
    head: 'John Smith',
    description: 'Handles all IT infrastructure and development'
  },
  {
    name: 'Human Resources',
    head: 'Sarah Johnson',
    description: 'Manages employee relations and recruitment'
  },
  {
    name: 'Finance',
    head: 'Michael Brown',
    description: 'Handles financial planning and accounting'
  },
  {
    name: 'Marketing',
    head: 'Emily Davis',
    description: 'Manages marketing campaigns and brand strategy'
  },
  {
    name: 'Sales',
    head: 'David Wilson',
    description: 'Handles sales operations and customer relations'
  },
  {
    name: 'Operations',
    head: 'Lisa Anderson',
    description: 'Manages day-to-day business operations'
  },
  {
    name: 'Research & Development',
    head: 'Robert Taylor',
    description: 'Focuses on innovation and product development'
  },
  {
    name: 'Customer Support',
    head: 'Jennifer Martinez',
    description: 'Provides customer service and support'
  }
];

async function seedDepartments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing departments
    await Department.deleteMany({});
    console.log('Cleared existing departments');

    // Insert sample departments
    const result = await Department.insertMany(sampleDepartments);
    console.log(`Added ${result.length} departments:`);
    
    result.forEach(dept => {
      console.log(`- ${dept.name} (Head: ${dept.head})`);
    });

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDepartments(); 