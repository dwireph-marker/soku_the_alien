import { Request, Response, NextFunction } from 'express';
import { extractBearerToken } from './auth/bearer-token';
import { verifyFirebaseToken } from './auth/firebase-token';

export { verifyFirebaseToken as verifyFirebaseIdToken };

export async function optionalAdmin(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (token) {
    try {
      const verifiedUser = await verifyFirebaseToken(token);
      if (verifiedUser) {
        (req as any).adminUser = {
          uid: verifiedUser.uid,
          email: verifiedUser.email || '',
          isAdmin: true,
        };
      }
    } catch (e) {
      // optional admin token verification error ignored
    }
  }
  return next();
}

export async function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Bearer token' });
  }

  const verifiedUser = await verifyFirebaseToken(token);
  if (!verifiedUser) {
    return res.status(401).json({ error: 'Unauthorized: Firebase token verification failed' });
  }

  const configuredAdminUid = process.env.FIREBASE_ADMIN_UID?.trim();
  if (configuredAdminUid && configuredAdminUid.length > 0) {
    if (verifiedUser.uid !== configuredAdminUid) {
      return res.status(403).json({ error: 'Forbidden: User is not authorized as administrator' });
    }
  }

  (req as any).adminUser = {
    uid: verifiedUser.uid,
    email: verifiedUser.email || '',
    isAdmin: true,
  };

  return next();
}

export async function handleAdminLogin(req: Request, res: Response) {
  const tokenInBody = req.body?.idToken;
  const tokenInHeader = extractBearerToken(req);
  const idToken = tokenInBody || tokenInHeader;

  if (!idToken) {
    return res.status(400).json({ error: 'Firebase ID token is required for verification' });
  }

  const verifiedUser = await verifyFirebaseToken(idToken);
  if (!verifiedUser) {
    return res.status(401).json({ error: 'Invalid or expired Firebase ID token' });
  }

  const configuredAdminUid = process.env.FIREBASE_ADMIN_UID?.trim();
  if (configuredAdminUid && configuredAdminUid.length > 0) {
    if (verifiedUser.uid !== configuredAdminUid) {
      return res.status(403).json({ error: 'Forbidden: User is not authorized as administrator' });
    }
  }

  return res.json({
    success: true,
    user: {
      uid: verifiedUser.uid,
      email: verifiedUser.email || '',
      isAdmin: true,
    },
  });
}
