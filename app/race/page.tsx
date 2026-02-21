import type { Metadata } from 'next';
import { RaceClient } from './client';

export const metadata: Metadata = {
    title: 'Active Race | Typecade',
    description: 'Join the race and compete in real-time. Hit every key with precision and outpace opponents in the Typecade multiplayer arena.',
    keywords: ['live typing game', 'typecade race', 'competitive typing', 'real-time typing', 'wpm match'],
    openGraph: {
        title: 'Active Race | Typecade',
        description: 'Compete in a real-time typing race.',
        type: 'website',
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
            <RaceClient />
        </>
    );
}
