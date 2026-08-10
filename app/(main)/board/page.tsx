import type { Metadata } from 'next';
import { BoardClient } from './client';

export const metadata: Metadata = {
    title: 'Typing Test Leaderboards & Top WPM Scores - Typecade',
    description: 'See where you rank on the global typing test leaderboards. Compare your highest WPM scores and accuracy against the fastest typists on Typecade.',
    keywords: ['typing test leaderboards', 'top typists', 'typing competition', 'typecade stats', 'wpm leaderboard'],
    openGraph: {
        title: 'Typing Test Leaderboards & Top WPM Scores - Typecade',
        description: 'See where you rank on the global typing test leaderboards.',
        type: 'website',
        images: [
            {
                url: "/opengraph-image.png",
                width: 1200,
                height: 630,
                alt: "Board | Typecade",
                type: "image/png",
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Board | Typecade',
        description: 'See where you stand globally on Typecade.',
        images: ["/opengraph-image.png"],
    },
};

export default function BoardPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Typecade Board',
        description: 'Board showing top typing speeds and accuracy for Typecade users.',
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <h1 className="sr-only">Typecade Board: Global Typing Leaderboards</h1>
            <BoardClient />
        </>
    );
}
