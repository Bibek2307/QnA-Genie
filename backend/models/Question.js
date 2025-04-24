const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true
  },
  speakerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isAnonymous: {
    type: Boolean,
    default: true
  },
  username: {
    type: String,
    default: ''
  },
  userEmail: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isRelevant: { 
    type: Boolean, 
    required: true,
    default: false
  },
  confidence: { 
    type: Number, 
    required: true,
    default: 0
  },
  score: { 
    type: Number, 
    required: true,
    default: 0
  }
});

// Update indexes
questionSchema.index({ userId: 1, createdAt: -1 });
questionSchema.index({ topicId: 1, speakerId: 1 });

module.exports = mongoose.model('Question', questionSchema); 