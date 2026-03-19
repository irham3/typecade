"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";

interface Spark {
    x: number;
    y: number;
    angle: number;
    velocity: number;
    life: number;
    maxLife: number;
}

export function ClickSpark({
    sparkSize = 18,
    sparkCount = 12,
}: {
    sparkSize?: number;
    sparkCount?: number;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sparks = useRef<Spark[]>([]);
    const reqId = useRef<number>(0);
    const theme = useStore(state => state.theme);
    const isLightTheme = theme === 'light';

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            canvas.style.width = window.innerWidth + "px";
            canvas.style.height = window.innerHeight + "px";
        };
        resize();
        window.addEventListener("resize", resize);

        const handleClick = (e: MouseEvent) => {
            // Spawn sparks at click pos
            const { clientX, clientY } = e;
            for (let i = 0; i < sparkCount; i++) {
                const angle = (Math.PI * 2 * i) / sparkCount + (Math.random() * 0.5 - 0.25);
                const velocity = 4 + Math.random() * 6;
                sparks.current.push({
                    x: clientX,
                    y: clientY,
                    angle,
                    velocity,
                    life: 1,
                    maxLife: 30 + Math.random() * 30
                });
            }
        };

        window.addEventListener("pointerdown", handleClick);

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Fetch colors once per frame or per spark if needed, but per frame is fine
            const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || "#6366f1";
            const secondary = getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim() || "#5eead4";

            for (let i = sparks.current.length - 1; i >= 0; i--) {
                const s = sparks.current[i];
                s.life--;

                if (s.life <= 0) {
                    sparks.current.splice(i, 1);
                    continue;
                }

                s.x += Math.cos(s.angle) * s.velocity;
                s.y += Math.sin(s.angle) * s.velocity;
                s.velocity *= 0.90; // less friction so they travel further

                // Ease out alpha
                const alpha = s.life / s.maxLife;
                const size = sparkSize * Math.max(0.5, s.velocity / 2);

                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(
                    s.x + Math.cos(s.angle) * size,
                    s.y + Math.sin(s.angle) * size
                );
                ctx.strokeStyle = accent;
                ctx.lineWidth = 3.5;
                ctx.lineCap = "round";
                ctx.globalAlpha = Math.max(0, alpha);
                ctx.stroke();

                // secondary glow
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(
                    s.x + Math.cos(s.angle) * size * 1.5,
                    s.y + Math.sin(s.angle) * size * 1.5
                );
                ctx.strokeStyle = secondary;
                ctx.lineWidth = 2;
                ctx.globalAlpha = Math.max(0, alpha * 0.7);
                ctx.stroke();
            }

            reqId.current = requestAnimationFrame(render);
        };

        reqId.current = requestAnimationFrame(render);

        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("pointerdown", handleClick);
            cancelAnimationFrame(reqId.current);
        };
    }, [sparkCount, sparkSize]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-50"
            style={{ mixBlendMode: isLightTheme ? 'multiply' : 'screen' }}
        />
    );
}
