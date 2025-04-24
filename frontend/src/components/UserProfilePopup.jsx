import React, { useState, useEffect } from 'react';
import { Card } from "./ui/card";
import { User, Camera } from 'lucide-react';
import { Button } from "./ui/button";
import api from '../utils/api';

export const UserProfilePopup = ({ email, role, onClose }) => {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    // Fetch user's avatar when component mounts
    const fetchAvatar = async () => {
      try {
        const response = await api.get('/users/profile');
        if (response.data.avatar) {
          setAvatarUrl(response.data.avatar);
        }
      } catch (error) {
        console.error('Error fetching avatar:', error);
      }
    };
    fetchAvatar();
  }, []);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    // Create preview URL
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
  };

  const handleSaveImage = async () => {
    if (!selectedFile) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('avatar', selectedFile);
      
      const response = await api.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setAvatarUrl(response.data.avatar);
      setSelectedFile(null);
      setPreviewUrl(null);
      // Close the popup after successful save
      onClose();
    } catch (error) {
      console.error('Error uploading avatar:', error.response || error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <Card className="w-80 p-5 bg-card" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-28 w-28 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="h-full w-full object-cover"
                />
              ) : avatarUrl ? (
                <img 
                  src={`http://localhost:5001${avatarUrl}`} 
                  alt="Profile" 
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-14 w-14 text-primary" />
              )}
              {isLoading && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            
            <label 
              htmlFor="avatar-upload" 
              className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/90"
            >
              <Camera className="h-5 w-5 text-white" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
            </label>
          </div>
          
          {selectedFile && (
            <div className="flex gap-2 mt-2">
              <Button 
                size="default"
                onClick={handleSaveImage}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 text-base"
              >
                Save
              </Button>
              <Button 
                size="default"
                onClick={handleCancel}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 text-base"
              >
                Cancel
              </Button>
            </div>
          )}
          
          <div className="w-full space-y-2">
            <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
              <span className="text-base font-medium text-muted-foreground">Email:</span>
              <span className="text-base font-medium text-left">{email || 'No email available'}</span>
            </div>
            
            <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
              <span className="text-base font-medium text-muted-foreground">Role:</span>
              <span className="text-base font-medium capitalize text-left">
                {role === 'speaker' ? 'Conference Speaker' : 'Conference Listener'}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}; 