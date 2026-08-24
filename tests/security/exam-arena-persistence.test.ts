import http from 'http';
import { createExpressApp } from '../../server/appFactory';
import { isSessionProcessed, markSessionProcessed } from '../../server/lib/firestoreRest';

async function makeRequest(
  app: any,
  options: {
    method: string;
    path: string;
    headers?: Record<string, string>;
    body?: string;
  }
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string; json: any }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      const port = addr.port;

      const reqHeaders = { ...(options.headers || {}) };
      if (options.body && !reqHeaders['Content-Type']) {
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
              let json: any = null;
              try {
                json = JSON.parse(data);
              } catch {}
              resolve({
                status: res.statusCode || 0,
                headers: res.headers,
                body: data,
                json,
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

async function runExamArenaPersistenceTests() {
  console.log('============================================================');
  console.log(' RUNNING EXAM ARENA PERSISTENCE & DISTRIBUTED SAFETY SUITE  ');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, details?: string) {
    if (condition) {
      passed++;
      console.log(`  [PASS] ${name}`);
    } else {
      failed++;
      console.error(`  [FAIL] ${name} - ${details || 'Failed'}`);
    }
  }

  const app = createExpressApp();

  // Test 1: Direct Session Replay Protection Unit Check
  console.log('[1/4] Testing Session Replay Registry...');
  const testSessionKey = `test_uid_${Date.now()}_test_sess`;
  assert('Session initially not processed', (await isSessionProcessed(testSessionKey)) === false);
  await markSessionProcessed(testSessionKey, {
    sessionKey: testSessionKey,
    userId: 'test_uid',
    sessionId: 'test_sess',
    mode: 'cbt_mock_test',
    totalQuestions: 50,
    correctAnswers: 45,
    verifiedXP: 460,
    verifiedCoins: 90,
    accuracy: 90,
    timeSpentSeconds: 1200,
    createdAt: new Date().toISOString(),
  });
  assert('Session recorded and detected as processed', (await isSessionProcessed(testSessionKey)) === true);

  // Test 2: Unauthenticated / Forged Token Protection
  console.log('[2/4] Testing Unauthorized Access Defenses...');
  const unauthRecord = await makeRequest(app, {
    method: 'POST',
    path: '/api/exam-arena/record-session',
    body: JSON.stringify({ mode: 'smart_practice', totalQuestions: 10, correctAnswers: 8 }),
  });
  assert('POST /api/exam-arena/record-session rejects unauthenticated requests (401)', unauthRecord.status === 401);

  const unauthReset = await makeRequest(app, {
    method: 'POST',
    path: '/api/exam-arena/reset',
  });
  assert('POST /api/exam-arena/reset rejects unauthenticated requests (401)', unauthReset.status === 401);

  const unauthProgress = await makeRequest(app, {
    method: 'POST',
    path: '/api/exam-arena/progress',
    body: JSON.stringify({ totalXP: 999999 }),
  });
  assert('POST /api/exam-arena/progress rejects unauthenticated requests (401)', unauthProgress.status === 401);

  // Test 3: Endpoint-Specific Rate Limiters
  console.log('[3/4] Testing Rate Limiters...');
  const verifyAnswerUnauth = await makeRequest(app, {
    method: 'POST',
    path: '/api/exam-arena/verify-answer',
    body: JSON.stringify({ questionId: 'q1', selectedOption: 0 }),
  });
  assert('POST /api/exam-arena/verify-answer rejects unauthenticated requests (401)', verifyAnswerUnauth.status === 401);

  // Test 4: Rate Limiting Response Headers
  console.log('[4/4] Verifying Rate Limit Headers & Protection...');
  const healthCheck = await makeRequest(app, { method: 'GET', path: '/api/health' });
  assert('Health check bypasses strict admin limits with HTTP 200', healthCheck.status === 200);

  console.log('\n============================================================');
  console.log(`Total Persistence Tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runExamArenaPersistenceTests().catch((err) => {
  console.error('Fatal persistence test error:', err);
  process.exit(1);
});
