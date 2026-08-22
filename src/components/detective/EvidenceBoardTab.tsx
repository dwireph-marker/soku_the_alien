import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Key,
  Camera,
  Ticket,
  CreditCard,
  Receipt,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  Sparkles,
  Lock,
  Clock,
  MapPin,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Search
} from 'lucide-react';
import { EvidenceItem, TreasureHuntTemplate, TreasureHuntInstance } from '../../types/firestore/treasureHunt';
import { detectiveAudio } from '../../utils/detectiveAudio';

interface EvidenceBoardTabProps {
  template: TreasureHuntTemplate;
  instance: TreasureHuntInstance;
  onLinkEvidence: (id1: string, id2: string, message: string) => void;
  onCollectEvidence: (id: string) => void;
}

export const EvidenceBoardTab: React.FC<EvidenceBoardTabProps> = ({
  template,
  instance,
  onLinkEvidence,
  onCollectEvidence,
}) => {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);
  const [matchSuccessModal, setMatchSuccessModal] = useState<string | null>(null);

  const getIcon = (type: string) => {
    switch (type) {
      case 'keycard':
      case 'key':
        return CreditCard;
      case 'photograph':
        return Camera;
      case 'receipt':
        return Receipt;
      case 'ticket':
        return Ticket;
      case 'cipher':
        return Key;
      default:
        return FileText;
    }
  };

  const handleCardClick = (item: EvidenceItem) => {
    detectiveAudio.playKeyClick();

    // If linking mode is active and player clicks another card
    if (linkSourceId && linkSourceId !== item.id) {
      const sourceItem = template.evidenceCards.find((e) => e.id === linkSourceId);
      if (
        sourceItem?.connectedClueId === item.id ||
        item.connectedClueId === sourceItem?.id
      ) {
        // MATCH CONFIRMED!
        detectiveAudio.playClueUnlocked();
        const msg =
          sourceItem?.linkMatchMessage ||
          item.linkMatchMessage ||
          'MATCH CONFIRMED: Verified correlation between artifacts!';
        onLinkEvidence(linkSourceId, item.id, msg);
        setMatchSuccessModal(msg);
        setLinkSourceId(null);
      } else {
        // Incorrect link
        detectiveAudio.playAccessDenied();
        setLinkSourceId(null);
      }
      return;
    }

    setSelectedEvidence(item);
    if (!instance.evidenceCollected.includes(item.id)) {
      onCollectEvidence(item.id);
    }
  };

  const isLinked = (id: string) => {
    return instance.evidenceLinked.some(([a, b]) => a === id || b === id);
  };

  // Collect revealed code fragments
  const revealedCodeDigits = template.evidenceCards
    .filter((e) => e.codeDigit && (instance.evidenceCollected.includes(e.id) || isLinked(e.id)))
    .map((e) => ({
      title: e.title,
      digit: e.codeDigit,
      position: e.digitPosition || 1,
      fragment: e.codeFragment,
    }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-mono">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#040f1f]/90 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>CLASSIFIED EVIDENCE & DEDUCTION PINBOARD</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white uppercase mt-0.5">
            Recovered Artifacts & Surveillance Clues
          </h2>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {linkSourceId ? (
            <span className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400 text-amber-300 animate-pulse font-bold">
              SELECT SECOND EVIDENCE CARD TO CONNECT
            </span>
          ) : (
            <span className="text-stone-400">
              COLLECTED:{' '}
              <strong className="text-cyan-300 font-bold">
                {instance.evidenceCollected.length}/{template.evidenceCards.length}
              </strong>
            </span>
          )}
        </div>
      </div>

      {/* Code Fragments Bar */}
      {revealedCodeDigits.length > 0 && (
        <div className="p-4 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-xs text-cyan-200 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 text-cyan-300 font-bold uppercase">
            <Key className="w-4 h-4 text-amber-400" />
            <span>EXTRACTED SAFE DIGITS ({revealedCodeDigits.length}/4):</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {revealedCodeDigits.map((cd, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-black/80 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1.5 text-xs"
              >
                <span>Pos #{cd.position}:</span>
                <strong className="text-white text-sm">[{cd.digit}]</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Evidence Pinboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {template.evidenceCards.map((card) => {
          const Icon = getIcon(card.type);
          const isCollected = instance.evidenceCollected.includes(card.id);
          const isConnected = isLinked(card.id);
          const isSelected = selectedEvidence?.id === card.id;
          const isLinking = linkSourceId === card.id;

          return (
            <motion.div
              key={card.id}
              whileHover={{ scale: 1.02, y: -2 }}
              onClick={() => handleCardClick(card)}
              className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative flex flex-col justify-between backdrop-blur-md min-h-[190px] ${
                isLinking
                  ? 'border-amber-400 bg-amber-950/70 shadow-[0_0_25px_rgba(245,158,11,0.5)]'
                  : isConnected
                  ? 'border-emerald-500/70 bg-emerald-950/35 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                  : isCollected
                  ? 'border-cyan-500/40 bg-[#030d1d]/90 hover:border-cyan-400 shadow-lg'
                  : 'border-stone-800 bg-black/50 opacity-60'
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 justify-end">
                    {isConnected && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                        <LinkIcon className="w-2.5 h-2.5" /> LINKED
                      </span>
                    )}
                    {card.isCrucial && (
                      <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-bold uppercase">
                        CRUCIAL
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white mb-1">{card.title}</h3>
                <p className="text-xs text-stone-300 line-clamp-2">{card.description}</p>
              </div>

              {/* Card Meta Badges */}
              <div className="mt-3 pt-2.5 border-t border-cyan-500/15 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-cyan-300">
                  <span className="flex items-center gap-1 text-stone-400">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>{card.timestamp || '03:10'}</span>
                  </span>
                  <span className="flex items-center gap-1 text-stone-400">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    <span className="truncate max-w-[110px]">{card.location || 'Sector 7'}</span>
                  </span>
                </div>

                {card.codeDigit && (
                  <div className="flex items-center justify-between text-[10px] bg-black/60 px-2 py-0.5 rounded border border-amber-500/30 text-amber-300">
                    <span>REVEALED DIGIT:</span>
                    <strong className="text-white">[{card.codeDigit}]</strong>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Evidence Inspector Modal */}
      <AnimatePresence>
        {selectedEvidence && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedEvidence(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[#030d1d] border-2 border-cyan-500/50 rounded-2xl max-w-lg w-full p-6 text-stone-200 shadow-2xl space-y-4 font-mono"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                <div>
                  <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-widest">
                    ARTIFACT DOSSIER #{selectedEvidence.id}
                  </span>
                  <h2 className="text-lg font-bold text-white">{selectedEvidence.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedEvidence(null)}
                  className="p-1 rounded-lg hover:bg-cyan-950 text-stone-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Source & Location Meta */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-black/50 border border-cyan-500/20">
                  <span className="text-[10px] text-cyan-400 uppercase">SOURCE:</span>
                  <p className="font-bold text-white truncate">{selectedEvidence.source || 'Surveillance File'}</p>
                </div>
                <div className="p-2 rounded-lg bg-black/50 border border-cyan-500/20">
                  <span className="text-[10px] text-cyan-400 uppercase">TIMESTAMP & LOCATION:</span>
                  <p className="font-bold text-amber-300 truncate">
                    {selectedEvidence.timestamp || '03:11'} • {selectedEvidence.location || 'Sector 7'}
                  </p>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/20 text-xs text-stone-300 whitespace-pre-wrap leading-relaxed">
                {selectedEvidence.content}
              </div>

              {/* Observation Deduction */}
              {selectedEvidence.observation && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 space-y-1">
                  <span className="font-bold uppercase text-emerald-400">DETECTIVE OBSERVATION:</span>
                  <p className="text-stone-200">{selectedEvidence.observation}</p>
                </div>
              )}

              {/* Code Fragment if revealed */}
              {selectedEvidence.codeFragment && (
                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300">
                  <span className="font-bold text-amber-400">DETECTED CODE FRAGMENT: </span>
                  {selectedEvidence.codeFragment}
                </div>
              )}

              {/* Link Clue Action Button */}
              {selectedEvidence.connectedClueId && !isLinked(selectedEvidence.id) ? (
                <button
                  onClick={() => {
                    setLinkSourceId(selectedEvidence.id);
                    setSelectedEvidence(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>CONNECT THIS CLUE TO ANOTHER EVIDENCE CARD</span>
                </button>
              ) : isLinked(selectedEvidence.id) ? (
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs text-center font-bold">
                  ✓ THIS ARTIFACT IS OFFICIALLY CORRELATED IN DOSSIER
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match Confirmed Toast Modal */}
      <AnimatePresence>
        {matchSuccessModal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-emerald-950/95 border-2 border-emerald-400 text-white rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-lg max-w-md w-[90%] font-mono text-center space-y-2"
          >
            <div className="flex items-center justify-center gap-2 text-emerald-300 font-bold text-sm uppercase">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>MATCH CONFIRMED!</span>
            </div>
            <p className="text-xs text-stone-200">{matchSuccessModal}</p>
            <button
              onClick={() => setMatchSuccessModal(null)}
              className="mt-2 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase"
            >
              ACKNOWLEDGE DEDUCTION
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

