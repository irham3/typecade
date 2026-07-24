import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Keyboard, Shield, Trophy, Zap, BarChart3, GraduationCap, Users } from 'lucide-react';

export const metadata: Metadata = {
    title: 'About Typecade | The Professional Touch Typing Performance Platform',
    description: 'Typecade is a minimalist, high-performance typing platform. Learn our methodology for WPM calculation, explore our structured curriculum, and discover how we help typists reach 100+ WPM through precision practice.',
    keywords: ['about typecade', 'typing test methodology', 'wpm calculation standard', 'touch typing platform', 'typing speed metrics', 'pro typist tools'],
    alternates: {
        canonical: 'https://typecade.com/about',
    },
    openGraph: {
        title: 'About Typecade | High-Performance Typing Practice',
        description: 'Discover the methodology and features behind the internet\'s most minimalist typing platform.',
        type: 'website',
        url: 'https://typecade.com/about',
        images: [
            {
                url: "/opengraph-image.png",
                width: 1200,
                height: 630,
                alt: "Typecade Platform Overview",
            },
        ],
    },
};

export default function AboutPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebPage',
                '@id': 'https://typecade.com/about#webpage',
                url: 'https://typecade.com/about',
                name: 'About Typecade',
                description: 'The methodology, technology, and philosophy behind the Typecade typing platform.',
                isPartOf: { '@id': 'https://typecade.com/#website' },
            },
            {
                '@type': 'Organization',
                '@id': 'https://typecade.com/#organization',
                name: 'Typecade',
                url: 'https://typecade.com',
                logo: 'https://typecade.com/typecade-logo.png',
                sameAs: [
                    'https://github.com/irham3/typecade'
                ],
            },
            {
                '@type': 'FAQPage',
                mainEntity: [
                    {
                        '@type': 'Question',
                        name: 'How is WPM calculated on Typecade?',
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: 'Typecade follows the global standard where one "word" equals exactly five keystrokes, including spaces. We calculate raw speed and then adjust for accuracy to ensure your performance metrics are realistic and comparable to professional standards.',
                        },
                    },
                    {
                        '@type': 'Question',
                        name: 'Can I use Typecade for free?',
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: 'Yes. Typecade is a free-to-use platform. All modules, including the Multiplayer Arena and the Learn curriculum, are accessible to all users without cost. Creating an account allows for persistent progress tracking and leaderboard positioning.',
                        },
                    },
                ],
            },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <main className="flex-1 w-full max-w-5xl mx-auto px-6 lg:px-12 py-16 md:py-28 relative z-10">
                {/* Hero / Intro */}
                <article className="max-w-full mb-24 overflow-visible">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold uppercase tracking-widest mb-6">
                        <Zap size={12} fill="currentColor" />
                        Performance Focused
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-foreground font-display tracking-tight leading-[1.1] mb-8">
                        Precision-Engineered <br />
                        <span className="text-accent underline decoration-accent/30 underline-offset-8">Typing Performance.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-text-dim leading-relaxed font-medium">
                        Typecade is more than just a speed test. It is a high-performance environment designed for typists who value precision, minimalist design, and deep technical metrics. Our platform removes the clutter of modern web interfaces to let you focus on what matters: your muscle memory.
                    </p>
                </article>

                {/* The Tech / Methodology */}
                <section className="grid md:grid-cols-2 gap-12 md:gap-20 mb-32 items-center">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-accent bg-accent/5 w-fit px-4 py-2 rounded-xl border border-accent/10">
                            <BarChart3 size={20} />
                            <h2 className="text-lg font-bold font-display uppercase tracking-wider">The Standard Methodology</h2>
                        </div>
                        <p className="text-text-dim leading-relaxed">
                            To ensure global comparability, Typecade adheres to the standardized <strong>&quot;5-character word&quot;</strong> rule. Instead of counting individual dictionary words, we treat every 5 keystrokes (including spaces and punctuation) as one word of progress.
                        </p>
                        <p className="text-text-dim leading-relaxed">
                            This eliminates the variance between simple and complex texts, providing a baseline metric that is consistent across all modes, from 15-second sprints to long-form quote practice.
                        </p>
                        <div className="grid grid-cols-2 gap-6 pt-4">
                            <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/5 shadow-inner">
                                <span className="block text-2xl font-bold text-foreground">5KPH</span>
                                <span className="text-xs text-text-dim uppercase font-bold tracking-widest">Standard Word</span>
                            </div>
                            <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/5 shadow-inner">
                                <span className="block text-2xl font-bold text-foreground">98%⁺</span>
                                <span className="text-xs text-text-dim uppercase font-bold tracking-widest">Target Accuracy</span>
                            </div>
                        </div>
                    </div>
                    <div className="relative group">
                        <div className="relative p-8 rounded-3xl bg-panel-bg border border-border-dim shadow-sm overflow-hidden">
                            <h3 className="text-xl font-bold text-foreground mb-4 font-mono tracking-tight">Accuracy vs Speed</h3>
                            <p className="text-sm text-text-dim mb-6 leading-relaxed">
                                Our engine prioritizes accuracy above all. In our scoring algorithm, uncorrected errors are penalized. We recommend typists aim for near-perfect accuracy before attempting to break the 100 WPM barrier.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-sm text-foreground/70">
                                    <Shield size={16} className="text-accent" />
                                    <span>Real-time error highlighting</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm text-foreground/70">
                                    <Shield size={16} className="text-accent" />
                                    <span>Corrective backspace settings</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm text-foreground/70">
                                    <Shield size={16} className="text-accent" />
                                    <span>Detailed per-key accuracy tracking</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="space-y-12 mb-32">
                    <header className="text-center space-y-4 max-w-2xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-black text-foreground font-display">Engineered for Mastery</h2>
                        <p className="text-text-dim">Everything you need to reach elite typing speeds, built with a performance-first philosophy.</p>
                    </header>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {[
                            {
                                icon: <Zap size={24} className="text-accent" />,
                                title: "Diverse Formats",
                                desc: "Switch between Time, Words, Quote, and Custom text to train different aspects of your typing rhythm."
                            },
                            {
                                icon: <GraduationCap size={24} className="text-accent" />,
                                title: "Guided Path",
                                desc: "Our 5-module curriculum takes you from home-row basics to complex integration with symbols and numbers."
                            },
                            {
                                icon: <Users size={24} className="text-accent" />,
                                title: "Real-time Arena",
                                desc: "Low-latency multiplayer races with global matchmaking and private lobbies for competitive group practice."
                            },
                            {
                                icon: <Trophy size={24} className="text-accent" />,
                                title: "Performance Board",
                                desc: "Track your rank globally. Our leaderboards capture top WPM scores across all standard test durations."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-foreground/5 border border-foreground/5 hover:border-accent/30 hover:bg-accent/5 transition-all duration-300 group cursor-default">
                                <div className="mb-4 p-3 rounded-xl bg-background border border-foreground/10 w-fit group-hover:scale-110 transition-transform duration-300 shadow-lg glow-accent">
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                                <p className="text-sm text-text-dim leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Typing Philosophy */}
                <section className="p-8 md:p-16 rounded-3xl bg-panel-elevated border border-border-dim relative overflow-hidden mb-32">
                    <div className="max-w-3xl relative z-10 space-y-8">
                        <h2 className="text-3xl font-black text-foreground font-display tracking-tight leading-tight">
                            &quot;The keyboard is the primary interface between <br /> the human mind and the digital world.&quot;
                        </h2>
                        <div className="space-y-4 text-text-dim text-lg leading-relaxed font-medium">
                            <p>
                                At Typecade, we believe that touch typing is more than just a data entry skill &mdash; it&apos;s a creative velocity. When you master your keyboard, the friction between thought and code disappears.
                            </p>
                            <p>
                                Our goal is to make that mastery accessible to everyone through a platform that is fast, beautiful, and fundamentally useful. No distractions, no gamification noise. Just pure performance.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Final CTA Card */}
                <section className="w-full">
                    <div className="bg-panel-bg border border-border-dim rounded-3xl p-8 md:p-16 text-center space-y-10 shadow-sm overflow-hidden">
                        <div className="space-y-4 relative z-10">
                            <h2 className="text-3xl md:text-5xl font-black text-foreground font-display tracking-tighter uppercase italic">
                                Ready to scale your speed?
                            </h2>
                            <p className="text-text-dim text-lg md:text-xl font-medium max-w-2xl mx-auto">
                                Join our global community of typists. Create a profile to track your growth, or jump straight into a race and test your limits.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
                            <Button
                                variant="primary"
                                size="lg"
                                asChild
                                className="w-full sm:w-auto px-8 h-16 text-lg font-bold rounded-2xl shadow-sm transition-all active:scale-95"
                            >
                                <Link href="/" className="flex items-center gap-3">
                                    <Keyboard size={20} fill="currentColor" />
                                    Launch Performance Test
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                asChild
                                className="w-full sm:w-auto px-8 h-16 text-lg font-bold rounded-2xl bg-foreground/5 border-foreground/10 hover:bg-foreground/10 hover:border-foreground/20 transition-all"
                            >
                                <Link href="/learn" className="flex items-center gap-3">
                                    <GraduationCap size={20} />
                                    Explore Curriculum
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}

