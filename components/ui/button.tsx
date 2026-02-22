import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
    {
        variants: {
            variant: {
                default:
                    "bg-white/10 text-foreground hover:bg-white/20 border border-transparent shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]",
                primary:
                    "bg-accent text-white hover:bg-accent/90 shadow-[0_0_15px_rgba(99,102,241,0.4)]",
                secondary:
                    "bg-white/5 text-text-dim hover:text-white hover:bg-white/10 border border-transparent",
                outline:
                    "border border-white/10 bg-transparent hover:bg-white/5 hover:border-white/20 text-text-dim hover:text-white",
                ghost: "hover:bg-white/5 hover:text-white text-text-dim",
                active: "bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]",
                activeGradient: "text-accent bg-accent/10 shadow-[0_0_10px_rgba(99,102,241,0.2)]",
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
