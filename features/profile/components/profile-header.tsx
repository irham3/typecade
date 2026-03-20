/* eslint-disable @next/next/no-img-element */
import { User, Eye, Camera, TrendingUp, Target, Hash, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { UserStats } from '@/lib/store';

interface ProfileHeaderProps {
    user: SupabaseUser | null;
    displayName: string;
    memberSince: string;
    stats: UserStats;
    setPreviewOpen: (open: boolean) => void;
    setEditOpen: (open: boolean) => void;
}

const formatHours = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    return `${h}h ${m}m`;
};

export function ProfileHeader({ user, displayName, memberSince, stats, setPreviewOpen, setEditOpen }: ProfileHeaderProps) {
    const statCards = [
        { label: "Personal Best", value: stats.wpm, suffix: " WPM", icon: TrendingUp, color: "text-accent", delay: 0 },
        { label: "Top Accuracy", value: stats.accuracy, suffix: "%", icon: Target, color: "text-accent-secondary", delay: 100 },
        { label: "Total Tests", value: stats.tests, suffix: "", icon: Hash, color: "text-foreground", delay: 200 },
        { label: "Time Typed", value: null, display: formatHours(stats.timeTyped), icon: Clock, color: "text-foreground", delay: 300 },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full glass rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex flex-col md:flex-row items-center md:items-start gap-5 sm:gap-8 shadow-2xl relative overflow-hidden"
        >
            {/* Decorative accent glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/6 rounded-full blur-[100px] pointer-events-none" />

            {/* Avatar */}
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full p-[2px] shrink-0 relative group">
                <div className="absolute inset-0 rounded-full bg-linear-to-tr from-accent/40 to-accent-secondary/30 blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="relative w-full h-full rounded-full bg-panel-bg border border-foreground/10 flex items-center justify-center overflow-hidden cursor-pointer outline-none ring-0">
                            {(user?.user_metadata?.avatar_url || user?.user_metadata?.picture) ? (
                                <img
                                    src={user.user_metadata.avatar_url || user.user_metadata.picture}
                                    alt={user.email || "Profile"}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <>
                                    <User size={28} className="text-text-dim group-hover:text-foreground transition-colors sm:hidden" />
                                    <User size={40} className="text-text-dim group-hover:text-foreground transition-colors hidden sm:block" />
                                </>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-xs font-bold tracking-widest uppercase text-white">Options</span>
                            </div>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-48">
                        <DropdownMenuItem
                            className="gap-2 cursor-pointer"
                            onClick={() => setPreviewOpen(true)}
                            disabled={!(user?.user_metadata?.avatar_url || user?.user_metadata?.picture)}
                        >
                            <Eye size={15} className="text-text-dim" /> View Picture
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            className="gap-2 cursor-pointer"
                            onClick={() => setEditOpen(true)}
                        >
                            <Camera size={15} className="text-text-dim" /> Change Picture
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* User Info */}
            <div className="flex-1 flex flex-col w-full">
                <div className="flex flex-col md:flex-row justify-between items-center md:items-start w-full gap-4">
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight">{displayName}</h1>
                        <span className="text-xs font-medium text-text-dim bg-foreground/5 px-3 py-1 rounded-full border border-foreground/10">
                            {memberSince}
                        </span>
                    </div>
                    <Button variant="outline" className="px-5 py-2.5 rounded-xl text-sm font-medium" onClick={() => setEditOpen(true)}>
                        Edit Profile
                    </Button>
                </div>

                {/* Quick stats grid with CountUp */}
                <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-foreground/10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-center md:text-left">
                    {statCards.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.08 }}
                            className="flex flex-col gap-1"
                        >
                            <div className="flex items-center gap-1.5 justify-center md:justify-start">
                                <stat.icon size={12} className="text-text-dim" />
                                <span className="text-text-dim text-xs uppercase font-bold tracking-wider">{stat.label}</span>
                            </div>
                            <span className={`text-xl sm:text-2xl font-mono font-bold ${stat.color}`}>
                                {stat.value !== null ? (
                                    <CountUp end={stat.value} duration={1200} delay={stat.delay} decimals={stat.label === "Top Accuracy" ? 1 : 0} suffix={stat.suffix} />
                                ) : (
                                    stat.display
                                )}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
