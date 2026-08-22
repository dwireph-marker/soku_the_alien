import { CurrentAffairsItem, ExamAchievement, ExamConfig } from '../types/examArena';

export const defaultCurrentAffairs: CurrentAffairsItem[] = [
  {
    id: 'ca_2026_01',
    headline: 'ISRO advances Gaganyaan crew module high-altitude abort and life-support tests',
    summary: 'The Indian Space Research Organisation (ISRO) successfully conducted crucial qualification tests for the Environmental Control and Life Support System (ECLSS) and parachutes for the upcoming uncrewed Gaganyaan orbital mission.',
    date: '2026-07-24',
    category: 'SCIENCE_TECH_SPACE',
    sourceName: 'Press Information Bureau (PIB) / ISRO Official Bulletin',
    sourceUrl: 'https://pib.gov.in',
    verified: true,
    relatedQuestionIds: ['q_ga_007'],
  },
  {
    id: 'ca_2026_02',
    headline: 'Reserve Bank of India Monetary Policy Committee maintains Repo Rate at 6.50%',
    summary: 'The RBI MPC decided unanimously to keep the policy Repo Rate unchanged to align headline retail inflation steadily towards the 4% target while sustaining durable domestic economic growth.',
    date: '2026-06-18',
    category: 'ECONOMY_BANKING',
    sourceName: 'RBI Official Monetary Policy Release',
    verified: true,
    relatedQuestionIds: ['q_ga_005'],
  },
  {
    id: 'ca_2026_03',
    headline: 'Supreme Court of India affirms Digital Access and Subordinate Court Modernization',
    summary: 'The Supreme Court issued nationwide directives under e-Courts Phase III mandates, standardizing digital audio recording, real-time stenographic transcribing systems, and paperless court registry protocols across district judiciaries.',
    date: '2026-05-10',
    category: 'POLITY_GOVERNANCE',
    sourceName: 'Supreme Court of India Official Judgments Portal',
    verified: true,
  },
  {
    id: 'ca_2026_04',
    headline: 'India achieves historic Medal Tally in Asian Games & World Athletics Contests',
    summary: 'Indian athletes secured record podium finishes in Javelin, Steeplechase, Shooting, and Archery championships, setting new national records ahead of upcoming international Olympic qualifying fixtures.',
    date: '2026-04-02',
    category: 'SPORTS',
    sourceName: 'Ministry of Youth Affairs & Sports (MYAS)',
    verified: true,
  },
];

export const defaultAchievements: ExamAchievement[] = [
  {
    id: 'ach_first_steps',
    title: 'First Step to Grade C',
    description: 'Solve your first 10 questions in the Exam Arena.',
    icon: '🎯',
    category: 'MILESTONE',
    xpReward: 50,
  },
  {
    id: 'ach_century',
    title: 'Century Marksman',
    description: 'Solve 100 questions across all subjects.',
    icon: '💯',
    category: 'MILESTONE',
    xpReward: 200,
  },
  {
    id: 'ach_streak_7',
    title: '7-Day Discipline Warrior',
    description: 'Maintain a 7-day continuous study streak.',
    icon: '🔥',
    category: 'STREAK',
    xpReward: 350,
  },
  {
    id: 'ach_streak_30',
    title: 'Monthly Iron Will',
    description: 'Maintain a 30-day continuous study streak.',
    icon: '👑',
    category: 'STREAK',
    xpReward: 1000,
  },
  {
    id: 'ach_reasoning_master',
    title: 'Reasoning Grandmaster',
    description: 'Achieve a 10x combo in Reasoning Battle.',
    icon: '🧠',
    category: 'MASTERY',
    xpReward: 300,
  },
  {
    id: 'ach_gk_explorer',
    title: 'Bharat Explorer',
    description: 'Clear all stages of the India Quest GK World.',
    icon: '🇮🇳',
    category: 'MASTERY',
    xpReward: 400,
  },
  {
    id: 'ach_speed_demon',
    title: '60s Lightning Steno',
    description: 'Score 15+ correct answers in GK Speed Rush.',
    icon: '⚡',
    category: 'SPEED',
    xpReward: 250,
  },
  {
    id: 'ach_vocab_virtuoso',
    title: 'Vocabulary Virtuoso',
    description: 'Master 50 English words in Word Arena.',
    icon: '📖',
    category: 'MASTERY',
    xpReward: 300,
  },
  {
    id: 'ach_mock_ace',
    title: 'CBT Simulator Ace',
    description: 'Complete a full Real Exam Mock Test with 85%+ accuracy.',
    icon: '🏆',
    category: 'MOCK_TEST',
    xpReward: 500,
  },
];

export const defaultExamConfig: ExamConfig = {
  examName: 'SSC Stenographer Grade C & Grade D Examination',
  examCode: 'SSC_STENOGRAPHER',
  officialNotificationReference: 'Staff Selection Commission (SSC) Official Scheme of Examination',
  durationMinutes: 120, // 2 Hours (160 mins for eligible scribe candidates)
  totalMarks: 200,
  negativeMarkingRatio: 0.25, // 0.25 marks deducted per wrong answer (1/4 or 1/3 as configured)
  sections: [
    {
      id: 'reasoning',
      title: 'General Intelligence & Reasoning',
      totalQuestions: 50,
      marksPerQuestion: 1,
    },
    {
      id: 'general_awareness',
      title: 'General Awareness',
      totalQuestions: 50,
      marksPerQuestion: 1,
    },
    {
      id: 'english_language',
      title: 'English Language & Comprehension',
      totalQuestions: 100,
      marksPerQuestion: 1,
    },
  ],
  passingCriteriaNotes: 'CBT Computer Based Examination followed by Stenography Skill Test in Hindi / English on computer.',
};
