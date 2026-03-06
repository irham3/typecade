import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { Star, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LEARN_MODULES } from "../data/lessons";
import { useLearnStore } from "../store/learn-store";

export function LearnModule() {
    const { getLessonStat } = useLearnStore();
    const [activeModuleId, setActiveModuleId] = useState<string>(LEARN_MODULES[0].id);
    const [activeLessonId, setActiveLessonId] = useState<string>(LEARN_MODULES[0].lessons[0].id);
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
        [LEARN_MODULES[0].id]: true
    });

    // Modern bulletproof hydration check to avoid useEffect cascading renders
    const isMounted = useSyncExternalStore(
        () => () => { },
        () => true,
        () => false
    );

    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [canScrollTop, setCanScrollTop] = useState(false);
    const [canScrollBottom, setCanScrollBottom] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);

    const checkScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        setCanScrollTop(scrollTop > 0);
        setCanScrollBottom(Math.ceil(scrollTop + clientHeight) < scrollHeight - 2);

        setIsScrolling(true);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false);
        }, 1000);
    };

    // Re-check scroll on render/resize/collapse
    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [expandedModules]);

    const toggleModule = (id: string) => {
        setExpandedModules(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const currentModule = LEARN_MODULES.find(m => m.id === activeModuleId) || LEARN_MODULES[0];
    const currentLesson = currentModule.lessons.find(l => l.id === activeLessonId) || currentModule.lessons[0];

    const handleLessonSelect = (modId: string, lessId: string) => {
        setActiveModuleId(modId);
        setActiveLessonId(lessId);
    };

    return (
        <div className="w-full">
            <div className="w-full grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">

                {/* Left: Path/Curriculum Tree */}
                <div className="w-full lg:h-[calc(100vh-280px)] lg:min-h-[500px] lg:py-8 flex flex-col order-1 relative">
                    <div
                        ref={scrollRef}
                        onScroll={checkScroll}
                        className={`w-full flex-1 overflow-y-auto transition-all duration-300 ultra-thin-scroll ${!isScrolling ? 'hide-scroll-thumb' : ''}`}
                        style={{
                            maskImage: `linear-gradient(to bottom, ${canScrollTop ? 'transparent' : 'black'} 0%, black 2.5rem, black calc(100% - 2.5rem), ${canScrollBottom ? 'transparent' : 'black'} 100%)`,
                            WebkitMaskImage: `linear-gradient(to bottom, ${canScrollTop ? 'transparent' : 'black'} 0%, black 2.5rem, black calc(100% - 2.5rem), ${canScrollBottom ? 'transparent' : 'black'} 100%)`
                        }}
                    >
                        <div className="flex flex-col gap-8 w-full pr-2">
                            {LEARN_MODULES.map(module => {
                                const isExpanded = expandedModules[module.id];
                                return (
                                    <div key={module.id} className="flex flex-col">
                                        <button
                                            onClick={() => toggleModule(module.id)}
                                            className="w-full flex items-center justify-between group mb-4 text-left"
                                        >
                                            <h4 className="text-xs font-bold font-sans text-text-dim uppercase tracking-widest flex items-center gap-2 group-hover:text-white transition-colors">
                                                <motion.div
                                                    animate={{ rotate: isExpanded ? 0 : -90 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="text-accent"
                                                >
                                                    <ChevronDown size={14} className={isExpanded ? "text-accent" : "text-text-dim"} />
                                                </motion.div>
                                                {module.title}
                                            </h4>
                                        </button>

                                        <AnimatePresence initial={false}>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="flex flex-col gap-1 relative pl-6">
                                                        {/* Path line connected dots */}
                                                        <div className="absolute left-[13px] top-0 bottom-12 w-[2px] bg-white/10" />

                                                        {module.lessons.map((lesson) => {
                                                            const lessonStat = isMounted ? getLessonStat(lesson.id) : null;
                                                            const stat = {
                                                                progress: lessonStat?.completed ? 100 : 0,
                                                                stars: lessonStat?.stars || 0,
                                                                locked: false
                                                            };
                                                            const isSelected = activeLessonId === lesson.id;
                                                            return (
                                                                <div
                                                                    key={lesson.id}
                                                                    onClick={() => handleLessonSelect(module.id, lesson.id)}
                                                                    className={`relative group flex flex-col p-4 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors border border-transparent ${isSelected ? 'bg-white/5 border-white/10' : ''}`}
                                                                >
                                                                    {/* Dot */}
                                                                    <div className={`absolute -left-[19px] top-[1.6rem] w-3 h-3 rounded-full border-2 z-10 transition-colors ${stat.progress === 100 ? 'bg-accent border-accent' :
                                                                        stat.progress > 0 ? 'bg-background border-accent' :
                                                                            'bg-[#0F0F0F] border-white/20 group-hover:border-white/40'
                                                                        }`} />

                                                                    <div className="flex items-start justify-between">
                                                                        <div className="flex flex-col pr-4">
                                                                            <span className={`text-sm font-medium transition-colors ${isSelected ? 'text-accent' : 'text-foreground'} `}>
                                                                                {lesson.title}
                                                                            </span>

                                                                            {stat.progress > 0 && (
                                                                                <div className="w-full bg-[#0F0F0F] h-1.5 rounded-full mt-3 overflow-hidden">
                                                                                    <div
                                                                                        className="h-full bg-accent"
                                                                                        style={{ width: `${stat.progress}%` }}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        <div className="flex gap-0.5">
                                                                            {stat.progress > 0 && Array.from({ length: 3 }).map((_, i) => (
                                                                                <Star
                                                                                    key={i}
                                                                                    size={12}
                                                                                    className={i < stat.stars ? "fill-accent text-accent" : "text-white/10"}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right: Mock Lesson Viewer */}
                <div className="w-full bg-[#111111] rounded-[24px] border border-white/5 p-8 flex flex-col justify-between shadow-2xl order-2 overflow-hidden lg:h-[calc(100vh-280px)] lg:max-h-[600px] lg:min-h-[500px] glass glow-accent relative">

                    <div className="absolute top-0 right-0 p-6">
                        <span className="text-xs font-mono px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-text-dim tracking-wider">LESSON {currentLesson.id}</span>
                    </div>

                    <div className="mb-8 pt-2">
                        <h3 className="text-3xl font-display font-medium text-white mb-3">{currentLesson.title}</h3>
                        <p className="text-text-dim text-sm leading-relaxed max-w-lg">
                            {currentLesson.instruction}
                        </p>
                    </div>

                    {/* SVG Keyboard Mock */}
                    <div className="w-full aspect-[2.2/1] bg-[#0A0A0A] rounded-2xl border border-white/5 relative flex flex-col items-center justify-center gap-2 p-6 shadow-inner">
                        {/* Top Row */}
                        <div className="flex gap-2 opacity-20">
                            {"QWERTYUIOP".split("").map((key, i) => (
                                <div key={i} className="w-11 h-11 rounded-lg border border-white/10 flex items-center justify-center text-xs font-mono">{key}</div>
                            ))}
                        </div>
                        {/* Home Row (Highlighted) */}
                        <div className="flex gap-2 relative left-4">
                            {"ASDFGHJKL;".split("").map((key, i) => {
                                const isTarget = currentLesson.targetKeys.includes(key.toLowerCase());
                                return (
                                    <div key={i} className={`w-11 h-11 rounded-lg border flex items-center justify-center text-sm font-mono transition-all duration-300 ${isTarget ? "bg-accent/20 border-accent text-accent shadow-[0_0_15px_rgba(99,102,241,0.3)] scale-110 z-10" :
                                        "border-white/5 text-white/20 opacity-30"
                                        }`}>
                                        {key}
                                    </div>
                                )
                            })}
                        </div>
                        {/* Bottom Row */}
                        <div className="flex gap-2 opacity-20 relative left-8">
                            {"ZXCVBNM,.".split("").map((key, i) => (
                                <div key={i} className="w-11 h-11 rounded-lg border border-white/10 flex items-center justify-center text-xs font-mono">{key}</div>
                            ))}
                        </div>
                        {/* Space */}
                        <div className="w-[50%] h-11 rounded-lg border border-white/10 mt-2 opacity-20" />

                        <div className="absolute bottom-6 w-full flex justify-center gap-20 text-[10px] uppercase font-bold text-white/10 tracking-[0.2em]">
                            <span>Left Hand</span>
                            <span>Right Hand</span>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-center">
                        <Link href={`/learn/${currentModule.id}/${currentLesson.id}`} className="w-full">
                            <Button
                                variant="primary"
                                className="w-full py-6 text-base font-bold rounded-xl font-sans text-white hover:bg-accent hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all"
                            >
                                Start Training Now
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
