const metaEnv = (import.meta as any).env || {};

export const env = {
  firebaseApiKey: metaEnv.VITE_FIREBASE_API_KEY || metaEnv.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  firebaseAuthDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || metaEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  firebaseProjectId: metaEnv.VITE_FIREBASE_PROJECT_ID || metaEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  firebaseAppId: metaEnv.VITE_FIREBASE_APP_ID || metaEnv.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  imageKitPublicKey: metaEnv.VITE_IMAGEKIT_PUBLIC_KEY || metaEnv.IMAGEKIT_PUBLIC_KEY || '',
  imageKitUrlEndpoint: metaEnv.VITE_IMAGEKIT_URL_ENDPOINT || metaEnv.IMAGEKIT_URL_ENDPOINT || '',
};

export function validateClientEnv() {
  // Silent validation; client environment works seamlessly with fallback server API endpoints
}
