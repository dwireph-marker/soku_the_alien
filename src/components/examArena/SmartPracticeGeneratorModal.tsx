import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Target,
  Sliders,
  Play,
  X,
  AlertCircle,
  Clock,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';
import { ExamQuestion, ExamUserProgress, QuestionDifficulty, ExamSubject } from '../../types/examArena';
import { QuestionSessionEngine, PreparedQuestion } from '../../services/examEngine';
import { examAudio } from '../../utils/examAudio';

interface SmartPracticeGeneratorModalProps {
  questions: ExamQuestion[];
  userProgress: ExamUserProgress;
  onSaveProgress: (updated: ExamUserProgress) => void;
  onClose: () => void;
}

export const SmartPracticeGeneratorModal: React.FC<SmartPracticeGeneratorModalProps> = ({
  questions,
  userProgress,
  onSaveProgress,
  onClose,
}) => {
  const [tab, setTab] = useState<'smart' | 'custom_mock'>('smart');
  const [activeSession, setActiveSession] = useState<PreparedQuestion[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Custom mock configurations
  const [customDiff, setCustomDiff] = useState<QuestionDifficulty | 'adaptive'>('exam_level');
  const [customCount, setCustomCount] = useState<number>(25);
  const [customFocus, setCustomFocus] = useState<'balanced' | 'weak' | 'pyq' | 'random'>('weak');

  const weakAnalysis = QuestionSessionEngine.analyzeWeakAreas(userProgress);

  const handleStartSmartSession = () => {
    examAudio.playClick();
    const session = QuestionSessionEngine.createSession(questions, {
      count: 15,
      mode: 'smart_practice',
      userProgress,
    });
    setActiveSession(session);
    setCurrentIndex(0);
    setSelectedIndex(null);
    setIsAnswered(false);
    setIsFinished(false);
  };

  const handleStartCustomMock = () => {
    examAudio.playClick();
    let pool = [...questions];
    if (customFocus === 'pyq') {
      const pyqs = pool.filter((q) => q.sourceType === 'OFFICIAL_PYQ');
      if (pyqs.length > 0) pool = pyqs;
    }

    const session = QuestionSessionEngine.createSession(pool, {
      count: customCount,
      difficulty: customDiff,
      mode: customFocus === 'weak' ? 'revision' : 'smart_practice',
      userProgress,
    });
    setActiveSession(session);
    setCurrentIndex(0);
    setSelectedIndex(null);
    setIsAnswered(false);
    setIsFinished(false);
  };

  const currentQ = activeSession ? activeSession[currentIndex] : null;

  const handleSelectOption = (optIdx: number) => {
    if (isAnswered || !currentQ) return;
    setSelectedIndex(optIdx);
    setIsAnswered(true);

    const isCorrect = optIdx === currentQ.shuffledCorrectIndex;
    if (isCorrect) examAudio.playCorrect();
    else examAudio.playWrong();

    const updated = QuestionSessionEngine.recordAnswer(
      userProgress,
      currentQ,
      isCorrect,
      10,
      1
    );
    onSaveProgress(updated);
  };

  const handleNext = () => {
    if (!activeSession) return;
    if (currentIndex + 1 < activeSession.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedIndex(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      examAudio.playFanfare();
    }
  };

  return (
    <div className="fixed inset-0 z-[510] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-2xl max-h-[90vh] bg-gradient-to-b from-[#0e0918] via-[#1a102a] to-[#0d0714] border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col text-stone-200 my-auto">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-purple-500/20 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold font-mono uppercase tracking-widest text-purple-400">
                SMART ADAPTIVE PRACTICE ENGINE
              </span>
              <p className="text-xs text-stone-400">Targeted Sessions & Custom Mock Builder</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (activeSession) setActiveSession(null);
              else onClose();
            }}
            className="p-2 rounded-xl bg-black/40 hover:bg-rose-950/50 border border-stone-800 text-stone-400 hover:text-rose-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-grow flex-1 min-h-0 overflow-y-auto pr-1">
          {!activeSession ? (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-purple-500/20 pb-2">
              <button
                onClick={() => setTab('smart')}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                  tab === 'smart'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                    : 'bg-black/40 text-stone-400 hover:text-stone-200'
                }`}
              >
                🎯 WHAT SHOULD I PRACTICE?
              </button>
              <button
                onClick={() => setTab('custom_mock')}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                  tab === 'custom_mock'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                    : 'bg-black/40 text-stone-400 hover:text-stone-200'
                }`}
              >
                🤖 GENERATE MY MOCK
              </button>
            </div>

            {tab === 'smart' ? (
              /* Smart Practice Analyzer View */
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-black/50 border border-purple-500/30 space-y-3">
                  <h3 className="text-sm font-bold font-mono text-purple-300 uppercase flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                    IDENTIFIED AREAS NEEDING FOCUS
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {weakAnalysis.weakTopics.length > 0 ? (
                      weakAnalysis.weakTopics.map((wt, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-black/60 border border-stone-800 flex items-center justify-between"
                        >
                          <span className="text-stone-300 font-medium">{wt.topic}</span>
                          <span className="text-rose-400 font-mono font-bold">{wt.accuracy}% acc</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 rounded-xl bg-black/60 border border-stone-800 text-stone-400 col-span-2">
                        Good mastery detected! System recommends balanced revision across all three sections.
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-2 text-xs font-mono">
                  <div className="text-stone-300">
                    Recommended Session Structure: <strong>15 Questions (~12 mins)</strong>
                  </div>
                  <div className="flex flex-wrap gap-2 text-purple-300">
                    <span>• 5 Reasoning Logic</span>
                    <span>• 5 General Science / Geography</span>
                    <span>• 5 English Vocabulary</span>
                  </div>
                </div>

                <button
                  onClick={handleStartSmartSession}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-400 hover:to-rose-400 text-white font-mono font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>START PERSONALIZED SMART SESSION</span>
                </button>
              </div>
            ) : (
              /* Custom Mock Builder */
              <div className="space-y-4 text-xs font-mono">
                <div>
                  <label className="text-stone-400 uppercase block mb-2">Select Difficulty</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['easy', 'medium', 'hard', 'exam_level'] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setCustomDiff(d)}
                        className={`py-2 rounded-xl border text-center transition-all ${
                          customDiff === d
                            ? 'bg-purple-600 border-purple-400 text-white font-bold'
                            : 'bg-black/40 border-stone-800 text-stone-400'
                        }`}
                      >
                        {d.replace('_', ' ').toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-stone-400 uppercase block mb-2">Question Count</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 25, 50, 100].map((c) => (
                      <button
                        key={c}
                        onClick={() => setCustomCount(c)}
                        className={`py-2 rounded-xl border text-center transition-all ${
                          customCount === c
                            ? 'bg-purple-600 border-purple-400 text-white font-bold'
                            : 'bg-black/40 border-stone-800 text-stone-400'
                        }`}
                      >
                        {c} Questions
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-stone-400 uppercase block mb-2">Focus Strategy</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'balanced', label: 'Balanced' },
                      { id: 'weak', label: 'Weak Topics' },
                      { id: 'pyq', label: 'PYQ Heavy' },
                      { id: 'random', label: 'Random Mix' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setCustomFocus(f.id as any)}
                        className={`py-2 rounded-xl border text-center transition-all ${
                          customFocus === f.id
                            ? 'bg-purple-600 border-purple-400 text-white font-bold'
                            : 'bg-black/40 border-stone-800 text-stone-400'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleStartCustomMock}
                  className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs uppercase tracking-widest transition-all mt-4"
                >
                  GENERATE CUSTOM MOCK & BEGIN
                </button>
              </div>
            )}
          </div>
        ) : !isFinished && currentQ ? (
          /* Active Custom Session Question */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono bg-black/50 p-3 rounded-2xl border border-purple-500/20">
              <span className="text-purple-300 uppercase">
                [{currentQ.subject.replace('_', ' ')}] {currentQ.topic}
              </span>
              <span className="text-stone-400">
                {currentIndex + 1}/{activeSession.length}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-black/60 border border-purple-500/30 space-y-2">
              <h3 className="text-base sm:text-lg font-medium text-white leading-relaxed">
                {currentQ.question}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQ.shuffledOptions.map((opt, idx) => {
                const isChosen = selectedIndex === idx;
                const isCorrect = idx === currentQ.shuffledCorrectIndex;

                let style = 'bg-black/50 hover:bg-purple-950/40 border-purple-500/20 text-stone-200';
                if (isAnswered) {
                  if (isCorrect) style = 'bg-emerald-950/80 border-emerald-500 text-emerald-200';
                  else if (isChosen) style = 'bg-red-950/80 border-red-500 text-red-200';
                  else style = 'bg-black/30 border-stone-800 text-stone-500 opacity-50';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswered}
                    className={`p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-start gap-3 ${style}`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-black/60 border border-purple-500/30 flex items-center justify-center text-xs font-mono font-bold text-purple-300 flex-shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 mt-0.5 leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/40 text-xs space-y-1"
              >
                <p className="text-stone-200">{currentQ.explanation}</p>
              </motion.div>
            )}

            {isAnswered && (
              <button
                onClick={handleNext}
                className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs uppercase tracking-widest transition-all"
              >
                {currentIndex + 1 < activeSession.length ? 'NEXT QUESTION' : 'COMPLETE SESSION'}
              </button>
            )}
          </div>
        ) : (
          <div className="py-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-purple-500/20 border border-purple-500/50 flex items-center justify-center mx-auto text-purple-300">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-bold font-mono text-white">PRACTICE TRIAL FINISHED!</h3>
              <p className="text-xs text-stone-400 font-sans">
                Progress recorded to your mastery profile.
              </p>
            </div>

            <button
              onClick={() => setActiveSession(null)}
              className="px-8 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs uppercase tracking-widest cursor-pointer"
            >
              BACK TO PRACTICE SELECTOR
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
