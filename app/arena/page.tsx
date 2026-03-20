import type { Metadata } from 'next';
import { MultiplayerClient } from './client';

export const metadata: Metadata = {
    title: 'Arena | Typecade',
    description: 'Compete against other typists in real-time typing battles. Create or join an arena and prove your speed.',
    keywords: ['typing arena', 'typing race', 'competitive typing', 'typecade arena', 'type against others'],
    openGraph: {
        title: 'Arena | Typecade',
        description: 'Compete against other typists in real-time typing battles.',
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
            <MultiplayerClient />
        </>
    );
}
