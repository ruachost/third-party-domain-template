# WHMCS–Third-party Platform Domain Integration Guide

This guide describes how to integrate your **Platform** (e.g., `store.domain.com`) with **WHMCS** so your merchants can search, purchase, connect, and manage custom domains inside your app—similar to Shopify’s experience.

---

## 1) Architecture & Data Flow

**Systems**

* **Platform** (your app; UI + backend)
* **WHMCS** (domain provisioning, billing, registrar modules)
* **Registrar** (Ruachost)
* **DNS & TLS** (your DNS provider and/or registrar DNS; ACME/Let’s Encrypt)

**High‑level flow**

```
Customer → Theme Platform → WHMCS API → Registrar → DNS → TLS → Live Site
```

**Core objects**

* **Merchant** (user on your Platform)
* **WHMCS Client** (mapped 1:1 to Merchant)
* **Domain** (lifecycle: search → register/transfer → configure DNS → issue SSL → renew)

---

## 2) Prerequisites

* WHMCS v8.x+ with access to **Admin API** (API Identifier/Secret) and **IP Whitelisting** enabled.
* One or more **Registrar Modules** configured and tested (sandbox if available).
* Domain pricing set in WHMCS (or pulled dynamically via API).
* DNS strategy selected (see §8).
* TLS automation strategy selected (ACME/Let’s Encrypt at edge or origin).

Optional but recommended:

* WHMCS **OAuth** for scoped API access.

---

## 3) UX Scenarios

1. **Search & Buy a New Domain** (most common)
2. **Connect Existing Domain** (user already owns one elsewhere)
3. **Manage Domain** (renewal, WHOIS privacy, nameservers, DNS records)

---

## 4) API Contract (Third party Platform ⇄ WHMCS)

### 4.1 Authentication

* Use **server‑to‑server** calls only (never from browser).
* Prefer OAuth; otherwise Admin API Identifier/Secret over HTTPS only.
* IP‑restrict at WHMCS and rate‑limit calls on your side.

### 4.2 Domain Search

* **WHMCS action**: `DomainWhois`
* **Theme Platform endpoint**: `POST /api/domains/search` → calls WHMCS and returns availability + price

**Request → WHMCS**

```
action=DomainWhois
responsetype=json
domain=mybrand.com
```

**Response (example)**

```json
{ "result":"success", "status":"available" }
```

**Prices**

* Pull via `GetTLDPricing` and cache daily. Expose `register`, `renew`, `transfer` prices.

### 4.3 Create/Retrieve Client

* **WHMCS actions**: `GetClientsDetails`, `AddClient`, `UpdateClient`
* Map **Merchant.id** → **WHMCS ClientID** in your DB.

**Create client**

```
action=AddClient
firstname=John&lastname=Doe&email=john@example.com&country=NG&password2=•••
```

**Response**

```json
{ "result":"success", "clientid":501 }
```

### 4.4 Register Domain

* **A)** Direct register via API: `DomainRegister` (recommended when you collect payment in your app)

**A) DomainRegister**

```
action=DomainRegister
clientid=501
domain=mybrand.com
regperiod=1
idprotection=true
dnsmanagement=true
nameserver1=ns1.yourdns.com&nameserver2=ns2.yourdns.com
```

Response:

```json
{ "result":"success", "status":"Active" }
```

### 4.5 Configure DNS

There are two strategies (see §8):

* **Change Nameservers**: `DomainUpdateNameservers` → point to your managed DNS (nsa/nsb)
* **Set DNS Records**: via registrar DNS API (some registrars expose DNS through their module; otherwise use your DNS provider API directly).

Examples:

```
action=DomainUpdateNameservers
clientid=501
domain=mybrand.com
ns1=nsa.ruachost.com&ns2=nsb.yourdns.com
```

If using your DNS, create records:

```
A     @        203.0.113.10        (if you serve at fixed IP)
CNAME www      store.techmock.com   (proxy to tenant subdomain)
CNAME _acme-challenge  → for DNS‑01 (only if you use DNS‑based ACME)
```

### 4.6 Issue SSL

* Poll for DNS propagation (HTTP 200 on `http://mybrand.com/.well-known/...` or DNS A/CNAME seen).
* Run ACME client to obtain/renew certificates; store and attach to tenant’s site/edge.

### 4.7 Renewals

* WHMCS handles invoicing/renewal dates. Sync to your app via cron/webhooks.

---

## 5) Webhooks, Hooks, & Events

Wire these so your app stays in sync:

**Inbound from WHMCS → Theme Platform** (use WHMCS Hooks + webhook relay)

* `AfterRegistrarRegistration` → mark domain Active, start DNS + SSL
* `AfterRegistrarRenewal` → extend expiry in your DB
* `DailyCronJob` → sync expiring domains (D‑30, D‑7, D‑1)

**Outbound from Theme Platform → WHMCS**

* On checkout success → `DomainRegister`
* On connect‑domain verified → (optional) `UpdateClientDomain` notes/metadata

Implement **HMAC‑signed webhooks**, replay‑protection (nonce + timestamp), and idempotency keys.

---

## 6) Data Model (Theme Platform)

**tables** (suggested)

* `merchants(id, email, whmcs_client_id, created_at, …)`
* `domains(id, merchant_id, fqdn, status, whmcs_domain_id, registrar, expiry_at, auto_renew, verification_method, created_at, …)`
* `dns_records(domain_id, type, name, value, ttl)`
* `domain_events(domain_id, kind, payload, created_at)`

**status enums**: `searching`, `pending_payment`, `registering`, `active`, `pending_dns`, `ssl_provisioning`, `live`, `transfer_pending`, `suspended`, `expired`

---

## 7) Checkout & Billing Models

* **Single invoice in your app** (recommended): you collect payment; call `DomainRegister` as reseller of WHMCS.
* **WHMCS‑managed invoices**: redirect to WHMCS cart; reconcile via webhook.

Taxes/fees:

* Mirror TLD taxes/fees from WHMCS; expose final price before purchase.
* If your app bills in NGN but registrar bills WHMCS in USD, set FX rules; cache prices with margin buffer.

---

## 8) DNS Strategies (choose one)

**A) Nameserver takeover (Managed DNS by you)**

* Set NS to `nsa/b.ruachost.com`
* Pros: full automation (A/AAAA/CNAME/TXT), wildcard support, ALIAS/ANAME at apex, easy SSL
* Cons: you must run/operate DNS or use a DNS SaaS (Cloudflare/Route 53/NS1)

**B) Registrar DNS (set records via WHMCS module)**

* Keep registrar nameservers; create A/CNAME via module if supported
* Pros: simpler ops
* Cons: limited features, module support varies, propagation visibility limited

**C) Customer‑managed DNS (Connect Domain flow)**

* Provide instructions: set `A @ → 203.0.113.10` and `CNAME www → store.techmock.com`
* Auto‑verify via HTTP/TXT challenge; when verified, issue SSL
* Pros: no registrar/DNS coupling
* Cons: manual for user; support overhead

**Recommended**: A) Managed DNS by you (or Cloudflare SaaS) for a Shopify‑like experience.

---

## 9) SSL Automation

* Use ACME (Let’s Encrypt) per domain; solve **HTTP‑01** once DNS points to you.
* For apex CNAME setups, prefer **ALIAS/ANAME** or use a proxy/CDN that supports CNAME‑flattening.
* Automate renewals (60‑day cadence) and store certs securely (KMS/secret store).

---

## 10) Verification Flows

**HTTP verification** (recommended):

1. Before switching DNS, give merchant a preview domain `mybrand.yourpreview.com`.
2. After DNS set, check `http://mybrand.com/.well-known/your-challenge` served by your edge.

**DNS TXT verification** (fallback):

* Ask merchant (or automate if you own DNS) to create `TXT _verify.mybrand.com = token`.

Mark domain `live` only after verification + valid TLS.

---

## 11) Error Handling & Idempotency

* **Idempotency keys** for `DomainRegister`, `DomainTransfer` to avoid double purchases.
* Exponential backoff on WHOIS/rate‑limits.
* Distinguish **user errors** (invalid TLD, taken domain, invalid EPP) vs **system errors** (registrar outage).
* Implement **compensation**: if charge succeeded but registration failed, auto‑refund or open ticket in WHMCS.

---

## 12) Example Sequences

### 12.1 Buy New Domain (API‑first)

```
UI: type "mybrand.com"
→ Theme: /domains/search → WHMCS: DomainWhois
← available:true, price: ₦X
UI: Pay
→ Theme: create/ensure WHMCS client → DomainRegister
← success (Active)
→ Theme: set NS (or create records)
→ Theme: poll DNS → issue SSL → mark live
```

### 12.2 Connect Existing Domain (manual DNS)

```
UI shows records:
A @ → 203.0.113.10
CNAME www → store.techmock.com
→ Theme: verify HTTP/TXT → issue SSL → live
```

### 12.3 Transfer In

```
UI: enter domain + EPP
→ WHMCS: DomainTransfer
← pending (5–7 days)
→ On webhook DomainTransferCompleted → set DNS → SSL → live
```

---

## 13) Example Code Snippets

### Node.js (Axios)

```js
import axios from "axios";

const WHMCS_URL = process.env.WHMCS_URL + "/includes/api.php";
const AUTH = { identifier: process.env.WHMCS_ID, secret: process.env.WHMCS_SECRET };

async function callWhmcs(params) {
  const body = new URLSearchParams({ responsetype: "json", ...AUTH, ...params });
  const { data } = await axios.post(WHMCS_URL, body.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 15000
  });
  if (data.result !== "success") throw new Error(JSON.stringify(data));
  return data;
}

export async function searchDomain(fqdn) {
  return callWhmcs({ action: "DomainWhois", domain: fqdn });
}

export async function ensureClient({ email, firstname, lastname, country }) {
  try {
    const existing = await callWhmcs({ action: "GetClientsDetails", email });
    return existing.clientid;
  } catch (_) {
    const created = await callWhmcs({ action: "AddClient", email, firstname, lastname, country, password2: crypto.randomUUID() });
    return created.clientid;
  }
}

export async function registerDomain(clientid, domain) {
  return callWhmcs({ action: "DomainRegister", clientid, domain, regperiod: "1", idprotection: true });
}
```

### PHP

```php
function whmcs_call($params) {
  $params = array_merge([
    'responsetype' => 'json',
    'identifier' => WHMCS_ID,
    'secret' => WHMCS_SECRET
  ], $params);
  $ch = curl_init(W HMCS_URL.'/includes/api.php');
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POSTFIELDS => http_build_query($params),
    CURLOPT_TIMEOUT => 15
  ]);
  $resp = json_decode(curl_exec($ch), true);
  if ($resp['result'] !== 'success') { throw new Exception(json_encode($resp)); }
  return $resp;
}
```

---