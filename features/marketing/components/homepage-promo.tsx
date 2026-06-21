"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, GraduationCap, Trophy, ArrowRight } from "@/components/icons";

const features = [
    {
        href: "/arena",
        icon: Users,
        title: "Race in real time",
        body: "Host a room or jump into an open arena. Live WPM bars, live opponents, no lag.",
    },
    {
        href: "/learn",
        icon: GraduationCap,
        title: "Learn the right way",
        body: "Five structured modules take you from home row to full keyboard fluency.",
    },
    {
        href: "/board",
        icon: Trophy,
        title: "Claim the leaderboard",
        body: "Your best WPM and accuracy are tracked per test mode. Sign in to keep them.",
    },
];

const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
    }),
};

/**
 * Marketing block that sits below the typing area on the homepage.
 * Three jobs:
 *   1. Tell first-time visitors what Typecade is and why it exists.
 *   2. Route curious users to the three other top-level features.
 *   3. Give the page visible H1 + body content for crawlers and humans
 *      (the typing area itself has sr-only headings only).
 *
 * Kept client-side because the parent page already client-renders the
 * typing area; rendering this server-side would require splitting the
 * typing area into its own boundary and is not worth the cost here.
 */
export function HomepagePromo() {
    return (
        <section
            aria-labelledby="homepage-promo-heading"
            className="w-full max-w-5xl px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24 pt-8 sm:pt-16"
        >
            {/* Visible H1 — also satisfies the SEO H1 requirement
                without having to put it on the sr-only-only typing page */}
            <motion.h1
                id="homepage-promo-heading"
                custom={0}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={fadeUp}
                className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-center text-foreground max-w-3xl mx-auto leading-[1.1]"
            >
                Type faster. <span className="text-accent">Think clearer.</span>
            </motion.h1>

            <motion.p
                custom={1}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={fadeUp}
                className="text-base sm:text-lg text-text-dim text-center mt-5 max-w-2xl mx-auto leading-relaxed"
            >
                A free typing test with real-time multiplayer races, a five-module
                touch-typing curriculum, and global leaderboards. No signup
                required to play — sign in only when you want your progress saved.
            </motion.p>

            <div className="grid sm:grid-cols-3 gap-4 sm:gap-5 mt-10 sm:mt-14">
                {features.map((feature, i) => (
                    <motion.div
                        key={feature.href}
                        custom={i + 2}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-60px" }}
                        variants={fadeUp}
                    >
                        <Link
                            href={feature.href}
                            className="group block h-full p-6 rounded-2xl bg-foreground/5 border border-foreground/5 hover:border-accent/30 hover:bg-accent/5 transition-all duration-300"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 rounded-xl bg-background border border-foreground/10 text-accent group-hover:scale-110 transition-transform">
                                    <feature.icon size={20} />
                                </div>
                                <h3 className="font-display font-bold text-base text-foreground">
                                    {feature.title}
                                </h3>
                            </div>
                            <p className="text-sm text-text-dim leading-relaxed">
                                {feature.body}
                            </p>
                            <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-accent/70 group-hover:text-accent transition-colors">
                                Open
                                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Social proof / trust line — even at small scale it converts
                better than silence. Update the number as you grow. */}
            <motion.p
                custom={5}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                className="mt-10 sm:mt-14 text-center text-xs font-mono uppercase tracking-widest text-text-dim/70"
            >
                Built with Next.js · Powered by Supabase · Free forever
            </motion.p>
        </section>
    );
}