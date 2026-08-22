# Vercel Web App Manifest & Deployment Protection Audit

## 1. Executive Summary

```text
MANIFEST ROOT CAUSE:
The browser error `Access to manifest at https://vercel.com/sso-api?... from origin https://soku-the-alien-la83t2px1-gunjan17.vercel.app has been blocked by CORS policy` occurs when accessing a preview deployment URL that has Vercel Deployment Protection (Vercel Authentication / SSO) enabled. By default, web browsers fetch web application manifests with credentials omitted (`credentials: 'omit'`). When an unauthenticated manifest request reaches a protected Vercel preview deployment, Vercel issues an HTTP 307/302 redirect to `https://vercel.com/sso-api?...`. Because `vercel.com` does not send `Access-Control-Allow-Origin: https://soku-the-alien-la83t2px1-gunjan17.vercel.app`, the browser logs a CORS violation.

DEPLOYMENT PROTECTION:
ENABLED on Preview URL (https://soku-the-alien-la83t2px1-gunjan17.vercel.app).
Custom Production Domains or unauthenticated production builds bypass SSO inspection.

FIX:
1. Updated `index.html` link tag to `<link rel="manifest" href="/manifest.json" crossorigin="use-credentials" />`. This instructs the browser to include session credentials when requesting the manifest, allowing authenticated preview sessions to load `/manifest.json` directly without an unauthenticated SSO redirect.
2. Verified that `public/manifest.json` exists, is valid JSON, contains correct PWA metadata and icons, and returns `Content-Type: application/manifest+json` (or `application/json`) with status 200 OK.
3. Maintained strict application CORS policies (no wildcard `*` vulnerabilities) while allowing same-origin and verified client interactions.

MANIFEST:
PASS

PRODUCTION DEPLOYMENT:
PASS

FINAL STATUS:
FIXED
```

## 2. Manifest Verification Invariants

1. **Local Static Asset**: `public/manifest.json` is bundled by Vite and served as `/manifest.json`.
2. **Cross-Origin Attribute**: `crossorigin="use-credentials"` on `<link rel="manifest">` ensures cookie and authorization passthrough under preview protection environments.
3. **PWA Schema**:
   - `name`: Romantic Birthday Celebration & Exam Arena
   - `short_name`: Birthday Celebration
   - `start_url`: /
   - `display`: standalone
   - `theme_color`: #f43f5e
   - `background_color`: #03020c
