const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const buildTaskFilter = (query, user) => {
  const filter = {};

  if (user.role === 'employee') {
    filter.assignedTo = user._id;
  } else if (query.assignedTo) {
    filter.assignedTo = query.assignedTo;
  }

  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.category) filter.category = new RegExp(query.category, 'i');

  if (query.search) {
    filter.$or = [
      { title: new RegExp(query.search, 'i') },
      { description: new RegExp(query.search, 'i') },
    ];
  }

  if (query.overdue === 'true') {
    filter.status = { $nin: ['completed', 'cancelled'] };
    filter.dueDate = { $lt: new Date() };
  }

  return filter;
};

const getSortOption = (sortBy = '-createdAt') => {
  const sortMap = {
    newest: '-createdAt',
    oldest: 'createdAt',
    dueDate: 'dueDate',
    priority: '-priority',
    progress: '-progress',
    score: '-performanceScore',
  };
  return sortMap[sortBy] || sortBy;
};

module.exports = { getPagination, buildTaskFilter, getSortOption };
