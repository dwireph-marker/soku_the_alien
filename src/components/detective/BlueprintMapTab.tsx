import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Camera,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  Compass,
  Layers,
  Clock,
  Users,
  FileSearch,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { BlueprintRoom, TreasureHuntTemplate, TreasureHuntInstance } from '../../types/firestore/treasureHunt';
import { detectiveAudio } from '../../utils/detectiveAudio';

interface BlueprintMapTabProps {
  template: TreasureHuntTemplate;
  instance: TreasureHuntInstance;
  onInvestigateRoom: (roomId: string) => void;
  onNavigateToCCTV?: (cameraId: string) => void;
}

export const BlueprintMapTab: React.FC<BlueprintMapTabProps> = ({
  template,
  instance,
  onInvestigateRoom,
  onNavigateToCCTV,
}) => {
  const [selectedRoom, setSelectedRoom] = useState<BlueprintRoom | null>(null);

  const handleSelectRoom = (room: BlueprintRoom) => {
    detectiveAudio.playScanBeep();
    setSelectedRoom(room);
    if (!instance.investigatedRooms.includes(room.id)) {
      onInvestigateRoom(room.id);
    }
  };

  const getRoomBorderAndBg = (room: BlueprintRoom, isSelected: boolean, isInvestigated: boolean) => {
    if (isSelected) {
      return 'border-cyan-400 bg-cyan-950/80 shadow-[0_0_30px_rgba(0,240,255,0.5)] z-20';
    }
    if (room.colorStatus === 'red' || room.statusText?.includes('BREACH')) {
      return 'border-red-500/80 bg-red-950/30 hover:border-red-400 hover:bg-red-950/50 shadow-[0_0_15px_rgba(239,68,68,0.25)] z-10';
    }
    if (room.colorStatus === 'amber' || (room.evidenceCount && room.evidenceCount > 0 && !isInvestigated)) {
      return 'border-amber-500/60 bg-amber-950/25 hover:border-amber-400 hover:bg-amber-950/45 z-10';
    }
    if (isInvestigated || room.colorStatus === 'cyan') {
      return 'border-cyan-500/50 bg-cyan-950/30 hover:border-cyan-400 hover:bg-cyan-950/50 z-10';
    }
    return 'border-stone-700/60 bg-stone-900/40 hover:border-cyan-500/40 hover:bg-cyan-950/20 z-10';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-mono">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#040f1f]/90 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            <span>FACILITY ARCHITECTURAL BLUEPRINT</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white uppercase mt-0.5">
            {template.location}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-300">
          <span className="flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-lg border border-cyan-500/20">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SECTORS INSPECTED: <strong className="text-white">{instance.investigatedRooms.length}/{template.rooms.length}</strong></span>
          </span>
          <span className="text-cyan-300 font-bold hidden md:inline">CLICK ROOM TO INSPECT DETAILS & LOGS</span>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-400 bg-black/40 border border-cyan-500/15 px-4 py-2 rounded-xl">
        <span className="text-cyan-400 font-bold uppercase">STATUS LEGEND:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-500 shadow-[0_0_8px_#ef4444]" />
          <span className="text-stone-300">Security Breach / Anomaly</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
          <span className="text-stone-300">Power Event / Clue Available</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
          <span className="text-stone-300">Investigated / Online</span>
        </span>
      </div>

      {/* Blueprint Stage Grid */}
      <div className="relative aspect-[4/3] sm:aspect-[16/10] bg-[#020b18] border-2 border-cyan-500/40 rounded-2xl p-4 overflow-hidden shadow-[inset_0_0_60px_rgba(0,240,255,0.15)] select-none">
        {/* Technical Blueprint Grid Pattern */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#00f0ff0d_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff0d_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"
        />

        {/* Blueprint North / Compass Marker */}
        <div className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded-lg bg-black/80 border border-cyan-500/30 text-[10px] text-cyan-400 flex items-center gap-1.5 backdrop-blur-sm">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>SVALBARD GRID: SECTOR 7 // N 78°</span>
        </div>

        {/* Center Blueprint Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
          <ShieldAlert className="w-96 h-96 text-cyan-400" />
        </div>

        {/* Rooms Layout */}
        <div className="relative w-full h-full">
          {template.rooms.map((room) => {
            const isInvestigated = instance.investigatedRooms.includes(room.id);
            const isSelected = selectedRoom?.id === room.id;
            const styleClasses = getRoomBorderAndBg(room, isSelected, isInvestigated);

            return (
              <motion.div
                key={room.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectRoom(room)}
                style={{
                  left: `${room.x}%`,
                  top: `${room.y}%`,
                  width: `${room.width}%`,
                  height: `${room.height}%`,
                }}
                className={`absolute rounded-xl border-2 cursor-pointer transition-all duration-300 p-3 sm:p-4 flex flex-col justify-between backdrop-blur-sm ${styleClasses}`}
              >
                {/* Room Top Header */}
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] sm:text-xs font-bold text-cyan-300 bg-black/70 px-1.5 py-0.5 rounded border border-cyan-500/30">
                        {room.code}
                      </span>
                      {room.statusText && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          room.statusText.includes('BREACH') ? 'bg-red-500/30 text-red-300 border border-red-500/40' :
                          room.statusText.includes('FLUCTUATION') ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' :
                          'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}>
                          {room.statusText}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-white mt-1.5 line-clamp-1">
                      {room.name}
                    </h3>
                  </div>

                  {isInvestigated && (
                    <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                {/* Room Bottom Footer */}
                <div className="flex items-center justify-between text-[10px] text-stone-300 pt-2 border-t border-cyan-500/20">
                  <span className="flex items-center gap-1 text-cyan-300">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>{room.lastAccessTime || '03:00'}</span>
                  </span>

                  {room.hasCamera && (
                    <span className="flex items-center gap-1 text-amber-400 bg-black/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                      <Camera className="w-3 h-3 text-amber-400" />
                      <span>{room.cameraId ? room.cameraId.toUpperCase() : 'CCTV'}</span>
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Room Detail Modal / Drawer */}
      <AnimatePresence>
        {selectedRoom && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="bg-[#030d1d] border-2 border-cyan-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold">
                  {selectedRoom.code}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {selectedRoom.name}
                </h3>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  selectedRoom.statusText?.includes('BREACH') ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  selectedRoom.statusText?.includes('FLUCTUATION') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {selectedRoom.statusText || 'STATUS: NORMAL'}
                </span>
              </div>

              <button
                onClick={() => setSelectedRoom(null)}
                className="p-1.5 rounded-lg hover:bg-cyan-950 text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Room Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-black/50 border border-cyan-500/20 space-y-0.5">
                <span className="text-[10px] text-cyan-400 uppercase">SECURITY CLEARANCE</span>
                <p className="font-bold text-white">{selectedRoom.securityLevel}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-black/50 border border-cyan-500/20 space-y-0.5">
                <span className="text-[10px] text-cyan-400 uppercase">LAST RECORDED ACCESS</span>
                <p className="font-bold text-amber-300">{selectedRoom.lastAccessTime || '03:00'}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-black/50 border border-cyan-500/20 space-y-0.5">
                <span className="text-[10px] text-cyan-400 uppercase">AUTHORIZED CREW</span>
                <p className="font-bold text-white">{selectedRoom.authorizedPersonnelCount || 2} Personnel</p>
              </div>

              <div className="p-2.5 rounded-xl bg-black/50 border border-cyan-500/20 space-y-0.5">
                <span className="text-[10px] text-cyan-400 uppercase">AVAILABLE EVIDENCE</span>
                <p className="font-bold text-emerald-400">{selectedRoom.evidenceCount || 1} Registered</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              {selectedRoom.description}
            </p>

            {/* Clue Revealed */}
            {selectedRoom.clueRevealed && (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>INVESTIGATION FINDING:</span>
                </div>
                <p className="text-stone-200">{selectedRoom.clueRevealed}</p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="text-xs text-stone-400">
                Sector inspection recorded in mission dossier.
              </span>

              {selectedRoom.hasCamera && selectedRoom.cameraId && onNavigateToCCTV && (
                <button
                  onClick={() => onNavigateToCCTV(selectedRoom.cameraId!)}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2 transition-colors shadow-lg"
                >
                  <Camera className="w-4 h-4" />
                  <span>SWITCH TO SURVEILLANCE FEED ({selectedRoom.cameraId.toUpperCase()})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

