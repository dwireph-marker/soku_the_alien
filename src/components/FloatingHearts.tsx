import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Heart } from 'lucide-react';

interface ParticleHeart {
  id: number;
  x: number; // 0 to 100%
  size: number; // 10 to 24px
  duration: number; // 8 to 18s
  delay: number;
  opacity: number;
}

export const FloatingHearts: React.FC = () => {
  const [hearts, setHearts] = useState<ParticleHeart[]>([]);

  useEffect(() => {
    const list: ParticleHeart[] = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 95,
      size: Math.floor(Math.random() * 14) + 10,
      duration: Math.floor(Math.random() * 10) + 10,
      delay: Math.random() * 8,
      opacity: Math.random() * 0.4 + 0.15,
    }));
    setHearts(list);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {hearts.map(h => (
        <motion.div
          key={h.id}
          initial={{ y: '105vh', opacity: 0 }}
          animate={{
            y: '-10vh',
            opacity: [0, h.opacity, h.opacity, 0],
            x: [0, 15, -15, 0],
          }}
          transition={{
            y: { duration: h.duration, repeat: Infinity, ease: 'linear', delay: h.delay },
            x: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
            opacity: { duration: h.duration, repeat: Infinity, delay: h.delay },
          }}
          style={{
            left: `${h.x}%`,
            position: 'absolute',
          }}
        >
          <Heart
            style={{ width: `${h.size}px`, height: `${h.size}px` }}
            className="text-pink-400/40 fill-rose-500/30"
          />
        </motion.div>
      ))}
    </div>
  );
};
