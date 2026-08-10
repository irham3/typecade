"use client"

import { motion, useReducedMotion } from "framer-motion"

export function Screen({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      data-overdrive-screen
      className="relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.15, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
