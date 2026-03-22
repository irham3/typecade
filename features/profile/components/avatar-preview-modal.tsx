import { X } from "@/components/icons";
import { motion } from "framer-motion";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AvatarPreviewModalProps {
    user: SupabaseUser | null;
    previewOpen: boolean;
    setPreviewOpen: (open: boolean) => void;
}

export function AvatarPreviewModal({ user, previewOpen, setPreviewOpen }: AvatarPreviewModalProps) {
    if (!previewOpen) return null;

    return (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/90 backdrop-blur-md cursor-pointer"
                onClick={() => setPreviewOpen(false)}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0 }}
                className="relative z-10 w-full max-w-sm sm:max-w-md bg-panel-bg border border-foreground/10 rounded-3xl shadow-2xl flex flex-col items-center glass glow-accent"
            >
                <button
                    onClick={() => setPreviewOpen(false)}
                    className="cursor-pointer absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/10 transition-all text-white/90 hover:text-white z-20 shadow-2xl hover:scale-110"
                >
                    <X size={20} />
                </button>
                <div className="w-full aspect-square rounded-2xl overflow-hidden bg-panel-bg border border-foreground/10 flex items-center justify-center">
                    <UserAvatar 
                        src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture} 
                        alt={user?.email || "Profile"} 
                        iconSize={80} 
                    />
                </div>
            </motion.div>
        </div>
    );
}
