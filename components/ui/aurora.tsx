"use client";

import { cn } from "@/lib/utils";

interface AuroraProps {
    className?: string;
    children?: React.ReactNode;
}

export function Aurora({ className, children }: AuroraProps) {
    return (
        <div className={cn("aurora-container", className)}>
            <div className="aurora-bg" aria-hidden="true">
                <div className="aurora-blob aurora-blob-1" />
                <div className="aurora-blob aurora-blob-2" />
                <div className="aurora-blob aurora-blob-3" />
            </div>
            {children}
        </div>
    );
}
