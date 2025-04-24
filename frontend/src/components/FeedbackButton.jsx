import React, { useState } from 'react';
import { Button } from "./ui/button";
import { FeedbackForm } from "./FeedbackForm";
import api from '../utils/api';

export const FeedbackButton = ({ topicId }) => {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const handleSubmitFeedback = async (feedbackData) => {
    try {
      console.log('Submitting feedback:', feedbackData);  // Debug log
      await api.submitFeedback({
        topicId: topicId,
        ...feedbackData
      });
      setShowForm(false);
      // Optional: Show success message
      alert('Feedback submitted successfully!');
    } catch (error) {
      console.error('Feedback submission error:', error);  // Debug log
      setError(error.response?.data?.message || 'Failed to submit feedback');
    }
  };

  return (
    <div>
      <Button 
        onClick={() => setShowForm(true)}
        className="w-full"
      >
        Submit Feedback
      </Button>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full">
            <FeedbackForm
              topicId={topicId}
              onSubmit={handleSubmitFeedback}
              onClose={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}; 