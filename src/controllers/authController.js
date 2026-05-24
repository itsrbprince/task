const crypto = require('crypto');
const User = require('../models/User');
const { signToken } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../utils/errors');

const sendAuthResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
      avatar: user.avatar,
      status: user.status,
    },
  });
};

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, designation } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('Email already registered', 400);
  }

  if (role === 'admin' && (!req.user || req.user.role !== 'admin')) {
    throw new AppError('Only admins can create admin accounts', 403);
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'employee',
    department,
    designation,
  });

  sendAuthResponse(user, 201, res);
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  if (user.status === 'inactive') {
    throw new AppError('Account is inactive', 403);
  }

  sendAuthResponse(user, 200, res);
});

exports.getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

exports.getEmployees = asyncHandler(async (req, res) => {
  const employees = await User.find({ role: 'employee', status: 'active' })
    .select('name email department designation avatar')
    .sort('name');
  res.json({ success: true, data: employees });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  const response = {
    success: true,
    message: 'If that email is registered, a reset link has been generated.',
  };

  if (!user) {
    return res.json(response);
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get('host')}/#/reset-password?token=${resetToken}`;

  if (process.env.NODE_ENV === 'development') {
    response.resetUrl = resetUrl;
    response.resetToken = resetToken;
    response.devNote = 'Reset link shown in development only (no email server configured).';
  }

  res.json(response);
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    throw new AppError('Token and new password are required', 400);
  }
  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpire');

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({ success: true, message: 'Password reset successfully. You can now sign in.' });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new AppError('Current and new password are required', 400);
  }
  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters', 400);
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 401);
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password changed successfully' });
});
