"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Keyboard, Trophy, Users, User, Settings, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

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

            <nav className="hidden md:flex items-center gap-2 font-sans text-sm font-medium px-2 py-1.5 bg-transparent">
                {[
                    { path: "/", icon: Keyboard, label: "Core" },
                    { path: "/multiplayer", icon: Users, label: "Arena" },
                    { path: "/learn", icon: Play, label: "Academy" },
                    { path: "/leaderboard", icon: Trophy, label: "Rankings" },
                ].map((item) => {
                    const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
                    return (
                        <Button
                            asChild
                            key={item.path}
                            variant={isActive ? "active" : "ghost"}
                            className="gap-2 px-5 py-2.5"
                        >
                            <Link href={item.path}>
                                <item.icon size={16} className={isActive ? "text-accent" : ""} />
                                <span>{item.label}</span>
                            </Link>
                        </Button>
                    );
                })}
            </nav>

            <div className="flex items-center gap-3 text-text-dim">
                <Button
                    asChild
                    variant={pathname === '/profile' ? 'active' : 'ghost'}
                    size="icon"
                    className="p-2.5"
                    aria-label="Profile"
                >
                    <Link href="/profile">
                        <User size={20} />
                    </Link>
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="p-2.5"
                    aria-label="Settings"
                >
                    <Settings size={20} />
                </Button>
            </div>
        </header>
    );
}
