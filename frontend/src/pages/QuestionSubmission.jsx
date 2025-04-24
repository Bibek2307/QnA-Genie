import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, StarIcon, LogOut, User } from 'lucide-react';
import api from '../utils/api';
import { Button } from "../components/ui/button";
import { useDarkMode } from '../context/DarkModeContext';
import { Card } from "../components/ui/card";
import { TopicSelector } from "../components/TopicSelector";
import { FeedbackButton } from "../components/FeedbackButton";
import { FeedbackForm } from "../components/FeedbackForm";
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent } from "../components/ui/tooltip";
import { UserProfile } from "../components/UserProfile";
import { Input } from "../components/ui/input";
import { UserProfilePopup } from "../components/UserProfilePopup";

const SpeakerCard = ({ topic }) => {
  if (!topic?.speakerInfo) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Card className="p-4 mt-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{topic.name}</h3>
            <p className="text-sm text-muted-foreground">
              Speaker: {topic.speakerInfo.speakerName}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-muted-foreground">Date</p>
            <p>{formatDate(topic.startTime)}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Time</p>
            <p>{formatTime(topic.startTime)}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Duration</p>
            <p>{topic.speakerInfo.duration} minutes</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

const QuestionSubmission = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [question, setQuestion] = useState('');
  const [topic, setTopic] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [lastSubmittedTopic, setLastSubmittedTopic] = useState(null);
  const [hasProvidedFeedback, setHasProvidedFeedback] = useState({});
  const [showProfile, setShowProfile] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [username, setUsername] = useState('');
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await api.get('/topics');
        console.log('Fetched topics:', response.data);
        setTopics(response.data);
      } catch (error) {
        console.error('Error fetching topics:', error);
        setError('Failed to load topics');
      }
    };
    fetchTopics();
  }, []);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    console.log('Loading email:', email); // Debug log
    setUserEmail(email || ''); // Ensure we set empty string if null
  }, []);

  useEffect(() => {
    const checkFeedbackStatus = async () => {
      if (lastSubmittedTopic?._id) {
        try {
          const response = await api.get(`/feedback/check/${lastSubmittedTopic._id}`);
          setHasProvidedFeedback(prev => ({
            ...prev,
            [lastSubmittedTopic._id]: response.data.exists
          }));
        } catch (error) {
          console.error('Error checking feedback status:', error);
        }
      }
    };

    checkFeedbackStatus();
  }, [lastSubmittedTopic]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!selectedTopic) {
      setError('Please select a topic');
      return;
    }

    if (!question.trim()) {
      setError('Please enter your question');
      return;
    }

    try {
      const response = await api.post('/questions', {
        topicId: selectedTopic._id,
        speakerId: selectedTopic.speakerId,
        content: question,
        isAnonymous,
        username: isAnonymous ? '' : username,
        userEmail
      });

      // Set the last submitted topic here
      setLastSubmittedTopic(selectedTopic);
      
      // Clear the form
      setQuestion('');
      setSuccess('Question submitted successfully!');
      
      // Check if feedback already exists for this topic
      try {
        const feedbackResponse = await api.get(`/feedback/check/${selectedTopic._id}`);
        setHasProvidedFeedback(prev => ({
          ...prev,
          [selectedTopic._id]: feedbackResponse.data.hasFeedback
        }));
      } catch (error) {
        console.error('Error checking feedback status:', error);
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error submitting question:', error);
      setError(error.response?.data?.message || 'Failed to submit question');
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleTopicChange = (e) => {
    const topicId = e.target.value;
    const selected = topics.find(t => t._id === topicId);
    setSelectedTopic(selected);
    setTopic(selected?.name || '');
  };

  const checkExistingFeedback = async (topicId) => {
    try {
      const response = await api.get(`/feedback/check/${topicId}`);
      setHasProvidedFeedback(prev => ({
        ...prev,
        [topicId]: response.data.exists
      }));
      return response.data.exists;
    } catch (error) {
      console.error('Error checking feedback:', error);
      return false;
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!rating || !comment.trim()) {
      setError('Please provide both rating and feedback');
      return;
    }

    try {
      console.log('Submitting feedback with data:', {
        topicId: lastSubmittedTopic._id,
        rating,
        comment
      });

      await api.post('/feedback', {
        topicId: lastSubmittedTopic._id,
        rating: Number(rating),
        comment: comment.trim()
      });

      setRating(0);
      setComment('');
      setLastSubmittedTopic(null);
      setHasProvidedFeedback(prev => ({
        ...prev,
        [lastSubmittedTopic._id]: true
      }));
      alert('Thank you for your feedback!');
    } catch (error) {
      console.error('Feedback submission error:', error);
      if (error.response?.status === 400 && error.response.data.message === 'Feedback already exists') {
        setError('You have already provided feedback for this topic');
      } else {
        setError(error.response?.data?.message || 'Failed to submit feedback');
      }
    }
  };

  const TopicSelector = ({ topics, onSelect, selectedTopic }) => {
    return (
      <div className="space-y-4">
        {topics.map((topic) => (
          <div
            key={topic._id}
            className={`p-4 border rounded-lg cursor-pointer ${
              selectedTopic?._id === topic._id ? 'border-primary' : 'border-border'
            }`}
            onClick={() => onSelect(topic)}
          >
            <h3 className="font-semibold">{topic.name}</h3>
            <div className="text-sm text-muted-foreground">
              <p>Speaker: {topic.speakerInfo.speakerName}</p>
              <p>Time: {new Date(topic.speakerInfo.conferenceTime).toLocaleString()}</p>
              <p>Duration: {topic.speakerInfo.duration} minutes</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-background text-foreground`}>
      {/* Header */}
      <header className="bg-card shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Submit Questions</h1>
            
            <div className="flex items-center gap-2">
              <TooltipProvider delayDuration={0}>
                <TooltipRoot>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleDarkMode}
                    >
                      {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Switch to {isDarkMode ? 'light' : 'dark'} mode</p>
                  </TooltipContent>
                </TooltipRoot>
              </TooltipProvider>

              <TooltipProvider delayDuration={0}>
                <TooltipRoot>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowProfilePopup(true)}
                    >
                      <User className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>User profile</p>
                  </TooltipContent>
                </TooltipRoot>
              </TooltipProvider>

              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="px-4 py-2 sm:px-0">
          {/* Question Submission Card */}
          <div className="bg-card rounded-lg shadow p-4 mb-3">
            {error && (
              <div className="mb-3 p-3 text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-3 p-3 text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-200 rounded-md">
                {success}
              </div>
            )}
            
            <h2 className="text-2xl font-semibold mb-3">
              Submit Your Question
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="topic" className="block text-sm font-medium">
                  Topic
                </label>
                <select
                  id="topic"
                  value={selectedTopic?._id || ''}
                  onChange={handleTopicChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border rounded-md bg-background"
                  required
                >
                  <option value="">Select a topic</option>
                  {topics.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTopic && <SpeakerCard topic={selectedTopic} />}

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="anonymous" className="text-sm font-medium">
                    Submit Anonymously
                  </label>
                </div>

                {!isAnonymous && (
                  <div className="space-y-2">
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your name"
                      required={!isAnonymous}
                      className="w-full"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Note: When submitting non-anonymously, both your name and email address will be visible to the speaker.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="question" className="block text-sm font-medium">
                  Your Question
                </label>
                <textarea
                  id="question"
                  rows={4}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-background"
                  placeholder="Type your question here..."
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || (!isAnonymous && !username.trim())}
                className="w-full"
              >
                {isLoading ? 'Submitting...' : 'Submit Question'}
              </Button>
            </form>
          </div>

          {/* Feedback Card */}
          {lastSubmittedTopic && !hasProvidedFeedback[lastSubmittedTopic._id] && (
            <div className="mt-8 bg-card rounded-lg shadow p-5">
              <h2 className="text-2xl font-semibold mb-6">
                Conference Feedback for "{lastSubmittedTopic.name}"
              </h2>
              
              <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`p-1 rounded-full hover:bg-gray-100 ${
                          rating >= star ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        <StarIcon className="w-8 h-8" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your Feedback
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                    rows={4}
                    placeholder="Share your thoughts about the conference..."
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  Submit Feedback
                </Button>
              </form>
            </div>
          )}

          {/* Show message if feedback was already provided */}
          {lastSubmittedTopic && hasProvidedFeedback[lastSubmittedTopic._id] && (
            <div className="mt-8 bg-card rounded-lg shadow p-5">
              <p className="text-center text-muted-foreground">
                Thank you! You have already provided feedback for "{lastSubmittedTopic.name}".
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Add profile modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <UserProfile onClose={() => setShowProfile(false)} />
        </div>
      )}

      {/* Add the popup */}
      {showProfilePopup && (
        <UserProfilePopup
          email={userEmail}
          role="listener"
          onClose={() => setShowProfilePopup(false)}
        />
      )}
    </div>
  );
};

export default QuestionSubmission; 