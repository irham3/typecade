"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const lettersLayout = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["Shift", "z", "x", "c", "v", "b", "n", "m", "Backspace"],
    ["?123", ",", "Space", ".", "-"]
];

const symbolsLayout = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["@", "#", "$", "%", "&", "*", "-", "+", "(", ")"],
    ["=\\<", "!", "\"", "'", ":", ";", "/", "?", "Backspace"],
    ["ABC", ",", "Space", ".", "_"]
];

const moreSymbolsLayout = [
    ["~", "`", "|", "•", "√", "π", "÷", "×", "{", "}"],
    ["\\", "^", "°", "=", "[", "]", "<", ">", "£", "€"],
    ["?123", "!", "\"", "'", ":", ";", "/", "?", "Backspace"],
    ["ABC", ",", "Space", ".", "_"]
];

interface VirtualKeyboardProps {
    onKeyPress: (key: string) => void;
    className?: string;
}

export function VirtualKeyboard({ onKeyPress, className = "" }: VirtualKeyboardProps) {
    const [isShift, setIsShift] = useState(false);
    const [mode, setMode] = useState<"letters" | "symbols" | "more">("letters");

    const layout = mode === "letters" ? lettersLayout : mode === "symbols" ? symbolsLayout : moreSymbolsLayout;

    // Provide immediate visual feedback for touch events
    const handleTouch = (key: string, e: React.PointerEvent) => {
        e.preventDefault(); // Prevent default touch behavior
        
        if (key === "Shift") {
            setIsShift(!isShift);
            return;
        }
        if (key === "?123") {
            setMode("symbols");
            return;
        }
        if (key === "ABC") {
            setMode("letters");
            setIsShift(false);
            return;
        }
        if (key === "=\\<") {
            setMode("more");
            return;
        }

        let outputKey = key;
        
        if (key === "Space") {
            outputKey = " ";
        } else if (key === "Backspace") {
            outputKey = "Backspace";
        } else {
            outputKey = isShift && mode === "letters" ? key.toUpperCase() : key;
            // Optionally auto-reset shift after a letter
            if (isShift && mode === "letters") setIsShift(false);
        }

        onKeyPress(outputKey);
    };

    return (
        <div className={`w-full max-w-2xl mx-auto flex flex-col gap-1 sm:gap-1.5 sm:hidden px-1 pb-2 h-auto select-none touch-none ${className}`}>
            {layout.map((row, rowIndex) => (
                <div key={rowIndex} className={`flex justify-center gap-1 sm:gap-1.5 w-full`}>
                    {rowIndex === 1 && mode === "letters" && <div className="flex-[0.5]" />}
                    {row.map((key) => {
                        const isSpecial = ["Shift", "Backspace", "?123", "ABC", "=\\<"].includes(key);
                        const isSpace = key === "Space";
                        
                        return (
                            <motion.button
                                key={key}
                                whileTap={{ scale: 0.9, y: 2 }}
                                onPointerDown={(e) => handleTouch(key, e)}
                                className={`
                                    flex items-center justify-center rounded-md font-sans text-lg sm:text-base transition-colors duration-75 
                                    active:bg-accent active:text-background shadow-sm border-b-[1.5px]
                                    ${isSpace ? "w-1/2 h-11 sm:h-12 bg-foreground/5 border-foreground/10 text-foreground min-w-0!" : 
                                      isSpecial ? "flex-[1.5] min-w-0! shrink-0 h-11 sm:h-12 bg-foreground/10 border-foreground/20 text-foreground/80 font-medium text-xs sm:text-sm" : 
                                      "flex-1 min-w-0! h-11 sm:h-12 bg-panel-bg border border-foreground/5 border-b-foreground/10 text-foreground font-medium"
                                    }
                                    ${isShift && key === "Shift" ? "bg-accent/20 text-accent border-accent/30" : ""}
                                `}
                            >
                                {key === "Space" ? "" : 
                                 key === "Backspace" ? "⌫" : 
                                 key === "Shift" ? "⇧" : 
                                 (isShift && mode === "letters" ? key.toUpperCase() : key)}
                            </motion.button>
                        );
                    })}
                    {rowIndex === 1 && mode === "letters" && <div className="flex-[0.5]" />}
                </div>
            ))}
        </div>
    );
}
