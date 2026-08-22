export type ExamType = 'SSC_STENOGRAPHER' | 'HIGH_COURT_STENO' | 'DRDO_STENO' | 'RRB_STENO' | 'CUSTOM';

export type ExamSubject =
  | 'reasoning'
  | 'general_awareness'
  | 'english_language';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard' | 'exam_level';

export type QuestionSourceType =
  | 'OFFICIAL_PYQ'
  | 'CURATED_PRACTICE'
  | 'CURRENT_AFFAIRS'
  | 'AI_GENERATED_VERIFIED'
  | 'MOCK_QUESTION';

export type SpacedRepetitionStatus = 'NEW' | 'WRONG' | 'REVIEW' | 'RETRY' | 'MASTERED';

export interface ExamQuestion {
  id: string;
  exam: ExamType;
  subject: ExamSubject;
  topic: string;
  subtopic?: string;
  difficulty: QuestionDifficulty;
  question: string;
  options: string[];
  correctAnswer: number; // 0-indexed index of correct option
  explanation: string;
  keyFact?: string;
  commonTrap?: string;
  sourceType: QuestionSourceType;
  sourceExam?: string;
  year?: number;
  shift?: string;
  tags?: string[];
  verified: boolean;
  verifiedBy?: string;
  lastReviewedDate?: string;
  usageCount?: number;
  accuracyRate?: number;
}

export type PaperType = 'OFFICIAL' | 'VERIFIED_PYQ' | 'MEMORY_BASED' | 'PRACTICE';
export type PaperStatus = 'VERIFIED' | 'UNVERIFIED' | 'PENDING_REVIEW';
export type ExamGrade = 'GRADE_C' | 'GRADE_D' | 'GRADE_C_AND_D';

export interface ExamPaper {
  id: string;
  title: string;
  exam: ExamType;
  year: number;
  shift?: string;
  grade?: ExamGrade;
  date?: string;
  totalQuestions: number;
  durationMinutes: number;
  difficulty?: 'Easy' | 'Moderate' | 'Hard';
  paperType?: PaperType;
  status?: PaperStatus;
  verified: boolean;
  verifiedBy?: string;
  verifiedDate?: string;
  source: string;
  sourceUrl?: string;
  publishedAt?: string;
  attemptCount?: number;
  sections: {
    subject: ExamSubject;
    questionIds: string[];
  }[];
}

export interface PaperAttemptRecord {
  paperId: string;
  completed: boolean;
  score: number;
  totalQuestions: number;
  accuracy: number;
  timeTakenSeconds: number;
  lastAttemptedAt: string;
  mode: 'ORIGINAL' | 'RANDOMIZED';
  answers?: Record<string, number>;
}

export interface CurrentAffairsItem {
  id: string;
  headline: string;
  summary: string;
  date: string;
  category: 'POLITY_GOVERNANCE' | 'ECONOMY_BANKING' | 'SCIENCE_TECH_SPACE' | 'SUMMITS_AWARDS' | 'SPORTS' | 'DEFENCE_SECURITY' | 'ENVIRONMENT';
  sourceName: string;
  sourceUrl?: string;
  verified: boolean;
  relatedQuestionIds?: string[];
}

export interface UserQuestionProgress {
  questionId: string;
  status: SpacedRepetitionStatus;
  attemptsCount: number;
  correctCount: number;
  incorrectCount: number;
  lastAttemptedAt?: string;
  nextReviewDate?: string;
  averageTimeSeconds?: number;
  markedForReview?: boolean;
}

export interface TopicMastery {
  subject: ExamSubject;
  topic: string;
  totalAttempted: number;
  totalCorrect: number;
  accuracy: number;
  masteryLevel: 'weak' | 'moderate' | 'strong' | 'mastered';
}

export interface ExamSessionRecord {
  id: string;
  timestamp: string; // ISO string
  mode: string;
  modeLabel: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  timeSpentSeconds: number;
  xpEarned: number;
}

export interface ExamUserProgress {
  userId: string;
  totalXP: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  coins: number;
  totalQuestionsSolved: number;
  totalCorrect: number;
  totalTimeSpentSeconds: number;
  
  // Game mode stats
  reasoningBattleStats: {
    gamesPlayed: number;
    highestCombo: number;
    highestScore: number;
  };
  gkSpeedRushStats: {
    gamesPlayed: number;
    bestQPM: number;
    highestScore: number;
  };
  indiaQuestProgress: {
    completedStages: string[];
    currentStageId: string;
  };
  englishArenaStats: {
    gamesPlayed: number;
    wordsMastered: number;
  };
  
  // Spaced repetition & questions
  questionProgress: Record<string, UserQuestionProgress>;
  topicMasteries: Record<string, TopicMastery>;
  
  // Historical session and attempt batches for performance comparison
  sessionHistory?: ExamSessionRecord[];

  // Paper completions & progress
  paperAttempts?: Record<string, PaperAttemptRecord>;

  // Mock tests
  mockTestScores: {
    mockId: string;
    date: string;
    score: number;
    totalMarks: number;
    accuracy: number;
    timeTakenSeconds: number;
    percentile?: number;
  }[];
  
  // Achievements
  unlockedAchievements: string[];
}

export interface ExamAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'STREAK' | 'MASTERY' | 'SPEED' | 'MILESTONE' | 'MOCK_TEST';
  xpReward: number;
  unlockedAt?: string;
}

export interface DailyChallenge {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
  targetAccuracy: number;
  rewardXP: number;
  rewardCoins: number;
  questionIds: string[];
}

export interface ExamConfig {
  examName: string;
  examCode: ExamType;
  officialNotificationReference: string;
  durationMinutes: number;
  totalMarks: number;
  negativeMarkingRatio: number; // e.g. 0.25
  sections: {
    id: ExamSubject;
    title: string;
    totalQuestions: number;
    marksPerQuestion: number;
  }[];
  passingCriteriaNotes: string;
}
