const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const Topic = require('../models/Topic');

// Submit feedback
router.post('/', auth, async (req, res) => {
  try {
    const { topicId, rating, comment } = req.body;

    console.log('Checking for existing feedback:', {
      userId: req.user.userId,
      topicId: topicId
    });

    // Validate input
    if (!topicId) {
      return res.status(400).json({ message: 'Topic ID is required' });
    }
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
    }
    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return res.status(400).json({ message: 'Comment is required' });
    }

    // Check if topic exists
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(400).json({ message: 'Topic not found' });
    }

    // Check for existing feedback
    const existingFeedback = await Feedback.findOne({
      userId: req.user.userId,
      topicId
    });

    console.log('Existing feedback found:', existingFeedback);

    if (existingFeedback) {
      return res.status(400).json({
        message: 'Feedback already exists',
        details: 'You have already provided feedback for this topic'
      });
    }

    const feedback = new Feedback({
      userId: req.user.userId,
      topicId,
      rating,
      comment: comment.trim()
    });

    await feedback.save();
    console.log('Feedback saved successfully:', feedback);

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error submitting feedback' });
  }
});

// Get feedback for a topic
router.get('/topic/:topicId', auth, async (req, res) => {
  try {
    console.log('Fetching feedback for topic:', req.params.topicId);
    
    const feedback = await Feedback.find({ topicId: req.params.topicId })
      .populate('userId', 'email')
      .sort({ createdAt: -1 });
    
    console.log('Found feedback:', feedback);
    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Error fetching feedback' });
  }
});

// Add route to check if user has provided feedback
router.get('/check/:topicId', auth, async (req, res) => {
  try {
    console.log('Checking feedback for:', {
      userId: req.user.userId,
      topicId: req.params.topicId
    });

    const feedback = await Feedback.findOne({
      userId: req.user.userId,
      topicId: req.params.topicId
    });

    console.log('Found feedback:', feedback);
    
    res.json({ 
      exists: !!feedback,
      feedback: feedback ? {
        rating: feedback.rating,
        comment: feedback.comment,
        createdAt: feedback.createdAt
      } : null
    });
  } catch (error) {
    console.error('Error checking feedback:', error);
    res.status(500).json({ message: 'Error checking feedback status' });
  }
});

// Add this temporary debug route
router.get('/debug/all', auth, async (req, res) => {
  try {
    const allFeedback = await Feedback.find({});
    console.log('All feedback:', allFeedback);
    res.json({
      currentUserId: req.user.userId,
      allFeedback: allFeedback
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedback' });
  }
});

// Temporary route to clear feedback (remove in production)
router.delete('/debug/clear', auth, async (req, res) => {
  try {
    await Feedback.deleteMany({});
    res.json({ message: 'All feedback cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing feedback' });
  }
});

module.exports = router; 