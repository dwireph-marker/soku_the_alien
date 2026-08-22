import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface StarTwinkleBackgroundProps {
  isMidnight?: boolean;
}

export const StarTwinkleBackground: React.FC<StarTwinkleBackgroundProps> = ({ isMidnight = true }) => {
  // Generate a set of twinkling stars with random coordinates, sizes, and delays
  const stars = useMemo(() => {
    return Array.from({ length: 65 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() < 0.15 ? 3 : Math.random() < 0.4 ? 2 : 1.2,
      duration: 1.8 + Math.random() * 2.5,
      delay: Math.random() * 3,
      color:
        i % 4 === 0
          ? '#38bdf8' // Sky blue
          : i % 4 === 1
          ? '#fef08a' // Warm gold
          : i % 4 === 2
          ? '#e879f9' // Soft violet
          : '#ffffff', // Crisp white
    }));
  }, []);

  if (!isMidnight) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Deep Space Atmosphere Layer */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020108] via-[#050414] to-[#0a050d] opacity-95 transition-colors duration-1000" />

      {/* Cosmic Nebula Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px]" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[160px]" />
      <div className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] bg-rose-600/10 rounded-full blur-[130px]" />

      {/* Twinkling Stars Array */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          initial={{ opacity: 0.1, scale: 0.8 }}
          animate={{
            opacity: [0.15, 0.95, 0.2],
            scale: [0.8, 1.4, 0.8],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: star.delay,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.color,
            borderRadius: '50%',
            boxShadow: star.size > 2 ? `0 0 8px ${star.color}` : `0 0 4px ${star.color}`,
          }}
        />
      ))}

      {/* Floating Stardust Shimmers */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)] pointer-events-none" />
    </div>
  );
};
