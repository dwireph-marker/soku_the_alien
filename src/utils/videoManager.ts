// Centralized Video Playback Manager to prevent multiple video streams,
// background memory leaks, and CPU throttling.

type VideoStopCallback = () => void;

class VideoPlaybackManager {
  private activeVideo: HTMLVideoElement | null = null;
  private unregisterCallbacks: Set<VideoStopCallback> = new Set();

  /**
   * Registers a video element as currently active and playing.
   * Automatically pauses and resets any previously playing video element.
   */
  public registerActive(video: HTMLVideoElement, onStopped?: VideoStopCallback): void {
    if (this.activeVideo && this.activeVideo !== video) {
      try {
        this.activeVideo.pause();
      } catch {
        // Fallback for detached elements
      }
    }

    this.activeVideo = video;

    if (onStopped) {
      this.unregisterCallbacks.add(onStopped);
    }
  }

  /**
   * Pauses all registered or active video players (e.g. when changing tabs or navigating)
   */
  public pauseAll(): void {
    if (this.activeVideo) {
      try {
        this.activeVideo.pause();
      } catch {
        // Safe catch
      }
      this.activeVideo = null;
    }

    this.unregisterCallbacks.forEach((cb) => {
      try {
        cb();
      } catch {
        // Ignore callback error
      }
    });
    this.unregisterCallbacks.clear();
  }

  /**
   * Cleans up reference when a video unmounts
   */
  public unregister(video: HTMLVideoElement): void {
    if (this.activeVideo === video) {
      try {
        video.pause();
      } catch {
        // Safe catch
      }
      this.activeVideo = null;
    }
  }
}

export const videoManager = new VideoPlaybackManager();
