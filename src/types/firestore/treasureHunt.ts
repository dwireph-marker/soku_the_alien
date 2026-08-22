export type HuntDifficulty = 'easy' | 'medium' | 'hard' | 'classified';
export type EvidenceType = 'document' | 'photograph' | 'cipher' | 'audio_log' | 'cctv_frame' | 'keycard' | 'receipt' | 'blueprint';
export type SuspectStatus = 'SUSPECT' | 'CLEARED' | 'PERSON OF INTEREST' | 'WITNESS';
export type CCTVStatus = 'ONLINE' | 'INTERFERENCE' | 'RECORDING' | 'OFFLINE';

export type HuntGameState = 'idle' | 'loading' | 'active' | 'paused' | 'completed' | 'expired' | 'error';
export type DetectiveTab = 'dossier' | 'blueprint' | 'cctv' | 'evidence' | 'terminal' | 'suspects' | 'safe';

export interface BlueprintRoom {
  id: string;
  name: string;
  code: string;
  x: number; // Percentage 0-100 on grid
  y: number; // Percentage 0-100 on grid
  width: number;
  height: number;
  description: string;
  securityLevel: 'LOW' | 'MED' | 'HIGH' | 'MAXIMUM' | 'CLASSIFIED';
  statusText?: string;
  lastAccessTime?: string;
  authorizedPersonnelCount?: number;
  evidenceCount?: number;
  colorStatus?: 'cyan' | 'amber' | 'red' | 'gray';
  isInvestigated?: boolean;
  clueRevealed?: string;
  evidenceIdToUnlock?: string;
  hasCamera?: boolean;
  cameraId?: string;
  isRedHerring?: boolean;
}

export interface CCTVTimelineEvent {
  time: string;
  label: string;
  description: string;
  isAnomaly?: boolean;
  clueRevealed?: string;
  evidenceToUnlock?: string;
  observationNote?: string;
}

export interface CCTVCamera {
  id: string;
  cameraNumber: string;
  name: string;
  location: string;
  videoUrl?: string;
  posterUrl?: string;
  status: CCTVStatus;
  timestamp: string;
  anomalyTimestamp: string;
  anomalyDescription: string;
  clueRevealed: string;
  feedType?: 'cctv_scan' | 'static' | 'night_vision' | 'thermal';
  timelineEvents?: CCTVTimelineEvent[];
  observationToAdd?: {
    id: string;
    title: string;
    description: string;
    codeFragment?: string;
  };
}

export interface EvidenceItem {
  id: string;
  title: string;
  type: EvidenceType;
  iconName: string;
  description: string;
  content: string;
  mediaUrl?: string;
  isCrucial: boolean;
  source?: string;
  timestamp?: string;
  location?: string;
  observation?: string;
  relatedSuspectId?: string;
  relatedRoomId?: string;
  codeFragment?: string;
  codeDigit?: string;
  digitPosition?: 1 | 2 | 3 | 4;
  connectedClueId?: string; // If player links this to another evidence card
  linkMatchMessage?: string;
  unlockedAtStart?: boolean;
}

export interface CharacterProfile {
  id: string;
  name: string;
  role: string;
  accessLevel?: string;
  badgeId?: string;
  motive?: string;
  avatarUrl?: string;
  lastSeenTime: string;
  lastSeenLocation: string;
  alibi?: string;
  status: SuspectStatus;
  statement: string;
  timeline: string[];
  isLying: boolean;
  lieIndicator: string; // The truth that reveals they are lying
  contradictionEvidenceId?: string;
  contradictionExplanation?: string;
  revealsClue?: string;
  revealedDigit?: string;
  codeDigit?: string;
  digitPosition?: 1 | 2 | 3 | 4;
}

export interface TerminalLog {
  id: string;
  command: string;
  output: string;
  description: string;
  isEncrypted?: boolean;
  decryptionKey?: string;
  unlockedByCommand?: string;
  category?: 'scan' | 'logs' | 'search' | 'decrypt' | 'status';
  revealsDigit?: string;
  clueRevealed?: string;
}

export interface FinalTreasureConfig {
  type: 'photo' | 'video' | 'message' | 'birthday_letter';
  title: string;
  message: string;
  mediaUrl?: string;
  specialLoveNote?: string;
  rewardBadge: string;
}

export interface TreasureHuntTemplate {
  id: string;
  codeName: string;
  title: string;
  scenario: string;
  location: string;
  clearanceLevel: string;
  timeLimitMinutes: number;
  incidentTimeWindow?: string;
  primaryObjective?: string;
  missionObjectives?: string[];
  storyTwist?: string;
  difficulty: HuntDifficulty;
  enabled: boolean;
  playCount: number;
  rooms: BlueprintRoom[];
  cctvCameras: CCTVCamera[];
  evidenceCards: EvidenceItem[];
  characters: CharacterProfile[];
  terminalLogs: TerminalLog[];
  puzzleFlow: string[];
  finalSafePrompt: string;
  finalSafeHints: string[];
  solutionCodeFormula: string;
  defaultCode: string;
  finalTreasure: FinalTreasureConfig;
  createdAt?: string;
  updatedAt?: string;
}

export interface TreasureHuntInstance {
  instanceId: string;
  templateId: string;
  codeName: string;
  title: string;
  startedAt: number; // Unix timestamp in ms
  expiresAt: number; // Unix timestamp in ms
  startTime?: number; // Backward compatibility
  timeLimitSeconds: number;
  status: HuntGameState;
  currentTab?: DetectiveTab;
  generatedCode?: string; // Optional obfuscated/fallback solution
  codeHash: string; // Cryptographic hash for secure validation
  cluesFound: string[];
  evidenceCollected: string[];
  evidenceLinked: Array<[string, string]>;
  investigatedRooms: string[];
  inspectedCharacters: string[];
  inspectedCCTVCams: string[];
  terminalCommandsRun: string[];
  observationsRecorded?: string[];
  contradictionsFound?: string[];
  decryptedFragments?: string[];
  activeObjective: string;
  hintsUsed: number;
  maxHints: number;
  completedAt?: number;
  solveDurationSeconds?: number;
  templateSnapshot?: Partial<TreasureHuntTemplate>;
  rating?: number;
}

export interface TreasureHuntGlobalSettings {
  enabled: boolean;
  gameName: string;
  defaultTimeLimit: number;
  difficulty: HuntDifficulty;
  hintsEnabled: boolean;
  maxHints: number;
  ambientAudioEnabled: boolean;
  soundFxEnabled: boolean;
}

export interface TreasureHuntStats {
  totalPlays: number;
  completed: number;
  abandoned: number;
  averageSolveTimeSeconds: number;
  averageHintsUsed: number;
  hardestPuzzle: string;
  mostPlayedHunt: string;
}
