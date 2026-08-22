import 'dotenv/config';

export interface AuthenticatedFirebaseUser {
  uid: string;
  email?: string;
}

export async function verifyFirebaseToken(idToken: string): Promise<AuthenticatedFirebaseUser | null> {
  if (!idToken || typeof idToken !== 'string') {
    return null;
  }

  const apiKey =
    process.env.VITE_FIREBASE_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.FIREBASE_API_KEY ||
    '';

  if (!apiKey) {
    console.error('Firebase API key is missing on server for token verification.');
    return null;
  }

  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data && Array.isArray(data.users) && data.users.length > 0) {
      const user = data.users[0];
      return {
        uid: user.localId,
        email: user.email,
      };
    }
  } catch (err) {
    console.error('Error verifying Firebase ID token:', err);
  }

  return null;
}
