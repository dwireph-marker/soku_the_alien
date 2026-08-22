import { signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './firebase/client';

export { auth };

export interface FirebaseAuthErrorInfo {
  code: string;
  message: string;
}

export function formatFirebaseAuthError(error: any): FirebaseAuthErrorInfo {
  const code = error?.code || 'auth/unknown';
  let message = 'Authentication failed. Please check your credentials.';

  switch (code) {
    case 'auth/invalid-credential':
      message = 'Invalid email or password. Please verify your credentials.';
      break;
    case 'auth/wrong-password':
      message = 'Incorrect password. Please try again.';
      break;
    case 'auth/user-not-found':
      message = 'No administrator account found with this email address.';
      break;
    case 'auth/invalid-email':
      message = 'The email address entered is not valid.';
      break;
    case 'auth/user-disabled':
      message = 'This administrator account has been disabled.';
      break;
    case 'auth/too-many-requests':
      message = 'Too many failed login attempts. Access temporarily locked for security. Please try again in a few minutes.';
      break;
    case 'auth/operation-not-allowed':
      message = 'Email/Password sign-in is disabled in Firebase. Please enable Email/Password in Firebase Console -> Authentication -> Sign-in method.';
      break;
    case 'auth/api-key-not-valid':
      message = 'Firebase API key is invalid or restricted. Please check your project configuration.';
      break;
    case 'auth/network-request-failed':
      message = 'Network error during authentication. Please check your internet connection.';
      break;
    case 'auth/unauthorized-domain':
      message = 'This domain is not authorized for Firebase Authentication. Please add it to Firebase Console -> Authentication -> Settings -> Authorized domains.';
      break;
    case 'auth/requires-recent-login':
      message = 'This action requires recent authentication. Please log in again.';
      break;
    default:
      if (error?.message && typeof error.message === 'string' && !error.message.includes('API key') && !error.message.includes('token')) {
        message = error.message.replace(/^Firebase:\s*/, '');
      }
      break;
  }

  return { code, message };
}

export async function loginAdmin(email: string, pass: string): Promise<{ uid: string; email: string; token: string }> {
  if (!auth) {
    throw new Error('Firebase Authentication is not configured on this client. Please configure VITE_FIREBASE_* environment variables.');
  }

  const cleanEmail = email.trim();
  if (!cleanEmail) {
    throw new Error('Email address is required.');
  }
  if (!pass) {
    throw new Error('Password is required.');
  }

  let userCredential;
  try {
    userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
  } catch (err: any) {
    const { code, message } = formatFirebaseAuthError(err);
    // Safe logging: log code only, never log passwords, tokens, or credentials
    console.warn(`[Auth] Firebase authentication failed: ${code}`);
    const error = new Error(message);
    (error as any).code = code;
    throw error;
  }

  const idToken = await userCredential.user.getIdToken(true);

  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: 'Authorization failed' }));
    await firebaseSignOut(auth).catch(() => {});
    const authError = new Error(errData.error || 'User authorization failed.');
    (authError as any).status = res.status;
    throw authError;
  }

  return {
    uid: userCredential.user.uid,
    email: userCredential.user.email || cleanEmail,
    token: idToken,
  };
}

export async function logoutAdmin(): Promise<void> {
  if (auth) {
    await firebaseSignOut(auth).catch(() => {});
  }
}

