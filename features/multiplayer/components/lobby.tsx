import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Shield, Search, ChevronDown, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useRoomRegistry } from "../hooks/use-room-registry";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type RoomOverview = {
    id: string;
    code: string;
    name: string;
    host_name: string | null;
    language: string;
    mode: string;
    mode_value: number;
    max_players: number;
    status: string;
    player_count: number;
};

export function MultiplayerLobby({ onJoin }: { onJoin: (roomId: string) => void }) {
    const { user, supabaseReady } = useAuth();
    const [roomCode, setRoomCode] = useState("");
    const [roomName, setRoomName] = useState("");
    const [createLang, setCreateLang] = useState("English");
    const [createMode, setCreateMode] = useState("Time (60s)");
    const [isPrivate, setIsPrivate] = useState(false);
    const [rooms, setRooms] = useState<RoomOverview[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [langOpen, setLangOpen] = useState(false);
    const [modeOpen, setModeOpen] = useState(false);
    const [isHostModalOpen, setIsHostModalOpen] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const { activeRoomIds, roomPlayerCounts } = useRoomRegistry();

    const createRoomPayload = useMemo(() => {
        const language = createLang === "Bahasa Indonesia" ? "ID" : "EN";
        const mode = createMode.startsWith("Words") ? "words" : "time";
        const modeValue = mode === "words" ? 50 : 60;
        return { language, mode, modeValue };
    }, [createLang, createMode]);

    const loadRooms = async (isInitial = false) => {
        const client = getSupabaseClient();
        if (!client) return;
        const { data, error } = await client
            .from("room_overview")
            .select("*")
            .eq("status", "waiting")
            .order("created_at", { ascending: false })
            .limit(50);
        if (error) {
            if (isInitial) setInitialLoading(false);
            return;
        }

        const fetchedData = data ?? [];
        setRooms(fetchedData);

        if (isInitial) setInitialLoading(false);
    };

    useEffect(() => {
        if (!supabaseReady) return;
        const timer = setTimeout(() => {
            void loadRooms(true);
        }, 0);
        const client = getSupabaseClient();
        if (!client) return;
        const channel = client
            .channel("room-updates")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "multiplayer_rooms" },
                () => void loadRooms()
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "multiplayer_room_players" },
                () => void loadRooms()
            )
            .subscribe();
        return () => {
            clearTimeout(timer);
            void client.removeChannel(channel);
        };
    }, [supabaseReady]);

    const resolveDisplayName = async () => {
        const client = getSupabaseClient();
        if (!client || !user) return "Player";
        const { data } = await client
            .from("profiles")
            .select("display_name, username")
            .eq("user_id", user.id)
            .maybeSingle();
        const profile = (data ?? null) as { display_name?: string; username?: string } | null;
        if (profile?.display_name) return profile.display_name;
        if (profile?.username) return profile.username;
        return user.email?.split("@")[0] ?? "Player";
    };

    const handleCreateRoom = async () => {
        if (!supabaseReady || !user) {
            setStatus("Sign in to create a room.");
            return;
        }
        const client = getSupabaseClient();
        if (!client) return;
        setIsLoading(true);
        setStatus("");
        const displayName = await resolveDisplayName();
        const code = Math.random().toString(36).slice(2, 8).toUpperCase();
        const { data: room, error } = await client
            .from("multiplayer_rooms")
            .insert({
                code,
                name: roomName.trim() || "New Room",
                host_user_id: user.id,
                language: createRoomPayload.language,
                mode: createRoomPayload.mode,
                mode_value: createRoomPayload.modeValue,
                max_players: 6,
                is_private: isPrivate,
                status: "waiting",
            } as unknown as never)
            .select("id, code")
            .single();

        const roomRow = (room ?? null) as { id: string, code: string } | null;
        if (error || !roomRow) {
            setIsLoading(false);
            setStatus(error?.message ?? "Failed to create room.");
            return;
        }

        const { error: joinError } = await client
            .from("multiplayer_room_players")
            .upsert({
                room_id: roomRow.id,
                user_id: user.id,
                display_name: displayName,
                status: "waiting",
                progress: 0,
                wpm: 0,
                correct_chars: 0,
            } as unknown as never, { onConflict: "room_id,user_id" });

        setIsLoading(false);
        if (joinError) {
            setStatus(joinError.message);
            return;
        }
        onJoin(roomRow.code);
    };

    const handleJoinRoom = async (code: string) => {
        if (!supabaseReady || !user) {
            setStatus("Sign in to join a room.");
            return;
        }
        const client = getSupabaseClient();
        if (!client) return;
        setIsLoading(true);
        setStatus("");
        const { data: room, error } = await client
            .from("multiplayer_rooms")
            .select("id, code")
            .eq("code", code)
            .maybeSingle();
        const roomRow = (room ?? null) as { id: string, code: string } | null;
        if (error || !roomRow) {
            setIsLoading(false);
            setStatus("Room code not found.");
            return;
        }
        const displayName = await resolveDisplayName();
        const { error: joinError } = await client
            .from("multiplayer_room_players")
            .upsert({
                room_id: roomRow.id,
                user_id: user.id,
                display_name: displayName,
                status: "waiting",
                progress: 0,
                wpm: 0,
                correct_chars: 0,
            } as unknown as never, { onConflict: "room_id,user_id" });
        setIsLoading(false);
        if (joinError) {
            setStatus(joinError.message);
            return;
        }
        onJoin(roomRow.code);
    };

    const filteredRooms = useMemo(() => {
        return rooms.filter(room =>
            activeRoomIds.has(room.id) || activeRoomIds.has(room.code)
        );
    }, [rooms, activeRoomIds]);

    return (
        <div className="w-full max-w-5xl flex flex-col pt-6 sm:pt-10 pb-12 relative z-10 font-sans mx-auto">

            {/* Header: actions only, no redundant title */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-5 sm:mb-6 gap-3 px-1">
                <p className="text-text-dim text-sm hidden sm:block">Join an active arena or host your own.</p>

                <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2.5">
                    <div className="relative w-full sm:w-[240px] flex items-stretch">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim" />
                        <input
                            type="text"
                            placeholder="Invite Code"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            maxLength={6}
                            className="bg-panel-bg border border-white/10 rounded-xl pl-10 pr-16 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent/50 focus:bg-panel-elevated w-full tracking-widest font-mono font-bold placeholder:tracking-normal placeholder:font-sans placeholder:font-normal placeholder:text-text-dim/60 transition-colors"
                        />
                        <Button
                            variant="secondary"
                            onClick={() => roomCode.length > 3 && handleJoinRoom(roomCode)}
                            disabled={isLoading || !supabaseReady || roomCode.length < 4}
                            className="absolute right-1 top-1 bottom-1 px-3 h-auto rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/5 disabled:opacity-30"
                        >
                            Join
                        </Button>
                    </div>
                    <Button
                        variant="primary"
                        className="w-full sm:w-auto py-2.5 px-5 rounded-xl flex items-center justify-center gap-2 font-bold shadow-none text-sm transition-all hover:-translate-y-0.5"
                        onClick={() => setIsHostModalOpen(true)}
                    >
                        <Plus size={16} />
                        New Arena
                    </Button>
                </div>
            </div>

            {/* Arena List */}
            <div className="w-full relative flex flex-col">
                {/* Desktop List Headers */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-2 text-[11px] font-bold text-text-dim uppercase tracking-widest border-b border-white/5 mb-1">
                    <div className="col-span-5">Arena</div>
                    <div className="col-span-3 text-center">Settings</div>
                    <div className="col-span-2 text-center">Players</div>
                    <div className="col-span-2 text-right">Action</div>
                </div>

                <div className="flex flex-col gap-3 max-h-[500px] sm:max-h-[750px] overflow-y-auto pr-2 
                    [&::-webkit-scrollbar]:w-2 
                    [&::-webkit-scrollbar-track]:bg-transparent 
                    [&::-webkit-scrollbar-thumb]:bg-white/10 
                    [&::-webkit-scrollbar-thumb]:rounded-full 
                    hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                    <AnimatePresence mode="popLayout">
                        {filteredRooms.map((room, i) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.97 }}
                                transition={{ duration: 0.15, delay: i * 0.03 }}
                                key={room.id}
                                className="group relative overflow-hidden flex flex-col md:grid md:grid-cols-12 items-start md:items-center gap-4 px-6 py-5 rounded-2xl bg-panel-bg/40 hover:bg-panel-elevated/80 border border-white/5 hover:border-white/10 transition-all cursor-pointer shrink-0"
                                onClick={() => onJoin(room.code)}
                            >
                                <div className="col-span-12 md:col-span-5 flex flex-col gap-1.5 w-full">
                                    <div className="flex items-center w-full gap-2">
                                        <span className="text-lg font-bold text-foreground truncate">{room.name}</span>
                                        <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-text-dim border border-white/5 font-mono shrink-0">{room.code}</span>
                                    </div>
                                    <span className="text-sm text-text-dim truncate">by <span className="text-white/70 font-medium">{room.host_name ?? "Player"}</span></span>
                                </div>

                                <div className="col-span-12 md:col-span-3 flex md:justify-center items-center gap-2 w-full text-sm font-medium text-text-dim">
                                    <span className="px-2.5 py-1 bg-black/20 rounded-md border border-white/5">{room.language}</span>
                                    <span className="px-2.5 py-1 bg-black/20 rounded-md border border-white/5">{room.mode === "words" ? "Words" : "Time"}</span>
                                    <span className="px-2.5 py-1 bg-black/20 rounded-md border border-white/5 font-mono">{room.mode === "words" ? `${room.mode_value}` : `${room.mode_value}s`}</span>
                                </div>

                                <div className="col-span-12 md:col-span-2 flex items-center md:justify-center w-full">
                                    <span className="text-sm font-mono font-bold text-foreground/90 bg-black/20 px-3 py-1 rounded-lg border border-white/5">
                                        {roomPlayerCounts[room.id] ?? roomPlayerCounts[room.code] ?? 0} <span className="text-text-dim/50 font-normal mx-1">/</span> {room.max_players}
                                    </span>
                                </div>

                                <div className="col-span-12 md:col-span-2 flex items-center justify-end w-full">
                                    <span className="hidden md:block text-sm font-bold text-text-dim group-hover:text-accent transition-colors">Join →</span>
                                    <span className="md:hidden w-full text-center py-2.5 bg-white/5 rounded-lg text-sm font-bold text-white/80">Join</span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Shimmer loading skeleton */}
                    {initialLoading && rooms.length === 0 && (
                        <>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                                <div key={n} className="flex flex-col md:grid md:grid-cols-12 items-start md:items-center gap-4 px-6 py-5 rounded-2xl bg-panel-bg/40 border border-white/5 animate-pulse shrink-0">
                                    <div className="col-span-12 md:col-span-5 flex flex-col gap-3 w-full">
                                        <div className="h-5 w-2/3 bg-white/5 rounded" />
                                        <div className="h-4 w-1/3 bg-white/5 rounded" />
                                    </div>
                                    <div className="col-span-12 md:col-span-3 flex md:justify-center gap-2 w-full">
                                        <div className="h-6 w-10 bg-white/5 rounded-md" />
                                        <div className="h-6 w-14 bg-white/5 rounded-md" />
                                        <div className="h-6 w-8 bg-white/5 rounded-md" />
                                    </div>
                                    <div className="col-span-12 md:col-span-2 flex md:justify-center w-full">
                                        <div className="h-7 w-14 bg-white/5 rounded-lg" />
                                    </div>
                                    <div className="col-span-12 md:col-span-2 flex justify-end w-full">
                                        <div className="h-5 w-14 bg-white/5 rounded px-2" />
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Empty state */}
                    {!initialLoading && !isLoading && filteredRooms.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col items-center justify-center py-20 sm:py-32 border border-dashed border-white/5 rounded-[32px] text-text-dim bg-panel-bg/10 mt-2 group relative overflow-hidden"
                        >
                            {/* Subtle background glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/5 blur-[100px] pointer-events-none" />

                            <div className="relative flex flex-col items-center gap-5">
                                <div className="p-5 bg-white/5 rounded-3xl border border-white/5 text-accent/50 group-hover:text-accent/80 group-hover:scale-110 transition-all duration-700">
                                    <Gamepad2 size={40} strokeWidth={1.5} />
                                </div>
                                <div className="text-center space-y-1.5 px-6">
                                    <h3 className="text-xl font-display font-bold text-foreground">No active arenas</h3>
                                    <p className="text-sm text-text-dim max-w-[280px] leading-relaxed">
                                        There is no room available for now. Be the first to host an arena and invite others to a typing battle!
                                    </p>
                                </div>
                                <Button
                                    variant="primary"
                                    className="mt-3 py-2.5 px-8 rounded-xl font-bold text-sm shadow-xl shadow-accent/10 transition-all hover:-translate-y-0.5"
                                    onClick={() => setIsHostModalOpen(true)}
                                >
                                    New Arena
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Soft bottom fade/blur effect */}
                <div className="absolute bottom-0 left-0 right-3 h-16 bg-linear-to-t from-background to-transparent pointer-events-none z-10" />
            </div>

            {/* Host Arena Modal */}
            <AnimatePresence>
                {isHostModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
                        onClick={() => setIsHostModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 15 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 15 }}
                            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                            className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-[24px] shadow-2xl p-6 relative overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-3 mb-2">
                                <Plus size={24} className="text-accent" />
                                New Arena
                            </h2>
                            <p className="text-text-dim text-sm mb-6">Set the rules for your arena.</p>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-dim uppercase tracking-widest pl-1">Arena Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Neon Speedsters"
                                        value={roomName}
                                        onChange={(event) => setRoomName(event.target.value)}
                                        className="w-full bg-panel-bg/80 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-text-dim/60 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/60 focus:bg-panel-elevated transition-all font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-dim uppercase tracking-widest pl-1">Language</label>
                                        <DropdownMenu open={langOpen} onOpenChange={setLangOpen}>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full justify-between px-4 py-5 bg-panel-bg/80 hover:bg-panel-elevated border-white/10 text-foreground font-medium rounded-xl">
                                                    {createLang}
                                                    <ChevronDown size={14} className="opacity-50 text-text-dim" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[180px] rounded-xl border-white/10 p-1">
                                                <DropdownMenuItem className="cursor-pointer rounded-lg px-4 py-2 hover:bg-accent/20 focus:bg-accent/20 transition-colors" onClick={() => setCreateLang("English")}>English</DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer rounded-lg px-4 py-2 hover:bg-accent/20 focus:bg-accent/20 transition-colors" onClick={() => setCreateLang("Bahasa Indonesia")}>Bahasa Indonesia</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-dim uppercase tracking-widest pl-1">Mode</label>
                                        <DropdownMenu open={modeOpen} onOpenChange={setModeOpen}>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full justify-between px-4 py-5 bg-panel-bg/80 hover:bg-panel-elevated border-white/10 text-foreground font-medium rounded-xl">
                                                    {createMode}
                                                    <ChevronDown size={14} className="opacity-50 text-text-dim" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[180px] rounded-xl border-white/10 p-1">
                                                <DropdownMenuItem className="cursor-pointer rounded-lg px-4 py-2 hover:bg-accent/20 focus:bg-accent/20 transition-colors" onClick={() => setCreateMode("Time (60s)")}>Time (60s)</DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer rounded-lg px-4 py-2 hover:bg-accent/20 focus:bg-accent/20 transition-colors" onClick={() => setCreateMode("Words (50)")}>Words (50)</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-panel-bg/50 rounded-xl border border-white/5 hover:bg-panel-bg transition-colors"
                                    onClick={() => setIsPrivate(prev => !prev)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                                            <Shield size={18} className={isPrivate ? "text-accent" : "text-text-dim"} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-bold ${isPrivate ? "text-white" : "text-foreground"}`}>Private Arena</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="w-10 h-5 bg-white/10 rounded-full relative cursor-pointer border border-white/5"
                                    >
                                        <div className={`absolute top-[2px] w-4 h-4 rounded-full transition-all shadow-md ${isPrivate ? "left-[20px] bg-accent" : "left-[2px] bg-text-dim"}`} />
                                    </button>
                                </div>

                                {status && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="rounded-xl border border-error-bg bg-error-bg/20 text-error-text text-sm px-4 py-3 font-medium">
                                        {status}
                                    </motion.div>
                                )}

                                <div className="mt-2 pt-2 gap-3 flex flex-col sm:flex-row-reverse">
                                    <Button
                                        variant="primary"
                                        onClick={handleCreateRoom}
                                        disabled={isLoading || !supabaseReady}
                                        className={`w-full py-5 sm:py-6 font-bold text-base rounded-xl transition-all duration-300 ${!isLoading ? "hover:-translate-y-0.5" : "opacity-70"}`}
                                    >
                                        {isLoading ? "Creating..." : "Create Arena"}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setIsHostModalOpen(false)}
                                        className="w-full py-5 sm:py-6 text-text-dim hover:text-white rounded-xl"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
