# REDIS & IN-MEMORY CACHE SECURITY AUDIT

## 1. Scope & Architecture
* The application utilizes in-memory sliding-window rate limiters with automated 5-minute periodic unreferenced TTL garbage collection (`server/middleware/security.ts`).
* No external Redis ports or network sockets are exposed to the public internet.

## 2. In-Memory Cache Security
* **Key Injection**: Rate limiting keys derive from `req.ip` or validated `x-forwarded-for` strings. No user-supplied parameters are interpolated directly into key namespaces.
* **Memory Bounds**: Cleanup routine purges stale records every 300,000 ms, preventing memory exhaustion under distributed connection tests.
* **Multi-Instance Recommendation**: For distributed multi-instance Cloud Run deployments, transition rate limit storage to Upstash Redis with TLS connections and environment-isolated secret tokens.
