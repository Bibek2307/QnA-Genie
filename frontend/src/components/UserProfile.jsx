import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import api from '../utils/api';

export const UserProfile = ({ onClose }) => {
  const [profile, setProfile] = useState({
    name: '',
    bio: '',
    organization: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Current token:', token);
    if (!token) {
      setError('Not authenticated');
      return;
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      console.log('Fetching profile...');
      console.log('Auth token:', localStorage.getItem('token'));
      
      const response = await api.getProfile();
      console.log('Profile response:', response.data);
      
      if (response.data.profile) {
        setProfile({
          name: response.data.profile.name || '',
          bio: response.data.profile.bio || '',
          organization: response.data.profile.organization || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditing) return;

    try {
      setError('');
      console.log('Submitting profile data:', profile);

      // Disable form while submitting
      const saveButton = e.target.querySelector('button[type="submit"]');
      if (saveButton) saveButton.disabled = true;

      const response = await api.updateProfile({
        name: profile.name,
        bio: profile.bio,
        organization: profile.organization
      });
      
      console.log('Profile update response:', response.data);
      
      if (response.data.profile) {
        setProfile(response.data.profile);
        setIsEditing(false);
        setSuccessMessage('Saved details successfully!');
        
        // Re-fetch profile to confirm changes
        await fetchProfile();
        
        setTimeout(() => {
          setSuccessMessage('');
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Error updating profile:', error.response?.data || error);
      setError('Failed to save details. Please try again.');
    } finally {
      // Re-enable form
      const saveButton = e.target.querySelector('button[type="submit"]');
      if (saveButton) saveButton.disabled = false;
    }
  };

  // Add this to handle edit mode
  const handleEditClick = () => {
    setError('');  // Clear any previous errors
    setIsEditing(true);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Profile</h2>
        <Button variant="ghost" onClick={onClose}>×</Button>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-center font-medium">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-center font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <Input
            value={profile.name}
            onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
            disabled={!isEditing}
            placeholder="Your name"
            className="bg-background text-foreground"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Organization</label>
          <Input
            value={profile.organization}
            onChange={(e) => setProfile(prev => ({ ...prev, organization: e.target.value }))}
            disabled={!isEditing}
            placeholder="Your organization"
            className="bg-background text-foreground"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
            disabled={!isEditing}
            className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
            rows={4}
            placeholder="Tell us about yourself"
          />
        </div>

        <div className="flex justify-end gap-2">
          {isEditing ? (
            <>
              <Button 
                type="submit" 
                className="bg-primary text-white hover:bg-primary-dark"
              >
                Save Changes
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => {
                  setIsEditing(false);
                  setError('');
                  // Reset to last saved values
                  fetchProfile();
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button 
              type="button"
              onClick={handleEditClick}
            >
              Edit Profile
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}; 