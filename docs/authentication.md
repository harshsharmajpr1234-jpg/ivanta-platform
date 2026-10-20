# iVanta — Authentication, Sessions & RBAC

All auth is **backend-enforced** with HTTP-only session cookies. Hidden frontend
routes are UX, never security: every `/api/v1/admin/**` call is checked against
the session and the permission matrix by Spring Security (`@PreAuthorize`), and
every customer call resolves ownership server-side (IDOR-safe).

---

## 1. Customer authentication (`/api/v1/auth`)

| Endpoint | Purpose |
|---|---|
| `POST /auth/register` | Name + email + phone + password (BCrypt-hashed). Issues a session cookie. |
| `POST /auth/login` | Identifier (email **or** phone) + password. Uniform `Invalid credentials` error — no user enumeration. |
| `POST /auth/request-otp` | Sends a 6-digit OTP to phone/email via the notification provider. With `DEV_OTP_CODE` set, the fixed code is returned in the response (dev only). |
| `POST /auth/verify-otp` | Verifies the OTP; auto-registers unknown identifiers when a name is supplied. |
| `GET /auth/me` | Current profile. |
| `POST /auth/logout` | Revokes the session server-side and clears the cookie. |

- Passwords: BCrypt (strength 10), never logged, never returned by any DTO.
- OTP codes: hashed at rest, single-use, short TTL, attempt-limited.
- Sessions: opaque random token → `user_sessions` row (user, expiry, IP,
  user-agent). Validated on every request by `SessionAuthFilter`; expired rows
  are ignored and pruned. TTL: `USER_SESSION_TTL_MINUTES` (default 30 days).
- Cookie: `IVANTA_USER_SESSION`, **HttpOnly**, `SameSite=Lax`, `Secure` when
  `COOKIE_SECURE=true`, `Path=/api/v1`.

## 2. Admin authentication (`/api/v1/admin/auth`)

| Endpoint | Purpose |
|---|---|
| `POST /admin/auth/login` | Email + password. Returns `requireOtp: true` (no session) when 2FA is enabled for the account. |
| `POST /admin/auth/login/2fa` | Completes login with the OTP for a 2FA-enabled account. |
| `GET /admin/auth/me` | Profile + role + effective permission list (drives the admin UI). |
| `POST /admin/auth/refresh` | Extends the session before expiry. |
| `POST /admin/auth/change-password` | Requires the current password. |
| `POST /admin/auth/logout` | Revokes the admin session. |

Protections:
- **Lockout:** every failure is recorded in `login_attempts`; after
  `MAX_LOGIN_FAILURES` (default 5) the account locks for `LOCKOUT_MINUTES`
  (default 15) → API returns `RATE_LIMITED`. Locked accounts refuse even the
  correct password until the lock expires; a successful login resets the counter.
- **2FA-ready:** `admin_users.two_factor_enabled` gates login behind an OTP step
  (TOTP/SMS providers plug into the same notification interfaces).
- Session cookie: `IVANTA_ADMIN_SESSION`, HttpOnly, SameSite=Lax, TTL
  `ADMIN_SESSION_TTL_MINUTES` (default 120), separate from the customer session.
- Bootstrap: the root SUPER_ADMIN is created on first boot from
  `ADMIN_ROOT_EMAIL` / `ADMIN_ROOT_PASSWORD` env vars — **no seeded passwords**.

## 3. RBAC — 8 roles × 22 permissions

Permissions are stored in `roles` / `permissions` / `role_permissions` (Flyway
V2) and resolved per session. `SUPER_ADMIN` is additionally a **wildcard in
code** (`PermissionResolver`), so it can never be locked out of a module.

| Permission | SA | PM | IM | OM | FM | DM | CS | MM |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| PRODUCT_CREATE | ✓ | ✓ | | | | | | |
| PRODUCT_UPDATE | ✓ | ✓ | | | | | | |
| PRODUCT_DELETE¹ | ✓ | ✓ | | | | | | |
| PRODUCT_ARCHIVE | ✓ | ✓ | | | | | | |
| INVENTORY_VIEW | ✓ | | ✓ | | | ✓ | | |
| INVENTORY_UPDATE | ✓ | | ✓ | | | | | |
| ORDER_VIEW | ✓ | | | ✓ | ✓ | ✓ | ✓ | |
| ORDER_UPDATE | ✓ | | | ✓ | | | ✓ | |
| ORDER_CANCEL | ✓ | | | ✓ | | | | |
| PAYMENT_VIEW | ✓ | | | | ✓ | | ✓ | |
| REFUND_PROCESS | ✓ | | | | ✓ | | | |
| CUSTOMER_VIEW | ✓ | | | ✓ | | | ✓ | ✓ |
| CUSTOMER_UPDATE | ✓ | | | | | | ✓ | |
| DELIVERY_VIEW | ✓ | | ✓ | ✓ | | ✓ | | |
| DELIVERY_UPDATE | ✓ | | | ✓ | | ✓ | | |
| COUPON_MANAGE | ✓ | | | | | | | ✓ |
| REVIEW_MODERATE | ✓ | ✓ | | | | | | ✓ |
| LOCATION_MANAGE | ✓ | | | | | | | |
| REPORT_VIEW | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ |
| AUDIT_VIEW | ✓ | | | | | | | |
| SETTINGS_UPDATE | ✓ | | | | | | | |

Roles: **SA** SUPER_ADMIN · **PM** PRODUCT_MANAGER · **IM** INVENTORY_MANAGER ·
**OM** ORDER_MANAGER · **FM** FINANCE_MANAGER · **DM** DELIVERY_MANAGER ·
**CS** CUSTOMER_SUPPORT · **MM** MARKETING_MANAGER

¹ `PRODUCT_DELETE` is refused (`CONFLICT`) whenever the product has order
history — archive (`PRODUCT_ARCHIVE`, soft delete) is the only path for sold
products. Nothing business-critical is ever hard-deleted.

Enforcement examples:
- `@PreAuthorize("hasAuthority('ORDER_UPDATE')")` on
  `POST /admin/orders/{id}/status`.
- Status transitions themselves are guarded by `OrderStateMachine` — admins can
  never set `PAID` directly (only server-side payment verification can) nor
  jump `PROCESSING → DELIVERED` (delivery events drive that).
- Customer endpoints filter by `user_id` from the session principal, not from
  request parameters (IDOR-safe: `/orders/{id}` of another customer → 404).

## 4. CSRF / CORS

- Cookies are `SameSite=Lax`; state-changing endpoints are JSON POST/PATCH/DELETE
  behind session auth, and CORS is restricted to explicit origins
  (`CORS_ALLOWED_ORIGINS`, default `http://localhost:3000`) with
  `allowCredentials=true` — never `*`.
- Rate limiting: login endpoints record attempts per account and IP; the
  lockout policy above applies. Additional per-IP throttling can be layered at
  the gateway in production.

## 5. Audit trail

Every security-relevant action writes an **immutable** `audit_logs` row (actor
type/id/name/role, action, entity, old/new value, IP, user-agent, timestamp):
admin logins/lockouts, order status changes, payment status changes, refunds,
returns, product/price edits, settings changes, customer updates. Read-only via
`GET /admin/audit-logs` (`AUDIT_VIEW`).
