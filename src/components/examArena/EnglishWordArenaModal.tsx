import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Sparkles,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  X,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ExamQuestion, ExamUserProgress } from '../../types/examArena';
import { QuestionSessionEngine, PreparedQuestion } from '../../services/examEngine';
import { examAudio } from '../../utils/examAudio';

interface EnglishWordArenaModalProps {
  questions: ExamQuestion[];
  userProgress: ExamUserProgress;
  onSaveProgress: (updated: ExamUserProgress) => void;
  onClose: () => void;
}

type EnglishSubMode =
  | 'all'
  | 'synonyms'
  | 'antonyms'
  | 'one_word'
  | 'idioms'
  | 'errors'
  | 'spelling';

const ENGLISH_MODES: { id: EnglishSubMode; label: string; topicFilter?: string }[] = [
  { id: 'all', label: 'All Mixed English' },
  { id: 'synonyms', label: 'Synonym Sprint', topicFilter: 'Synonyms' },
  { id: 'antonyms', label: 'Antonym Arena', topicFilter: 'Antonyms' },
  { id: 'one_word', label: 'One Word Substitution', topicFilter: 'One Word Substitution' },
  { id: 'idioms', label: 'Idiom & Phrases', topicFilter: 'Idioms & Phrases' },
  { id: 'errors', label: 'Spotting Errors', topicFilter: 'Spotting Errors' },
  { id: 'spelling', label: 'Spelling Challenge', topicFilter: 'Spelling Challenge' },
];

export const EnglishWordArenaModal: React.FC<EnglishWordArenaModalProps> = ({
  questions,
  userProgress,
  onSaveProgress,
  onClose,
}) => {
  const [activeSubMode, setActiveSubMode] = useState<EnglishSubMode>('all');
  const [sessionQuestions, setSessionQuestions] = useState<PreparedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [streak, setStreak] = useState(1);
  const [score, setScore] = useState(0);
  const [isMuted, setIsMuted] = useState(examAudio.getMuted());
  const [isFinished, setIsFinished] = useState(false);

  // Initialize session
  useEffect(() => {
    let pool = questions.filter((q) => q.subject === 'english_language');
    const selectedModeObj = ENGLISH_MODES.find((m) => m.id === activeSubMode);

    if (selectedModeObj?.topicFilter) {
      const match = pool.filter((q) => q.topic.toLowerCase() === selectedModeObj.topicFilter?.toLowerCase());
      if (match.length > 0) pool = match;
    }

    const session = QuestionSessionEngine.createSession(pool, { count: 8 });
    setSessionQuestions(session);
    setCurrentIndex(0);
    setSelectedIndex(null);
    setIsAnswered(false);
    setIsFinished(false);
  }, [activeSubMode, questions]);

  const currentQ = sessionQuestions[currentIndex];

  const [correctCount, setCorrectCount] = useState(0);

  const handleSelectOption = (optIdx: number) => {
    if (isAnswered || !currentQ) return;
    setSelectedIndex(optIdx);
    setIsAnswered(true);

    const isCorrect = optIdx === currentQ.shuffledCorrectIndex;
    if (isCorrect) {
      setStreak((prev) => prev + 1);
      setScore((prev) => prev + 100 * streak);
      setCorrectCount((prev) => prev + 1);
      examAudio.playCorrect(streak);
    } else {
      setStreak(1);
      examAudio.playWrong();
    }

    const updated = QuestionSessionEngine.recordAnswer(
      userProgress,
      currentQ,
      isCorrect,
      8,
      streak
    );
    onSaveProgress(updated);
  };

  const handleNext = () => {
    if (currentIndex + 1 < sessionQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedIndex(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      examAudio.playFanfare();

      const baseProgress: ExamUserProgress = {
        ...userProgress,
        englishArenaStats: {
          gamesPlayed: (userProgress.englishArenaStats?.gamesPlayed || 0) + 1,
          wordsMastered: (userProgress.englishArenaStats?.wordsMastered || 0) + correctCount,
        },
      };

      const withSession = QuestionSessionEngine.recordSessionHistory(baseProgress, {
        mode: 'english_arena',
        modeLabel: 'English Word Arena',
        totalQuestions: sessionQuestions.length,
        correctAnswers: correctCount,
        timeSpentSeconds: sessionQuestions.length * 8,
        xpEarned: correctCount * 10,
      });

      onSaveProgress(withSession);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    examAudio.setMuted(next);
  };

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[510] bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-hidden" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] bg-gradient-to-b from-[#140816] via-[#200c22] to-[#100612] border border-pink-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col text-stone-200 my-auto">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-pink-500/20 pb-3 sm:pb-4 mb-3 sm:mb-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-pink-950/80 border border-pink-500/50 flex items-center justify-center text-pink-400 flex-shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs font-bold font-mono uppercase tracking-widest text-pink-400 truncate block">
                ENGLISH WORD ARENA
              </span>
              <p className="text-[10px] sm:text-xs text-stone-400 truncate">Vocabulary & Grammar Mastery</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              onClick={toggleMute}
              className="p-2 sm:p-2.5 rounded-xl bg-black/40 border border-pink-500/20 text-stone-400 hover:text-white min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-pink-400" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-xl bg-black/40 hover:bg-rose-950/50 border border-stone-800 text-stone-400 hover:text-rose-300 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex-shrink-0 flex gap-2 overflow-x-auto pb-2 mb-3 sm:mb-4 scrollbar-thin">
          {ENGLISH_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveSubMode(m.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-mono whitespace-nowrap transition-all cursor-pointer min-h-[36px] ${
                activeSubMode === m.id
                  ? 'bg-pink-500 text-black font-bold shadow-lg shadow-pink-500/25'
                  : 'bg-black/40 text-stone-400 hover:text-stone-200 border border-pink-500/20'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex-grow flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
          {!isFinished && currentQ ? (
            <div className="space-y-3 sm:space-y-4">
              {/* Stats */}
              <div className="flex items-center justify-between text-xs font-mono bg-black/50 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-pink-500/20">
                <span className="text-pink-300 text-[11px] sm:text-xs truncate">{currentQ.topic}</span>
                <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 text-[11px] sm:text-xs">
                  <span className="flex items-center gap-1 text-amber-300">
                    <Flame className="w-3.5 h-3.5" /> STREAK ×{streak}
                  </span>
                  <span className="text-stone-400">
                    {currentIndex + 1}/{sessionQuestions.length}
                  </span>
                </div>
              </div>

              {/* Question Box */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-black/60 border border-pink-500/30 space-y-2">
                <h3 className="text-sm sm:text-base md:text-lg font-serif italic text-white leading-relaxed">
                  {currentQ.question}
                </h3>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {currentQ.shuffledOptions.map((opt, idx) => {
                  const isChosen = selectedIndex === idx;
                  const isCorrect = idx === currentQ.shuffledCorrectIndex;

                  let style = 'bg-black/50 hover:bg-pink-950/40 border-pink-500/20 text-stone-200';
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
                      className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-start gap-2.5 sm:gap-3 min-h-[44px] cursor-pointer ${style}`}
                    >
                      <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-black/60 border border-pink-500/30 flex items-center justify-center text-[10px] sm:text-xs font-mono font-bold text-pink-300 flex-shrink-0 mt-0.5">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 leading-relaxed">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Instant Pedagogical Breakdown */}
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-pink-950/40 border border-pink-500/40 text-xs space-y-1.5"
                >
                  <div className="flex items-center gap-2 text-pink-300 font-bold font-mono text-[11px] sm:text-xs">
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    <span>PEDAGOGICAL INSIGHT</span>
                  </div>
                  <p className="text-stone-200 leading-relaxed text-[11px] sm:text-xs">{currentQ.explanation}</p>
                  {currentQ.keyFact && (
                    <p className="text-pink-300/90 font-mono text-[10px] sm:text-[11px] pt-0.5">
                      💡 <strong>EXAM TIP:</strong> {currentQ.keyFact}
                    </p>
                  )}
                </motion.div>
              )}

              {isAnswered && (
                <button
                  onClick={handleNext}
                  className="w-full py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-mono font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 min-h-[44px] cursor-pointer"
                >
                  <span>{currentIndex + 1 < sessionQuestions.length ? 'NEXT QUESTION' : 'FINISH WORD SPRINT'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="py-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-pink-500/20 border border-pink-500/50 flex items-center justify-center mx-auto text-pink-300">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-bold font-mono text-white">WORD SPRINT COMPLETED!</h3>
                <p className="text-xs text-stone-400 font-sans">
                  You reinforced your English comprehension & vocabulary.
                </p>
              </div>

              <button
                onClick={onClose}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-mono font-bold text-xs uppercase tracking-widest min-h-[44px] cursor-pointer"
              >
                RETURN TO EXAM ARENA
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
