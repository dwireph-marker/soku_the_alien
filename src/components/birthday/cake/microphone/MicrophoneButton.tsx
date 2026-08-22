import React from 'react';
import { Mic, MicOff, Volume2, Settings2 } from 'lucide-react';
import { SensitivityLevel, PermissionState } from './types';
import { MicrophoneStatus } from './MicrophoneStatus';

interface MicrophoneButtonProps {
  isListening: boolean;
  isCalibrating: boolean;
  isRequestingPermission?: boolean;
  permissionState: PermissionState;
  isSupported: boolean;
  intensity: number;
  sensitivity: SensitivityLevel;
  onToggle: () => void;
  onSetSensitivity: (level: SensitivityLevel) => void;
  disabled?: boolean;
  className?: string;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  isListening,
  isCalibrating,
  isRequestingPermission = false,
  permissionState,
  isSupported,
  intensity,
  sensitivity,
  onToggle,
  onSetSensitivity,
  disabled = false,
  className = '',
}) => {
  const percentage = Math.round(intensity * 100);

  return (
    <div className={`flex flex-col items-center gap-3 w-full ${className}`}>
      <button
        onClick={onToggle}
        disabled={disabled || !isSupported || isRequestingPermission}
        aria-label={
          isListening
            ? 'Stop microphone blow detection'
            : permissionState === 'denied'
            ? 'Allow microphone access'
            : 'Enable microphone blow detection'
        }
        aria-pressed={isListening}
        className={`w-full py-3.5 px-6 rounded-full font-medium text-xs uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2.5 border shadow-xl hover:scale-105 active:scale-95 ${
          isListening
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-emerald-400/40 shadow-emerald-950/40 animate-pulse'
            : isRequestingPermission
            ? 'bg-amber-600/90 text-white border-amber-400/50 animate-pulse'
            : permissionState === 'denied'
            ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border-rose-500/50 hover:border-rose-400'
            : 'bg-stone-900/90 hover:bg-stone-800 text-amber-200 border-amber-500/30 hover:border-amber-400/60 shadow-amber-950/20'
        }`}
      >
        {isListening ? (
          <>
            <Mic className="w-4 h-4 text-emerald-200 animate-bounce" />
            <span>Listening... Blow Through Mic 💨</span>
          </>
        ) : isRequestingPermission ? (
          <>
            <Mic className="w-4 h-4 text-amber-200 animate-spin" />
            <span>Requesting Permission...</span>
          </>
        ) : permissionState === 'denied' ? (
          <>
            <Mic className="w-4 h-4 text-rose-300" />
            <span>🎤 Allow Microphone Permission</span>
          </>
        ) : (
          <>
            <MicOff className="w-4 h-4 text-amber-400" />
            <span>🎤 Blow Through Mic</span>
          </>
        )}
      </button>

      <MicrophoneStatus
        isListening={isListening}
        isCalibrating={isCalibrating}
        isRequestingPermission={isRequestingPermission}
        permissionState={permissionState}
        isSupported={isSupported}
      />

      {isListening && !isCalibrating && (
        <div className="w-full bg-stone-900/80 border border-stone-800 rounded-2xl p-3 space-y-2.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-[11px] text-stone-300">
            <span className="flex items-center gap-1.5 font-medium text-stone-300">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> Blow Strength:
            </span>
            <span className="font-mono text-emerald-400 font-bold">{percentage}%</span>
          </div>

          {/* Strength Bar */}
          <div className="w-full h-2.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                percentage > 75
                  ? 'bg-gradient-to-r from-emerald-500 to-rose-500'
                  : percentage > 40
                  ? 'bg-gradient-to-r from-teal-400 to-emerald-400'
                  : 'bg-emerald-500/60'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Sensitivity Controls */}
          <div className="flex items-center justify-between pt-1 border-t border-stone-800/80 text-[10px] text-stone-400">
            <span className="flex items-center gap-1">
              <Settings2 className="w-3 h-3 text-stone-500" /> Sensitivity:
            </span>
            <div className="flex items-center gap-1">
              {(['low', 'medium', 'high'] as SensitivityLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => onSetSensitivity(level)}
                  className={`px-2 py-0.5 rounded-md capitalize transition-colors ${
                    sensitivity === level
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
