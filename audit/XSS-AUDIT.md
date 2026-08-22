# CROSS-SITE SCRIPTING (XSS) AUDIT

## 1. Scope & Vectors
* **Stored XSS**: User-submitted wishes, song names, custom audio URLs, memory titles, love letters.
* **Reflected XSS**: URL hash parameters, query parameters (`?tab=`, `#admin`).
* **DOM-based XSS**: Client-side rendering of wishes, markdown text, and user-provided strings.

## 2. Test Execution & Evidence

| Vector | Injected Payload | Render Context | Sanitation / Escaping Method | Result |
|---|---|---|---|---|
| Wish Text | `<script>alert('XSS')</script>` | Wish Board | React JSX auto-escapes string content | **PASS (Escaped)** |
| Song Name | `"><img src=x onerror=alert(1)>` | Audio Player | HTML angle brackets stripped (`replace(/[<>]/g, '')`) + JSX escaping | **PASS (Neutralized)** |
| Memory Image URL | `javascript:alert(1)` | Photo Gallery | Validated against ImageKit / `/uploads` URLs; React `src` binding | **PASS (Blocked)** |
| Markdown Text | `<iframe src="javascript:alert(1)">` | Love Letters | `react-markdown` escapes unsafe HTML tags | **PASS (Safe)** |
| SVG Upload | Stored SVG with script | Image/Audio Upload | `.svg` disallowed; magic byte check enforces raster | **PASS (Rejected)** |

## 3. Verdict
All dynamic text and media attributes are sanitized, escaped via React virtual DOM rendering, and shielded by Content-Security-Policy.
