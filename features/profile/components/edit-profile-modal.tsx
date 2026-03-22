import { useState, useRef } from "react";
import { X, Camera, Loader2 } from "@/components/icons";
import { motion } from "framer-motion";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface EditProfileModalProps {
    user: SupabaseUser | null;
    currentDisplayName: string;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onProfileUpdated: () => void;
}

export function EditProfileModal({ user, currentDisplayName, isOpen, setIsOpen, onProfileUpdated }: EditProfileModalProps) {
    const [displayName, setDisplayName] = useState(currentDisplayName);
    const [username, setUsername] = useState(user?.user_metadata?.username || "");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleAvatarUpload = async (file: File) => {
        if (!user) return;
        const client = getSupabaseClient();
        if (!client) return;

        try {
            setIsLoading(true);
            setError(null);

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // Upload image to Supabase Storage
            const { error: uploadError } = await client.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = client.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Update Auth metadata
            const { error: updateAuthError } = await client.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (updateAuthError) throw updateAuthError;

            // Update profiles table so it becomes public for board
            await client.from('profiles')
                .upsert({ user_id: user.id, avatar_url: publicUrl, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

            onProfileUpdated();
        } catch (err: unknown) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to upload avatar");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const client = getSupabaseClient();
        if (!client) return;

        try {
            setIsLoading(true);
            setError(null);

            // Update profile metadata in auth
            const { error: authErr } = await client.auth.updateUser({
                data: { username: username, display_name: displayName }
            });
            if (authErr) throw authErr;

            // Update profiles table
            const { error: profileErr } = await client.from('profiles')
                .upsert({
                    user_id: user.id,
                    display_name: displayName,
                    username: username,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (profileErr) throw profileErr;

            onProfileUpdated();
            setIsOpen(false);
        } catch (err: unknown) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to save profile");
        } finally {
            setIsLoading(false);
        }
    };

    // Use current stored avatar or fallback
    const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

    return (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm cursor-pointer"
                onClick={() => setIsOpen(false)}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0 }}
                className="relative z-10 w-full max-w-md bg-panel-bg border border-foreground/10 rounded-3xl shadow-2xl glass glow-accent overflow-hidden max-h-[85vh] overflow-y-auto hide-scrollbar"
            >
                <div className="p-6 border-b border-foreground/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold font-display">Edit Profile</h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-full hover:bg-foreground/5 transition-colors text-text-dim hover:text-foreground"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex flex-col items-center mb-8 relative">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-foreground/10 bg-black/20">
                                {avatarUrl ? (
                                    <UserAvatar
                                        src={avatarUrl}
                                        alt="Avatar"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-accent/20 text-accent font-bold text-3xl">
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                                {isLoading ? <Loader2 className="animate-spin text-white mb-1" size={20} /> : <Camera className="text-white mb-1" size={20} />}
                                <span className="text-[10px] uppercase font-bold text-white tracking-wider">Change</span>
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    handleAvatarUpload(e.target.files[0]);
                                }
                            }}
                        />
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-text-dim">Display Name</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                                placeholder="Awesome Typer"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-text-dim">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                                placeholder="awesome_typer"
                            />
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                className="w-full py-6 text-base font-bold rounded-xl"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="animate-spin" size={18} /> Saving...
                                    </span>
                                ) : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
