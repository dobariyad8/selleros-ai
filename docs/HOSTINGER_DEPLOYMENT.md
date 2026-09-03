# SellerOS AI — Hostinger Deployment Checklist

Use this checklist when deploying SellerOS AI to Hostinger.

## 1. Repository

SellerOS AI source code:

```text
dobariyad8/selleros-ai
```

Use `main` as the production branch.

## 2. Production Environment Variables

Configure these variables in the Hostinger application environment settings.

Do not put real secret values in this document and do not commit real secrets to GitHub.

```env
APP_URL=https://YOUR_DOMAIN

ETSY_API_KEY=
ETSY_SHARED_SECRET=
ETSY_REDIRECT_URI=https://YOUR_DOMAIN/api/auth/etsy/callback

OPENAI_API_KEY=

SUPABASE_URL=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

CRON_SECRET=

STRIPE_SECRET_KEY=
STRIPE_PRO_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
```

While SellerOS is using the Hostinger temporary domain, replace `YOUR_DOMAIN` with the temporary domain assigned by Hostinger.

When SellerOS moves to its final domain, update:

```env
APP_URL=https://YOUR_FINAL_DOMAIN
ETSY_REDIRECT_URI=https://YOUR_FINAL_DOMAIN/api/auth/etsy/callback
```

Also update Etsy and Stripe configuration when the domain changes.

## 3. Supabase

SellerOS uses Supabase for its database and private listing-project image storage.

Before production traffic is enabled, confirm:

* SellerOS database tables exist.
* The `listing-project-images` Storage bucket exists.
* The bucket is private.
* Production Supabase environment variables are configured in Hostinger.

The baseline database migration is:

```text
supabase/migrations/20260903_000001_initial_schema.sql
```

Do not run this baseline migration against an existing SellerOS database that already contains the SellerOS tables.

Required Supabase variables:

```env
SUPABASE_URL=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Never expose `SUPABASE_SECRET_KEY` to browser/client code.

## 4. Etsy Configuration

SellerOS uses Etsy OAuth to connect seller shops.

The Etsy callback URL must be:

```text
https://YOUR_DOMAIN/api/auth/etsy/callback
```

This must exactly match:

```text
ETSY_REDIRECT_URI
```

Required Etsy variables:

```env
ETSY_API_KEY=
ETSY_SHARED_SECRET=
ETSY_REDIRECT_URI=https://YOUR_DOMAIN/api/auth/etsy/callback
```

While testing on the Hostinger temporary domain, configure Etsy to use the temporary-domain callback URL.

After moving to the final SellerOS domain:

1. Update `ETSY_REDIRECT_URI` in Hostinger.
2. Update the callback URL in the Etsy developer configuration.
3. Redeploy or restart SellerOS if required.

After deployment, test:

* Sign in to SellerOS.
* Connect an Etsy shop.
* Confirm the OAuth callback succeeds.
* Load Etsy listings.
* Disconnect the Etsy shop.
* Reconnect the Etsy shop.

## 5. OpenAI

SellerOS uses OpenAI for AI-powered features.

Configure:

```env
OPENAI_API_KEY=
```

After deployment, verify:

* AI title rewriting works.
* AI description rewriting works.
* AI tag generation works.
* AI listing optimization works.
* AI image generation works.

Never expose `OPENAI_API_KEY` to browser/client code.

## 6. Stripe

SellerOS uses Stripe for Pro subscriptions.

Required variables:

```env
STRIPE_SECRET_KEY=
STRIPE_PRO_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
```

The Stripe webhook endpoint should be:

```text
https://YOUR_DOMAIN/api/stripe/webhook
```

While using the Hostinger temporary domain, configure the webhook using the temporary domain.

After switching to the final domain, update the Stripe webhook endpoint.

Before production launch, test:

* Pro checkout.
* Successful subscription activation.
* Subscription status.
* Stripe customer portal.
* Cancellation.
* Webhook processing.
* Subscription synchronization.

Confirm `STRIPE_PRO_PRICE_ID` points to the intended SellerOS Pro Stripe price.

## 7. Scheduled Jobs

SellerOS has three protected scheduled endpoints:

```text
/api/cron/cleanup-listing-projects
/api/cron/sync-etsy-export-history
/api/cron/capture-optimization-snapshots
```

Recommended schedules:

```text
03:00 UTC — cleanup expired listing projects
03:30 UTC — sync Etsy export history
04:00 UTC — capture optimization snapshots
```

Each scheduled request must send:

```text
Authorization: Bearer <CRON_SECRET>
```

Configure:

```env
CRON_SECRET=
```

Use a strong random secret.

Do not reuse another API key, password, or service secret.

The SellerOS cron endpoints support both `GET` and `POST`.

After deployment, configure the scheduled jobs through Hostinger or another trusted scheduler capable of sending the required Authorization header.

Verify that each scheduled request returns a successful response.

## 8. Health Check

SellerOS provides a deployment health endpoint at:

```text
https://YOUR_DOMAIN/api/health
```

A correctly configured deployment should return HTTP `200`.

Example response:

```json
{
  "status": "ok",
  "service": "SellerOS AI",
  "configuration": {
    "application": "configured",
    "etsy": "configured",
    "openai": "configured",
    "supabase": "configured",
    "cron": "configured",
    "stripe": "configured"
  }
}
```

The health endpoint must never expose actual secret values.

If required application configuration is missing, the endpoint should return HTTP `503`.

## 9. Hostinger Temporary Domain

SellerOS can be tested using a Hostinger temporary domain before connecting the final production domain.

During temporary-domain testing:

* Set `APP_URL` to the temporary HTTPS URL.
* Set `ETSY_REDIRECT_URI` to the temporary-domain Etsy callback URL.
* Configure Etsy with the same callback URL.
* Configure Stripe webhook delivery to the temporary-domain webhook URL.
* Test authentication and all major SellerOS functionality.

Do not assume these URLs will continue working after changing to the final domain.

When the final domain is connected, update all domain-dependent configuration.

## 10. Final Domain Migration

When moving from the Hostinger temporary domain to the final SellerOS domain, update Hostinger:

```env
APP_URL=https://YOUR_FINAL_DOMAIN
ETSY_REDIRECT_URI=https://YOUR_FINAL_DOMAIN/api/auth/etsy/callback
```

Update the Etsy callback URL:

```text
https://YOUR_FINAL_DOMAIN/api/auth/etsy/callback
```

Update the Stripe webhook URL:

```text
https://YOUR_FINAL_DOMAIN/api/stripe/webhook
```

Then verify:

* `/api/health`
* SellerOS authentication
* Etsy OAuth
* Stripe checkout
* Stripe webhook delivery
* Scheduled jobs
* AI functionality
* Supabase database access
* Listing-project image access

## 11. Production Verification

Before considering SellerOS production-ready, verify:

* `/api/health` returns HTTP `200`.
* Authentication works.
* Etsy connection works.
* Etsy listings load.
* AI text generation works.
* AI image generation works.
* SellerOS Pro checkout works.
* Pro subscriptions are recognized correctly.
* Pro-only routes reject non-Pro users.
* Etsy draft export works.
* Direct Etsy listing updates work.
* Listing projects work.
* Private listing images load correctly.
* Export history works.
* Update history works.
* Optimization results work.
* Scheduled cleanup works.
* Scheduled Etsy synchronization works.
* Scheduled optimization snapshots work.

## 12. Release Checks

Before merging or deploying a SellerOS release, run:

```bash
npm run validate:env
npm test
npm run build
```

All commands must succeed.

GitHub CI must also pass before merging into `main`.

## 13. Git Workflow

The `main` branch is protected.

Do not commit deployment changes directly to `main`.

Use a feature or maintenance branch, open a pull request, allow CI to complete, and merge only after required checks pass.

## 14. Secret Handling

Never commit:

* `.env.local`
* Production Etsy API credentials
* Etsy shared secrets
* OpenAI API keys
* Supabase secret keys
* Stripe secret keys
* Stripe webhook secrets
* `CRON_SECRET`

Never put real production secrets inside this deployment document.

Keep production secrets only in Hostinger or the appropriate external service.
