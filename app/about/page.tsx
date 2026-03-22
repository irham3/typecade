import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
    title: 'About Typecade - Free Typing Speed Test & WPM Tracker',
    description: 'Learn how Typecade calculates WPM, the rules of our multiplayer typing races, and our commitment to providing a free touch typing trainer.',
    keywords: ['about typecade', 'typing test', 'wpm calculator', 'touch typing trainer', 'typing speed test'],
    openGraph: {
        title: 'About Typecade - Free Typing Speed Test & WPM Tracker',
        description: 'Learn how Typecade calculates WPM, the rules of our multiplayer typing races, and our commitment to providing a free touch typing trainer.',
        type: 'website',
        images: [
            {
                url: "/opengraph-image.png",
                width: 1200,
                height: 630,
                alt: "About Typecade",
                type: "image/png",
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'About Typecade - Free Typing Speed Test & WPM Tracker',
        description: 'Learn how Typecade calculates WPM, the rules of our multiplayer typing races, and our commitment to providing a free touch typing trainer.',
        images: ["/opengraph-image.png"],
    },
};

export default function AboutPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'About Typecade',
        url: 'https://typecade.com/about',
        description: 'Learn how Typecade calculates WPM, the rules of our multiplayer typing races, and our commitment to providing a free touch typing trainer.',
        isPartOf: {
            '@type': 'WebSite',
            name: 'Typecade',
            url: 'https://typecade.com',
        },
    };

    const faqJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'How does Typecade calculate WPM?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'One "word" equals 5 keystrokes, including spaces. Raw WPM = (Total Keystrokes / 5) / Time in Minutes. Uncorrected errors reduce the final score.',
                },
            },
            {
                '@type': 'Question',
                name: 'Is Typecade free to use?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. All typing tests, learning modules, and multiplayer races are free. Sign up to save your stats and appear on leaderboards.',
                },
            },
            {
                '@type': 'Question',
                name: 'What practice modes does Typecade offer?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Typecade offers Time, Words, Quote, and Custom text modes. You can toggle punctuation and numbers for realistic practice.',
                },
            },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />

            <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-foreground/80 space-y-14 relative z-10">

                {/* Header */}
                <header className="space-y-4">
                    <h1 className="text-3xl md:text-5xl font-bold text-foreground font-display tracking-tight">
                        About Typecade
                    </h1>
                    <p className="text-lg text-text-dim leading-relaxed max-w-2xl">
                        Typecade is a typing speed test and touch typing trainer. Measure your WPM, race other typists in real-time, or work through structured lessons — all for free.
                    </p>
                </header>

                {/* Core Features */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-foreground font-display">Core Features</h2>
                    <div className="grid sm:grid-cols-2 gap-5">
                        <div className="bg-foreground/5 p-6 rounded-2xl border border-foreground/10 hover:border-accent/20 transition-colors">
                            <h3 className="font-bold text-foreground mb-2">Flexible Practice Modes</h3>
                            <p className="text-sm leading-relaxed">Customize your training with Time, Words, Quote, or Custom text modes. Toggle punctuation and numbers to replicate coding and data entry environments.</p>
                        </div>
                        <div className="bg-foreground/5 p-6 rounded-2xl border border-foreground/10 hover:border-accent/20 transition-colors">
                            <h3 className="font-bold text-foreground mb-2">Structured Learning Path</h3>
                            <p className="text-sm leading-relaxed">The Learn module offers step-by-step interactive lessons from home-row placement to full keyboard mastery across 5 progressive modules.</p>
                        </div>
                        <div className="bg-foreground/5 p-6 rounded-2xl border border-foreground/10 hover:border-accent/20 transition-colors">
                            <h3 className="font-bold text-foreground mb-2">Multiplayer Arena</h3>
                            <p className="text-sm leading-relaxed">Create or join real-time typing races. Compete against friends or strangers with live WPM tracking and finish-line results.</p>
                        </div>
                        <div className="bg-foreground/5 p-6 rounded-2xl border border-foreground/10 hover:border-accent/20 transition-colors">
                            <h3 className="font-bold text-foreground mb-2">Analytics &amp; Leaderboards</h3>
                            <p className="text-sm leading-relaxed">Create a free account to track your WPM history, review accuracy trends, and see where you rank on the global Board.</p>
                        </div>
                    </div>
                </section>

                {/* How WPM is Calculated */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground font-display">How We Calculate WPM</h2>
                    <p className="leading-relaxed text-[15px]">
                        One &quot;word&quot; equals 5 keystrokes, including spaces. Your raw WPM is calculated by dividing your total keystrokes by 5, then dividing by the elapsed time in minutes. Uncorrected errors reduce the final score, so your displayed WPM always reflects true accuracy.
                    </p>
                </section>

                {/* Typing Tips */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground font-display">Typing Tips</h2>
                    <ul className="space-y-3 text-[15px] leading-relaxed">
                        <li className="flex gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/15 text-accent text-xs font-bold shrink-0 mt-0.5">1</span>
                            <span><strong className="text-foreground">Touch Type:</strong> Keep your index fingers on F and J. Never look down at the keyboard.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/15 text-accent text-xs font-bold shrink-0 mt-0.5">2</span>
                            <span><strong className="text-foreground">Accuracy First:</strong> Backspacing kills WPM. Aim for 98%+ accuracy before pushing speed.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/15 text-accent text-xs font-bold shrink-0 mt-0.5">3</span>
                            <span><strong className="text-foreground">Good Posture:</strong> Sit up straight, keep your wrists slightly elevated, and tap keys lightly.</span>
                        </li>
                    </ul>
                </section>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row items-start gap-4 pt-4 border-t border-foreground/5">
                    <Button variant="primary" size="lg" asChild className="font-bold shadow-[0_0_24px_rgba(var(--accent-rgb),0.3)]">
                        <Link href="/">
                            Start Typing Test
                        </Link>
                    </Button>
                    <Button variant="outline" size="lg" asChild className="font-bold">
                        <Link href="/learn">
                            Explore Lessons
                        </Link>
                    </Button>
                </div>

            </main>
        </>
    );
}
