const path = require('path');
const fs = require('fs');
const Task = require('../models/Task');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../utils/errors');
const { getPagination, buildTaskFilter, getSortOption } = require('../utils/helpers');
const { normalizeTaskPayload, applyTaskMetrics } = require('../utils/performance');

const populateFields = 'name email department designation avatar';
const uploadDir = path.join(__dirname, '../../uploads');

const canAccessTask = (task, user) => {
  if (user.role === 'admin') return true;
  return (
    task.assignedTo._id.toString() === user._id.toString() ||
    task.assignedBy._id.toString() === user._id.toString()
  );
};

exports.getTasks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = buildTaskFilter(req.query, req.user);
  const sort = getSortOption(req.query.sort);

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignedTo', populateFields)
      .populate('assignedBy', populateFields)
      .populate('comments.author', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: tasks,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

exports.getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', populateFields)
    .populate('assignedBy', populateFields)
    .populate('comments.author', 'name avatar email')
    .populate('attachments.uploadedBy', 'name avatar');

  if (!task) throw new AppError('Task not found', 404);
  if (!canAccessTask(task, req.user)) throw new AppError('Access denied', 403);

  res.json({ success: true, data: task });
});

exports.createTask = asyncHandler(async (req, res) => {
  const payload = normalizeTaskPayload(req.body);
  const { title, description, assignedTo, priority, category, dueDate, status, progress } =
    payload;

  const assignee = await User.findById(assignedTo);
  if (!assignee) throw new AppError('Assignee not found', 404);

  if (req.user.role === 'employee' && assignedTo !== req.user._id.toString()) {
    throw new AppError('Employees can only create tasks for themselves', 403);
  }

  const task = await Task.create({
    title,
    description,
    assignedTo,
    assignedBy: req.user._id,
    priority,
    category,
    dueDate,
    status: status || 'pending',
    progress: progress || 0,
    urls: payload.urls || [],
    subTasks: payload.subTasks || [],
    goalTarget: payload.goalTarget,
    goalsAchieved: payload.goalsAchieved ?? 0,
    performanceScore: payload.performanceScore || 0,
  });

  const populated = await Task.findById(task._id)
    .populate('assignedTo', populateFields)
    .populate('assignedBy', populateFields);

  res.status(201).json({ success: true, data: populated });
});

exports.updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', '_id')
    .populate('assignedBy', '_id');

  if (!task) throw new AppError('Task not found', 404);
  if (!canAccessTask(task, req.user)) throw new AppError('Access denied', 403);

  const payload = normalizeTaskPayload(req.body);

  const allowed = [
    'title',
    'description',
    'assignedTo',
    'priority',
    'category',
    'dueDate',
    'status',
    'progress',
    'urls',
    'subTasks',
    'goalTarget',
    'goalsAchieved',
  ];

  if (req.user.role === 'employee') {
    ['assignedTo', 'performanceScore'].forEach((f) => delete payload[f]);
  } else if (payload.performanceScore !== undefined) {
    allowed.push('performanceScore');
  }

  allowed.forEach((field) => {
    if (payload[field] !== undefined) task[field] = payload[field];
  });

  if (payload.status === 'completed' && task.progress < 100) {
    task.progress = 100;
  }

  if (task.progress === 100 && task.status !== 'completed' && task.status !== 'cancelled') {
    task.status = 'completed';
  }

  applyTaskMetrics(task);
  await task.save();

  const populated = await Task.findById(task._id)
    .populate('assignedTo', populateFields)
    .populate('assignedBy', populateFields)
    .populate('comments.author', 'name avatar');

  res.json({ success: true, data: populated });
});

exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new AppError('Task not found', 404);

  if (req.user.role !== 'admin' && task.assignedBy.toString() !== req.user._id.toString()) {
    throw new AppError('Access denied', 403);
  }

  task.attachments.forEach((att) => {
    const filePath = path.join(uploadDir, att.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });

  await task.deleteOne();
  res.json({ success: true, message: 'Task deleted' });
});

exports.addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) throw new AppError('Comment text is required', 400);

  const task = await Task.findById(req.params.id)
    .populate('assignedTo', '_id')
    .populate('assignedBy', '_id');
  if (!task) throw new AppError('Task not found', 404);
  if (!canAccessTask(task, req.user)) throw new AppError('Access denied', 403);

  task.comments.push({ text: text.trim(), author: req.user._id });
  await task.save();

  const populated = await Task.findById(task._id).populate('comments.author', 'name avatar');
  res.json({ success: true, data: populated.comments });
});

exports.uploadAttachments = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new AppError('Task not found', 404);

  const populatedForAccess = await Task.findById(req.params.id)
    .populate('assignedTo', '_id')
    .populate('assignedBy', '_id');
  if (!canAccessTask(populatedForAccess, req.user)) throw new AppError('Access denied', 403);

  if (!req.files?.length) throw new AppError('No files uploaded', 400);

  const remaining = 10 - task.attachments.length;
  if (req.files.length > remaining) {
    req.files.slice(remaining).forEach((f) => {
      if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
    });
    if (remaining <= 0) throw new AppError('Maximum 10 attachments per task', 400);
  }

  const filesToAdd = req.files.slice(0, remaining);
  const newAttachments = filesToAdd.map((file) => ({
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    uploadedBy: req.user._id,
  }));

  task.attachments.push(...newAttachments);
  await task.save();

  const updated = await Task.findById(task._id).populate(
    'attachments.uploadedBy',
    'name avatar'
  );

  res.status(201).json({ success: true, data: updated.attachments });
});

exports.deleteAttachment = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new AppError('Task not found', 404);

  const attachment = task.attachments.id(req.params.attachmentId);
  if (!attachment) throw new AppError('Attachment not found', 404);

  const filePath = path.join(uploadDir, attachment.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  attachment.deleteOne();
  await task.save();

  res.json({ success: true, message: 'Attachment deleted' });
});

exports.downloadFile = asyncHandler(async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDir, filename);

  if (!fs.existsSync(filePath)) throw new AppError('File not found', 404);

  const task = await Task.findOne({ 'attachments.filename': filename });
  if (!task) throw new AppError('File not found', 404);

  const populated = await Task.findById(task._id)
    .populate('assignedTo', '_id')
    .populate('assignedBy', '_id');

  if (!canAccessTask(populated, req.user)) throw new AppError('Access denied', 403);

  const attachment = task.attachments.find((a) => a.filename === filename);
  res.download(filePath, attachment?.originalName || filename);
});
