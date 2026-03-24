"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Keyboard, Trophy, Users, GraduationCap, ChevronDown, Menu, X } from "@/components/icons";
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
import { ConfirmModal } from "@/components/confirm-modal";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useStore } from "@/lib/store";

const navItems = [
    { path: "/", icon: Keyboard, label: "Practice" },
    { path: "/arena", icon: Users, label: "Arena" },
    { path: "/learn", icon: GraduationCap, label: "Learn" },
    { path: "/board", icon: Trophy, label: "Board" },
];

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [accountOpen, setAccountOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const setAuthModalOpen = useStore(state => state.setAuthModalOpen);
    const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
    const { user, isLoading, supabaseReady, signOut } = useAuth();
    // const setSettingsOpen = useStore(state => state.setSettingsOpen);
    // const setThemeModalOpen = useStore(state => state.setThemeModalOpen);
    const navRef = useRef<HTMLDivElement>(null);
    const isTyping = useStore(state => state.isTyping);
    const showUI = useStore(state => state.showUI);
    const hideUI = isTyping && !showUI;

    return (
        <>
            <header className={`w-full pt-0 flex justify-center z-50 sticky top-0 transition-all duration-500 ease-out bg-panel-bg/60 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20 ${hideUI ? 'opacity-0 pointer-events-none -translate-y-10' : 'opacity-100 translate-y-0'}`}>
                <div className="w-full max-w-screen-2xl mx-auto flex items-center justify-between px-6 sm:px-12 md:px-16 py-3 sm:py-4">
                    {/* Logo */}
                    <div className="flex flex-1 items-center justify-start">
                        <Link href="/" className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0">
                            <div className="relative">
                                <Image
                                    src="/typecade.png"
                                    alt="Typecade Logo"
                                    width={160}
                                    height={40}
                                    priority
                                    className="object-contain mix-blend-screen group-hover:scale-105 transition-transform duration-300 w-auto h-9 sm:h-11 md:h-13"
                                />
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <nav
                        ref={navRef}
                        className="hidden md:flex items-center relative gap-1 lg:gap-2 px-1 py-1"
                    >
                        {navItems.map((item) => {
                            const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    data-nav-link
                                    className={`relative z-10 flex items-center gap-3 px-5 py-3 text-sm lg:text-lg font-mono tracking-tight transition-all duration-300 rounded-lg overflow-hidden ${isActive
                                        ? "text-white bg-[#0a111f] border-t-2 border-accent shadow-inner-white/5 font-bold scale-105"
                                        : "text-text-dim hover:text-foreground hover:bg-white/5 font-medium"
                                        }`}
                                >
                                    <div className="relative z-10 flex items-center justify-center">
                                        {isActive && (
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-accent/30 blur-md rounded-full pointer-events-none" />
                                        )}
                                        <item.icon
                                            size={28}
                                            className={isActive ? "text-accent filter drop-shadow-[0_0_1px_rgba(255,255,255,0.1)]" : "opacity-50"}
                                        />
                                    </div>
                                    <span className="relative z-10">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right side actions */}
                    <div className="flex flex-1 items-center justify-end gap-2">
                        {isLoading || !supabaseReady ? (
                            <div />
                        ) : user ? (
                            <DropdownMenu open={accountOpen} onOpenChange={setAccountOpen}>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="gap-2 px-2">
                                        <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center border border-accent/20 overflow-hidden shrink-0">
                                            <UserAvatar
                                                src={user.user_metadata?.avatar_url || user.user_metadata?.picture}
                                                alt={user.email || "Profile"}
                                                iconSize={14}
                                                iconClassName="text-accent"
                                            />
                                        </div>
                                        <ChevronDown size={12} className={`opacity-50 transition-transform duration-200 ${accountOpen ? "rotate-180" : ""}`} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-65">
                                    <DropdownMenuLabel className="flex items-center gap-3 px-4 py-3 pb-3 inset-0">
                                        <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center border border-accent/20 overflow-hidden shrink-0">
                                            <UserAvatar
                                                src={user.user_metadata?.avatar_url || user.user_metadata?.picture}
                                                alt={user.email || "Profile"}
                                                iconSize={18}
                                                iconClassName="text-accent"
                                            />
                                        </div>
                                        <div className="flex flex-col space-y-0.5 overflow-hidden">
                                            <span className="font-display font-medium text-sm text-foreground truncate">{user.user_metadata?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.username || "Player"}</span>
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
                                className="px-5 lg:px-7 py-2.5 lg:py-3 h-auto text-sm lg:text-base font-mono font-extrabold text-white bg-accent-secondary uppercase tracking-[0.15em] shadow-[0_0_15px_rgba(var(--accent-secondary-rgb),0.4)] hover:shadow-[0_0_25px_rgba(var(--accent-secondary-rgb),0.6)] hover:bg-accent-secondary/90 border-b-[3px] border-black/40 hover:border-b hover:translate-y-[2px] active:border-b-0 active:translate-y-[3px] transition-all duration-150 rounded-lg"
                                onClick={() => setAuthModalOpen(true)}
                            >
                                SIGN IN
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
            </header>

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
        </>
    );
}
