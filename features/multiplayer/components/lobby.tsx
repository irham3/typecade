import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Shield, Search, ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
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

    const createRoomPayload = useMemo(() => {
        const language = createLang === "Bahasa Indonesia" ? "ID" : "EN";
        const mode = createMode.startsWith("Words") ? "words" : "time";
        const modeValue = mode === "words" ? 50 : 60;
        return { language, mode, modeValue };
    }, [createLang, createMode]);

    const loadRooms = async () => {
        const client = getSupabaseClient();
        if (!client) return;
        const { data, error } = await client
            .from("room_overview")
            .select("*")
            .eq("status", "waiting")
            .order("created_at", { ascending: false })
            .limit(50);
        if (error) return;
        setRooms(data ?? []);
    };

    useEffect(() => {
        if (!supabaseReady) return;
        const timer = setTimeout(() => {
            void loadRooms();
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

    return (
        <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 pt-4 pb-12 relative z-10 font-sans">

            {/* Left Column: Create Room Form */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full lg:w-5/12 h-fit lg:sticky lg:top-24 glass rounded-3xl p-8 flex flex-col shadow-2xl relative overflow-hidden glow-accent border border-white/5"
            >
                {/* Decorative background accent inside the card */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
                <div className="absolute left-0 bottom-0 w-48 h-48 bg-accent-secondary/5 rounded-full blur-2xl pointer-events-none translate-y-1/2 -translate-x-1/2" />

                <h2 className="text-3xl font-display font-bold text-foreground flex items-center gap-3 mb-2 relative z-10">
                    <div className="p-2.5 bg-accent/15 rounded-xl border border-accent/20">
                        <Plus size={24} className="text-accent" />
                    </div>
                    Host Arena
                </h2>
                <p className="text-text-dim text-sm mb-8 relative z-10">Configure the rules and invite challengers.</p>

                <div className="space-y-6 flex-1 flex flex-col relative z-10">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-text-dim uppercase tracking-widest pl-1">Arena Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Neon Speedsters"
                            value={roomName}
                            onChange={(event) => setRoomName(event.target.value)}
                            className="w-full bg-panel-bg/80 border border-white/10 rounded-2xl px-5 py-4 text-foreground placeholder:text-text-dim/60 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/60 focus:bg-panel-elevated transition-all font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-dim uppercase tracking-widest pl-1">Language</label>
                            <DropdownMenu open={langOpen} onOpenChange={setLangOpen}>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between h-auto px-5 py-4 bg-panel-bg/80 hover:bg-panel-elevated border-white/10 text-foreground font-medium rounded-2xl">
                                        {createLang}
                                        <ChevronDown size={16} className="opacity-50 text-text-dim" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-full min-w-[200px] glass rounded-xl border-white/10 p-1">
                                    <DropdownMenuItem className="cursor-pointer rounded-lg px-4 py-2 hover:bg-accent/20 focus:bg-accent/20 transition-colors" onClick={() => setCreateLang("English")}>English</DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer rounded-lg px-4 py-2 hover:bg-accent/20 focus:bg-accent/20 transition-colors" onClick={() => setCreateLang("Bahasa Indonesia")}>Bahasa Indonesia</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-dim uppercase tracking-widest pl-1">Mode</label>
                            <DropdownMenu open={modeOpen} onOpenChange={setModeOpen}>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between h-auto px-5 py-4 bg-panel-bg/80 hover:bg-panel-elevated border-white/10 text-foreground font-medium rounded-2xl">
                                        {createMode}
                                        <ChevronDown size={16} className="opacity-50 text-text-dim" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-full min-w-[200px] glass rounded-xl border-white/10 p-1">
                                    <DropdownMenuItem className="cursor-pointer rounded-lg px-4 py-2 hover:bg-accent/20 focus:bg-accent/20 transition-colors" onClick={() => setCreateMode("Time (60s)")}>Time (60s)</DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer rounded-lg px-4 py-2 hover:bg-accent/20 focus:bg-accent/20 transition-colors" onClick={() => setCreateMode("Words (50)")}>Words (50)</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-panel-bg/50 rounded-2xl border border-white/5 mt-2 hover:bg-panel-bg transition-colors"
                        onClick={() => setIsPrivate(prev => !prev)}
                        style={{ cursor: "pointer" }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                                <Shield size={20} className={isPrivate ? "text-accent" : "text-text-dim"} />
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-sm font-bold ${isPrivate ? "text-white" : "text-foreground"}`}>Private Arena</span>
                                <span className="text-xs text-text-dim mt-0.5">Invite code required to enter</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="w-12 h-6 bg-white/10 rounded-full relative cursor-pointer border border-white/5"
                            disabled={isLoading}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full transition-all shadow-md ${isPrivate ? "left-7 bg-accent" : "left-1 bg-text-dim"}`} />
                        </button>
                    </div>

                    {status && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="rounded-xl border border-error-bg bg-error-bg/20 text-error-text text-sm px-4 py-3 font-medium">
                            {status}
                        </motion.div>
                    )}

                    <div className="mt-6">
                        <Button
                            variant="primary"
                            onClick={handleCreateRoom}
                            disabled={isLoading || !supabaseReady}
                            className={`w-full py-7 font-display font-bold text-lg rounded-2xl flex items-center justify-center gap-2 group transition-all duration-300 ${!isLoading && supabaseReady ? "hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]" : "opacity-70"}`}
                        >
                            {isLoading ? "Provisioning Server..." : "Deploy Arena"}
                            {!isLoading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Right Column: Lobbies List */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                className="w-full lg:w-7/12 flex flex-col"
            >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6 px-2">
                    <div>
                        <h2 className="text-3xl font-display font-bold text-foreground flex items-center gap-3 mb-2">
                            <Users size={28} className="text-accent-secondary" />
                            Active Arenas
                        </h2>
                        <p className="text-text-dim text-sm">Join an open lobby or enter a private code.</p>
                    </div>

                    <div className="relative w-full md:w-[280px] flex items-center">
                        <Search size={18} className="absolute left-4 text-text-dim" />
                        <input
                            type="text"
                            placeholder="Code e.g. XY12"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            maxLength={6}
                            className="bg-panel-bg border border-white/10 rounded-2xl pl-12 pr-28 py-3.5 text-base text-foreground focus:outline-none focus:border-accent/50 focus:bg-panel-elevated w-full tracking-widest font-mono font-bold placeholder:tracking-normal placeholder:font-sans placeholder:font-normal placeholder:text-text-dim/60 transition-colors shadow-inner"
                        />
                        <Button
                            variant="secondary"
                            onClick={() => roomCode.length > 3 && handleJoinRoom(roomCode)}
                            disabled={isLoading || !supabaseReady || roomCode.length < 4}
                            className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-xl text-sm font-bold bg-white/10 hover:bg-white/20 hover:text-white border border-white/5 transition-colors focus:ring-0 shadow-none disabled:opacity-30 disabled:hover:bg-white/10"
                        >
                            Join
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {/* List Headers */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 text-xs font-bold text-text-dim uppercase tracking-widest border-b border-white/5 pb-3 mx-2">
                        <div className="col-span-5">Arena details</div>
                        <div className="col-span-3 text-center">Mode</div>
                        <div className="col-span-2 text-center">Players</div>
                        <div className="col-span-2 text-right">Action</div>
                    </div>

                    <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pr-1">
                        <AnimatePresence mode="popLayout">
                            {rooms.map((room, i) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                    transition={{ duration: 0.3, delay: i * 0.05 }}
                                    key={room.id}
                                    className="group relative overflow-hidden flex flex-col md:grid md:grid-cols-12 items-start md:items-center gap-4 px-6 py-5 rounded-2xl glass-subtle hover:glass border-white/5 hover:border-accent/40 transition-all cursor-pointer hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] shrink-0"
                                    onClick={() => onJoin(room.code)}
                                >
                                    {/* Subtle hover gradient inside row */}
                                    <div className="absolute inset-0 bg-linear-to-r from-accent/0 via-accent/0 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                    <div className="col-span-12 md:col-span-5 flex flex-col gap-1.5 relative z-10 w-full">
                                        <div className="flex items-center max-w-full">
                                            <span className="text-lg font-bold text-foreground truncate mr-3 flex-1" title={room.name}>{room.name}</span>
                                            <span className="text-xs px-2.5 py-1 rounded-md bg-white/5 text-text-dim border border-white/5 font-mono shadow-inner whitespace-nowrap">{room.code}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-text-dim">
                                            <span className="truncate">Host: <span className="text-white/90 font-medium">{room.host_name ?? "Host"}</span></span>
                                        </div>
                                    </div>

                                    <div className="col-span-12 md:col-span-3 flex md:justify-center items-center gap-2 relative z-10 w-full text-sm font-medium text-text-dim">
                                        <span className="px-2.5 py-1 bg-black/30 rounded-lg whitespace-nowrap border border-white/5">
                                            {room.language}
                                        </span>
                                        <span className="px-2.5 py-1 bg-black/30 rounded-lg whitespace-nowrap border border-white/5 font-mono">
                                            {room.mode === "words" ? `${room.mode_value}W` : `${room.mode_value}s`}
                                        </span>
                                    </div>

                                    <div className="col-span-12 md:col-span-2 flex items-center w-full relative z-10 justify-between md:justify-center mt-2 md:mt-0">
                                        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
                                            <div className="flex gap-1">
                                                {Array.from({ length: room.max_players }).map((_, i) => (
                                                    <div key={i} className={`w-2 h-2 rounded-full shadow-sm ${i < room.player_count ? 'bg-accent shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'bg-white/10'}`} />
                                                ))}
                                            </div>
                                            <span className="text-xs font-mono font-bold text-white/90 min-w-[32px] text-right">{room.player_count}/{room.max_players}</span>
                                        </div>
                                    </div>

                                    <div className="col-span-12 md:col-span-2 flex items-center justify-end w-full relative z-10 mt-2 md:mt-0">
                                        <div className="flex items-center justify-end w-full md:w-auto p-2 md:p-0 bg-accent/10 md:bg-transparent rounded-xl md:rounded-none">
                                            <span className="md:hidden text-sm font-bold text-accent mr-3">Click to join</span>
                                            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all transform group-hover:scale-110 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                                <ArrowRight size={18} className="translate-x-0 group-hover:translate-x-0.5 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Empty state waiting */}
                        {!isLoading && rooms.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-3xl text-text-dim bg-panel-bg/30 mt-4 h-[240px]"
                            >
                                <div className="p-4 bg-white/5 rounded-2xl mb-4">
                                    <Search size={32} className="text-text-dim/50" />
                                </div>
                                <span className="text-lg font-display font-medium text-foreground mb-1">No Open Arenas</span>
                                <span className="text-sm">Be the first to host a match on the server.</span>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>

        </div>
    );
}
