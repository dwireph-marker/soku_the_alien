import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Compass,
  Landmark,
  Globe2,
  Scale,
  Coins,
  FlaskConical,
  Newspaper,
  CheckCircle2,
  Lock,
  Play,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { ExamQuestion, ExamUserProgress } from '../../types/examArena';
import { QuestionSessionEngine, PreparedQuestion } from '../../services/examEngine';
import { examAudio } from '../../utils/examAudio';

interface IndiaQuestMapProps {
  questions: ExamQuestion[];
  userProgress: ExamUserProgress;
  onSaveProgress: (updated: ExamUserProgress) => void;
  onClose: () => void;
}

interface QuestStage {
  id: string;
  title: string;
  topicTag: string;
  icon: React.ElementType;
  description: string;
  color: string;
  border: string;
}

const QUEST_STAGES: QuestStage[] = [
  {
    id: 'stage_history',
    title: 'Indian History & Heritage',
    topicTag: 'Indian History',
    icon: Landmark,
    description: 'Ancient Indus, Maurya, Gupta empires, Delhi Sultanate & the Freedom Movement of 1857-1947.',
    color: 'from-amber-950/60 to-yellow-950/40',
    border: 'border-amber-500/40 text-amber-300',
  },
  {
    id: 'stage_geography',
    title: 'Physical & Indian Geography',
    topicTag: 'Indian Geography',
    icon: Globe2,
    description: 'Himalayan topography, Peninsular river basins, Monsoons, National Parks & Biosphere Reserves.',
    color: 'from-emerald-950/60 to-teal-950/40',
    border: 'border-emerald-500/40 text-emerald-300',
  },
  {
    id: 'stage_polity',
    title: 'Constitution & Indian Polity',
    topicTag: 'Indian Polity',
    icon: Scale,
    description: 'Articles, Fundamental Rights, Writs, Parliament, Judiciary & landmark Constitutional Amendments.',
    color: 'from-blue-950/60 to-indigo-950/40',
    border: 'border-blue-500/40 text-blue-300',
  },
  {
    id: 'stage_economy',
    title: 'Indian Economy & Banking',
    topicTag: 'Indian Economy',
    icon: Coins,
    description: 'RBI Monetary policy, Repo rates, Union Budget, GST, Inflation indices & Economic growth.',
    color: 'from-yellow-950/60 to-orange-950/40',
    border: 'border-yellow-500/40 text-yellow-300',
  },
  {
    id: 'stage_science',
    title: 'General Science & Biology',
    topicTag: 'General Science',
    icon: FlaskConical,
    description: 'Physics fundamentals, chemical reactions, human anatomy, vitamins, diseases & ISRO space technology.',
    color: 'from-purple-950/60 to-pink-950/40',
    border: 'border-purple-500/40 text-purple-300',
  },
  {
    id: 'stage_current_affairs',
    title: 'Current Affairs & National Events',
    topicTag: 'Current Affairs',
    icon: Newspaper,
    description: 'Recent government initiatives, official PIB developments, international summits & sports champions.',
    color: 'from-rose-950/60 to-red-950/40',
    border: 'border-rose-500/40 text-rose-300',
  },
];

export const IndiaQuestMap: React.FC<IndiaQuestMapProps> = ({
  questions,
  userProgress,
  onSaveProgress,
  onClose,
}) => {
  const [activePlayingStage, setActivePlayingStage] = useState<QuestStage | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<PreparedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [stageScore, setStageScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const completed = userProgress.indiaQuestProgress?.completedStages || [];

  const handleStartStage = (stage: QuestStage) => {
    examAudio.playClick();
    const filtered = questions.filter(
      (q) =>
        q.subject === 'general_awareness' &&
        q.topic.toLowerCase().includes(stage.topicTag.toLowerCase())
    );
    const pool = filtered.length > 0 ? filtered : questions.filter((q) => q.subject === 'general_awareness');
    const session = QuestionSessionEngine.createSession(pool, { count: 5 });

    setSessionQuestions(session);
    setActivePlayingStage(stage);
    setCurrentIndex(0);
    setSelectedIndex(null);
    setIsAnswered(false);
    setStageScore(0);
    setIsCompleted(false);
  };

  const currentQ = sessionQuestions[currentIndex];

  const handleSelectOption = (optIdx: number) => {
    if (isAnswered || !currentQ) return;
    setSelectedIndex(optIdx);
    setIsAnswered(true);

    const isCorrect = optIdx === currentQ.shuffledCorrectIndex;
    if (isCorrect) {
      setStageScore((prev) => prev + 1);
      examAudio.playCorrect();
    } else {
      examAudio.playWrong();
    }

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
    if (currentIndex + 1 < sessionQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedIndex(null);
      setIsAnswered(false);
    } else {
      setIsCompleted(true);
      examAudio.playFanfare();

      // If passed (>=3 out of 5), mark stage completed
      if (stageScore + (selectedIndex === currentQ?.shuffledCorrectIndex ? 1 : 0) >= 3 && activePlayingStage) {
        const nextCompleted = Array.from(new Set([...completed, activePlayingStage.id]));
        const updatedProgress: ExamUserProgress = {
          ...userProgress,
          indiaQuestProgress: {
            ...userProgress.indiaQuestProgress,
            completedStages: nextCompleted,
          },
        };
        onSaveProgress(updatedProgress);
      }
    }
  };

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activePlayingStage) setActivePlayingStage(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePlayingStage, onClose]);

  return (
    <div className="fixed inset-0 z-[510] bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-hidden" role="dialog" aria-modal="true">
      <div className="w-full max-w-4xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] bg-gradient-to-b from-[#0b0c16] via-[#121528] to-[#0a0d1a] border border-amber-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col text-stone-200 my-auto">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-amber-500/20 pb-3 sm:pb-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-[11px] sm:text-xs font-bold font-mono uppercase tracking-widest text-amber-400 truncate">
                  INDIA QUEST // GK WORLD
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[9px] sm:text-[10px] font-mono text-amber-300">
                  {completed.length}/{QUEST_STAGES.length} UNLOCKED
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-stone-400 truncate">Interactive General Awareness Roadmap</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (activePlayingStage) setActivePlayingStage(null);
              else onClose();
            }}
            className="p-2 sm:p-2.5 rounded-xl bg-black/40 hover:bg-rose-950/50 border border-stone-800 hover:border-rose-500/40 text-stone-400 hover:text-rose-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!activePlayingStage ? (
          /* Map View */
          <div className="flex-grow flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-1 scrollbar-thin space-y-6">
            <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/20 text-xs text-stone-300 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span>
                Master key General Awareness pillars for SSC Stenographer. Complete each stage with 60%+ score to advance, or directly practice any topic anytime!
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {QUEST_STAGES.map((stage, idx) => {
                const isCleared = completed.includes(stage.id);
                const IconComponent = stage.icon;

                return (
                  <motion.div
                    key={stage.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`p-5 rounded-2xl bg-gradient-to-b ${stage.color} border ${stage.border} relative overflow-hidden flex flex-col justify-between group shadow-lg transition-all`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-black/50 border border-current flex items-center justify-center">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        {isCleared ? (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
                            <CheckCircle2 className="w-3 h-3" /> CLEARED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-black/50 border border-stone-700 text-stone-400 text-[10px] font-mono">
                            STAGE {idx + 1}
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-white group-hover:text-amber-200 transition-colors">
                          {stage.title}
                        </h4>
                        <p className="text-[11px] text-stone-300/80 leading-relaxed mt-1">
                          {stage.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 mt-2">
                      <button
                        onClick={() => handleStartStage(stage)}
                        className="w-full py-2.5 rounded-xl bg-black/60 hover:bg-amber-500 hover:text-black border border-current text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>PRACTICE STAGE</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : !isCompleted && currentQ ? (
          /* Active Stage Question */
          <div className="flex-grow flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-1 scrollbar-thin space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-amber-300 bg-black/40 p-3 rounded-2xl border border-amber-500/20">
              <span>{activePlayingStage.title}</span>
              <span>QUESTION {currentIndex + 1}/{sessionQuestions.length}</span>
            </div>

            <div className="p-5 rounded-2xl bg-black/60 border border-amber-500/30 space-y-2">
              <h3 className="text-base sm:text-lg font-medium text-white leading-relaxed">
                {currentQ.question}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQ.shuffledOptions.map((opt, idx) => {
                const isChosen = selectedIndex === idx;
                const isCorrect = idx === currentQ.shuffledCorrectIndex;

                let style = 'bg-black/50 hover:bg-amber-950/40 border-amber-500/20 text-stone-200';
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
                    <span className="w-6 h-6 rounded-lg bg-black/60 border border-amber-500/30 flex items-center justify-center text-xs font-mono font-bold text-amber-300 flex-shrink-0">
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
                className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs space-y-1"
              >
                <p className="text-stone-200">{currentQ.explanation}</p>
                {currentQ.keyFact && (
                  <p className="text-amber-300 font-mono text-[11px] pt-1">
                    💡 <strong>EXAM NOTE:</strong> {currentQ.keyFact}
                  </p>
                )}
              </motion.div>
            )}

            {isAnswered && (
              <button
                onClick={handleNext}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <span>{currentIndex + 1 < sessionQuestions.length ? 'NEXT QUESTION' : 'COMPLETE STAGE'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          /* Stage Completion */
          <div className="py-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center mx-auto text-amber-300">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-bold font-mono text-white">STAGE TRIAL COMPLETED!</h3>
              <p className="text-xs text-stone-400 font-sans">
                You scored {stageScore} out of {sessionQuestions.length} in {activePlayingStage?.title}.
              </p>
            </div>

            <button
              onClick={() => setActivePlayingStage(null)}
              className="px-8 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase tracking-widest transition-all"
            >
              BACK TO INDIA QUEST MAP
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
