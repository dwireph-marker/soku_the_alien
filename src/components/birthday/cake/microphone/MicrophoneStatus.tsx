import React from 'react';
import { PermissionState } from './types';

interface MicrophoneStatusProps {
  isListening: boolean;
  isCalibrating: boolean;
  isRequestingPermission?: boolean;
  permissionState: PermissionState;
  isSupported: boolean;
  error?: string | null;
}

export const MicrophoneStatus: React.FC<MicrophoneStatusProps> = ({
  isListening,
  isCalibrating,
  isRequestingPermission,
  permissionState,
  isSupported,
}) => {
  if (!isSupported) {
    return (
      <div className="text-[11px] text-amber-400/80 flex items-center justify-center gap-1.5" aria-live="polite">
        <span className="w-2 h-2 rounded-full bg-amber-400" />
        <span>Microphone mode is not supported in this browser.</span>
      </div>
    );
  }

  if (isRequestingPermission) {
    return (
      <div className="text-[11px] text-amber-300 flex items-center justify-center gap-1.5" aria-live="polite">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <span>Requesting permission... Please click "Allow" in your browser prompt.</span>
      </div>
    );
  }

  if (permissionState === 'denied') {
    return (
      <div className="text-[11px] text-rose-400 flex flex-col items-center justify-center gap-1 text-center" aria-live="polite">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>Microphone permission denied or blocked.</span>
        </div>
        <span className="text-[10px] text-stone-400">
          Click button above to retry, or enable microphone in browser site settings.
        </span>
      </div>
    );
  }

  if (isListening && isCalibrating) {
    return (
      <div className="text-[11px] text-amber-300 flex items-center justify-center gap-1.5" aria-live="polite">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <span>Calibrating microphone... Please remain quiet for a moment.</span>
      </div>
    );
  }

  if (isListening) {
    return (
      <div className="text-[11px] text-emerald-400 flex items-center justify-center gap-1.5" aria-live="polite">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Microphone Active: Blow toward your microphone! 💨</span>
      </div>
    );
  }

  return (
    <div className="text-[11px] text-stone-400 flex items-center justify-center gap-1.5" aria-live="polite">
      <span className="w-2 h-2 rounded-full bg-stone-600" />
      <span>Microphone: Off (Click button to enable)</span>
    </div>
  );
};
