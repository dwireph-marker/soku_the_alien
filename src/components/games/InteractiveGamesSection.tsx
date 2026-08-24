import React, { useState, useEffect, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  ArrowRight,
  Gamepad2,
  Sparkles,
  X,
} from 'lucide-react';
import { RevealSection } from '../common/RevealSection';
import { ExamUserProgress } from '../../types/examArena';
import { getUserProgress } from '../../services/firestore/examArena.service';

const MemoryMatchGame = lazy(() => import('./MemoryMatchGame').then(m => ({ default: m.MemoryMatchGame })));
const ExamArenaGuard = lazy(() => import('../examArena/ExamArenaGuard').then(m => ({ default: m.ExamArenaGuard })));

interface InteractiveGamesSectionProps {
  herName?: string;
  soundFxEnabled?: boolean;
  isMidnightTheme?: boolean;
  onOpenWorld?: (subView?: 'hub' | 'paint' | 'outfit' | 'travel' | 'journal') => void;
}

export const InteractiveGamesSection: React.FC<InteractiveGamesSectionProps> = ({
  herName = 'My Love',
  soundFxEnabled = true,
  isMidnightTheme = false,
}) => {
  const [selectedGame, setSelectedGame] = useState<'memory_match' | 'exam_arena' | null>(null);
  const [userProgress, setUserProgress] = useState<ExamUserProgress | null>(null);

  useEffect(() => {
    getUserProgress().then((p) => setUserProgress(p));
  }, [selectedGame]);

  return (
    <RevealSection id="games">
      <section
        className={`py-12 sm:py-16 relative overflow-hidden transition-colors duration-700 ${
          isMidnightTheme ? 'bg-[#050212] text-indigo-50' : 'bg-[#0e040f] text-rose-50'
        }`}
      >
        {/* Background ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-rose-600/10 via-purple-600/10 to-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Compact Section Header */}
          <div className="text-center max-w-xl mx-auto mb-8">
            <div className="reveal-stagger-1 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold uppercase tracking-[0.25em] mb-3">
              <Gamepad2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Choose Your Zone</span>
            </div>

            <h2 className="reveal-stagger-2 text-2xl sm:text-4xl font-serif italic text-transparent bg-clip-text bg-gradient-to-b from-white via-pink-100 to-rose-200 tracking-tight">
              Games & Exam Arena
            </h2>

            <p className="reveal-stagger-3 text-xs sm:text-sm text-stone-300 mt-2 max-w-md mx-auto leading-relaxed font-sans">
              Choose what you want to open: Play a romantic memory card game or step into the SSC Steno preparation arena!
            </p>
          </div>

          {/* Two Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto w-full">
            {/* Option 1: Memory Match Game Card */}
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedGame('memory_match')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedGame('memory_match');
                }
              }}
              className="group cursor-pointer rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-[#1c0614]/90 to-[#29091d]/90 border border-rose-500/30 hover:border-rose-400/60 shadow-lg hover:shadow-rose-950/50 transition-all flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[140px] sm:min-h-[170px] w-full select-none"
              aria-label="Open Memory Match Game"
            >
              <div className="absolute top-0 right-0 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-colors pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center justify-center gap-3.5 sm:gap-4 w-full">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-serif italic text-white group-hover:text-rose-200 transition-colors tracking-wide leading-tight">
                  Memory Match
                </h3>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGame('memory_match');
                  }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-xs sm:text-sm font-mono font-bold text-rose-300 group-hover:text-white transition-all shadow-md group-hover:shadow-rose-500/20 min-h-[44px] cursor-pointer"
                >
                  <span>ENTER</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>

            {/* Option 2: Exam Arena Card */}
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedGame('exam_arena')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedGame('exam_arena');
                }
              }}
              className="group cursor-pointer rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-[#0a0f1d]/90 to-[#0e172e]/90 border border-cyan-500/30 hover:border-cyan-400/60 shadow-lg hover:shadow-cyan-950/50 transition-all flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[140px] sm:min-h-[170px] w-full select-none"
              aria-label="Open Exam Arena"
            >
              <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-colors pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center justify-center gap-3.5 sm:gap-4 w-full">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-serif italic text-white group-hover:text-cyan-200 transition-colors tracking-wide leading-tight">
                  Exam Arena
                </h3>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGame('exam_arena');
                  }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs sm:text-sm font-mono font-bold text-cyan-300 group-hover:text-white transition-all shadow-md group-hover:shadow-cyan-500/20 min-h-[44px] cursor-pointer"
                >
                  <span>ENTER</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Portaled Modals with proper Framer Motion AnimatePresence support */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence mode="wait">
            {selectedGame === 'memory_match' && (
              <Suspense
                fallback={
                  <div className="fixed inset-0 z-[500] bg-[#0c040d]/90 backdrop-blur-md flex flex-col items-center justify-center text-rose-300 font-mono text-sm gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
                    <span>Loading Memory Match Game...</span>
                  </div>
                }
              >
                <MemoryMatchGame
                  key="memory_match_game_modal"
                  soundFxEnabled={soundFxEnabled}
                  onClose={() => setSelectedGame(null)}
                />
              </Suspense>
            )}
            {selectedGame === 'exam_arena' && (
              <motion.div
                key="exam_arena_game_modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[500]"
              >
                <Suspense
                  fallback={
                    <div className="fixed inset-0 z-[500] bg-[#060810] flex flex-col items-center justify-center text-cyan-300 font-mono text-sm gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                      <span>Loading SSC Steno Exam CBT Arena...</span>
                    </div>
                  }
                >
                  <ExamArenaGuard onClose={() => setSelectedGame(null)} />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </RevealSection>
  );
};

