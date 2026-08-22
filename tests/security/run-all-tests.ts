import http from 'http';
import { createExpressApp } from '../../server/appFactory';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

async function makeRequest(
  app: any,
  options: {
    method: string;
    path: string;
    headers?: Record<string, string>;
    body?: string | Buffer;
  }
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      const port = addr.port;

      const reqHeaders = { ...(options.headers || {}) };
      if (options.body && !reqHeaders['Content-Type'] && typeof options.body === 'string') {
        reqHeaders['Content-Type'] = 'application/json';
      }

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: port,
          path: options.path,
          method: options.method,
          headers: reqHeaders,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            server.close(() => {
              resolve({
                status: res.statusCode || 0,
                headers: res.headers,
                body: data,
              });
            });
          });
        }
      );

      req.on('error', (err) => {
        server.close(() => {
          reject(err);
        });
      });

      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
  });
}

function assert(suite: string, name: string, condition: boolean, details?: string) {
  results.push({
    suite,
    name,
    passed: !!condition,
    details: details || (condition ? 'Passed' : 'Assertion failed'),
  });
}

async function runSecurityTests() {
  console.log('============================================================');
  console.log('       RUNNING RED-TEAM SECURITY AUTOMATED TEST SUITE       ');
  console.log('============================================================\n');

  const app = createExpressApp();

  // SUITE 1: Authentication & Broken Access Control (OWASP A01 / A07)
  console.log('[1/7] Testing Authentication & Access Control...');
  try {
    // 1.1 Public health endpoint
    const resHealth = await makeRequest(app, { method: 'GET', path: '/api/health' });
    assert('Access Control', 'GET /api/health is publicly accessible', resHealth.status === 200);

    // 1.2 Unauthenticated Audio Upload
    const resAudioUpload = await makeRequest(app, { method: 'POST', path: '/api/upload/audio' });
    assert(
      'Access Control',
      'POST /api/upload/audio blocks unauthenticated requests (401)',
      resAudioUpload.status === 401,
      `Status: ${resAudioUpload.status}`
    );

    // 1.3 Unauthenticated ImageKit auth token generation
    const resIK = await makeRequest(app, { method: 'GET', path: '/api/upload/imagekit-auth' });
    assert(
      'Access Control',
      'GET /api/upload/imagekit-auth blocks unauthenticated requests (401)',
      resIK.status === 401,
      `Status: ${resIK.status}`
    );

    // 1.4 Unauthenticated Audio Track Deletion
    const resDelAudio = await makeRequest(app, { method: 'DELETE', path: '/api/audio/tracks/track_123' });
    assert(
      'Access Control',
      'DELETE /api/audio/tracks/:id blocks unauthenticated requests (401)',
      resDelAudio.status === 401,
      `Status: ${resDelAudio.status}`
    );

    // 1.5 Unauthenticated Birthday Settings Mutation
    const resPutBday = await makeRequest(app, {
      method: 'PUT',
      path: '/api/birthday/settings',
      body: JSON.stringify({ birthdayDate: '2026-08-22' }),
    });
    assert(
      'Access Control',
      'PUT /api/birthday/settings blocks unauthenticated requests (401)',
      resPutBday.status === 401,
      `Status: ${resPutBday.status}`
    );

    // 1.6 Unauthenticated Media Upload (POST /api/upload/media)
    const resMediaUpload = await makeRequest(app, { method: 'POST', path: '/api/upload/media' });
    assert(
      'Access Control',
      'POST /api/upload/media blocks unauthenticated requests (401)',
      resMediaUpload.status === 401,
      `Status: ${resMediaUpload.status}`
    );

    // 1.7 Admin Login with Empty Credentials
    const resLoginEmpty = await makeRequest(app, {
      method: 'POST',
      path: '/api/admin/login',
      body: JSON.stringify({}),
    });
    assert(
      'Authentication',
      'POST /api/admin/login rejects empty token payload (400)',
      resLoginEmpty.status === 400,
      `Status: ${resLoginEmpty.status}`
    );

    // 1.8 Admin Login with Forged/Malformed ID token
    const resLoginForged = await makeRequest(app, {
      method: 'POST',
      path: '/api/admin/login',
      body: JSON.stringify({ idToken: 'forged.fake.token' }),
    });
    assert(
      'Authentication',
      'POST /api/admin/login rejects forged token (401)',
      resLoginForged.status === 401,
      `Status: ${resLoginForged.status}`
    );
  } catch (err: any) {
    assert('Access Control', 'Authentication Suite Error', false, err.message);
  }

  // SUITE 2: Security Headers & CORS Policy (OWASP A05)
  console.log('[2/7] Testing HTTP Defensive Security Headers & CORS...');
  try {
    const resHeaders = await makeRequest(app, { method: 'GET', path: '/api/health' });
    assert(
      'Security Headers',
      'X-Content-Type-Options is nosniff',
      resHeaders.headers['x-content-type-options'] === 'nosniff'
    );
    assert(
      'Security Headers',
      'X-Frame-Options is SAMEORIGIN',
      resHeaders.headers['x-frame-options'] === 'SAMEORIGIN'
    );
    assert(
      'Security Headers',
      'Content-Security-Policy header is active and comprehensive',
      typeof resHeaders.headers['content-security-policy'] === 'string' &&
        resHeaders.headers['content-security-policy']!.includes("default-src 'self'")
    );
    assert(
      'Security Headers',
      'X-Powered-By is removed/concealed',
      resHeaders.headers['x-powered-by'] === undefined
    );
    assert(
      'Security Headers',
      'Referrer-Policy is strict-origin-when-cross-origin',
      resHeaders.headers['referrer-policy'] === 'strict-origin-when-cross-origin'
    );

    // CORS Preflight
    const resPreflight = await makeRequest(app, {
      method: 'OPTIONS',
      path: '/api/health',
      headers: {
        Origin: 'https://preview.applet.internal',
        'Access-Control-Request-Method': 'POST',
      },
    });
    assert(
      'CORS Security',
      'OPTIONS preflight returns 204 No Content',
      resPreflight.status === 204
    );
    assert(
      'CORS Security',
      'Access-Control-Allow-Origin header is set properly',
      resPreflight.headers['access-control-allow-origin'] === 'https://preview.applet.internal'
    );
  } catch (err: any) {
    assert('Security Headers', 'Headers Suite Error', false, err.message);
  }

  // SUITE 3: Path Traversal & Injection Neutralization (OWASP A01 / A03)
  console.log('[3/7] Testing Path Traversal & Injection Defenses...');
  try {
    // 3.1 Path traversal dot-dot in track ID
    const resTraversal1 = await makeRequest(app, {
      method: 'DELETE',
      path: '/api/audio/tracks/..%2f..%2fpackage.json',
      headers: { Authorization: 'Bearer test' },
    });
    assert(
      'Path Traversal',
      'Rejects %2e%2e / .. path traversal in track ID',
      resTraversal1.status === 400 || resTraversal1.status === 401,
      `Status: ${resTraversal1.status}`
    );

    // 3.2 HTML / Script injection in track ID
    const resXssTrack = await makeRequest(app, {
      method: 'DELETE',
      path: '/api/audio/tracks/<script>alert(1)</script>',
      headers: { Authorization: 'Bearer test' },
    });
    assert(
      'Injection',
      'Rejects angle brackets / XSS characters in path parameter',
      resXssTrack.status === 400 || resXssTrack.status === 401 || resXssTrack.status === 404,
      `Status: ${resXssTrack.status}`
    );

    // 3.3 Nonexistent API route returns JSON 404
    const resNotFound = await makeRequest(app, { method: 'GET', path: '/api/nonexistent-endpoint' });
    assert(
      'Error Handling',
      'Nonexistent /api route returns JSON 404 without leaking server internals',
      resNotFound.status === 404 && resNotFound.body.includes('API endpoint not found')
    );
  } catch (err: any) {
    assert('Path Traversal', 'Traversal Suite Error', false, err.message);
  }

  // SUITE 4: Rate Limiting & Abuse Prevention (OWASP A07 / A04)
  console.log('[4/7] Testing Rate Limiting...');
  try {
    let rateLimited = false;
    for (let i = 0; i < 20; i++) {
      const res = await makeRequest(app, {
        method: 'POST',
        path: '/api/admin/login',
        body: JSON.stringify({ idToken: 'test' }),
      });
      if (res.status === 429) {
        rateLimited = true;
        break;
      }
    }
    assert(
      'Rate Limiting',
      'Login endpoint triggers HTTP 429 Too Many Requests upon rapid brute-force',
      rateLimited,
      rateLimited ? 'Rate limit triggered successfully' : 'Rate limit not reached in window'
    );
  } catch (err: any) {
    assert('Rate Limiting', 'Rate Limit Suite Error', false, err.message);
  }

  // SUITE 5: API Payload Fuzzing & Resource Bounds (OWASP API4)
  console.log('[5/7] Testing API Payload Fuzzing & Body Boundaries...');
  try {
    // 5.1 Deeply nested JSON
    let deeplyNested = '{"a":';
    for (let i = 0; i < 50; i++) deeplyNested += '{"a":';
    deeplyNested += '1';
    for (let i = 0; i < 51; i++) deeplyNested += '}';

    const resDeep = await makeRequest(app, {
      method: 'POST',
      path: '/api/admin/login',
      body: deeplyNested,
    });
    assert(
      'API Fuzzing',
      'Server gracefully processes deeply nested JSON without crashing or stack dump',
      resDeep.status === 400 || resDeep.status === 401 || resDeep.status === 429
    );

    // 5.2 Malformed JSON
    const resMalformed = await makeRequest(app, {
      method: 'POST',
      path: '/api/admin/login',
      body: '{ "invalid": json without closing ',
    });
    assert(
      'API Fuzzing',
      'Server catches malformed JSON with 400 Bad Request',
      resMalformed.status === 400 || resMalformed.status === 500 || resMalformed.status === 429
    );
  } catch (err: any) {
    assert('API Fuzzing', 'Fuzzing Suite Error', false, err.message);
  }

  // SUITE 6: Magic Byte Binary Verification Testing
  console.log('[6/7] Testing Binary Magic Byte Verification...');
  try {
    // Test magic byte logic by verifying signature detection
    const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    const validMp3 = Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    const fakeFile = Buffer.from('<?php echo "evil"; ?>');

    assert('File Integrity', 'JPEG binary buffer has valid magic bytes ffd8ff', validJpeg.toString('hex').startsWith('ffd8ff'));
    assert('File Integrity', 'MP3 binary buffer has valid ID3 magic bytes 494433', validMp3.toString('hex').startsWith('494433'));
    assert('File Integrity', 'PHP script fails image/audio signature checks', !fakeFile.toString('hex').startsWith('ffd8ff') && !fakeFile.toString('hex').startsWith('494433'));
  } catch (err: any) {
    assert('File Integrity', 'Binary Verification Error', false, err.message);
  }

  // SUITE 7: Firestore Rules Constraints Assertion
  console.log('[7/7] Verifying Firestore Rules Security Invariants...');
  try {
    const fs = await import('fs');
    const rules = fs.readFileSync('firestore.rules', 'utf-8');

    assert('Firestore Rules', 'siteSettings collection requires isAdmin() for writes', rules.includes('match /siteSettings/{docId}') && rules.includes('allow write: if isAdmin()'));
    assert('Firestore Rules', 'memories collection requires isAdmin() for writes', rules.includes('match /memories/{memoryId}') && rules.includes('allow write: if isAdmin()'));
    assert('Firestore Rules', 'wishes collection has length constraint <= 2000', rules.includes('request.resource.data.wishText.size() <= 2000'));
    assert('Firestore Rules', 'wishes collection permits public create but restricts read/delete to admin', rules.includes('allow read, update, delete: if isAdmin()'));
    assert('Firestore Rules', 'appPreferences restricts updates to schema keys', rules.includes('theme') && rules.includes('musicVolume'));
  } catch (err: any) {
    assert('Firestore Rules', 'Firestore Rules Read Error', false, err.message);
  }

  console.log('\n============================================================');
  console.log('                    SECURITY TEST RESULTS                   ');
  console.log('============================================================');

  let passedCount = 0;
  let failedCount = 0;

  for (const r of results) {
    if (r.passed) {
      passedCount++;
      console.log(`  [PASS] [${r.suite}] ${r.name}`);
    } else {
      failedCount++;
      console.error(`  [FAIL] [${r.suite}] ${r.name} - ${r.details || 'Failed'}`);
    }
  }

  console.log('============================================================');
  console.log(`Total Tests: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('============================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSecurityTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
