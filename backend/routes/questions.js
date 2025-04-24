const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Question = require('../models/Question');
const Topic = require('../models/Topic');
const mongoose = require('mongoose');
const { speakerAuth } = require('../middleware/roleAuth');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { listenerAuth } = require('../middleware/roleAuth');
const aiService = require('../services/aiService');

// Add this test route at the top of your routes
router.get('/test', async (req, res) => {
  try {
    console.log('Test route hit');
    res.json({ message: 'Test successful' });
  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({ message: 'Test failed' });
  }
});

// Submit a question
router.post('/', auth, async (req, res) => {
  try {
    const { topicId, speakerId, content, isAnonymous, username, userEmail } = req.body;

    // Validate the topic exists
    const topic = await Topic.findOne({
      _id: topicId,
      speakerId: speakerId
    });

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Get AI analysis
    const aiAnalysis = await aiService.analyzeQuestion(content, topic.name);

    // Create new question with AI results
    const question = new Question({
      userId: req.user.userId,
      topicId: topic._id,
      speakerId: speakerId,
      content,
      isAnonymous,
      username: isAnonymous ? '' : username,
      userEmail: userEmail,
      isRelevant: aiAnalysis.isRelevant,
      confidence: aiAnalysis.confidence,
      score: aiAnalysis.score
    });

    await question.save();
    res.status(201).json(question);
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ message: 'Error creating question' });
  }
});

// Get all questions for a user
router.get('/my-questions', auth, async (req, res) => {
  try {
    const questions = await Question.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Error fetching questions' });
  }
});

// Get all questions (filtered by speaker's topics if user is a speaker)
router.get('/speaker-questions', auth, speakerAuth, async (req, res) => {
  try {
    // Get all topics for this speaker
    const topics = await Topic.find({ speakerId: req.user.userId });
    
    if (!topics.length) {
      return res.json({
        relevantQuestions: [],
        nonRelevantQuestions: [],
        counts: { relevant: 0, nonRelevant: 0 }
      });
    }

    const topicIds = topics.map(topic => topic._id);

    // Get all questions for this speaker's topics
    const questions = await Question.find({
      topicId: { $in: topicIds }
    })
    .populate('userId', 'email')
    .populate('topicId', 'name')
    .sort({ createdAt: -1 });

    console.log('Found questions:', questions.length);

    // Process questions and maintain user anonymity where requested
    const processedQuestions = questions.map(q => {
      const questionObj = q.toObject();
      if (questionObj.isAnonymous) {
        questionObj.username = 'Anonymous';
        questionObj.userEmail = '';
      }
      return questionObj;
    });

    // Group questions by topic
    const questionsByTopic = {};
    topics.forEach(topic => {
      const topicQuestions = processedQuestions.filter(q => 
        q.topicId._id.toString() === topic._id.toString()
      );
      
      questionsByTopic[topic.name] = {
        relevant: topicQuestions.filter(q => q.isRelevant),
        nonRelevant: topicQuestions.filter(q => !q.isRelevant)
      };
    });

    res.json({
      questionsByTopic,
      counts: {
        relevant: processedQuestions.filter(q => q.isRelevant).length,
        nonRelevant: processedQuestions.filter(q => !q.isRelevant).length
      }
    });

  } catch (error) {
    console.error('Error fetching speaker questions:', error);
    res.status(500).json({ message: 'Error fetching questions' });
  }
});

// Update question status (speaker only)
router.patch('/:questionId/status', [auth, speakerAuth], async (req, res) => {
  try {
    const { status } = req.body;
    const question = await Question.findById(req.params.questionId);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    question.status = status;
    await question.save();

    res.json(question);
  } catch (error) {
    console.error('Error updating question status:', error);
    res.status(500).json({ message: 'Error updating question status' });
  }
});

// Add delete question route
router.delete('/:questionId', [auth, speakerAuth], async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Verify the question belongs to one of the speaker's topics
    const speakerTopics = await Topic.find({
      createdBy: new mongoose.Types.ObjectId(req.user.userId),
      active: true
    });
    
    const speakerTopicNames = speakerTopics.map(topic => topic.name);
    if (!speakerTopicNames.includes(question.topic)) {
      return res.status(403).json({ 
        message: 'You can only delete questions for your own topics' 
      });
    }

    await Question.findByIdAndDelete(req.params.questionId);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ message: 'Error deleting question' });
  }
});

module.exports = router; 