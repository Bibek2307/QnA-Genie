import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import api from '../utils/api';

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    fetchNotifications();
    fetchPoints();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.getNotifications();
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchPoints = async () => {
    try {
      const response = await api.getUserPoints();
      setPoints(response.data.points);
    } catch (error) {
      console.error('Error fetching points:', error);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </div>
      <div className="text-sm font-medium">
        Points: {points}
      </div>
    </div>
  );
}; 