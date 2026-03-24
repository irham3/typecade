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
                "relative z-10 font-mono transition-all duration-100 cursor-pointer select-none whitespace-nowrap inline-flex items-center justify-center rounded-lg bg-transparent border-t border-l border-r border-b-4 active:border-b active:translate-y-[3px]",
                size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
                isActive
                    ? "text-accent border-accent/80 font-bold drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]"
                    : "text-text-dim border-border-dim hover:text-foreground hover:border-text-dim/60",
                className
            )}
        >
            {children}
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
