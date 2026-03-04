"use client";

import { useEffect, useRef } from "react";

// Minimal fluid simulation cursor effect
// Uses a simplified particle trail instead of WebGL for better compatibility

export function SplashCursor() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        life: number;
        maxLife: number;
        size: number;
        hue: number;
    }>>([]);
    const mouse = useRef({ x: 0, y: 0, px: 0, py: 0 });
    const frameRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        const handleMouseMove = (e: MouseEvent) => {
            mouse.current.px = mouse.current.x;
            mouse.current.py = mouse.current.y;
            mouse.current.x = e.clientX;
            mouse.current.y = e.clientY;

            const dx = mouse.current.x - mouse.current.px;
            const dy = mouse.current.y - mouse.current.py;
            const speed = Math.sqrt(dx * dx + dy * dy);

            if (speed > 2) {
                const count = Math.min(Math.floor(speed / 4), 5);
                for (let i = 0; i < count; i++) {
                    particles.current.push({
                        x: mouse.current.x + (Math.random() - 0.5) * 10,
                        y: mouse.current.y + (Math.random() - 0.5) * 10,
                        vx: dx * 0.1 + (Math.random() - 0.5) * 2,
                        vy: dy * 0.1 + (Math.random() - 0.5) * 2,
                        life: 1,
                        maxLife: 40 + Math.random() * 30,
                        size: 2 + Math.random() * 4,
                        hue: 240 + Math.random() * 40, // indigo-violet range
                    });
                }
            }
        };

        window.addEventListener("mousemove", handleMouseMove);

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = particles.current.length - 1; i >= 0; i--) {
                const p = particles.current[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.96;
                p.vy *= 0.96;
                p.life -= 1 / p.maxLife;

                if (p.life <= 0) {
                    particles.current.splice(i, 1);
                    continue;
                }

                const alpha = p.life * 0.4;
                const size = p.size * p.life;

                ctx.beginPath();
                ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${alpha})`;
                ctx.fill();

                // Glow
                ctx.beginPath();
                ctx.arc(p.x, p.y, size * 2.5, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${alpha * 0.15})`;
                ctx.fill();
            }

            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(frameRef.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-50 pointer-events-none"
            style={{ mixBlendMode: "screen" }}
        />
    );
}
