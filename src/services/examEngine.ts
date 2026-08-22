import {
  ExamQuestion,
  ExamSubject,
  QuestionDifficulty,
  ExamUserProgress,
  UserQuestionProgress,
  TopicMastery,
} from '../types/examArena';
import { defaultExamQuestions } from '../data/examQuestionsData';

export interface PreparedQuestion extends ExamQuestion {
  originalQuestionId: string;
  shuffledOptions: string[];
  shuffledCorrectIndex: number;
}

export interface SessionConfig {
  subject?: ExamSubject | 'all';
  topic?: string;
  subtopic?: string;
  difficulty?: QuestionDifficulty | 'adaptive';
  count?: number;
  mode?:
    | 'reasoning_battle'
    | 'india_quest'
    | 'speed_rush'
    | 'word_arena'
    | 'daily_challenge'
    | 'smart_practice'
    | 'revision'
    | 'real_exam'
    | 'pyq';
  specificQuestionIds?: string[];
  userProgress?: ExamUserProgress;
}

export class QuestionSessionEngine {
  /**
   * Fisher-Yates Shuffle implementation
   */
  private static shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Shuffle options of a single question and update the correctAnswer index
   */
  public static prepareQuestion(q: ExamQuestion): PreparedQuestion {
    const originalOptions = q.options;
    const correctVal = originalOptions[q.correctAnswer];

    // Create array of option objects with original values
    const optionObjs = originalOptions.map((opt) => ({
      text: opt,
      isCorrect: opt === correctVal,
    }));

    const shuffled = this.shuffle(optionObjs);
    const newCorrectIndex = shuffled.findIndex((o) => o.isCorrect);

    return {
      ...q,
      originalQuestionId: q.id,
      shuffledOptions: shuffled.map((o) => o.text),
      shuffledCorrectIndex: newCorrectIndex !== -1 ? newCorrectIndex : 0,
    };
  }

  /**
   * Create an automatic, non-repeating, smart-adaptive question session
   */
  public static createSession(
    allQuestions: ExamQuestion[] = defaultExamQuestions,
    config: SessionConfig = {}
  ): PreparedQuestion[] {
    const {
      subject,
      topic,
      difficulty,
      count = 10,
      mode = 'smart_practice',
      specificQuestionIds,
      userProgress,
    } = config;

    // 1. If explicit question IDs provided (e.g. Daily challenge or specific PYQ paper)
    if (specificQuestionIds && specificQuestionIds.length > 0) {
      const selected = allQuestions.filter((q) => specificQuestionIds.includes(q.id));
      const shuffled = this.shuffle(selected).slice(0, count);
      return shuffled.map((q) => this.prepareQuestion(q));
    }

    // 2. Filter questions by subject / topic
    let pool = allQuestions.filter((q) => q.verified !== false);

    if (subject && subject !== 'all') {
      pool = pool.filter((q) => q.subject === subject);
    }

    if (topic) {
      pool = pool.filter((q) => q.topic.toLowerCase() === topic.toLowerCase());
    }

    // 3. Mode-specific smart selection
    if (mode === 'revision' && userProgress) {
      // Prioritize previously wrong questions or questions in 'WRONG' / 'REVIEW' status
      const wrongIds = Object.keys(userProgress.questionProgress).filter((id) => {
        const p = userProgress.questionProgress[id];
        return p.status === 'WRONG' || p.status === 'REVIEW' || p.incorrectCount > 0;
      });

      if (wrongIds.length > 0) {
        const wrongQuestions = pool.filter((q) => wrongIds.includes(q.id));
        if (wrongQuestions.length >= count) {
          return this.shuffle(wrongQuestions)
            .slice(0, count)
            .map((q) => this.prepareQuestion(q));
        }
      }
    }

    // 4. Adaptive Difficulty Filter
    if (difficulty && difficulty !== 'adaptive') {
      const diffMatch = pool.filter((q) => q.difficulty === difficulty);
      if (diffMatch.length >= count) {
        pool = diffMatch;
      }
    }

    // 5. Freshness weighting: separate into unseen vs seen
    const seenIds = userProgress ? Object.keys(userProgress.questionProgress) : [];
    const unseen = pool.filter((q) => !seenIds.includes(q.id));
    const seen = pool.filter((q) => seenIds.includes(q.id));

    // Combine with 70% unseen preference if available
    const targetUnseenCount = Math.min(unseen.length, Math.ceil(count * 0.7));
    const targetSeenCount = count - targetUnseenCount;

    const chosenUnseen = this.shuffle(unseen).slice(0, targetUnseenCount);
    const chosenSeen = this.shuffle(seen).slice(0, targetSeenCount);

    let finalSelection = [...chosenUnseen, ...chosenSeen];

    // Fallback if pool was smaller than count
    if (finalSelection.length < count) {
      const remainingNeeded = count - finalSelection.length;
      const leftovers = pool.filter((q) => !finalSelection.some((s) => s.id === q.id));
      finalSelection = [...finalSelection, ...this.shuffle(leftovers).slice(0, remainingNeeded)];
    }

    // If still less, use full pool shuffled
    if (finalSelection.length === 0) {
      finalSelection = this.shuffle(allQuestions).slice(0, count);
    }

    return this.shuffle(finalSelection).map((q) => this.prepareQuestion(q));
  }

  /**
   * Calculate updated User Progress after a question answer
   */
  public static recordAnswer(
    progress: ExamUserProgress,
    question: ExamQuestion,
    isCorrect: boolean,
    timeTakenSeconds: number,
    combo = 1
  ): ExamUserProgress {
    const questionId = question.id;
    const now = new Date().toISOString();

    const existingQP: UserQuestionProgress = progress.questionProgress[questionId] || {
      questionId,
      status: 'NEW',
      attemptsCount: 0,
      correctCount: 0,
      incorrectCount: 0,
    };

    // Update Question Spaced Repetition status
    let nextStatus: UserQuestionProgress['status'] = existingQP.status;
    if (isCorrect) {
      if (existingQP.status === 'WRONG' || existingQP.status === 'REVIEW') {
        nextStatus = 'RETRY';
      } else if (existingQP.correctCount >= 2) {
        nextStatus = 'MASTERED';
      } else {
        nextStatus = 'REVIEW';
      }
    } else {
      nextStatus = 'WRONG';
    }

    const updatedQP: UserQuestionProgress = {
      ...existingQP,
      status: nextStatus,
      attemptsCount: existingQP.attemptsCount + 1,
      correctCount: existingQP.correctCount + (isCorrect ? 1 : 0),
      incorrectCount: existingQP.incorrectCount + (isCorrect ? 0 : 1),
      lastAttemptedAt: now,
      averageTimeSeconds: existingQP.averageTimeSeconds
        ? Math.round((existingQP.averageTimeSeconds + timeTakenSeconds) / 2)
        : timeTakenSeconds,
    };

    // Calculate XP gained
    const baseXP = isCorrect ? 10 : 2;
    const comboBonus = isCorrect ? Math.min(15, (combo - 1) * 3) : 0;
    const difficultyBonus =
      question.difficulty === 'hard' || question.difficulty === 'exam_level' ? 5 : 0;
    const xpGained = baseXP + comboBonus + difficultyBonus;

    const newTotalXP = progress.totalXP + xpGained;
    const newLevel = Math.floor(Math.sqrt(newTotalXP / 80)) + 1;

    // Update Topic Mastery
    const topicKey = `${question.subject}__${question.topic}`;
    const existingMastery: TopicMastery = progress.topicMasteries[topicKey] || {
      subject: question.subject,
      topic: question.topic,
      totalAttempted: 0,
      totalCorrect: 0,
      accuracy: 0,
      masteryLevel: 'weak',
    };

    const newAtt = existingMastery.totalAttempted + 1;
    const newCorr = existingMastery.totalCorrect + (isCorrect ? 1 : 0);
    const newAcc = Math.round((newCorr / newAtt) * 100);

    let newLevelMastery: TopicMastery['masteryLevel'] = 'weak';
    if (newAcc >= 85 && newAtt >= 5) newLevelMastery = 'mastered';
    else if (newAcc >= 70) newLevelMastery = 'strong';
    else if (newAcc >= 50) newLevelMastery = 'moderate';

    const updatedMastery: TopicMastery = {
      ...existingMastery,
      totalAttempted: newAtt,
      totalCorrect: newCorr,
      accuracy: newAcc,
      masteryLevel: newLevelMastery,
    };

    // Dynamic Achievement Checker
    const unlocked = [...(progress.unlockedAchievements || [])];
    const checkAndUnlock = (achId: string) => {
      if (!unlocked.includes(achId)) {
        unlocked.push(achId);
      }
    };

    const newTotalSolved = progress.totalQuestionsSolved + 1;
    if (newTotalSolved >= 10) checkAndUnlock('ach_first_steps');
    if (newTotalSolved >= 100) checkAndUnlock('ach_century');
    if (progress.currentStreak >= 7) checkAndUnlock('ach_streak_7');
    if (progress.currentStreak >= 30) checkAndUnlock('ach_streak_30');
    if (combo >= 10) checkAndUnlock('ach_reasoning_master');

    return {
      ...progress,
      totalXP: newTotalXP,
      level: newLevel,
      coins: progress.coins + (isCorrect ? 2 : 0),
      totalQuestionsSolved: newTotalSolved,
      totalCorrect: progress.totalCorrect + (isCorrect ? 1 : 0),
      totalTimeSpentSeconds: progress.totalTimeSpentSeconds + timeTakenSeconds,
      questionProgress: {
        ...progress.questionProgress,
        [questionId]: updatedQP,
      },
      topicMasteries: {
        ...progress.topicMasteries,
        [topicKey]: updatedMastery,
      },
      unlockedAchievements: unlocked,
    };
  }

  /**
   * Record a completed batch or practice session for historical performance comparison
   */
  public static recordSessionHistory(
    progress: ExamUserProgress,
    session: {
      mode: string;
      modeLabel: string;
      totalQuestions: number;
      correctAnswers: number;
      timeSpentSeconds: number;
      xpEarned: number;
    }
  ): ExamUserProgress {
    const accuracy =
      session.totalQuestions > 0
        ? Math.round((session.correctAnswers / session.totalQuestions) * 100)
        : 0;

    const record = {
      id: 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      mode: session.mode,
      modeLabel: session.modeLabel,
      totalQuestions: session.totalQuestions,
      correctAnswers: session.correctAnswers,
      accuracy,
      timeSpentSeconds: session.timeSpentSeconds,
      xpEarned: session.xpEarned,
    };

    const existingHistory = progress.sessionHistory || [];
    // Keep up to latest 50 sessions
    const updatedHistory = [record, ...existingHistory].slice(0, 50);

    return {
      ...progress,
      sessionHistory: updatedHistory,
    };
  }

  /**
   * Smart Weakness Detector
   */
  public static analyzeWeakAreas(progress: ExamUserProgress): {
    weakTopics: TopicMastery[];
    recommendedCount: { subject: ExamSubject; count: number; title: string }[];
    totalRecommendedTimeMinutes: number;
  } {
    const masteries = Object.values(progress.topicMasteries);
    const weak = masteries
      .filter((m) => m.totalAttempted >= 2 && m.accuracy < 65)
      .sort((a, b) => a.accuracy - b.accuracy);

    const recommendedCount = [
      { subject: 'reasoning' as ExamSubject, count: 10, title: 'General Intelligence & Reasoning' },
      { subject: 'general_awareness' as ExamSubject, count: 15, title: 'General Awareness & Science' },
      { subject: 'english_language' as ExamSubject, count: 15, title: 'English Language & Vocab' },
    ];

    return {
      weakTopics: weak,
      recommendedCount,
      totalRecommendedTimeMinutes: 25,
    };
  }
}
