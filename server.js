require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const { errorHandler } = require('./src/utils/errors');

const authRoutes = require('./src/routes/authRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

connectDB();

const app = express();

const corsOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.NETLIFY_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.length === 0) return callback(null, true);
      if (corsOrigins.some((o) => origin === o || origin.endsWith('.netlify.app'))) {
        return callback(null, true);
      }
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin', adminRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Task Performance API is running' });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
