# iVanta — Used Apple Device Acquisition Platform

iVanta **buys** used Apple devices (iPhone, iPad, Mac, Apple Watch, AirPods, accessories) directly from their owners. There is no customer storefront: no cart, no checkout, no product delivery. The public site exists to drive sellers through one journey — **instant estimate → free pickup → 16-point inspection → final offer → payout in 24 hours → device enters iVanta inventory**.

Built as a commercial-grade application: layered backend (Router → Services → Repositories → DB), a real MySQL schema as the source of truth, genuinely server-side admin authentication (scrypt hashes, HTTP-only cookies, lockouts, audit log), backend-enforced RBAC, append-only status histories, and soft deletes for all financial records.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npx tsc --noEmit   # strict typecheck
```

## Demo identities

**Sellers** (passwordless OTP — code `123456` for any email):

| Email | Notes |
| --- | --- |
| `user@ivanta.in` | Seeded with 4 sell requests across the pipeline (COMPLETED, OFFER_SENT, PICKUP_SCHEDULED, RETURNED) |
| any other email | Account auto-created on first OTP verification |

**Admins** (`/admin/login` — independent, server-side auth):

| Email | Password | Role | 2FA |
| --- | --- | --- | --- |
| `admin@ivanta.in` | `Admin@12345` | SUPER_ADMIN | yes (dev code `123456`) |
| `ops@ivanta.in` | `Ops@12345` | OPERATIONS_MANAGER | no |
| `inspection@ivanta.in` | `Inspect@123` | INSPECTION_MANAGER | no |
| `finance@ivanta.in` | `Finance@123` | FINANCE_MANAGER | no |
| `support@ivanta.in` | `Support@123` | SUPPORT_MANAGER | no |

> Development-only fallbacks. In production the root credential comes from `ADMIN_ROOT_EMAIL` / `ADMIN_ROOT_PASSWORD` (scrypt-hashed at boot, never sent to the browser); the remaining accounts would be provisioned in the `admin_users` table. 5 failed attempts ⇒ 15-minute lockout; every attempt is audit-logged with IP.

RBAC is enforced **server-side** (403 from the API, not just hidden links): `ROLE_PERMISSIONS` + `roleCan()` in `src/constants` are shared by the router and the UI.

## Architecture

```
src/
  app/
    (shop)/…            public site + sell wizard + seller account
    (admin)/admin/…     admin console (13 sections, permission-gated)
    admin/login/        standalone admin auth (outside console layout)
    api/v1/[...path]/   REAL Next.js Route Handlers — the HTTP layer
  server/
    router.ts           controller layer: route table + RBAC + transitions + audit
    db.ts               repository layer: in-memory store mirroring db/schema.sql + seed
    services/auth.ts    scrypt hashing, sessions (HTTP-only cookies), lockout, OTP
    services/valuation.ts  estimate & inspection-adjustment engine (server-side only)
  features/location/providers.ts  geocoding provider abstraction (dataset/Google/Mapbox/OSM swappable)
  lib/api/              typed client + path map (point NEXT_PUBLIC_API_BASE at Spring Boot later)
  store/, hooks/        Zustand stores (drafts/session cache) + data hooks
db/schema.sql           MySQL 8 DDL — 35 tables incl. *_status_history, offer_history,
                        payment_transactions, audit_logs, location many-to-many tables
```

- **The API is real.** Business data flows through `/api/v1/*` route handlers → server router → services → in-memory repositories shaped exactly like the MySQL DDL. Swapping in Spring Boot + MySQL later is a base-URL change; the frontend never holds production records.
- **Estimates are recomputed server-side** on submit — client-supplied prices are ignored.
- **Status chain** (19 states) with append-only `statusHistory` (timestamp + actor on every transition); illegal transitions are rejected with 409. Inspection completion auto-generates and sends the final offer (estimate ± itemised adjustment, floor at −40%). Acceptance creates the payout; success moves inventory to AVAILABLE and locks the acquisition price; decline returns the device free.
- **Financial records are never hard-deleted** — soft delete (`is_active`, `deleted_at`, `deleted_by`); audit logs capture who/what/entity/id/old→new/IP.
- **Location**: India hierarchy (states → districts → cities → localities/roads), PIN codes many-to-many with localities/post offices, smart suggest from 2 characters (exact → prefix PIN → prefix locality → popular ranking), PIN serviceability zones, geolocation behind a provider abstraction.

## Key flows to try

1. `/sell` → 7-step wizard (category → model/storage/colour → IMEI/serial/invoice/warranty → 14 condition questions + battery slider → 9 photo slots with type/size validation and progress → server-computed estimate with full breakdown → pickup address/slot + UPI/bank payout → `IVS-2026-00000X` confirmation).
2. Sign in as `user@ivanta.in` → `/account/sell-requests/IVS-2026-000002` → accept or decline the live offer; watch status, payment and notifications update.
3. `/admin/login` as `admin@ivanta.in` → Dashboard (8 KPI cards + charts + date ranges) → Inspection console (16-item Pass/Warn/Fail checklist → grade → auto offer) → Payments (PENDING → PROCESSING → SUCCESS with UTR) → Audit logs.
4. Sign in as `finance@ivanta.in` and note the nav shrink — then hit `/api/v1/admin/sell-requests` directly: **403**.

## Environment

| Var | Purpose |
| --- | --- |
| `ADMIN_ROOT_EMAIL` / `ADMIN_ROOT_PASSWORD` | Production super-admin seed (hashed with scrypt at boot) |
| `NEXT_PUBLIC_API_BASE` | Optional — point at the Spring Boot origin when it replaces the Next handlers |
| `NEXT_PUBLIC_GEO_PROVIDER` | `ivanta-dataset` (default) \| `google` \| `mapbox` \| `osm` |

## Design system

Original iVanta identity — off-white canvas, ink black, iVanta blue; no gradients/glassmorphism. Mobile-first with a bottom nav (Sell Now primary). Custom UI kit (`src/components/ui/*`), DataTable, Recharts-based analytics, and a parametric `DeviceArt` SVG engine — zero stock imagery.
