import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RaceClient } from './client';

export const metadata: Metadata = {
    title: 'Live Typing Race & WPM Speed Test - Typecade',
    description: 'Jump straight into a live typing speed test. Compete in real-time keyboard match-ups with instant WPM, accuracy stats, and uncorrected errors tracking.',
    keywords: ['live typing game', 'typing race test', 'competitive typing', 'real-time typing', 'wpm match', 'fastest typing test'],
    openGraph: {
        title: 'Live Typing Race & WPM Speed Test - Typecade',
        description: 'Compete in a real-time typing race and track your WPM speed instantly.',
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
            <h1 className="sr-only">Typecade Race: Competitive Live Match</h1>
            <Suspense fallback={<div className="w-full min-h-screen flex items-center justify-center text-text-dim">Loading race...</div>}>
                <RaceClient />
            </Suspense>
        </>
    );
}
