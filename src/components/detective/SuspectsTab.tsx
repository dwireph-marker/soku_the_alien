import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserCheck,
  UserX,
  AlertTriangle,
  Clock,
  MapPin,
  FileCheck,
  Eye,
  CheckCircle2,
  HelpCircle,
  X,
  Shield,
  CreditCard,
  Sparkles,
  Key,
  ShieldAlert,
  Flame
} from 'lucide-react';
import { CharacterProfile, TreasureHuntTemplate, TreasureHuntInstance, EvidenceItem } from '../../types/firestore/treasureHunt';
import { detectiveAudio } from '../../utils/detectiveAudio';

interface SuspectsTabProps {
  template: TreasureHuntTemplate;
  instance: TreasureHuntInstance;
  onInspectCharacter: (charId: string) => void;
  onAddClue?: (clue: string) => void;
}

export const SuspectsTab: React.FC<SuspectsTabProps> = ({
  template,
  instance,
  onInspectCharacter,
  onAddClue,
}) => {
  const [selectedChar, setSelectedChar] = useState<CharacterProfile | null>(null);
  const [interrogationPassed, setInterrogationPassed] = useState<Record<string, boolean>>({});
  const [selectedConfrontEvidenceId, setSelectedConfrontEvidenceId] = useState<string>('');

  const handleSelectChar = (char: CharacterProfile) => {
    detectiveAudio.playKeyClick();
    setSelectedChar(char);
    setSelectedConfrontEvidenceId('');
    if (!instance.inspectedCharacters.includes(char.id)) {
      onInspectCharacter(char.id);
    }
  };

  const handleConfrontWithEvidence = (char: CharacterProfile) => {
    detectiveAudio.playScanBeep();
    setInterrogationPassed((prev) => ({ ...prev, [char.id]: true }));

    if (char.isLying) {
      detectiveAudio.playSuccessFanfare();
      if (onAddClue && char.revealsClue) {
        onAddClue(`[Interrogation: ${char.name}] ${char.revealsClue}`);
      }
    } else {
      detectiveAudio.playKeyClick();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUSPECT':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'PERSON OF INTEREST':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'CLEARED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      default:
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
    }
  };

  // Find evidence cards that match this suspect
  const availableCollectedEvidence = template.evidenceCards.filter((e) =>
    instance.evidenceCollected.includes(e.id)
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-mono">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#040f1f]/90 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <span>PERSONNEL & SUSPECT DOSSIER ARCHIVE</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white uppercase mt-0.5">
            Interrogation Records & Alibi Cross-Examination
          </h2>
        </div>

        <div className="text-xs text-stone-400">
          PROFILES LOGGED: <span className="text-cyan-300 font-bold">{template.characters.length}</span>
        </div>
      </div>

      {/* Suspects Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {template.characters.map((char) => {
          const isInspected = instance.inspectedCharacters.includes(char.id);
          const isTested = interrogationPassed[char.id];

          return (
            <motion.div
              key={char.id}
              whileHover={{ scale: 1.02, y: -2 }}
              onClick={() => handleSelectChar(char)}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between space-y-4 backdrop-blur-md shadow-xl ${
                isTested && char.isLying
                  ? 'bg-red-950/30 border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                  : isTested && !char.isLying
                  ? 'bg-emerald-950/20 border-emerald-500/50'
                  : 'bg-[#030d1d]/90 border-cyan-500/30 hover:border-cyan-400'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-sm">
                    {char.name.charAt(0)}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusBadge(
                        char.status
                      )}`}
                    >
                      {char.status}
                    </span>
                    {char.accessLevel && (
                      <span className="text-[10px] text-amber-300 font-bold">
                        {char.accessLevel}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-white">{char.name}</h3>
                <p className="text-xs text-cyan-300/80 mb-2">{char.role}</p>

                <div className="space-y-1 text-xs text-stone-400 pt-2 border-t border-cyan-500/15">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ALIBI TIME: {char.lastSeenTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="truncate max-w-[170px]">CLAIM: {char.lastSeenLocation}</span>
                  </div>
                  {char.badgeId && (
                    <div className="flex items-center gap-1.5 text-amber-400/90 text-[11px]">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>BADGE ID: {char.badgeId}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-cyan-300 pt-2 border-t border-cyan-500/15">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> CROSS-EXAMINE
                </span>
                {isTested && (
                  <span
                    className={`font-bold flex items-center gap-1 ${
                      char.isLying ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {char.isLying ? (
                      <>
                        <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> CONTRADICTION!
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ALIBI CONFIRMED
                      </>
                    )}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Suspect Statement & Interrogation Modal */}
      <AnimatePresence>
        {selectedChar && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedChar(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[#030d1d] border-2 border-cyan-500/50 rounded-2xl max-w-lg w-full p-6 text-stone-200 shadow-2xl space-y-4 font-mono max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                <div>
                  <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-widest">
                    INTERROGATION TRANSCRIPT #{selectedChar.id}
                  </span>
                  <h2 className="text-lg font-bold text-white">{selectedChar.name}</h2>
                  <p className="text-xs text-stone-400">{selectedChar.role}</p>
                </div>
                <button
                  onClick={() => setSelectedChar(null)}
                  className="p-1 rounded-lg hover:bg-cyan-950 text-stone-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Clearance & Motive Badges */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-black/60 border border-cyan-500/20 space-y-1">
                  <span className="text-[10px] text-cyan-400 uppercase font-bold">ACCESS CLEARANCE:</span>
                  <p className="font-bold text-amber-300">{selectedChar.accessLevel || 'Standard L1'}</p>
                  <span className="text-[10px] text-stone-400">ID: {selectedChar.badgeId || 'UNREGISTERED'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/60 border border-cyan-500/20 space-y-1">
                  <span className="text-[10px] text-cyan-400 uppercase font-bold">SUSPICIOUS MOTIVE:</span>
                  <p className="text-[11px] text-stone-300">{selectedChar.motive || 'No explicit grievance recorded'}</p>
                </div>
              </div>

              {/* Statement */}
              <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/20 text-xs text-stone-300 space-y-1.5">
                <span className="font-bold text-cyan-400 uppercase text-[11px]">OFFICIAL ALIBI STATEMENT:</span>
                <p className="italic leading-relaxed text-stone-200">"{selectedChar.statement}"</p>
              </div>

              {/* Timeline Points */}
              {selectedChar.timeline && selectedChar.timeline.length > 0 && (
                <div className="space-y-1 text-xs text-stone-300">
                  <span className="font-bold text-cyan-400 uppercase text-[11px]">CLAIMED TIMELINE:</span>
                  {selectedChar.timeline.map((point, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-black/40 border border-cyan-500/10 text-[11px] text-stone-300">
                      {point}
                    </div>
                  ))}
                </div>
              )}

              {/* Cross-Reference & Lie Detection Result */}
              {interrogationPassed[selectedChar.id] ? (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    selectedChar.isLying
                      ? 'bg-red-950/50 border-red-500/60 text-red-200'
                      : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold uppercase">
                    {selectedChar.isLying ? (
                      <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    )}
                    <span className="text-sm">
                      {selectedChar.isLying ? 'STATEMENT DIRECTLY CONTRADICTED!' : 'ALIBI STATEMENT VERIFIED'}
                    </span>
                  </div>

                  <p className="text-stone-200 leading-relaxed">{selectedChar.lieIndicator}</p>

                  {selectedChar.revealsClue && (
                    <div className="p-2.5 rounded-lg bg-black/60 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>{selectedChar.revealsClue}</span>
                    </div>
                  )}

                  {selectedChar.codeDigit && (
                    <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-400 text-amber-200 font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-amber-400" />
                        <span>REVEALED SAFE CODE DIGIT (POS #{selectedChar.digitPosition || 2}):</span>
                      </span>
                      <strong className="text-white text-base">[{selectedChar.codeDigit}]</strong>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleConfrontWithEvidence(selectedChar)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-black font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-900/40"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>CONFRONT WITH SURVEILLANCE & ACCESS LOG EVIDENCE</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

