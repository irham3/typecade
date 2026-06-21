"use client";

import Script from "next/script";

/**
 * Plausible Analytics loader.
 *
 * Plausible is privacy-friendly (no cookies, no personal data), lightweight
 * (<1 KB script), and GDPR/CCPA compliant out of the box. Free for sites under
 * 10K monthly pageviews on the community tier.
 *
 * Setup:
 *   1. Sign up at https://plausible.io (or self-host — see plausible/analytics
 *      for the docker-compose recipe).
 *   2. Add a site with domain `typecade.com`.
 *   3. Optional: set NEXT_PUBLIC_PLAUSIBLE_DOMAIN in your env to override the
 *      default. Default is "typecade.com".
 *   4. Optional: set NEXT_PUBLIC_PLAUSIBLE_API_HOST if you self-host.
 *
 * Verification:
 *   - Open the site in an incognito window.
 *   - Plausible dashboard → "Realtime" should show 1 active visitor within ~5 s.
 *   - Browser network tab should show a POST to /api/event with the pageview.
 */
export function PlausibleAnalytics() {
    const domain =
        process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? "typecade.com";
    const apiHost = process.env.NEXT_PUBLIC_PLAUSIBLE_API_HOST;
    const src = apiHost
        ? `${apiHost.replace(/\/$/, "")}/js/script.js`
        : "https://plausible.io/js/script.js";

    return (
        <Script
            defer
            data-domain={domain}
            src={src}
            strategy="afterInteractive"
        />
    );
}