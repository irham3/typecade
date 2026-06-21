"use client";

import { motion } from "framer-motion";

/**
 * Single-line tagline that sits BELOW the typing area on the homepage.
 *
 * Why so small: the typing area IS the hero. Marketing copy above it
 * pushes the product off-screen on shorter viewports; paragraphs
 * below it pull attention away from the live stats. One short line,
 * centered, muted — sets tone without competing for the eye.
 */
export function HomepageTagline() {
    return (
        <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-sm sm:text-base text-text-dim/80 tracking-wide -mt-4 sm:-mt-6"
        >
            Sharp keys. Clear mind.
        </motion.p>
    );
}