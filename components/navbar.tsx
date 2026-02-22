"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Keyboard, Trophy, Users, User, Settings, Play, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/auth-context";

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [accountOpen, setAccountOpen] = useState(false);
    const { user, isLoading, supabaseReady, signOut } = useAuth();

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
                {user ? (
                    <DropdownMenu open={accountOpen} onOpenChange={setAccountOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="gap-2 px-3">
                                <User size={18} />
                                <span className="hidden sm:inline max-w-35 truncate">{user.email ?? "Akun"}</span>
                                <ChevronDown size={14} className={`opacity-60 transition-transform ${accountOpen ? "rotate-180" : ""}`} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => router.push("/profile")}>Profile</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => router.push("/auth")}>Account</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => signOut()}>Sign out</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Button
                        asChild
                        variant="primary"
                        className="px-4"
                        disabled={!supabaseReady || isLoading}
                    >
                        <Link href="/auth">Sign in</Link>
                    </Button>
                )}
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
