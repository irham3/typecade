import type { Metadata } from "next";
import Link from "next/link";
import { HomeClient } from "@/app/client";
import { Globe, ArrowRight } from "@/components/icons";

export const metadata: Metadata = {
    title: "Tes Mengetik Online Gratis & Latihan Touch Typing - Typecade",
    description:
        "Tes kecepatan mengetik gratis dengan balapan multiplayer waktu nyata, papan peringkat global, dan modul latihan mengetik 5 tingkat. Tanpa pendaftaran.",
    keywords: [
        "tes mengetik",
        "tes kecepatan mengetik",
        "latihan mengetik",
        "typecade",
        "mengetik 10 jari",
        "touch typing indonesia",
        "wpm test indonesia",
    ],
    alternates: {
        canonical: "/id",
        languages: {
            en: "https://typecade.com/",
            "x-default": "https://typecade.com/",
            id: "https://typecade.com/id",
        },
    },
    openGraph: {
        title: "Tes Mengetik Online Gratis - Typecade",
        description:
            "Tes kecepatan mengetik gratis dengan balapan multiplayer dan papan peringkat global. Latihan mengetik 10 jari dengan kurikulum terstruktur.",
        url: "https://typecade.com/id",
        siteName: "Typecade",
        locale: "id_ID",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Tes Mengetik Online Gratis - Typecade",
        description:
            "Tes kecepatan mengetik gratis dengan balapan multiplayer dan papan peringkat global.",
    },
};

export default function IndonesianHomePage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "Typecade",
        url: "https://typecade.com/id",
        description:
            "Tes mengetik online gratis dengan balapan multiplayer waktu nyata dan latihan touch typing.",
        inLanguage: "id-ID",
        applicationCategory: "EducationalApplication",
        operatingSystem: "All",
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Visible H1 + Indonesian value-prop below the typing area.
                The sr-only H1 also serves the SEO crawler as a keyword-rich
                complement to the layout-level H1. */}
            <h1 className="sr-only">
                Typecade: Tes Mengetik Online Gratis & Latihan Touch Typing Bahasa Indonesia
            </h1>

            <HomeClient />

            <section
                aria-labelledby="id-promo-heading"
                className="w-full max-w-5xl px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24 pt-8 sm:pt-16"
            >
                <h2
                    id="id-promo-heading"
                    className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-center text-foreground max-w-3xl mx-auto leading-[1.1]"
                >
                    Uji kecepatan mengetik Anda.{" "}
                    <span className="text-accent">Tanpa pendaftaran.</span>
                </h2>

                <p className="text-base sm:text-lg text-text-dim text-center mt-5 max-w-2xl mx-auto leading-relaxed">
                    Tes mengetik gratis dengan balapan multiplayer waktu nyata, kurikulum touch
                    typing 5 modul, dan papan peringkat global. Daftar hanya jika Anda ingin
                    progres Anda tersimpan.
                </p>

                <div className="grid sm:grid-cols-3 gap-4 sm:gap-5 mt-10 sm:mt-14">
                    {[
                        {
                            href: "/arena",
                            title: "Balapan real-time",
                            body: "Buat room atau bergabung dengan arena terbuka. Bar WPM langsung, lawan langsung, tanpa lag.",
                        },
                        {
                            href: "/learn",
                            title: "Belajar dengan cara yang benar",
                            body: "Lima modul terstruktur membawa Anda dari home row hingga kelancaran penuh pada keyboard.",
                        },
                        {
                            href: "/board",
                            title: "Klaim papan peringkat",
                            body: "WPM dan akurasi terbaik Anda dilacak per mode tes. Masuk untuk menyimpannya.",
                        },
                    ].map((feature) => (
                        <Link
                            key={feature.href}
                            href={feature.href}
                            className="group block h-full p-6 rounded-2xl bg-foreground/5 border border-foreground/5 hover:border-accent/30 hover:bg-accent/5 transition-all duration-300"
                        >
                            <h3 className="font-display font-bold text-base text-foreground mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-sm text-text-dim leading-relaxed">
                                {feature.body}
                            </p>
                            <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-accent/70 group-hover:text-accent transition-colors">
                                Buka
                                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>

                <p className="mt-10 sm:mt-14 text-center text-xs font-mono uppercase tracking-widest text-text-dim/70">
                    Dibangun dengan Next.js · Ditenagai oleh Supabase · Gratis selamanya
                </p>
            </section>

            <div className="w-full max-w-3xl px-4 sm:px-6 pb-12 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 border border-foreground/10 text-xs font-mono text-text-dim">
                    <Globe size={12} />
                    <span>Anda membaca versi Bahasa Indonesia.</span>
                    <Link
                        href="/"
                        className="text-accent hover:underline underline-offset-2"
                    >
                        Switch to English
                    </Link>
                </div>
            </div>
        </>
    );
}