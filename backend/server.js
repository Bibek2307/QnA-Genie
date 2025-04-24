const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const topicsRoutes = require('./routes/topics');
const feedbackRoutes = require('./routes/feedback');
const usersRoutes = require('./routes/users');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'x-auth-token']
}));

app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads/avatars');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/users', usersRoutes);

// Add a route to check if images are accessible
app.get('/check-image/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', 'avatars', req.params.filename);
  console.log('Checking image path:', filePath);
  if (fs.existsSync(filePath)) {
    res.json({ exists: true, path: filePath });
  } else {
    res.json({ exists: false, path: filePath });
  }
});

// Add this for debugging
app.get('/check-file/*', (req, res) => {
  const filePath = path.join(__dirname, req.params[0]);
  console.log('Checking file:', filePath);
  if (fs.existsSync(filePath)) {
    res.json({ exists: true, path: filePath });
  } else {
    res.json({ exists: false, path: filePath });
  }
});

// Add test route for image serving
app.get('/test-image/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', 'avatars', req.params.filename);
  console.log('Testing image access:', {
    requested: req.params.filename,
    fullPath: filePath,
    exists: fs.existsSync(filePath)
  });
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ 
      message: 'Image not found',
      path: filePath
    });
  }
});

// MongoDB connection
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 