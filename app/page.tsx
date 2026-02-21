import type { Metadata } from 'next';
import { HomeClient } from './client';

export const metadata: Metadata = {
  title: 'Typecade: Master Your Typing Speed',
  description: 'Typecade is a professional platform designed to enhance your typing speed and accuracy. Practice with advanced metrics and a modern interface.',
  keywords: ['typing test', 'wpm', 'typing speed', 'keyboard practice', 'typecade'],
  openGraph: {
    title: 'Typecade: Master Your Typing Speed',
    description: 'Enhance your typing speed and accuracy with Typecade.',
    url: 'https://typecade.pages.dev', // Placeholder URL
    siteName: 'Typecade',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Typecade',
    description: 'Enhance your typing speed and accuracy with Typecade.',
  },
};

export default function Page() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Typecade',
    url: 'https://typecade.pages.dev', // Placeholder URL
    description: 'A professional platform designed to enhance your typing speed and accuracy.',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient />
    </>
  );
}
