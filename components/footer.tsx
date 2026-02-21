export function Footer() {
    return (
        <footer className="w-full max-w-5xl px-6 py-8 flex justify-center text-text-dim text-xs font-mono border-t border-white/5 mt-auto">
            {/* <div className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                <span>{`<`}</span>
                <span>keyboard-focused layout</span>
                <span>{`>`}</span>
            </div> */}
            <div className="flex items-center gap-4">
                <button className="hover:text-foreground transition-colors">Discord</button>
                <button className="hover:text-foreground transition-colors">GitHub</button>
                <span className="opacity-50">Typecade v1.0</span>
            </div>
        </footer>
    );
}
