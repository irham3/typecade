"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SegmentedControlProps<T extends string> {
    options: T[];
    value: T;
    onChange: (value: T) => void;
    className?: string;
    size?: "sm" | "md";
    variant?: "default" | "gradient";
    formatOption?: (val: T) => React.ReactNode;
}

export function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
    className = "",
    size = "md",
    variant = "default",
    formatOption,
}: SegmentedControlProps<T>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const activeIndex = options.indexOf(value);
        const buttons = container.querySelectorAll<HTMLButtonElement>("[data-segment-btn]");
        const activeBtn = buttons[activeIndex];

        if (activeBtn) {
            setIndicatorStyle({
                left: activeBtn.offsetLeft,
                width: activeBtn.offsetWidth,
            });
        }
    }, [value, options]);

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative inline-flex items-center rounded-2xl p-1 bg-foreground/3 border border-foreground/6",
                className
            )}
        >
            {/* Animated pill indicator */}
            <motion.div
                className={cn(
                    "absolute top-1 bottom-1 rounded-xl z-0",
                    variant === "gradient"
                        ? "bg-linear-to-r from-accent/15 to-accent/8 shadow-[0_0_10px_rgba(99,102,241,0.15)]"
                        : "bg-foreground/10"
                )}
                animate={{
                    left: indicatorStyle.left,
                    width: indicatorStyle.width,
                }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                }}
            />

            {options.map((option) => {
                const isActive = value === option;
                return (
                    <button
                        key={option}
                        data-segment-btn
                        onClick={() => onChange(option)}
                        className={cn(
                            "relative z-10 font-medium transition-colors duration-200 cursor-pointer select-none whitespace-nowrap",
                            size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
                            isActive
                                ? variant === "gradient"
                                    ? "text-accent"
                                    : "text-foreground"
                                : "text-text-dim hover:text-foreground/70"
                        )}
                    >
                        {formatOption ? formatOption(option) : option}
                    </button>
                );
            })}
        </div>
    );
}
