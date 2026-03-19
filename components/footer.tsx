import { Button } from "@/components/ui/button";
import { Github, Palette } from "lucide-react";
import { useStore } from "@/lib/store";

export function Footer() {
    const theme = useStore(state => state.theme);
    const setThemeModalOpen = useStore(state => state.setThemeModalOpen);

    return (
        <footer className="w-full max-w-5xl px-4 sm:px-6 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between text-text-dim text-xs font-mono border-t border-foreground/5 mt-auto relative gap-4">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="gap-1.5 h-auto py-2">
                    <a href="https://github.com/irham3/typecade" target="_blank" rel="noreferrer">
                        <Github size={13} />
                        GitHub
                    </a>
                </Button>
                {/* <div className="h-4 w-px bg-foreground/10 hidden sm:block mx-1" /> */}
                {/* <span className="opacity-30 py-2 select-none">Typecade v1.0</span> */}
            </div>

            <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-[10px] tracking-widest uppercase font-bold hover:text-accent transition-colors"
                onClick={() => setThemeModalOpen(true)}
            >
                <Palette size={12} className="text-accent" />
                Theme: <span className="text-foreground">{theme}</span>
            </Button>
        </footer>
    );
}
