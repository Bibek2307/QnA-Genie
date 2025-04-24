const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password must be at least 6 characters'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: {
      values: ['listener', 'speaker'],
      message: '{VALUE} is not a valid role'
    },
    required: [true, 'Role is required']
  },
  profile: {
    name: String,
    bio: String,
    organization: String,
    avatar: {
      type: String,
      default: null
    }
  }
}, {
  timestamps: true
});

// Create a compound unique index for email and role combination
userSchema.index({ email: 1, role: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema); 