export function isVideoUrl(url?: string, mediaType?: 'image' | 'video'): boolean {
  if (mediaType === 'video') return true;
  if (mediaType === 'image') return false;
  if (!url) return false;
  if (url.startsWith('data:video/')) return true;
  if (/\.(mp4|webm|ogg|mov|m4v|3gp|mkv)(\?.*)?$/i.test(url)) return true;
  return false;
}
