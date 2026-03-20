import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RaceClient } from './client';

export const metadata: Metadata = {
    title: 'Active Race | Typecade',
    description: 'Join the race and compete in real-time. Hit every key with precision and outpace opponents in the Typecade multiplayer arena.',
    keywords: ['live typing game', 'typecade race', 'competitive typing', 'real-time typing', 'wpm match'],
    openGraph: {
        title: 'Active Race | Typecade',
        description: 'Compete in a real-time typing race.',
        type: 'website',
        images: [
            {
                url: "/opengraph-image.png",
                width: 1200,
                height: 630,
                alt: "Active Race | Typecade",
                type: "image/png",
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Active Race | Typecade',
        description: 'Compete in a real-time typing race.',
        images: ["/opengraph-image.png"],
    },
};

export default function RacePage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'VideoGame',
        name: 'Typecade Race Match',
        description: 'A live typing match environment for competitive players.',
        genre: ['Typing game', 'Educational', 'Action'],
        playMode: 'Multiplayer',
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Suspense fallback={<div className="w-full min-h-screen flex items-center justify-center text-text-dim">Loading race...</div>}>
                <RaceClient />
            </Suspense>
        </>
    );
}
