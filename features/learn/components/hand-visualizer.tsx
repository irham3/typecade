import { Finger, KEY_FINGER_MAP } from "../data/lessons";
import { motion, AnimatePresence } from "framer-motion";

type HandProp = {
    activeFingers: Finger[];
    activeKey?: string | null;
};

export function HandVisualizer({ activeFingers, activeKey }: HandProp) {

    const FINGER_NAMES: Record<string, string> = {
        "L_PINKY": "A", "L_RING": "S", "L_MIDDLE": "D", "L_INDEX": "F", "L_THUMB": "SPACE",
        "R_PINKY": ";", "R_RING": "L", "R_MIDDLE": "K", "R_INDEX": "J", "R_THUMB": "SPACE"
    };

    // Hand shifting based on row logic removed per user request
    const isLeftActive = activeFingers.some(f => f.startsWith('L_'));
    const isRightActive = activeFingers.some(f => f.startsWith('R_'));

    // Hands no longer shift forward/back physically (User requested static position)
    const leftHandY = 0;
    const rightHandY = 0;

    // No longer panning horizontally
    const leftHandX = 0;
    const rightHandX = 0;

    const renderFinger = (fingerId: Finger, baseHeight: number, width: string, bottom: string, left?: string, right?: string, rotate: string = "0deg", labelRotate: string = "0deg") => {
        const isActive = activeFingers.includes(fingerId);
        const isThumb = fingerId.includes("THUMB");
        const defaultKey = FINGER_NAMES[fingerId as string];

        // Active finger stretches/curls and presses disabled
        const fingerY = 0;
        let fingerScale = 1;
        const fingerH = baseHeight;

        if (isActive && !isThumb) {
            fingerScale = 1.05; // slight pop when pressing
        } else if (isActive && isThumb) {
            fingerScale = 1.05;
        }

        return (
            <motion.div
                className="absolute pointer-events-none flex flex-col items-center"
                style={{
                    width,
                    bottom,
                    left,
                    right,
                    transformOrigin: "bottom center",
                }}
                animate={{
                    rotate,
                    zIndex: isActive ? 40 : 30
                }}
            >
                <motion.div
                    animate={{
                        height: fingerH,
                        y: fingerY,
                        scale: fingerScale
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    style={{ borderBottomWidth: 0 }}
                    className={`w-full rounded-t-full border flex flex-col items-center pt-2 overflow-visible origin-bottom
                        ${isActive
                            ? 'bg-accent border-white/50 shadow-[0_0_20px_rgba(99,102,241,0.6)] z-30'
                            : 'bg-[#1A1A1A] border-white/20 z-20'
                        }
                    `}
                >
                    {/* Nail detail - Fingertip */}
                    <motion.div
                        animate={{
                            backgroundColor: isActive ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.05)',
                            borderColor: isActive ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.1)',
                            scale: isActive ? 0.9 : 1
                        }}
                        className="w-[70%] h-[15px] rounded-full border border-white/20 mb-1"
                    />

                    {/* Active indicator label */}
                    <AnimatePresence>
                        {isActive && (
                            <motion.span
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="text-[10px] font-mono font-bold text-white mt-auto pb-4 absolute bottom-0"
                                style={{ transform: `rotate(${labelRotate})` }}
                            >
                                {(() => {
                                    if (!activeKey) return defaultKey;
                                    const primaryFinger = KEY_FINGER_MAP[activeKey.toLowerCase()];
                                    if (primaryFinger === fingerId) {
                                        return activeKey === ' ' ? 'SPACE' : activeKey.toUpperCase();
                                    } else if (fingerId === 'L_PINKY' || fingerId === 'R_PINKY') {
                                        return 'SHIFT';
                                    }
                                    return defaultKey;
                                })()}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Blending patch into the palm */}
                <div className={`w-[98%] h-6 absolute -bottom-3 z-30 rounded-b-xl ${isActive ? 'bg-accent' : 'bg-[#1A1A1A]'}`} />
            </motion.div>
        );
    };

    // Helper to draw a precise, deep inward U-curve (webbing) connecting the thumb and index finger
    const renderWebbing = (isLeft: boolean) => (
        <svg
            className={`absolute bottom-[65px] ${isLeft ? 'left-[136px]' : 'right-[136px]'} w-[18px] h-[50px] z-25 pointer-events-none transition-opacity duration-300`}
            viewBox="0 0 18 50"
            style={{ transform: isLeft ? 'none' : 'scaleX(-1)' }}
        >
            {/* The exquisite inward concave line serving as the web boundary */}
            <path d="M 0,0 C 4,30 10,43 18,50" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        </svg>
    );

    const isLeftHandActive = isLeftActive || (!isLeftActive && !isRightActive); // Default visible
    const isRightHandActive = isRightActive || (!isLeftActive && !isRightActive);

    return (
        <div className="w-full flex justify-center gap-24 h-[280px] mt-12 mb-0 relative perspective-1000">
            {/* Left Hand */}
            <motion.div
                className="relative w-[180px] h-full"
                animate={{
                    y: leftHandY,
                    x: leftHandX,
                    opacity: isLeftHandActive ? 1 : 0.65
                }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
                {/* Main Palm Area */}
                <div className="absolute bottom-[20px] left-[40px] w-[95px] h-[110px] rounded-[40%_40%_40%_40%] shadow-xl z-20 overflow-hidden border border-white/20 transition-colors duration-300 bg-[#1A1A1A]">
                    <div className="absolute top-1/2 left-4 w-[80%] h-[40%] bg-[#222] rounded-full blur-xl opacity-50" />
                </div>

                {/* Wrist */}
                <div className="absolute -bottom-16 left-[50px] w-[75px] h-[100px] bg-linear-to-t from-transparent to-[#1A1A1A] border-x border-white/20 rounded-t-xl z-10 transition-opacity duration-300" />

                {/* Thumb-Index Webbing Curve */}
                {renderWebbing(true)}

                {/* Fingers */}
                {renderFinger("L_PINKY", 65, "22px", "105px", "40px", undefined, "-12deg", "12deg")}
                {renderFinger("L_RING", 90, "24px", "120px", "62px", undefined, "-4deg", "4deg")}
                {renderFinger("L_MIDDLE", 100, "26px", "126px", "86px", undefined, "1deg", "-1deg")}
                {renderFinger("L_INDEX", 90, "24px", "120px", "112px", undefined, "6deg", "-6deg")}
                {renderFinger("L_THUMB", 65, "28px", "70px", "132px", undefined, "50deg", "-50deg")}
            </motion.div>

            {/* Right Hand */}
            <motion.div
                className="relative w-[180px] h-full"
                animate={{
                    y: rightHandY,
                    x: rightHandX,
                    opacity: isRightHandActive ? 1 : 0.65
                }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
                {/* Main Palm Area */}
                <div className="absolute bottom-[20px] right-[40px] w-[95px] h-[110px] rounded-[40%_40%_40%_40%] shadow-xl z-20 overflow-hidden border border-white/20 transition-colors duration-300 bg-[#1A1A1A]">
                    <div className="absolute top-1/2 left-4 w-[80%] h-[40%] bg-[#222] rounded-full blur-xl opacity-50" />
                </div>

                {/* Wrist */}
                <div className="absolute -bottom-16 right-[50px] w-[75px] h-[100px] bg-linear-to-t from-transparent to-[#1A1A1A] border-x border-white/20 rounded-t-xl z-10 transition-opacity duration-300" />

                {/* Thumb-Index Webbing Curve */}
                {renderWebbing(false)}

                {/* Fingers */}
                {renderFinger("R_PINKY", 65, "22px", "105px", undefined, "40px", "12deg", "-12deg")}
                {renderFinger("R_RING", 90, "24px", "120px", undefined, "62px", "4deg", "-4deg")}
                {renderFinger("R_MIDDLE", 100, "26px", "126px", undefined, "86px", "-1deg", "1deg")}
                {renderFinger("R_INDEX", 90, "24px", "120px", undefined, "112px", "-6deg", "6deg")}
                {renderFinger("R_THUMB", 65, "28px", "70px", undefined, "132px", "-50deg", "50deg")}
            </motion.div>

            {/* Glow backing */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-32 bg-accent/5 rounded-full blur-[80px] pointer-events-none z-0" />
        </div>
    );
}
