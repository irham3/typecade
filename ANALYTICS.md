# Analytics & Search Console Setup

Typecade currently ships with **no analytics** — we are flying blind. This
guide walks through wiring up privacy-friendly analytics and submitting the
site to search engines so we can measure and grow.

## Layer 1 — Plausible Analytics (in-app)

Privacy-friendly, <1 KB script, no cookies, no consent banner needed,
GDPR/CCPA compliant out of the box. Free for sites under 10K monthly
pageviews.

1. Sign up at https://plausible.io (or self-host with their docker image).
2. Add a site with domain `typecade.com`.
3. Optional: in `.env.local` set
   ```
   NEXT_PUBLIC_PLAUSIBLE_DOMAIN=typecade.com
   ```
   (or your self-hosted API host via `NEXT_PUBLIC_PLAUSIBLE_API_HOST`).
4. The `<PlausibleAnalytics />` component in `app/layout.tsx` loads the
   script automatically. No code change needed beyond step 3.
5. Verify: open the site in an incognito window — the Plausible dashboard
   "Realtime" view should show a visitor within ~5 seconds.

## Layer 2 — Google Search Console

Without this, Google will eventually crawl you, but you cannot see
impressions, click-through, indexing errors, or mobile-usability issues.

1. Sign in at https://search.google.com/search-console with the Google
   account that owns typecade.com.
2. **Add property → URL prefix** → enter `https://typecade.com`.
3. **Verification → HTML tag** — copy the `content="..."` value (a long
   random string).
4. Add it to `.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=paste-the-content-here
   ```
5. Deploy. Verify in Search Console.
6. Once verified, **Sitemaps → Add sitemap** → submit `https://typecade.com/sitemap.xml`.
7. **URL Inspection → paste `https://typecade.com`** → **Request indexing**.
   Repeat for `/arena`, `/learn`, `/board`, `/about`, and at least 3 learn
   lessons.

## Layer 3 — Bing Webmaster Tools

Bing drives ~10–15% of search in many markets and indexes faster than
Google for new domains. Worth 5 minutes.

1. Sign in at https://www.bing.com/webmasters with a Microsoft account.
2. **Add site** → `https://typecade.com`.
3. **Verify → HTML meta tag** — copy the `content="..."` value.
4. Add to `.env.local`:
   ```
   NEXT_PUBLIC_BING_SITE_VERIFICATION=paste-the-content-here
   ```
5. Deploy, verify, then submit the sitemap and request indexing.

## What to monitor weekly

After 2–3 weeks of data, check:

- **Plausible → Top pages** — which routes get organic traffic
- **Plausible → Top sources** — where visitors come from
- **GSC → Performance → Queries** — which keywords trigger impressions
- **GSC → Coverage → Excluded** — pages Google chose not to index (fix or 410)
- **GSC → Mobile Usability** — fix any flagged issues

If impressions > 0 but clicks ≈ 0 → title/description isn't compelling.
If impressions = 0 for everything → indexing is the bottleneck.

## Optional — upgrade later

When monthly traffic exceeds Plausible's free 10K tier (~$9/mo for 100K),
migrate to self-hosted Plausible or to a paid plan. GA4 is *not*
recommended for an indie product — the consent banner friction costs more
than the data quality difference at our scale.