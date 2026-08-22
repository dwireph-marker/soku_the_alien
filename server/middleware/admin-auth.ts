import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, requireFirebaseAuth } from './firebase-auth';

export interface AdminRequest extends AuthenticatedRequest {
  adminUser?: {
    uid: string;
    email?: string;
    isAdmin: boolean;
  };
}

export function requireAdminUser(
  req: AdminRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.firebaseUser) {
    return res.status(401).json({ error: 'Unauthorized: Firebase authentication required' });
  }

  const configuredAdminUid = process.env.FIREBASE_ADMIN_UID?.trim();
  if (configuredAdminUid && configuredAdminUid.length > 0) {
    if (req.firebaseUser.uid !== configuredAdminUid) {
      return res.status(403).json({ error: 'Forbidden: User is not an authorized administrator' });
    }
  }

  req.adminUser = {
    uid: req.firebaseUser.uid,
    email: req.firebaseUser.email,
    isAdmin: true,
  };

  return next();
}

export const authenticateAdmin = [
  requireFirebaseAuth,
  requireAdminUser,
];
