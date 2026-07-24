"use client"
import { motion, useReducedMotion } from "framer-motion"
export function Screen({ children }: { children: React.ReactNode }) {
	const reduce = useReducedMotion()
	return <motion.div initial={reduce ? false : { opacity:0, y:8 }} animate={{opacity:1,y:0}} exit={reduce ? undefined : {opacity:0,y:-8}} transition={{duration:0.18,ease:[0.16,1,0.3,1]}}>{children}</motion.div>
}
