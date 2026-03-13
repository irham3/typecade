/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Keyboard, Trophy, Users, User, Settings, GraduationCap, ChevronDown, Menu, X, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/auth-context";
import { AuthModal } from "@/components/auth-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { useStore } from "@/lib/store";

const navItems = [
    { path: "/", icon: Keyboard, label: "Practice" },
    { path: "/arena", icon: Users, label: "Arena" },
    { path: "/learn", icon: GraduationCap, label: "Learn" },
    { path: "/leaderboard", icon: Trophy, label: "Leaderboard" },
];

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [accountOpen, setAccountOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
    const { user, isLoading, supabaseReady, signOut } = useAuth();
    const setSettingsOpen = useStore(state => state.setSettingsOpen);
    const setThemeModalOpen = useStore(state => state.setThemeModalOpen);
    const navRef = useRef<HTMLDivElement>(null);
    const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });

    useEffect(() => {
        const nav = navRef.current;
        if (!nav) return;

        const activeIndex = navItems.findIndex(
            (item) => pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path))
        );

        const links = nav.querySelectorAll<HTMLAnchorElement>("[data-nav-link]");
        const activeLink = links[activeIndex];

        if (activeLink) {
            setPillStyle({
                left: activeLink.offsetLeft,
                width: activeLink.offsetWidth,
                opacity: 1,
            });
        } else {
            setPillStyle((prev) => ({ ...prev, opacity: 0 }));
        }
    }, [pathname]);

    return (
        <header className="w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-3 sm:py-5 flex items-center justify-between z-20 relative">
            {/* Logo */}
            <div className="flex flex-1 items-center justify-start">
                <Link href="/" className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0">
                    <div className="relative">
                        <Image
                            src="/typecade-logo.png"
                            alt="Typecade"
                            width={32}
                            height={32}
                            className="rounded-xl group-hover:scale-110 transition-transform duration-300 sm:w-9 sm:h-9"
                        />
                        <div className="absolute inset-0 rounded-xl bg-accent/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-foreground/90 group-hover:text-foreground transition-colors">
                        Typecade
                    </span>
                </Link>
            </div>

            {/* Desktop Nav */}
            <nav
                ref={navRef}
                className="hidden md:flex items-center relative glass rounded-2xl px-1.5 py-1.5"
            >
                {/* Animated pill */}
                <motion.div
                    className="absolute top-1.5 bottom-1.5 rounded-xl bg-foreground/15 shadow-[inset_0_1px_1px_rgba(var(--foreground-rgb),0.06)]"
                    animate={{
                        left: pillStyle.left,
                        width: pillStyle.width,
                        opacity: pillStyle.opacity,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 28,
                    }}
                />

                {navItems.map((item) => {
                    const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            data-nav-link
                            className={`relative z-10 flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-xl ${isActive
                                ? "text-foreground"
                                : "text-text-dim hover:text-foreground/80"
                                }`}
                        >
                            <item.icon size={15} className={isActive ? "text-accent" : ""} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Right side actions */}
            <div className="flex flex-1 items-center justify-end gap-2">
                {user ? (
                    <DropdownMenu open={accountOpen} onOpenChange={setAccountOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="gap-2 px-2">
                                <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center border border-accent/20 overflow-hidden shrink-0">
                                    {(user.user_metadata?.avatar_url || user.user_metadata?.picture) ? (
                                        <img
                                            src={user.user_metadata.avatar_url || user.user_metadata.picture}
                                            alt={user.email || "Profile"}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User size={14} className="text-accent" />
                                    )}
                                </div>
                                <ChevronDown size={12} className={`opacity-50 transition-transform duration-200 ${accountOpen ? "rotate-180" : ""}`} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[260px]">
                            <DropdownMenuLabel className="flex items-center gap-3 px-4 py-3 pb-3 inset-0">
                                <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center border border-accent/20 overflow-hidden shrink-0">
                                    {(user.user_metadata?.avatar_url || user.user_metadata?.picture) ? (
                                        <img
                                            src={user.user_metadata.avatar_url || user.user_metadata.picture}
                                            alt={user.email || "Profile"}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User size={18} className="text-accent" />
                                    )}
                                </div>
                                <div className="flex flex-col space-y-0.5 overflow-hidden">
                                    <span className="font-display font-medium text-sm text-foreground truncate">{user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.username || "Player"}</span>
                                    <span className="text-xs font-medium text-text-dim truncate normal-case tracking-normal">{user.email}</span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="mb-2" />
                            <DropdownMenuItem onSelect={() => router.push("/profile")}>Profile</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setLogoutConfirmOpen(true)}>Sign out</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Button
                        variant="primary"
                        className="px-5 text-sm"
                        disabled={!supabaseReady || isLoading}
                        onClick={() => setAuthModalOpen(true)}
                    >
                        Sign in
                    </Button>
                )}

                {/* Mobile hamburger */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="p-2.5 md:hidden"
                    aria-label="Menu"
                    onClick={() => setMobileOpen(!mobileOpen)}
                >
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </Button>
            </div>

            {/* Mobile nav drawer */}
            {mobileOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-2 right-2 sm:left-4 sm:right-4 bg-panel-elevated/95 backdrop-blur-2xl border border-foreground/10 shadow-2xl shadow-black/50 rounded-2xl p-3 md:hidden z-50 mt-2"
                >
                    {navItems.map((item) => {
                        const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive
                                    ? "text-foreground bg-foreground/10"
                                    : "text-text-dim hover:text-foreground hover:bg-foreground/5"
                                    }`}
                            >
                                <item.icon size={16} className={isActive ? "text-accent" : ""} />
                                {item.label}
                            </Link>
                        );
                    })}
                </motion.div>
            )}

            <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

            <ConfirmModal
                isOpen={logoutConfirmOpen}
                title="Sign out of Typecade?"
                message="Are you sure you want to sign out? You will be disconnected from any active arenas."
                confirmText="Sign Out"
                cancelText="Cancel"
                onConfirm={() => {
                    setLogoutConfirmOpen(false);
                    signOut();
                }}
                onCancel={() => setLogoutConfirmOpen(false)}
            />
        </header>
    );
}
