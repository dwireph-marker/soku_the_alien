import { useState, useCallback, useRef, useEffect } from 'react';
import { BlowDetectionState, SensitivityLevel } from './types';
import { BlowDetector } from './BlowDetector';

interface UseBlowDetectionOptions {
  onBlowDetected?: (intensity: number) => void;
  initialSensitivity?: SensitivityLevel;
}

export function useBlowDetection(options: UseBlowDetectionOptions = {}) {
  const { onBlowDetected, initialSensitivity = 'medium' } = options;

  const [state, setState] = useState<BlowDetectionState>({
    isListening: false,
    isSupported: BlowDetector.isSupported(),
    isCalibrating: false,
    isRequestingPermission: false,
    permissionState: 'unknown',
    intensity: 0,
    sensitivity: initialSensitivity,
    error: null,
  });

  const detectorRef = useRef<BlowDetector | null>(null);
  const onBlowDetectedRef = useRef(onBlowDetected);

  useEffect(() => {
    onBlowDetectedRef.current = onBlowDetected;
  }, [onBlowDetected]);

  const stopListening = useCallback(() => {
    if (detectorRef.current) {
      detectorRef.current.stop();
      detectorRef.current = null;
    }
  }, []);

  const startListening = useCallback(async () => {
    stopListening();

    const detector = new BlowDetector(
      {
        onIntensityChange: (intensity) => {
          setState((prev) => ({ ...prev, intensity }));
        },
        onBlowDetected: (intensity) => {
          if (onBlowDetectedRef.current) {
            onBlowDetectedRef.current(intensity);
          }
        },
        onStateChange: (partialState) => {
          setState((prev) => ({ ...prev, ...partialState }));
        },
        onError: (error) => {
          setState((prev) => ({ ...prev, error, isListening: false }));
        },
      },
      state.sensitivity
    );

    detectorRef.current = detector;

    try {
      await detector.start();
    } catch (err) {
      // Error handled via callback
    }
  }, [stopListening, state.sensitivity]);

  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  const setSensitivity = useCallback((level: SensitivityLevel) => {
    setState((prev) => ({ ...prev, sensitivity: level }));
    if (detectorRef.current) {
      detectorRef.current.setSensitivity(level);
    }
  }, []);

  // Ensure full audio cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
    setSensitivity,
  };
}
