import type { Metadata } from 'next';
import { LeaderboardClient } from './client';

export const metadata: Metadata = {
    title: 'Leaderboard | Typecade',
    description: 'See where you stand globally on Typecade. View the fastest typists and climb the leaderboard with your own accurate scores.',
    keywords: ['leaderboard', 'rankings', 'top typists', 'typing competition', 'typecade stats'],
    openGraph: {
        title: 'Leaderboard | Typecade',
        description: 'See where you stand globally on Typecade.',
        type: 'website',
    },
};

export default function LeaderboardPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Typecade Leaderboard',
        description: 'Leaderboard showing top typing speeds and accuracy for Typecade users.',
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <LeaderboardClient />
        </>
    );
}
