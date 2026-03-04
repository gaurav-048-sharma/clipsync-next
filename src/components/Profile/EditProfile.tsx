'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface ProfileAuth {
  username: string;
  name: string;
}

interface InitialData {
  authId: ProfileAuth;
  profilePicture: string;
  bio: string;
}

interface EditProfileProps {
  onClose?: () => void;
  onSave?: (data: any) => void;
  initialData?: InitialData;
  token?: string;
}

const EditProfile = ({ onClose, onSave, initialData, token }: EditProfileProps) => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    bio: '',
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const selectedFileRef = useRef<File | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        username: initialData.authId.username || '',
        name: initialData.authId.name || '',
        bio: initialData.bio || '',
      });
    }
  }, [initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    selectedFileRef.current = file || null;
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const data = new FormData();
    data.append('username', formData.username);
    data.append('name', formData.name);
    data.append('bio', formData.bio);
    
    if (selectedFileRef.current) {
      data.append('profilePicture', selectedFileRef.current);
    }

    try {
      const response = await axios.put('/api/users/', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      onSave?.(response.data);
      onClose?.();
    } catch (err: any) {
      console.error('Update error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasValidCurrentPicture = initialData?.profilePicture && 
    initialData.profilePicture !== '/default-avatar.svg' && 
    initialData.profilePicture.startsWith('http');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-lg bg-theme-background">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl sm:text-2xl font-bold text-theme-color">Edit Profile</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Profile Picture Preview */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 p-[2px]">
                <div className="w-full h-full rounded-full overflow-hidden bg-theme-background">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : hasValidCurrentPicture ? (
                    <img src={initialData.profilePicture} alt="Current" className="w-full h-full object-cover" />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center bg-gradient-avatar"
                    >
                      <span className="text-2xl sm:text-3xl font-semibold text-white">
                        {formData.name?.charAt(0)?.toUpperCase() || formData.username?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <Label 
                htmlFor="profilePicture" 
                className="text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity text-blue-500"
              >
                Change profile photo
              </Label>
              <input
                id="profilePicture"
                name="profilePicture"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-theme-color">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                className="w-full theme-input"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-theme-color">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                className="w-full theme-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium text-theme-color">Bio</Label>
              <Input
                id="bio"
                name="bio"
                type="text"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Enter your bio"
                className="w-full theme-input"
              />
            </div>
            
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            <div className="flex gap-3 pt-2">
              <Button 
                type="submit" 
                className="flex-1 py-2 text-sm sm:text-base font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                type="button"
                variant="outline" 
                className="flex-1 py-2 text-sm sm:text-base font-semibold border-text-theme" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProfile;
