const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Import routes
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const topicsRouter = require('./routes/topics');
const questionsRouter = require('./routes/questions');
const feedbackRouter = require('./routes/feedback');

// Middleware
app.use(cors());
app.use(express.json());

// Static files
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads/avatars');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Register routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/feedback', feedbackRouter);

module.exports = app;