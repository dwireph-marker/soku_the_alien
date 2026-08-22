import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles } from 'lucide-react';

interface CakeTiersModelProps {
  candlesLit: boolean[];
  toggleCandle: (index: number) => void;
  herName: string;
  blowIntensity?: number;
  isMidnightTheme?: boolean;
}

export const CakeTiersModel: React.FC<CakeTiersModelProps> = ({
  candlesLit,
  toggleCandle,
  herName,
  blowIntensity = 0,
  isMidnightTheme = false,
}) => {
  return (
    <div className="relative w-full max-w-lg mx-auto flex flex-col items-center justify-center select-none filter drop-shadow-2xl py-4">
      {/* Radial Ambient Glow Behind Cake */}
      <div
        className={`absolute top-12 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 z-0 ${
          isMidnightTheme ? 'bg-rose-500/20' : 'bg-pink-500/25'
        } ${candlesLit.some((l) => l) ? 'opacity-100' : 'opacity-30'}`}
      />

      {/* CAKE CONTAINER */}
      <div className="relative z-10 w-full flex flex-col items-center">
        {/* TOP HEART DECORATIVE TOPPER */}
        <motion.div
          animate={{ y: [0, -4, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          className="z-30 mb-1 flex items-center justify-center"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-600 via-rose-500 to-rose-400 p-0.5 shadow-[0_0_15px_rgba(244,63,94,0.6)] border border-pink-300/80 flex items-center justify-center">
            <Heart className="w-5 h-5 text-white fill-white drop-shadow-md" />
          </div>
        </motion.div>

        {/* CANDLES ROW (6 CANDLES) */}
        <div className="flex items-end justify-center gap-2 sm:gap-4.5 z-30 -mb-6 sm:-mb-7">
          {candlesLit.map((isLit, idx) => (
            <div
              key={idx}
              onClick={() => toggleCandle(idx)}
              className="flex flex-col items-center cursor-pointer group relative transition-transform hover:scale-110 p-1 min-w-[44px] min-h-[50px] justify-end"
              title={isLit ? 'Click or blow to extinguish candle!' : 'Click to relight candle!'}
              role="button"
              tabIndex={0}
              aria-label={isLit ? `Extinguish candle ${idx + 1}` : `Relight candle ${idx + 1}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleCandle(idx);
                }
              }}
            >
              <AnimatePresence mode="wait">
                {isLit ? (
                  <motion.div
                    key="lit-flame"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="relative flex items-center justify-center -mb-1"
                  >
                    {/* Outer Pulsing Flame Glow Halo */}
                    <motion.div
                      animate={{
                        scale: [1, 1.35, 0.95, 1.25],
                        opacity: [0.6, 0.9, 0.65, 0.95],
                      }}
                      transition={{ duration: 0.7, repeat: Infinity, repeatType: 'reverse' }}
                      className="absolute w-10 h-10 bg-amber-400/50 rounded-full blur-md pointer-events-none"
                    />

                    {/* Multi-layer Flickering Flame */}
                    <motion.div
                      animate={{
                        scaleY:
                          blowIntensity > 0
                            ? [1 - blowIntensity * 0.4, 1 - blowIntensity * 0.6]
                            : [1, 1.22, 0.92, 1.15],
                        scaleX:
                          blowIntensity > 0
                            ? [1 + blowIntensity * 0.3, 1 - blowIntensity * 0.2]
                            : [1, 0.9, 1.1, 0.95],
                        rotate:
                          blowIntensity > 0
                            ? [-16 * blowIntensity - 4, 22 * blowIntensity + 4]
                            : [-4, 4, -3, 5],
                      }}
                      transition={{
                        duration: blowIntensity > 0 ? Math.max(0.1, 0.4 - blowIntensity * 0.3) : 0.5,
                        repeat: Infinity,
                        repeatType: 'reverse',
                      }}
                      className="w-4 h-9 bg-gradient-to-t from-orange-600 via-amber-300 to-white rounded-t-full rounded-b-sm shadow-[0_0_22px_#f97316] relative flex items-center justify-center"
                    >
                      {/* Inner White Core Flame */}
                      <div className="w-1.5 h-5 bg-white rounded-full blur-[0.5px]" />
                      {/* Bottom Blue Flame Base */}
                      <div className="absolute bottom-1 w-1.5 h-2 bg-blue-500/80 rounded-full blur-[0.5px]" />
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="unlit-smoke"
                    initial={{ opacity: 0.9, y: 0, scale: 0.6 }}
                    animate={{ opacity: 0, y: -35, scale: 2 }}
                    transition={{ duration: 1.6, ease: 'easeOut' }}
                    className="flex flex-col items-center -mb-1 pointer-events-none"
                  >
                    <div className="w-2 h-8 bg-gradient-to-t from-stone-300/80 via-stone-400/40 to-transparent rounded-full blur-[1.5px]" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Candle Wick */}
              <div className="w-0.5 h-2.5 bg-stone-900 shadow-sm" />

              {/* Candy-Striped Pink & White Candle Body */}
              <div className="w-3.5 sm:w-4.5 h-14 sm:h-18 rounded-t-md shadow-xl relative overflow-hidden bg-gradient-to-b from-pink-300 via-rose-500 to-pink-700 border-x border-pink-200/60">
                {/* Diagonal Candy Stripes */}
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.85)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.85)_50%,rgba(255,255,255,0.85)_75%,transparent_75%)] bg-[length:12px_12px]" />
                {/* Wax Drip Rim */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-white/95 rounded-b-full shadow-inner" />
              </div>

              {/* Candle Base Piping Ring */}
              <div className="w-5 sm:w-6 h-2 bg-gradient-to-r from-pink-200 via-white to-pink-200 rounded-full border border-pink-300 shadow-md -mt-1 flex items-center justify-center z-10">
                <div className="w-2 h-1 bg-pink-400/80 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        {/* TOP FROSTING ROSETTE PIPING SWIRL RIM */}
        <div className="w-[300px] sm:w-[380px] h-12 bg-gradient-to-r from-pink-200 via-rose-100 to-pink-200 rounded-[100%] border-2 border-pink-300 shadow-lg relative z-20 flex items-center justify-between px-3">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-white via-pink-200 to-rose-300 border border-pink-300/80 shadow-md transform hover:scale-110 transition-transform flex items-center justify-center"
            >
              <div className="w-2 h-2 rounded-full bg-rose-400/60" />
            </div>
          ))}
        </div>

        {/* MAIN SINGLE-TIER PINK CAKE BODY */}
        <div className="w-[300px] sm:w-[380px] h-48 sm:h-56 bg-gradient-to-b from-[#f8bbd0] via-[#f06292] to-[#ad1457] border-x-4 border-rose-300/60 -mt-6 relative overflow-hidden flex flex-col items-center justify-center shadow-2xl z-10 rounded-b-2xl">
          {/* Subtle Buttercream Texture & Light Highlights */}
          <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-white/60 via-pink-100/30 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white/30 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black/25 to-transparent pointer-events-none" />

          {/* SCATTERED 3D RED MINI HEART SPRINKLES ON CAKE WALL */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <Heart className="absolute top-4 left-6 w-3.5 h-3.5 text-rose-700 fill-rose-600 opacity-80 rotate-[-15deg]" />
            <Heart className="absolute top-10 right-8 w-3 h-3 text-rose-800 fill-rose-700 opacity-70 rotate-[20deg]" />
            <Heart className="absolute bottom-8 left-10 w-4 h-4 text-rose-700 fill-rose-600 opacity-85 rotate-[12deg]" />
            <Heart className="absolute bottom-12 right-10 w-3.5 h-3.5 text-rose-800 fill-rose-700 opacity-75 rotate-[-25deg]" />
            <Heart className="absolute top-1/2 left-4 w-2.5 h-2.5 text-rose-700 fill-rose-600 opacity-65" />
            <Heart className="absolute top-1/2 right-5 w-3 h-3 text-rose-700 fill-rose-600 opacity-70 rotate-[10deg]" />
          </div>

          {/* FRONT CENTER GLOWING NEON HEART PLAQUE */}
          <motion.div
            animate={{
              boxShadow: [
                '0 0 15px rgba(255,182,193,0.8), inset 0 0 10px rgba(255,255,255,0.6)',
                '0 0 28px rgba(255,105,180,0.95), inset 0 0 16px rgba(255,255,255,0.8)',
                '0 0 15px rgba(255,182,193,0.8), inset 0 0 10px rgba(255,255,255,0.6)',
              ],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="relative z-10 px-6 sm:px-8 py-4 sm:py-5 rounded-[40px] bg-gradient-to-b from-rose-950/80 via-black/85 to-rose-950/90 border-2 border-pink-300 text-center backdrop-blur-md flex flex-col items-center justify-center max-w-[220px] sm:max-w-[260px] mx-auto shadow-2xl"
          >
            {/* Illuminated Neon Outer Heart Shape Frame */}
            <div className="absolute -inset-1 rounded-[42px] border border-pink-400/60 blur-[2px] pointer-events-none" />

            {/* Glowing Text inside Neon Heart */}
            <p className="font-serif italic font-extrabold text-amber-100 text-sm sm:text-base tracking-wide drop-shadow-[0_2px_8px_rgba(255,192,203,0.9)] leading-snug">
              {herName && (herName.toLowerCase().includes('birthday') || herName.toLowerCase().includes('for ')) ? '✨ Celebrating ✨' : 'Happy Birthday,'}
            </p>
            <p className="font-serif italic font-extrabold text-pink-200 text-base sm:text-lg tracking-wider drop-shadow-[0_2px_10px_rgba(255,105,180,0.9)] mt-0.5 max-w-[190px] truncate">
              {herName || 'My Love'}
            </p>

            <div className="mt-1 flex items-center justify-center gap-1 text-amber-300">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <Heart className="w-3 h-3 text-pink-400 fill-pink-400" />
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            </div>
          </motion.div>
        </div>

        {/* BOTTOM PIPED FROSTING ROSETTE BASE RIM */}
        <div className="w-[310px] sm:w-[390px] h-10 bg-gradient-to-r from-pink-200 via-rose-100 to-pink-200 rounded-[100%] border-2 border-pink-300 shadow-md relative z-20 -mt-5 flex items-center justify-between px-2">
          {[...Array(14)].map((_, i) => (
            <div
              key={i}
              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-white via-pink-200 to-rose-300 border border-pink-300/80 shadow-inner"
            />
          ))}
        </div>

        {/* LUXURIOUS GOLDEN CAKE PLATTER & PEDESTAL STAND */}
        <div className="relative -mt-4 z-0 flex flex-col items-center w-full">
          {/* Round Golden Metallic Cake Platter Rim */}
          <div className="w-[340px] sm:w-[440px] h-8 bg-gradient-to-r from-amber-500 via-amber-200 to-amber-500 rounded-full shadow-2xl border-2 border-amber-300 flex items-center justify-center p-1">
            <div className="w-full h-full bg-gradient-to-r from-amber-100 via-white to-amber-100 rounded-full opacity-90 border border-amber-300/80" />
          </div>

          {/* Pedestal Stem */}
          <div className="w-32 sm:w-44 h-7 bg-gradient-to-b from-amber-400 via-amber-600 to-amber-800 shadow-xl clip-pedestal border-x border-amber-300 -mt-1" />

          {/* Pedestal Base Foot */}
          <div className="w-48 sm:w-60 h-4 bg-gradient-to-r from-amber-500 via-amber-200 to-amber-500 rounded-full shadow-2xl border border-amber-300" />

          {/* Dark Wooden Table Base Surface with Rose Petals & Contact Shadow */}
          <div className="relative w-[360px] sm:w-[460px] h-10 bg-gradient-to-r from-[#2c1810] via-[#3a2016] to-[#2c1810] rounded-full border-t border-amber-700/40 shadow-2xl -mt-2 flex items-center justify-around overflow-hidden px-4">
            {/* Scattered Red Rose Petals */}
            <div className="w-3 h-2 bg-rose-600 rounded-full rotate-[-25deg] shadow-md opacity-85" />
            <div className="w-4 h-2.5 bg-red-700 rounded-full rotate-[15deg] shadow-md opacity-90" />
            <div className="w-3 h-2 bg-rose-700 rounded-full rotate-[-10deg] shadow-md opacity-80" />
            <div className="w-3.5 h-2 bg-red-600 rounded-full rotate-[30deg] shadow-md opacity-85" />
          </div>

          {/* Soft Ambient Contact Shadow */}
          <div className="w-[380px] sm:w-[480px] h-6 bg-black/75 rounded-full blur-xl -mt-4" />
        </div>
      </div>
    </div>
  );
};
