export interface CelebrationSettingsData {
  candleCount: number;
  confettiEnabled: boolean;
  confettiAmount: number;
  confettiDuration: number;
  wishModalTitle: string;
  wishModalSubtitle: string;
  blowButtonText: string;
  relightButtonText: string;
  microphoneEnabled?: boolean;
  microphoneSensitivity?: number;
  blowThreshold?: number;
  minimumBlowDuration?: number;
  blowCooldown?: number;
  updatedAt?: string;
}
