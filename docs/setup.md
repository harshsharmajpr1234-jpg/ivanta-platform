# iVanta — Local Development Setup

Full-stack Apple-products e-commerce platform.
**Backend:** Java 21 · Spring Boot 3.3 · Spring Security · Spring Data JPA · Flyway · Maven
**Frontend:** Next.js 14 (App Router) · TypeScript · Tailwind · TanStack Query · Zustand
**Database:** MySQL 8 (via XAMPP on Windows/macOS/Linux, or any MySQL 8 / MariaDB 10.6+ server)

> XAMPP is used **only** for MySQL + phpMyAdmin convenience. There is no PHP in this
> project — the backend is Spring Boot.

---

## 1. Prerequisites

| Tool | Version | Check |
|---|---|---|
| JDK | 17+ (21 recommended) | `java -version` |
| Maven | 3.9+ | `mvn -v` |
| Node.js | 18.17+ (20 recommended) | `node -v` |
| MySQL | 8.x (XAMPP) or MariaDB 10.6+ | `mysql --version` |

## 2. Database (XAMPP)

1. Open the XAMPP Control Panel → **Start** `MySQL`. (Apache is not needed.)
2. Open phpMyAdmin: <http://localhost/phpmyadmin>
3. Create the database **or let Flyway create the schema automatically** — the
   backend only needs the database to exist:
   ```sql
   CREATE DATABASE ivanta CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
4. Default XAMPP credentials are `root` with an **empty password**. If you set a
   password, put it in `DB_PASSWORD` (see below). Never commit real credentials.

### Verifying MySQL from the CLI
```bash
mysql -h 127.0.0.1 -u root -p -e "SHOW DATABASES;"
```

## 3. Backend

```bash
cd backend
cp .env.example .env        # then edit values (the app also reads plain env vars)
mvn spring-boot:run
```

The backend serves **http://localhost:8080/api/v1**.

On first start Flyway applies `V1 … V17` from
`backend/src/main/resources/db/migration/` and seeds development data
(categories, 20 products with variants/images, warehouses + stock, coupons,
shipping methods, location dataset, serviceability zones, root admin).

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_NAME` | `ivanta` | Database name |
| `DB_USERNAME` | `root` | DB user |
| `DB_PASSWORD` | *(empty)* | DB password |
| `SERVER_PORT` | `8080` | HTTP port |
| `COOKIE_SECURE` | `false` | Set `true` in production (HTTPS-only cookies) |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins (never `*`) |
| `ADMIN_ROOT_EMAIL` | `admin@ivanta.in` | Bootstrap SUPER_ADMIN email |
| `ADMIN_ROOT_PASSWORD` | *(required)* | Bootstrap SUPER_ADMIN password — env only, never in code/seed |
| `ADMIN_ROOT_NAME` | `iVanta Root` | Bootstrap SUPER_ADMIN display name |
| `DEV_SEED_DEMO_ADMINS` | `false` | Seed 8 role-demo admins (dev only) |
| `ADMIN_SESSION_TTL_MINUTES` | `120` | Admin session lifetime |
| `USER_SESSION_TTL_MINUTES` | `43200` | Customer session lifetime (30 days) |
| `MAX_LOGIN_FAILURES` | `5` | Failures before lockout |
| `LOCKOUT_MINUTES` | `15` | Lockout duration |
| `DEV_OTP_CODE` | *(unset)* | Fixed OTP for local testing (dev only) |
| `RESERVATION_TTL_MINUTES` | `15` | Stock reservation TTL before auto-expiry |
| `COD_ENABLED` | `true` | Allow Cash-on-Delivery |
| `MIN_ORDER_VALUE` | `0` | Minimum order subtotal (0 = disabled) |
| `RETURN_WINDOW_DAYS` | `7` | Days after delivery a return can be requested |
| `PAYMENT_MOCK_SECRET` | *(dev default)* | HMAC secret for the mock payment provider |
| `UPLOAD_DIR` | `./uploads` | Local image-storage root (swappable provider) |

Example (bash):
```bash
export DB_PASSWORD=secret
export ADMIN_ROOT_PASSWORD='a-strong-unique-password'
export DEV_SEED_DEMO_ADMINS=true
mvn spring-boot:run
```

### Tests
```bash
cd backend && mvn test
```
80 unit tests cover the order state machine, coupons, checkout pricing, payment
verification (forged reference / tampered amount), stock reservation & oversell,
cancellation refunds, return windows, review verification, admin lockout/2FA and
location search/serviceability.

## 4. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_BASE=http://localhost:8080/api/v1
npm run dev
```

The app serves **http://localhost:3000**. All API calls go through the
centralized `services/` layer with `credentials: 'include'` (HTTP-only session
cookies).

## 5. Demo accounts (dev seed)

Seeded only when `DEV_SEED_DEMO_ADMINS=true`. Passwords come from the
environment — the seed prints them to the console on first boot; nothing real is
committed.

| Role | Email |
|---|---|
| SUPER_ADMIN | `ADMIN_ROOT_EMAIL` (e.g. `admin@ivanta.in`) |
| PRODUCT_MANAGER | `products@ivanta.in` |
| INVENTORY_MANAGER | `inventory@ivanta.in` |
| ORDER_MANAGER | `orders@ivanta.in` |
| FINANCE_MANAGER | `finance@ivanta.in` |
| DELIVERY_MANAGER | `delivery@ivanta.in` |
| CUSTOMER_SUPPORT | `support@ivanta.in` |
| MARKETING_MANAGER | `marketing@ivanta.in` |

Customers register themselves via `/api/v1/auth/register` or phone OTP
(`/auth/request-otp` → `/auth/verify-otp`; with `DEV_OTP_CODE` set the fixed
code is also returned in the API response for convenience).

## 6. Troubleshooting

| Symptom | Fix |
|---|---|
| `Access denied for user 'root'` | Check `DB_USERNAME` / `DB_PASSWORD`; XAMPP default is empty password |
| `Unknown database 'ivanta'` | Create it in phpMyAdmin (step 2.3) |
| Port 8080 in use | `SERVER_PORT=8081` |
| Frontend gets CORS errors | Add your origin to `CORS_ALLOWED_ORIGINS` (comma-separated, exact origin) |
| Flyway `Validate failed` after editing an applied migration | Migrations are immutable — add a new `V18__*.sql` instead |
| Stale `target/classes` after branch switch | `mvn clean` before `spring-boot:run` |

## 7. Production notes

- Set `COOKIE_SECURE=true`, serve over HTTPS, set a strong `ADMIN_ROOT_PASSWORD`,
  leave `DEV_SEED_DEMO_ADMINS=false` and unset `DEV_OTP_CODE`.
- Swap the mock payment provider for Razorpay by implementing
  `PaymentProvider` and setting `ivanta.payment.provider=razorpay`
  (interface-ready; verification stays server-side).
- Image storage: implement `StorageProvider` for S3/Cloudinary; the local
  `UPLOAD_DIR` provider is the default.
- Notifications: implement `EmailProvider` / `SmsProvider` etc. — the dev
  providers log to the console and persist in-app notifications.
