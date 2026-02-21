"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Keyboard, Trophy, Users, User, Settings, Play } from "lucide-react";

export function Navbar() {
    const pathname = usePathname();

    return (
        <header className="w-full max-w-6xl px-8 py-6 flex items-center justify-between z-10 relative">
            <Link href="/" className="flex items-center gap-4 cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center font-bold font-display text-2xl shadow-[0_0_20px_rgba(99,102,241,0.4)] group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all duration-300">
                    T
                </div>
                <span className="font-display font-bold text-2xl tracking-tight opacity-90 group-hover:opacity-100 transition-opacity">
                    Typecade
                </span>
            </Link>

            <nav className="hidden md:flex items-center gap-2 font-sans text-sm font-medium text-text-dim px-2 py-1.5 bg-transparent">
                {[
                    { path: "/", icon: Keyboard, label: "Core" },
                    { path: "/multiplayer", icon: Users, label: "Arena" },
                    { path: "/learn", icon: Play, label: "Academy" },
                    { path: "/leaderboard", icon: Trophy, label: "Rankings" },
                ].map((item) => {
                    const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 ${isActive
                                ? "text-white bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                                : "hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <item.icon size={16} className={isActive ? "text-accent" : ""} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="flex items-center gap-3 text-text-dim">
                <Link
                    href="/profile"
                    className={`transition-all duration-300 p-2.5 rounded-xl border ${pathname === '/profile' ? 'text-white border-white/10 bg-white/5' : 'border-transparent hover:text-white hover:bg-white/5'}`}
                    aria-label="Profile"
                >
                    <User size={20} />
                </Link>
                <button
                    className="transition-all duration-300 p-2.5 rounded-xl border border-transparent hover:text-white hover:bg-white/5"
                    aria-label="Settings"
                >
                    <Settings size={20} />
                </button>
            </div>
        </header>
    );
}
