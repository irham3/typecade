"use client";

let audioCtx: AudioContext | null = null;
let isBgmPlaying = false;
let sequenceTimer: number | null = null;

export const initAudio = () => {
    if (typeof window === "undefined") return false;
    try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return false;
        if (!audioCtx) audioCtx = new AudioContextClass();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return true;
    } catch { return false; }
};

export const playTypeSound = (type: "soft" | "mechanical" | "arcade" | string, isError: boolean) => {
    if (!initAudio() || !audioCtx) return;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    if (isError) {
        osc.type = type === "arcade" ? "square" : "sawtooth";
        osc.frequency.setValueAtTime(type === "arcade" ? 100 : 150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    } else {
        if (type === "arcade") {
            osc.type = "square";
            osc.frequency.setValueAtTime(600 + Math.random() * 200, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        } else if (type === "mechanical") {
            osc.type = "square";
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        } else {
            osc.type = "sine";
            osc.frequency.setValueAtTime(300, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        }
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    }
};

export const playComboSound = (type: "soft" | "mechanical" | "arcade" | string, level: number) => {
    if (type !== "arcade" || !initAudio() || !audioCtx) return;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    
    const baseFreq = 440 + (level * 20);
    osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
    osc.frequency.setValueAtTime(baseFreq * 1.5, audioCtx.currentTime + 0.05);
    osc.frequency.setValueAtTime(baseFreq * 2, audioCtx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
};

let nextNoteTime = 0;
let currentNote = 0;
let bgmType = "arcade";

const sequenceArcade = [130.81, 155.56, 196.00, 261.63, 196.00, 155.56]; // C3 minor arp
const sequenceLofi = [
    [174.61, 220.00, 261.63, 329.63], // Fmaj7
    [155.56, 196.00, 233.08, 293.66], // Ebmaj7
    [138.59, 174.61, 207.65, 261.63], // Dbmaj7
    [130.81, 155.56, 196.00, 233.08]  // Cmin7
];
const sequenceSynthwave = [
    130.81, 130.81, 130.81, 261.63, 130.81, 130.81, 220.00, 130.81,
    155.56, 155.56, 155.56, 311.13, 155.56, 155.56, 261.63, 155.56 
]; // Driving 16th bass line (C3, Eb3)
const sequenceAmbient = [130.81, 174.61, 196.00, 155.56]; // C, F, G, Eb

const scheduleBGM = () => {
    const ctx = audioCtx;
    if (!isBgmPlaying || !ctx) return;
    
    while (nextNoteTime < ctx.currentTime + 0.1) {
        if (bgmType === "arcade") {
            const freq = sequenceArcade[currentNote % sequenceArcade.length];
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0.04, nextNoteTime);
            gain.gain.exponentialRampToValueAtTime(0.001, nextNoteTime + 0.15);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(nextNoteTime);
            osc.stop(nextNoteTime + 0.15);
            
            nextNoteTime += 0.15;
            currentNote++;
        } 
        else if (bgmType === "lofi") {
            // Lofi generates slow overlapping jazzy chords
            const chord = sequenceLofi[Math.floor(currentNote) % sequenceLofi.length];
            chord.forEach((freq) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "triangle"; // All triangle to give it more body
                osc.frequency.value = freq;
                
                gain.gain.setValueAtTime(0, nextNoteTime);
                // Slow attack to higher volume
                gain.gain.linearRampToValueAtTime(0.08, nextNoteTime + 0.4);
                // Long lush release
                gain.gain.linearRampToValueAtTime(0, nextNoteTime + 1.8);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(nextNoteTime);
                osc.stop(nextNoteTime + 1.8);
            });
            nextNoteTime += 1.8;
            currentNote++;
        }
        else if (bgmType === "synthwave") {
            // Fast saw bass with an envelope filter
            const freq = sequenceSynthwave[currentNote % sequenceSynthwave.length];
            const osc = ctx.createOscillator();
            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();
            
            osc.type = "sawtooth";
            osc.frequency.value = freq;
            
            filter.type = "lowpass";
            // Filter LFO effect based on current beat - much wider cutoff for audibility
            const cutoff = 400 + Math.abs(Math.sin(currentNote * 0.2)) * 1200;
            filter.frequency.setValueAtTime(cutoff, nextNoteTime);
            filter.frequency.exponentialRampToValueAtTime(200, nextNoteTime + 0.12);
            filter.Q.value = 4; // Resonance
            
            gain.gain.setValueAtTime(0.12, nextNoteTime);
            gain.gain.exponentialRampToValueAtTime(0.001, nextNoteTime + 0.15);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            osc.start(nextNoteTime);
            osc.stop(nextNoteTime + 0.15);
            
            nextNoteTime += 0.15;
            currentNote++;
        }
        else if (bgmType === "ambient") {
            // Evolving sweeping planetary drones
            const root = sequenceAmbient[Math.floor(currentNote / 2) % sequenceAmbient.length];
            [root * 0.5, root, root * 1.5, root * 2.01].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const filter = ctx.createBiquadFilter();
                const gain = ctx.createGain();
                
                osc.type = idx === 0 ? "sine" : "sawtooth";
                osc.frequency.value = freq + (Math.random() * 3 - 1.5);
                
                filter.type = "lowpass";
                // Massive slow sweep
                filter.frequency.setValueAtTime(100, nextNoteTime);
                filter.frequency.linearRampToValueAtTime(1000, nextNoteTime + 2.5);
                filter.frequency.linearRampToValueAtTime(100, nextNoteTime + 5.0);
                filter.Q.value = 1;
                
                gain.gain.setValueAtTime(0, nextNoteTime);
                gain.gain.linearRampToValueAtTime(0.04 - (idx * 0.005), nextNoteTime + 2.5);
                gain.gain.linearRampToValueAtTime(0, nextNoteTime + 5.0);
                
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);
                osc.start(nextNoteTime);
                osc.stop(nextNoteTime + 5.0);
            });
            
            nextNoteTime += 5.0;
            currentNote += 2;
        }
    }
    
    sequenceTimer = window.setTimeout(scheduleBGM, 50);
};

export const startBGM = (type: string) => {
    if (type === "off") {
        stopBGM();
        return;
    }
    
    // If BGM changes while it's playing, stop the current loop cleanly and restart
    if (isBgmPlaying && bgmType !== type) {
        stopBGM();
    }
    
    bgmType = type;
    
    if (isBgmPlaying) return;
    if (!initAudio() || !audioCtx) return;
    
    isBgmPlaying = true;
    nextNoteTime = audioCtx.currentTime + 0.05;
    currentNote = 0;
    scheduleBGM();
};

export const stopBGM = () => {
    isBgmPlaying = false;
    if (sequenceTimer) {
        clearTimeout(sequenceTimer);
        sequenceTimer = null;
    }
};
