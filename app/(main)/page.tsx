import type { Metadata } from 'next';
import { HomeClient } from './client';
import { HomepageTagline } from '@/features/marketing/components/homepage-tagline';

export const metadata: Metadata = {
  title: 'Typecade — typing speed test',
  description: 'Test your typing speed. Race others. Climb the board.',
  keywords: ['typing test', 'wpm test', 'typing speed test', 'typecade', 'multiplayer typing game', 'touch typing'],
  alternates: {
    canonical: '/',
    languages: {
      en: 'https://typecade.com/',
      'x-default': 'https://typecade.com/',
      id: 'https://typecade.com/id',
    },
  },
  openGraph: {
    title: 'Typecade — typing speed test',
    description: 'Test your typing speed. Race others. Climb the board.',
    url: 'https://typecade.com',
    siteName: 'Typecade',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Typecade — typing speed test',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Typecade — typing speed test',
    description: 'Test your typing speed. Race others. Climb the board.',
    images: ['/opengraph-image.png'],
  },
};

export default function Page() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Typecade',
    url: 'https://typecade.com',
    description: 'Test your typing speed. Race others. Climb the board.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://typecade.com/?q={search_term_string}',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* SEO H1 — visible to crawlers only. The user-facing headline lives
          in HomepageTagline, which is shorter and punchier. */}
      <h1 className="sr-only">
        Typecade: Free Typing Speed Test, WPM Tracker &amp; Multiplayer Races
      </h1>

      <HomeClient />
      <HomepageTagline />
    </>
  );
}