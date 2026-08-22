import { BlowDetectionConfig, SensitivityLevel } from './types';

export const SENSITIVITY_PRESETS: Record<SensitivityLevel, number> = {
  low: 0.8,
  medium: 1.2,
  high: 1.8,
};

export const DEFAULT_BLOW_CONFIG: BlowDetectionConfig = {
  volumeThreshold: 0.015,
  minimumDurationMs: 80,
  cooldownMs: 400,
  sensitivity: 1.2,
  allowMultiCandleBlow: true,
};

export const CALIBRATION_DURATION_MS = 200;
