# HTTP DEFENSIVE SECURITY AUDIT

## 1. Scope
Audits HTTP response headers, protocol handling, request parsing, and method override protections.

## 2. Defensive Security Headers Enforced

| Header | Value | Defensive Purpose | Status |
|---|---|---|---|
| `Content-Security-Policy` | `default-src 'self'; img-src 'self' data: https: blob:; media-src 'self' data: https: blob:; ...` | Prevents XSS, untrusted script execution & clickjacking | **ENFORCED** |
| `X-Content-Type-Options` | `nosniff` | Blocks MIME-type sniffing and executable polyglots | **ENFORCED** |
| `X-Frame-Options` | `SAMEORIGIN` | Blocks framing and clickjacking attacks | **ENFORCED** |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Prevents token/path leakage in Referer headers | **ENFORCED** |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | Disables unnecessary hardware APIs in the browser | **ENFORCED** |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups` | Isolates browsing context while allowing OAuth popups | **ENFORCED** |
| `X-Powered-By` | *Removed* | Conceals backend framework identity | **ENFORCED** |

## 3. Request Method & Parsing Protection
* **Method Confusion / Override**: Express router explicitly matches HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`). Unmatched verbs return `404 Not Found`.
* **Payload Size Ceiling**: JSON and URL-encoded body parsers strictly limit incoming payloads to `20mb` to protect against memory exhaustion attacks.
