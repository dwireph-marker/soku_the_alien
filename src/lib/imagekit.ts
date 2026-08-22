import { auth } from './firebase/client';

export interface ImageKitUploadResult {
  url: string;
  fileId: string;
  name: string;
  size: number;
}

export async function uploadToImageKit(
  file: File,
  folder: string = '/memories',
  onProgress?: (progress: number) => void
): Promise<ImageKitUploadResult> {
  let idToken = '';
  if (auth?.currentUser) {
    try {
      idToken = await auth.currentUser.getIdToken();
    } catch {
      // ignore
    }
  }

  const authRes = await fetch('/api/upload/imagekit-auth', {
    headers: {
      Authorization: idToken ? `Bearer ${idToken}` : ''
    }
  });

  if (!authRes.ok) {
    const errData = await authRes.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to obtain ImageKit authentication parameters from server.');
  }

  const authData = await authRes.json();

  if (!authData.signature || !authData.publicKey) {
    throw new Error('ImageKit configuration is missing on server. Upload aborted.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', file.name || `memory_${Date.now()}`);
  formData.append('publicKey', authData.publicKey);
  formData.append('signature', authData.signature);
  formData.append('expire', authData.expire.toString());
  formData.append('token', authData.token);
  formData.append('useUniqueFileName', 'true');
  formData.append('folder', `/romantic-birthday${folder}`);

  if (onProgress) onProgress(50);

  const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    body: formData
  });

  if (!uploadRes.ok) {
    const errJson = await uploadRes.json().catch(() => ({}));
    throw new Error(errJson.message || 'ImageKit file upload failed.');
  }

  const data = await uploadRes.json();
  if (onProgress) onProgress(100);

  return {
    url: data.url,
    fileId: data.fileId,
    name: data.name,
    size: data.size
  };
}
