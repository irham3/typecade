import type { Metadata } from 'next';
import { HomeClient } from './client';

export const metadata: Metadata = {
  title: 'Typing Test, WPM Tracker & Multiplayer Races - Typecade',
  description: 'Free multiplayer typing test with real-time races, leaderboards, and detailed WPM stats. Challenge friends or race strangers.',
  keywords: ['typing test', 'wpm test', 'typing speed test', 'typecade', 'multiplayer typing game', 'touch typing'],
  openGraph: {
    title: 'Typing Test, WPM Tracker & Multiplayer Races - Typecade',
    description: 'Free multiplayer typing test with real-time races, leaderboards, and detailed WPM stats. Challenge friends or race strangers.',
    url: 'https://typecade.com',
    siteName: 'Typecade',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Typecade | Free Typing Speed Test",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Typecade - Free Typing Speed Test',
    description: 'Free multiplayer typing test with real-time races, leaderboards, and detailed WPM stats.',
    images: ["/opengraph-image.png"],
  },
};

export default function Page() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Typecade',
    url: 'https://typecade.com', // Placeholder URL
    description: 'Free multiplayer typing test with real-time races, leaderboards, and detailed WPM stats.',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Search Engine Optimization */}
      <h1 className="sr-only">Typecade: Free Typing Speed Test & Touch Typing Trainer</h1>

      <HomeClient />
    </>
  );
}
