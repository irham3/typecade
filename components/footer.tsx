import { Button } from "@/components/ui/button";
import { Github, MessageCircle } from "lucide-react";

export function Footer() {
    return (
        <footer className="w-full max-w-5xl px-6 py-8 flex justify-center text-text-dim text-xs font-mono border-t border-white/4 mt-auto relative z-10">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="gap-1.5">
                    <a href="https://discord.gg/typecade" target="_blank" rel="noreferrer">
                        <MessageCircle size={13} />
                        Discord
                    </a>
                </Button>
                <Button variant="ghost" size="sm" asChild className="gap-1.5">
                    <a href="https://github.com/irham3/typecade" target="_blank" rel="noreferrer">
                        <Github size={13} />
                        GitHub
                    </a>
                </Button>
                <span className="opacity-30 ml-3 py-2 select-none">Typecade v1.0</span>
            </div>
        </footer>
    );
}
