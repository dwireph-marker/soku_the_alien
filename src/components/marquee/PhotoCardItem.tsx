import React from 'react';
import { motion } from 'motion/react';
import { Calendar, MapPin, ZoomIn, Play, Video as VideoIcon } from 'lucide-react';
import { MemoryPhoto } from '../../types';
import { isVideoUrl } from '../../utils/media';
import { sanitizeImageUrl, FALLBACK_IMAGE_URL } from '../../utils/imageUtils';

interface PhotoCardItemProps {
  photo: MemoryPhoto;
  index: number;
  likes: number;
  hasMoved: boolean;
  onSelectPhoto: (photo: MemoryPhoto) => void;
  onStartEdit: (photo: MemoryPhoto, e?: React.MouseEvent) => void;
  onDelete: (photoId: string, e?: React.MouseEvent) => void;
  onLike: (id: string, e?: React.MouseEvent) => void;
}

export const PhotoCardItem: React.FC<PhotoCardItemProps> = ({
  photo,
  index,
  likes,
  hasMoved,
  onSelectPhoto,
  onStartEdit,
  onDelete,
  onLike,
}) => {
  const imageUrl = sanitizeImageUrl(photo.url);
  const isVideo = isVideoUrl(imageUrl, photo.mediaType);

  return (
    <motion.div
      key={`${photo.id}-${index}`}
      whileHover={{ scale: 1.03, y: -6 }}
      onClick={() => {
        if (!hasMoved) {
          onSelectPhoto({ ...photo, url: imageUrl });
        }
      }}
      className="w-60 sm:w-68 flex-shrink-0 bg-stone-950/70 text-amber-50 p-3 pb-4 rounded-3xl shadow-2xl shadow-black/80 border border-white/10 hover:border-rose-500/40 cursor-pointer group/card relative backdrop-blur-md transition-all duration-300"
    >
      <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-stone-900 mb-3 border border-white/10 shadow-inner">
        {isVideo ? (
          <div className="relative w-full h-full">
            <video
              src={imageUrl}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 pointer-events-none"
            />
            {/* Video Badge */}
            <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 border border-rose-500/30 text-rose-300 text-[11px] font-medium backdrop-blur-md">
              <VideoIcon className="w-3 h-3 text-rose-400" />
              <span>Video</span>
            </div>

            {/* Central Play Pulse Indicator */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-rose-600/80 text-white flex items-center justify-center shadow-lg shadow-rose-900/50 backdrop-blur-sm group-hover/card:scale-110 group-hover/card:bg-rose-500 transition-all">
                <Play className="w-5 h-5 fill-white text-white ml-0.5" />
              </div>
            </div>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={photo.title || 'Memory Photo'}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE_URL;
            }}
            referrerPolicy="no-referrer"
            draggable={false}
            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 pointer-events-none"
            loading="lazy"
          />
        )}

        {/* Hover View Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity flex items-end justify-center p-3">
          <span className="text-xs font-semibold text-white flex items-center gap-1.5 bg-rose-950/80 px-3.5 py-1.5 rounded-full border border-rose-400/30 backdrop-blur-md shadow-lg">
            {isVideo ? <Play className="w-3.5 h-3.5 text-rose-300 fill-rose-300" /> : <ZoomIn className="w-3.5 h-3.5 text-rose-300" />}
            {isVideo ? 'Play Video' : 'View Memory'}
          </span>
        </div>
      </div>

      <div className="px-1">
        {(photo.date || photo.location) && (
          <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1.5">
            {photo.date && (
              <span className="flex items-center gap-1 text-rose-300/90 font-mono">
                <Calendar className="w-3 h-3 text-rose-400" />
                {photo.date}
              </span>
            )}
            {photo.location && (
              <span className="flex items-center gap-1 truncate max-w-[110px] text-amber-200/80">
                <MapPin className="w-3 h-3 text-orange-400" />
                {photo.location}
              </span>
            )}
          </div>
        )}

        <div className="flex items-start justify-between gap-1">
          <h3 className="font-serif italic font-semibold text-base sm:text-lg text-white leading-snug line-clamp-2">
            {photo.title}
          </h3>
        </div>

        {photo.caption && (
          <p className="text-[12px] text-stone-300 line-clamp-2 mt-1 italic font-serif">
            "{photo.caption}"
          </p>
        )}
      </div>
    </motion.div>
  );
};

