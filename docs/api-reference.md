# iVanta API Reference — `/api/v1`

**Base URL:** `http://localhost:8080/api/v1` (env: `NEXT_PUBLIC_API_BASE`)

## Response envelope

```jsonc
// success
{ "success": true, "data": { ... } }

// error
{
  "success": false,
  "code": "OUT_OF_STOCK",
  "message": "Only 2 unit(s) available for iPhone 17",
  "fieldErrors": { "pincode": "PIN code must be 6 digits" }   // validation only
}
```

Paginated lists return `data: { content: [...], page, size, totalElements, totalPages }`.

**Error codes:** `VALIDATION_ERROR` · `UNAUTHORIZED` · `FORBIDDEN` · `NOT_FOUND` ·
`CONFLICT` · `INVALID_STATE` · `OUT_OF_STOCK` · `INVALID_COUPON` · `PAYMENT_FAILED` ·
`PAYMENT_VERIFICATION_FAILED` · `NOT_SERVICEABLE` · `ORDER_CANCELLED` ·
`RETURN_NOT_ALLOWED` · `RATE_LIMITED` · `INTERNAL_ERROR`

**Auth legend:** 🔓 public · 👤 customer session (`IVANTA_USER_SESSION`) ·
🛡️ admin session (`IVANTA_ADMIN_SESSION`) + permission in parentheses.

---

## Auth — `/auth`

| | Endpoint | Notes |
|---|---|---|
| 🔓 | `POST /auth/register` | `{name, email, phone, password}` → user + session cookie |
| 🔓 | `POST /auth/login` | `{identifier, password}` (email or phone) |
| 🔓 | `POST /auth/request-otp` | `{identifier, name?}` → OTP via notification provider |
| 🔓 | `POST /auth/verify-otp` | `{identifier, code, name?}` → session |
| 👤 | `GET /auth/me` | current customer |
| 👤 | `POST /auth/logout` | revoke session |

## Admin auth — `/admin/auth`

| | Endpoint | Notes |
|---|---|---|
| 🔓 | `POST /admin/auth/login` | `{email, password}` → `{authenticated, requireOtp}`; lockout after N failures |
| 🔓 | `POST /admin/auth/login/2fa` | complete 2FA login |
| 🛡️ | `GET /admin/auth/me` | profile + role + effective permissions |
| 🛡️ | `POST /admin/auth/refresh` | extend session |
| 🛡️ | `POST /admin/auth/change-password` | |
| 🛡️ | `POST /admin/auth/logout` | |

## Categories — `/categories`

| | Endpoint | Notes |
|---|---|---|
| 🔓 | `GET /categories` | full Apple hierarchy tree from DB with product counts |
| 🛡️ | `GET/POST /admin/categories`, `PATCH/DELETE /admin/categories/{id}` | (LOCATION_MANAGE-free; SUPER_ADMIN/PM) delete = only when empty |

## Products & search — `/products`

| | Endpoint | Notes |
|---|---|---|
| 🔓 | `GET /products` | `q, categoryId, brandId, minPrice, maxPrice, color, storage, sort(price_asc\|price_desc\|newest\|popular\|featured), page, size` — server-side pagination |
| 🔓 | `GET /products/featured` | featured carousel |
| 🔓 | `GET /products/{idOrSlug}` | detail: variants, images, specs, rating, price |
| 🔓 | `GET /products/slug/{slug}` | |
| 🔓 | `GET /products/{id}/related` | |
| 🔓 | `GET /products/{id}/availability` | live stock by variant |
| 🛡️ | `GET /admin/products/{id}` | full admin view (PRODUCT_VIEW via ORDER_VIEW-less read: any admin session) |
| 🛡️ | `POST /admin/products` | (PRODUCT_CREATE) |
| 🛡️ | `PATCH /admin/products/{id}` | (PRODUCT_UPDATE) |
| 🛡️ | `DELETE /admin/products/{id}` | archive — soft delete (PRODUCT_ARCHIVE) |
| 🛡️ | `DELETE /admin/products/{id}/hard` | (PRODUCT_DELETE) refused with `CONFLICT` if any order history |
| 🛡️ | `POST /admin/products/{id}/variants`, `PATCH /admin/products/variants/{variantId}` | (PRODUCT_CREATE/UPDATE) |
| 🛡️ | `PUT /admin/products/{id}/pricing` | (PRODUCT_UPDATE) writes price history |
| 🛡️ | `GET /admin/products/{id}/pricing/history` | append-only price trail |
| 🛡️ | `POST /admin/products/{id}/images`, `DELETE /admin/products/images/{imageId}` | storage-provider backed |
| 🛡️ | `POST /admin/products/{id}/specs`, `DELETE /admin/products/specs/{specId}` | |
| 🛡️ | `POST /admin/products/{id}/colors`, `POST /admin/products/{id}/storage-options` | picker option pools |

## Inventory — `/admin/inventory`

| | Endpoint | Notes |
|---|---|---|
| 🛡️ | `GET /admin/inventory` | (INVENTORY_VIEW) filter by warehouse/status/product |
| 🛡️ | `GET /admin/inventory/warehouses` | (INVENTORY_VIEW) |
| 🛡️ | `POST /admin/inventory/stock` | (INVENTORY_UPDATE) receive stock → movement |
| 🛡️ | `POST /admin/inventory/{id}/adjust` | (INVENTORY_UPDATE) cannot go below reserved qty |
| 🛡️ | `POST /admin/inventory/{id}/transfer` | (INVENTORY_UPDATE) between warehouses |
| 🛡️ | `GET /admin/inventory/{id}/movements` | append-only movement history |
| 🛡️ | `GET /admin/inventory/availability/{productId}` | across warehouses |

## Cart — `/cart`

| | Endpoint | Notes |
|---|---|---|
| 👤 | `GET /cart` | totals **always recomputed from DB prices** |
| 👤 | `POST /cart/items` | `{productId, variantId?, quantity}` → stock-validated |
| 👤 | `PATCH /cart/items/{id}` | change qty (re-validates stock) |
| 👤 | `DELETE /cart/items/{id}` | |
| 👤 | `DELETE /cart` | clear |

One cart row per customer (`carts.user_id` UNIQUE); a completed cart is reopened
when shopping resumes — order history lives in `order_items`, never in the cart.

## Wishlist — `/wishlist`

| | Endpoint | Notes |
|---|---|---|
| 👤 | `GET /wishlist` | |
| 👤 | `GET /wishlist/ids` | for heart-state hydration |
| 👤 | `POST /wishlist/{productId}` | toggle-add |
| 👤 | `DELETE /wishlist/{productId}` | |

## Location & serviceability — `/location`

| | Endpoint | Notes |
|---|---|---|
| 🔓 | `GET /location/search?q=` | 2-char minimum; ranked (exact > prefix > contains; popular boosted) across cities/localities/pincodes |
| 🔓 | `GET /location/pincodes/{code}` | PIN → cities, localities, post offices, serviceability |
| 🔓 | `GET /location/cities`, `GET /location/localities` | browse |
| 🔓 | `GET /location/serviceability?pin=` | zone, delivery charge, ETA days, shipping methods |
| 🔓 | `POST /location/reverse-geocode` | provider-backed (dataset default) |
| 🛡️ | `POST/PATCH /admin/location/cities…`, `POST /admin/location/localities`, `POST /admin/location/pincodes`, `GET/POST/PATCH /admin/location/zones` | (LOCATION_MANAGE) |

## Checkout — `/checkout`

| | Endpoint | Notes |
|---|---|---|
| 👤 | `POST /checkout/preview?addressId&shippingMethodId&couponCode&paymentMethod` | full server-side price computation: line items from live DB prices, coupon validation, shipping = method fee (free above threshold) + zone charge, tax; `NOT_SERVICEABLE` / `INVALID_COUPON` guards |

## Orders — `/orders`

| | Endpoint | Notes |
|---|---|---|
| 👤 | `POST /orders` | `{addressId, shippingMethodId, couponCode?, paymentMethod, customerNote?}` — assigns human-friendly **order number `IVN-YYYYMMDD-NNNNNN`**, reserves stock (TTL), snapshots prices/address/variant (incl. color + storage), records coupon usage; COD → `PLACED` (+`CONFIRMED` chain), prepaid → `PENDING_PAYMENT` |
| 👤 | `GET /orders?q&status&from&to&page&size` | own orders only; `q` matches order number/id, product name or SKU |
| 👤 | `GET /orders/{id}` | IDOR-safe: other customer's order → `NOT_FOUND`; accepts id **or** order number; includes `returnEligible`, `invoiceId`, lifecycle stamps, real `timeline` |
| 👤 | `GET /orders/{id}/timeline` | merged STATUS + PAYMENT + SHIPMENT events, chronological — rendered by the UI as the ✓/●/○ timeline |
| 👤 | `GET /orders/{id}/tracking` | shipment + carrier tracking events (own orders) |
| 👤 | `GET /orders/{id}/invoice` | **backend-rendered PDF** (openhtmltopdf): seller block from `invoice.seller_*` settings, invoice number `INV-YYYY-NNNNNN`, addresses, item snapshot, totals, payment method/ref; stored via StorageProvider + `invoices`/`order_documents` rows |
| 👤 | `POST /orders/{id}/cancel` | pre-ship (`PENDING_PAYMENT`/`PAYMENT_FAILED`/`PLACED`/`CONFIRMED`/`PROCESSING`) → immediate `CANCELLED` + release/restock + auto-refund chain (`REFUND_INITIATED → REFUNDED`); post-ship (`SHIPPED`/`IN_TRANSIT`/`OUT_FOR_DELIVERY`) → `CANCEL_REQUESTED` for admin decision |
| 🛡️ | `GET /admin/orders?q&status&paymentStatus&from&to` | (ORDER_VIEW) `q` searches order id/number, customer name/email/phone, product/SKU and shipment tracking number |
| 🛡️ | `GET /admin/orders/{id}` | (ORDER_VIEW) full detail incl. customer contact, notes (staff-only), history ledger |
| 🛡️ | `GET /admin/orders/{id}/timeline`, `GET /admin/orders/{id}/invoice` | (ORDER_VIEW) |
| 🛡️ | `PATCH /admin/orders/{id}/tracking` | (DELIVERY_UPDATE) `{status, description?, location?}` — appends a shipment tracking event to the order's latest shipment (alias of `POST /admin/delivery/shipments/{id}/events`) |
| 🛡️ | `POST /admin/orders/{id}/notes` | (ORDER_UPDATE) `{note}` → append-only `order_notes` |
| 🛡️ | `POST /admin/orders/{id}/status` (PATCH also accepted) | (ORDER_UPDATE) state-machine enforced; payment-driven (`PENDING_PAYMENT`/`PLACED`/`PAYMENT_FAILED`), shipment-driven (`SHIPPED`/`IN_TRANSIT`/`OUT_FOR_DELIVERY`/`DELIVERED`) and return/refund/replacement statuses can never be set by hand |
| 🛡️ | `POST /admin/orders/{id}/cancel` | (ORDER_CANCEL) also allowed from `PACKED` and to approve a `CANCEL_REQUESTED` |

Order lifecycle (24 statuses): `PENDING_PAYMENT → PLACED → CONFIRMED → PROCESSING →
PACKED → SHIPPED → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED`, then
`RETURN_REQUESTED → RETURN_APPROVED → RETURN_PICKUP_SCHEDULED → RETURN_PICKED_UP →
RETURN_RECEIVED → RETURN_INSPECTION → REFUND_INITIATED → REFUNDED` or
`REPLACEMENT_REQUESTED → REPLACEMENT_PROCESSING → REPLACEMENT_SHIPPED →
REPLACEMENT_DELIVERED`; failure paths: `PAYMENT_FAILED` (retryable), `CANCEL_REQUESTED`
(admin approves → `CANCELLED`, or rejects → delivery resumes), `CANCELLED →
REFUND_INITIATED → REFUNDED`. Every transition writes `order_status_history` + audit,
stamps lifecycle timestamps (`confirmedAt`/`shippedAt`/`deliveredAt`/`cancelledAt`)
and mirrors the denormalised `payment_status`/`shipping_status` columns. History is
append-only — orders and their snapshots are never deleted or overwritten.

## Payments — `/payments`

| | Endpoint | Notes |
|---|---|---|
| 👤 | `POST /payments/initiate` (alias `POST /payments/create`) | `{orderId, method: UPI\|CARD\|NETBANKING\|WALLET\|COD}` → allowed while `PENDING_PAYMENT`/`PAYMENT_FAILED`; amount read from `orders.grand_total` (never from client); retry after failure **re-reserves stock under lock**; mock provider returns HMAC `clientSecret` |
| 👤 | `POST /payments/{id}/verify` (alias `POST /payments/verify` with `{paymentId, reference}`) | `{reference}` — server-side HMAC recheck + amount-tamper guard. Success → stock consumed, order → `PLACED`, `paymentStatus=SUCCESS`. Failure → payment `FAILED`, stock released, order → **`PAYMENT_FAILED`** (retryable — re-`initiate` re-reserves stock), `PAYMENT_VERIFICATION_FAILED` persists |
| 👤 | `GET /payments`, `GET /payments/{id}` | own payments |
| 🛡️ | `GET /admin/payments` | (PAYMENT_VIEW) |
| 🛡️ | `GET /admin/payments/{id}/transactions` | (PAYMENT_VIEW) provider transaction log |
| 🛡️ | `POST /admin/payments/{id}/cod-collected` | (PAYMENT_VIEW) only after delivery; marks COD `SUCCESS` |

## Delivery — `/delivery`

| | Endpoint | Notes |
|---|---|---|
| 👤 | `GET /delivery/orders/{orderId}/tracking` | shipment + tracking timeline (own orders) |
| 🔓 | `GET /delivery/shipping-methods` | active methods with fees/ETA |
| 🛡️ | `GET /admin/delivery/shipments?status&orderId` | (DELIVERY_VIEW) |
| 🛡️ | `POST /admin/delivery/orders/{orderId}/ship` | (DELIVERY_UPDATE) requires `PACKED`; creates shipment (`SHP-…`, tracking `IVN…`), order → `SHIPPED` |
| 🛡️ | `POST /admin/delivery/shipments/{id}/events` | (DELIVERY_UPDATE) `{status, description?, location?}` — `IN_TRANSIT`/`OUT_FOR_DELIVERY`/`DELIVERED` drive order transitions + `deliveredAt`; `DELIVERED` auto-chains missing intermediate statuses; events on a **replacement order's** shipment also advance the original order's `REPLACEMENT_SHIPPED`/`REPLACEMENT_DELIVERED` |
| 🛡️ | `GET/POST /admin/delivery/shipping-methods`, `PATCH /admin/delivery/shipping-methods/{id}` | (DELIVERY_UPDATE) |

## Returns & refunds — `/returns`, `/refunds`

| | Endpoint | Notes |
|---|---|---|
| 👤 | `POST /returns` | `{orderId, reason, notes?, itemIds?}` — window-checked (per-product `return_window_days` override, else global `RETURN_WINDOW_DAYS`, counted from delivery), one open return per order; refund amounts **pro-rated with coupon discount**, full returns include shipping (penny-adjusted) so refunds can never exceed captured amount |
| 👤 | `GET /returns`, `GET /returns/{id}` | own returns |
| 👤 | `GET /refunds` | own refunds |
| 🛡️ | `GET /admin/returns?status&orderId` | (ORDER_VIEW) |
| 🛡️ | `POST /admin/returns/{id}/status` | `{status, inspectionNotes?}` — state machine: `REQUESTED → APPROVED → PICKUP_SCHEDULED → PICKED_UP → RECEIVED → INSPECTION → APPROVED_FOR_REFUND → REFUND_PROCESSING → REFUNDED/CLOSED`; rejections return the order to `DELIVERED`; `RECEIVED` restocks inventory; each step **mirrors onto the order** (`RETURN_APPROVED`/`RETURN_PICKUP_SCHEDULED`/`RETURN_PICKED_UP`/`RETURN_RECEIVED`/`RETURN_INSPECTION` → `REFUND_INITIATED` → full refund `REFUNDED`, partial refund back to `DELIVERED`) |
| 🛡️ | `GET /admin/refunds?orderId` | (PAYMENT_VIEW) provider-confirmed refund records; refund success also mirrors `orders.payment_status` (`REFUNDED`/`PARTIALLY_REFUNDED`) |

## Replacements — `/replacements`

| | Endpoint | Notes |
|---|---|---|
| 👤 | `POST /replacements` | `{orderId, orderItemId, reason}` — only while `DELIVERED` and inside the return window, one open replacement per order; order → `REPLACEMENT_REQUESTED` |
| 👤 | `GET /replacements`, `GET /replacements/{id}` | own replacements |
| 🛡️ | `GET /admin/replacements?status` | (ORDER_VIEW) |
| 🛡️ | `POST /admin/replacements/{id}/status` | (ORDER_UPDATE) `APPROVED` re-checks stock **under inventory locks** and generates a zero-total replacement order (immutable item + address snapshot, stock reserved & committed, auto-`CONFIRMED`→`PROCESSING`); original order → `REPLACEMENT_PROCESSING`. `REJECTED` → order back to `DELIVERED`. Shipping/delivering the replacement order advances `REPLACEMENT_SHIPPED`/`REPLACEMENT_DELIVERED` automatically |

## Coupons — `/coupons`

| | Endpoint | Notes |
|---|---|---|
| 👤 | `POST /coupons/validate` | `{code, amount}` → validity + exact discount (pct with max-discount cap / fixed, min-order, usage + per-user limits) |
| 🛡️ | `GET/POST /admin/coupons`, `PATCH /admin/coupons/{id}`, `GET /admin/coupons/{id}/usage` | (COUPON_MANAGE) |

## Reviews — `/reviews`

| | Endpoint | Notes |
|---|---|---|
| 🔓 | `GET /reviews/product/{productId}` | approved reviews + rating breakdown |
| 👤 | `POST /reviews` | `{productId, rating, title?, body?}` — `verifiedPurchase` computed from delivered-order history; verified → auto-approved, otherwise moderation queue; duplicates blocked |
| 👤 | `GET /reviews/me` | |
| 🛡️ | `GET /admin/reviews` | (REVIEW_MODERATE) pending queue |
| 🛡️ | `POST /admin/reviews/{id}/moderate` | (REVIEW_MODERATE) approve/reject → product rating aggregates recalculated |

## Notifications — `/notifications`

| | Endpoint | Notes |
|---|---|---|
| 👤 | `GET /notifications` | in-app inbox |
| 👤 | `POST /notifications/{id}/read`, `POST /notifications/read-all` | |

## Users & addresses — `/users/me`

| | Endpoint | Notes |
|---|---|---|
| 👤 | `GET /users/me`, `PATCH /users/me` | profile |
| 👤 | `GET/POST /users/me/addresses`, `PATCH/DELETE /users/me/addresses/{id}` | multiple addresses, types HOME/WORK/OTHER |
| 👤 | `POST /users/me/addresses/{id}/default` | |

## Admin — customers, stats, settings, audit

| | Endpoint | Notes |
|---|---|---|
| 🛡️ | `GET /admin/customers` | (CUSTOMER_VIEW) order counts + lifetime spend |
| 🛡️ | `PATCH /admin/customers/{id}` | (CUSTOMER_UPDATE) rename / soft-disable |
| 🛡️ | `GET /admin/admins`, `GET /admin/admins/roles`, `GET /admin/admins/permissions`, `POST /admin/admins`, `PATCH /admin/admins/{id}` | (SUPER_ADMIN) admin account management |
| 🛡️ | `GET /admin/stats` | (REPORT_VIEW) dashboard: order/revenue counts, 14-day series, category split, payment methods, stock health, top products |
| 🛡️ | `GET /admin/reports/sales?days=` | (REPORT_VIEW) daily sales report |
| 🛡️ | `GET /admin/settings` | (SUPER_ADMIN read) system settings |
| 🛡️ | `PATCH /admin/settings/{key}` | (SETTINGS_UPDATE) audited |
| 🛡️ | `GET /admin/audit-logs?entityType&entityId` | (AUDIT_VIEW) immutable trail |

---

## Security invariants (enforced server-side)

1. **Prices/totals** are always recomputed from the database — client-sent
   prices are ignored everywhere.
2. **Stock** is reservation-based with TTL; oversell is impossible
   (`OUT_OF_STOCK`), expiry auto-releases (scheduler, 60 s sweep).
3. **Payments** verify provider HMAC server-side; amount mismatches and forged
   references fail closed (order cancelled, stock released).
4. **Order status** changes go through the state machine only; `PAID`,
   `SHIPPED`, `DELIVERED`, `REFUNDED` are reachable only via their real triggers.
5. **Ownership** is resolved from the session principal — object IDs of other
   users return `NOT_FOUND`.
6. **Admin permissions** are checked per endpoint via `@PreAuthorize` against
   the DB-backed matrix; SUPER_ADMIN is a code-level wildcard.
7. **Nothing business-critical is hard-deleted**: products archive, carts/users
   soft-disable, and orders/payments/refunds/movements/audit rows are
   append-only.
