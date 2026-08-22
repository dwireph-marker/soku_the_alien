import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  Video as VideoIcon,
  Heart
} from 'lucide-react';
import { MemoryPhoto } from '../../types';
import { isVideoUrl } from '../../utils/media';
import { sanitizeImageUrl, FALLBACK_IMAGE_URL } from '../../utils/imageUtils';
import { videoManager } from '../../utils/videoManager';

interface LightboxModalProps {
  selectedPhoto: MemoryPhoto | null;
  allPhotos?: MemoryPhoto[];
  onClose: () => void;
  onSelectPhoto?: (photo: MemoryPhoto) => void;
  onStartEdit?: (photo: MemoryPhoto) => void;
  onDelete?: (photoId: string) => void;
  onLike?: (photoId: string) => void;
  likesCount?: number;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  selectedPhoto,
  allPhotos = [],
  onClose,
  onSelectPhoto,
  onLike,
  likesCount = 0,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLikedLocally, setIsLikedLocally] = useState(false);

  // Find index in allPhotos list
  const currentIndex = selectedPhoto
    ? allPhotos.findIndex((p) => p.id === selectedPhoto.id)
    : -1;
  const hasMultiple = allPhotos.length > 1;

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!hasMultiple || currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + allPhotos.length) % allPhotos.length;
    if (onSelectPhoto) onSelectPhoto(allPhotos[prevIndex]);
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!hasMultiple || currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % allPhotos.length;
    if (onSelectPhoto) onSelectPhoto(allPhotos[nextIndex]);
  };

  // Keyboard navigation & escape listener
  useEffect(() => {
    if (!selectedPhoto) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, currentIndex, allPhotos]);

  // Video state reset when photo changes
  useEffect(() => {
    setIsPlaying(true);
    setCurrentTime(0);
    setIsLikedLocally(false);
    if (videoRef.current) {
      videoManager.registerActive(videoRef.current, () => setIsPlaying(false));
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => setIsPlaying(false));
    }

    return () => {
      videoManager.pauseAll();
    };
  }, [selectedPhoto?.id]);

  if (!selectedPhoto) return null;
  const imageUrl = sanitizeImageUrl(selectedPhoto.url);
  const isVideo = isVideoUrl(imageUrl, selectedPhoto.mediaType);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const target = parseFloat(e.target.value);
    videoRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const toggleFullScreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6"
      >
        {/* Navigation buttons */}
        {hasMultiple && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-50 p-3 sm:p-4 rounded-full bg-black/70 hover:bg-rose-600 border border-white/20 text-white backdrop-blur-md transition-all hover:scale-110 active:scale-95 shadow-2xl"
              aria-label="Previous memory"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-50 p-3 sm:p-4 rounded-full bg-black/70 hover:bg-rose-600 border border-white/20 text-white backdrop-blur-md transition-all hover:scale-110 active:scale-95 shadow-2xl"
              aria-label="Next memory"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#0e070c] border border-rose-500/30 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative text-amber-50 max-h-[92vh] flex flex-col"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between p-4 px-5 border-b border-rose-950/60 bg-black/60 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-400">
                {isVideo ? <VideoIcon className="w-3.5 h-3.5 text-rose-400" /> : <Sparkles className="w-3.5 h-3.5 text-rose-400" />}
              </div>
              <span className="text-xs font-mono text-rose-300">
                {currentIndex !== -1 ? `Memory ${currentIndex + 1} of ${allPhotos.length}` : 'Cherished Memory'}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-full bg-rose-950/60 hover:bg-rose-600 text-rose-200 hover:text-white transition-colors border border-rose-500/20"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Media Player Container */}
          <div className="relative aspect-[4/3] sm:aspect-[16/10] max-h-[52vh] bg-black overflow-hidden flex items-center justify-center group">
            {isVideo ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <video
                  ref={videoRef}
                  src={imageUrl}
                  autoPlay
                  playsInline
                  preload="metadata"
                  loop
                  muted={isMuted}
                  onTimeUpdate={() => {
                    if (videoRef.current) {
                      setCurrentTime(videoRef.current.currentTime);
                      setDuration(videoRef.current.duration || 0);
                    }
                  }}
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      setDuration(videoRef.current.duration || 0);
                    }
                  }}
                  onClick={togglePlay}
                  className="w-full h-full object-contain cursor-pointer"
                />

                {/* Custom Video Controls Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2 opacity-95 group-hover:opacity-100 transition-opacity">
                  {/* Timeline scrubber */}
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />

                  <div className="flex items-center justify-between text-xs text-stone-300">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={togglePlay}
                        className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                      </button>

                      <button
                        onClick={toggleMute}
                        className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                      </button>

                      <span className="font-mono text-[11px] text-stone-300">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleFullScreen}
                        className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
                        title="Fullscreen"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={imageUrl}
                alt={selectedPhoto.title || 'Memory Photo'}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE_URL;
                }}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Details & Captions */}
          <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3 bg-[#0e070c]">
            {(selectedPhoto.date || selectedPhoto.location) && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-400">
                {selectedPhoto.date && (
                  <span className="flex items-center gap-1.5 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/30 text-rose-300 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-rose-400" />
                    {selectedPhoto.date}
                  </span>
                )}
                {selectedPhoto.location && (
                  <span className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 text-amber-200">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    {selectedPhoto.location}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl sm:text-2xl font-serif italic font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-100 via-pink-200 to-amber-100">
                {selectedPhoto.title}
              </h3>

              <button
                onClick={() => {
                  setIsLikedLocally(true);
                  if (onLike) onLike(selectedPhoto.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  isLikedLocally
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-900/40'
                    : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-500/30'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isLikedLocally ? 'fill-white' : 'fill-rose-400'}`} />
                <span>{likesCount + (isLikedLocally ? 1 : 0)}</span>
              </button>
            </div>

            {selectedPhoto.caption && (
              <p className="text-rose-100/90 text-sm leading-relaxed italic bg-rose-950/20 p-3.5 rounded-2xl border border-rose-500/20 font-serif">
                "{selectedPhoto.caption}"
              </p>
            )}

            {/* Indicator dots for all photos */}
            {hasMultiple && (
              <div className="pt-2 flex items-center justify-center gap-1.5 flex-wrap">
                {allPhotos.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (onSelectPhoto) onSelectPhoto(p);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentIndex
                        ? 'bg-rose-400 scale-125 w-4'
                        : 'bg-rose-900/60 hover:bg-rose-700'
                    }`}
                    title={p.title}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

