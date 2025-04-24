import React from 'react';

export const TopicSelector = ({ topics, selectedTopic, onSelect }) => {
  return (
    <select
      value={selectedTopic?._id || ''}
      onChange={(e) => {
        const selected = topics.find(t => t._id === e.target.value);
        onSelect(selected);
      }}
      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border rounded-md bg-background"
    >
      <option value="">Select a Topic</option>
      {topics.map((topic) => (
        <option key={topic._id} value={topic._id}>
          {topic.name} - by {topic.speakerInfo.speakerName}
        </option>
      ))}
    </select>
  );
}; 