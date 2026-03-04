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
                    "bg-white/6 text-foreground hover:bg-white/10 border border-white/6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]",
                primary:
                    "bg-accent text-white hover:bg-accent/90 shadow-[0_0_20px_rgba(99,102,241,0.25),inset_0_1px_1px_rgba(255,255,255,0.1)] hover:shadow-[0_0_28px_rgba(99,102,241,0.35)]",
                secondary:
                    "bg-white/4 text-text-dim hover:text-foreground hover:bg-white/8 border border-transparent",
                outline:
                    "border border-white/8 bg-transparent hover:bg-white/4 hover:border-white/15 text-text-dim hover:text-foreground",
                ghost: "hover:bg-white/5 hover:text-foreground text-text-dim",
                active: "bg-white/8 text-foreground shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]",
                activeGradient: "text-accent bg-accent/10 shadow-[0_0_10px_rgba(99,102,241,0.1)] border border-accent/20",
                danger: "bg-error-bg/60 text-error-text hover:bg-error-bg/80",
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
