# CLOUD FIRESTORE SECURITY RULES AUDIT

## 1. Rule Architecture
Firestore security rules (`firestore.rules`) enforce granular Role-Based Access Control (RBAC) and schema validation across all Firestore collections.

## 2. Collection Security Analysis

| Collection | Read Permission | Create Permission | Update / Delete Permission | Schema / Size Constraints |
|---|---|---|---|---|
| `/siteSettings/{docId}` | Public | Admin Only | Admin Only | Strict admin control over countdown & theme |
| `/memories/{memoryId}` | Public | Admin Only | Admin Only | Photos and descriptions locked to admin |
| `/loveReasons/{reasonId}` | Public | Admin Only | Admin Only | Love notes locked to admin |
| `/vouchers/{voucherId}` | Public | Admin Only | Admin Only | Gift coupons locked to admin |
| `/wishes/{wishId}` | Admin Only | Public (Authenticated / Anonymous) | Admin Only | `wishText.size() <= 2000`; author name required |
| `/appPreferences/{userId}`| User / Admin | User / Admin | User / Admin | Constrained to `theme`, `musicVolume`, `snowEffect` |
| `/treasureHuntStats/{id}` | Public | Public | Admin Only | Strict status enum validations |
| `/auditLogs/{logId}` | Admin Only | Admin Only | Admin Only | Read/write strictly restricted to admin |

## 3. Penetration Test Results
* **Unauthorized Rule Writes**: Attempted anonymous writes to `/siteSettings/general` and `/memories/test` -> **REJECTED with `permission-denied`**.
* **Unbounded Text Write**: Attempted 50,000 byte payload to `/wishes/test` -> **REJECTED with `permission-denied`**.
* **Privilege Escalation**: Attempted injecting `isAdmin: true` in user documents -> **REJECTED**.
