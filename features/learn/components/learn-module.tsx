import { useState } from "react";
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
        <div className="w-full max-w-5xl flex flex-col items-center pt-8">

            <div className="text-center mb-12">
                <h1 className="text-4xl font-display font-bold text-foreground mb-4">Master Your Keystrokes</h1>
                <p className="text-text-dim text-lg font-sans max-w-xl mx-auto">
                    Start from zero and progressively build your muscle memory. No looking down allowed.
                </p>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-[350px_1fr] gap-12 items-start">

                {/* Left: Path/Curriculum Tree */}
                <div className="w-full flex justify-center md:block order-1">
                    <div className="flex flex-col gap-8 w-full">
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
                                        <span className="text-[10px] font-mono text-white/10 group-hover:text-white/30 transition-colors uppercase">
                                            {module.lessons.length} {module.lessons.length === 1 ? 'Lesson' : 'Lessons'}
                                        </span>
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
                                                <div className="flex flex-col gap-1 relative pl-6 pb-4">
                                                    {/* Path line connected dots */}
                                                    <div className="absolute left-[13px] top-0 bottom-6 w-[2px] bg-white/10" />

                                                    {module.lessons.map((lesson) => {
                                                        const lessonStat = getLessonStat(lesson.id);
                                                        const stat = {
                                                            progress: lessonStat.completed ? 100 : 0,
                                                            stars: lessonStat.stars,
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

                {/* Right: Mock Lesson Viewer */}
                <div className="w-full bg-[#1A1A1A] rounded-[24px] border border-white/5 p-10 flex flex-col justify-between shadow-2xl order-2 overflow-hidden min-h-[500px] sticky top-8">

                    <div className="absolute top-0 right-0 p-6">
                        <span className="text-xs font-mono px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-text-dim tracking-wider">LESSON {currentLesson.id}</span>
                    </div>

                    <div className="mb-14 pt-4">
                        <h3 className="text-3xl font-display font-medium text-white mb-4">{currentLesson.title}</h3>
                        <p className="text-text-dim text-base leading-relaxed max-w-lg">
                            {currentLesson.instruction}
                        </p>
                    </div>

                    {/* SVG Keyboard Mock */}
                    <div className="w-full aspect-2/1 bg-[#0F0F0F] rounded-2xl border border-white/5 relative flex flex-col items-center justify-center gap-3 p-8 shadow-inner">
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

                    <div className="mt-12 flex justify-center">
                        <Link href={`/learn/${currentModule.id}/${currentLesson.id}`} className="w-full max-w-sm">
                            <Button
                                variant="primary"
                                className="w-full py-8 text-lg font-bold rounded-2xl font-sans text-white bg-accent hover:bg-accent/80 transition-all shadow-[0_20px_40px_rgba(99,102,241,0.2)] hover:shadow-[0_20px_40px_rgba(99,102,241,0.4)]"
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
