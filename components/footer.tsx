import { Button } from "@/components/ui/button";

export function Footer() {
    return (
        <footer className="w-full max-w-5xl px-6 py-8 flex justify-center text-text-dim text-xs font-mono border-t border-white/5 mt-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => window.open("https://discord.gg/typecade", "_blank")}>Discord</Button>
                <Button variant="ghost" size="sm" onClick={() => window.open("https://github.com/irham3/typecade", "_blank")}>GitHub</Button>
                <span className="opacity-50 ml-4 py-2">Typecade v1.0</span>
            </div>
        </footer>
    );
}
