import { useState } from "react";
import { Users, Plus, Shield, Search, ArrowRight } from "lucide-react";

const DUMMY_ROOMS = [
    { id: "R-4821", name: "SpeedRace x", host: "TypingNinja", players: 3, max: 5, lang: "EN", diff: "Medium", status: "Waiting" },
    { id: "R-9920", name: "Late Night Code", host: "DevMode", players: 2, max: 4, lang: "ID", diff: "Hard", status: "Waiting" },
    { id: "R-1142", name: "Rookie Ground", host: "NewB", players: 1, max: 8, lang: "EN", diff: "Easy", status: "Waiting" },
];

export function MultiplayerLobby({ onJoin }: { onJoin: (roomId: string) => void }) {
    const [roomCode, setRoomCode] = useState("");

    return (
        <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8 lg:gap-16 pt-8 items-start">

            {/* Left: Create Room Form */}
            <div className="w-full md:w-5/12 bg-[#1A1A1A] rounded-[24px] p-6 sm:p-8 flex flex-col shadow-2xl relative overflow-hidden">
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
                            className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-text-dim focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-text-dim uppercase tracking-wider">Language</label>
                            <select className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-foreground appearance-none focus:outline-none focus:border-accent/50 font-medium">
                                <option>English</option>
                                <option>Bahasa Indonesia</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-text-dim uppercase tracking-wider">Mode</label>
                            <select className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-foreground appearance-none focus:outline-none focus:border-accent/50 font-medium">
                                <option>Time (60s)</option>
                                <option>Words (50)</option>
                            </select>
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
                        <div className="w-10 h-5 bg-white/10 rounded-full relative cursor-pointer">
                            <div className="absolute left-1 top-1 w-3 h-3 bg-text-dim rounded-full transition-all" />
                        </div>
                    </div>

                    <button
                        onClick={() => onJoin("NEW")}
                        className="w-full mt-auto py-4 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        Create & Join <ArrowRight size={18} />
                    </button>
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
                        <button
                            onClick={() => roomCode.length > 3 && onJoin(roomCode)}
                            className="absolute right-1 top-1 bottom-1 bg-white/10 hover:bg-white/20 px-3 rounded-full text-xs font-semibold text-foreground transition-colors"
                        >
                            Join
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-4 font-sans">
                    {DUMMY_ROOMS.map(room => (
                        <div
                            key={room.id}
                            className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-[20px] bg-[#1A1A1A] hover:bg-[#222] border border-transparent hover:border-white/5 transition-all cursor-pointer"
                            onClick={() => onJoin(room.id)}
                        >
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-foreground">🏎 {room.name}</span>
                                    <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-text-dim border border-white/5 font-mono">{room.id}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-text-dim mt-1">
                                    <span>Host: <span className="text-white/80">{room.host}</span></span>
                                    <span className="w-1 h-1 rounded-full bg-white/20" />
                                    <span>{room.lang} • {room.diff}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-start">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        {Array.from({ length: room.max }).map((_, i) => (
                                            <div key={i} className={`w-2 h-2 rounded-full ${i < room.players ? 'bg-accent' : 'bg-white/10'}`} />
                                        ))}
                                    </div>
                                    <span className="text-xs font-mono text-text-dim w-8 text-right">{room.players}/{room.max}</span>
                                </div>
                                <button className="hidden sm:flex items-center gap-2 text-sm font-semibold text-accent opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                                    Join <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Empty state padding */}
                    {DUMMY_ROOMS.length < 5 && (
                        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-[20px] text-text-dim bg-[#1A1A1A]/30 mt-2">
                            <span className="text-sm font-medium">Looking for more active lobbies...</span>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
