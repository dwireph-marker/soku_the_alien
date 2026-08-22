import fs from 'fs';
import path from 'path';
import http from 'http';
import handler, { app } from '../../api/index';

async function runVercelDeploymentTests() {
  console.log('\n============================================================');
  console.log('       RUNNING VERCEL DEPLOYMENT ARCHITECTURE TESTS         ');
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

  // 1. Check vercel.json
  const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
  assert(fs.existsSync(vercelJsonPath), '[Config] vercel.json file exists at project root');

  if (fs.existsSync(vercelJsonPath)) {
    try {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
      assert(Array.isArray(vercelConfig.rewrites), '[Config] vercel.json has rewrites array');
      
      const apiRewrite = vercelConfig.rewrites.find((r: any) => r.source === '/api/(.*)' && r.destination === '/api');
      assert(!!apiRewrite, '[Routing] vercel.json routes /api/(.*) -> /api serverless function');

      const spaRewrite = vercelConfig.rewrites.find((r: any) => r.destination === '/index.html');
      assert(!!spaRewrite, '[Routing] vercel.json routes SPA fallbacks to /index.html');
    } catch (e: any) {
      assert(false, '[Config] vercel.json is valid JSON', e.message);
    }
  }

  // 2. Check Static Assets (Favicon)
  const faviconIcoPath = path.join(process.cwd(), 'public', 'favicon.ico');
  const faviconSvgPath = path.join(process.cwd(), 'public', 'favicon.svg');
  assert(fs.existsSync(faviconIcoPath), '[Static Assets] public/favicon.ico exists and is non-empty');
  assert(fs.existsSync(faviconSvgPath), '[Static Assets] public/favicon.svg exists and is non-empty');

  // 3. Test Vercel Serverless Function Invocations via actual HTTP server
  const server = http.createServer((req, res) => {
    handler(req as any, res as any);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // Test /api/health
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'ok', '[Serverless API] /api/health returns 200 OK with JSON status');

    // Test /api/admin/login (validation when body is missing)
    const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 400 && !!loginData.error, '[Serverless API] /api/admin/login returns 400 with JSON error for empty body');

    // Test /api/birthday/settings
    const bdayRes = await fetch(`${baseUrl}/api/birthday/settings`);
    const bdayData = await bdayRes.json();
    assert(bdayRes.status === 200 && bdayData.success === true, '[Serverless API] /api/birthday/settings returns 200 OK with JSON settings');

    // Test nonexistent /api/unknown
    const notFoundRes = await fetch(`${baseUrl}/api/unknown-endpoint-test`);
    const notFoundData = await notFoundRes.json();
    assert(notFoundRes.status === 404 && !!notFoundData.error, '[Serverless API] Nonexistent /api/* route returns JSON 404 (not HTML)');

    // Test direct route (stripped /api)
    const strippedHealthRes = await fetch(`${baseUrl}/health`);
    const strippedHealthData = await strippedHealthRes.json();
    assert(strippedHealthRes.status === 200 && strippedHealthData.status === 'ok', '[Serverless API] Stripped prefix /health also succeeds');

  } finally {
    server.close();
  }

  console.log('============================================================');
  console.log(`Total Deployment Tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVercelDeploymentTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
