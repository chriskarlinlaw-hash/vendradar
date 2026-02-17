# VendRadar — Deployment & Setup Guide
_For Pax — February 2026_

---

## 1. Vercel Deployment (5 minutes)

### Prerequisites
- GitHub account with the vendsite repo pushed
- Vercel account (free tier: [vercel.com/signup](https://vercel.com/signup))

### Steps

1. **Go to** [vercel.com/new](https://vercel.com/new)
2. **Import** the GitHub repository (click "Import Git Repository")
3. **Configure project:**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: **`src`** ← IMPORTANT (the Next.js app lives in `src/`, not root)
   - Build Command: `next build` (default)
   - Output Directory: `.next` (default)
4. **Click Deploy** — Vercel will build and deploy automatically
5. **You'll get a URL** like `vendradar-mvp.vercel.app` — this is your preview URL

### Every future `git push` will auto-deploy.

---

## 2. DNS Configuration

### A. Point VendRadar.com to Vercel

1. In **Vercel Dashboard** → your project → **Settings** → **Domains**
2. Add `vendradar.com` and `www.vendradar.com`
3. Vercel will show you the required DNS records. Typically:

| Type  | Name  | Value                     |
|-------|-------|---------------------------|
| A     | @     | `76.76.21.21`             |
| CNAME | www   | `cname.vercel-dns.com`    |

4. Go to your **domain registrar** (wherever you bought vendradar.com)
5. Open **DNS Settings** and add those records
6. Wait 5-30 minutes for propagation
7. Back in Vercel, click **Verify** — should go green

### B. Redirect VendPick.com → VendRadar.com

**Option 1: DNS Redirect (simplest)**
At your registrar, set up a URL redirect / forwarding:
- `vendpick.com` → `https://vendradar.com` (301 permanent redirect)
- Most registrars have this under "URL Forwarding" or "Redirect"

**Option 2: Vercel Redirect**
Add `vendpick.com` as a domain in Vercel, then add to `next.config.js`:

```js
module.exports = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'vendpick.com' }],
        destination: 'https://vendradar.com/:path*',
        permanent: true,
      },
    ];
  },
};
```

---

## 3. API Keys

### A. Google Maps API Key

**Where:** [console.cloud.google.com](https://console.cloud.google.com)

1. Create a new project (or use existing)
2. Go to **APIs & Services** → **Library**
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **API Key**
6. **Restrict the key** (important for security):
   - Application restrictions → **HTTP referrers**
   - Add: `vendradar.com/*`, `www.vendradar.com/*`, `localhost:3000/*`
   - API restrictions → Restrict to the 3 APIs above

> **KEY ALREADY OBTAINED:** `AIzaSyBzJ6ATHRO33RUqxkcTuDKPJ5TffX0XNVk`
> Add HTTP referrer restrictions once the domain is live. For now, leave unrestricted so localhost works.

**Cost:** $200/month free credit from Google. For MVP traffic, you'll likely stay free. Maps JavaScript API = $7/1000 loads. Places API = $17-32/1000 requests.

**Env var name:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### B. US Census Bureau API Key

**Where:** [api.census.gov/data/key_signup.html](https://api.census.gov/data/key_signup.html)

1. Fill in name + email
2. You'll receive the key via email within minutes
3. No usage limits for most endpoints
4. No domain restrictions needed

> **KEY ALREADY OBTAINED:** `c2ab38bf375a378f8e8cbdbe9da22a5d36399f45`

**Cost:** Free. No limits.

**Env var name:** `CENSUS_API_KEY`

### C. Supabase (Database + Auth) — For Later

**Where:** [supabase.com/dashboard](https://supabase.com/dashboard)

1. Create a new project
2. Copy the Project URL and anon key from **Settings** → **API**

**Env var names:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Cost:** Free tier = 500MB database, 50K monthly active users. More than enough for MVP.

### D. Stripe (Payments) — For Later

**Where:** [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)

**Env var names:**
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

Start with **test mode** keys (prefix `sk_test_` / `pk_test_`).

---

## 4. Environment Variables in Vercel

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add each key-value pair:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `AIzaSyBzJ6ATHRO33RUqxkcTuDKPJ5TffX0XNVk` | Production, Preview, Development |
| `CENSUS_API_KEY` | `c2ab38bf375a378f8e8cbdbe9da22a5d36399f45` | Production, Preview, Development |

3. Click **Save**
4. **Redeploy** (Vercel → Deployments → click "..." on latest → Redeploy)

For local development, copy `src/.env.example` to `src/.env.local` and fill in values.

---

## 5. Deployment Checklist

- [ ] GitHub repo is up to date
- [ ] Vercel project created and connected
- [ ] First deploy succeeds on preview URL
- [ ] Google Maps API key obtained and restricted
- [ ] Census API key obtained
- [ ] Env vars added to Vercel dashboard
- [ ] Redeployed with env vars (Google Maps should now load)
- [ ] VendRadar.com DNS pointed to Vercel
- [ ] VendPick.com redirecting to VendRadar.com
- [ ] HTTPS working on vendradar.com (Vercel handles this automatically)
- [ ] Test a search on the live site

---

## 6. Local Development

```bash
cd src
cp .env.example .env.local
# Fill in your API keys in .env.local
npm install
npm run dev
# Open http://localhost:3000
```

---

## Quick Reference

| Service | Dashboard URL | Cost |
|---------|--------------|------|
| Vercel | vercel.com/dashboard | Free (Hobby) |
| Google Cloud | console.cloud.google.com | $200/mo free credit |
| Census API | api.census.gov | Free |
| Supabase | supabase.com/dashboard | Free tier |
| Stripe | dashboard.stripe.com | 2.9% + 30¢ per transaction |
| Domain (VendRadar) | Your registrar | ~$12/year |
| Domain (VendPick) | Your registrar | ~$10/year |

---

_Last updated: February 17, 2026_
