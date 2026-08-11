"use client";

import Script from "next/script";

/** Loads Umami only when a website id is configured for the deployment. */
export function UmamiAnalytics() {
    const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
    if (!websiteId) return null;

    return (
        <Script
            defer
            data-website-id={websiteId}
            src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ?? "https://cloud.umami.is/script.js"}
            strategy="afterInteractive"
        />
    );
}
