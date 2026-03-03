'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { X, Upload, Image as ImageIcon, Video, Loader2, Globe, Users, Star } from 'lucide-react';
import Navbar from '@/components/Dashboard/Navbar';

type Privacy = 'public' | 'followers' | 'close_friends';

const PRIVACY_OPTIONS: { value: Privacy; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'public', label: 'Public', desc: 'Anyone can see', icon: <Globe className="w-4 h-4" /> },
  { value: 'followers', label: 'Followers', desc: 'Only followers', icon: <Users className="w-4 h-4" /> },
  { value: 'close_friends', label: 'Close Friends', desc: 'Close friends only', icon: <Star className="w-4 h-4" /> },
];

const UploadStory = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'photo' | 'video' | null>(null);
  const [caption, setCaption] = useState('');
  const [privacy, setPrivacy] = useState<Privacy>('followers');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setError('Please select an image or video file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    setError('');
    setSelectedFile(file);
    setFileType(file.type.startsWith('image/') ? 'photo' : 'video');

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('media', selectedFile);
      if (caption.trim()) formData.append('caption', caption.trim());
      formData.append('privacy', privacy);

      await axios.post('/api/stories', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      router.push('/dashboard');
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      setError(msg || 'Failed to upload story');
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (uploading) return;
    router.back();
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setFileType(null);
    setCaption('');
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen pt-14 pb-14 md:pt-0 md:pb-0 bg-theme-background">
      <Navbar />

      <div className="md:ml-64 flex flex-col">
        {/* Content Area */}
        <div className="p-4">
          <div className="max-w-lg mx-auto">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 mb-4 flex items-center justify-between">
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                New Story
              </h1>
              <button
                onClick={handleCancel}
                disabled={uploading}
                aria-label="Cancel"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Upload area */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-5">
              {!preview ? (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center">
                        <Upload className="w-10 h-10 text-white" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold mb-1">Upload Photo or Video</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Tap to browse files</p>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-400 dark:text-gray-500">
                        <div className="flex items-center gap-1">
                          <ImageIcon className="w-4 h-4" />
                          <span>Images</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Video className="w-4 h-4" />
                          <span>Videos</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    aria-label="Select photo or video"
                    className="hidden"
                  />

                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Max 50 MB &middot; JPG, PNG, MP4, MOV
                  </p>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-500 p-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Preview */}
                  <div className="relative bg-black rounded-xl overflow-hidden">
                    <div className="aspect-[9/16] max-h-[500px] flex items-center justify-center">
                      {fileType === 'photo' ? (
                        <img
                          src={preview}
                          alt="Preview"
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <video
                          ref={videoRef}
                          src={preview}
                          controls
                          className="max-w-full max-h-full object-contain"
                        />
                      )}
                    </div>
                    <button
                      onClick={clearSelection}
                      disabled={uploading}
                      aria-label="Remove file"
                      className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full transition disabled:opacity-50"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  {/* Caption */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Caption <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      maxLength={500}
                      placeholder="Write something..."
                      disabled={uploading}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-transparent rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:opacity-50 text-sm"
                      rows={2}
                    />
                    <p className="text-xs text-gray-400 text-right mt-0.5">
                      {caption.length}/500
                    </p>
                  </div>

                  {/* Privacy selector */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Who can see this?</label>
                    <div className="grid grid-cols-3 gap-2">
                      {PRIVACY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setPrivacy(opt.value)}
                          disabled={uploading}
                          className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition disabled:opacity-50 ${
                            privacy === opt.value
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          {opt.icon}
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-500 p-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={clearSelection}
                      disabled={uploading}
                      className="flex-1 py-3 border border-gray-300 dark:border-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
                    >
                      Change
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading…
                        </>
                      ) : (
                        'Share Story'
                      )}
                    </button>
                  </div>

                  {/* Info */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      Your story will be visible for 24 hours and will automatically be archived after that.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadStory;
