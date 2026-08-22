import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Heart, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';
import { romanticAudio } from '../utils/audio';
import { StarTwinkleBackground } from './StarTwinkleBackground';
import {
  calculateNextBirthdayOccurrence,
  calculateRemainingTime,
  RemainingTime,
  NextBirthdayOccurrence,
} from '../utils/birthdayCountdown';

interface HeroCountdownProps {
  herName: string;
  heroName?: string;
  targetDateIso?: string;
  birthdayDate?: string;
  birthdayTime?: string;
  timezone?: string;
  countdownEnabled?: boolean;
  birthdayMonth?: number;
  birthdayDay?: number;
  birthdayYear?: number;
  onMidnightStrike?: () => void;
  soundFxEnabled?: boolean;
  isMidnightTheme?: boolean;
}

export const HeroCountdown: React.FC<HeroCountdownProps> = ({
  herName,
  heroName,
  targetDateIso,
  birthdayDate,
  birthdayTime,
  timezone = 'Asia/Kolkata',
  countdownEnabled = true,
  birthdayMonth,
  birthdayDay,
  birthdayYear,
  onMidnightStrike,
  soundFxEnabled = true,
  isMidnightTheme = true,
}) => {
  const displayHeroName = (heroName || '').trim() || herName;
  // Authoritative dynamic next occurrence calculation
  const nextOccurrence: NextBirthdayOccurrence = useMemo(() => {
    return calculateNextBirthdayOccurrence({
      birthdayDate,
      birthdayTime,
      timezone,
      birthdayMonth,
      birthdayDay,
      birthdayYear,
      targetDate: targetDateIso,
    });
  }, [birthdayDate, birthdayTime, timezone, birthdayMonth, birthdayDay, birthdayYear, targetDateIso]);

  const [timeLeft, setTimeLeft] = useState<RemainingTime>(() =>
    calculateRemainingTime(nextOccurrence.targetTimestampMs)
  );

  const celebrationTriggeredRef = useRef(false);

  useEffect(() => {
    // Reset celebration trigger when target changes
    celebrationTriggeredRef.current = false;

    const timer = setInterval(() => {
      const remaining = calculateRemainingTime(nextOccurrence.targetTimestampMs);
      setTimeLeft(remaining);

      if (remaining.isFinished && !celebrationTriggeredRef.current) {
        celebrationTriggeredRef.current = true;
        triggerMidnightCelebration();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextOccurrence.targetTimestampMs]);

  const triggerMidnightCelebration = () => {
    if (soundFxEnabled) {
      romanticAudio.playFanfare();
    }
    // Fire festive confetti
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#f43f5e', '#ec4899', '#fbbf24', '#a855f7', '#ffffff'],
    });

    if (onMidnightStrike) {
      onMidnightStrike();
    }
  };

  const timeBlocks = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-24 pb-16 px-4 overflow-hidden text-center bg-transparent">
      {/* Star Twinkle Background for Midnight Theme */}
      <StarTwinkleBackground isMidnight={isMidnightTheme} />

      {/* Ambient Radial Color Glows */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-red-600/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-40 h-56 bg-indigo-500/15 rounded-full blur-[70px] transform rotate-12 pointer-events-none" />

      {/* Hero Eyebrow Badge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold uppercase tracking-[0.4em] mb-6 shadow-xl"
      >
        <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-spin" />
        <span>Waiting For The Special Day</span>
        <Heart className="w-3.5 h-3.5 text-orange-500 fill-orange-500 animate-bounce" />
      </motion.div>

      {/* Romantic Headline */}
      <motion.h1
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.2 }}
        className="relative z-10 text-5xl sm:text-7xl md:text-8xl font-serif italic text-transparent bg-clip-text bg-gradient-to-b from-white via-orange-100 to-amber-200 max-w-5xl leading-[1.1] mb-6 tracking-tight drop-shadow-lg"
      >
        Happy Birthday, {displayHeroName}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
        className="relative z-10 text-stone-300/90 text-base sm:text-xl max-w-2xl font-serif italic mb-12"
      >
        "To the one who makes every second feel like a lifetime of joy. Count down with me to the best day of the year."
      </motion.p>

      {/* Countdown Timer Display (if countdownEnabled is true) */}
      {countdownEnabled ? (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative z-10 flex items-center justify-center gap-2 sm:gap-6 md:gap-8 max-w-3xl w-full mx-auto mb-12 px-2"
        >
          {timeBlocks.map((block, idx) => (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center">
                <span
                  className={`text-3xl sm:text-6xl md:text-7xl font-light tracking-tighter tabular-nums ${
                    block.label === 'Seconds' ? 'text-orange-500 font-normal' : 'text-white'
                  }`}
                >
                  {String(block.value).padStart(2, '0')}
                </span>
                <span className="text-[9px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/50 mt-1 sm:mt-2 font-medium">
                  {block.label}
                </span>
              </div>
              {idx < timeBlocks.length - 1 && (
                <span className="text-2xl sm:text-5xl font-thin text-white/20 pb-5 sm:pb-6">:</span>
              )}
            </React.Fragment>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 mb-12 px-6 py-4 rounded-full bg-orange-500/10 border border-orange-500/30 text-amber-200 text-sm font-medium tracking-wide flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-orange-400" />
          <span>Celebrating the love and joy of your wonderful birthday!</span>
          <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
        </motion.div>
      )}

      {/* Navigation Controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="relative z-10 flex flex-wrap items-center justify-center gap-4"
      >
        <a
          href="#cake-section"
          className="px-6 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full text-xs uppercase tracking-[0.2em] text-stone-300 transition-all duration-300 flex items-center gap-2 backdrop-blur-sm shadow-lg"
        >
          <Gift className="w-4 h-4 text-orange-300" />
          <span>Birthday Cake</span>
        </a>
      </motion.div>

      {/* Midnight Surprise Banner */}
      {timeLeft.isFinished && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative z-10 mt-10 p-6 sm:p-8 bg-gradient-to-r from-orange-950/90 via-red-950/90 to-stone-900/90 text-amber-100 rounded-3xl border border-orange-500/50 shadow-2xl max-w-xl w-full"
        >
          <div className="flex items-center justify-center gap-2 text-orange-400 font-serif italic font-bold text-xl sm:text-2xl mb-2">
            <Sparkles className="w-6 h-6 animate-spin" />
            <span>IT'S MIDNIGHT! HAPPY BIRTHDAY!</span>
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-xs sm:text-sm text-stone-300">
            The clock has struck midnight! Your special celebration is unlocked! Scroll down to blow your candles, read your custom love letter, and open your birthday gift vouchers! ✨
          </p>
        </motion.div>
      )}
    </section>
  );
};
