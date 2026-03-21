import type { Metadata } from 'next';
import { LearnClient } from './client';

export const metadata: Metadata = {
    title: 'Learn Touch Typing | Typecade',
    description: 'Master the art of touch typing with structured lessons and professional training modules in Typecade Learn.',
    keywords: ['learn to type', 'touch typing', 'typing lesssons', 'typing practice', 'typecade learn'],
    openGraph: {
        title: 'Learn Touch Typing | Typecade',
        description: 'Master the art of touch typing with structured lessons.',
        type: 'website',
        images: [
            {
                url: "/opengraph-image.png",
                width: 1200,
                height: 630,
                alt: "Learn Touch Typing | Typecade",
                type: "image/png",
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Learn Touch Typing | Typecade',
        description: 'Master the art of touch typing with structured lessons.',
        images: ["/opengraph-image.png"],
    },
};

export default function LearnPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'EducationalOrganization',
        name: 'Typecade Learn',
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
