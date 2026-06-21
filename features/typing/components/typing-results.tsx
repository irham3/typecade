import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CountUp } from '@/components/ui/count-up';
import { RotateCcw, ArrowRight, Download, Twitter, Send, Linkedin, Copy, Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import * as htmlToImage from 'html-to-image';
import { useStore } from '@/lib/store';

interface TypingResultsProps {
    wpm: number;
    accuracy: number;
    mode: string;
    limit: number;
    typedCharsLength: number;
    resultKey: number;
    onRetry: () => void;
    onNext: () => void;
}

// Encode the current result into the short /r/<slug> format. The matching
// decoder lives in app/r/[slug]/page.tsx — keep the two in sync if you
// change either side.
function buildResultSlug(wpm: number, accuracy: number, modeLabel: string): string {
    const modes = ["Time 15s", "Time 30s", "Time 60s", "Time 120s", "Words 10", "Words 25", "Words 50", "Words 100", "Quote"];
    const idx = modes.indexOf(modeLabel);
    return `w${Math.round(wpm)}a${Math.round(accuracy)}m${idx >= 0 ? idx : 2}`;
}

export function TypingResults({ wpm, accuracy, mode, limit, typedCharsLength, resultKey, onRetry, onNext }: TypingResultsProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [canNativeShare, setCanNativeShare] = useState(false);

    useEffect(() => {
        // Detect Web Share API support (mostly mobile Safari/Android Chrome).
        setCanNativeShare(typeof navigator !== 'undefined' && 'share' in navigator);
    }, []);

    // We assume store.stats.wpm holds the all-time personal best WPM
    const personalBestWpm = useStore(state => state.stats.wpm);
    const theme = useStore(state => state.theme);
    const isPersonalBest = wpm > personalBestWpm;


    useEffect(() => {
        if (isPersonalBest) {
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                const colors = theme === 'forest' ? ['#22c55e', '#84cc16', '#ffffff'] :
                    theme === 'sunset' ? ['#f97316', '#e11d48', '#ffffff'] :
                        theme === 'retro' ? ['#ff007f', '#00ffcc', '#ffffff'] :
                            theme === 'nord' ? ['#88c0d0', '#81a1c1', '#ffffff'] :
                                theme === 'serika' ? ['#e2b714', '#ffffff', '#323437'] :
                                    theme === 'dracula' ? ['#bd93f9', '#ff79c6', '#ffffff'] :
                                        ['#6366f1', '#5eead4', '#ffffff'];

                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();
        }
    }, [isPersonalBest, resultKey, theme]);

    const captureScreenshot = async () => {
        if (!cardRef.current) return null;
        setIsCapturing(true);
        try {
            // A bit of delay to let React re-render without buttons if they're hidden during capture
            await new Promise(r => setTimeout(r, 100));
            const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--background').trim() || '#0c0d14';
            const dataUrl = await htmlToImage.toPng(cardRef.current, {
                quality: 1.0,
                pixelRatio: 2,
                backgroundColor: bgColor,
                style: { transform: 'scale(1)', padding: '24px' } // adds padding inside image
            });
            return dataUrl;
        } catch (err) {
            console.error('Error capturing image:', err);
            return null;
        } finally {
            setIsCapturing(false);
        }
    };

    const handleDownloadShare = async () => {
        const url = await captureScreenshot();
        if (url) {
            const link = document.createElement('a');
            link.download = `typecade-result-${wpm}wpm.png`;
            link.href = url;
            link.click();
        }
    };

    const handleTwitterShare = () => {
            const slug = buildResultSlug(wpm, accuracy, mode);
            const url = `https://typecade.com/r/${slug}`;
            const text = `I just typed ${wpm} WPM with ${accuracy}% accuracy on @typecade (${mode})!\n\nCan you beat my score? ${url}`;
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
        };

        const handleWhatsAppShare = () => {
            const slug = buildResultSlug(wpm, accuracy, mode);
            const url = `https://typecade.com/r/${slug}`;
            const text = `I just typed ${wpm} WPM with ${accuracy}% accuracy on Typecade (${mode})!\nCan you beat my score? ${url}`;
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
        };

        const handleLinkedInShare = () => {
            const slug = buildResultSlug(wpm, accuracy, mode);
            const url = `https://typecade.com/r/${slug}`;
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        };

        const handleCopyLink = async () => {
            const slug = buildResultSlug(wpm, accuracy, mode);
            const url = `https://typecade.com/r/${slug}`;
            try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch {
                // Fallback: select-and-prompt
                window.prompt("Copy your result link:", url);
            }
        };

        const handleNativeShare = async () => {
            const slug = buildResultSlug(wpm, accuracy, mode);
            const url = `https://typecade.com/r/${slug}`;
            if (typeof navigator !== 'undefined' && 'share' in navigator) {
                try {
                    await navigator.share({
                        title: `${wpm} WPM on Typecade`,
                        text: `I just typed ${wpm} WPM with ${accuracy}% accuracy. Can you beat my score?`,
                        url,
                    });
                } catch {
                    // user cancelled or share not available — ignore
                }
            } else {
                handleCopyLink();
            }
        };

    return (
        <motion.div
            key={`typing-finished-${resultKey}`}
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex flex-col mt-8 items-center"
        >
            {/* The wrapper that will be captured as an OG Image — Uses css variables for colors */}
            <div ref={cardRef} className="w-full max-w-2xl bg-background flex flex-col items-center border border-foreground/5 rounded-3xl p-6 sm:p-10 relative overflow-hidden glass-strong">

                {/* Visual Flair Background Removed For Professional Look */}

                {/* Badge for Personal Best */}
                <AnimatePresence>
                    {isPersonalBest && !isCapturing && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="absolute top-6 right-6 bg-accent text-background text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-[0_0_15px_rgba(94,234,212,0.5)]"
                        >
                            New Personal Best!
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header / Brand (Visible nicely in capture) */}
                {isCapturing && (
                    <div className="w-full flex justify-between items-center mb-6 opacity-80">
                        <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/typecade-logo.png" alt="Typecade" className="w-6 h-6 object-contain" />
                            <span className="font-bold text-lg tracking-tight">Typecade</span>
                        </div>
                        <div className="text-xs font-mono text-text-dim/80 bg-foreground/5 px-2 py-1 rounded">
                            {mode.toUpperCase()} MODE
                        </div>
                    </div>
                )}

                {/* Primary stat with CountUp */}
                <div className="flex flex-col items-center text-center mb-6 sm:mb-8 relative z-10">
                    <div className="text-[5rem] sm:text-[7rem] md:text-[9rem] font-mono font-bold text-foreground leading-none tracking-tighter text-glow-accent relative">
                        <div style={{ display: isCapturing ? 'none' : 'block' }}>
                            <CountUp end={wpm} duration={1500} className="tabular-nums" />
                        </div>
                        {isCapturing && <span>{wpm}</span>}
                    </div>
                    <span className="text-sm font-mono text-accent uppercase tracking-[0.25em] font-semibold mt-1">
                        words per minute
                    </span>
                </div>



                {/* Secondary stats grid */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full relative z-10">
                    <motion.div
                        className="glass rounded-xl sm:rounded-2xl flex flex-col items-center py-4 px-2"
                    >
                        <span className="text-[10px] text-text-dim uppercase tracking-widest font-mono mb-1">Accuracy</span>
                        <span className="text-xl sm:text-2xl font-mono font-bold text-foreground">
                            <span style={{ display: isCapturing ? 'none' : 'inline' }}>
                                <CountUp end={accuracy} duration={1200} delay={200} />%
                            </span>
                            {isCapturing && <span>{accuracy}%</span>}
                        </span>
                    </motion.div>
                    <motion.div
                        className="glass rounded-xl sm:rounded-2xl flex flex-col items-center py-4 px-2"
                    >
                        <span className="text-[10px] text-text-dim uppercase tracking-widest font-mono mb-1">Time</span>
                        <span className="text-xl sm:text-2xl font-mono font-bold text-foreground">
                            {mode === "time" ? `${limit}s` : `${Math.ceil(typedCharsLength / 5)}s`}
                        </span>
                    </motion.div>
                    <motion.div
                        className="glass rounded-xl sm:rounded-2xl flex flex-col items-center py-4 px-2"
                    >
                        <span className="text-[10px] text-text-dim uppercase tracking-widest font-mono mb-1">Characters</span>
                        <span className="text-xl sm:text-2xl font-mono font-bold text-foreground">
                            <span style={{ display: isCapturing ? 'none' : 'inline' }}>
                                <CountUp end={typedCharsLength} duration={1000} delay={300} />
                            </span>
                            {isCapturing && <span>{typedCharsLength}</span>}
                        </span>
                    </motion.div>
                </div>

                {/* Watermark only visible in capture */}
                {isCapturing && (
                    <div className="w-full text-center mt-6 text-[10px] text-text-dim/50 font-mono tracking-widest uppercase">
                        play at typecade.com
                    </div>
                )}
            </div>

            {/* Action buttons (Not captured in image) */}
            <div className={`flex flex-col gap-4 sm:gap-6 justify-center mt-6 sm:mt-8 w-full transition-opacity duration-300 ${isCapturing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                {/* Primary Actions */}
                <div className="flex gap-3 justify-center w-full">
                    <Button variant="outline" onClick={(e) => { e.stopPropagation(); onRetry(); }} className="gap-2 px-6 sm:px-8" size="lg">
                        <RotateCcw size={16} /> Retry
                    </Button>
                    <Button variant="primary" onClick={(e) => { e.stopPropagation(); onNext(); }} className="gap-2 px-6 sm:px-8 font-bold" size="lg">
                        Next Test <ArrowRight size={16} />
                    </Button>
                </div>

                {/* Share Actions - Compact row */}
                                <div className="flex flex-wrap gap-2 justify-center w-full border-t border-foreground/5 pt-4 sm:pt-6">
                                    <Button variant="ghost" onClick={handleDownloadShare} className="gap-2 text-text-dim hover:text-foreground text-xs py-1 h-8" title="Download Screenshot">
                                        <Download size={14} /> Save Image
                                    </Button>
                                    <Button variant="ghost" onClick={handleTwitterShare} className="gap-2 text-text-dim hover:text-[#1DA1F2] text-xs py-1 h-8" title="Share your result on X">
                                        <Twitter size={14} /> Tweet
                                    </Button>
                                    <Button variant="ghost" onClick={handleLinkedInShare} className="gap-2 text-text-dim hover:text-[#0A66C2] text-xs py-1 h-8" title="Share on LinkedIn">
                                        <Linkedin size={14} /> LinkedIn
                                    </Button>
                                    <Button variant="ghost" onClick={handleWhatsAppShare} className="gap-2 text-text-dim hover:text-[#25D366] text-xs py-1 h-8" title="Send to WhatsApp">
                                        <Send size={14} /> WhatsApp
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={handleCopyLink}
                                        className="gap-2 text-text-dim hover:text-foreground text-xs py-1 h-8"
                                        title="Copy a shareable link to this result"
                                    >
                                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                        {copied ? "Copied!" : "Copy link"}
                                    </Button>
                                    {canNativeShare && (
                                        <Button variant="ghost" onClick={handleNativeShare} className="gap-2 text-text-dim hover:text-foreground text-xs py-1 h-8" title="Share via your device">
                                            <Share2 size={14} /> Share
                                        </Button>
                                    )}
                                </div>
            </div>
        </motion.div>
    );
}
