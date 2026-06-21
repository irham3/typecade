import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Users, Zap, GraduationCap } from "@/components/icons";

export const metadata: Metadata = {
    title: "Tentang Typecade - Platform Latihan Mengetik Profesional",
    description:
        "Pelajari metodologi perhitungan WPM, kurikulum 5 modul, dan bagaimana Typecade membantu Anda mencapai 100+ WPM melalui latihan presisi.",
    keywords: [
        "tentang typecade",
        "metodologi mengetik",
        "standar wpm",
        "platform mengetik profesional",
        "latihan mengetik 10 jari",
    ],
    alternates: {
        canonical: "/id/about",
        languages: {
            en: "https://typecade.com/about",
            "x-default": "https://typecade.com/about",
            id: "https://typecade.com/id/about",
        },
    },
};

export default function IndonesianAboutPage() {
    return (
        <main className="flex-1 w-full max-w-5xl mx-auto px-6 lg:px-12 py-16 md:py-28 relative z-10">
            <Link
                href="/id"
                className="inline-flex items-center gap-2 text-text-dim hover:text-foreground mb-8 text-sm font-mono transition-colors"
            >
                <ArrowLeft size={14} />
                Kembali ke Beranda
            </Link>

            <article className="mb-20">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold uppercase tracking-widest mb-6">
                    <Zap size={12} fill="currentColor" />
                    Fokus Performa
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-foreground font-display tracking-tight leading-[1.1] mb-8">
                    Latihan Mengetik
                    <br />
                    <span className="text-accent underline decoration-accent/30 underline-offset-8">
                        Yang Presisi.
                    </span>
                </h1>
                <p className="text-lg md:text-xl text-text-dim leading-relaxed font-medium">
                    Typecade adalah platform latihan mengetik minimalis dan berperforma tinggi,
                    dirancang untuk pengguna yang mengutamakan presisi, desain bersih, dan metrik
                    teknis yang mendalam. Kami membuang semua gangguan untuk membantu Anda fokus
                    pada yang penting: muscle memory mengetik Anda.
                </p>
            </article>

            <section className="grid md:grid-cols-2 gap-12 md:gap-20 mb-24 items-center">
                <div className="space-y-6">
                    <div className="flex items-center gap-3 text-accent bg-accent/5 w-fit px-4 py-2 rounded-xl border border-accent/10">
                        <Trophy size={20} />
                        <h2 className="text-lg font-bold font-display uppercase tracking-wider">
                            Metodologi Standar
                        </h2>
                    </div>
                    <p className="text-text-dim leading-relaxed">
                        Untuk memastikan hasil yang comparable secara global, Typecade mengikuti
                        aturan standar <strong>&quot;5 karakter = 1 kata&quot;</strong>. Setiap 5
                        tombol yang ditekan (termasuk spasi dan tanda baca) dihitung sebagai satu
                        kata.
                    </p>
                    <p className="text-text-dim leading-relaxed">
                        Pendekatan ini menghilangkan variabel antara teks sederhana dan kompleks,
                        memberikan metrik dasar yang konsisten di semua mode — dari sprint 15 detik
                        hingga latihan kutipan panjang.
                    </p>
                    <div className="grid grid-cols-2 gap-6 pt-4">
                        <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/5">
                            <span className="block text-2xl font-bold text-foreground">5K</span>
                            <span className="text-xs text-text-dim uppercase font-bold tracking-widest">
                                Standar Kata
                            </span>
                        </div>
                        <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/5">
                            <span className="block text-2xl font-bold text-foreground">98%⁺</span>
                            <span className="text-xs text-text-dim uppercase font-bold tracking-widest">
                                Akurasi Target
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-8 rounded-3xl bg-panel-bg border border-border-dim shadow-sm">
                    <h3 className="text-xl font-bold text-foreground mb-4 font-mono">
                        Akurasi vs Kecepatan
                    </h3>
                    <p className="text-sm text-text-dim mb-6 leading-relaxed">
                        Engine kami mengutamakan akurasi. Dalam algoritma penilaian, kesalahan yang
                        tidak dikoreksi dikenai penalti. Kami merekomendasikan typist mencapai
                        akurasi mendekati sempurna sebelum mencoba melampaui 100 WPM.
                    </p>
                    <ul className="space-y-3 text-sm text-foreground/70">
                        <li>✓ Highlight kesalahan secara real-time</li>
                        <li>✓ Pengaturan backspace korektif</li>
                        <li>✓ Tracking akurasi per tombol</li>
                    </ul>
                </div>
            </section>

            <section className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-black text-foreground font-display mb-4">
                    Dirancang untuk Mastery
                </h2>
                <p className="text-text-dim max-w-2xl mx-auto">
                    Semua yang Anda butuhkan untuk mencapai kecepatan mengetik elite, dibangun
                    dengan filosofi performa-pertama.
                </p>
            </section>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
                {[
                    { icon: GraduationCap, title: "5 Modul Terstruktur", body: "Kurikulum dari home row hingga integrasi penuh dengan simbol." },
                    { icon: Users, title: "Arena Real-time", body: "Balapan latensi rendah dengan matchmaking global dan lobby privat." },
                    { icon: Trophy, title: "Papan Performa", body: "Peringkat global. Leaderboard menangkap skor WPM terbaik di semua mode." },
                ].map((feature) => (
                    <div
                        key={feature.title}
                        className="p-6 rounded-2xl bg-foreground/5 border border-foreground/5"
                    >
                        <feature.icon size={24} className="text-accent mb-4" />
                        <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                        <p className="text-sm text-text-dim leading-relaxed">{feature.body}</p>
                    </div>
                ))}
            </div>

            <div className="bg-panel-bg border border-border-dim rounded-3xl p-8 md:p-16 text-center space-y-6">
                <h2 className="text-3xl md:text-4xl font-black text-foreground font-display">
                    Siap meningkatkan kecepatan Anda?
                </h2>
                <p className="text-text-dim text-lg max-w-2xl mx-auto">
                    Mulai latihan pertama Anda sekarang. Gratis, tanpa pendaftaran, tanpa batas.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Button variant="primary" size="lg" asChild>
                        <Link href="/id">Mulai Tes Gratis</Link>
                    </Button>
                    <Button variant="outline" size="lg" asChild>
                        <Link href="/id#learn">Lihat Kurikulum</Link>
                    </Button>
                </div>
            </div>
        </main>
    );
}