import type { Metadata } from 'next';
import { LearnClient } from './client';
import { LEARN_MODULES } from '@/features/learn/data/lessons';

export const metadata: Metadata = {
    title: 'Learn Touch Typing & Keyboard Practice - Typecade',
    description: 'Master touch typing from scratch. Complete our interactive typing lessons, build muscle memory, and increase your WPM from home row basics to pro speeds.',
    keywords: ['learn to type', 'touch typing practice', 'typing lessons', 'typing practice test', 'increase wpm'],
    openGraph: {
        title: 'Learn Touch Typing & Keyboard Practice - Typecade',
        description: 'Master the art of touch typing with structured lessons and boost your WPM.',
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
            
            {/* Server-Side Rendered SEO Block to ensure Cloudflare Pages statically exports the whole syllabus HTML */}
            <div className="sr-only">
                <h1>Learn Touch Typing: Tutorials and Practice Modules</h1>
                {LEARN_MODULES.map(module => (
                    <section key={module.id}>
                        <h2>{module.title}</h2>
                        <p>{module.description}</p>
                        <ul>
                            {module.lessons.map(lesson => (
                                <li key={lesson.id}>
                                    <h3>{lesson.title}</h3>
                                    <p>{lesson.instruction}</p>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
            
            <LearnClient />
        </>
    );
}
