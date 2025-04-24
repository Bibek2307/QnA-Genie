import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { StarIcon } from "lucide-react";

export const FeedbackForm = ({ topicId, onSubmit, onClose }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    if (!comment.trim()) {
      setError('Please provide feedback');
      return;
    }

    try {
      await onSubmit({ topicId, rating, comment });
      onClose();
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Conference Feedback</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  rating >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
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
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Submit Feedback
          </Button>
        </div>
      </form>
    </Card>
  );
}; 