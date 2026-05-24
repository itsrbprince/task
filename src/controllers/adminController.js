const Task = require('../models/Task');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../utils/errors');
const { getPagination } = require('../utils/helpers');

const getEmployeeStats = async (employeeId) => {
  const tasks = await Task.find({ assignedTo: employeeId });
  const completed = tasks.filter((t) => t.status === 'completed');
  const pending = tasks.filter((t) => ['pending', 'in_progress'].includes(t.status));
  const overdue = tasks.filter(
    (t) =>
      !['completed', 'cancelled'].includes(t.status) && new Date(t.dueDate) < new Date()
  );
  const avgScore =
    completed.length > 0
      ? completed.reduce((sum, t) => sum + (t.performanceScore || 0), 0) / completed.length
      : 0;
  const completionRate = tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0;

  return {
    totalTasks: tasks.length,
    completedTasks: completed.length,
    pendingTasks: pending.length,
    overdueTasks: overdue.length,
    avgPerformanceScore: Math.round(avgScore * 10) / 10,
    completionRate: Math.round(completionRate * 10) / 10,
  };
};

exports.getOverview = asyncHandler(async (req, res) => {
  const employees = await User.countDocuments({ role: 'employee', status: 'active' });
  const tasks = await Task.find();
  const completed = tasks.filter((t) => t.status === 'completed');
  const pending = tasks.filter((t) => ['pending', 'in_progress'].includes(t.status));
  const overdue = tasks.filter(
    (t) =>
      !['completed', 'cancelled'].includes(t.status) && new Date(t.dueDate) < new Date()
  );

  const scored = completed.filter((t) => t.performanceScore > 0);
  const avgScore =
    scored.length > 0
      ? scored.reduce((s, t) => s + t.performanceScore, 0) / scored.length
      : 0;

  const completionRate = tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0;

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const monthlyAnalytics = await Task.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        created: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const monthlyChart = monthlyAnalytics.map((m) => ({
    label: `${monthNames[m._id.month - 1]} ${m._id.year}`,
    created: m.created,
    completed: m.completed,
  }));

  const deptDistribution = await User.aggregate([
    { $match: { role: 'employee', status: 'active' } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.json({
    success: true,
    data: {
      totalEmployees: employees,
      totalTasks: tasks.length,
      completedTasks: completed.length,
      pendingTasks: pending.length,
      overdueTasks: overdue.length,
      averagePerformanceScore: Math.round(avgScore * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      monthlyAnalytics: monthlyChart,
      departmentDistribution: deptDistribution.map((d) => ({
        department: d._id,
        count: d.count,
      })),
    },
  });
});

exports.getEmployees = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search, department, sort } = req.query;

  const filter = { role: 'employee' };
  if (department) filter.department = department;
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];
  }

  let sortOption = 'name';
  if (sort === 'performance') sortOption = '-createdAt';
  if (sort === 'newest') sortOption = '-createdAt';

  const employees = await User.find(filter).skip(skip).limit(limit).sort(sortOption);
  const total = await User.countDocuments(filter);

  const enriched = await Promise.all(
    employees.map(async (emp) => {
      const stats = await getEmployeeStats(emp._id);
      return { ...emp.toObject(), stats };
    })
  );

  if (sort === 'performance') {
    enriched.sort((a, b) => b.stats.avgPerformanceScore - a.stats.avgPerformanceScore);
  }

  res.json({
    success: true,
    data: enriched,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

exports.getEmployeeById = asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.id);
  if (!employee || employee.role !== 'employee') {
    throw new AppError('Employee not found', 404);
  }

  const stats = await getEmployeeStats(employee._id);
  const tasks = await Task.find({ assignedTo: employee._id })
    .populate('assignedBy', 'name')
    .sort('-createdAt');

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

  const monthlyTrends = await Task.aggregate([
    {
      $match: {
        assignedTo: employee._id,
        createdAt: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        tasks: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        avgScore: { $avg: '$performanceScore' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const categoryBreakdown = await Task.aggregate([
    { $match: { assignedTo: employee._id } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgScore: { $avg: '$performanceScore' },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const recentTasks = tasks.slice(0, 10);
  const topTasks = [...tasks]
    .filter((t) => t.performanceScore > 0)
    .sort((a, b) => b.performanceScore - a.performanceScore)
    .slice(0, 5);

  res.json({
    success: true,
    data: {
      employee,
      stats,
      monthlyTrends,
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: c._id,
        count: c.count,
        avgScore: Math.round((c.avgScore || 0) * 10) / 10,
      })),
      recentTasks,
      topTasks,
    },
  });
});

exports.getDepartments = asyncHandler(async (req, res) => {
  const departments = await User.distinct('department', { role: 'employee' });

  const deptStats = await Promise.all(
    departments.map(async (dept) => {
      const employees = await User.find({ department: dept, role: 'employee', status: 'active' });
      const employeeIds = employees.map((e) => e._id);
      const tasks = await Task.find({ assignedTo: { $in: employeeIds } });
      const completed = tasks.filter((t) => t.status === 'completed');
      const scored = completed.filter((t) => t.performanceScore > 0);
      const avgScore =
        scored.length > 0
          ? scored.reduce((s, t) => s + t.performanceScore, 0) / scored.length
          : 0;

      return {
        department: dept,
        employeeCount: employees.length,
        totalTasks: tasks.length,
        completedTasks: completed.length,
        completionRate:
          tasks.length > 0
            ? Math.round((completed.length / tasks.length) * 1000) / 10
            : 0,
        averageScore: Math.round(avgScore * 10) / 10,
      };
    })
  );

  deptStats.sort((a, b) => b.averageScore - a.averageScore);
  deptStats.forEach((d, i) => {
    d.rank = i + 1;
  });

  res.json({ success: true, data: deptStats });
});

exports.getLeaderboard = asyncHandler(async (req, res) => {
  const employees = await User.find({ role: 'employee', status: 'active' });

  const leaderboard = await Promise.all(
    employees.map(async (emp) => {
      const stats = await getEmployeeStats(emp._id);
      return {
        id: emp._id,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        designation: emp.designation,
        avatar: emp.avatar,
        ...stats,
      };
    })
  );

  leaderboard.sort((a, b) => {
    if (b.avgPerformanceScore !== a.avgPerformanceScore) {
      return b.avgPerformanceScore - a.avgPerformanceScore;
    }
    return b.completionRate - a.completionRate;
  });

  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  res.json({
    success: true,
    data: leaderboard,
    top3: leaderboard.slice(0, 3),
  });
});
