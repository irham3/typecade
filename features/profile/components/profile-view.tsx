import { useState } from "react";
import { AnimatePresence } from "framer-motion";

import { useProfileData } from "../hooks/use-profile-data";
import { ProfileHeader } from "./profile-header";
import { PerformanceChart } from "./performance-chart";
import { TestHistoryTable } from "./test-history-table";
import { DeepInsights } from "./deep-insights";
import { AvatarPreviewModal } from "./avatar-preview-modal";
import { EditProfileModal } from "./edit-profile-modal";

export function ProfileView() {
    const { user, stats, displayName, memberSince, timeframe, setTimeframe, filteredHistory, reloadProfile, isLoading } = useProfileData();
    const [previewOpen, setPreviewOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="w-full max-w-5xl pt-4 sm:pt-4 lg:pt-8 px-0 flex flex-col gap-6 animate-pulse">
                <div className="w-full h-64 sm:h-56 glass rounded-2xl sm:rounded-3xl bg-foreground/5" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="w-full h-[400px] glass rounded-3xl bg-foreground/5" />
                        <div className="w-full h-[300px] glass rounded-3xl bg-foreground/5" />
                    </div>
                    <div className="w-full h-[500px] glass rounded-3xl bg-foreground/5" />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl pt-4 sm:pt-4 lg:pt-8 font-sans px-0">
            <ProfileHeader 
                user={user} 
                displayName={displayName} 
                memberSince={memberSince} 
                stats={stats} 
                setPreviewOpen={setPreviewOpen} 
                setEditOpen={setEditOpen}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
                <div className="lg:col-span-2 space-y-6">
                    <PerformanceChart 
                        filteredHistory={filteredHistory} 
                        timeframe={timeframe} 
                        setTimeframe={setTimeframe} 
                        statsWpm={stats.wpm} 
                    />
                    <TestHistoryTable filteredHistory={filteredHistory} />
                </div>
                <DeepInsights stats={stats} />
            </div>

            <AnimatePresence>
                {previewOpen && (
                    <AvatarPreviewModal 
                        user={user} 
                        previewOpen={previewOpen} 
                        setPreviewOpen={setPreviewOpen} 
                    />
                )}
                {editOpen && (
                    <EditProfileModal
                        user={user}
                        currentDisplayName={displayName}
                        isOpen={editOpen}
                        setIsOpen={setEditOpen}
                        onProfileUpdated={() => {
                            if (reloadProfile) reloadProfile();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
