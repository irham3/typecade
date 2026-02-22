export type Finger =
    | "L_PINKY" | "L_RING" | "L_MIDDLE" | "L_INDEX" | "L_THUMB"
    | "R_PINKY" | "R_RING" | "R_MIDDLE" | "R_INDEX" | "R_THUMB";

export const KEY_FINGER_MAP: Record<string, Finger> = {
    // Left Hand
    'q': 'L_PINKY', 'a': 'L_PINKY', 'z': 'L_PINKY', '1': 'L_PINKY',
    'w': 'L_RING', 's': 'L_RING', 'x': 'L_RING', '2': 'L_RING',
    'e': 'L_MIDDLE', 'd': 'L_MIDDLE', 'c': 'L_MIDDLE', '3': 'L_MIDDLE',
    'r': 'L_INDEX', 'f': 'L_INDEX', 'v': 'L_INDEX', '4': 'L_INDEX',
    't': 'L_INDEX', 'g': 'L_INDEX', 'b': 'L_INDEX', '5': 'L_INDEX',

    // Right Hand
    'p': 'R_PINKY', ';': 'R_PINKY', '/': 'R_PINKY', '0': 'R_PINKY', '-': 'R_PINKY', '=': 'R_PINKY', '[': 'R_PINKY', ']': 'R_PINKY', '\'': 'R_PINKY',
    'o': 'R_RING', 'l': 'R_RING', '.': 'R_RING', '9': 'R_RING',
    'i': 'R_MIDDLE', 'k': 'R_MIDDLE', ',': 'R_MIDDLE', '8': 'R_MIDDLE',
    'u': 'R_INDEX', 'j': 'R_INDEX', 'm': 'R_INDEX', '7': 'R_INDEX',
    'y': 'R_INDEX', 'h': 'R_INDEX', 'n': 'R_INDEX', '6': 'R_INDEX',

    ' ': 'R_THUMB',
};

export interface Lesson {
    id: string;
    title: string;
    instruction: string;
    text: string;
    targetKeys: string[];
}

export interface Module {
    id: string;
    title: string;
    description: string;
    locked: boolean;
    lessons: Lesson[];
}

export const LEARN_MODULES: Module[] = [
    {
        id: "m1",
        title: "MODULE 1: Home Row Keys",
        description: "Start from zero and progressively build your muscle memory on the home row.",
        locked: false,
        lessons: [
            {
                id: "1-1",
                title: "Introduction to ASDF JKL;",
                instruction: "Place your left hand fingers on A S D F, and your right hand on J K L ;. The index fingers should feel the small bumps on F and J.",
                text: "ffff jjjj ffff jjjj fjfj jfjf fj fj jf jf f j f j",
                targetKeys: ["f", "j", " "]
            },
            {
                id: "1-2",
                title: "Adding D and K",
                instruction: "Now use your middle fingers for D and K. Remember to return them to their home position.",
                text: "dddd kkkk dfjk kjfd dfdf kjkj dkf dkf fk djk fdjk",
                targetKeys: ["d", "k", "f", "j", " "]
            },
            {
                id: "1-3",
                title: "Adding S and L",
                instruction: "Use your ring fingers for S and L. Ring fingers can be tricky, take it slow.",
                text: "ssss llll slsl lsls sldk ksls jlfs fals sdlk dsf",
                targetKeys: ["s", "l", "d", "k", "f", "j", " "]
            },
            {
                id: "1-4",
                title: "Adding A and ;",
                instruction: "Finally, the pinky fingers on A and semicolon (;).",
                text: "aaaa ;;;; asdf jkl; fdsa ;lkj asdj jsda fl;a dkjs",
                targetKeys: ["a", ";", "s", "l", "d", "k", "f", "j", " "]
            }
        ]
    },
    {
        id: "m2",
        title: "MODULE 2: Top Row Keys",
        description: "Reach up to the top row while keeping your base on the home row.",
        locked: false,
        lessons: [
            {
                id: "2-1",
                title: "R and U",
                instruction: "Reach your index fingers up to R and U. Then bring them back to F and J.",
                text: "frfr juju frju jufr fur fur jur jur rufu ruf urj",
                targetKeys: ["f", "r", "j", "u", " "]
            },
            {
                id: "2-2",
                title: "E and I",
                instruction: "Use your middle fingers for E and I. It's a quick push upwards.",
                text: "dede kiki deki kide did did kid fire dire fir kire",
                targetKeys: ["d", "e", "k", "i", " "]
            },
            {
                id: "2-3",
                title: "W and O",
                instruction: "Ring fingers reach up to W and O.",
                text: "swsw lolo swlo losw sow low ows owl word soor",
                targetKeys: ["s", "w", "l", "o", " "]
            },
            {
                id: "2-4",
                title: "Q and P",
                instruction: "Pinky fingers reach for Q and P.",
                text: "aqaq ;p;p aqp; p;qa pap pop qoq qua prop quip",
                targetKeys: ["a", "q", ";", "p", " "]
            }
        ]
    }
];
