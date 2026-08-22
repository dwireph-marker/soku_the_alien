# REDIS & IN-MEMORY CACHE SECURITY AUDIT

## 1. Scope & Architecture
The application primarily utilizes an in-memory sliding-window cache for rate limiting with automated background TTL sweeps (5-minute interval). Provisioning for Upstash Redis over REST (via `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`) was evaluated.

## 2. Key Structures & Security Posture
* **Key Namespacing**: Rate limiting keys use prefixed IP-based identifiers (`ratelimit:login:<ip>`, `ratelimit:upload:<ip>`).
* **TTL Expiration**: Every bucket key has a deterministic expiration time to prevent unbounded memory growth.
* **Command Injection**: Keys are strictly derived from sanitized IP addresses, preventing CRLF or Redis command injection.
* **REST Authentication**: When Upstash Redis is active, communication occurs exclusively over HTTPS using Bearer tokens; credentials are kept server-side in `.env`.

## 3. Verdict
Memory management and Redis cache patterns are secure against cache poisoning, memory exhaustion, and unauthenticated inspection.
