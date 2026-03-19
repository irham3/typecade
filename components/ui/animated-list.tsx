"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedListProps {
    children: React.ReactNode[];
    className?: string;
    staggerDelay?: number;
    initialDelay?: number;
}

const itemVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.97 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            delay: i * 0.04,
            duration: 0.35,
            ease: "easeOut" as const,
        },
    }),
};

export function AnimatedList({
    children,
    className = "",
    initialDelay = 0.1,
}: AnimatedListProps) {
    return (
        <motion.div
            className={cn("w-full", className)}
            initial="hidden"
            animate="visible"
            transition={{ delayChildren: initialDelay }}
        >
            {children.map((child, i) => (
                <motion.div
                    key={i}
                    custom={i}
                    variants={itemVariants}
                >
                    {child}
                </motion.div>
            ))}
        </motion.div>
    );
}
