import React from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  MapPin,
  Clock,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search,
  Key,
  FolderLock,
  ArrowRight,
  Sparkles,
  Compass,
  Camera,
  Layers,
  HelpCircle,
  Radio
} from 'lucide-react';
import { TreasureHuntTemplate, TreasureHuntInstance } from '../../types/firestore/treasureHunt';

interface CaseDossierTabProps {
  template: TreasureHuntTemplate;
  instance: TreasureHuntInstance;
  onNavigateTab: (tabId: string) => void;
  onOpenAssistant?: () => void;
}

export const CaseDossierTab: React.FC<CaseDossierTabProps> = ({
  template,
  instance,
  onNavigateTab,
  onOpenAssistant,
}) => {
  const completedRooms = instance.investigatedRooms.length;
  const totalRooms = template.rooms.length;
  const cctvReviewed = instance.inspectedCCTVCams.length;
  const totalCCTV = template.cctvCameras.length;
  const evidenceCollected = instance.evidenceCollected.length;
  const totalEvidence = template.evidenceCards.length;
  const suspectsInspected = instance.inspectedCharacters.length;
  const totalSuspects = template.characters.length;

  const objectivesList = template.missionObjectives || [
    'Inspect the facility blueprint & check room statuses',
    'Review CCTV surveillance feeds around incident window',
    'Record suspicious observations & collect physical evidence',
    'Cross-examine suspect alibis & locate statement contradictions',
    'Execute terminal diagnostics and decrypt cipher fragments',
    'Unlock the Digital Safe with the recovered 4-digit override code',
  ];

  // Dynamic status evaluation
  const isObj1Done = completedRooms >= 2;
  const isObj2Done = cctvReviewed >= 2;
  const isObj3Done = evidenceCollected >= 2;
  const isObj4Done = suspectsInspected >= 2 || (instance.contradictionsFound?.length ?? 0) > 0;
  const isObj5Done = instance.terminalCommandsRun.length > 0;
  const isObj6Done = instance.status === 'completed';

  const objectivesState = [isObj1Done, isObj2Done, isObj3Done, isObj4Done, isObj5Done, isObj6Done];

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-mono">
      {/* Top Classified Header Card */}
      <div className="bg-[#040f1f]/90 border border-cyan-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 p-4 pointer-events-none opacity-20 hidden sm:block">
          <FolderLock className="w-32 h-32 text-cyan-400" />
        </div>

        {/* Classified Stamp & Clearance */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold tracking-widest uppercase">
            <Flame className="w-3.5 h-3.5 text-red-400" />
            <span>{template.clearanceLevel || 'LEVEL 4 // TOP SECRET'}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>ACTIVE INVESTIGATION</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide uppercase">
          {template.codeName}: {template.title}
        </h1>

        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-cyan-300/80 mt-3 pt-3 border-t border-cyan-500/20">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            {template.location}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            TIME OF INCIDENT: <span className="text-amber-300 font-bold">{template.incidentTimeWindow || '03:07 – 03:19'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            DIFFICULTY: <span className="text-amber-400 font-bold uppercase">{template.difficulty}</span>
          </span>
        </div>
      </div>

      {/* Story Twist Announcement Banner if player made good progress */}
      {instance.cluesFound.length >= 3 && template.storyTwist && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-amber-950/70 border-2 border-amber-500/50 text-amber-200 text-xs sm:text-sm flex items-start gap-3 shadow-2xl backdrop-blur-md"
        >
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <span className="font-bold text-amber-300 uppercase tracking-wider">
              OPERATIONAL BREAKTHROUGH:
            </span>
            <p className="text-stone-200">{template.storyTwist}</p>
          </div>
        </motion.div>
      )}

      {/* Grid: Case Briefing & Active Objectives */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Incident Details & Known Locations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Briefing Text */}
          <div className="bg-[#030c1a]/80 border border-cyan-500/20 rounded-2xl p-5 sm:p-6 text-stone-300 text-sm leading-relaxed space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-cyan-400 font-bold tracking-wider text-xs uppercase border-b border-cyan-500/20 pb-2">
              <FileText className="w-4 h-4" />
              <span>INCIDENT BRIEFING & PRIMARY DIRECTIVE</span>
            </div>

            <p className="text-stone-200">{template.scenario}</p>

            <div className="p-3.5 bg-black/60 border border-cyan-500/30 rounded-xl text-xs text-cyan-300 space-y-1">
              <span className="font-bold text-amber-400">PRIMARY OBJECTIVE:</span>
              <p className="text-stone-200">
                {template.primaryObjective || 'Determine who accessed the Cryogenic Server Core and recover the 4-digit access code.'}
              </p>
            </div>

            {/* Known Key Locations Overview */}
            <div className="space-y-2 pt-2 border-t border-cyan-500/15">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                KNOWN FACILITY LOCATIONS:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {template.rooms.map((room) => {
                  const isInv = instance.investigatedRooms.includes(room.id);
                  return (
                    <div
                      key={room.id}
                      onClick={() => onNavigateTab('blueprint')}
                      className="p-2.5 rounded-xl bg-black/40 border border-cyan-500/20 hover:border-cyan-400/50 cursor-pointer flex items-center justify-between transition-colors group"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-cyan-400 group-hover:text-cyan-300">
                          {room.code}
                        </span>
                        <p className="text-xs text-stone-200 truncate">{room.name}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded ${
                        room.statusText?.includes('BREACH') ? 'bg-red-500/20 text-red-400' :
                        isInv ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-950 text-cyan-300'
                      }`}>
                        {isInv ? 'INVESTIGATED' : (room.statusText || 'UNINSPECTED')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Current Objectives Checklist */}
          <div className="bg-[#030c1a]/80 border border-cyan-500/20 rounded-2xl p-5 sm:p-6 text-xs space-y-3 shadow-xl">
            <div className="flex items-center justify-between text-cyan-400 font-bold tracking-wider text-xs uppercase border-b border-cyan-500/20 pb-2">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>MISSION INVESTIGATION CHECKLIST</span>
              </span>
              <span className="text-stone-400">
                {objectivesState.filter(Boolean).length}/{objectivesList.length} COMPLETED
              </span>
            </div>

            <div className="space-y-2">
              {objectivesList.map((objText, idx) => {
                const isDone = objectivesState[idx];
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      isDone
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-stone-200'
                        : 'bg-black/40 border-cyan-500/15 text-stone-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                        isDone ? 'bg-emerald-500 text-black' : 'bg-cyan-950 border border-cyan-500/30 text-cyan-400'
                      }`}>
                        {isDone ? '✓' : idx + 1}
                      </span>
                      <span className={isDone ? 'line-through text-stone-400' : 'text-stone-200'}>
                        {objText}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        if (idx === 0) onNavigateTab('blueprint');
                        else if (idx === 1) onNavigateTab('cctv');
                        else if (idx === 2) onNavigateTab('evidence');
                        else if (idx === 3) onNavigateTab('suspects');
                        else if (idx === 4) onNavigateTab('terminal');
                        else onNavigateTab('safe');
                      }}
                      className="px-2.5 py-1 rounded bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold uppercase transition-colors flex items-center gap-1 flex-shrink-0"
                    >
                      <span>GO</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Quick Access Mission Hub */}
        <div className="space-y-4">
          <div className="bg-[#030c1a]/80 border border-cyan-500/20 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-xs uppercase font-bold tracking-wider text-cyan-400 border-b border-cyan-500/20 pb-2 flex items-center justify-between">
              <span>FACILITY NAVIGATION</span>
              <Compass className="w-4 h-4 text-cyan-400" />
            </h3>

            {/* Checkpoint 1: Rooms */}
            <div
              onClick={() => onNavigateTab('blueprint')}
              className="p-3 rounded-xl bg-black/40 border border-cyan-500/20 hover:border-cyan-400/50 cursor-pointer transition-colors space-y-1.5 group"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-300 group-hover:text-cyan-300 font-bold">1. Blueprint Rooms</span>
                <span className="text-cyan-400">{completedRooms}/{totalRooms}</span>
              </div>
              <div className="h-1.5 w-full bg-cyan-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-500"
                  style={{ width: `${(completedRooms / Math.max(totalRooms, 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Checkpoint 2: CCTV */}
            <div
              onClick={() => onNavigateTab('cctv')}
              className="p-3 rounded-xl bg-black/40 border border-cyan-500/20 hover:border-cyan-400/50 cursor-pointer transition-colors space-y-1.5 group"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-300 group-hover:text-cyan-300 font-bold">2. CCTV Surveillance</span>
                <span className="text-cyan-400">{cctvReviewed}/{totalCCTV}</span>
              </div>
              <div className="h-1.5 w-full bg-cyan-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-500"
                  style={{ width: `${(cctvReviewed / Math.max(totalCCTV, 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Checkpoint 3: Evidence */}
            <div
              onClick={() => onNavigateTab('evidence')}
              className="p-3 rounded-xl bg-black/40 border border-cyan-500/20 hover:border-cyan-400/50 cursor-pointer transition-colors space-y-1.5 group"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-300 group-hover:text-cyan-300 font-bold">3. Evidence & Deductions</span>
                <span className="text-cyan-400">{evidenceCollected}/{totalEvidence}</span>
              </div>
              <div className="h-1.5 w-full bg-cyan-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-500"
                  style={{ width: `${(evidenceCollected / Math.max(totalEvidence, 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Checkpoint 4: Suspects */}
            <div
              onClick={() => onNavigateTab('suspects')}
              className="p-3 rounded-xl bg-black/40 border border-cyan-500/20 hover:border-cyan-400/50 cursor-pointer transition-colors space-y-1.5 group"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-300 group-hover:text-cyan-300 font-bold">4. Suspect Interrogations</span>
                <span className="text-cyan-400">{suspectsInspected}/{totalSuspects}</span>
              </div>
              <div className="h-1.5 w-full bg-cyan-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-500"
                  style={{ width: `${(suspectsInspected / Math.max(totalSuspects, 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Checkpoint 5: Safe Unlock */}
            <button
              onClick={() => onNavigateTab('safe')}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/40"
            >
              <Key className="w-4 h-4 text-black" />
              <span>OPEN DIGITAL SAFE</span>
            </button>
          </div>

          {/* Quick Assistant Callout */}
          {onOpenAssistant && (
            <div
              onClick={onOpenAssistant}
              className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400/60 cursor-pointer text-xs text-cyan-300 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400 group-hover:animate-bounce" />
                <span className="font-bold">INVESTIGATION ASSISTANT</span>
              </div>
              <span className="text-[10px] text-cyan-400 uppercase">NEED HELP?</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

