import { Request, Response, NextFunction } from 'express';
import { extractBearerToken } from '../auth/bearer-token';
import { verifyFirebaseToken, AuthenticatedFirebaseUser } from '../auth/firebase-token';

export interface AuthenticatedRequest extends Request {
  firebaseUser?: AuthenticatedFirebaseUser;
}

export async function requireFirebaseAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Bearer token' });
  }

  const user = await verifyFirebaseToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired Firebase ID token' });
  }

  req.firebaseUser = user;
  return next();
}
