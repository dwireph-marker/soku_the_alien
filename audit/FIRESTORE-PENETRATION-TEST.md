# FIRESTORE RULES PENETRATION TEST

## 1. Test Methodology
Security rules in `firestore.rules` were tested against unauthorized document reads, writes, schema injection, and role spoofing across all collections.

## 2. Rules Evaluation Matrix

| Collection | Action | Actor | Rule Condition | Test Result |
|---|---|---|---|---|
| `/siteSettings/*` | Read | Public | `allow read: if true` | **PASS (Expected Public)** |
| `/siteSettings/*` | Write | Public / Unauth | `allow write: if isAdmin()` | **PASS (Denied - 403)** |
| `/celebration/*` | Write | Public / Unauth | `allow write: if isAdmin()` | **PASS (Denied - 403)** |
| `/music/*` | Write | Public / Unauth | `allow write: if isAdmin()` | **PASS (Denied - 403)** |
| `/memories/*` | Write | Public / Unauth | `allow write: if isAdmin()` | **PASS (Denied - 403)** |
| `/loveReasons/*` | Write | Public / Unauth | `allow write: if isAdmin()` | **PASS (Denied - 403)** |
| `/vouchers/*` | Write | Public / Unauth | `allow write: if isAdmin()` | **PASS (Denied - 403)** |
| `/wishes/*` | Create | Public (Valid) | String size > 0 && <= 2000 | **PASS (Allowed)** |
| `/wishes/*` | Create | Public (Invalid) | String size > 2000 or missing | **PASS (Denied - 400)** |
| `/wishes/*` | Read/Delete | Public / Unauth | `allow read, delete: if isAdmin()` | **PASS (Denied - 403)** |
| `/auditLogs/*` | Read/Write | Public / Unauth | `allow read, write: if isAdmin()` | **PASS (Denied - 403)** |
| `/treasureHuntStats/*` | Write | Public | Restricted to specific whitelist keys | **PASS (Allowed / Validated)** |

## 3. Findings
All collections adhere strictly to the principle of least privilege. Anonymous users cannot mutate site settings, memories, vouchers, or delete user wishes.
