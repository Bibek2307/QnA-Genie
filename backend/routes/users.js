const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'avatars');
    console.log('Upload directory:', uploadDir);
    
    if (!fs.existsSync(uploadDir)) {
      console.log('Creating upload directory');
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'avatar-' + uniqueSuffix + path.extname(file.originalname);
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

// Add error handling to multer
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    console.log('Received file:', file);
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
}).single('avatar');

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      profile: user.profile,
      avatar: user.profile?.avatar
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Upload avatar
router.post('/avatar', auth, (req, res) => {
  upload(req, res, async function(err) {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ message: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      console.log('File uploaded:', req.file);
      const avatarPath = `/uploads/avatars/${req.file.filename}`;
      console.log('Avatar path to be saved:', avatarPath);

      const updatedUser = await User.findByIdAndUpdate(
        req.user.userId,
        { 'profile.avatar': avatarPath },
        { new: true }
      );

      console.log('Updated user:', updatedUser);

      res.json({
        message: 'Avatar uploaded successfully',
        avatar: avatarPath
      });
    } catch (error) {
      console.error('Error in avatar upload:', error);
      res.status(500).json({ message: 'Error uploading avatar' });
    }
  });
});

// Test file access
router.get('/test-avatar', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user?.profile?.avatar) {
      return res.json({ message: 'No avatar found' });
    }

    const avatarPath = path.join(__dirname, '..', user.profile.avatar);
    const exists = fs.existsSync(avatarPath);

    res.json({
      avatarPath: user.profile.avatar,
      absolutePath: avatarPath,
      exists,
      baseUrl: `http://localhost:5001`
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking avatar' });
  }
});

module.exports = router; 