import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Radio,
  Clock,
  Eye,
  CheckCircle2,
  Maximize2,
  Sparkles,
  PlusCircle,
  Film,
  Zap,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import { CCTVCamera, TreasureHuntTemplate, TreasureHuntInstance, CCTVTimelineEvent } from '../../types/firestore/treasureHunt';
import { detectiveAudio } from '../../utils/detectiveAudio';
import { videoManager } from '../../utils/videoManager';

interface CCTVMonitorTabProps {
  template: TreasureHuntTemplate;
  instance: TreasureHuntInstance;
  onInspectCamera: (cameraId: string) => void;
  onCollectEvidence?: (evidenceId: string) => void;
  onAddClue?: (clue: string) => void;
  activeCameraId?: string;
}

export const CCTVMonitorTab: React.FC<CCTVMonitorTabProps> = ({
  template,
  instance,
  onInspectCamera,
  onCollectEvidence,
  onAddClue,
  activeCameraId,
}) => {
  const [selectedCamId, setSelectedCamId] = useState<string>(
    activeCameraId || template.cctvCameras[0]?.id || ''
  );
  const [isPlaying, setIsPlaying] = useState(true);
  const [timelineSecs, setTimelineSecs] = useState(15);
  const [visionMode, setVisionMode] = useState<'standard' | 'night' | 'thermal'>('standard');
  const [recordedObservation, setRecordedObservation] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentCam =
    template.cctvCameras.find((c) => c.id === selectedCamId) || template.cctvCameras[0];

  useEffect(() => {
    if (activeCameraId) {
      setSelectedCamId(activeCameraId);
    }
  }, [activeCameraId]);

  useEffect(() => {
    // Reset state on camera change
    setIsPlaying(true);
    setTimelineSecs(15);
    setRecordedObservation(false);
    detectiveAudio.playCameraSwitch();

    // Auto set vision mode based on camera feedType
    if (currentCam?.feedType === 'night_vision') setVisionMode('night');
    else if (currentCam?.feedType === 'thermal') setVisionMode('thermal');
    else setVisionMode('standard');

    if (videoRef.current) {
      videoManager.registerActive(videoRef.current, () => setIsPlaying(false));
    }

    if (currentCam && !instance.inspectedCCTVCams.includes(currentCam.id)) {
      onInspectCamera(currentCam.id);
    }

    return () => {
      videoManager.pauseAll();
    };
  }, [selectedCamId]);

  // Video scrubber progression simulation
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimelineSecs((prev) => (prev + 1) % 60);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  const handleSwitchCam = (cam: CCTVCamera) => {
    setSelectedCamId(cam.id);
  };

  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleAddObservationToEvidence = () => {
    detectiveAudio.playSuccessFanfare();
    setRecordedObservation(true);

    if (currentCam?.observationToAdd && onCollectEvidence) {
      onCollectEvidence(currentCam.observationToAdd.id);
    }

    if (onAddClue && currentCam?.clueRevealed) {
      onAddClue(`[CCTV ${currentCam.cameraNumber}] ${currentCam.clueRevealed}`);
    }
  };

  const timelineEvents: CCTVTimelineEvent[] = currentCam?.timelineEvents || [
    { time: '03:04', label: 'NORMAL', description: 'Area secured' },
    { time: '03:07', label: 'MOTION', description: 'Footsteps detected', isAnomaly: true },
    { time: '03:11', label: 'ACCESS BREACH', description: currentCam?.anomalyDescription || 'Anomaly logged', isAnomaly: true },
    { time: '03:18', label: 'RESET', description: 'System resumed' },
  ];

  // Determine active event based on timelineSecs
  const currentEvent =
    timelineSecs >= 35
      ? timelineEvents[timelineEvents.length - 1]
      : timelineSecs >= 20
      ? timelineEvents[Math.min(2, timelineEvents.length - 1)]
      : timelineSecs >= 10
      ? timelineEvents[Math.min(1, timelineEvents.length - 1)]
      : timelineEvents[0];

  const isAnomalyWindow = timelineSecs >= 18 && timelineSecs <= 45;

  const getVisionFilter = () => {
    switch (visionMode) {
      case 'night':
        return 'brightness(1.2) contrast(1.4) hue-rotate(90deg) saturate(1.8)';
      case 'thermal':
        return 'contrast(1.6) invert(0.8) hue-rotate(180deg) saturate(2.5)';
      default:
        return 'none';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-mono">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#040f1f]/90 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <Radio className="w-4 h-4 text-red-400" />
            <span>LIVE CCTV SURVEILLANCE FEED</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white uppercase mt-0.5">
            {currentCam?.cameraNumber}: {currentCam?.name} • {currentCam?.location}
          </h2>
        </div>

        {/* Vision Mode Selector */}
        <div className="flex items-center gap-1.5 bg-black/60 p-1.5 rounded-xl border border-cyan-500/30 text-xs">
          <button
            onClick={() => setVisionMode('standard')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
              visionMode === 'standard' ? 'bg-cyan-500 text-black' : 'text-cyan-400 hover:bg-cyan-950'
            }`}
          >
            STANDARD
          </button>
          <button
            onClick={() => setVisionMode('night')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
              visionMode === 'night' ? 'bg-emerald-500 text-black' : 'text-emerald-400 hover:bg-emerald-950'
            }`}
          >
            NIGHT VISION
          </button>
          <button
            onClick={() => setVisionMode('thermal')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
              visionMode === 'thermal' ? 'bg-amber-500 text-black' : 'text-amber-400 hover:bg-amber-950'
            }`}
          >
            THERMAL
          </button>
        </div>
      </div>

      {/* Camera Selection Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {template.cctvCameras.map((cam) => {
          const isInspected = instance.inspectedCCTVCams.includes(cam.id);
          const isSelected = cam.id === selectedCamId;
          return (
            <button
              key={cam.id}
              onClick={() => handleSwitchCam(cam)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border whitespace-nowrap flex-shrink-0 ${
                isSelected
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                  : 'bg-[#030d1d] text-cyan-300 border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/40'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{cam.cameraNumber}</span>
              <span className="text-[10px] text-stone-300 opacity-80">({cam.location.split(' ')[0]})</span>
              {isInspected && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            </button>
          );
        })}
      </div>

      {/* Main CCTV Monitor Stage */}
      <div className="relative aspect-video w-full bg-black border-2 border-cyan-500/40 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.2)]">
        {/* CRT Scanlines Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.65)_51%)] bg-[length:100%_4px] pointer-events-none z-20 opacity-70" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/20 to-black/80 pointer-events-none z-20" />

        {/* Video feed or simulated security camera canvas with vision mode filter */}
        <div
          className="w-full h-full transition-all duration-300"
          style={{ filter: getVisionFilter() }}
        >
          {currentCam?.videoUrl ? (
            <video
              ref={videoRef}
              src={currentCam.videoUrl}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="w-full h-full object-contain pointer-events-none"
            />
          ) : (
            /* High-Tech Animated Synthetic Security Feed */
            <div className="relative w-full h-full bg-[#020b14] flex items-center justify-center overflow-hidden">
              {/* Surveillance Grid & Radar Sweep */}
              <div className="absolute inset-0 bg-[radial-gradient(#00f0ff15_1px,transparent_1px)] [background-size:20px_20px]" />
              
              {/* Radar Circles */}
              <div className="w-56 h-56 rounded-full border border-cyan-500/20 flex items-center justify-center animate-pulse">
                <div className="w-40 h-40 rounded-full border border-cyan-500/30 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border border-dashed border-cyan-400/40 animate-spin-slow" />
                </div>
              </div>

              {/* Target Bounding Box when Anomaly is in Range */}
              {isAnomalyWindow && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute w-44 h-36 border-2 border-red-500/80 rounded-lg flex flex-col justify-between p-2 shadow-[0_0_20px_rgba(239,68,68,0.5)] z-10"
                >
                  <div className="flex justify-between items-center text-[9px] text-red-400 font-bold">
                    <span>[TARGET ACQUIRED]</span>
                    <span>LVL-2 ID</span>
                  </div>
                  <div className="text-[10px] text-red-300 font-bold text-center bg-red-950/80 px-1 py-0.5 rounded border border-red-500/40">
                    ⚠ RED BADGE LOGGED
                  </div>
                </motion.div>
              )}

              {/* Scene Anomaly Narrative Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-2 z-10">
                <div className="px-3 py-1 rounded-full bg-black/80 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
                  SURVEILLANCE: {currentCam?.name} [ONLINE]
                </div>
                <p className="text-stone-200 text-xs sm:text-sm max-w-md bg-black/80 p-3 rounded-xl border border-cyan-500/30 backdrop-blur-md">
                  {isAnomalyWindow
                    ? currentCam?.anomalyDescription
                    : `Feed normal. Monitoring timestamp ${currentCam?.timestamp.slice(0, 5)}:${timelineSecs < 10 ? `0${timelineSecs}` : timelineSecs}...`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Surveillance Top HUD */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between text-xs font-mono text-cyan-300 pointer-events-none">
          <div className="flex items-center gap-2 bg-black/80 px-3 py-1.5 rounded-lg border border-cyan-500/30 backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-red-400 font-bold">LIVE REC</span>
            <span>{currentCam?.cameraNumber}</span>
          </div>

          <div className="bg-black/80 px-3 py-1.5 rounded-lg border border-cyan-500/30 backdrop-blur-md text-emerald-400 font-bold">
            TIMESTAMP: {currentCam?.timestamp.slice(0, 5)}:{timelineSecs < 10 ? `0${timelineSecs}` : timelineSecs}
          </div>
        </div>

        {/* Temporal Anomaly Banner Overlay with Add Observation Button */}
        {isAnomalyWindow && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-20 left-4 right-4 sm:right-auto sm:max-w-md z-30 bg-black/90 border-2 border-amber-500/70 rounded-2xl p-4 text-xs text-amber-200 shadow-2xl backdrop-blur-md space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
                <span>SURVEILLANCE EVENT ({currentCam?.anomalyTimestamp || '03:11:24'})</span>
              </div>
              <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/40 font-bold">
                EVIDENCE CRITICAL
              </span>
            </div>

            <p className="text-stone-200 text-xs">
              {currentCam?.clueRevealed || currentCam?.anomalyDescription}
            </p>

            {/* Direct Add to Evidence Button */}
            <div className="pt-1">
              <button
                onClick={handleAddObservationToEvidence}
                disabled={recordedObservation}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${
                  recordedObservation
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                    : 'bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-black shadow-lg shadow-amber-900/40'
                }`}
              >
                {recordedObservation ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>OBSERVATION RECORDED TO EVIDENCE</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>RECORD OBSERVATION / ADD TO EVIDENCE</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Bottom CCTV Scrubber Controls */}
        <div className="absolute bottom-0 inset-x-0 z-30 p-3 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col gap-2">
          {/* Timeline bar with Key Event Markers */}
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="59"
              value={timelineSecs}
              onChange={(e) => setTimelineSecs(parseInt(e.target.value))}
              className="w-full h-2 bg-cyan-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-stone-300">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleTogglePlay}
                className="p-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 transition-colors"
                title={isPlaying ? 'Pause Feed' : 'Play Feed'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setTimelineSecs(0)}
                className="p-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 transition-colors"
                title="Rewind to start"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <span className="font-mono text-cyan-400 font-bold">
                00:00:{timelineSecs < 10 ? `0${timelineSecs}` : timelineSecs}
              </span>
            </div>

            {/* Quick Timeline Markers Pills */}
            <div className="hidden md:flex items-center gap-1.5">
              {timelineEvents.map((evt, idx) => (
                <button
                  key={idx}
                  onClick={() => setTimelineSecs(idx * 15 + 5)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    evt.isAnomaly
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-black/60 text-stone-400 hover:text-white'
                  }`}
                >
                  {evt.time} {evt.label}
                </button>
              ))}
            </div>

            <span className="text-[11px] text-cyan-300/80">
              STATUS: <span className="text-emerald-400 font-bold">{currentCam?.status}</span>
            </span>
          </div>
        </div>
      </div>

      {/* CCTV Findings Summary Card */}
      <div className="bg-[#030d1d] border border-cyan-500/30 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
          <h3 className="text-xs uppercase font-bold tracking-wider text-cyan-400 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>OPERATOR LOG & OBSERVATION BREAKTHROUGH</span>
          </h3>
          <span className="text-xs text-amber-400 font-bold">
            TIMEFRAME: {currentCam?.anomalyTimestamp || '03:11:24'}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
          {currentCam?.anomalyDescription}
        </p>

        <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">SURVEILLANCE INTELLIGENCE: </strong>
            <span>{currentCam?.clueRevealed}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

