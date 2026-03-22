"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { User } from "@/components/icons";
import { createPortal } from "react-dom";

interface UserAvatarProps {
    src?: string | null;
    alt?: string;
    iconSize?: number;
    iconClassName?: string;
    showTooltipPreview?: boolean;
}

export function UserAvatar({ 
    src, 
    alt = "Avatar", 
    iconSize = 14, 
    iconClassName = "text-text-dim",
    showTooltipPreview = false
}: UserAvatarProps) {
    const [hasError, setHasError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const avatarRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (avatarRef.current) {
            const rect = avatarRef.current.getBoundingClientRect();
            setTooltipPos({
                x: rect.right + 16,
                y: rect.top + rect.height / 2,
            });
        }
        setIsHovered(true);
    };

    if (src && !hasError) {
        return (
            <>
                <div 
                    ref={avatarRef}
                    className="relative w-full h-full"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        sizes="96px"
                        unoptimized
                        className="object-cover"
                        referrerPolicy="no-referrer"
                        onError={() => setHasError(true)}
                    />
                </div>
                {typeof document !== 'undefined' && showTooltipPreview && isHovered && createPortal(
                    <div 
                        className="fixed pointer-events-none transform -translate-y-1/2 rounded-2xl overflow-hidden glass shadow-2xl border border-foreground/10 bg-panel-bg flex items-center justify-center p-1.5 animate-in fade-in zoom-in-95 duration-200"
                        style={{ 
                            left: tooltipPos.x, 
                            top: tooltipPos.y,
                            width: 200,
                            height: 200,
                            zIndex: 9999
                        }}
                    >
                        <div className="relative w-full h-full rounded-xl overflow-hidden">
                            <Image
                                src={src}
                                alt={`${alt} Preview`}
                                fill
                                sizes="256px"
                                unoptimized
                                className="object-cover"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    </div>,
                    document.body
                )}
            </>
        );
    }

    return (
        <div className="w-full h-full flex items-center justify-center bg-foreground/5 text-text-dim">
            <User size={iconSize} className={iconClassName} />
        </div>
    );
}
