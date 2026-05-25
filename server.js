require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const connectDB = require('./src/config/db');
const { errorHandler } = require('./src/utils/errors');

const authRoutes = require('./src/routes/authRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const PORT = process.env.PORT || 5000;

const app = express();

// Connect Database
connectDB();

// CORS Configuration
const corsOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.NETLIFY_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin
      if (!origin) return callback(null, true);

      // Allow Netlify domains
      if (/\.netlify\.app$/i.test(origin)) {
        return callback(null, true);
      }

      // Allow configured origins
      if (corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow all in development
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin', adminRoutes);

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Task Performance API is running',
  });
});

// Frontend Route
app.get('*', (req, res) => {
  // Prevent API 404 issue
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: 'API route not found',
    });
  }

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error Handler
app.use(errorHandler);

// IMPORTANT FOR VERCEL

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});