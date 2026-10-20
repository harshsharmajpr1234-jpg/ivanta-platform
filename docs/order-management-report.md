# iVanta Order Management System — Acceptance Walkthrough & Final Report

Date: 2026-09-26 · Backend: Spring Boot 3.3.4 / Java 21 / MariaDB (Flyway V1–V19) · Frontend: Next.js 14 / TypeScript strict / TanStack Query

---

## Part 1 — 34-step acceptance walkthrough

| # | Step | Where it lives | Verified |
|---|------|----------------|----------|
| 1 | Guest browses catalog | `/` , `/products` — server-paginated from DB, no login | ✅ HTTP 200 |
| 2 | Opens iPhone 17, picks 256GB variant | `/products/[slug]` — variants (color/storage/price/stock) from `product_variants` | ✅ |
| 3 | Adds to cart as guest | Zustand guest cart (localStorage); no auth toast; one action = one toast | ✅ |
| 4 | Starts checkout → asked to login | `/checkout` gates at identity step only | ✅ |
| 5 | Logs in — cart survives | Guest cart merged into server cart on login (merge API) | ✅ |
| 6 | Selects delivery address | Address book CRUD, checkout preview per address | ✅ |
| 7 | Serviceability checked by PIN code | `POST /checkout/preview` → `NOT_SERVICEABLE` guard (PIN M:N zones) | ✅ |
| 8 | Chooses delivery method | SM-0001 ₹49 / SM-0002 ₹199 / SM-0003 ₹399; free > ₹999 | ✅ |
| 9 | Totals computed by backend | Line prices, coupon, shipping, tax, grand total all server-side; frontend never trusted | ✅ |
| 10 | Chooses payment (UPI/CARD/…/COD) | `POST /payments/initiate` — amount read from `orders.grand_total` | ✅ |
| 11 | Payment verified server-side | HMAC recheck + amount-tamper guard; `provider_transaction_id` stored | ✅ |
| 12 | Order created with number `IVN-20260926-000001` | `IdService` via `id_sequences` (transaction-safe); shown on every screen | ✅ |
| 13 | Inventory reserved → committed | Place = reserve (15-min TTL); payment success = commit; failure = release; pre-ship cancel = restock; row locks, no overselling | ✅ |
| 14 | Customer sees "Order Placed" | `/account/orders` + detail — status from backend, payment `SUCCESS` | ✅ |
| 15 | Admin confirms | `/admin/orders/[id]` → CONFIRMED (ORDER_UPDATE, state-machine enforced) | ✅ |
| 16 | Processing | Same console → PROCESSING; `confirmedAt` stamped | ✅ |
| 17 | Packed | → PACKED (last manually-settable fulfilment status) | ✅ |
| 18 | Shipment + tracking number created | Ship dialog (PACKED only, DELIVERY_UPDATE) → `SHP-…` + `IVN…` tracking | ✅ |
| 19 | Order becomes Shipped | Shipment-driven — cannot be hand-set via status endpoint | ✅ |
| 20 | Tracking events added | `POST /admin/delivery/shipments/{id}/events` → `shipment_tracking_events` | ✅ |
| 21 | In Transit | Event/status `IN_TRANSIT` drives order + shipping_status mirror | ✅ |
| 22 | Out for Delivery | OFD event; customer may raise `CANCEL_REQUESTED` while in transit | ✅ |
| 23 | Delivered | DELIVERED event auto-chains missing intermediate statuses; `deliveredAt` stamped; replacement-order shipments also advance the original order | ✅ |
| 24 | My Orders auto-updates | TanStack Query invalidation; bottom-nav badge counts active orders | ✅ |
| 25 | Full timeline with real dates/times | `GET /orders/{id}/timeline` — merged STATUS/PAYMENT/SHIPMENT events; UI renders ✓/●/○ from data, nothing hardcoded (26 events seen on a full-lifecycle order) | ✅ |
| 26 | Invoice download | `GET /orders/{id}/invoice` — backend PDF (openhtmltopdf): seller block, `INV-YYYY-NNNNNN`, addresses, item snapshot, totals, payment method/ref; stored via StorageProvider; served `application/pdf` 3.7 KB through proxy | ✅ |
| 27 | Return if eligible | `returnEligible` computed from per-product/global window vs delivery date; `/returns/[id]` full status flow | ✅ |
| 28 | Return → refund tracked to completion | REQUESTED→…→REFUNDED mirrored on order (`RETURN_*`, `REFUND_INITIATED`, `REFUNDED`), refund row PENDING→SUCCESS with provider ref; partial refunds pro-rate coupon + return order to DELIVERED | ✅ |
| 29 | Replacement flow | Request (DELIVERED + window) → admin approve with inventory re-check under locks → zero-total replacement order auto-generated (snapshot copied) → ship/deliver advances `REPLACEMENT_*` | ✅ |
| 30 | Cancellation pre-ship | Customer direct cancel PENDING_PAYMENT…PROCESSING; post-ship → CANCEL_REQUESTED; admin approve/reject | ✅ |
| 31 | Notifications for every event | All ORDER_*/RETURN_*/REFUND_*/REPLACEMENT_* emit via NotificationProvider interface; bell + `/account/notifications` (list, mark read, mark all; `{notifications, unreadCount}`) | ✅ 30 in one smoke run |
| 32 | Admin console gating | 8 roles / 21 permissions enforced in backend (`@RequiresPermission`); hidden routes ≠ security; nav filtered by permissions client-side | ✅ |
| 33 | Audit trail | ORDER_CREATED/CONFIRMED/STATUS_CHANGED/CANCELLED, PAYMENT_CONFIRMED, SHIPMENT_CREATED, TRACKING_UPDATED, ORDER_DELIVERED, RETURN_*, REFUND_* with actor/action/entity/old/new/time/IP/UA; append-only `order_status_history` + `audit_logs` | ✅ |
| 34 | History never disappears | Soft deletes only; completed orders, item/price/address snapshots, payment and status history permanently queryable | ✅ |

## Part 2 — Final 12-item report

**1. Existing project inspected first; design preserved.** All work extends the existing iVanta Next.js frontend (branding, tokens `bg-surface`/`text-ink-*`/`border-line`, UI kit, layout, navigation) and the existing Spring Boot layered backend. No page was replaced with a placeholder; buyback-era admin leftovers were rewritten, everything else extended in place.

**2. Business model (SPEC v4).** iVanta sells Apple products; customers buy. No sell-your-device/buyback/seller-portal code paths exist in the order system.

**3. Data model.** Flyway V18 (order-management upgrade) + V19 (fix), immutable once applied: `orders` (order_number, payment_status, shipping_status, lifecycle stamps), permanent `order_items` snapshot (name/SKU/variant/color/storage/unit price/discount/tax/final), `order_status_history`, immutable address snapshot, `shipments`, `shipment_tracking_events`, `order_notes`, `order_documents`, `invoices`, `replacements`.

**4. State machine.** Exactly the 24 specified statuses; `OrderStateMachine.canTransition` + admin guard make payment-driven, shipment-driven and return/refund/replacement statuses impossible to hand-set; invalid transitions rejected with history rows only on legal moves. Unit-tested.

**5. Order numbers.** Human-friendly `IVN-YYYYMMDD-NNNNNN` generated transaction-safely (`id_sequences` + `LAST_INSERT_ID(expr)`), returned in every list/detail/shipment/notification and shown everywhere in the UI; internal PKs stay separate.

**6. Inventory & payments integrity.** Reserve→commit/release lifecycle with TTL and row locks (no overselling); payment success never trusts the frontend (server HMAC verify, amount-tamper guard, `provider_transaction_id` persisted); payment retry after `PAYMENT_FAILED` re-reserves stock; COD collected only post-delivery.

**7. Cancellation / returns / refunds / replacements.** Pre-ship window configurable; post-ship cancel-request with admin approve/reject; returns window per product override with enforced deadline; 9-state return machine mirroring onto the order; refunds PENDING/PROCESSING/SUCCESS/FAILED with provider reference, coupon-discount pro-ration, penny-adjusted so refunds can never exceed captured; replacements generate a real zero-total order under inventory locks.

**8. Notifications.** Every lifecycle event emits through provider interfaces (in-app now; email/SMS/push swappable); bell dropdown + full `/account/notifications` page with unread styling, mark-read, mark-all; server-side unread count.

**9. Customer pages.** `/account/orders` (image, name, variant, qty, amount, status, expected delivery, payment status, actions: view/track/cancel/return/replace/invoice), `/account/orders/[orderId]` (detail + real timeline), returns/replacements status pages, mobile bottom-nav with live active-orders badge.

**10. Admin console.** Permission-gated sidebar; dashboard (16 KPI tiles: revenue today/week/month, orders per status incl. returns/refunds/replacements, low/out-of-stock; 14-day revenue chart; status distribution; payment methods; top products); `/admin/orders` with 15 tabs, search (order id/number, customer, email, phone, SKU, product, tracking number), payment-status and date filters, server pagination; `/admin/orders/[orderId]` full console — advance/ship/cancel dialogs with reasons, tracking-event entry, merged timeline, after-sales panel, internal notes, append-only ledger, customer/address/payment rails.

**11. Security & transactions.** RBAC 8 roles × 21 permissions backend-enforced; IDOR-safe customer endpoints (other users' orders → NOT_FOUND); HTTP-only cookies; no secrets in code (env only); CORS never wildcard; `@Transactional` on create/reserve/confirm/cancel/inventory/refund/replacement; optimistic locking; soft deletes; audit with IP/UA.

**12. Verification.** Backend **123/123 tests green**; E2E smoke (`smoke-orders.sh`) exercises the full lifecycle incl. returns→refund, cancel paths, replacement order generation, invoice PDF, stats and 30 notifications — **full pass against the running jar**; frontend `tsc --noEmit` **clean**; all customer + admin routes compile and serve 200 through the dev proxy; admin/customer auth, IDOR guard, new OrderDetail fields (`shippingMethodName='Standard Delivery'`, contactEmail/Phone, customerNote) and PDF invoice verified live through `http://localhost:3000/api/v1`.

### §31 endpoint-verb compliance (added 2026-09-26)
The spec's exact API surface is now served alongside the existing routes:
`POST /payments/create` (alias of `/initiate`), `POST /payments/verify` with `{paymentId, reference}` body,
`PATCH /notifications/{id}/read`, `PATCH /admin/orders/{id}/status`, and
`PATCH /admin/orders/{id}/tracking` (appends an event to the order's latest shipment).
All five verified live end-to-end: create → verify → CONFIRMED → PROCESSING → PACKED → ship → tracking alias → `IN_TRANSIT`.

### Regression found & fixed (2026-10-03)
The §31 tracking-alias insertion had accidentally detached `@Transactional` from
`DeliveryService.addEvent`, so the DELIVERED auto-advance chain committed each hop separately;
the second `orders.save()` hit `StaleObjectStateException` (@Version) → HTTP 500 and orders
stranded at `IN_TRANSIT`/`OUT_FOR_DELIVERY`. Fixed by restoring `@Transactional` on `addEvent`
(+ keeping it on `addEventForOrder`); added `DeliveryServiceEventTest` (annotation guard +
multi-hop chain tests). Suite now **126/126**; stranded orders repaired; smoke scenario D
(replacement) green again. Lesson: run `mvn test` with backend/frontend STOPPED on this 2GB box.

### How to run
```bash
# DB (XAMPP MySQL or MariaDB), then:
cd backend && mvn -q -DskipTests package
DB_HOST=127.0.0.1 DB_PORT=3306 DB_NAME=ivanta DB_USERNAME=*** DB_PASSWORD=*** \
  java -jar target/ivanta-backend-1.0.0.jar
cd ../frontend && npm install && npm run dev   # http://localhost:3000
```
Dev admin: `ADMIN_ROOT_EMAIL` / `ADMIN_ROOT_PASSWORD` env (seeded demo admins behind `DEV_SEED_DEMO_ADMINS`). Preview: https://3000-iswcuq7o6unom0ropq7zv.e2b.app
