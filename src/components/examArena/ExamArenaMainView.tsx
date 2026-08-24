import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  Brain,
  Compass,
  Zap,
  BookOpen,
  Flame,
  Gift,
  Target,
  RotateCcw,
  Newspaper,
  Award,
  BarChart3,
  Trophy,
  ShieldCheck,
  Play,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Coins,
  X,
  LogOut,
  UserCheck,
} from 'lucide-react';
import {
  ExamQuestion,
  ExamPaper,
  ExamUserProgress,
  ExamConfig,
} from '../../types/examArena';
import {
  getExamQuestions,
  saveExamQuestions,
  getExamPapers,
  saveExamPapers,
  getUserProgress,
  saveUserProgress,
  getExamConfig,
} from '../../services/firestore/examArena.service';

// Subcomponents & Game Modals
import { ReasoningBattleModal } from './ReasoningBattleModal';
import { IndiaQuestMap } from './IndiaQuestMap';
import { GKSpeedRushModal } from './GKSpeedRushModal';
import { EnglishWordArenaModal } from './EnglishWordArenaModal';
import { DailyChallengeModal } from './DailyChallengeModal';
import { SmartPracticeGeneratorModal } from './SmartPracticeGeneratorModal';
import { RevisionLabModal } from './RevisionLabModal';
import { PreviousPapersModal } from './PreviousPapersModal';
import { PerformanceDashboardModal } from './PerformanceDashboardModal';
import { AchievementsModal } from './AchievementsModal';
import { RealExamCBTView } from './RealExamCBTView';

interface ExamArenaMainViewProps {
  initialModal?: string | null;
  userEmail?: string;
  onLogout?: () => void;
  onClose: () => void;
}

export const ExamArenaMainView: React.FC<ExamArenaMainViewProps> = ({
  initialModal,
  userEmail = 'Admin',
  onLogout,
  onClose,
}) => {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [userProgress, setUserProgress] = useState<ExamUserProgress | null>(null);
  const [examConfig, setExamConfig] = useState<ExamConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Map initial route to modal
  const resolveInitialModal = (): any => {
    if (!initialModal) return null;
    const m = initialModal.toLowerCase();
    if (m.includes('reasoning')) return 'reasoning_battle';
    if (m.includes('gk') || m.includes('quest')) return 'india_quest';
    if (m.includes('rush')) return 'gk_speed_rush';
    if (m.includes('english')) return 'english_arena';
    if (m.includes('daily')) return 'daily_challenge';
    if (m.includes('practice') || m.includes('smart')) return 'smart_practice';
    if (m.includes('revision') || m.includes('lab')) return 'revision_lab';
    if (m.includes('paper') || m.includes('pyq')) return 'previous_papers';
    if (m.includes('perf')) return 'performance';
    if (m.includes('achieve') || m.includes('honor')) return 'achievements';
    if (m.includes('mock') || m.includes('cbt')) return 'real_exam_cbt';
    return null;
  };

  // Active Game Mode / View Modal
  const [activeModal, setActiveModal] = useState<
    | null
    | 'reasoning_battle'
    | 'india_quest'
    | 'gk_speed_rush'
    | 'english_arena'
    | 'daily_challenge'
    | 'smart_practice'
    | 'revision_lab'
    | 'previous_papers'
    | 'performance'
    | 'achievements'
    | 'real_exam_cbt'
  >(resolveInitialModal);

  useEffect(() => {
    async function loadData() {
      try {
        const [q, p, prog, conf] = await Promise.all([
          getExamQuestions(),
          getExamPapers(),
          getUserProgress(),
          getExamConfig(),
        ]);
        setQuestions(q);
        setPapers(p);
        setUserProgress(prog);
        setExamConfig(conf);
      } catch (err) {
        console.error('Error loading Exam Arena data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    // Lock body and html scrolling when Exam Arena is open
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeModal) {
          setActiveModal(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeModal, onClose]);

  const handleUpdateProgress = async (updated: ExamUserProgress) => {
    setUserProgress(updated);
    await saveUserProgress(updated);
  };

  const handleSavePapers = async (updatedPapers: ExamPaper[]) => {
    setPapers(updatedPapers);
    await saveExamPapers(updatedPapers);
  };

  const handleSaveQuestions = async (updatedQuestions: ExamQuestion[]) => {
    setQuestions(updatedQuestions);
    await saveExamQuestions(updatedQuestions);
  };

  if (loading || !userProgress) {
    return (
      <div className="fixed inset-0 z-50 bg-[#070913] flex items-center justify-center text-cyan-400 font-mono text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span>LOADING EXAM ARENA ENGINE...</span>
        </div>
      </div>
    );
  }

  // If Real Exam CBT mode is active, render full-screen immersive CBT view
  if (activeModal === 'real_exam_cbt') {
    return (
      <RealExamCBTView
        questions={questions}
        userProgress={userProgress}
        onSaveProgress={handleUpdateProgress}
        onExitExam={() => setActiveModal(null)}
      />
    );
  }

  // Level & XP math
  const currentXP = userProgress.totalXP || 0;
  const currentLevel = userProgress.level || 1;
  const xpForCurrentLevel = Math.pow(currentLevel - 1, 2) * 80;
  const xpForNextLevel = Math.pow(currentLevel, 2) * 80;
  const progressInLevel = currentXP - xpForCurrentLevel;
  const neededForLevel = Math.max(1, xpForNextLevel - xpForCurrentLevel);
  const xpPercent = Math.min(100, Math.max(5, Math.round((progressInLevel / neededForLevel) * 100)));

  return (
    <div className="fixed inset-0 z-[500] bg-[#070913] flex flex-col text-stone-200 overflow-hidden select-none w-full h-[100dvh] min-h-[100dvh]">
      {/* Top Responsive Header */}
      <header className="flex-shrink-0 border-b border-cyan-500/20 bg-[#070913]/95 backdrop-blur-xl px-3 sm:px-6 lg:px-8 py-3 sm:py-4 z-20 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
          {/* Top Row on Mobile: Brand + Close Button */}
          <div className="flex items-center justify-between gap-3 min-w-0 w-full sm:w-auto">
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] flex-shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-base sm:text-xl font-bold font-mono tracking-wider text-white truncate">
                    EXAM ARENA
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[9px] sm:text-[10px] font-mono text-cyan-300 font-bold hidden xs:inline-block flex-shrink-0">
                    SSC STENO GRADE C & D
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-stone-400 truncate hidden sm:block">
                  Prepare smarter. Play. Practice. Improve.
                </p>
              </div>
            </div>

            {/* Close Button on Mobile (aligned right on top row) */}
            <button
              onClick={onClose}
              className="sm:hidden p-2.5 rounded-xl bg-black/60 hover:bg-rose-950/60 border border-stone-800 hover:border-rose-500/40 text-stone-300 hover:text-rose-300 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
              title="Close Exam Arena"
              aria-label="Close Exam Arena"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Secondary Stats Row (Mobile: compact badges / Desktop: right aligned) */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto flex-wrap">
            <div className="flex items-center gap-2">
              {/* Streak */}
              <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl bg-black/60 border border-amber-500/40 font-mono text-[11px] sm:text-xs text-amber-300 min-h-[36px] sm:min-h-[38px]">
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-amber-400 animate-pulse flex-shrink-0" />
                <span className="font-bold">{userProgress.currentStreak}D STREAK</span>
              </div>

              {/* Coins */}
              <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl bg-black/60 border border-yellow-500/40 font-mono text-[11px] sm:text-xs text-yellow-300 min-h-[36px] sm:min-h-[38px]">
                <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 flex-shrink-0" />
                <span className="font-bold">{userProgress.coins}</span>
              </div>

              {/* Admin Auth Status Badge */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 font-mono text-[11px] text-cyan-300 min-h-[38px]">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span className="truncate max-w-[130px]">{userEmail}</span>
              </div>
            </div>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl bg-black/50 hover:bg-stone-800 border border-stone-800 hover:border-stone-700 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer min-h-[36px] sm:min-h-[38px] flex items-center gap-1.5 text-xs font-mono"
                title="Log out of Exam Arena session"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4 text-stone-400" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}

            {/* Close Button on Desktop (sm+) */}
            <button
              onClick={onClose}
              className="hidden sm:flex p-2.5 rounded-2xl bg-black/50 hover:bg-rose-950/50 border border-stone-800 hover:border-rose-500/40 text-stone-400 hover:text-rose-300 transition-colors cursor-pointer min-w-[44px] min-h-[44px] items-center justify-center flex-shrink-0"
              title="Close Exam Arena"
              aria-label="Close Exam Arena"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area: Responsive Scroll Container with Safe Bottom Space */}
      <main className="flex-grow flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 lg:p-8 custom-scrollbar pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-20">
          {/* Level Progression Banner */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#0c1224] via-[#101830] to-[#0d1428] border border-cyan-500/30 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold">
                  LEVEL {currentLevel}
                </span>
                <span className="text-stone-300 font-sans text-xs">
                  Aspirant Mastery Rank
                </span>
              </div>
              <div className="text-stone-400 text-xs">
                <strong className="text-cyan-300">{currentXP}</strong> XP / {xpForNextLevel} XP to L{currentLevel + 1}
              </div>
            </div>

            <div className="h-2.5 sm:h-3 rounded-full bg-black/70 border border-cyan-500/20 overflow-hidden p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
              />
            </div>
          </div>

          {/* 4 Core Gamified Learning Modes Grid */}
          {/* Responsive Layout: 1 col on mobile (<768px), 2 cols on tablet (768-1199px), 4 cols on desktop (>=1200px) */}
          <section className="space-y-3 sm:space-y-4">
            <h2 className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider sm:tracking-widest text-cyan-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 flex-shrink-0" />
              <span>GAMIFIED LEARNING & SPEED MODES</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4 w-full">
              {/* 1. Reasoning Battle */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveModal('reasoning_battle')}
                className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#0e1628] to-[#090d18] border border-cyan-500/40 hover:border-cyan-400 cursor-pointer group shadow-lg transition-all flex flex-col justify-between min-h-[170px] w-full min-w-0"
              >
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform flex-shrink-0">
                    <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                      Reasoning Battle
                    </h3>
                    <p className="text-xs text-stone-400 mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none">
                      Combos, speed rounds, number series, coding-decoding & logical deductions.
                    </p>
                  </div>
                </div>

                <div className="pt-3 sm:pt-4 mt-2 flex items-center justify-between text-xs font-mono text-cyan-400 font-bold min-h-[36px]">
                  <span>START BATTLE</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>

              {/* 2. India Quest / GK */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveModal('india_quest')}
                className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#1c1208] to-[#0f0a05] border border-amber-500/40 hover:border-amber-400 cursor-pointer group shadow-lg transition-all flex flex-col justify-between min-h-[170px] w-full min-w-0"
              >
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform flex-shrink-0">
                    <Compass className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                      India Quest / GK World
                    </h3>
                    <p className="text-xs text-stone-400 mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none">
                      Visual roadmap across History, Geography, Polity, Economy & Science.
                    </p>
                  </div>
                </div>

                <div className="pt-3 sm:pt-4 mt-2 flex items-center justify-between text-xs font-mono text-amber-400 font-bold min-h-[36px]">
                  <span>EXPLORE MAP</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>

              {/* 3. GK Speed Rush */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveModal('gk_speed_rush')}
                className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#181506] to-[#0c0a03] border border-yellow-500/40 hover:border-yellow-400 cursor-pointer group shadow-lg transition-all flex flex-col justify-between min-h-[170px] w-full min-w-0"
              >
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-yellow-950/80 border border-yellow-500/50 flex items-center justify-center text-yellow-400 group-hover:scale-110 transition-transform flex-shrink-0">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-yellow-300 transition-colors">
                      GK Speed Rush
                    </h3>
                    <p className="text-xs text-stone-400 mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none">
                      30s / 60s / 90s rapid-fire rush. Multiply combos and beat your QPM record.
                    </p>
                  </div>
                </div>

                <div className="pt-3 sm:pt-4 mt-2 flex items-center justify-between text-xs font-mono text-yellow-400 font-bold min-h-[36px]">
                  <span>RUSH NOW</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>

              {/* 4. English Word Arena */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveModal('english_arena')}
                className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#1c0a1a] to-[#0e050d] border border-pink-500/40 hover:border-pink-400 cursor-pointer group shadow-lg transition-all flex flex-col justify-between min-h-[170px] w-full min-w-0"
              >
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-pink-950/80 border border-pink-500/50 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform flex-shrink-0">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-pink-300 transition-colors">
                      English Word Arena
                    </h3>
                    <p className="text-xs text-stone-400 mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none">
                      Synonyms, Antonyms, Idioms, One-Word, Spotting Errors & Vocabulary Sprints.
                    </p>
                  </div>
                </div>

                <div className="pt-3 sm:pt-4 mt-2 flex items-center justify-between text-xs font-mono text-pink-400 font-bold min-h-[36px]">
                  <span>ENTER ARENA</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            </div>
          </section>

          {/* Action Banners Grid (Daily Challenge, Smart Practice) */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Daily Challenge Card */}
            <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#1c0f08] via-[#24130a] to-[#120804] border border-orange-500/30 flex flex-col justify-between space-y-4 shadow-xl">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-[10px] font-mono font-bold uppercase">
                    DAILY MISSION
                  </span>
                  <span className="text-xs font-mono text-orange-400 font-bold">+100 XP REWARD</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">Daily Steno Quest</h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  40 fresh syllabus questions generated daily. Reach 70%+ accuracy to claim XP and preserve your streak!
                </p>
              </div>

              <button
                onClick={() => setActiveModal('daily_challenge')}
                className="w-full py-3 px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer shadow-md"
              >
                <Gift className="w-4 h-4" />
                <span>START TODAY'S QUEST</span>
              </button>
            </div>

            {/* Smart Practice Card */}
            <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#140b20] via-[#1d102e] to-[#0c0614] border border-purple-500/30 flex flex-col justify-between space-y-4 shadow-xl">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-bold uppercase">
                    AI ADAPTIVE ENGINE
                  </span>
                  <span className="text-xs font-mono text-purple-400 font-bold">1-CLICK SESSION</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">What Should I Practice?</h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  System scans your mistakes, weak areas & unseen PYQs to construct the optimal next study set.
                </p>
              </div>

              <button
                onClick={() => setActiveModal('smart_practice')}
                className="w-full py-3 px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-400 hover:to-rose-400 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer shadow-md"
              >
                <Target className="w-4 h-4" />
                <span>GENERATE SMART SESSION</span>
              </button>
            </div>
          </section>

          {/* Secondary Modules (Revision Lab & Latest Papers) */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {/* Revision Lab */}
            <div
              onClick={() => setActiveModal('revision_lab')}
              className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-black/40 hover:bg-rose-950/20 border border-rose-500/30 hover:border-rose-500/60 cursor-pointer transition-all flex items-center justify-between gap-3 sm:gap-4 min-h-[64px]"
            >
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400 flex-shrink-0">
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">Revision Lab (Spaced Repetition)</h4>
                  <p className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5 truncate">
                    Review previously mistaken & slow questions.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 flex-shrink-0" />
            </div>

            {/* Latest Exam Papers */}
            <div
              onClick={() => setActiveModal('previous_papers')}
              className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-black/40 hover:bg-cyan-950/20 border border-cyan-500/30 hover:border-cyan-500/60 cursor-pointer transition-all flex items-center justify-between gap-3 sm:gap-4 min-h-[64px]"
            >
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 flex-shrink-0">
                  <Newspaper className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">Latest Papers & Official PYQs</h4>
                  <p className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5 truncate">
                    10-Year Verified Shift Papers (2017–2026).
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0" />
            </div>
          </section>

          {/* HIGH-IMPACT REAL EXAM CBT SIMULATOR CARD */}
          <section className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#0b1426] via-[#101e3b] to-[#091122] border-2 border-blue-500/50 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
            <div className="space-y-2.5 sm:space-y-3 max-w-xl text-center md:text-left w-full">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[10px] sm:text-xs font-mono font-bold uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> OFFICIAL CBT SIMULATOR
                </span>
                <span className="text-[10px] sm:text-xs font-mono text-stone-400">
                  200 Marks // 2.0 Hours
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl md:text-3xl font-serif italic text-white leading-tight">
                Full Mock Test — Real Exam Mode
              </h3>

              <p className="text-xs text-stone-300 leading-relaxed">
                Professional exam interface adhering strictly to the SSC scheme: 50 Reasoning, 50 General Awareness, 100 English with official Question Palette & final scorecard.
              </p>
            </div>

            <button
              onClick={() => setActiveModal('real_exam_cbt')}
              className="w-full md:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono font-bold text-xs sm:text-sm uppercase tracking-wider sm:tracking-widest transition-all shadow-xl shadow-blue-900/50 flex items-center justify-center gap-2.5 min-h-[48px] cursor-pointer flex-shrink-0"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              <span>LAUNCH CBT SIMULATOR</span>
            </button>
          </section>

          {/* Bottom Utility Bar (Achievements & Performance) */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => setActiveModal('achievements')}
              className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-black/40 hover:bg-purple-950/30 border border-purple-500/20 hover:border-purple-500/50 transition-all flex items-center justify-center sm:justify-start gap-2.5 text-center sm:text-left cursor-pointer min-h-[48px]"
            >
              <Award className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold font-mono text-white truncate">Achievements & Honors</div>
                <div className="text-[10px] text-stone-400 hidden sm:block truncate">Dynamic milestones tracker</div>
              </div>
            </button>

            <button
              onClick={() => setActiveModal('performance')}
              className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-black/40 hover:bg-cyan-950/30 border border-cyan-500/20 hover:border-cyan-500/50 transition-all flex items-center justify-center sm:justify-start gap-2.5 text-center sm:text-left cursor-pointer min-h-[48px]"
            >
              <BarChart3 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold font-mono text-white truncate">Performance Analytics</div>
                <div className="text-[10px] text-stone-400 hidden sm:block truncate">Attempt comparison & history</div>
              </div>
            </button>
          </section>
        </div>
      </main>

      {/* Render Active Modals */}
      {activeModal === 'reasoning_battle' && (
        <ReasoningBattleModal
          questions={questions}
          userProgress={userProgress}
          onSaveProgress={handleUpdateProgress}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'india_quest' && (
        <IndiaQuestMap
          questions={questions}
          userProgress={userProgress}
          onSaveProgress={handleUpdateProgress}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'gk_speed_rush' && (
        <GKSpeedRushModal
          questions={questions}
          userProgress={userProgress}
          onSaveProgress={handleUpdateProgress}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'english_arena' && (
        <EnglishWordArenaModal
          questions={questions}
          userProgress={userProgress}
          onSaveProgress={handleUpdateProgress}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'daily_challenge' && (
        <DailyChallengeModal
          questions={questions}
          userProgress={userProgress}
          onSaveProgress={handleUpdateProgress}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'smart_practice' && (
        <SmartPracticeGeneratorModal
          questions={questions}
          userProgress={userProgress}
          onSaveProgress={handleUpdateProgress}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'revision_lab' && (
        <RevisionLabModal
          questions={questions}
          userProgress={userProgress}
          onSaveProgress={handleUpdateProgress}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'previous_papers' && (
        <PreviousPapersModal
          papers={papers}
          questions={questions}
          userProgress={userProgress}
          onSaveProgress={handleUpdateProgress}
          onSavePapers={handleSavePapers}
          onSaveQuestions={handleSaveQuestions}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'performance' && (
        <PerformanceDashboardModal
          userProgress={userProgress}
          onStartWeakPractice={() => setActiveModal('smart_practice')}
          onResetProgress={handleUpdateProgress}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'achievements' && (
        <AchievementsModal
          userProgress={userProgress}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
};
