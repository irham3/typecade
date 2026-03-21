"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { startBGM, stopBGM, initAudio } from "@/lib/utils/sound";

export function AudioController() {
    const bgm = useStore(state => state.bgm);
    const interacted = useRef(false);

    useEffect(() => {
        const playMusic = () => {
            if (bgm !== "off") {
                startBGM(bgm);
            } else {
                stopBGM();
            }
        };

        if (interacted.current) {
            playMusic();
            return;
        }

        const handleInteraction = () => {
            interacted.current = true;
            initAudio(); // Force unlock audio context on first interaction
            playMusic();
            window.removeEventListener("click", handleInteraction);
            window.removeEventListener("keydown", handleInteraction);
        };

        window.addEventListener("click", handleInteraction);
        window.addEventListener("keydown", handleInteraction);

        // Try playing immediately just in case browser allows it
        playMusic();

        return () => {
            stopBGM();
            window.removeEventListener("click", handleInteraction);
            window.removeEventListener("keydown", handleInteraction);
        };
    }, [bgm]);

    return null;
}
