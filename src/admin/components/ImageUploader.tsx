import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Loader2, Check, AlertCircle, Link as LinkIcon, Images, Video as VideoIcon, Play } from 'lucide-react';
import { uploadToImageKit } from '../../lib/imagekit';
import { fileToDataUrl, sanitizeImageUrl, FALLBACK_IMAGE_URL } from '../../utils/imageUtils';
import { isVideoUrl } from '../../utils/media';

interface ImageUploaderProps {
  onUploaded: (url: string, fileId?: string, mediaType?: 'image' | 'video') => void;
  onMultipleUploaded?: (items: { url: string; title: string; mediaType?: 'image' | 'video' }[]) => void;
  folder?: string;
  defaultUrl?: string;
  multiple?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUploaded,
  onMultipleUploaded,
  folder = '/memories',
  defaultUrl = '',
  multiple = true,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(defaultUrl);
  const [error, setError] = useState<string | null>(null);
  const [directUrlMode, setDirectUrlMode] = useState(false);
  const [directUrl, setDirectUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File): Promise<{ url: string; fileId: string; mediaType: 'image' | 'video' }> => {
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|3gp|mkv)$/i.test(file.name);
    
    // First try backend upload endpoint
    try {
      const formData = new FormData();
      const headers: Record<string, string> = {};
      
      // Attach admin bearer token if user is logged in
      const { auth } = await import('../../lib/firebase/client');
      if (auth?.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          if (token) headers['Authorization'] = `Bearer ${token}`;
        } catch {}
      }

      if (isVideo) {
        formData.append('video', file);
        const res = await fetch('/api/upload/video', {
          method: 'POST',
          headers,
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.url) {
            return { url: data.url, fileId: data.fileId, mediaType: 'video' };
          }
        }
      } else {
        formData.append('image', file);
        const res = await fetch('/api/upload/image', {
          method: 'POST',
          headers,
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.url) {
            return { url: data.url, fileId: data.fileId, mediaType: 'image' };
          }
        }
      }
    } catch {
      // Backend upload had issue, fallback to next method
    }

    // Try ImageKit
    try {
      const result = await uploadToImageKit(file, folder);
      return { url: result.url, fileId: result.fileId, mediaType: isVideo ? 'video' : 'image' };
    } catch {
      // Fallback to local Data URL
      const dataUrl = await fileToDataUrl(file);
      return {
        url: dataUrl,
        fileId: `local_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        mediaType: isVideo ? 'video' : 'image',
      };
    }
  };

  const handleFilesSelect = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
    );

    if (validFiles.length === 0) {
      setError('Please select valid image or video files (JPG, PNG, WEBP, MP4, WEBM).');
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(20);

    try {
      if (validFiles.length === 1 || !onMultipleUploaded) {
        const file = validFiles[0];
        const res = await processFile(file);
        setProgress(100);
        setPreview(res.url);
        onUploaded(res.url, res.fileId, res.mediaType);
      } else {
        const results: { url: string; title: string; mediaType: 'image' | 'video' }[] = [];
        for (let i = 0; i < validFiles.length; i++) {
          const file = validFiles[i];
          const res = await processFile(file);
          const fileNameNoExt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          const title = fileNameNoExt.charAt(0).toUpperCase() + fileNameNoExt.slice(1);
          results.push({ url: res.url, title: title || `Memory ${i + 1}`, mediaType: res.mediaType });
          setProgress(Math.round(((i + 1) / validFiles.length) * 100));
        }
        setPreview(results[0].url);
        onUploaded(results[0].url, `batch_${Date.now()}`, results[0].mediaType);
        onMultipleUploaded(results);
      }
    } catch (err: any) {
      setError(err.message || 'File processing failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelect(e.dataTransfer.files);
    }
  };

  const handleApplyDirectUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directUrl.trim()) return;
    const cleanUrl = sanitizeImageUrl(directUrl.trim());
    const isVideo = isVideoUrl(cleanUrl);
    setPreview(cleanUrl);
    onUploaded(cleanUrl, 'external_' + Date.now(), isVideo ? 'video' : 'image');
  };

  const isPreviewVideo = isVideoUrl(preview);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-stone-400 font-medium">
        <span>Media Uploader {multiple ? '(Photos & Videos)' : ''}</span>
        <button
          type="button"
          onClick={() => setDirectUrlMode(!directUrlMode)}
          className="text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
        >
          <LinkIcon className="w-3 h-3" />
          {directUrlMode ? 'File Upload Mode' : 'Paste Media URL'}
        </button>
      </div>

      {preview && (
        <div className="relative rounded-xl overflow-hidden border border-stone-800 bg-stone-950/80 aspect-video max-h-48 flex items-center justify-center">
          {isPreviewVideo ? (
            <video
              src={preview}
              controls
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={preview}
              alt="Preview"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE_URL;
              }}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute top-2 right-2 px-2 py-1 bg-stone-950/80 rounded-lg border border-emerald-500/30 text-[10px] text-emerald-400 font-medium flex items-center gap-1 backdrop-blur-sm">
            <Check className="w-3 h-3" /> {isPreviewVideo ? 'Video Ready' : 'Photo Ready'}
          </div>
        </div>
      )}

      {directUrlMode ? (
        <form onSubmit={handleApplyDirectUrl} className="flex gap-2">
          <input
            type="url"
            value={directUrl}
            onChange={(e) => setDirectUrl(e.target.value)}
            placeholder="https://.../memory.mp4 or https://images.unsplash.com/..."
            className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-medium text-xs rounded-xl"
          >
            Apply
          </button>
        </form>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            dragActive ? 'border-amber-500 bg-amber-500/10' : 'border-stone-800 hover:border-stone-700 bg-stone-900/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime,video/*"
            multiple={multiple}
            className="hidden"
            onChange={(e) => e.target.files && handleFilesSelect(e.target.files)}
          />
          {uploading ? (
            <div className="flex flex-col items-center justify-center py-2">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
              <p className="text-xs text-stone-300 font-medium">Processing & uploading media...</p>
              <div className="w-32 bg-stone-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="p-3 bg-stone-800/80 rounded-2xl text-amber-400 mb-2 flex items-center gap-2">
                <Images className="w-5 h-5" />
                <VideoIcon className="w-5 h-5 text-rose-400" />
              </div>
              <p className="text-xs font-medium text-stone-200">
                Click to browse or drag & drop Photos & Videos
              </p>
              <p className="text-[10px] text-stone-500 mt-1">
                Select photos (JPG, PNG, WEBP) or videos (MP4, WEBM, MOV)
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

