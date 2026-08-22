export interface SavedAudioTrack {
  id: string;
  name: string;
  url: string;
  type?: 'uploaded' | 'preset' | 'custom' | string;
  originalFilename?: string;
  mimeType?: string;
  size?: number;
  dateAdded?: string;
  createdAt?: string;
  isActive?: boolean;
}

export interface MusicConfigData {
  bgMusicEnabled: boolean;
  bgMusicType: string;
  bgMusicPresetUrl: string;
  bgMusicCustomUrl: string;
  bgMusicCustomName: string;
  activeTrackId?: string;
  customAudioTracks?: SavedAudioTrack[];
  soundFxEnabled: boolean;
  updatedAt?: string;
}
