import { useState } from "react";
import { Lock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LearnModule() {
    const [activeLesson] = useState(1);

    const modules = [
        {
            id: 1,
            title: "MODULE 1: Home Row Keys",
            lessons: [
                { id: 1.1, name: "Introduction to ASDF JKL;", progress: 100, stars: 3, locked: false },
                { id: 1.2, name: "Drill: A & F Focus", progress: 70, stars: 1, locked: false },
                { id: 1.3, name: "Combination ASDF", progress: 0, stars: 0, locked: false },
                { id: 1.4, name: "Review & Test", progress: 0, stars: 0, locked: true },
            ]
        },
        {
            id: 2,
            title: "MODULE 2: Top Row Keys",
            locked: true,
            lessons: []
        },
        {
            id: 3,
            title: "MODULE 3: Bottom Row Keys",
            locked: true,
            lessons: []
        }
    ];

    return (
        <div className="w-full max-w-5xl flex flex-col items-center pt-8">

            <div className="text-center mb-12">
                <h1 className="text-4xl font-display font-bold text-foreground mb-4">Master Your Keystrokes</h1>
                <p className="text-text-dim text-lg font-sans max-w-xl mx-auto">
                    Start from zero and progressively build your muscle memory. No looking down allowed.
                </p>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-[1fr_400px] gap-12">

                {/* Left: Keyboard Viz Simulation / Mock Lesson Viewer */}
                <div className="w-full bg-[#1A1A1A] rounded-[24px] border border-white/5 p-8 flex flex-col justify-between shadow-xl order-2 md:order-1 relative overflow-hidden">

                    <div className="absolute top-0 right-0 p-4">
                        <span className="text-xs font-mono px-3 py-1 bg-white/5 border border-white/10 rounded-full text-text-dim">LESSON {activeLesson}.2</span>
                    </div>

                    <div className="mb-12 pt-8">
                        <h3 className="text-xl font-display text-accent mb-2">Rest on Home Row</h3>
                        <p className="text-text-dim text-sm leading-relaxed max-w-sm">
                            Place your left hand fingers on A S D F, and right hand fingers on J K L ;. Let your thumbs rest naturally on the spacebar.
                        </p>
                    </div>

                    {/* SVG Keyboard Mock */}
                    <div className="w-full aspect-2.5/1 bg-[#0F0F0F] rounded-xl border border-white/5 relative flex flex-col items-center justify-center gap-2 p-4">
                        {/* Top Row */}
                        <div className="flex gap-1.5 opacity-30">
                            {"QWERTYUIOP".split("").map((key, i) => (
                                <div key={i} className="w-10 h-10 rounded border border-white/10 flex items-center justify-center text-xs font-mono">{key}</div>
                            ))}
                        </div>
                        {/* Home Row (Highlighted) */}
                        <div className="flex gap-1.5 relative left-3">
                            {"ASDFGHJKL;".split("").map((key, i) => {
                                const isActive = key === "F" || key === "J";
                                const isTarget = key === "A" || key === "S" || key === "D" || key === "F";
                                return (
                                    <div key={i} className={`w-10 h-10 rounded flex items-center justify-center text-xs font-mono transition-colors ${isActive ? "bg-accent/20 border-accent text-accent shadow-[0_0_10px_rgba(245,166,35,0.2)]" :
                                        isTarget ? "bg-white/10 border-white/20 text-white shadow-xl" :
                                            "border border-white/10 text-white/50 opacity-40"
                                        }`}>
                                        {key}
                                    </div>
                                )
                            })}
                        </div>
                        {/* Bottom Row */}
                        <div className="flex gap-1.5 opacity-30 relative left-6">
                            {"ZXCVBNM,.".split("").map((key, i) => (
                                <div key={i} className="w-10 h-10 rounded border border-white/10 flex items-center justify-center text-xs font-mono">{key}</div>
                            ))}
                        </div>
                        {/* Space */}
                        <div className="w-[40%] h-10 rounded border border-white/10 mt-1 opacity-40" />

                        <div className="absolute -bottom-8 w-full flex justify-center gap-16 text-[10px] uppercase font-bold text-accent/50 tracking-widest">
                            <span>Left Hand</span>
                            <span>Right Hand</span>
                        </div>
                    </div>

                    <Button variant="primary" className="w-full max-w-xs mx-auto mt-16 py-6 font-bold rounded-full font-sans text-sm text-black bg-white hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                        Begin Practice Session
                    </Button>
                </div>

                {/* Right: Path/Curriculum Tree */}
                <div className="w-full flex justify-center md:block order-1 md:order-2">
                    <div className="flex flex-col gap-8 max-w-[300px]">
                        {modules.map(module => (
                            <div key={module.id} className={`flex flex-col ${module.locked ? 'opacity-40' : ''}`}>
                                <h4 className="text-xs font-bold font-sans text-text-dim uppercase tracking-widest mb-4 flex items-center gap-2">
                                    {module.locked && <Lock size={12} />}
                                    {module.title}
                                </h4>

                                {module.locked ? (
                                    <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center ml-4 mt-2 object-cover">
                                        <div className="w-3 h-3 rotate-45 border-2 border-white/20" />
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1 relative pl-6">
                                        {/* Path line connected dots */}
                                        <div className="absolute left-[13px] top-6 bottom-6 w-[2px] bg-white/10" />

                                        {module.lessons.map((lesson) => (
                                            <div
                                                key={lesson.id}
                                                className={`relative group flex flex-col p-4 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors border border-transparent ${activeLesson === module.id && !lesson.locked ? 'bg-white/5 border-white/10' : ''}`}
                                            >
                                                {/* Dot */}
                                                <div className={`absolute -left-[19px] top-[1.6rem] w-3 h-3 rounded-full border-2 z-10 transition-colors ${lesson.progress === 100 ? 'bg-accent border-accent' :
                                                    lesson.progress > 0 ? 'bg-background border-accent' :
                                                        'bg-[#0F0F0F] border-white/20 group-hover:border-white/40'
                                                    }`} />

                                                <div className="flex items-start justify-between">
                                                    <div className="flex flex-col pr-4">
                                                        <span className={`text-sm font-medium transition-colors ${lesson.locked ? 'text-text-dim' : 'text-foreground'}`}>
                                                            {lesson.name}
                                                        </span>

                                                        {!lesson.locked && (
                                                            <div className="w-full bg-[#0F0F0F] h-1.5 rounded-full mt-3 overflow-hidden">
                                                                <div
                                                                    className="h-full bg-accent"
                                                                    style={{ width: `${lesson.progress}%` }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-0.5">
                                                        {!lesson.locked && Array.from({ length: 3 }).map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                size={12}
                                                                className={i < lesson.stars ? "fill-accent text-accent" : "text-white/10"}
                                                            />
                                                        ))}
                                                        {lesson.locked && <Lock size={14} className="text-white/20 mt-1" />}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
