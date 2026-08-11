# Analytics & Search Console Setup

Typecade currently ships with **no analytics** — we are flying blind. This
guide walks through wiring up privacy-friendly analytics and submitting the
site to search engines so we can measure and grow.

## Layer 1 — Umami Analytics (in-app)

Privacy-focused and lightweight, with no cookies by default. Product events
use the typed adapter in `lib/analytics`; detailed gameplay telemetry stays
in the existing telemetry boundary.

1. Create an Umami Cloud website for `typecade.com`.
2. In `.env.local` set
   ```
   NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id
   ```
   For self-hosting, also set `NEXT_PUBLIC_UMAMI_SCRIPT_URL` to the instance
   script URL.
3. The `<UmamiAnalytics />` component in `app/layout.tsx` loads the script
   automatically.
4. Verify: open the site in an incognito window — Umami Realtime should show
   a visitor within ~5 seconds.

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

- **Umami → Top pages** — which routes get organic traffic
- **Umami → Top sources** — where visitors come from
- **GSC → Performance → Queries** — which keywords trigger impressions
- **GSC → Coverage → Excluded** — pages Google chose not to index (fix or 410)
- **GSC → Mobile Usability** — fix any flagged issues

If impressions > 0 but clicks ≈ 0 → title/description isn't compelling.
If impressions = 0 for everything → indexing is the bottleneck.

## Optional — upgrade later

When product questions need experiments, feature flags, or deeper cohorts,
evaluate PostHog. Do not add a second analytics vendor until Umami data shows
that the extra capability is necessary.
