require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Task = require('../src/models/Task');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Task.deleteMany({});

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@company.com',
      password: 'admin123',
      role: 'admin',
      department: 'Management',
      designation: 'System Administrator',
      status: 'active',
    });

    const employees = await User.create([
      {
        name: 'Sarah Johnson',
        email: 'sarah@company.com',
        password: 'employee123',
        role: 'employee',
        department: 'Engineering',
        designation: 'Senior Developer',
      },
      {
        name: 'Michael Chen',
        email: 'michael@company.com',
        password: 'employee123',
        role: 'employee',
        department: 'Marketing',
        designation: 'Marketing Lead',
      },
      {
        name: 'Emily Davis',
        email: 'emily@company.com',
        password: 'employee123',
        role: 'employee',
        department: 'Engineering',
        designation: 'Frontend Developer',
      },
      {
        name: 'James Wilson',
        email: 'james@company.com',
        password: 'employee123',
        role: 'employee',
        department: 'Sales',
        designation: 'Sales Executive',
      },
      {
        name: 'Lisa Anderson',
        email: 'lisa@company.com',
        password: 'employee123',
        role: 'employee',
        department: 'HR',
        designation: 'HR Manager',
      },
    ]);

    const categories = ['Development', 'Marketing', 'Sales', 'Research', 'Operations'];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const statuses = ['pending', 'in_progress', 'completed'];

    const tasks = [];
    const now = new Date();

    for (let i = 0; i < 30; i++) {
      const emp = employees[i % employees.length];
      const status = statuses[i % statuses.length];
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + (i % 14) - 5);

      tasks.push({
        title: `Task ${i + 1}: ${categories[i % categories.length]} Initiative`,
        description: `Detailed description for task ${i + 1}. Complete all deliverables on schedule.`,
        assignedTo: emp._id,
        assignedBy: admin._id,
        priority: priorities[i % priorities.length],
        category: categories[i % categories.length],
        dueDate,
        status,
        progress: status === 'completed' ? 100 : status === 'in_progress' ? 50 + (i % 40) : 0,
        performanceScore: status === 'completed' ? 60 + (i % 40) : 0,
        comments: [
          {
            text: 'Initial review completed.',
            author: admin._id,
          },
        ],
      });
    }

    await Task.insertMany(tasks);

    console.log('\n✅ Seed completed successfully!\n');
    console.log('Login credentials:');
    console.log('  Admin:    admin@company.com / admin123');
    console.log('  Employee: sarah@company.com / employee123');
    console.log('  (All employees use password: employee123)\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
