import React from 'react';
import { Card } from "./ui/card";
import { User } from 'lucide-react';
import { formatDateTime } from '../utils/dateUtils';

export const TopicCard = ({ topic }) => {
  const { name, speakerInfo } = topic;
  const { speakerName, conferenceTime, duration, avatar } = speakerInfo;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start gap-4">
        {/* Speaker Avatar */}
        <div className="flex-shrink-0">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {avatar ? (
              <img 
                src={`http://localhost:5001${avatar}`}
                alt={speakerName}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-primary" />
            )}
          </div>
        </div>

        {/* Topic and Speaker Info */}
        <div className="flex-grow space-y-2">
          <h3 className="text-lg font-semibold">{name}</h3>
          
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Speaker:</span>
              <span className="font-medium">{speakerName}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Date & Time:</span>
              <span className="font-medium">{formatDateTime(conferenceTime)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{duration} minutes</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}; 