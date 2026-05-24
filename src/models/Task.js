const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  uploadedAt: { type: Date, default: Date.now },
});

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const urlSchema = new mongoose.Schema({
  label: { type: String, trim: true, default: '' },
  url: { type: String, required: true, trim: true },
});

const subTaskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending',
  },
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assignee is required'],
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    performanceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    comments: [commentSchema],
    attachments: [attachmentSchema],
    urls: [urlSchema],
    subTasks: [subTaskSchema],
    goalTarget: {
      type: Number,
      min: 0,
      default: null,
    },
    goalsAchieved: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ assignedBy: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ category: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ createdAt: -1 });

taskSchema.virtual('isOverdue').get(function () {
  if (this.status === 'completed' || this.status === 'cancelled') return false;
  return new Date(this.dueDate) < new Date();
});

const { applyTaskMetrics } = require('../utils/performance');

taskSchema.pre('save', function (next) {
  applyTaskMetrics(this);
  next();
});

module.exports = mongoose.model('Task', taskSchema);
module.exports.attachmentSchema = attachmentSchema;
