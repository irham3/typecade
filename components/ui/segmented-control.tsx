"use client";

import React from "react";
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

export function PixelButton({
    isActive,
    onClick,
    children,
    size = "md",
    className = "",
}: {
    isActive: boolean;
    onClick?: () => void;
    children: React.ReactNode;
    size?: "sm" | "md";
    className?: string;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "relative z-10 font-mono transition-all duration-100 cursor-pointer select-none whitespace-nowrap inline-flex items-center justify-center rounded-lg bg-background/40 border active:translate-y-[2px]",
                size === "sm" ? "px-3 py-1.5 text-xs h-8" : "px-5 py-2 text-sm h-10",
                isActive
                    ? "text-accent border-accent/60 font-bold shadow-[0_4px_0_0_rgba(var(--accent-rgb),0.3)]"
                    : "text-text-dim border-white/10 hover:text-foreground hover:border-white/20 shadow-[0_4px_0_0_rgba(255,255,255,0.05)]",
                className
            )}
        >
            <div className={cn(
                "absolute inset-0 rounded-lg pointer-events-none border-b-[3px] translate-y-[2px] opacity-20",
                isActive ? "border-accent" : "border-white"
            )} />
            <span className="relative z-10">{children}</span>
        </button>
    );
}

export function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
    className = "",
    size = "md",
    formatOption,
}: SegmentedControlProps<T>) {

    return (
        <div
            className={cn(
                "flex items-center gap-1.5",
                className
            )}
        >
            {options.map((option) => {
                const isActive = value === option;
                return (
                    <PixelButton
                        key={option}
                        isActive={isActive}
                        onClick={() => onChange(option)}
                        size={size}
                    >
                        {formatOption ? formatOption(option) : option}
                    </PixelButton>
                );
            })}
        </div>
    );
}
