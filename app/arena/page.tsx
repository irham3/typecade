import type { Metadata } from 'next';
import { MultiplayerClient } from './client';

export const metadata: Metadata = {
    title: 'Multiplayer Typing Test Arena - Typecade',
    description: 'Create a custom typing race or join an open multiplayer arena. Test your WPM speed live against friends and typists from around the world.',
    keywords: ['typing arena', 'typing race', 'competitive typing', 'multiplayer typing test', 'type against friends'],
    openGraph: {
        title: 'Multiplayer Typing Test Arena - Typecade',
        description: 'Test your WPM speed live against friends and typists from around the world in a real-time multiplayer typing test.',
        type: 'website',
        images: [
            {
                url: "/opengraph-image.png",
                width: 1200,
                height: 630,
                alt: "Arena | Typecade",
                type: "image/png",
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Arena | Typecade',
        description: 'Compete against other typists in real-time typing battles.',
        images: ["/opengraph-image.png"],
    },
};

export default function MultiplayerPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'VideoGame',
        name: 'Typecade Arena',
        description: 'Compete in real-time typing speed and accuracy challenges against other players.',
        genre: ['Typing game', 'Educational', 'Competitive'],
        playMode: 'Multiplayer',
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <h1 className="sr-only">Typecade Arena: Real-Time Multiplayer Typing Races</h1>
            <MultiplayerClient />
        </>
    );
}
