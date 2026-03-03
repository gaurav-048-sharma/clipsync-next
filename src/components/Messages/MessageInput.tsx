'use client';

import { useState, useRef, useEffect, FormEvent, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';

interface MessageInputProps {
  onSend: (content: string, messageType?: string, mediaUrl?: string | null) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
}

const EMOJIS = [
  '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊',
  '😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋',
  '😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐',
  '🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌',
  '😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵',
  '🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐',
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔',
  '👍','👎','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙',
  '👏','🙌','👐','🤲','🤝','🙏','💪','🎉','🎊','🔥',
  '💯','⭐','✨','💫','🌈','☀️','🌙','⚡','❄️','🌸',
];

const MessageInput = ({ onSend, onTyping, onStopTyping }: MessageInputProps) => {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
    if (onTyping) onTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (onStopTyping) onStopTyping();
    }, 1000);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSend(content.trim());
    setContent('');
    if (onStopTyping) onStopTyping();
  };

  const handleEmojiClick = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleMediaUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImageFile = file.type.startsWith('image/');
    const isVideoFile = file.type.startsWith('video/');

    if (!isImageFile && !isVideoFile) {
      toast.error('Please select an image or video file');
      return;
    }

    const maxSize = isVideoFile ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(
        `File size should be less than ${isVideoFile ? '50MB' : '10MB'}`
      );
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('media', file);
      formData.append('type', isVideoFile ? 'video' : 'image');

      const token = getToken();
      const response = await axios.post('/api/messages/upload-image', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const mediaType = isVideoFile ? 'video' : 'image';
      const label = isVideoFile ? '🎥 Video' : '📷 Image';
      onSend(label, mediaType, response.data.imageUrl);
    } catch (err) {
      console.error('Media upload error:', err);
      toast.error('Failed to upload media. Please try again.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleHeartClick = () => {
    onSend('❤️', 'heart');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 sm:gap-3 w-full max-w-full relative"
    >
      {showEmojiPicker && (
        <div
          className="absolute bottom-full left-0 mb-2 p-3 rounded-2xl shadow-2xl border z-50 max-h-[300px] overflow-y-auto w-[320px] sm:w-[400px] bg-theme-background border-theme-color"
        >
          <div className="grid grid-cols-8 sm:grid-cols-10 gap-1">
            {EMOJIS.map((emoji, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className="text-xl sm:text-2xl hover:scale-110 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all p-1 rounded"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        className="p-1.5 sm:p-2 hover:opacity-70 active:scale-95 transition-all flex-shrink-0"
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
      >
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-theme-color"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      <Input
        type="text"
        value={content}
        onChange={handleInputChange}
        placeholder="Message..."
        className="flex-1 min-w-0 text-sm rounded-full px-3 sm:px-4 py-2 sm:py-2.5 border focus-visible:ring-0 focus-visible:border-gray-400 border-theme-color text-theme-color bg-theme-background"
        onFocus={() => setShowEmojiPicker(false)}
      />

      {content.trim() ? (
        <button
          type="submit"
          className="text-sm font-semibold hover:opacity-70 active:scale-95 transition-all flex-shrink-0 px-2 sm:px-3 text-[#0095f6]"
        >
          Send
        </button>
      ) : (
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaUpload}
            className="hidden"
          />

          <button
            type="button"
            className="p-1.5 sm:p-2 hover:opacity-70 active:scale-95 transition-all disabled:opacity-50"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-theme-color"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-theme-color"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>

          <button
            type="button"
            className="p-1.5 sm:p-2 hover:opacity-70 active:scale-95 transition-all"
            onClick={handleHeartClick}
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-theme-color"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>
      )}
    </form>
  );
};

export default MessageInput;
