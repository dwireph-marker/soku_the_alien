import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  GraduationCap,
  Sparkles,
  Flame,
  Brain,
  Zap,
  BookOpen,
  Trophy,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { ExamUserProgress } from '../../types/examArena';
import { getUserProgress } from '../../services/firestore/examArena.service';
import { ExamArenaMainView } from './ExamArenaMainView';

export const ExamArenaSection: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userProgress, setUserProgress] = useState<ExamUserProgress | null>(null);

  useEffect(() => {
    getUserProgress().then((p) => setUserProgress(p));
  }, [isOpen]);

  return (
    <section id="exam-arena-section" className="relative py-12 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="relative rounded-3xl bg-gradient-to-br from-[#0a0d1a] via-[#10172e] to-[#080a14] border border-cyan-500/30 p-8 sm:p-12 shadow-2xl overflow-hidden">
        {/* Background glow lines */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center lg:text-left max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold uppercase tracking-widest">
              <GraduationCap className="w-4 h-4" />
              <span>SSC STENOGRAPHER PREPARATION SYSTEM</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-serif italic text-white leading-tight">
              🎓 EXAM ARENA
            </h2>

            <p className="text-sm sm:text-base text-stone-300 font-sans leading-relaxed">
              Prepare smarter. Play. Practice. Improve.
              <br />
              <span className="text-xs text-stone-400">
                Gamified Reasoning Battles, India GK Quest, 60s Speed Rush, English Arena, Adaptive Revision & Official CBT Mock Simulator.
              </span>
            </p>

            {/* Quick stats badge */}
            {userProgress && (
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2 font-mono text-xs">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/60 border border-amber-500/40 text-amber-300">
                  <Flame className="w-3.5 h-3.5 fill-current" /> {userProgress.currentStreak} Day Streak
                </span>
                <span className="px-3 py-1 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-300">
                  Level {userProgress.level} Aspirant
                </span>
                <span className="px-3 py-1 rounded-xl bg-black/60 border border-emerald-500/40 text-emerald-300">
                  {userProgress.totalQuestionsSolved} Questions Mastered
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center lg:items-end gap-4 w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsOpen(true)}
              className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-mono font-bold text-sm uppercase tracking-widest transition-all shadow-2xl shadow-cyan-500/30 flex items-center justify-center gap-3 cursor-pointer"
            >
              <span>ENTER EXAM ARENA</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <span className="text-[11px] font-mono text-stone-400">
              ⚡ Grade C & Grade D Official Syllabus Grounded
            </span>
          </div>
        </div>
      </div>

      {/* Render Main Modal when activated */}
      {isOpen && <ExamArenaMainView onClose={() => setIsOpen(false)} />}
    </section>
  );
};
