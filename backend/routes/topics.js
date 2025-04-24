const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { speakerAuth } = require('../middleware/roleAuth');
const Topic = require('../models/Topic');
const mongoose = require('mongoose');
const Question = require('../models/Question');
const User = require('../models/User');
const Feedback = require('../models/Feedback');

// Create a new topic
router.post('/', auth, speakerAuth, async (req, res) => {
  try {
    console.log('Creating topic with data:', req.body);
    
    const { name, speakerInfo, startTime, endTime } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Topic name is required' });
    }

    if (!speakerInfo || !speakerInfo.speakerName || !speakerInfo.conferenceTime) {
      return res.status(400).json({ message: 'Speaker information is incomplete' });
    }

    // Check if this speaker already has a topic with this name
    const existingTopic = await Topic.findOne({
      speakerId: req.user.userId,
      name: name.trim()
    });

    if (existingTopic) {
      return res.status(400).json({ 
        message: 'You already have a topic with this name' 
      });
    }

    // Get speaker details
    const speaker = await User.findById(req.user.userId);
    if (!speaker) {
      return res.status(404).json({ message: 'Speaker not found' });
    }

    // Create new topic
    const topic = new Topic({
      name: name.trim(),
      speakerId: req.user.userId,
      speakerInfo: {
        speakerName: speakerInfo.speakerName,
        conferenceTime: new Date(speakerInfo.conferenceTime),
        duration: speakerInfo.duration || 60,
        avatar: speaker.profile?.avatar || null
      },
      startTime: new Date(startTime),
      endTime: new Date(endTime)
    });

    console.log('Saving topic:', topic);
    await topic.save();

    res.status(201).json(topic);
  } catch (error) {
    console.error('Topic creation error:', error);
    res.status(500).json({ 
      message: 'Error creating topic',
      error: error.message 
    });
  }
});

// Get all topics (for listeners)
router.get('/', auth, async (req, res) => {
  try {
    const topics = await Topic.find()
      .populate('speakerId', 'email profile')
      .sort({ startTime: 1 });
    
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching topics' });
  }
});

// Get topics for a specific speaker
router.get('/speaker', auth, speakerAuth, async (req, res) => {
  try {
    console.log('Fetching topics for speaker:', req.user.userId);
    
    const topics = await Topic.find({ 
      speakerId: req.user.userId  // Only get topics created by this speaker
    }).sort({ startTime: 1 });

    console.log('Found topics:', topics.length);
    res.json(topics);
  } catch (error) {
    console.error('Error fetching speaker topics:', error);
    res.status(500).json({ message: 'Error fetching topics' });
  }
});

// Update topic (ensure speaker can only update their own topics)
router.patch('/:topicId', [auth, speakerAuth], async (req, res) => {
  try {
    const topic = await Topic.findOne({
      _id: req.params.topicId,
      speakerId: req.user.userId  // Ensure speaker owns this topic
    });

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found or unauthorized' });
    }

    // Update the topic
    Object.assign(topic, req.body);
    await topic.save();

    res.json(topic);
  } catch (error) {
    console.error('Error updating topic:', error);
    res.status(500).json({ message: 'Error updating topic' });
  }
});

// Delete topic (ensure speaker can only delete their own topics)
router.delete('/:topicId', [auth, speakerAuth], async (req, res) => {
  try {
    // First find the topic and ensure it belongs to the speaker
    const topic = await Topic.findOne({
      _id: req.params.topicId,
      speakerId: req.user.userId
    });

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found or unauthorized' });
    }

    // Delete all questions associated with this topic
    const deletedQuestions = await Question.deleteMany({ 
      $or: [
        { topicId: topic._id },
        { topic: topic.name }
      ]
    });

    // Delete all feedback associated with this topic
    const deletedFeedback = await Feedback.deleteMany({ 
      topicId: topic._id 
    });

    // Delete the topic itself
    await Topic.deleteOne({ _id: topic._id });

    console.log('Deletion results:', {
      topicId: topic._id,
      topicName: topic.name,
      questionsDeleted: deletedQuestions.deletedCount,
      feedbackDeleted: deletedFeedback.deletedCount
    });
    
    res.json({ 
      message: 'Topic and all associated data deleted successfully',
      deletedQuestions: deletedQuestions.deletedCount,
      deletedFeedback: deletedFeedback.deletedCount
    });

  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ message: 'Error deleting topic and associated data' });
  }
});

module.exports = router; 