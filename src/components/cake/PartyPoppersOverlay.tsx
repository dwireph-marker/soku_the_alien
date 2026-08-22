import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, Star } from 'lucide-react';

const PARTY_WRAPPER_ITEMS = Array.from({ length: 45 }).map((_, i) => {
  const gradients = [
    'from-rose-500 via-pink-400 to-amber-300',
    'from-amber-300 via-yellow-400 to-orange-500',
    'from-purple-500 via-fuchsia-400 to-pink-400',
    'from-cyan-400 via-sky-400 to-blue-600',
    'from-emerald-300 via-teal-400 to-green-500',
    'from-rose-400 via-red-500 to-amber-200',
    'from-amber-200 via-yellow-300 to-orange-400',
    'from-fuchsia-500 via-pink-500 to-rose-500',
  ];
  return {
    id: i,
    leftPercent: (i * 2.2 + (i % 5) * 1.5) % 98,
    delay: (i % 8) * 0.2 + Math.random() * 0.3,
    duration: 2.6 + (i % 5) * 0.4 + Math.random() * 0.5,
    gradient: gradients[i % gradients.length],
    widthPx: 10 + (i % 4) * 4,
    heightPx: 45 + (i % 6) * 10,
    type: i % 4 === 0 ? 'wrapper' : i % 4 === 1 ? 'ribbon' : i % 4 === 2 ? 'glitter' : 'star',
    swayDistance: (i % 2 === 0 ? 1 : -1) * (30 + (i % 5) * 10),
  };
});

interface PartyPoppersOverlayProps {
  show: boolean;
  herName: string;
}

export const PartyPoppersOverlay: React.FC<PartyPoppersOverlayProps> = ({ show, herName }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
        >
          <motion.div
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-gradient-to-r from-amber-200/40 via-orange-400/30 to-rose-400/40 backdrop-blur-[2px]"
          />

          <div className="absolute top-8 inset-x-0 flex justify-center z-20 px-4">
            <motion.div
              initial={{ scale: 0.5, y: -40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="px-6 sm:px-8 py-3.5 bg-gradient-to-r from-orange-600 via-amber-500 to-rose-600 rounded-full border-2 border-amber-300 shadow-[0_0_50px_rgba(251,191,36,0.8)] text-white text-center flex items-center gap-2 sm:gap-3"
            >
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-200 animate-spin" />
              <span className="font-serif italic font-bold text-lg sm:text-2xl tracking-wider drop-shadow-md">
                🎉 HAPPY BIRTHDAY, {herName.toUpperCase()}! 🎉
              </span>
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-200 animate-spin" />
            </motion.div>
          </div>

          <motion.div
            initial={{ scale: 0, x: -50, y: 50 }}
            animate={{ scale: 1.2, x: 0, y: 0 }}
            exit={{ scale: 0 }}
            className="absolute bottom-6 left-6 z-20 flex flex-col items-center"
          >
            <div className="relative">
              <span className="text-6xl sm:text-7xl rotate-45 block filter drop-shadow-[0_0_20px_rgba(249,115,22,0.9)] animate-bounce">
                🎉
              </span>
              <div className="absolute top-0 left-0 w-16 h-16 bg-amber-400/60 rounded-full animate-ping pointer-events-none" />
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0, x: 50, y: 50 }}
            animate={{ scale: 1.2, x: 0, y: 0 }}
            exit={{ scale: 0 }}
            className="absolute bottom-6 right-6 z-20 flex flex-col items-center"
          >
            <div className="relative">
              <span className="text-6xl sm:text-7xl -rotate-45 block filter drop-shadow-[0_0_20px_rgba(249,115,22,0.9)] animate-bounce">
                🎉
              </span>
              <div className="absolute top-0 right-0 w-16 h-16 bg-rose-400/60 rounded-full animate-ping pointer-events-none" />
            </div>
          </motion.div>

          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {PARTY_WRAPPER_ITEMS.map((item) => (
              <motion.div
                key={item.id}
                initial={{
                  y: '-15vh',
                  x: 0,
                  opacity: 1,
                  rotateX: 0,
                  rotateY: 0,
                  rotateZ: 0,
                }}
                animate={{
                  y: ['-15vh', '115vh'],
                  x: [0, item.swayDistance, -item.swayDistance, item.swayDistance / 2, 0],
                  rotateX: [0, 720],
                  rotateY: [0, 1080],
                  rotateZ: [0, 360],
                  opacity: [0, 1, 1, 0.9, 0],
                }}
                transition={{
                  duration: item.duration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: item.delay,
                }}
                style={{
                  left: `${item.leftPercent}%`,
                }}
                className="absolute"
              >
                {item.type === 'wrapper' ? (
                  <div
                    style={{ width: `${item.widthPx}px`, height: `${item.heightPx}px` }}
                    className={`bg-gradient-to-b ${item.gradient} rounded-sm shadow-[0_0_12px_rgba(255,255,255,0.6)] border border-white/40 transform-3d`}
                  />
                ) : item.type === 'ribbon' ? (
                  <div
                    style={{ width: `${item.widthPx}px`, height: `${item.heightPx * 1.3}px` }}
                    className={`bg-gradient-to-b ${item.gradient} rounded-full shadow-lg border-x border-white/50 transform-3d flex flex-col justify-between p-0.5`}
                  >
                    <div className="w-full h-2 bg-white/70 rounded-full" />
                    <div className="w-full h-2 bg-white/70 rounded-full" />
                  </div>
                ) : item.type === 'glitter' ? (
                  <Heart className="w-6 h-6 text-amber-300 fill-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                ) : (
                  <Star className="w-7 h-7 text-yellow-200 fill-yellow-200 drop-shadow-[0_0_12px_rgba(250,204,21,0.9)]" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
