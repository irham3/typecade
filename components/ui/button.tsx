import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
    {
        variants: {
            variant: {
                default:
                    "bg-foreground/6 text-foreground hover:bg-foreground/10 border border-foreground/6",
                primary:
                    "bg-accent text-[#060b13] font-bold hover:bg-accent/90 shadow-[0_4px_12px_rgba(var(--accent-rgb),0.3)]",
                secondary:
                    "bg-foreground/4 text-text-dim hover:text-foreground hover:bg-foreground/8 border border-transparent",
                outline:
                    "border border-foreground/8 bg-transparent hover:bg-foreground/4 hover:border-foreground/15 text-text-dim hover:text-foreground",
                ghost: "hover:bg-foreground/5 hover:text-foreground text-text-dim",
                active: "bg-foreground/8 text-foreground",
                activeGradient: "text-[#060b13] bg-accent font-bold shadow-[0_2px_8px_rgba(var(--accent-rgb),0.2)] border border-accent/20",
                danger: "bg-error-bg/60 text-error-text hover:bg-error-bg/80",
                arcade:
                    "relative bg-accent text-[#060b13] font-mono font-bold uppercase tracking-widest border-t border-l border-r border-white/20 shadow-[0_4px_0_0_rgba(var(--accent-rgb),0.6)] hover:shadow-[0_6px_0_0_rgba(var(--accent-rgb),0.7)] hover:bg-accent/90 active:translate-y-[2px] active:shadow-none transition-all duration-150 rounded-xl",
                arcadeSecondary:
                    "relative bg-accent-secondary text-white font-mono font-bold uppercase tracking-widest border-t border-l border-r border-white/20 shadow-[0_4px_0_0_rgba(var(--accent-secondary-rgb),0.6)] hover:shadow-[0_6px_0_0_rgba(var(--accent-secondary-rgb),0.7)] hover:bg-accent-secondary/90 active:translate-y-[2px] active:shadow-none transition-all duration-150 rounded-xl",
                arcadeOutline:
                    "relative bg-transparent text-foreground/80 font-mono font-bold uppercase tracking-widest border border-foreground/10 shadow-[0_4px_0_0_rgba(255,255,255,0.05)] hover:bg-foreground/5 hover:text-foreground active:translate-y-[2px] active:shadow-none transition-all duration-150 rounded-xl",
            },
            size: {
                default: "h-9 px-4 py-2",
                sm: "h-8 rounded-lg px-3 text-xs",
                lg: "h-11 rounded-xl px-8",
                icon: "h-9 w-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
