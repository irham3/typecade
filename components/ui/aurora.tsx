"use client";

import { cn } from "@/lib/utils";

interface AuroraProps {
    className?: string;
    children?: React.ReactNode;
}

export function Aurora({ className, children }: AuroraProps) {
    return (
        <div className={cn("aurora-container", className)}>
            {/* Layer 1: Dot grid */}
            <div className="bg-grid" aria-hidden="true" />

            {/* Layer 2: Aurora ambient blobs */}
            <div className="aurora-bg" aria-hidden="true">
                <div className="aurora-blob aurora-blob-1" />
                <div className="aurora-blob aurora-blob-2" />
                <div className="aurora-blob aurora-blob-3" />
            </div>

            {/* Layer 3: Center spotlight */}
            <div className="bg-vignette" aria-hidden="true" />

            {/* Layer 4: Edge darkening */}
            <div className="bg-vignette-edge" aria-hidden="true" />

            {children}
        </div>
    );
}
