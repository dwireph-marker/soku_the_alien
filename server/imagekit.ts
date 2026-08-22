import { Request, Response } from 'express';
import crypto from 'crypto';

export function handleImageKitAuth(req: Request, res: Response) {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || '';
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || '';

  if (!privateKey || !publicKey) {
    return res.status(500).json({
      error: 'ImageKit private or public key is not configured on server.'
    });
  }

  // Generate cryptographically secure random token
  const token = crypto.randomBytes(16).toString('hex');
  
  // Cap expiration strictly between 60 seconds and 3600 seconds (1 hour max)
  const nowUnix = Math.floor(Date.now() / 1000);
  const requestedExpire = parseInt(req.query.expire as string, 10);
  const expire = requestedExpire && requestedExpire > nowUnix && requestedExpire <= nowUnix + 3600 
    ? requestedExpire 
    : nowUnix + 1800; // default 30 min

  const signature = crypto
    .createHmac('sha1', privateKey)
    .update(token + expire)
    .digest('hex');

  return res.json({
    token,
    expire,
    signature,
    publicKey,
    urlEndpoint
  });
}

export async function deleteImageKitFile(fileId: string): Promise<boolean> {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
  if (!privateKey || !fileId) {
    return false;
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(privateKey + ':').toString('base64');
    const response = await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: authHeader
      }
    });
    return response.ok;
  } catch (err) {
    console.error('ImageKit delete file error:', err);
    return false;
  }
}
