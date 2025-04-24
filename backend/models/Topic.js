const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Topic name is required'],
    trim: true
  },
  speakerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  speakerInfo: {
    speakerName: {
      type: String,
      required: true
    },
    conferenceTime: {
      type: Date,
      required: true
    },
    duration: {
      type: Number,
      default: 60
    },
    avatar: {
      type: String,
      default: null
    }
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed'],
    default: 'upcoming'
  }
}, {
  timestamps: true
});

// Only keep this one index for unique topic names per speaker
topicSchema.index({ speakerId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Topic', topicSchema); 