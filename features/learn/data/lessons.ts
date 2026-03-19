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
    slug: string;
    title: string;
    instruction: string;
    text: string;
    targetKeys: string[];
}

export interface Module {
    id: string;
    slug: string;
    title: string;
    description: string;
    locked: boolean;
    lessons: Lesson[];
}

export const LEARN_MODULES: Module[] = [
    {
        id: "m1",
        slug: "home-row-foundation",
        title: "MODULE 1: Home Row Foundation",
        description: "Start from zero and progressively build your muscle memory on the home row.",
        locked: false,
        lessons: [
            {
                id: "1-1",
                slug: "intro-f-and-j",
                title: "Introduction to F and J",
                instruction: "Place your index fingers on F and J. Feel the small physical bumps on the keys to anchor your position.",
                text: "ffff jjjj ffff jjjj fjfj jfjf fj fj jf jf f j f j",
                targetKeys: ["f", "j", " "]
            },
            {
                id: "1-2",
                slug: "adding-d-and-k",
                title: "Adding D and K",
                instruction: "Now use your middle fingers for D and K. Remember to return them to their home position immediately after pressing.",
                text: "dddd kkkk dfjk kjfd dfdf kjkj dkf dkf fk djk fdjk",
                targetKeys: ["d", "k"]
            },
            {
                id: "1-3",
                slug: "adding-s-and-l",
                title: "Adding S and L",
                instruction: "Use your ring fingers for S and L. Ring fingers can be quite stiff at first, take it slow.",
                text: "ssss llll slsl lsls sldk ksls jlfs fals sdlk dsf",
                targetKeys: ["s", "l"]
            },
            {
                id: "1-4",
                slug: "adding-a-and-semicolon",
                title: "Adding A and ;",
                instruction: "Finally, deploy the pinky fingers on A and semicolon (;). Keep your wrists elevated.",
                text: "aaaa ;;;; asdf jkl; fdsa ;lkj asdj jsda fl;a dkjs",
                targetKeys: ["a", ";"]
            },
            {
                id: "1-5",
                slug: "center-reach-g-and-h",
                title: "The Center Reach: G and H",
                instruction: "Reach to the center keys. Left index for G, right index for H. Always snap back to F and J immediately.",
                text: "fgfg jhjh gfgh hjgj gas dash flash glass hall lash",
                targetKeys: ["g", "h"]
            }
        ]
    },
    {
        id: "m2",
        slug: "top-row-expansion",
        title: "MODULE 2: Top Row Expansion",
        description: "Reach up to the top row while keeping your base anchored firmly on the home row.",
        locked: false,
        lessons: [
            {
                id: "2-1",
                slug: "r-and-u",
                title: "R and U",
                instruction: "Reach your index fingers up to R and U. Then quickly bring them back down.",
                text: "frfr juju frju jufr fur fur jur jur rufu ruf urj",
                targetKeys: ["r", "u"]
            },
            {
                id: "2-2",
                slug: "e-and-i",
                title: "E and I",
                instruction: "Use your middle fingers for E and I. It's a quick push upwards.",
                text: "dede kiki deki kide did did kid fire dire fir kire",
                targetKeys: ["e", "i"]
            },
            {
                id: "2-3",
                slug: "w-and-o",
                title: "W and O",
                instruction: "Ring fingers reach up to W and O.",
                text: "swsw lolo swlo losw sow low ows owl word soor",
                targetKeys: ["w", "o"]
            },
            {
                id: "2-4",
                slug: "q-and-p",
                title: "Q and P",
                instruction: "Pinky fingers reach diagonally up for Q and P.",
                text: "aqaq ;p;p aqp; p;qa pap pop qoq qua prop quip pipe",
                targetKeys: ["q", "p"]
            },
            {
                id: "2-5",
                slug: "center-top-t-and-y",
                title: "The Center Top: T and Y",
                instruction: "A wider stretch for your index fingers. Left for T, right for Y.",
                text: "ftft jyjy try toy out duty youth true your truly story",
                targetKeys: ["t", "y"]
            }
        ]
    },
    {
        id: "m3",
        slug: "bottom-row-descent",
        title: "MODULE 3: Bottom Row Descent",
        description: "Tackle the trickiest row. Curl your fingers downwards without moving your wrists.",
        locked: false,
        lessons: [
            {
                id: "3-1",
                slug: "v-and-m",
                title: "V and M",
                instruction: "Left index reaches down-right for V, right index reaches down-left for M.",
                text: "fvmv jmjm vim mac much move give have come room",
                targetKeys: ["v", "m"]
            },
            {
                id: "3-2",
                slug: "c-and-comma",
                title: "C and , (Comma)",
                instruction: "Left middle drops to C, right middle drops to comma (,).",
                text: "dcdc k,k, mic doc, care, vice, nice, face, mace,",
                targetKeys: ["c", ","]
            },
            {
                id: "3-3",
                slug: "x-and-period",
                title: "X and . (Period)",
                instruction: "Left ring drops to X, right ring drops to period (.).",
                text: "sxsx l.l. six. box. fix. mix. next. ox. max. lax.",
                targetKeys: ["x", "."]
            },
            {
                id: "3-4",
                slug: "z-and-slash",
                title: "Z and / (Slash)",
                instruction: "Left pinky drops to Z, right pinky drops to forward slash (/).",
                text: "azaz ;/;/ zip/ zag/ size/ quiz/ lazy/ crazy/ haze/ maze/",
                targetKeys: ["z", "/"]
            },
            {
                id: "3-5",
                slug: "center-bottom-b-and-n",
                title: "The Center Bottom: B and N",
                instruction: "Left index reaches far down-right to B, right index reaches down to N.",
                text: "fbfb jnjn bind none bone noon brain name rain turn",
                targetKeys: ["b", "n"]
            }
        ]
    },
    {
        id: "m4",
        slug: "shift-key",
        title: "MODULE 4: The Shift Key",
        description: "Learn how to capitalize letters without breaking rhythm by using opposite shift keys.",
        locked: false,
        lessons: [
            {
                id: "4-1",
                slug: "right-shift",
                title: "Right Shift (Left Hand Capitalization)",
                instruction: "Use your RIGHT pinky to hold Shift while typing letters with your LEFT hand.",
                text: "A B C D E F G Q R S T V W X Z A S D F G",
                targetKeys: ["a", "b", "c", "d", "e", "f", "g", "q", "r", "s", "t", "v", "w", "x", "z", "Shift"]
            },
            {
                id: "4-2",
                slug: "left-shift",
                title: "Left Shift (Right Hand Capitalization)",
                instruction: "Use your LEFT pinky to hold Shift while typing letters with your RIGHT hand.",
                text: "H I J K L M N O P U Y H J K L N M P O I",
                targetKeys: ["h", "i", "j", "k", "l", "m", "n", "o", "p", "u", "y", "Shift"]
            },
            {
                id: "4-3",
                slug: "alternating-shifts",
                title: "Alternating Shifts",
                instruction: "Alternate gracefully. Remember: Left key = Right Shift, Right key = Left Shift.",
                text: "The Quick Brown Fox Jumps Over The Lazy Dog",
                targetKeys: ["Shift", " "]
            }
        ]
    },
    {
        id: "m5",
        slug: "numbers-and-mastery",
        title: "MODULE 5: Numbers & Mastery",
        description: "The top numerical row and advanced flowing paragraphs to achieve total fluency.",
        locked: false,
        lessons: [
            {
                id: "5-1",
                slug: "left-numbers-1-to-5",
                title: "Left Numbers: 1 to 5",
                instruction: "Stretch from your left home row up to the numbers. 1(Pinky), 2(Ring), 3(Middle), 4(Index), 5(Index).",
                text: "1 2 3 4 5 123 45 54 321 41 52 35 15 a1 s2 d3 f4 f5",
                targetKeys: ["1", "2", "3", "4", "5"]
            },
            {
                id: "5-2",
                slug: "right-numbers-6-to-0",
                title: "Right Numbers: 6 to 0",
                instruction: "Stretch your right hand. 6(Index), 7(Index), 8(Middle), 9(Ring), 0(Pinky).",
                text: "6 7 8 9 0 67 890 09 876 60 79 80 j6 j7 k8 l9 ;0",
                targetKeys: ["6", "7", "8", "9", "0"]
            },
            {
                id: "5-3",
                slug: "total-keyboard-integration",
                title: "Total Keyboard Integration",
                instruction: "All rows and numbers combined in complex words.",
                text: "Update 101: The system needs 45 packages via 2 servers. Contact me 9 times.",
                targetKeys: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", " ", "Shift", ":", ".", ","]
            },
            {
                id: "5-4",
                slug: "mastery-flow-state",
                title: "Mastery: Flow State",
                instruction: "Type this paragraph smoothly without looking. Don't rush; let the muscle memory do the work.",
                text: "Water comprises roughly 60 percent of the adult human body. It acts as a building block for cells, regulates our internal temperature, and transports carbohydrates into the bloodstream. It is essential to life, yet everyday we lose 2 to 3 liters through breathing, sweating, and digestion.",
                targetKeys: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", " ", "Shift", ":", ".", ","]
            }
        ]
    }
];

/** Helper: find module and lesson by their URL slugs */
export function findBySlug(moduleSlug: string, lessonSlug: string) {
    const mod = LEARN_MODULES.find(m => m.slug === moduleSlug);
    if (!mod) return null;
    const lesson = mod.lessons.find(l => l.slug === lessonSlug);
    if (!lesson) return null;
    const lessonIndex = mod.lessons.indexOf(lesson);
    const nextLesson = lessonIndex < mod.lessons.length - 1 ? mod.lessons[lessonIndex + 1] : null;
    return { module: mod, lesson, nextLesson };
}
