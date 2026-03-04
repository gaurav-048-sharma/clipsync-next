'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FaCloudUploadAlt, FaTimes } from 'react-icons/fa';

interface PreviewFile {
  file: File;
  preview: string;
}

const UploadReel = () => {
  const router = useRouter();
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const handleFiles = (fileList: FileList) => {
    const validFiles: PreviewFile[] = [];
    Array.from(fileList).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File ${file.name} exceeds 100MB limit`);
        return;
      }
      if (!file.type.startsWith('video/')) {
        setError(`File ${file.name} is not a valid video`);
        return;
      }
      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
      });
    });
    setFiles((prev) => [...prev, ...validFiles]);
    setError('');
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one video');
      return;
    }

    const token = getToken();
    if (!token) {
      setError('Please log in to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('media', f.file));
      formData.append('caption', caption);

      await axios.post('/api/reels', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percent);
          }
        },
      });

      // Cleanup previews
      files.forEach((f) => URL.revokeObjectURL(f.preview));
      router.push('/reels-feed');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center dark:text-white">
          Upload Reel
        </h1>

        {/* Drag and Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <FaCloudUploadAlt className="mx-auto text-4xl text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-300">
            Drag & drop videos here or click to browse
          </p>
          <p className="text-sm text-gray-400 mt-1">Max 100MB per file</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
        </div>

        {/* File Previews */}
        {files.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {files.map((f, index) => (
              <div key={index} className="relative rounded-lg overflow-hidden">
                <video
                  src={f.preview}
                  className="w-full h-32 object-cover"
                  muted
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <FaTimes size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Caption */}
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption..."
          className="w-full mt-4 p-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-center mt-1 text-gray-600 dark:text-gray-300">
              {uploadProgress}%
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => router.back()}
            className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadReel;
