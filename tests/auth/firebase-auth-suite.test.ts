import http from 'http';
import { createExpressApp } from '../../server/appFactory';
import { verifyFirebaseToken } from '../../server/auth/firebase-token';
import { formatFirebaseAuthError } from '../../src/lib/firebase';

async function runFirebaseAuthSuite() {
  console.log('\n============================================================');
  console.log('       RUNNING FIREBASE AUTHENTICATION AUDIT SUITE         ');
  console.log('============================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string, detail?: string) {
    if (condition) {
      console.log(`  \x1b[32m[PASS]\x1b[0m ${name}`);
      passed++;
    } else {
      console.log(`  \x1b[31m[FAIL]\x1b[0m ${name}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  const app = createExpressApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 1. Error Formatting Unit Tests
    const errCred = formatFirebaseAuthError({ code: 'auth/invalid-credential' });
    assert(errCred.code === 'auth/invalid-credential' && errCred.message.includes('Invalid email or password'), '[Error Mapping] auth/invalid-credential returns helpful user message');

    const errDis = formatFirebaseAuthError({ code: 'auth/user-disabled' });
    assert(errDis.code === 'auth/user-disabled' && errDis.message.includes('disabled'), '[Error Mapping] auth/user-disabled returns account disabled message');

    const errThrottled = formatFirebaseAuthError({ code: 'auth/too-many-requests' });
    assert(errThrottled.code === 'auth/too-many-requests' && errThrottled.message.includes('temporarily locked'), '[Error Mapping] auth/too-many-requests handles lockout cleanly');

    const errDomain = formatFirebaseAuthError({ code: 'auth/unauthorized-domain' });
    assert(errDomain.code === 'auth/unauthorized-domain' && errDomain.message.includes('domain is not authorized'), '[Error Mapping] auth/unauthorized-domain provides domain guidance');

    const errOp = formatFirebaseAuthError({ code: 'auth/operation-not-allowed' });
    assert(errOp.code === 'auth/operation-not-allowed' && errOp.message.includes('Email/Password sign-in is disabled'), '[Error Mapping] auth/operation-not-allowed alerts to provider config');

    // 2. Identity Toolkit Network & API Key Invariant Test
    const testApiKey = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyAqQIiCklhaOacTGR-LZC0kiPKQXtH_lV4';
    const idtRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${testApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent-admin-test@example.com',
        password: 'TestPassword123!',
        returnSecureToken: true,
      }),
    });
    const idtData = await idtRes.json();
    assert(
      idtRes.status === 400 && idtData.error?.message === 'INVALID_LOGIN_CREDENTIALS',
      '[Identity Toolkit API] Production API Key is active and reachable by Google Identity Toolkit'
    );

    // 3. Test 4: Missing Token to Protected Backend (401)
    const noTokenRes = await fetch(`${baseUrl}/api/upload/imagekit-auth`);
    assert(noTokenRes.status === 401, '[Test 4 - No Token] Protected endpoint returns 401 when no token is provided');

    // 4. Test 4b: Empty Login Payload (400)
    const emptyLoginRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(emptyLoginRes.status === 400, '[Test 4b - Empty Login] POST /api/admin/login returns 400 for empty body');

    // 5. Test 5: Expired / Forged Token (401)
    const forgedToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImZvcmdlZCJ9.eyJzdWIiOiIxMjM0NTYiLCJleHAiOjE1MTYyMzkwMjJ9.invalidSig';
    const forgedRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${forgedToken}`,
      },
      body: JSON.stringify({ idToken: forgedToken }),
    });
    assert(forgedRes.status === 401, '[Test 5 & 7 - Invalid/Expired Token] Backend rejects invalid/forged ID token with 401');

    // 6. Test 7b: verifyFirebaseToken handles malformed string safely
    const nullResult = await verifyFirebaseToken('');
    assert(nullResult === null, '[Token Verification] verifyFirebaseToken safely returns null for empty string');

    const nullResult2 = await verifyFirebaseToken('garbage-token-string');
    assert(nullResult2 === null, '[Token Verification] verifyFirebaseToken safely returns null for garbage string');

    // 7. Security Header Invariant on Auth Responses
    const healthCheck = await fetch(`${baseUrl}/api/health`);
    assert(healthCheck.headers.get('x-content-type-options') === 'nosniff', '[Defense] X-Content-Type-Options is nosniff');
    assert(healthCheck.headers.get('referrer-policy') === 'strict-origin-when-cross-origin', '[Defense] Referrer-Policy is strict-origin-when-cross-origin');

  } finally {
    server.close();
  }

  console.log('============================================================');
  console.log(`Total Auth Tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runFirebaseAuthSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
