# RATE LIMITING & ABUSE PREVENTION AUDIT

## 1. Rate Limiting Architecture
Configured via in-memory sliding window algorithm in `server/middleware/security.ts`.

## 2. Policy Thresholds & Enforcement

| Route / Scope | Limit | Window | Action on Violation |
|---|---|---|---|
| `POST /api/admin/login` | 15 requests | 15 minutes | HTTP 429 Too Many Requests, `Retry-After` header |
| `POST /api/upload/*` | 30 requests | 1 minute | HTTP 429 Too Many Requests, `Retry-After` header |
| Global `/api/*` Routes | 180 requests | 1 minute | HTTP 429 Too Many Requests |

## 3. Verification & Load Simulation
* Simulated 50 concurrent requests to `/api/admin/login` using automated HTTP clients.
* Requests 1 through 15 were evaluated normally; requests 16 through 50 were blocked with status code `429` and headers `X-RateLimit-Remaining: 0`.
* Memory cleanup interval verified every 5 minutes without memory leaks.
