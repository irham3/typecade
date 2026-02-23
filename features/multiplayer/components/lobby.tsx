import { useEffect, useMemo, useState } from "react";
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
        <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8 lg:gap-16 pt-8 items-start">

            {/* Left: Create Room Form */}
            <div className="w-full md:w-5/12 bg-[#1A1A1A] rounded-3xl p-6 sm:p-8 flex flex-col shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full pointer-events-none" />

                <h2 className="text-2xl font-display font-medium text-foreground flex items-center gap-3 mb-8">
                    <div className="p-2 bg-accent/10 rounded-lg text-accent">
                        <Plus size={20} />
                    </div>
                    Create Room
                </h2>

                <div className="space-y-6 flex-1 flex flex-col font-sans">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-text-dim uppercase tracking-wider">Room Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Neon Speedsters"
                            value={roomName}
                            onChange={(event) => setRoomName(event.target.value)}
                            className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-text-dim focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-text-dim uppercase tracking-wider">Language</label>
                            <DropdownMenu open={langOpen} onOpenChange={setLangOpen}>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between h-auto px-4 py-3 bg-[#0F0F0F] border-white/10 text-foreground font-medium rounded-xl">
                                        {createLang}
                                        <ChevronDown size={14} className="opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-full min-w-(--radix-dropdown-menu-trigger-width)">
                                    <DropdownMenuItem onClick={() => setCreateLang("English")}>English</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setCreateLang("Bahasa Indonesia")}>Bahasa Indonesia</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-text-dim uppercase tracking-wider">Mode</label>
                            <DropdownMenu open={modeOpen} onOpenChange={setModeOpen}>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between h-auto px-4 py-3 bg-[#0F0F0F] border-white/10 text-foreground font-medium rounded-xl">
                                        {createMode}
                                        <ChevronDown size={14} className="opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-full min-w-(--radix-dropdown-menu-trigger-width)">
                                    <DropdownMenuItem onClick={() => setCreateMode("Time (60s)")}>Time (60s)</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setCreateMode("Words (50)")}>Words (50)</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#0F0F0F] rounded-xl border border-white/5 mt-4">
                        <div className="flex items-center gap-3">
                            <Shield size={18} className="text-text-dim" />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-foreground">Private Room</span>
                                <span className="text-xs text-text-dim">Require code to join</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsPrivate((prev) => !prev)}
                            className="w-10 h-5 bg-white/10 rounded-full relative cursor-pointer"
                            disabled={isLoading}
                        >
                            <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${isPrivate ? "left-6 bg-accent" : "left-1 bg-text-dim"}`} />
                        </button>
                    </div>

                    {status && (
                        <div className="rounded-xl border border-white/10 bg-white/5 text-text-dim text-xs px-3 py-2">
                            {status}
                        </div>
                    )}

                    <Button
                        variant="primary"
                        onClick={handleCreateRoom}
                        disabled={isLoading || !supabaseReady}
                        className="w-full mt-auto py-6 font-bold flex items-center justify-center gap-2"
                    >
                        Create & Join <ArrowRight size={18} />
                    </Button>
                </div>
            </div>

            {/* Right: Room List */}
            <div className="w-full md:w-7/12 flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <h2 className="text-2xl font-display font-medium text-foreground flex items-center gap-3">
                        <Users size={24} className="text-accent" /> Available Lobbies
                    </h2>

                    <div className="relative w-full sm:w-auto flex items-center">
                        <Search size={16} className="absolute left-3 text-text-dim" />
                        <input
                            type="text"
                            placeholder="Join by code..."
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            maxLength={6}
                            className="bg-[#1A1A1A] border border-white/10 rounded-full pl-10 pr-24 py-2 text-sm text-foreground focus:outline-none focus:border-accent/40 w-full font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans placeholder:text-text-dim"
                        />
                        <Button
                            variant="secondary"
                            onClick={() => roomCode.length > 3 && handleJoinRoom(roomCode)}
                            disabled={isLoading || !supabaseReady}
                            className="absolute right-1 top-1 bottom-1 px-3 rounded-full text-xs font-semibold"
                        >
                            Join
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-4 font-sans">
                    {rooms.map(room => (
                        <div
                            key={room.id}
                            className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-[20px] bg-[#1A1A1A] hover:bg-[#222] border border-transparent hover:border-white/5 transition-all cursor-pointer"
                            onClick={() => onJoin(room.code)}
                        >
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-foreground">🏎 {room.name}</span>
                                    <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-text-dim border border-white/5 font-mono">{room.code}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-text-dim mt-1">
                                    <span>Host: <span className="text-white/80">{room.host_name ?? "Host"}</span></span>
                                    <span className="w-1 h-1 rounded-full bg-white/20" />
                                    <span>{room.language} • {room.mode === "words" ? "Words" : "Time"} {room.mode_value}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-start">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        {Array.from({ length: room.max_players }).map((_, i) => (
                                            <div key={i} className={`w-2 h-2 rounded-full ${i < room.player_count ? 'bg-accent' : 'bg-white/10'}`} />
                                        ))}
                                    </div>
                                    <span className="text-xs font-mono text-text-dim w-8 text-right">{room.player_count}/{room.max_players}</span>
                                </div>
                                <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-accent opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                                    Join <ArrowRight size={16} />
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Empty state padding */}
                    {rooms.length < 5 && (
                        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-[20px] text-text-dim bg-[#1A1A1A]/30 mt-2">
                            <span className="text-sm font-medium">Looking for more active lobbies...</span>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
