export type PermissionState = 'unknown' | 'prompt' | 'granted' | 'denied';
export type SensitivityLevel = 'low' | 'medium' | 'high';

export interface BlowDetectionConfig {
  volumeThreshold: number;
  minimumDurationMs: number;
  cooldownMs: number;
  sensitivity: number;
  allowMultiCandleBlow: boolean;
}

export interface BlowDetectionState {
  isListening: boolean;
  isSupported: boolean;
  isCalibrating: boolean;
  isRequestingPermission: boolean;
  permissionState: PermissionState;
  intensity: number;
  sensitivity: SensitivityLevel;
  error: string | null;
}

export interface BlowDetectorCallbacks {
  onIntensityChange?: (intensity: number) => void;
  onBlowDetected?: (intensity: number) => void;
  onError?: (error: string) => void;
  onStateChange?: (state: Partial<BlowDetectionState>) => void;
}
