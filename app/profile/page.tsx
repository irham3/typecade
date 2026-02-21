import type { Metadata } from 'next';
import { ProfileClient } from './client';

export const metadata: Metadata = {
    title: 'Your Stats & Profile | Typecade',
    description: 'View your typing history, analyze your words per minute progression, and refine your precision on your personal Typecade profile.',
    keywords: ['personal typing stats', 'typing progress', 'typing profile', 'typecade history', 'wpm tracker'],
    openGraph: {
        title: 'Your Stats & Profile | Typecade',
        description: 'View your typing history and progression.',
        type: 'profile',
    },
};

export default function ProfilePage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        name: 'User Typecade Profile',
        description: 'A personal dashboard for tracking typing statistics, tests, and overall words-per-minute improvement.',
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ProfileClient />
        </>
    );
}
