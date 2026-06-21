import type { Metadata } from 'next';
import { HomeClient } from './client';
import { NewsletterSignup } from '@/features/marketing/components/newsletter-signup';

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
    url: 'https://typecade.com',
    description: 'Free multiplayer typing test with real-time races, leaderboards, and detailed WPM stats.',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Keyword-rich SEO H1. The visible marketing headline lives below
          in HomepagePromo (when merged) or in the hero block here. */}
      <h1 className="sr-only">Typecade: Free Typing Speed Test & Touch Typing Trainer</h1>

      <HomeClient />

      {/* Visible hero block — gives visitors a value prop and a path to
          other features without making them hunt. When the HomepagePromo
          from feat/homepage-value-prop lands, it replaces this. */}
      <section
        aria-labelledby="homepage-hero-heading"
        className="w-full max-w-5xl px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 pt-4 sm:pt-8"
      >
        <h2
          id="homepage-hero-heading"
          className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-center text-foreground max-w-3xl mx-auto leading-[1.1]"
        >
          Type faster. <span className="text-accent">Think clearer.</span>
        </h2>
        <p className="text-base sm:text-lg text-text-dim text-center mt-5 max-w-2xl mx-auto leading-relaxed">
          A free typing test with real-time multiplayer races, a 5-module
          touch-typing curriculum, and global leaderboards. No signup required.
        </p>
      </section>

      {/* Newsletter capture — sits below the hero, before the footer. */}
      <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24 flex justify-center">
        <NewsletterSignup source="homepage-hero" />
      </div>
    </>
  );
}