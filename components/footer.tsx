import { Button } from "@/components/ui/button";
import { Palette, Settings } from "lucide-react";
import { useStore } from "@/lib/store";
import { GlobalSettingsModal } from "./global-settings-modal";

export function Footer() {
    const theme = useStore(state => state.theme);
    const setThemeModalOpen = useStore(state => state.setThemeModalOpen);
    const setGlobalSettingsOpen = useStore(state => state.setGlobalSettingsOpen);
    const isTyping = useStore(state => state.isTyping);

    return (
        <footer className={`w-full max-w-5xl px-4 sm:px-6 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-end text-text-dim text-xs font-mono border-t border-foreground/5 mt-auto relative gap-4 transition-all duration-500 ease-out ${isTyping ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'}`}>
            <GlobalSettingsModal />
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
