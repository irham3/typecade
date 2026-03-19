import { useState } from "react";
import { AnimatePresence } from "framer-motion";

import { useProfileData } from "../hooks/use-profile-data";
import { ProfileHeader } from "./profile-header";
import { PerformanceChart } from "./performance-chart";
import { TestHistoryTable } from "./test-history-table";
import { DeepInsights } from "./deep-insights";
import { AvatarPreviewModal } from "./avatar-preview-modal";

export function ProfileView() {
    const { user, stats, displayName, memberSince, timeframe, setTimeframe, filteredHistory } = useProfileData();
    const [previewOpen, setPreviewOpen] = useState(false);

    return (
        <div className="w-full max-w-5xl pt-4 sm:pt-4 lg:pt-8 font-sans px-0">
            <ProfileHeader 
                user={user} 
                displayName={displayName} 
                memberSince={memberSince} 
                stats={stats} 
                setPreviewOpen={setPreviewOpen} 
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
            </AnimatePresence>
        </div>
    );
}
