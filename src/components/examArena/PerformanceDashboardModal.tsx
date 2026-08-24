import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  BarChart3,
  Flame,
  Zap,
  Target,
  Award,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  X,
  Play,
  History,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { ExamUserProgress, ExamSubject, ExamSessionRecord } from '../../types/examArena';
import { resetUserProgressToBeginning } from '../../services/firestore/examArena.service';

interface PerformanceDashboardModalProps {
  userProgress: ExamUserProgress;
  onStartWeakPractice: () => void;
  onResetProgress?: (clean: ExamUserProgress) => void;
  onClose: () => void;
}

export const PerformanceDashboardModal: React.FC<PerformanceDashboardModalProps> = ({
  userProgress,
  onStartWeakPractice,
  onResetProgress,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'weaknesses'>('overview');

  const totalAtt = userProgress.totalQuestionsSolved || 0;
  const totalCorr = userProgress.totalCorrect || 0;
  const accuracy = totalAtt > 0 ? Math.round((totalCorr / totalAtt) * 100) : 0;
  const masteries = Object.values(userProgress.topicMasteries || {});

  // Group by subject
  const subjectMasteries: Record<ExamSubject, { total: number; correct: number }> = {
    reasoning: { total: 0, correct: 0 },
    general_awareness: { total: 0, correct: 0 },
    english_language: { total: 0, correct: 0 },
  };

  masteries.forEach((m) => {
    if (subjectMasteries[m.subject]) {
      subjectMasteries[m.subject].total += m.totalAttempted;
      subjectMasteries[m.subject].correct += m.totalCorrect;
    }
  });

  const weakTopics = masteries.filter((m) => m.totalAttempted >= 1 && m.accuracy < 65);

  // Spaced repetition breakdown from real questions
  const qpList = Object.values(userProgress.questionProgress || {});
  const masteredCount = qpList.filter((q) => q.status === 'MASTERED' || q.correctCount >= 2).length;
  const inReviewCount = qpList.filter((q) => q.status === 'REVIEW' || q.status === 'RETRY').length;
  const mistakesCount = qpList.filter((q) => q.status === 'WRONG' || q.incorrectCount > 0).length;

  // Session comparisons
  const sessionHistory: ExamSessionRecord[] = userProgress.sessionHistory || [];
  const recentSessions = sessionHistory.slice(0, 8);

  // Compute accuracy comparison (recent attempts vs previous attempts)
  let recentAccuracy = accuracy;
  let previousAccuracy = accuracy;
  let accuracyDelta = 0;

  if (recentSessions.length >= 2) {
    const half = Math.ceil(recentSessions.length / 2);
    const recentBatch = recentSessions.slice(0, half);
    const prevBatch = recentSessions.slice(half);

    const rTot = recentBatch.reduce((sum, s) => sum + s.totalQuestions, 0);
    const rCorr = recentBatch.reduce((sum, s) => sum + s.correctAnswers, 0);
    recentAccuracy = rTot > 0 ? Math.round((rCorr / rTot) * 100) : 0;

    const pTot = prevBatch.reduce((sum, s) => sum + s.totalQuestions, 0);
    const pCorr = prevBatch.reduce((sum, s) => sum + s.correctAnswers, 0);
    previousAccuracy = pTot > 0 ? Math.round((pCorr / pTot) * 100) : 0;

    accuracyDelta = recentAccuracy - previousAccuracy;
  }

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      const clean = await resetUserProgressToBeginning(userProgress.userId);
      if (onResetProgress) onResetProgress(clean);
      setShowResetConfirm(false);
      onClose();
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[510] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden">
      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[530] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-[#0e101d] border-2 border-rose-500/60 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-rose-950/60 text-stone-200 space-y-5 relative"
          >
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-950/80 border border-rose-500/40">
                <AlertTriangle className="w-6 h-6 text-rose-400 animate-pulse" />
              </div>
              <h3 className="text-base sm:text-lg font-bold font-mono text-white tracking-wide">
                RESET ALL EXAM ARENA DATA?
              </h3>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-stone-300 font-sans">
              <p className="font-semibold text-rose-300">This will permanently remove:</p>
              <ul className="space-y-1.5 pl-2 text-stone-300 font-mono text-xs">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  Performance statistics
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  Attempt history
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  Achievements & Honors
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  XP and Level
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  Streak
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  Weak Areas
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  Practice history
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  Mock test history
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  Exam progress
                </li>
              </ul>
              <p className="text-[11px] text-stone-400 italic pt-1">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono text-xs font-bold transition-colors cursor-pointer min-h-[40px]"
              >
                [ CANCEL ]
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleConfirmReset}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-rose-950/50 flex items-center gap-2 cursor-pointer min-h-[40px]"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>{isResetting ? 'RESETTING...' : '[ RESET EVERYTHING ]'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="w-full max-w-3xl max-h-[90vh] bg-gradient-to-b from-[#090b14] via-[#101426] to-[#0a0d18] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col text-stone-200 my-auto">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold font-mono uppercase tracking-widest text-cyan-400">
                PERFORMANCE DASHBOARD
              </span>
              <p className="text-xs text-stone-400">Mastery Analytics & Previous Attempt Comparison</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowResetConfirm(true)}
              title="Reset all exam arena stats"
              className="p-2 rounded-xl bg-black/40 hover:bg-red-950/40 border border-stone-800 hover:border-red-500/40 text-stone-400 hover:text-red-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Stats</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-black/40 hover:bg-rose-950/50 border border-stone-800 text-stone-400 hover:text-rose-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex-shrink-0 flex items-center gap-2 pb-4 border-b border-stone-800/80 mb-5 text-xs font-mono">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300 font-bold'
                : 'bg-black/40 border-stone-800 text-stone-400 hover:text-white'
            }`}
          >
            Overview Metrics
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'comparison'
                ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300 font-bold'
                : 'bg-black/40 border-stone-800 text-stone-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Attempt-by-Attempt Comparison
          </button>
          <button
            onClick={() => setActiveTab('weaknesses')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'weaknesses'
                ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300 font-bold'
                : 'bg-black/40 border-stone-800 text-stone-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Weak Areas ({weakTopics.length})
          </button>
        </div>

        <div className="flex-grow flex-1 min-h-0 overflow-y-auto pr-1">
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
              <div className="p-4 rounded-2xl bg-black/50 border border-cyan-500/20">
                <span className="text-[10px] text-stone-400 uppercase">TOTAL SOLVED</span>
                <div className="text-2xl font-bold text-white mt-1">{totalAtt}</div>
                <span className="text-[10px] text-stone-500">{totalCorr} Correct</span>
              </div>
              <div className="p-4 rounded-2xl bg-black/50 border border-emerald-500/20">
                <span className="text-[10px] text-stone-400 uppercase">OVERALL ACCURACY</span>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{accuracy}%</div>
                <span className="text-[10px] text-stone-500">{totalAtt > 0 ? `${totalCorr}/${totalAtt}` : 'No attempts'}</span>
              </div>
              <div className="p-4 rounded-2xl bg-black/50 border border-amber-500/20">
                <span className="text-[10px] text-stone-400 uppercase">ACTIVE STREAK</span>
                <div className="text-2xl font-bold text-amber-400 mt-1 flex items-center justify-center gap-1">
                  <Flame className="w-5 h-5 fill-current" /> {userProgress.currentStreak}d
                </div>
                <span className="text-[10px] text-stone-500">{userProgress.coins} Coins</span>
              </div>
              <div className="p-4 rounded-2xl bg-black/50 border border-purple-500/20">
                <span className="text-[10px] text-stone-400 uppercase">CURRENT LEVEL</span>
                <div className="text-2xl font-bold text-purple-400 mt-1">LVL {userProgress.level}</div>
                <span className="text-[10px] text-stone-500">{userProgress.totalXP} Total XP</span>
              </div>
            </div>

            {/* Subject Breakdown Bars (Real Attempt Data) */}
            <div className="p-5 rounded-2xl bg-black/40 border border-stone-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold font-mono text-stone-300 uppercase tracking-wider">
                  REAL SUBJECT ACCURACY BREAKDOWN
                </h3>
                <span className="text-[10px] font-mono text-stone-500">Live question attempt telemetry</span>
              </div>

              <div className="space-y-3.5 font-mono text-xs">
                {[
                  { id: 'reasoning' as ExamSubject, label: 'General Intelligence & Reasoning', color: 'bg-cyan-500' },
                  { id: 'general_awareness' as ExamSubject, label: 'General Awareness (GK/GS)', color: 'bg-amber-500' },
                  { id: 'english_language' as ExamSubject, label: 'English Language & Vocab', color: 'bg-pink-500' },
                ].map((sub) => {
                  const data = subjectMasteries[sub.id];
                  const subAcc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;

                  return (
                    <div key={sub.id} className="space-y-1.5">
                      <div className="flex justify-between text-stone-300">
                        <span>{sub.label}</span>
                        <span className="font-bold text-white">
                          {data.total > 0 ? `${subAcc}% (${data.correct}/${data.total})` : '0% (0 attempted)'}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-stone-800 overflow-hidden">
                        <div
                          className={`h-full ${sub.color} rounded-full transition-all duration-500`}
                          style={{ width: `${subAcc}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Spaced Repetition Mastery Bucket Status */}
            <div className="p-5 rounded-2xl bg-black/40 border border-stone-800 space-y-3">
              <h3 className="text-xs font-bold font-mono text-stone-300 uppercase tracking-wider">
                QUESTION RETENTION STATUS
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center font-mono text-xs">
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 uppercase">MASTERED (2x+)</span>
                  <div className="text-xl font-bold text-emerald-300 mt-1">{masteredCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30">
                  <span className="text-[10px] text-amber-400 uppercase">IN REVIEW / RETRY</span>
                  <div className="text-xl font-bold text-amber-300 mt-1">{inReviewCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30">
                  <span className="text-[10px] text-rose-400 uppercase">WRONG / MISTAKES</span>
                  <div className="text-xl font-bold text-rose-300 mt-1">{mistakesCount}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Comparison (Recent Attempts vs Previous Attempts) */}
        {activeTab === 'comparison' && (
          <div className="space-y-6">
            {/* Comparative trajectory banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-indigo-950/40 border border-cyan-500/30 space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase">
                  <TrendingUp className="w-4 h-4" />
                  <span>ATTEMPT PROGRESSION & ACCURACY TRAJECTORY</span>
                </div>
                {accuracyDelta !== 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                      accuracyDelta > 0
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {accuracyDelta > 0 ? (
                      <>
                        <TrendingUp className="w-3 h-3" /> +{accuracyDelta}% Improvement
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-3 h-3" /> {accuracyDelta}% vs previous attempts
                      </>
                    )}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="p-3 rounded-xl bg-black/50 border border-stone-800 text-center">
                  <span className="text-[10px] text-stone-400 uppercase">EARLIER ATTEMPTS BASELINE</span>
                  <div className="text-xl font-bold text-stone-300 mt-1">
                    {sessionHistory.length >= 2 ? `${previousAccuracy}%` : `${accuracy}%`}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-black/50 border border-cyan-500/30 text-center">
                  <span className="text-[10px] text-cyan-400 uppercase">RECENT ATTEMPTS ACCURACY</span>
                  <div className="text-xl font-bold text-cyan-300 mt-1">
                    {sessionHistory.length >= 2 ? `${recentAccuracy}%` : `${accuracy}%`}
                  </div>
                </div>
              </div>
            </div>

            {/* Session Attempt History Log */}
            <div className="p-5 rounded-2xl bg-black/40 border border-stone-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-300 uppercase tracking-wider">
                  PREVIOUS SESSIONS & ATTEMPT RECORDS
                </h3>
                <span className="text-[10px] text-stone-500">{sessionHistory.length} Sessions Logged</span>
              </div>

              {sessionHistory.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin">
                  {sessionHistory.map((sess, idx) => (
                    <div
                      key={sess.id || idx}
                      className="p-3 rounded-xl bg-black/60 border border-stone-800/80 flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{sess.modeLabel || sess.mode}</span>
                          <span className="text-[10px] font-normal text-stone-500">
                            {new Date(sess.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-400">
                          {sess.correctAnswers}/{sess.totalQuestions} Correct • {sess.timeSpentSeconds}s
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-bold ${
                            sess.accuracy >= 70
                              ? 'text-emerald-400'
                              : sess.accuracy >= 50
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {sess.accuracy}%
                        </span>
                        <div className="text-[10px] text-purple-300 font-bold">+{sess.xpEarned} XP</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-black/30 border border-dashed border-stone-800 text-center text-stone-500">
                  <History className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p>No completed session batches yet.</p>
                  <p className="text-[10px] text-stone-600 mt-1">
                    Play Reasoning Battle, Speed Rush, or CBT Simulator to log comparative session records!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Weak Areas */}
        {activeTab === 'weaknesses' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-black/60 border border-rose-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400 font-bold font-mono text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>IDENTIFIED WEAK TOPICS (&lt;65% ACCURACY)</span>
                </div>
                <span className="text-[10px] font-mono text-stone-400">
                  {weakTopics.length} Topics Flagged
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {weakTopics.length > 0 ? (
                  weakTopics.map((wt, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-black/60 border border-stone-800 flex items-center justify-between font-mono"
                    >
                      <span className="text-stone-200">{wt.topic}</span>
                      <span className="text-rose-400 font-bold">
                        {wt.accuracy}% ({wt.totalCorrect}/{wt.totalAttempted})
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-5 rounded-xl bg-black/40 border border-stone-800 text-stone-400 col-span-2 text-center font-mono">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                    No critical weakness flagged! Keep practicing across all subjects.
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  onClose();
                  onStartWeakPractice();
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>PRACTICE MY WEAK AREAS NOW</span>
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
