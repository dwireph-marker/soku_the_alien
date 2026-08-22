import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Newspaper,
  Calendar,
  CheckCircle2,
  Clock,
  Play,
  X,
  FileCheck,
  ShieldCheck,
  Search,
  Filter,
  Flame,
  Sparkles,
  Zap,
  RotateCcw,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  BookmarkCheck,
  Shuffle,
  BarChart2,
  FileText,
  AlertCircle,
  HelpCircle,
  SlidersHorizontal,
  Settings,
} from 'lucide-react';
import {
  ExamPaper,
  ExamQuestion,
  ExamUserProgress,
  PaperType,
  ExamGrade,
  ExamSubject,
  PaperAttemptRecord,
} from '../../types/examArena';
import { QuestionSessionEngine, PreparedQuestion } from '../../services/examEngine';
import { examAudio } from '../../utils/examAudio';
import { AdminPaperManagerModal } from './AdminPaperManagerModal';

interface PreviousPapersModalProps {
  papers: ExamPaper[];
  questions: ExamQuestion[];
  userProgress: ExamUserProgress;
  onSaveProgress: (updated: ExamUserProgress) => void;
  onSavePapers?: (papers: ExamPaper[]) => void;
  onSaveQuestions?: (questions: ExamQuestion[]) => void;
  onClose: () => void;
}

type SortView = 'all' | 'recent' | 'popular';

export const PreviousPapersModal: React.FC<PreviousPapersModalProps> = ({
  papers,
  questions,
  userProgress,
  onSaveProgress,
  onSavePapers,
  onSaveQuestions,
  onClose,
}) => {
  // State for Navigation & Filters
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortView, setSortView] = useState<SortView>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterGrade, setFilterGrade] = useState<'all' | 'GRADE_C' | 'GRADE_D' | 'GRADE_C_AND_D'>('all');
  const [filterType, setFilterType] = useState<'all' | PaperType>('all');
  const [filterShift, setFilterShift] = useState<'all' | 'Shift 1' | 'Shift 2' | 'Shift 3'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'Easy' | 'Moderate' | 'Hard'>('all');

  // Modals & Drawers
  const [showVaultDrawer, setShowVaultDrawer] = useState(false);
  const [showAdminManager, setShowAdminManager] = useState(false);
  const [selectedPaperForLaunch, setSelectedPaperForLaunch] = useState<ExamPaper | null>(null);

  // Active Interactive Paper Session State
  const [activePaper, setActivePaper] = useState<ExamPaper | null>(null);
  const [activeSessionMode, setActiveSessionMode] = useState<'ORIGINAL' | 'RANDOMIZED'>('ORIGINAL');
  const [sessionQuestions, setSessionQuestions] = useState<PreparedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [activeSectionFilter, setActiveSectionFilter] = useState<'all' | ExamSubject>('all');
  const [showPaletteDrawer, setShowPaletteDrawer] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  // Timer State (in seconds)
  const [secondsRemaining, setSecondsRemaining] = useState(120 * 60);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  // Dynamic Year List derived from database
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(papers.map((p) => p.year))).sort((a, b) => b - a);
    return years;
  }, [papers]);

  // Overall Statistics calculated dynamically
  const stats = useMemo(() => {
    const verifiedPapers = papers.filter((p) => p.status === 'VERIFIED' || p.verified);
    const minYear = availableYears.length > 0 ? availableYears[availableYears.length - 1] : 2017;
    const maxYear = availableYears.length > 0 ? availableYears[0] : 2025;
    const totalQCount = verifiedPapers.reduce((acc, p) => acc + (p.totalQuestions || 200), 0);
    return {
      verifiedCount: verifiedPapers.length,
      totalQuestions: totalQCount,
      yearRange: `${minYear}–${maxYear}`,
    };
  }, [papers, availableYears]);

  // Vault yearly breakdown
  const vaultYearStats = useMemo(() => {
    return availableYears.map((yr) => {
      const yearPapers = papers.filter((p) => p.year === yr);
      const verified = yearPapers.filter((p) => p.status === 'VERIFIED' || p.verified);
      const totalQ = yearPapers.reduce((acc, p) => acc + (p.totalQuestions || 200), 0);
      return {
        year: yr,
        paperCount: yearPapers.length,
        verifiedCount: verified.length,
        totalQuestions: totalQ,
        shifts: Array.from(new Set(yearPapers.map((p) => p.shift).filter(Boolean))),
      };
    });
  }, [papers, availableYears]);

  // Filtered & Sorted Papers
  const displayedPapers = useMemo(() => {
    let list = [...papers];

    // Year Filter
    if (selectedYear !== 'all') {
      list = list.filter((p) => p.year === selectedYear);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.year.toString().includes(q) ||
          p.shift?.toLowerCase().includes(q) ||
          p.source.toLowerCase().includes(q) ||
          p.difficulty?.toLowerCase().includes(q)
      );
    }

    // Advanced Filters
    if (filterGrade !== 'all') {
      list = list.filter((p) => p.grade === filterGrade);
    }
    if (filterType !== 'all') {
      list = list.filter((p) => p.paperType === filterType);
    }
    if (filterShift !== 'all') {
      list = list.filter((p) => p.shift === filterShift);
    }
    if (filterDifficulty !== 'all') {
      list = list.filter((p) => p.difficulty === filterDifficulty);
    }

    // Sorting views
    if (sortView === 'recent') {
      list.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
    } else if (sortView === 'popular') {
      list.sort((a, b) => (b.attemptCount || 0) - (a.attemptCount || 0));
    } else {
      // Default: Newest year first
      list.sort((a, b) => b.year - a.year);
    }

    return list;
  }, [papers, selectedYear, searchQuery, sortView, filterGrade, filterType, filterShift, filterDifficulty]);

  // Timer loop for active paper session
  useEffect(() => {
    if (!activePaper || isFinished || isTimerPaused) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitPaper();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activePaper, isFinished, isTimerPaused]);

  // Start Paper Flow
  const handleLaunchPaper = (paper: ExamPaper, mode: 'ORIGINAL' | 'RANDOMIZED') => {
    examAudio.playClick();
    setSelectedPaperForLaunch(null);
    setActivePaper(paper);
    setActiveSessionMode(mode);

    // Retrieve questions belonging to this paper
    const allPaperQuestionIds = paper.sections.flatMap((s) => s.questionIds);
    let paperQList = questions.filter((q) => allPaperQuestionIds.includes(q.id));

    // Fallback: If bank has fewer linked IDs, populate from matching year/shift questions
    if (paperQList.length === 0) {
      paperQList = questions.filter((q) => q.year === paper.year);
    }
    if (paperQList.length === 0) {
      paperQList = questions;
    }

    let prepared: PreparedQuestion[];
    if (mode === 'ORIGINAL') {
      // Strict original order: sort by predefined order
      prepared = paperQList.map((q) => ({
        ...q,
        originalQuestionId: q.id,
        shuffledOptions: [...q.options],
        shuffledCorrectIndex: q.correctAnswer,
      }));
    } else {
      // Practice Randomized: shuffle questions & options
      prepared = QuestionSessionEngine.createSession(paperQList, { count: paperQList.length });
    }

    setSessionQuestions(prepared);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setMarkedForReview({});
    setActiveSectionFilter('all');
    setSecondsRemaining((paper.durationMinutes || 120) * 60);
    setIsFinished(false);
    setReviewMode(false);
    setShowPaletteDrawer(false);
  };

  // Launch PYQ Mix of Last 10 Years
  const handleLaunchPYQMix = (count: number | 'all') => {
    examAudio.playClick();
    const verifiedQuestions = questions.filter((q) => q.sourceType === 'OFFICIAL_PYQ' || q.verified);
    const pool = verifiedQuestions.length >= 10 ? verifiedQuestions : questions;

    const actualCount = count === 'all' ? Math.min(pool.length, 100) : Math.min(count, pool.length);
    const session = QuestionSessionEngine.createSession(pool, { count: actualCount });

    const virtualPaper: ExamPaper = {
      id: `pyq_mix_${Date.now()}`,
      title: `🔥 PYQ Master Mix — Last 10 Years (${actualCount} Questions)`,
      exam: 'SSC_STENOGRAPHER',
      year: 2025,
      shift: 'All 10 Years Multi-Shift Mix',
      totalQuestions: actualCount,
      durationMinutes: Math.max(30, Math.round(actualCount * 0.6)),
      difficulty: 'Moderate',
      paperType: 'VERIFIED_PYQ',
      status: 'VERIFIED',
      verified: true,
      source: 'Verified 10-Year SSC Stenographer Question Archive (2017–2025)',
      sections: [
        { subject: 'reasoning', questionIds: [] },
        { subject: 'general_awareness', questionIds: [] },
        { subject: 'english_language', questionIds: [] },
      ],
    };

    setActivePaper(virtualPaper);
    setActiveSessionMode('RANDOMIZED');
    setSessionQuestions(session);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setMarkedForReview({});
    setActiveSectionFilter('all');
    setSecondsRemaining(virtualPaper.durationMinutes * 60);
    setIsFinished(false);
    setReviewMode(false);
  };

  // Current Question in active session
  const currentQ = sessionQuestions[currentIndex];

  const handleSelectOption = (optionIndex: number) => {
    if (isFinished && !reviewMode) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
    examAudio.playClick();
  };

  const handleToggleMarkForReview = () => {
    setMarkedForReview((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }));
    examAudio.playClick();
  };

  const handleClearResponse = () => {
    setSelectedAnswers((prev) => {
      const next = { ...prev };
      delete next[currentIndex];
      return next;
    });
    examAudio.playClick();
  };

  const handleNext = () => {
    if (currentIndex + 1 < sessionQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
      examAudio.playClick();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      examAudio.playClick();
    }
  };

  // Submission & Telemetry Calculation
  const handleSubmitPaper = () => {
    setShowSubmitConfirm(false);
    setIsFinished(true);
    examAudio.playFanfare();

    let correctCount = 0;
    let incorrectCount = 0;

    sessionQuestions.forEach((q, idx) => {
      const chosen = selectedAnswers[idx];
      if (chosen !== undefined) {
        const isCorrect = chosen === q.shuffledCorrectIndex;
        if (isCorrect) correctCount++;
        else incorrectCount++;

        // Record telemetry into userProgress
        QuestionSessionEngine.recordAnswer(userProgress, q, isCorrect, 6, 1);
      }
    });

    const totalAttempted = correctCount + incorrectCount;
    const accuracy = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;
    const timeSpent = (activePaper?.durationMinutes ? activePaper.durationMinutes * 60 : 120 * 60) - secondsRemaining;

    // Record paper attempt
    if (activePaper) {
      const attemptRecord: PaperAttemptRecord = {
        paperId: activePaper.id,
        completed: true,
        score: correctCount,
        totalQuestions: sessionQuestions.length,
        accuracy,
        timeTakenSeconds: timeSpent,
        lastAttemptedAt: new Date().toISOString(),
        mode: activeSessionMode,
        answers: selectedAnswers,
      };

      const updatedProgress: ExamUserProgress = {
        ...userProgress,
        paperAttempts: {
          ...(userProgress.paperAttempts || {}),
          [activePaper.id]: attemptRecord,
        },
      };

      // Add to session history
      const withSession = QuestionSessionEngine.recordSessionHistory(updatedProgress, {
        mode: 'pyq_paper',
        modeLabel: activePaper.title,
        totalQuestions: sessionQuestions.length,
        correctAnswers: correctCount,
        timeSpentSeconds: timeSpent,
        xpEarned: correctCount * 15,
      });

      onSaveProgress(withSession);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Filtered Question list for palette
  const filteredQuestionIndices = useMemo(() => {
    return sessionQuestions
      .map((q, idx) => ({ q, idx }))
      .filter(({ q }) => (activeSectionFilter === 'all' ? true : q.subject === activeSectionFilter));
  }, [sessionQuestions, activeSectionFilter]);

  // Paper summary stats for completed attempt
  const sessionResults = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    let unattempted = 0;

    sessionQuestions.forEach((q, idx) => {
      const chosen = selectedAnswers[idx];
      if (chosen === undefined) unattempted++;
      else if (chosen === q.shuffledCorrectIndex) correct++;
      else wrong++;
    });

    const score = Math.max(0, correct * 1 - wrong * 0.25);
    const accuracy = correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;

    return { correct, wrong, unattempted, score, accuracy };
  }, [sessionQuestions, selectedAnswers]);

  return (
    <div className="fixed inset-0 z-[510] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="w-full max-w-5xl max-h-[92vh] bg-gradient-to-b from-[#080d16] via-[#0f1726] to-[#070b13] border border-cyan-500/30 rounded-3xl p-4 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col text-stone-200 my-auto min-h-[580px]">
        
        {/* ========================================================================= */}
        {/* 1. TOP HEADER                                                             */}
        {/* ========================================================================= */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 flex-shrink-0">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold font-mono uppercase tracking-widest text-cyan-400">
                  LATEST EXAM PAPERS & OFFICIAL PYQS
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                  <FileCheck className="w-3 h-3" /> 10-YEAR VAULT (2017–2026)
                </span>
              </div>
              <p className="text-[11px] text-stone-400">Verified Previous-Year Shift Questions with Official Audit Keys</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ⚡ Last 10 Years Vault Quick Button */}
            {!activePaper && (
              <button
                onClick={() => setShowVaultDrawer(true)}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">LAST 10 YEARS</span>
              </button>
            )}

            {/* Admin PYQ Manager Trigger */}
            {onSavePapers && onSaveQuestions && !activePaper && (
              <button
                onClick={() => setShowAdminManager(true)}
                className="p-2 rounded-xl bg-black/40 hover:bg-cyan-950/40 border border-stone-800 text-stone-400 hover:text-cyan-300 transition-all cursor-pointer"
                title="Admin PYQ & Paper Manager"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => {
                if (activePaper) {
                  if (confirm('Leave this paper session and return to the papers list?')) {
                    setActivePaper(null);
                  }
                } else {
                  onClose();
                }
              }}
              className="p-2 rounded-xl bg-black/40 hover:bg-rose-950/50 border border-stone-800 text-stone-400 hover:text-rose-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: PAPERS LIST & 10-YEAR ARCHIVE                                     */}
        {/* ========================================================================= */}
        {!activePaper ? (
          <div className="flex-grow flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-1 scrollbar-thin space-y-5">
            {/* Top Dynamic Statistics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 font-mono">
              <div className="p-3 rounded-2xl bg-black/40 border border-cyan-500/20 text-center">
                <span className="text-[10px] text-stone-400 block uppercase">📚 VERIFIED PAPERS</span>
                <span className="text-base sm:text-lg font-black text-cyan-300">{stats.verifiedCount} PAPERS</span>
              </div>
              <div className="p-3 rounded-2xl bg-black/40 border border-cyan-500/20 text-center">
                <span className="text-[10px] text-stone-400 block uppercase">📝 TOTAL QUESTIONS</span>
                <span className="text-base sm:text-lg font-black text-white">{stats.totalQuestions.toLocaleString()} Qs</span>
              </div>
              <div className="p-3 rounded-2xl bg-black/40 border border-cyan-500/20 text-center">
                <span className="text-[10px] text-stone-400 block uppercase">📅 YEAR ARCHIVE</span>
                <span className="text-base sm:text-lg font-black text-yellow-400">{stats.yearRange}</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-center flex flex-col items-center justify-center">
                <span className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED CONTENT
                </span>
                <span className="text-xs text-emerald-300 font-sans">Official SSC Pattern</span>
              </div>
            </div>

            {/* Year Filter Buttons - Desktop Wrap & Mobile Smooth Horizontal Scroll */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-stone-400">
                <span>SELECT EXAM YEAR:</span>
                <span className="text-[10px] sm:hidden text-cyan-400">← Scroll for older years →</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
                <button
                  onClick={() => setSelectedYear('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
                    selectedYear === 'all'
                      ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                      : 'bg-black/40 text-stone-400 border border-cyan-500/20 hover:text-white hover:border-cyan-500/40'
                  }`}
                >
                  ALL YEARS
                </button>
                {availableYears.map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
                      selectedYear === yr
                        ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                        : 'bg-black/40 text-stone-400 border border-cyan-500/20 hover:text-white hover:border-cyan-500/40'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>

            {/* Search, Sort, and Advanced Filter Toggle Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="text"
                  placeholder="🔍 Search year, shift, grade, topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/50 border border-cyan-500/20 text-xs font-mono text-white placeholder:text-stone-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                {/* Sort Views */}
                <div className="flex rounded-xl bg-black/40 border border-cyan-500/20 p-0.5 text-xs font-mono">
                  <button
                    onClick={() => setSortView('all')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      sortView === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSortView('recent')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      sortView === 'recent' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    🆕 Recent
                  </button>
                  <button
                    onClick={() => setSortView('popular')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      sortView === 'popular' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    🔥 Popular
                  </button>
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                    showAdvancedFilters || filterGrade !== 'all' || filterType !== 'all' || filterShift !== 'all'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-black/40 border-cyan-500/20 text-stone-400 hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>FILTER</span>
                </button>
              </div>
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-2xl bg-black/60 border border-cyan-500/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono"
              >
                <div>
                  <label className="text-[10px] text-cyan-300 block mb-1">GRADE</label>
                  <select
                    value={filterGrade}
                    onChange={(e) => setFilterGrade(e.target.value as any)}
                    className="w-full p-2 rounded-xl bg-black/50 border border-cyan-500/20 text-white"
                  >
                    <option value="all">All Grades</option>
                    <option value="GRADE_C_AND_D">Grade C & D</option>
                    <option value="GRADE_C">Grade C Only</option>
                    <option value="GRADE_D">Grade D Only</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-cyan-300 block mb-1">PAPER TYPE</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="w-full p-2 rounded-xl bg-black/50 border border-cyan-500/20 text-white"
                  >
                    <option value="all">All Types</option>
                    <option value="OFFICIAL">Official Papers</option>
                    <option value="VERIFIED_PYQ">Verified PYQ</option>
                    <option value="MEMORY_BASED">Memory Based</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-cyan-300 block mb-1">SHIFT</label>
                  <select
                    value={filterShift}
                    onChange={(e) => setFilterShift(e.target.value as any)}
                    className="w-full p-2 rounded-xl bg-black/50 border border-cyan-500/20 text-white"
                  >
                    <option value="all">All Shifts</option>
                    <option value="Shift 1">Shift 1</option>
                    <option value="Shift 2">Shift 2</option>
                    <option value="Shift 3">Shift 3</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-cyan-300 block mb-1">DIFFICULTY</label>
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value as any)}
                    className="w-full p-2 rounded-xl bg-black/50 border border-cyan-500/20 text-white"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </motion.div>
            )}

            {/* Papers List */}
            <div className="space-y-3 max-h-[360px] overflow-y-auto p-1 scrollbar-thin">
              {displayedPapers.length === 0 ? (
                <div className="p-8 rounded-2xl bg-black/40 border border-cyan-500/20 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-cyan-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white font-mono">NO PAPERS MATCHING CURRENT FILTER</h4>
                  <p className="text-xs text-stone-400">Paper availability varies by year and shift across SSC archives.</p>
                </div>
              ) : (
                displayedPapers.map((paper) => {
                  const userAttempt = userProgress.paperAttempts?.[paper.id];
                  const isCompleted = userAttempt?.completed;

                  return (
                    <div
                      key={paper.id}
                      className="p-5 rounded-2xl bg-black/50 border border-cyan-500/20 hover:border-cyan-400/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-black/65"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 font-bold">
                            {paper.year} {paper.shift ? `• ${paper.shift}` : ''}
                          </span>

                          {/* Verification Status Badges */}
                          {paper.paperType === 'OFFICIAL' ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 font-bold flex items-center gap-1">
                              <FileCheck className="w-3 h-3 text-emerald-400" /> OFFICIAL
                            </span>
                          ) : paper.paperType === 'VERIFIED_PYQ' ? (
                            <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 font-bold flex items-center gap-1">
                              <FileCheck className="w-3 h-3 text-cyan-400" /> VERIFIED PYQ
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-[10px] font-mono text-amber-300 font-bold">
                              ◈ MEMORY BASED
                            </span>
                          )}

                          {paper.difficulty && (
                            <span className="text-[10px] font-mono text-stone-400">
                              • {paper.difficulty}
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {paper.title}
                          </h4>
                          <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">
                            Source: {paper.source}
                          </p>
                        </div>

                        {/* User Progress Indicator */}
                        {userAttempt && (
                          <div className="flex items-center gap-3 pt-1 text-[11px] font-mono">
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              ✓ COMPLETED • Score: {userAttempt.accuracy}%
                            </span>
                            <span className="text-stone-400">
                              ({userAttempt.score}/{userAttempt.totalQuestions} Marks)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => setSelectedPaperForLaunch(paper)}
                        className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 flex-shrink-0 shadow-lg shadow-cyan-950/50 cursor-pointer group-hover:scale-105"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>ATTEMPT PAPER</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* ========================================================================= */}
            {/* SECTION 8: 🔥 PYQ MIX — LAST 10 YEARS                                      */}
            {/* ========================================================================= */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0c1626] via-[#101f36] to-[#0a1422] border border-cyan-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs font-bold font-mono text-yellow-400 uppercase tracking-wider flex items-center gap-1">
                    <Flame className="w-4 h-4 text-orange-400" /> PYQ MASTER MIX — LAST 10 YEARS
                  </span>
                </div>
                <p className="text-xs text-stone-300">
                  Practice questions distributed systematically across the last 10 years of verified papers.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-center flex-shrink-0 font-mono text-xs">
                <button
                  onClick={() => handleLaunchPYQMix(25)}
                  className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold cursor-pointer transition-all hover:scale-105"
                >
                  START 25
                </button>
                <button
                  onClick={() => handleLaunchPYQMix(50)}
                  className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold cursor-pointer transition-all hover:scale-105"
                >
                  START 50
                </button>
                <button
                  onClick={() => handleLaunchPYQMix(100)}
                  className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold cursor-pointer transition-all hover:scale-105"
                >
                  START 100
                </button>
                <button
                  onClick={() => handleLaunchPYQMix('all')}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold cursor-pointer transition-all hover:scale-105 shadow-md shadow-cyan-500/20"
                >
                  FULL MIX
                </button>
              </div>
            </div>
          </div>
        ) : !isFinished && currentQ ? (
          /* ========================================================================= */
          /* VIEW 2: ACTIVE DEDICATED PAPER CBT SESSION                                */
          /* ========================================================================= */
          <div className="flex-grow flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-1 scrollbar-thin space-y-4">
            {/* Paper Header Navigation & Palette Trigger */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-black/60 border border-cyan-500/30 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-cyan-300 font-bold line-clamp-1 max-w-xs sm:max-w-md">
                  {activePaper.title}
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-500/20 text-[10px]">
                  {activeSessionMode === 'ORIGINAL' ? '📄 ORIGINAL ORDER' : '🔀 RANDOMIZED PRACTICE'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Timer Display */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/50 border border-cyan-500/30 text-cyan-300 font-bold">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{formatTimer(secondsRemaining)}</span>
                </div>

                {/* Question Palette Trigger */}
                <button
                  onClick={() => setShowPaletteDrawer(!showPaletteDrawer)}
                  className="px-3 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold cursor-pointer flex items-center gap-1"
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>PALETTE ({currentIndex + 1}/{sessionQuestions.length})</span>
                </button>
              </div>
            </div>

            {/* Subject Section Selector */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs font-mono scrollbar-thin">
              <button
                onClick={() => setActiveSectionFilter('all')}
                className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                  activeSectionFilter === 'all'
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'bg-black/40 text-stone-400 border border-cyan-500/20'
                }`}
              >
                All Sections ({sessionQuestions.length})
              </button>
              <button
                onClick={() => setActiveSectionFilter('reasoning')}
                className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                  activeSectionFilter === 'reasoning'
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'bg-black/40 text-stone-400 border border-cyan-500/20'
                }`}
              >
                Reasoning ({sessionQuestions.filter((q) => q.subject === 'reasoning').length})
              </button>
              <button
                onClick={() => setActiveSectionFilter('general_awareness')}
                className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                  activeSectionFilter === 'general_awareness'
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'bg-black/40 text-stone-400 border border-cyan-500/20'
                }`}
              >
                General Awareness ({sessionQuestions.filter((q) => q.subject === 'general_awareness').length})
              </button>
              <button
                onClick={() => setActiveSectionFilter('english_language')}
                className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                  activeSectionFilter === 'english_language'
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'bg-black/40 text-stone-400 border border-cyan-500/20'
                }`}
              >
                English Language ({sessionQuestions.filter((q) => q.subject === 'english_language').length})
              </button>
            </div>

            {/* Main Interactive Question Box */}
            <div className="p-5 rounded-2xl bg-black/60 border border-cyan-500/30 space-y-4 min-h-[160px]">
              <div className="flex items-center justify-between text-xs font-mono text-cyan-300 border-b border-cyan-500/10 pb-2">
                <span>QUESTION {currentIndex + 1} OF {sessionQuestions.length}</span>
                <span className="text-stone-400 capitalize">{currentQ.subject.replace('_', ' ')} • {currentQ.topic}</span>
              </div>

              <h3 className="text-base sm:text-lg font-medium text-white leading-relaxed">
                {currentQ.question}
              </h3>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQ.shuffledOptions.map((opt, optIdx) => {
                const isSelected = selectedAnswers[currentIndex] === optIdx;

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-lg shadow-cyan-950/50'
                        : 'bg-black/40 hover:bg-cyan-950/30 border-cyan-500/20 text-stone-300'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 ${
                        isSelected
                          ? 'bg-cyan-500 text-black'
                          : 'bg-black/60 border border-cyan-500/30 text-cyan-300'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="flex-1 mt-0.5 leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleMarkForReview}
                  className={`px-3 py-2 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                    markedForReview[currentIndex]
                      ? 'bg-purple-950/60 border-purple-500 text-purple-300 font-bold'
                      : 'bg-black/40 border-stone-800 text-stone-400 hover:text-white'
                  }`}
                >
                  {markedForReview[currentIndex] ? '★ MARKED FOR REVIEW' : '☆ MARK FOR REVIEW'}
                </button>
                {selectedAnswers[currentIndex] !== undefined && (
                  <button
                    onClick={handleClearResponse}
                    className="px-3 py-2 rounded-xl bg-black/40 border border-stone-800 text-stone-400 hover:text-rose-300 text-xs font-mono cursor-pointer"
                  >
                    CLEAR RESPONSE
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentIndex === 0}
                  onClick={handlePrevious}
                  className="px-4 py-2 rounded-xl bg-black/50 border border-cyan-500/20 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-950/30 disabled:opacity-30 cursor-pointer"
                >
                  PREVIOUS
                </button>
                <button
                  onClick={handleNext}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
                >
                  {currentIndex + 1 === sessionQuestions.length ? 'FINISH' : 'SAVE & NEXT'}
                </button>
                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
                >
                  SUBMIT PAPER
                </button>
              </div>
            </div>

            {/* Question Palette Drawer Overlay */}
            {showPaletteDrawer && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 rounded-2xl bg-black/90 border border-cyan-500/40 space-y-4 mt-2"
              >
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                  <h4 className="text-xs font-mono font-bold text-white uppercase">QUESTION PALETTE</h4>
                  <button
                    onClick={() => setShowPaletteDrawer(false)}
                    className="text-stone-400 hover:text-white text-xs font-mono cursor-pointer"
                  >
                    ✕ CLOSE
                  </button>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 max-h-48 overflow-y-auto p-1 scrollbar-thin">
                  {filteredQuestionIndices.map(({ q, idx }) => {
                    const isAnswered = selectedAnswers[idx] !== undefined;
                    const isMarked = markedForReview[idx];
                    const isCurrent = currentIndex === idx;

                    let colorClass = 'bg-black/50 border-stone-800 text-stone-400';
                    if (isCurrent) colorClass = 'border-cyan-400 text-cyan-300 ring-2 ring-cyan-500';
                    else if (isMarked) colorClass = 'bg-purple-950/80 border-purple-500 text-purple-300';
                    else if (isAnswered) colorClass = 'bg-emerald-950/80 border-emerald-500 text-emerald-300';

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentIndex(idx);
                          setShowPaletteDrawer(false);
                          examAudio.playClick();
                        }}
                        className={`p-2 rounded-xl border text-center font-mono text-xs font-bold transition-all cursor-pointer ${colorClass}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 3: COMPREHENSIVE PAPER COMPLETION & RESULTS SCORECARD                */
          /* ========================================================================= */
          <div className="flex-grow flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-1 scrollbar-thin space-y-6">
            {!reviewMode ? (
              <div className="py-6 text-center space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center mx-auto text-cyan-300">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-bold font-mono text-white">✓ PAPER COMPLETED</h3>
                  <p className="text-xs text-stone-400">
                    Official SSC Stenographer Paper Attempt Evaluation
                  </p>
                </div>

                {/* Scorecard Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto font-mono">
                  <div className="p-4 rounded-2xl bg-black/50 border border-cyan-500/20">
                    <span className="text-[10px] text-stone-400 block uppercase">NET SCORE</span>
                    <span className="text-2xl font-bold text-cyan-300">
                      {sessionResults.score.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/50 border border-emerald-500/20">
                    <span className="text-[10px] text-stone-400 block uppercase">CORRECT</span>
                    <span className="text-2xl font-bold text-emerald-400">{sessionResults.correct}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/50 border border-rose-500/20">
                    <span className="text-[10px] text-stone-400 block uppercase">INCORRECT</span>
                    <span className="text-2xl font-bold text-rose-400">{sessionResults.wrong}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/50 border border-yellow-500/20">
                    <span className="text-[10px] text-stone-400 block uppercase">ACCURACY</span>
                    <span className="text-2xl font-bold text-yellow-400">{sessionResults.accuracy}%</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 justify-center pt-3">
                  <button
                    onClick={() => setReviewMode(true)}
                    className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-widest cursor-pointer"
                  >
                    📖 REVIEW ANSWERS & EXPLANATIONS
                  </button>
                  <button
                    onClick={() => {
                      if (activePaper) handleLaunchPaper(activePaper, 'ORIGINAL');
                    }}
                    className="px-6 py-3 rounded-2xl bg-black/50 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-xs uppercase tracking-widest hover:bg-cyan-950/40 cursor-pointer"
                  >
                    📄 RETAKE PAPER
                  </button>
                  <button
                    onClick={() => {
                      if (activePaper) handleLaunchPaper(activePaper, 'RANDOMIZED');
                    }}
                    className="px-6 py-3 rounded-2xl bg-black/50 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-xs uppercase tracking-widest hover:bg-cyan-950/40 cursor-pointer"
                  >
                    🔀 RANDOMIZE & PRACTICE
                  </button>
                  <button
                    onClick={() => setActivePaper(null)}
                    className="px-6 py-3 rounded-2xl bg-black/50 border border-stone-800 text-stone-400 hover:text-white font-mono text-xs uppercase cursor-pointer"
                  >
                    BACK TO PAPERS
                  </button>
                </div>
              </div>
            ) : (
              /* Review Answers View */
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                  <h4 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-400" /> OFFICIAL QUESTION PAPER AUDIT & KEY
                  </h4>
                  <button
                    onClick={() => setReviewMode(false)}
                    className="px-4 py-1.5 rounded-xl bg-cyan-500 text-black font-mono font-bold text-xs cursor-pointer"
                  >
                    BACK TO SUMMARY
                  </button>
                </div>

                <div className="space-y-4">
                  {sessionQuestions.map((q, idx) => {
                    const chosen = selectedAnswers[idx];
                    const isCorrect = chosen === q.shuffledCorrectIndex;
                    const isAttempted = chosen !== undefined;

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border space-y-3 ${
                          isCorrect
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : isAttempted
                            ? 'bg-rose-950/20 border-rose-500/30'
                            : 'bg-black/40 border-stone-800'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-cyan-300 font-bold">Q{idx + 1}. ({q.subject.replace('_', ' ')})</span>
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              isCorrect
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : isAttempted
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-stone-800 text-stone-400'
                            }`}
                          >
                            {isCorrect ? '✓ CORRECT' : isAttempted ? '✕ INCORRECT' : '◌ UNATTEMPTED'}
                          </span>
                        </div>

                        <p className="text-sm font-medium text-white">{q.question}</p>

                        {/* Options List */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {q.shuffledOptions.map((opt, optIdx) => {
                            const isCorrectOpt = optIdx === q.shuffledCorrectIndex;
                            const isUserChoice = chosen === optIdx;

                            let optStyle = 'bg-black/30 border-stone-800 text-stone-400';
                            if (isCorrectOpt) optStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-200 font-bold';
                            else if (isUserChoice && !isCorrect) optStyle = 'bg-rose-950/70 border-rose-500 text-rose-200';

                            return (
                              <div key={optIdx} className={`p-2.5 rounded-xl border flex items-center gap-2 ${optStyle}`}>
                                <span className="font-mono">{String.fromCharCode(65 + optIdx)}.</span>
                                <span>{opt}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation */}
                        <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs space-y-1">
                          <p className="text-stone-300 leading-relaxed">
                            <strong className="text-cyan-300 font-mono">EXPLANATION:</strong> {q.explanation}
                          </p>
                          {q.keyFact && (
                            <p className="text-emerald-300 font-mono text-[11px]">
                              💡 <strong>KEY FACT:</strong> {q.keyFact}
                            </p>
                          )}
                          {q.sourceExam && (
                            <p className="text-stone-400 font-mono text-[10px]">
                              📌 <strong>VERIFIED SOURCE:</strong> {q.sourceExam}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 1: ATTEMPT MODE SELECTOR (ORIGINAL vs RANDOMIZED)                   */}
        {/* ========================================================================= */}
        {selectedPaperForLaunch && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-gradient-to-b from-[#090f19] via-[#101928] to-[#070c14] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-5 text-stone-200"
            >
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
                  SSC STENOGRAPHER PAPER MODE
                </span>
                <button
                  onClick={() => setSelectedPaperForLaunch(null)}
                  className="text-stone-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">{selectedPaperForLaunch.title}</h3>
                <p className="text-xs text-stone-400">
                  {selectedPaperForLaunch.year} • {selectedPaperForLaunch.shift || 'Shift 1'} • Duration: {selectedPaperForLaunch.durationMinutes || 120} Mins
                </p>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <button
                  onClick={() => handleLaunchPaper(selectedPaperForLaunch, 'ORIGINAL')}
                  className="w-full p-4 rounded-2xl bg-black/50 hover:bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white group-hover:text-cyan-300">📄 ATTEMPT ORIGINAL PAPER</span>
                    <span className="text-[10px] text-cyan-400">Authentic Exam</span>
                  </div>
                  <p className="text-[11px] text-stone-400 font-sans mt-1">
                    Preserves original question numbering and authentic sequence for real exam practice.
                  </p>
                </button>

                <button
                  onClick={() => handleLaunchPaper(selectedPaperForLaunch, 'RANDOMIZED')}
                  className="w-full p-4 rounded-2xl bg-black/50 hover:bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white group-hover:text-cyan-300">🔀 PRACTICE RANDOMIZED</span>
                    <span className="text-[10px] text-yellow-400">Active Recall</span>
                  </div>
                  <p className="text-[11px] text-stone-400 font-sans mt-1">
                    Randomizes questions and options while preserving verified answer keys.
                  </p>
                </button>
              </div>

              <button
                onClick={() => setSelectedPaperForLaunch(null)}
                className="w-full py-2.5 rounded-xl bg-black/40 border border-stone-800 text-stone-400 text-xs font-mono hover:text-white cursor-pointer"
              >
                CANCEL
              </button>
            </motion.div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: ⚡ LAST 10 YEARS PYQ VAULT OVERVIEW                              */}
        {/* ========================================================================= */}
        {showVaultDrawer && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl bg-gradient-to-b from-[#090f19] via-[#101928] to-[#070c14] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4 text-stone-200"
            >
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
                    LAST 10 YEARS PYQ VAULT ARCHIVE
                  </span>
                </div>
                <button
                  onClick={() => setShowVaultDrawer(false)}
                  className="text-stone-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-stone-300">
                Verified question papers available across each official examination cycle.
              </p>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1 font-mono text-xs scrollbar-thin">
                {vaultYearStats.map((item) => (
                  <div
                    key={item.year}
                    className="p-3 rounded-xl bg-black/40 border border-cyan-500/20 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-cyan-300 w-12">{item.year}</span>
                      <div className="text-[11px] text-stone-400 font-sans">
                        <span>{item.paperCount} Verified Sets</span> • <span>{item.shifts.join(', ') || 'All Shifts'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓ VERIFIED</span>
                      <button
                        onClick={() => {
                          setSelectedYear(item.year);
                          setShowVaultDrawer(false);
                        }}
                        className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 font-bold text-[10px] cursor-pointer"
                      >
                        VIEW PAPERS
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowVaultDrawer(false)}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase cursor-pointer"
                >
                  CLOSE VAULT
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 3: SUBMIT CONFIRMATION                                              */}
        {/* ========================================================================= */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-gradient-to-b from-[#090f19] to-[#070c14] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4 text-stone-200 text-center font-mono"
            >
              <HelpCircle className="w-10 h-10 text-cyan-400 mx-auto" />
              <h3 className="text-base font-bold text-white">SUBMIT EXAMINATION PAPER?</h3>

              <div className="grid grid-cols-3 gap-2 text-xs py-2">
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                  <span className="text-[10px] text-stone-400 block">ANSWERED</span>
                  <span className="font-bold text-emerald-400">{Object.keys(selectedAnswers).length}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30">
                  <span className="text-[10px] text-stone-400 block">UNANSWERED</span>
                  <span className="font-bold text-rose-400">{sessionQuestions.length - Object.keys(selectedAnswers).length}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30">
                  <span className="text-[10px] text-stone-400 block">REVIEW</span>
                  <span className="font-bold text-purple-400">{Object.keys(markedForReview).filter((k) => markedForReview[parseInt(k)]).length}</span>
                </div>
              </div>

              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="px-5 py-2.5 rounded-xl bg-black/50 border border-stone-800 text-stone-400 text-xs cursor-pointer"
                >
                  CONTINUE PAPER
                </button>
                <button
                  onClick={handleSubmitPaper}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase cursor-pointer"
                >
                  ✓ CONFIRM SUBMISSION
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 4: ADMIN PYQ PAPER MANAGER                                          */}
        {/* ========================================================================= */}
        {showAdminManager && onSavePapers && onSaveQuestions && (
          <AdminPaperManagerModal
            papers={papers}
            questions={questions}
            onSavePapers={(p) => {
              onSavePapers(p);
            }}
            onSaveQuestions={(q) => {
              onSaveQuestions(q);
            }}
            onClose={() => setShowAdminManager(false)}
          />
        )}
      </div>
    </div>
  );
};
