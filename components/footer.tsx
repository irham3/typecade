import { Button } from "@/components/ui/button";
import { Palette, Settings, Info } from "@/components/icons";
import Link from "next/link";
import { useStore } from "@/lib/store";

export function Footer() {
    const theme = useStore(state => state.theme);
    const setThemeModalOpen = useStore(state => state.setThemeModalOpen);
    const setGlobalSettingsOpen = useStore(state => state.setGlobalSettingsOpen);
    const isTyping = useStore(state => state.isTyping);
    const showUI = useStore(state => state.showUI);
    const hideUI = isTyping && !showUI;

    return (
        <footer className={`w-full max-w-screen-2xl px-2 sm:px-4 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-end text-text-dim text-xs font-mono border-t border-foreground/5 mt-auto relative gap-4 transition-all duration-500 ease-out ${hideUI ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'}`}>

            {/* <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="gap-1.5 h-auto py-2">
                    <a href="https://github.com/irham3/typecade" target="_blank" rel="noreferrer">
                        <Github size={13} />
                        GitHub
                    </a>
                </Button>
            </div> */}

            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="gap-1.5 text-[10px] tracking-widest uppercase font-bold hover:text-accent transition-colors"
                >
                    <Link href="/about">
                        <Info size={12} className="opacity-70" />
                        About
                    </Link>
                </Button>

                <div className="h-4 w-px bg-foreground/10 hidden sm:block mx-1" />

                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-[10px] tracking-widest uppercase font-bold hover:text-accent transition-colors"
                    onClick={() => setThemeModalOpen(true)}
                >
                    <Palette size={12} className="opacity-70" />
                    Theme: <span className="text-foreground">{theme}</span>
                </Button>

                <div className="h-4 w-px bg-foreground/10 hidden sm:block mx-1" />

                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-[10px] tracking-widest uppercase font-bold hover:text-accent transition-colors"
                    onClick={() => setGlobalSettingsOpen(true)}
                >
                    <Settings size={12} className="opacity-70" />
                    Settings
                </Button>
            </div>
        </footer>
    );
}
