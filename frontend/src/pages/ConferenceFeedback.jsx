import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, StarIcon } from 'lucide-react';
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useDarkMode } from '../context/DarkModeContext';
import api from '../utils/api';

const ConferenceFeedback = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await api.get('/topics');
        setTopics(response.data);
      } catch (error) {
        setError('Failed to load topics');
      }
    };
    fetchTopics();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTopic || !rating || !comment.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await api.post('/feedback', {
        topicId: selectedTopic,
        rating,
        comment
      });

      alert('Thank you for your feedback!');
      navigate('/submit-question');
    } catch (error) {
      console.error('Feedback submission error:', error);
      if (error.response?.status === 400 && error.response.data.message === 'Feedback already exists') {
        setError('You have already provided feedback for this topic');
      } else {
        setError(error.response?.data?.message || 'Failed to submit feedback');
      }
    }
  };

  useEffect(() => {
    const checkExistingFeedback = async () => {
      if (selectedTopic) {
        try {
          const response = await api.get(`/feedback/check/${selectedTopic}`);
          if (response.data.exists) {
            setError('You have already provided feedback for this topic');
          }
        } catch (error) {
          console.error('Error checking feedback:', error);
        }
      }
    };

    checkExistingFeedback();
  }, [selectedTopic]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Conference Feedback</h1>
            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-6">
          {error && (
            <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Select Topic</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">Choose a topic</option>
                {topics.map((topic) => (
                  <option key={topic._id} value={topic._id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>

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
                className="w-full px-3 py-2 border rounded-md"
                rows={4}
                placeholder="Share your thoughts about the conference..."
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Submit Feedback
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default ConferenceFeedback; 