import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "About — Typecade",
    description: "Typecade is a focused typing practice. Less is more.",
    alternates: {
        canonical: "https://typecade.com/about",
    },
    openGraph: {
        title: "About — Typecade",
        description: "Typecade is a focused typing practice. Less is more.",
        type: "website",
        url: "https://typecade.com/about",
        images: [
            {
                url: "/opengraph-image.png",
                width: 1200,
                height: 630,
                alt: "About — Typecade",
            },
        ],
    },
};

export default function AboutPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebPage",
                "@id": "https://typecade.com/about#webpage",
                url: "https://typecade.com/about",
                name: "About — Typecade",
                isPartOf: { "@id": "https://typecade.com/#website" },
            },
            {
                "@type": "Organization",
                "@id": "https://typecade.com/#organization",
                name: "Typecade",
                url: "https://typecade.com",
                logo: "https://typecade.com/typecade-logo.png",
                sameAs: ["https://github.com/irham3/typecade"],
            },
            {
                "@type": "FAQPage",
                mainEntity: [
                    {
                        "@type": "Question",
                        name: "How is WPM calculated?",
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: "Every five keystrokes count as one word. Spaces and punctuation included. This is the universal standard used by typing tools since the 1980s, so your scores line up with what you&apos;d see anywhere else.",
                        },
                    },
                    {
                        "@type": "Question",
                        name: "Is it free?",
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: "Yes. Every feature is free. Sign in if you want your results saved across devices; skip it if you don&apos;t.",
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

            <main className="flex-1 w-full max-w-3xl mx-auto px-6 lg:px-0 py-20 md:py-28 relative z-10">
                {/* Quiet header — no badge, no chip, no marketing accent. */}
                <h1 className="font-display text-5xl md:text-7xl font-black text-foreground tracking-[-0.03em] leading-[0.95] mb-10">
                    Less is<br />
                    <span className="text-accent">more.</span>
                </h1>

                <p className="text-xl md:text-2xl text-text-dim leading-[1.5] font-display font-normal max-w-2xl mb-20">
                                    A typing test that gets out of the way. No progress to chase, no
                                    streaks to maintain. Just you and the words.
                                </p>

                {/* The methodology — minimal, no decoration. */}
                <section className="border-t border-border-dim pt-12 mb-20">
                    <div className="flex items-baseline gap-4 mb-6">
                        <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim">01</span>
                        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                            One rule.
                        </h2>
                    </div>
                    <p className="text-lg text-text-dim leading-relaxed mb-6">
                        Five keystrokes is one word. Spaces and punctuation count. Same
                        rule every typing tool has used since the 1980s — adopted here
                        so the score you see on Typecade matches what you&apos;d see anywhere
                        else.
                    </p>
                    <p className="text-lg text-text-dim leading-relaxed">
                        Accuracy is weighted over speed. An uncorrected mistake costs
                        more than the keystroke that caused it. We tell you this once
                        and then we trust you to use it well.
                    </p>
                </section>

                {/* What&apos;s here — three items, no icons, no card backgrounds. */}
                <section className="border-t border-border-dim pt-12 mb-20">
                    <div className="flex items-baseline gap-4 mb-6">
                        <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim">02</span>
                        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                            What&apos;s here.
                        </h2>
                    </div>

                    <ul className="space-y-8">
                                            <li>
                                                <Link href="/" className="font-display text-lg font-bold text-foreground mb-1 hover:text-accent transition-colors inline-block">
                                                    Practice
                                                </Link>
                                                <p className="text-text-dim leading-relaxed">
                                                    Time, words, quotes, or your own text. Pick the format and
                                                    the duration. The page remembers your last choice.
                                                </p>
                                            </li>
                                            <li>
                                                <Link href="/arena" className="font-display text-lg font-bold text-foreground mb-1 hover:text-accent transition-colors inline-block">
                                                    Arena
                                                </Link>
                                                <p className="text-text-dim leading-relaxed">
                                                    Real-time races against other typists. WPM bars update as
                                                    you go. No lag, no waiting rooms.
                                                </p>
                                            </li>
                                            <li>
                                                <Link href="/learn" className="font-display text-lg font-bold text-foreground mb-1 hover:text-accent transition-colors inline-block">
                                                    Learn
                                                </Link>
                                                <p className="text-text-dim leading-relaxed">
                                                    A five-module curriculum from home row to total fluency.
                                                    Short, focused lessons. No video.
                                                </p>
                                            </li>
                                            <li>
                                                <Link href="/board" className="font-display text-lg font-bold text-foreground mb-1 hover:text-accent transition-colors inline-block">
                                                    Board
                                                </Link>
                                                <p className="text-text-dim leading-relaxed">
                                                    Top scores across all modes and durations. Sign in only if
                                                    you want your results remembered.
                                                </p>
                                            </li>
                                        </ul>
                </section>

                {/* What&apos;s not here — restraint as a feature. */}
                <section className="border-t border-border-dim pt-12 mb-20">
                    <div className="flex items-baseline gap-4 mb-6">
                        <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim">03</span>
                        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                            What&apos;s not here.
                        </h2>
                    </div>
                    <p className="text-lg text-text-dim leading-relaxed">
                                            No avatars, no levels, no daily quests, no achievements, no
                                            &quot;premium&quot; tier. No notifications. No email unless you ask for it.
                                            The page is the product.
                                        </p>
                </section>

                {/* Sign-off, single line, no CTA button. */}
                <p className="font-display text-base text-text-dim/60 tracking-wide">
                    made by a typist, for typists.
                </p>
            </main>
        </>
    );
}