import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  Terminal,
  MapPin,
  Camera,
  FileText,
  UserCheck,
  Lock,
  Clock,
  Volume2,
  VolumeX,
  LogOut,
  RotateCcw,
  Sparkles,
  HelpCircle,
  FolderLock,
  ChevronRight,
  Menu,
  X,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  TreasureHuntTemplate,
  TreasureHuntInstance,
  TreasureHuntGlobalSettings,
  HuntGameState,
  DetectiveTab,
} from '../../types/firestore/treasureHunt';
import {
  getTreasureHuntTemplates,
  getTreasureHuntSettings,
  recordHuntPlay,
  recordHuntCompletion,
  saveHuntInstance,
} from '../../services/firestore/treasureHunt.service';
import {
  initializeOrRestoreHunt,
  createNewHuntInstance,
  selectNextTemplate,
  getElapsedSeconds,
  clearActiveInstance,
} from '../../utils/huntGenerator';
import { detectiveAudio } from '../../utils/detectiveAudio';
import { videoManager } from '../../utils/videoManager';

import { CaseDossierTab } from './CaseDossierTab';
import { BlueprintMapTab } from './BlueprintMapTab';
import { CCTVMonitorTab } from './CCTVMonitorTab';
import { EvidenceBoardTab } from './EvidenceBoardTab';
import { TerminalTab } from './TerminalTab';
import { SuspectsTab } from './SuspectsTab';
import { DigitalSafeTab } from './DigitalSafeTab';
import { FinalTreasureModal } from './FinalTreasureModal';

interface DetectiveGameViewProps {
  onExitGame: () => void;
}

export const DetectiveGameView: React.FC<DetectiveGameViewProps> = ({ onExitGame }) => {
  const [gameState, setGameState] = useState<HuntGameState>('loading');
  const [templates, setTemplates] = useState<TreasureHuntTemplate[]>([]);
  const [settings, setSettings] = useState<TreasureHuntGlobalSettings | null>(null);
  const [instance, setInstance] = useState<TreasureHuntInstance | null>(null);
  const [activeTab, setActiveTab] = useState<DetectiveTab>('dossier');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showNewHuntConfirm, setShowNewHuntConfirm] = useState(false);
  const [showFinalModal, setShowFinalModal] = useState(false);
  const [activeCameraId, setActiveCameraId] = useState<string | undefined>();
  const [mobileTabsOpen, setMobileTabsOpen] = useState(false);
  const isInitializedRef = useRef(false);

  // Load templates & initialize/restore instance
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    async function init() {
      try {
        setGameState('loading');
        const [tList, s] = await Promise.all([
          getTreasureHuntTemplates(),
          getTreasureHuntSettings(),
        ]);
        setTemplates(tList);
        setSettings(s);

        const { instance: activeInst } = await initializeOrRestoreHunt(tList, false);
        setInstance(activeInst);
        setActiveTab(activeInst.currentTab || 'dossier');

        const elapsed = getElapsedSeconds(activeInst);
        setElapsedSeconds(elapsed);

        if (activeInst.status === 'completed') {
          setGameState('completed');
          setShowFinalModal(true);
        } else {
          activeInst.status = 'active';
          setGameState('active');
          recordHuntPlay(activeInst.templateId);
        }

        // Start ambient audio
        if (s.ambientAudioEnabled !== false) {
          detectiveAudio.startAmbient();
        }
      } catch (err) {
        console.error('Failed to initialize hunt:', err);
        setGameState('error');
      }
    }

    init();

    return () => {
      detectiveAudio.stopAmbient();
      videoManager.pauseAll();
    };
  }, []);

  // Synchronized investigation duration timer (unlimited time, no expiration)
  useEffect(() => {
    if (!instance || gameState !== 'active') return;

    const timer = setInterval(() => {
      const elapsed = getElapsedSeconds(instance);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [instance?.startedAt, instance?.startTime, gameState]);

  const activeTemplate =
    templates.find((t) => t.id === instance?.templateId) ||
    (instance?.templateSnapshot as TreasureHuntTemplate) ||
    templates[0];

  const handleToggleMute = () => {
    const next = !isAudioMuted;
    setIsAudioMuted(next);
    detectiveAudio.setMuted(next);
  };

  const handleSelectTab = (tab: DetectiveTab) => {
    detectiveAudio.playKeyClick();
    videoManager.pauseAll();
    setActiveTab(tab);
    setMobileTabsOpen(false);

    if (instance) {
      const updated: TreasureHuntInstance = {
        ...instance,
        currentTab: tab,
      };
      setInstance(updated);
      saveHuntInstance(updated);
    }
  };

  const handleInvestigateRoom = (roomId: string) => {
    if (!instance || !activeTemplate) return;
    const room = activeTemplate.rooms?.find((r) => r.id === roomId);
    if (!room) return;

    const clues = [...instance.cluesFound];
    if (room.clueRevealed && !clues.includes(room.clueRevealed)) {
      clues.push(`[${room.code}] ${room.clueRevealed}`);
    }

    const evidence = [...instance.evidenceCollected];
    if (room.evidenceIdToUnlock && !evidence.includes(room.evidenceIdToUnlock)) {
      evidence.push(room.evidenceIdToUnlock);
    }

    const updated: TreasureHuntInstance = {
      ...instance,
      investigatedRooms: Array.from(new Set([...instance.investigatedRooms, roomId])),
      cluesFound: clues,
      evidenceCollected: evidence,
    };
    setInstance(updated);
    saveHuntInstance(updated);
  };

  const handleInspectCamera = (cameraId: string) => {
    if (!instance || !activeTemplate) return;
    const cam = activeTemplate.cctvCameras?.find((c) => c.id === cameraId);
    if (!cam) return;

    const clues = [...instance.cluesFound];
    if (cam.clueRevealed && !clues.includes(cam.clueRevealed)) {
      clues.push(`[${cam.cameraNumber}] ${cam.clueRevealed}`);
    }

    const updated: TreasureHuntInstance = {
      ...instance,
      inspectedCCTVCams: Array.from(new Set([...instance.inspectedCCTVCams, cameraId])),
      cluesFound: clues,
    };
    setInstance(updated);
    saveHuntInstance(updated);
  };

  const handleLinkEvidence = (id1: string, id2: string, msg: string) => {
    if (!instance) return;
    const updated: TreasureHuntInstance = {
      ...instance,
      evidenceLinked: [...instance.evidenceLinked, [id1, id2]],
      cluesFound: [...instance.cluesFound, msg],
    };
    setInstance(updated);
    saveHuntInstance(updated);
  };

  const handleCollectEvidence = (id: string) => {
    if (!instance) return;
    const updated: TreasureHuntInstance = {
      ...instance,
      evidenceCollected: Array.from(new Set([...instance.evidenceCollected, id])),
    };
    setInstance(updated);
    saveHuntInstance(updated);
  };

  const handleExecuteCommand = (cmd: string, output: string) => {
    if (!instance) return;
    const updated: TreasureHuntInstance = {
      ...instance,
      terminalCommandsRun: [...instance.terminalCommandsRun, cmd],
      cluesFound: [...instance.cluesFound, `[TERMINAL] Executed "${cmd}" successfully.`],
    };
    setInstance(updated);
    saveHuntInstance(updated);
  };

  const handleInspectCharacter = (charId: string) => {
    if (!instance || !activeTemplate) return;
    const char = activeTemplate.characters?.find((c) => c.id === charId);
    if (!char) return;

    const clues = [...instance.cluesFound];
    if (char.revealsClue && !clues.includes(char.revealsClue)) {
      clues.push(`[WITNESS] ${char.name}: ${char.revealsClue}`);
    }

    const updated: TreasureHuntInstance = {
      ...instance,
      inspectedCharacters: Array.from(new Set([...instance.inspectedCharacters, charId])),
      cluesFound: clues,
    };
    setInstance(updated);
    saveHuntInstance(updated);
  };

  const handleAddClue = (clue: string) => {
    if (!instance) return;
    const clues = instance.cluesFound.includes(clue)
      ? instance.cluesFound
      : [...instance.cluesFound, clue];
    const updated: TreasureHuntInstance = {
      ...instance,
      cluesFound: clues,
    };
    setInstance(updated);
    saveHuntInstance(updated);
  };

  const handleUseHint = () => {
    if (!instance) return;
    const updated: TreasureHuntInstance = {
      ...instance,
      hintsUsed: instance.hintsUsed + 1,
    };
    setInstance(updated);
    saveHuntInstance(updated);
  };

  const handleSuccessUnlock = () => {
    if (!instance || !activeTemplate) return;
    const solveSecs = Math.round((Date.now() - (instance.startedAt || instance.startTime || Date.now())) / 1000);
    const updated: TreasureHuntInstance = {
      ...instance,
      status: 'completed',
      completedAt: Date.now(),
      solveDurationSeconds: solveSecs,
    };
    setInstance(updated);
    setGameState('completed');
    saveHuntInstance(updated);
    setShowFinalModal(true);

    recordHuntCompletion({
      huntId: activeTemplate.id,
      solveDurationSeconds: solveSecs,
      hintsUsed: instance.hintsUsed,
    });
  };

  const handleStartNewHunt = () => {
    setShowNewHuntConfirm(false);
    clearActiveInstance();
    videoManager.pauseAll();

    const nextTemplate = selectNextTemplate(templates, activeTemplate?.id);
    const newInst = createNewHuntInstance(nextTemplate);

    setInstance(newInst);
    setElapsedSeconds(0);
    setActiveTab('dossier');
    setGameState('active');
    setShowFinalModal(false);

    recordHuntPlay(newInst.templateId);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (gameState === 'loading' || !instance || !activeTemplate) {
    return (
      <div className="fixed inset-0 z-50 bg-[#020712] text-cyan-400 font-mono flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.3)]">
            <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold tracking-widest text-cyan-300 uppercase">
              DECRYPTING CLASSIFIED MISSION DOSSIER...
            </p>
            <p className="text-xs text-stone-500">Establishing secure link with central archives</p>
          </div>
        </div>
      </div>
    );
  }

  const tabsList = [
    { id: 'dossier', label: 'Case Briefing', icon: FolderLock },
    { id: 'blueprint', label: 'Blueprint Map', icon: MapPin },
    { id: 'cctv', label: 'CCTV Feeds', icon: Camera },
    { id: 'evidence', label: 'Evidence Board', icon: FileText },
    { id: 'terminal', label: 'Terminal CLI', icon: Terminal },
    { id: 'suspects', label: 'Suspects', icon: UserCheck },
    { id: 'safe', label: 'Digital Safe', icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-[#020813] text-stone-200 font-mono flex flex-col relative selection:bg-cyan-500 selection:text-black">
      {/* Background Ambience & Scanline Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(#00f0ff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.4)_51%)] bg-[length:100%_4px] pointer-events-none opacity-40 z-30" />

      {/* TOP CLASSIFIED HUD BAR */}
      <header className="sticky top-0 z-40 bg-[#020712]/95 border-b border-cyan-500/30 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Case ID & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest truncate">
                  {activeTemplate.codeName}
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-bold">
                  EYES ONLY
                </span>
              </div>
              <p className="text-[11px] text-stone-400 truncate hidden sm:block">
                {activeTemplate.title}
              </p>
            </div>
          </div>

          {/* Center: Mission Duration / Untimed */}
          <div className="flex items-center gap-2 bg-black/80 px-3 py-1.5 rounded-xl border border-cyan-500/30 text-xs text-cyan-300 shadow-inner">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-sm text-white">{formatTimer(elapsedSeconds)}</span>
            <span className="text-[10px] text-cyan-400/70 hidden sm:inline">
              ELAPSED
            </span>
          </div>

          {/* Right: Sound, Restart, Exit Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMute}
              className="p-2 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 transition-colors"
              title={isAudioMuted ? 'Unmute Game Sounds' : 'Mute Game Sounds'}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-stone-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>

            <button
              onClick={() => setShowNewHuntConfirm(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-colors"
              title="Generate a completely different mystery case"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>NEW MISSION</span>
            </button>

            <button
              onClick={() => setShowExitConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-xs font-bold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">EXIT MISSION</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileTabsOpen((p) => !p)}
              className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 sm:hidden"
            >
              {mobileTabsOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS BAR (DESKTOP) */}
      <div className="bg-[#030d1d] border-b border-cyan-500/20 px-4 sm:px-6 hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-2">
          {tabsList.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id as DetectiveTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                    : 'bg-black/40 text-stone-300 border-cyan-500/20 hover:border-cyan-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MOBILE TABS DRAWER */}
      <AnimatePresence>
        {mobileTabsOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden bg-[#030d1d] border-b border-cyan-500/30 p-3 space-y-1.5 z-30"
          >
            {tabsList.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectTab(tab.id as DetectiveTab)}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between border ${
                    isActive
                      ? 'bg-cyan-500 text-black border-cyan-400'
                      : 'bg-black/50 text-stone-300 border-cyan-500/20'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN GAME CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 relative z-10">
        {activeTab === 'dossier' && (
          <CaseDossierTab
            template={activeTemplate}
            instance={instance}
            onNavigateTab={(tabId) => handleSelectTab(tabId as DetectiveTab)}
          />
        )}

        {activeTab === 'blueprint' && (
          <BlueprintMapTab
            template={activeTemplate}
            instance={instance}
            onInvestigateRoom={handleInvestigateRoom}
            onNavigateToCCTV={(camId) => {
              setActiveCameraId(camId);
              handleSelectTab('cctv');
            }}
          />
        )}

        {activeTab === 'cctv' && (
          <CCTVMonitorTab
            template={activeTemplate}
            instance={instance}
            onInspectCamera={handleInspectCamera}
            onCollectEvidence={handleCollectEvidence}
            onAddClue={handleAddClue}
            activeCameraId={activeCameraId}
          />
        )}

        {activeTab === 'evidence' && (
          <EvidenceBoardTab
            template={activeTemplate}
            instance={instance}
            onLinkEvidence={handleLinkEvidence}
            onCollectEvidence={handleCollectEvidence}
          />
        )}

        {activeTab === 'terminal' && (
          <TerminalTab
            template={activeTemplate}
            instance={instance}
            onExecuteCommand={handleExecuteCommand}
            onAddClue={handleAddClue}
          />
        )}

        {activeTab === 'suspects' && (
          <SuspectsTab
            template={activeTemplate}
            instance={instance}
            onInspectCharacter={handleInspectCharacter}
            onAddClue={handleAddClue}
          />
        )}

        {activeTab === 'safe' && (
          <DigitalSafeTab
            template={activeTemplate}
            instance={instance}
            onSuccessUnlock={handleSuccessUnlock}
            onUseHint={handleUseHint}
          />
        )}
      </main>

      {/* FOOTER BAR */}
      <footer className="py-2.5 px-4 bg-[#020712] border-t border-cyan-500/20 text-center text-[10px] text-cyan-400/60 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CLASSIFIED INVESTIGATION PROTOCOL // AGENT CLEARANCE VERIFIED</span>
          <span>AUTOSAVE ACTIVE • INSTANCE ID: {instance.instanceId}</span>
        </div>
      </footer>

      {/* FINAL TREASURE & REVEAL MODAL */}
      <AnimatePresence>
        {showFinalModal && (
          <FinalTreasureModal
            template={activeTemplate}
            instance={instance}
            onRestartNewHunt={handleStartNewHunt}
            onReturnToBirthdaySite={onExitGame}
          />
        )}
      </AnimatePresence>

      {/* EXIT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#030d1d] border-2 border-cyan-500/50 rounded-2xl max-w-sm w-full p-6 text-stone-200 shadow-2xl space-y-4 text-center font-mono"
            >
              <h3 className="text-base font-bold text-white uppercase">EXIT INVESTIGATION?</h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Leave this investigation? Your current clues, investigated rooms, and unlocked evidence are securely saved and will restore when you return.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 font-bold text-xs"
                >
                  STAY IN MISSION
                </button>
                <button
                  onClick={() => {
                    setShowExitConfirm(false);
                    onExitGame();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                >
                  EXIT GAME
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RESTART / NEW MISSION MODAL */}
      <AnimatePresence>
        {showNewHuntConfirm && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#030d1d] border-2 border-cyan-500/50 rounded-2xl max-w-sm w-full p-6 text-stone-200 shadow-2xl space-y-4 text-center font-mono"
            >
              <h3 className="text-base font-bold text-white uppercase">COMMENCE NEW MYSTERY?</h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                This will generate a completely different investigation case from the classified case pool, with unique rooms, suspects, CCTV feeds, and passcode.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowNewHuntConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 font-bold text-xs"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleStartNewHunt}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-bold text-xs shadow-lg"
                >
                  START NEW CASE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
