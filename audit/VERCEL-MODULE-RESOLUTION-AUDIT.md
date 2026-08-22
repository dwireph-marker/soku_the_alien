# Vercel Module Resolution & Function Architecture Audit

## 1. Diagnostic Summary

```text
ROOT CAUSE:
When deploying to Vercel with "type": "module" in package.json, Vercel's default @vercel/node builder transpiles TypeScript files in api/ (api/index.ts) using SWC without inlining local module dependencies from server/. The emitted JavaScript preserved the extensionless relative import `import { createExpressApp } from "../server/appFactory"`. Because Node.js native ECMAScript Module (ESM) resolution strictly forbids extensionless relative imports and does not resolve uncompiled TypeScript source files on the serverless container (/var/task), Node threw `ERR_MODULE_NOT_FOUND: Cannot find module '/var/task/server/appFactory' imported from /var/task/api/index.js`.

FAILING IMPORT:
server/appFactory

ACTUAL SOURCE FILE:
server/appFactory.ts (instantiated via server/serverless.ts and server.ts)

VERCEL ENTRY POINT:
api/index.js (bundled standalone ES module compiled from server/serverless.ts)

MODULE SYSTEM:
Bundled ESM for Serverless API (`api/index.js`) / Bundled CommonJS for Container Server (`dist/server.cjs`)

BUILD SYSTEM:
Vite (Frontend) + esbuild (Backend Bundler for server.ts and server/serverless.ts)

FILES CHANGED:
- server/serverless.ts (created clean TypeScript serverless entrypoint)
- api/index.js (bundled standalone ESM function containing server/appFactory and all backend routes)
- package.json (updated "build" script to bundle server/serverless.ts to api/index.js via esbuild)
- tests/deployment/vercel-deployment.test.ts (added comprehensive serverless route and bundle verification tests)
- audit/VERCEL-MODULE-RESOLUTION-AUDIT.md (created audit report)

VERCEL CONFIGURATION:
- vercel.json: rewrites `/api/(.*)` -> `/api` (resolving to `api/index.js`), `/(.*)` -> `/index.html`

LOCAL BUILD:
PASS

LOCAL API:
PASS

VERCEL FUNCTION:
PASS

PRODUCTION /api/health:
PASS

PRODUCTION /api/admin/login:
PASS

FIREBASE AUTH:
PASS

ADMIN AUTHORIZATION:
PASS

SECURITY REGRESSION:
PASS
```

## 2. Technical Architecture Details

### Before (Failing Architecture):
1. `api/index.ts` contained `import { createExpressApp } from '../server/appFactory'`.
2. Vercel built `api/index.ts` into `/var/task/api/index.js` retaining `import '../server/appFactory'`.
3. Serverless runtime crashed during cold start with `ERR_MODULE_NOT_FOUND`.

### After (Resolved Architecture):
1. Express application creation remains cleanly encapsulated in `server/appFactory.ts`.
2. `server/serverless.ts` acts as the TypeScript source for the serverless entry point.
3. The production build step (`npm run build`) runs `esbuild server/serverless.ts --bundle --platform=node --format=esm --packages=external --outfile=api/index.js`.
4. `api/index.js` is a completely self-contained ES module with all internal server routines inlined and all third-party npm packages (`express`, `firebase`, `multer`, `dotenv`) imported cleanly by package name.
5. Vercel deploys `api/index.js` directly, resolving `/api/*` requests with zero missing module errors and full compatibility with Node.js ESM runtime.
