import { Metadata } from 'next';
import { LEARN_MODULES } from '@/features/learn/data/lessons';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, ChevronRight, Play } from 'lucide-react';

export async function generateStaticParams() {
    return LEARN_MODULES.map((module) => ({
        moduleSlug: module.slug,
    }));
}

export async function generateMetadata({ params }: { params: Promise<{ moduleSlug: string }> }): Promise<Metadata> {
    const { moduleSlug } = await params;
    const learnModule = LEARN_MODULES.find((m) => m.slug === moduleSlug);

    if (!learnModule) {
        return { title: 'Module Not Found | Typecade' };
    }

    return {
        title: `${learnModule.title} | Touch Typing Curriculum`,
        description: learnModule.description,
        openGraph: {
            title: `${learnModule.title} | Typecade Learn`,
            description: learnModule.description,
            type: 'website',
            images: [
                {
                    url: '/opengraph-image.png',
                    width: 1200,
                    height: 630,
                    alt: `${learnModule.title} | Typecade Learn`,
                },
            ],
        },
    };
}

export default async function ModulePage({ params }: { params: Promise<{ moduleSlug: string }> }) {
    const { moduleSlug } = await params;
    const learnModule = LEARN_MODULES.find((m) => m.slug === moduleSlug);

    if (!learnModule) {
        notFound();
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: learnModule.title,
        description: learnModule.description,
        provider: {
            '@type': 'Organization',
            name: 'Typecade',
            url: 'https://typecade.com'
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-16 md:py-24 space-y-12 relative z-10">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-text-dim text-sm font-medium">
                    <Link href="/learn" className="hover:text-white transition-colors">Curriculum</Link>
                    <ChevronRight size={14} className="opacity-30" />
                    <span className="text-accent">{learnModule.title.split(':')[0]}</span>
                </nav>

                {/* Header */}
                <header className="space-y-6">
                    <div className="p-3 bg-accent/10 border border-accent/20 rounded-2xl w-fit text-accent">
                        <BookOpen size={32} />
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-3xl md:text-5xl font-black text-foreground font-display tracking-tight">
                            {learnModule.title}
                        </h1>
                        <p className="text-xl text-text-dim leading-relaxed max-w-2xl">
                            {learnModule.description}
                        </p>
                    </div>
                </header>

                {/* Lesson List */}
                <section className="space-y-6">
                    <h2 className="text-xl font-bold text-foreground border-b border-foreground/5 pb-4">Syllabus Overview</h2>
                    <div className="grid gap-3">
                        {learnModule.lessons.map((lesson, idx) => (
                            <Link 
                                key={lesson.id} 
                                href={`/learn/${learnModule.slug}/${lesson.slug}`}
                                className="group flex items-center justify-between p-5 rounded-2xl bg-foreground/5 border border-foreground/5 hover:border-accent/30 hover:bg-accent/5 transition-all"
                            >
                                <div className="flex items-center gap-5">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-background border border-foreground/10 text-xs font-bold text-text-dim group-hover:text-accent transition-colors">
                                        {idx + 1}
                                    </span>
                                    <div>
                                        <h3 className="font-bold text-foreground group-hover:text-accent transition-colors">{lesson.title}</h3>
                                        <p className="text-xs text-text-dim leading-relaxed">{lesson.instruction}</p>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-text-dim group-hover:text-accent transition-transform group-hover:translate-x-1" />
                            </Link>
                        ))}
                    </div>
                </section>

                <div className="pt-8 flex items-center gap-4">
                    <Button variant="primary" size="lg" asChild className="font-bold rounded-xl px-8 shadow-lg shadow-accent/20">
                        <Link href={`/learn/${learnModule.slug}/${learnModule.lessons[0].slug}`} className="flex items-center gap-2">
                            <Play size={16} fill="currentColor" />
                            Begin Module
                        </Link>
                    </Button>
                    <Button variant="ghost" size="lg" asChild className="text-text-dim hover:text-white">
                        <Link href="/learn" className="flex items-center gap-2">
                            <ArrowLeft size={16} /> Back to Library
                        </Link>
                    </Button>
                </div>
            </main>
        </>
    );
}
