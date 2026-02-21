import type { Metadata } from 'next';
import { MultiplayerClient } from './client';

export const metadata: Metadata = {
    title: 'Multiplayer Arena | Typecade',
    description: 'Compete against other typists in the Typecade Multiplayer Arena in real-time. Join lobbies and prove your typing speed.',
    keywords: ['multiplayer typing', 'typing race', 'competitive typing', 'typecade arena', 'type against others'],
    openGraph: {
        title: 'Multiplayer Arena | Typecade',
        description: 'Compete against other typists in the Typecade Multiplayer Arena.',
        type: 'website',
    },
};

export default function MultiplayerPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'VideoGame',
        name: 'Typecade Multiplayer Arena',
        description: 'A platform to compete in real-time typing speed and accuracy challenges against other users.',
        genre: ['Typing game', 'Educational', 'Competitive'],
        playMode: 'Multiplayer',
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <MultiplayerClient />
        </>
    );
}
