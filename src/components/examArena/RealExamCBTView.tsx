import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  FileText,
  Check,
  ChevronRight,
  TrendingUp,
  X,
  LayoutGrid,
  Menu,
} from 'lucide-react';
import { ExamQuestion, ExamSubject, ExamUserProgress } from '../../types/examArena';
import { QuestionSessionEngine, PreparedQuestion } from '../../services/examEngine';

interface RealExamCBTViewProps {
  questions: ExamQuestion[];
  userProgress: ExamUserProgress;
  onSaveProgress: (updated: ExamUserProgress) => void;
  onExitExam: () => void;
}

type QuestionStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked_review' | 'answered_marked_review';

export const RealExamCBTView: React.FC<RealExamCBTViewProps> = ({
  questions,
  userProgress,
  onSaveProgress,
  onExitExam,
}) => {
  const [activeSubject, setActiveSubject] = useState<ExamSubject>('reasoning');
  const [examQuestions, setExamQuestions] = useState<PreparedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [questionStatuses, setQuestionStatuses] = useState<Record<number, QuestionStatus>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(120 * 60); // 2 hours
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPaperModal, setShowPaperModal] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);

  // Lock body scroll while in CBT View and handle Escape key
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showMobilePalette) {
          setShowMobilePalette(false);
        } else if (showSubmitModal) {
          setShowSubmitModal(false);
        } else if (showPaperModal) {
          setShowPaperModal(false);
        } else if (isSubmitted) {
          onExitExam();
        } else {
          setShowSubmitModal(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMobilePalette, showSubmitModal, showPaperModal, isSubmitted, onExitExam]);

  // Initialize CBT session according to SSC syllabus
  useEffect(() => {
    const reasoningQs = QuestionSessionEngine.createSession(questions, {
      subject: 'reasoning',
      count: 15,
    });
    const gaQs = QuestionSessionEngine.createSession(questions, {
      subject: 'general_awareness',
      count: 15,
    });
    const engQs = QuestionSessionEngine.createSession(questions, {
      subject: 'english_language',
      count: 20,
    });

    const combined = [...reasoningQs, ...gaQs, ...engQs];
    setExamQuestions(combined);

    // Initial status: Q0 is not_answered (visited), others not_visited
    const initialStatus: Record<number, QuestionStatus> = {};
    combined.forEach((_, idx) => {
      initialStatus[idx] = idx === 0 ? 'not_answered' : 'not_visited';
    });
    setQuestionStatuses(initialStatus);
  }, [questions]);

  // Submit Exam Handler
  const handleSubmitExam = useCallback(() => {
    setShowSubmitModal(false);
    setIsSubmitted(true);

    let correct = 0;
    let wrong = 0;
    let attempted = 0;

    examQuestions.forEach((q, idx) => {
      const userAns = answers[idx];
      if (userAns !== undefined) {
        attempted += 1;
        if (userAns === q.shuffledCorrectIndex) correct += 1;
        else wrong += 1;
      }
    });

    const marks = Math.max(0, correct * 1 - wrong * 0.25);
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const timeTaken = 120 * 60 - timeLeftSeconds;

    const baseProgress: ExamUserProgress = {
      ...userProgress,
      totalQuestionsSolved: (userProgress.totalQuestionsSolved || 0) + attempted,
      totalCorrect: (userProgress.totalCorrect || 0) + correct,
      totalTimeSpentSeconds: (userProgress.totalTimeSpentSeconds || 0) + timeTaken,
      totalXP: (userProgress.totalXP || 0) + Math.max(20, Math.round(marks * 5)),
      mockTestScores: [
        ...(userProgress.mockTestScores || []),
        {
          mockId: `mock_${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          score: marks,
          totalMarks: examQuestions.length,
          accuracy,
          timeTakenSeconds: timeTaken,
        },
      ],
    };

    const withSession = QuestionSessionEngine.recordSessionHistory(baseProgress, {
      mode: 'real_exam_cbt',
      modeLabel: 'CBT Full Mock Test',
      totalQuestions: attempted,
      correctAnswers: correct,
      timeSpentSeconds: timeTaken,
      xpEarned: Math.max(20, Math.round(marks * 5)),
    });

    onSaveProgress(withSession);
  }, [answers, examQuestions, onSaveProgress, timeLeftSeconds, userProgress]);

  // Single Accurate Exam Countdown Timer
  useEffect(() => {
    if (isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, handleSubmitExam]);

  const currentQ = examQuestions[currentIndex];
  const currentAnswer = answers[currentIndex];

  const formatTime = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSelectOption = (optIdx: number) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: optIdx }));
  };

  const handleSaveAndNext = () => {
    const hasAnswered = answers[currentIndex] !== undefined;
    setQuestionStatuses((prev) => ({
      ...prev,
      [currentIndex]: hasAnswered ? 'answered' : 'not_answered',
    }));

    if (currentIndex + 1 < examQuestions.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      if (questionStatuses[nextIdx] === 'not_visited') {
        setQuestionStatuses((prev) => ({ ...prev, [nextIdx]: 'not_answered' }));
      }
      // auto-switch active subject if next question is in different subject
      const nextSub = examQuestions[nextIdx]?.subject;
      if (nextSub && nextSub !== activeSubject) {
        setActiveSubject(nextSub);
      }
    }
  };

  const handleMarkForReviewAndNext = () => {
    const hasAnswered = answers[currentIndex] !== undefined;
    setQuestionStatuses((prev) => ({
      ...prev,
      [currentIndex]: hasAnswered ? 'answered_marked_review' : 'marked_review',
    }));

    if (currentIndex + 1 < examQuestions.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      if (questionStatuses[nextIdx] === 'not_visited') {
        setQuestionStatuses((prev) => ({ ...prev, [nextIdx]: 'not_answered' }));
      }
      const nextSub = examQuestions[nextIdx]?.subject;
      if (nextSub && nextSub !== activeSubject) {
        setActiveSubject(nextSub);
      }
    }
  };

  const handleClearResponse = () => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentIndex];
      return copy;
    });
    setQuestionStatuses((prev) => ({ ...prev, [currentIndex]: 'not_answered' }));
  };

  const handleJumpToQuestion = (targetIdx: number) => {
    setCurrentIndex(targetIdx);
    if (questionStatuses[targetIdx] === 'not_visited') {
      setQuestionStatuses((prev) => ({ ...prev, [targetIdx]: 'not_answered' }));
    }
    const targetSub = examQuestions[targetIdx]?.subject;
    if (targetSub && targetSub !== activeSubject) {
      setActiveSubject(targetSub);
    }
    setShowMobilePalette(false);
  };

  // Section filtered question indices
  const sectionQuestions = useMemo(() => {
    return examQuestions
      .map((q, idx) => ({ q, idx }))
      .filter((item) => item.q.subject === activeSubject);
  }, [examQuestions, activeSubject]);

  // Status counters
  const answeredCount = Object.values(questionStatuses).filter(
    (s) => s === 'answered' || s === 'answered_marked_review'
  ).length;
  const notAnsweredCount = Object.values(questionStatuses).filter((s) => s === 'not_answered').length;
  const markedReviewCount = Object.values(questionStatuses).filter(
    (s) => s === 'marked_review' || s === 'answered_marked_review'
  ).length;
  const notVisitedCount = Object.values(questionStatuses).filter((s) => s === 'not_visited').length;

  return (
    <div className="fixed inset-0 z-[520] bg-[#08090f] text-stone-200 font-sans flex flex-col overflow-hidden w-full h-[100dvh] min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      {/* 1. TOP RESPONSIVE CBT HEADER */}
      <header className="flex-shrink-0 bg-[#0f111a] border-b border-stone-800 px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 z-20">
        {/* Top Row / Brand Info */}
        <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-900/60 border border-blue-500/40 flex items-center justify-center text-blue-400 flex-shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase truncate">
                SSC STENO GRADE C & D — CBT TEST
              </h1>
              <p className="text-[10px] sm:text-[11px] text-stone-400 font-mono truncate hidden xs:block">
                Official Exam Simulation • Marks: +1.00 / -0.25
              </p>
            </div>
          </div>

          {/* Close/Exit on Mobile (Top Right) */}
          <button
            onClick={() => {
              if (isSubmitted) onExitExam();
              else setShowSubmitModal(true);
            }}
            className="sm:hidden p-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 min-w-[40px] min-h-[40px] flex items-center justify-center flex-shrink-0"
            title="Exit Exam"
            aria-label="Exit Exam"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls & Clock */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto flex-wrap">
          {/* Live Timer */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-black/60 border border-stone-700 font-mono text-xs text-amber-300 min-h-[36px]">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 flex-shrink-0" />
            <span className="font-bold">{formatTime(timeLeftSeconds)}</span>
          </div>

          {/* Question Paper Button (sm+) */}
          <button
            onClick={() => setShowPaperModal(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono min-h-[36px]"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paper</span>
          </button>

          {/* Mobile Palette Drawer Trigger (lg:hidden) */}
          <button
            onClick={() => setShowMobilePalette(true)}
            className="lg:hidden flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-500/40 text-blue-300 text-xs font-mono min-h-[36px]"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Palette ({currentIndex + 1}/{examQuestions.length})</span>
          </button>

          {/* Submit Exam Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-3.5 sm:px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-900/40 min-h-[36px] flex items-center justify-center cursor-pointer"
          >
            SUBMIT
          </button>

          {/* Close/Exit on Desktop (sm+) */}
          <button
            onClick={() => {
              if (isSubmitted) onExitExam();
              else setShowSubmitModal(true);
            }}
            className="hidden sm:flex p-2 rounded-xl bg-stone-900 hover:bg-rose-950/60 border border-stone-700 hover:border-rose-500/40 text-stone-300 hover:text-rose-300 min-w-[40px] min-h-[40px] items-center justify-center cursor-pointer transition-colors"
            title="Exit Exam"
            aria-label="Exit Exam"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN BODY AREA */}
      {!isSubmitted ? (
        <div className="flex-grow flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* Main Question Area (Left/Center) */}
          <main className="flex-grow flex-1 min-h-0 flex flex-col p-3 sm:p-5 md:p-6 border-r border-stone-800 overflow-y-auto custom-scrollbar">
            {/* Subject Tabs */}
            <div className="flex gap-2 border-b border-stone-800 pb-2.5 mb-3.5 overflow-x-auto flex-shrink-0">
              {[
                { id: 'reasoning' as ExamSubject, label: 'Reasoning' },
                { id: 'general_awareness' as ExamSubject, label: 'General Awareness' },
                { id: 'english_language' as ExamSubject, label: 'English Comprehension' },
              ].map((tab) => {
                const count = examQuestions.filter((q) => q.subject === tab.id).length;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveSubject(tab.id);
                      const firstInSub = examQuestions.findIndex((q) => q.subject === tab.id);
                      if (firstInSub !== -1) handleJumpToQuestion(firstInSub);
                    }}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-mono whitespace-nowrap transition-all cursor-pointer min-h-[36px] flex items-center gap-1.5 ${
                      activeSubject === tab.id
                        ? 'bg-blue-600 text-white font-bold shadow-md'
                        : 'bg-stone-900/60 hover:bg-stone-800 text-stone-400 border border-stone-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="text-[10px] opacity-80">({count})</span>
                  </button>
                );
              })}
            </div>

            {currentQ ? (
              <div className="flex-1 flex flex-col justify-between space-y-4 sm:space-y-6">
                {/* Question Info Header */}
                <div className="flex items-center justify-between text-xs font-mono text-stone-400 border-b border-stone-800 pb-2 flex-wrap gap-2 flex-shrink-0">
                  <span>
                    Question <strong className="text-white text-sm">{currentIndex + 1}</strong> of{' '}
                    {examQuestions.length}
                  </span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-emerald-400 font-bold">+1.00</span>
                    <span className="text-rose-400 font-bold">-0.25</span>
                  </div>
                </div>

                {/* Question Content Box */}
                <div className="p-4 sm:p-6 rounded-2xl bg-[#0e101a] border border-stone-800 space-y-3 flex-shrink-0">
                  <div className="text-[11px] font-mono text-blue-400 uppercase tracking-wider">
                    {currentQ.topic} {currentQ.subtopic ? `// ${currentQ.subtopic}` : ''}
                  </div>
                  <h2 className="text-sm sm:text-base md:text-lg font-medium text-white leading-relaxed whitespace-pre-line">
                    {currentQ.question}
                  </h2>
                </div>

                {/* Options List */}
                <div className="space-y-2.5 sm:space-y-3 flex-grow">
                  {currentQ.shuffledOptions.map((opt, idx) => {
                    const isSelected = currentAnswer === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        className={`w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-start gap-3 cursor-pointer min-h-[48px] select-none ${
                          isSelected
                            ? 'bg-blue-950/90 border-blue-500 text-blue-100 shadow-md shadow-blue-900/30'
                            : 'bg-stone-900/40 hover:bg-stone-800/60 border-stone-800 text-stone-300'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 ${
                            isSelected
                              ? 'bg-blue-600 border-blue-400 text-white'
                              : 'bg-black/60 border-stone-700 text-stone-400'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1 mt-0.5 leading-relaxed">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Navigation Toolbar (Responsive Wrapping) */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 sm:pt-4 border-t border-stone-800 flex-shrink-0">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleMarkForReviewAndNext}
                      className="px-3 sm:px-4 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold uppercase transition-all min-h-[42px] cursor-pointer"
                    >
                      Mark Review & Next
                    </button>
                    <button
                      onClick={handleClearResponse}
                      className="px-3 sm:px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 text-xs font-mono uppercase transition-all min-h-[42px] cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>

                  <button
                    onClick={handleSaveAndNext}
                    className="px-5 sm:px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold uppercase tracking-wider shadow-lg shadow-blue-900/30 transition-all flex items-center gap-2 min-h-[42px] cursor-pointer ml-auto"
                  >
                    <span>Save & Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </main>

          {/* 3. DESKTOP QUESTION PALETTE SIDEBAR (Hidden on Mobile <1024px) */}
          <aside className="hidden lg:flex w-80 bg-[#0c0d14] p-4 sm:p-5 flex-col justify-between flex-shrink-0">
            <div className="space-y-4">
              {/* Palette Legend */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">
                    {answeredCount}
                  </span>
                  <span className="text-stone-300">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-rose-600 text-white flex items-center justify-center text-[9px] font-bold">
                    {notAnsweredCount}
                  </span>
                  <span className="text-stone-300">Not Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-purple-600 text-white flex items-center justify-center text-[9px] font-bold">
                    {markedReviewCount}
                  </span>
                  <span className="text-stone-300">Marked Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-stone-700 text-stone-300 flex items-center justify-center text-[9px] font-bold">
                    {notVisitedCount}
                  </span>
                  <span className="text-stone-300">Not Visited</span>
                </div>
              </div>

              {/* Subject Title */}
              <div className="text-xs font-mono font-bold text-stone-300 uppercase">
                Section: {activeSubject.replace('_', ' ')}
              </div>

              {/* Grid Palette */}
              <div className="grid grid-cols-5 gap-2 max-h-80 overflow-y-auto p-1 custom-scrollbar">
                {sectionQuestions.map(({ idx }) => {
                  const status = questionStatuses[idx] || 'not_visited';
                  const isCurrent = currentIndex === idx;

                  let color = 'bg-stone-800 text-stone-400';
                  if (status === 'answered') color = 'bg-emerald-600 text-white';
                  else if (status === 'not_answered') color = 'bg-rose-600 text-white';
                  else if (status === 'marked_review' || status === 'answered_marked_review')
                    color = 'bg-purple-600 text-white';

                  return (
                    <button
                      key={idx}
                      onClick={() => handleJumpToQuestion(idx)}
                      className={`h-9 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center relative cursor-pointer ${color} ${
                        isCurrent ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0c0d14]' : ''
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-stone-800">
              <button
                onClick={() => setShowSubmitModal(true)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-widest transition-all cursor-pointer min-h-[44px]"
              >
                SUBMIT FINAL TEST
              </button>
            </div>
          </aside>
        </div>
      ) : (
        /* 4. POST-EXAM SCORECARD & COMPREHENSIVE BREAKDOWN (Responsive 2-col to 4-col) */
        <div className="flex-grow flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-12">
            <div className="text-center space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold uppercase">
                EXAMINATION SUBMITTED SUCCESSFULLY
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif italic text-white">Your CBT Exam Scorecard</h2>
              <p className="text-xs text-stone-400 max-w-md mx-auto">
                Detailed performance metrics evaluated according to official SSC marking schemes (+1.00 / -0.25).
              </p>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 font-mono text-center">
              {(() => {
                let correct = 0;
                let wrong = 0;
                let attempted = 0;

                examQuestions.forEach((q, idx) => {
                  const ans = answers[idx];
                  if (ans !== undefined) {
                    attempted += 1;
                    if (ans === q.shuffledCorrectIndex) correct += 1;
                    else wrong += 1;
                  }
                });

                const score = Math.max(0, correct * 1 - wrong * 0.25);
                const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

                return (
                  <>
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-900/60 border border-stone-800">
                      <span className="text-[10px] text-stone-400 uppercase">NET SCORE</span>
                      <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">
                        {score.toFixed(2)} / {examQuestions.length}
                      </div>
                    </div>
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-900/60 border border-stone-800">
                      <span className="text-[10px] text-stone-400 uppercase">ACCURACY</span>
                      <div className="text-xl sm:text-2xl font-bold text-cyan-400 mt-1">{accuracy}%</div>
                    </div>
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-900/60 border border-stone-800">
                      <span className="text-[10px] text-stone-400 uppercase">CORRECT / WRONG</span>
                      <div className="text-xl sm:text-2xl font-bold text-white mt-1">
                        <span className="text-emerald-400">{correct}</span> /{' '}
                        <span className="text-rose-400">{wrong}</span>
                      </div>
                    </div>
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-900/60 border border-stone-800">
                      <span className="text-[10px] text-stone-400 uppercase">TIME TAKEN</span>
                      <div className="text-xl sm:text-2xl font-bold text-amber-400 mt-1">
                        {formatTime(120 * 60 - timeLeftSeconds)}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Solutions & Explanations Review */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#0d0e17] border border-stone-800 space-y-4">
              <h3 className="text-xs sm:text-sm font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>QUESTION BY QUESTION ANALYSIS & SOLUTIONS</span>
              </h3>

              <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto p-1 custom-scrollbar">
                {examQuestions.map((q, idx) => {
                  const userAns = answers[idx];
                  const isCorrect = userAns === q.shuffledCorrectIndex;
                  const isAttempted = userAns !== undefined;

                  return (
                    <div
                      key={idx}
                      className="p-3.5 sm:p-4 rounded-2xl bg-black/40 border border-stone-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between font-mono flex-wrap gap-1">
                        <span className="text-stone-400">
                          Q{idx + 1}. [{q.subject.toUpperCase()}]
                        </span>
                        {isAttempted ? (
                          isCorrect ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> +1.00 (CORRECT)
                            </span>
                          ) : (
                            <span className="text-rose-400 font-bold">-0.25 (INCORRECT)</span>
                          )
                        ) : (
                          <span className="text-stone-500">UNATTEMPTED (0.00)</span>
                        )}
                      </div>

                      <p className="text-stone-200 leading-relaxed">{q.question}</p>
                      <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800 text-[11px] text-stone-300 space-y-1">
                        <div>
                          <strong>Correct Answer:</strong>{' '}
                          <span className="text-emerald-400">{q.shuffledOptions[q.shuffledCorrectIndex]}</span>
                        </div>
                        {q.explanation && (
                          <p className="text-stone-400 leading-relaxed pt-1 border-t border-stone-800/80">
                            {q.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={onExitExam}
                className="px-6 sm:px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-900/30 cursor-pointer min-h-[44px]"
              >
                EXIT CBT SIMULATOR & RETURN TO ARENA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MOBILE QUESTION PALETTE DRAWER (Slides up cleanly on mobile) */}
      <AnimatePresence>
        {showMobilePalette && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end lg:hidden">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-h-[80dvh] bg-[#0e101a] border-t border-stone-700 rounded-t-3xl p-4 sm:p-6 flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div className="flex items-center gap-2 font-mono text-xs text-stone-200">
                  <LayoutGrid className="w-4 h-4 text-blue-400" />
                  <span className="font-bold uppercase">Question Palette</span>
                  <span className="text-stone-400">({sectionQuestions.length} Questions)</span>
                </div>
                <button
                  onClick={() => setShowMobilePalette(false)}
                  className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono py-2.5 border-b border-stone-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-600 text-white flex items-center justify-center text-[8px] font-bold">
                    {answeredCount}
                  </span>
                  <span className="text-stone-300">Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-rose-600 text-white flex items-center justify-center text-[8px] font-bold">
                    {notAnsweredCount}
                  </span>
                  <span className="text-stone-300">Not Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-purple-600 text-white flex items-center justify-center text-[8px] font-bold">
                    {markedReviewCount}
                  </span>
                  <span className="text-stone-300">Marked Review</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-stone-700 text-stone-300 flex items-center justify-center text-[8px] font-bold">
                    {notVisitedCount}
                  </span>
                  <span className="text-stone-300">Not Visited</span>
                </div>
              </div>

              {/* Palette Grid */}
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 py-3 overflow-y-auto max-h-[50dvh] custom-scrollbar">
                {sectionQuestions.map(({ idx }) => {
                  const status = questionStatuses[idx] || 'not_visited';
                  const isCurrent = currentIndex === idx;

                  let color = 'bg-stone-800 text-stone-400';
                  if (status === 'answered') color = 'bg-emerald-600 text-white';
                  else if (status === 'not_answered') color = 'bg-rose-600 text-white';
                  else if (status === 'marked_review' || status === 'answered_marked_review')
                    color = 'bg-purple-600 text-white';

                  return (
                    <button
                      key={idx}
                      onClick={() => handleJumpToQuestion(idx)}
                      className={`h-9 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${color} ${
                        isCurrent ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0e101a]' : ''
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. SUBMISSION CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-[#10121d] border border-stone-700 rounded-3xl p-5 sm:p-6 space-y-4 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-white">SUBMIT EXAMINATION?</h3>
              <p className="text-xs text-stone-400">
                You have answered <strong>{answeredCount}</strong> out of {examQuestions.length} questions.
                Are you ready to view your evaluated scorecard?
              </p>
            </div>

            <div className="flex gap-2.5 justify-center pt-2">
              <button
                onClick={handleSubmitExam}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase cursor-pointer min-h-[42px]"
              >
                YES, SUBMIT
              </button>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono font-bold text-xs uppercase cursor-pointer min-h-[42px]"
              >
                CANCEL
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 7. FULL QUESTION PAPER MODAL */}
      {showPaperModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-3xl max-h-[85dvh] bg-[#0f111a] border border-stone-700 rounded-3xl p-4 sm:p-6 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2 font-mono text-xs text-white">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="font-bold">FULL QUESTION PAPER VIEW</span>
              </div>
              <button
                onClick={() => setShowPaperModal(false)}
                className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 py-3 custom-scrollbar">
              {examQuestions.map((q, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-black/40 border border-stone-800 text-xs space-y-1.5">
                  <div className="font-mono text-stone-400">
                    Q{idx + 1}. [{q.subject.toUpperCase()}] {q.topic}
                  </div>
                  <p className="text-white font-medium">{q.question}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
