import { BlowDetectionConfig, BlowDetectorCallbacks, SensitivityLevel } from './types';
import { DEFAULT_BLOW_CONFIG, SENSITIVITY_PRESETS, CALIBRATION_DURATION_MS } from './blow-config';

export class BlowDetector {
  private config: BlowDetectionConfig;
  private callbacks: BlowDetectorCallbacks;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private animationFrameId: number | null = null;

  private isRunning = false;
  private isCalibrating = false;
  private calibrationStartTime = 0;
  private noiseFloorSum = 0;
  private noiseFloorCount = 0;
  private ambientNoiseFloor = 0.03;

  private blowStartTime = 0;
  private lastBlowTime = 0;
  private currentIntensity = 0;

  constructor(callbacks: BlowDetectorCallbacks = {}, initialSensitivity: SensitivityLevel = 'medium') {
    this.callbacks = callbacks;
    this.config = {
      ...DEFAULT_BLOW_CONFIG,
      sensitivity: SENSITIVITY_PRESETS[initialSensitivity] || 1.0,
    };
  }

  public setSensitivity(level: SensitivityLevel): void {
    this.config.sensitivity = SENSITIVITY_PRESETS[level] || 1.0;
  }

  public static isSupported(): boolean {
    return !!(
      typeof window !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      (window.AudioContext || (window as any).webkitAudioContext)
    );
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;

    if (!BlowDetector.isSupported()) {
      const err = 'Microphone API is not supported in this browser or context.';
      this.callbacks.onError?.(err);
      throw new Error(err);
    }

    try {
      this.callbacks.onStateChange?.({
        isRequestingPermission: true,
        permissionState: 'prompt',
        error: null,
      });

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.3;

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.sourceNode.connect(this.analyser);

      this.isRunning = true;
      this.isCalibrating = true;
      this.calibrationStartTime = performance.now();
      this.noiseFloorSum = 0;
      this.noiseFloorCount = 0;

      this.callbacks.onStateChange?.({
        isListening: true,
        isCalibrating: true,
        isRequestingPermission: false,
        permissionState: 'granted',
        error: null,
      });

      this.processLoop();
    } catch (err: any) {
      this.stop();
      let errorMsg = 'Failed to access microphone.';
      let permState: 'denied' | 'prompt' = 'prompt';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Microphone permission was denied by user or browser.';
        permState = 'denied';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'No microphone device found on this system.';
      }

      this.callbacks.onStateChange?.({
        isListening: false,
        isCalibrating: false,
        isRequestingPermission: false,
        permissionState: permState,
        error: errorMsg,
      });
      this.callbacks.onError?.(errorMsg);
      throw err;
    }
  }

  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.sourceNode) {
      try { this.sourceNode.disconnect(); } catch {}
      this.sourceNode = null;
    }

    if (this.analyser) {
      try { this.analyser.disconnect(); } catch {}
      this.analyser = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      try { this.audioContext.close(); } catch {}
      this.audioContext = null;
    }

    this.isRunning = false;
    this.isCalibrating = false;
    this.currentIntensity = 0;
    this.blowStartTime = 0;

    this.callbacks.onIntensityChange?.(0);
    this.callbacks.onStateChange?.({
      isListening: false,
      isCalibrating: false,
      intensity: 0,
    });
  }

  private processLoop = (): void => {
    if (!this.isRunning || !this.analyser) return;

    const timeData = new Float32Array(this.analyser.fftSize);
    const freqData = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getFloatTimeDomainData(timeData);
    this.analyser.getByteFrequencyData(freqData);

    // Calculate RMS energy (volume)
    let sumSquares = 0;
    for (let i = 0; i < timeData.length; i++) {
      sumSquares += timeData[i] * timeData[i];
    }
    const rms = Math.sqrt(sumSquares / timeData.length);

    // Calculate Low-Frequency wind rumble (frequency domain bins 0..10 ~ 0-1000Hz)
    let lowFreqSum = 0;
    const lowBins = Math.min(12, freqData.length);
    for (let i = 0; i < lowBins; i++) {
      lowFreqSum += freqData[i];
    }
    const lowFreqAvg = lowFreqSum / lowBins;

    const now = performance.now();

    // Calibration Phase
    if (this.isCalibrating) {
      this.noiseFloorSum += rms;
      this.noiseFloorCount++;

      if (now - this.calibrationStartTime >= CALIBRATION_DURATION_MS) {
        this.ambientNoiseFloor = Math.max(0.005, (this.noiseFloorSum / Math.max(1, this.noiseFloorCount)) * 1.2);
        this.isCalibrating = false;
        this.callbacks.onStateChange?.({ isCalibrating: false });
      }

      this.animationFrameId = requestAnimationFrame(this.processLoop);
      return;
    }

    // Dynamic threshold based on noise floor & sensitivity multiplier
    const sens = Math.max(0.2, this.config.sensitivity);
    const volumeThreshold = (this.ambientNoiseFloor + this.config.volumeThreshold) / sens;
    const lowFreqThreshold = 18 / sens;

    // Detect air blow if volume OR low-frequency wind rumble exceeds threshold
    const isAboveThreshold = rms > volumeThreshold || lowFreqAvg > lowFreqThreshold;

    if (isAboveThreshold) {
      if (this.blowStartTime === 0) {
        this.blowStartTime = now;
      }

      const duration = now - this.blowStartTime;
      const rawIntensity = Math.min(1.0, Math.max(rms / 0.1, lowFreqAvg / 150));
      this.currentIntensity = Math.max(0.3, rawIntensity);

      this.callbacks.onIntensityChange?.(this.currentIntensity);

      const cooldownElapsed = now - this.lastBlowTime >= this.config.cooldownMs;
      if (duration >= this.config.minimumDurationMs && cooldownElapsed) {
        this.lastBlowTime = now;
        this.blowStartTime = now;
        this.callbacks.onBlowDetected?.(this.currentIntensity);
      }
    } else {
      this.blowStartTime = 0;
      this.currentIntensity = Math.max(0, this.currentIntensity - 0.2);
      this.callbacks.onIntensityChange?.(this.currentIntensity);
    }

    this.animationFrameId = requestAnimationFrame(this.processLoop);
  };
}
