export interface MemoryItem {
  id: string;
  title: string;
  date: string;
  location: string;
  caption: string;
  imageUrl: string;
  imageFileId?: string;
  videoUrl?: string;
  videoFileId?: string;
  mediaType: 'image' | 'video';
  likes: number;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt?: string;
}
