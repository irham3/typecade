import type { Metadata } from "next";
import Link from "next/link";
import { Keyboard, ArrowRight, Trophy, Target, Clock, Zap } from "@/components/icons";
import { Button } from "@/components/ui/button";

// Compact, opaque encoder for shareable result URLs. We DON'T sign or
// validate these — anyone can craft a link. That's fine: the only thing
// the slug controls is which numbers show on the result preview page.
function decodeSlug(slug: string): { wpm: number; accuracy: number; mode: string } | null {
    // Format: w<wpm>a<accuracy>m<modeIndex>
    // Example: w87a96m2 → 87 WPM, 96% accuracy, mode index 2 = "Time 60s"
    const m = slug.match(/^w(\d{1,3})a(\d{1,3})m(\d)$/);
    if (!m) return null;
    const wpm = Number(m[1]);
    const acc = Number(m[2]);
    const modeIdx = Number(m[3]);
    const modes = ["Time 15s", "Time 30s", "Time 60s", "Time 120s", "Words 10", "Words 25", "Words 50", "Words 100", "Quote"];
    if (wpm < 1 || wpm > 250 || acc < 1 || acc > 100) return null;
    return { wpm, accuracy: acc, mode: modes[modeIdx] ?? "Time 60s" };
}

export function generateResultSlug(wpm: number, accuracy: number, modeLabel: string): string {
    const modes = ["Time 15s", "Time 30s", "Time 60s", "Time 120s", "Words 10", "Words 25", "Words 50", "Words 100", "Quote"];
    const idx = modes.indexOf(modeLabel);
    return `w${Math.round(wpm)}a${Math.round(accuracy)}m${idx >= 0 ? idx : 2}`;
}

// Pre-render a small grid of popular result pages so static export works.
// Any slug NOT in this list will 404 as a pre-rendered route, but the
// generator in /r/[slug]/page.tsx is forgiving — a 404 on a non-pre-rendered
// result still serves a clean "result not found" page via the app router.
// In practice, real users share links that follow the slug format, so
// future enhancement is to ship a small static catch-all that decodes any
// well-formed slug at the edge.
export function generateStaticParams() {
    const slugs = [];
    for (const wpm of [40, 60, 80, 100, 120]) {
        for (const acc of [95, 97, 98, 99]) {
            for (const m of [0, 2, 6]) {
                slugs.push({ slug: `w${wpm}a${acc}m${m}` });
            }
        }
    }
    return slugs;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const result = decodeSlug(slug);

    if (!result) {
        return {
            title: "Typing Result - Typecade",
            description: "See this typing test result on Typecade.",
        };
    }

    const title = `${result.wpm} WPM at ${result.accuracy}% accuracy - Typecade`;
    const description = `Someone just hit ${result.wpm} WPM with ${result.accuracy}% accuracy in ${result.mode} mode on Typecade. Can you beat it?`;

    return {
        title,
        description,
        alternates: { canonical: `/r/${slug}` },
        openGraph: {
            type: "website",
            url: `https://typecade.com/r/${slug}`,
            siteName: "Typecade",
            title,
            description,
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
    };
}

export default async function ResultSharePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const result = decodeSlug(slug);

    // JSON-LD for the share page — communicates the result data to crawlers.
    const jsonLd = result ? {
        "@context": "https://schema.org",
        "@type": "SocialMediaPosting",
        headline: `${result.wpm} WPM at ${result.accuracy}% accuracy`,
        articleBody: `Typing test result on Typecade: ${result.wpm} WPM, ${result.accuracy}% accuracy, ${result.mode} mode.`,
        author: { "@type": "Organization", name: "Typecade" },
        publisher: { "@type": "Organization", name: "Typecade", url: "https://typecade.com" },
    } : null;

    if (!result) {
        return (
            <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-24 flex flex-col items-center text-center">
                <h1 className="text-3xl font-display font-black text-foreground mb-4">
                    Result link not found
                </h1>
                <p className="text-text-dim mb-8 max-w-md">
                                        This result link doesn&apos;t look right. It may have been mistyped, or
                                        the original test was taken on a different version of Typecade.
                                    </p>
                <Button variant="primary" size="lg" asChild>
                    <Link href="/">
                        <Keyboard size={18} className="mr-2" />
                        Start your own test
                    </Link>
                </Button>
            </main>
        );
    }

    const perfLabel =
        result.wpm >= 100 ? "Elite tier" :
            result.wpm >= 80 ? "Pro typist" :
                result.wpm >= 60 ? "Solid" :
                    result.wpm >= 40 ? "Building speed" :
                        "Getting started";

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}

            <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-16 md:py-24">
                {/* Eyebrow */}
                <div className="flex justify-center mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold uppercase tracking-widest">
                        <Zap size={12} fill="currentColor" />
                        Shared typing result
                    </div>
                </div>

                {/* Headline result */}
                <div className="text-center mb-12">
                    <div className="font-mono text-[6rem] md:text-[9rem] leading-none font-bold text-foreground tracking-tighter text-glow-accent">
                        {result.wpm}
                    </div>
                    <div className="text-sm font-mono text-accent uppercase tracking-[0.25em] mt-2">
                        words per minute
                    </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-10">
                    <div className="glass rounded-2xl p-4 flex flex-col items-center">
                        <Target size={20} className="text-accent mb-2" />
                        <span className="text-[10px] text-text-dim uppercase tracking-widest font-mono mb-1">Accuracy</span>
                        <span className="text-2xl font-mono font-bold text-foreground">{result.accuracy}%</span>
                    </div>
                    <div className="glass rounded-2xl p-4 flex flex-col items-center">
                        <Clock size={20} className="text-accent mb-2" />
                        <span className="text-[10px] text-text-dim uppercase tracking-widest font-mono mb-1">Mode</span>
                        <span className="text-base font-mono font-bold text-foreground">{result.mode}</span>
                    </div>
                    <div className="glass rounded-2xl p-4 flex flex-col items-center">
                        <Trophy size={20} className="text-accent mb-2" />
                        <span className="text-[10px] text-text-dim uppercase tracking-widest font-mono mb-1">Tier</span>
                        <span className="text-base font-mono font-bold text-foreground">{perfLabel}</span>
                    </div>
                </div>

                {/* CTA */}
                <div className="bg-panel-bg border border-border-dim rounded-3xl p-8 md:p-10 text-center space-y-6">
                    <h2 className="text-2xl md:text-3xl font-black font-display text-foreground">
                        Can you beat {result.wpm} WPM?
                    </h2>
                    <p className="text-text-dim max-w-md mx-auto">
                        Take a free typing test now — no signup, no friction. See where
                        you rank against this score and everyone else on the board.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <Button variant="primary" size="lg" asChild className="gap-2 px-8 font-bold">
                            <Link href="/">
                                <Keyboard size={18} />
                                Take the test
                                <ArrowRight size={18} />
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" asChild>
                            <Link href="/board">See leaderboard</Link>
                        </Button>
                    </div>
                </div>
            </main>
        </>
    );
}