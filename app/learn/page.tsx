import type { Metadata } from 'next';
import { LearnClient } from './client';

export const metadata: Metadata = {
    title: 'Academy: Learn Touch Typing | Typecade',
    description: 'Master the art of touch typing with structured lessons and professional training modules in Typecade Academy.',
    keywords: ['learn to type', 'touch typing', 'typing lesssons', 'typing practice', 'typecade academy'],
    openGraph: {
        title: 'Academy: Learn Touch Typing | Typecade',
        description: 'Master the art of touch typing with structured lessons.',
        type: 'website',
    },
};

export default function LearnPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'EducationalOrganization',
        name: 'Typecade Academy',
        description: 'Structured courses and modules to improve touch typing speeds.',
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <LearnClient />
        </>
    );
}
