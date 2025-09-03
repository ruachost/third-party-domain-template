# Domain Reseller Integration Template

A Next.js template for third‑party commerce platforms (e.g., Shopify, WooCommerce, custom storefronts) to sell and provision domains through our hosting platform. It provides domain search, pricing, checkout with Paystack, WHMCS order creation, and webhook handling.

## What this is
- Backend route handlers to proxy WHMCS and Paystack safely
- UI components you can reuse/modify for domain search and checkout
- Opinionated flows for domain ordering and payment confirmation

## Quick start
1) Install
```bash
pnpm install
```

2) Configure environment
Create `.env.local` with the following:
```env
# WHMCS
WHMCS_API_URL=https://your-whmcs.com/includes/api.php
WHMCS_API_IDENTIFIER=your_identifier
WHMCS_API_SECRET=your_secret
WHMCS_API_ACCESS_KEY=your_access_key

# Paystack (NGN only)
PAYSTACK_PUBLIC_KEY=pk_live_or_test
PAYSTACK_SECRET_KEY=sk_live_or_test
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_or_test

# Optional: domain search challenge secret
CHALLENGE_SECRET=your_challenge_secret
```

3) Run
```bash
pnpm dev
```

Open `http://localhost:3000`.

## Core flows
- Domain search: anti‑bot challenge → WHMCS `DomainWhois` (+ pricing)
- Checkout: collect customer data → initialize Paystack (NGN) → redirect
- Verification: verify Paystack → create WHMCS order → show confirmation
- Webhook (async): verify signature → create WHMCS order (idempotency recommended on your side)

## Endpoints (server)
All endpoints live under `app/api/`.

### Domains
- POST `/api/domains/search`
  - Body: `{ domain: string, answer: number, challengeId: string, sig: string }`
  - Response: `{ domain, available, price, currency, registrationPeriod, renewalPrice? }`
- GET `/api/domains/search`
  - Returns short‑lived challenge: `{ a, b, challengeId, sig }`
- GET `/api/domains/pricing?domain=example.com`
  - Returns renewal pricing for the domain's TLD
- POST `/api/domains/renew`
  - Body: `{ domainId: string, period: number, autoRenew?: boolean }`
- GET `/api/domains/status?domain=example.com`
  - Returns normalized status, expiry, nameservers
- GET `/api/domains?clientId=...` or `?domainId=...`
  - Lists client domains or returns a single domain with DNS snapshot
- PUT `/api/domains`
  - Body: `{ action: 'updateAutoRenewal'|'updateNameservers', domainId: string, autoRenew?: boolean, nameservers?: string[] }`

### Orders
- POST `/api/orders/create`
  - Body:
    ```json
    {
      "customerData": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phonenumber": "+234...",
        "address1": "...",
        "city": "...",
        "state": "...",
        "country": "NG",
        "postcode": "..."
      },
      "domains": [
        { "name": "example.com", "domaintype": "register", "regperiod": 1 }
      ],
      "paymentMethod": "paystack"
    }
    ```
  - Creates/uses a WHMCS client and places an order via `AddOrder`.

### Payments (NGN)
- POST `/api/payment/initialize`
  - Body: `{ amount: number, email: string, reference: string, callback_url: string, metadata?: object }`
  - Response: `{ authorization_url, access_code, reference }`
- GET `/api/payment/verify?reference=...`
  - Verifies a transaction with Paystack

### Webhooks
- POST `/api/webhooks/paystack`
  - Verifies `x-paystack-signature` using `PAYSTACK_WEBHOOK_SECRET`
  - On `charge.success`, posts to `/api/orders/create` using metadata

### WHMCS proxy
- POST `/api/whmcs`
  - Body: `{ action: string, params?: Record<string, any> }`
  - For server‑side usage only. Handles credential binding and error shaping.

## Client components (optional)
- `components/domain/DomainSearch.tsx`
  - Fetches challenge, submits search, renders availability and prices; adds to cart
- `components/cart/ShoppingCart.tsx`
- `components/checkout/CheckoutForm.tsx`
  - Validates customer info (Zod), initializes Paystack with NGN, includes metadata `{ customer, domains }`
- `components/checkout/OrderConfirmation.tsx`
  - Verifies Paystack, creates WHMCS order, clears cart

## Data contracts (high‑level)
- Domain search result
  ```json
  {
    "domain": "example.com",
    "available": true,
    "price": 8500,
    "currency": "NGN",
    "registrationPeriod": 1,
    "renewalPrice": 8500
  }
  ```
- Managed domain (subset)
  ```json
  {
    "id": "12345",
    "domain": "example.com",
    "status": "active",
    "expiryDate": "2026-01-01",
    "autoRenew": true,
    "nameservers": ["ns1", "ns2"],
    "renewalPrice": 8500,
    "currency": "NGN"
  }
  ```

## Shopify (and similar) integration notes
- Run this app as a secure backend for domain operations; your sales channel/front‑end calls these endpoints.
- Use the payment initialize endpoint to redirect customers to Paystack. Currency is enforced as NGN.
- Ensure your store sends `metadata` with `customer` and `domains` arrays so the webhook or success page can create the WHMCS order.
- Prefer using the webhook to finalize orders; keep `OrderConfirmation` flow as a fallback. Implement idempotency on your end to avoid duplicate orders.

## Security
- Secrets only via environment variables
- HMAC validation for domain search challenge (prevents trivial automation)
- Paystack webhook signature verification (`sha512`)
- Do not expose `/api/whmcs` to browsers for arbitrary calls; consume it server‑to‑server only

## Requirements & constraints
- Currency: NGN only (merchant policy)
- Requires WHMCS instance and Paystack account
- DNS status checks use Google DNS resolver (best‑effort)

## Troubleshooting
- WHMCS errors: verify credentials, endpoint, and API permissions (`DomainWhois`, `GetTLDPricing`, `AddClient`, `AddOrder`, `DomainRenew`, `UpdateClientDomain`)
- Paystack init/verify: check keys, reference uniqueness, callback URL, webhook secret
- Duplicate orders: ensure webhook and success page flows are idempotent for the same `reference`

## Folder overview
```
app/api/...         # Route handlers (domains, orders, payment, webhooks, whmcs)
components/...      # Optional UI for search, cart, checkout
services/...        # WHMCS helpers, domain connection helpers
store/...           # Zustand stores (cart, user)
lib/...             # Utilities (formatting, domain helpers)
types/...           # Shared TypeScript types
```

## License
MIT
