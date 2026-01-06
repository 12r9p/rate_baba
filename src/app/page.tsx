
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

interface RoomSummary {
    id: string;
    playerCount: number;
    phase: string;
    round: number;
}

interface RankingPlayer {
    id: string;
    name: string;
    rate: number;
    matches: number;
    wins: number;
}

export default function Home() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [rooms, setRooms] = useState<RoomSummary[]>([]);
    const [recentRooms, setRecentRooms] = useState<{ id: string }[]>([]);
    const [rankings, setRankings] = useState<RankingPlayer[]>([]);
    const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
    const [joinRoomId, setJoinRoomId] = useState("");
    const [showRankings, setShowRankings] = useState(false);

    useEffect(() => {
        const storedName = localStorage.getItem('babanuki_player_name');
        if (storedName) setName(storedName);

        const socket = io();
        socket.on('connect', () => {
            socket.emit('get-rooms', (activeRooms: RoomSummary[]) => {
                setRooms(activeRooms);

                // Check and cleanup Recent Rooms
                try {
                    const recentJson = localStorage.getItem('babanuki_recent_rooms');
                    if (recentJson) {
                        const recent: { id: string, lastVisited: number }[] = JSON.parse(recentJson);

                        // Filter out rooms that no longer exist in activeRooms
                        const validRecent = recent.filter(r => activeRooms.some(ar => ar.id === r.id));

                        // Update LocalStorage if changed
                        if (validRecent.length !== recent.length) {
                            localStorage.setItem('babanuki_recent_rooms', JSON.stringify(validRecent));
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse recent rooms", e);
                }
            });
        });

        // Fetch rankings
        fetch('/api/rankings')
            .then(res => res.json())
            .then(data => setRankings(data))
            .catch(err => console.error('Failed to fetch rankings:', err));

        return () => { socket.disconnect(); };
    }, []);

    const saveRecentRoom = (id: string) => {
        try {
            const recentJson = localStorage.getItem('babanuki_recent_rooms');
            let recent: { id: string, lastVisited: number }[] = recentJson ? JSON.parse(recentJson) : [];

            // Remove existing if any (to bump to top)
            recent = recent.filter(r => r.id !== id);

            // Add new
            recent.unshift({ id, lastVisited: Date.now() });

            // Limit to 5
            if (recent.length > 5) recent = recent.slice(0, 5);

            localStorage.setItem('babanuki_recent_rooms', JSON.stringify(recent));
        } catch (e) {
            console.error(e);
        }
    };

    const [customRoomId, setCustomRoomId] = useState("");

    const handleCreateRoom = () => {
        if (!name.trim()) return;
        localStorage.setItem('babanuki_player_name', name);

        // Generate 4-character ID (Numbers + Uppercase) if not provided
        const finalRoomId = customRoomId.trim() || (() => {
            const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
            return Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
        })();

        saveRecentRoom(finalRoomId);
        router.push(`/room/${finalRoomId}/play`);
    };

    const handleJoinRoom = (roomId: string) => {
        if (!name.trim()) return;
        localStorage.setItem('babanuki_player_name', name);
        saveRecentRoom(roomId);
        router.push(`/room/${roomId}/play`);
    };

    // ...

    return (
        <main className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans overflow-x-hidden overflow-y-auto selection:bg-slate-200 selection:text-black">

            <div className="relative z-10 max-w-xl mx-auto px-6 py-24 flex flex-col items-center">

                {/* SIMPLE HERO */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
                        RATE BABANUKI
                    </h1>
                    <p className="text-[10px] text-slate-400 font-bold tracking-[0.4em] uppercase">
                        ONLINE CARD GAME
                    </p>
                </motion.div>

                {/* Rankings Button */}
                <button
                    onClick={() => setShowRankings(!showRankings)}
                    className="w-full mb-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
                >
                    🏆 TOP PLAYERS
                </button>

                {/* Name Input - Shared for both Create and Join */}
                <div className="w-full mb-6 relative">
                    <label className="absolute top-3 left-4 text-[10px] font-bold text-slate-400 tracking-wider pointer-events-none z-10">
                        YOUR NAME
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={10}
                        className="w-full bg-white border border-slate-200 text-lg font-bold pt-8 pb-3 px-4 rounded-xl focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all placeholder:text-slate-200 text-slate-800"
                        placeholder="Enter name..."
                    />
                </div>

                {/* NAVIGATION TABS */}
                <div className="flex w-full mb-8 bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`flex-1 py-3 rounded-lg font-bold text-xs transition-all ${activeTab === 'create' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        CREATE
                    </button>
                    <button
                        onClick={() => setActiveTab('join')}
                        className={`flex-1 py-3 rounded-lg font-bold text-xs transition-all ${activeTab === 'join' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        JOIN
                    </button>
                </div>

                {/* CONTENT AREA */}
                <div className="w-full relative">
                    <AnimatePresence mode="wait">
                        {activeTab === 'create' ? (
                            <motion.div
                                key="create"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col gap-4"
                            >
                                <div className="space-y-4">
                                    {/* Custom Room ID Input */}
                                    <div className="relative">
                                        <label className="absolute top-3 left-4 text-[10px] font-bold text-slate-400 tracking-wider pointer-events-none">
                                            ROOM ID (OPTIONAL)
                                        </label>
                                        <input
                                            type="text"
                                            value={customRoomId}
                                            onChange={(e) => setCustomRoomId(e.target.value.toUpperCase().slice(0, 10))}
                                            maxLength={10}
                                            className="w-full bg-white border border-slate-200 text-lg font-bold pt-8 pb-3 px-4 rounded-xl focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all placeholder:text-slate-200 text-slate-800 uppercase font-mono"
                                            placeholder="AUTO-GENERATE"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleCreateRoom}
                                    disabled={!name.trim()}
                                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-black active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-200 mt-2"
                                >
                                    CREATE ROOM
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="join"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="w-full"
                            >
                                {/* Recent Rooms & Rankings Section Removed - Now in modal */}

                                {recentRooms.length > 0 && (
                                    <div className="mb-8">
                                        <h3 className="text-xs font-bold text-slate-400 mb-3 tracking-widest ml-1">HISTORY</h3>
                                        <div className="flex flex-col gap-2">
                                            {recentRooms.map(room => (
                                                <button
                                                    key={room.id}
                                                    onClick={() => handleJoinRoom(room.id)}
                                                    className="w-full p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-left flex justify-between items-center group"
                                                >
                                                    <div>
                                                        <div className="font-bold text-slate-800 text-sm">ROOM {room.id}</div>
                                                        <div className="text-[10px] font-bold text-slate-400">ID: {room.id}</div>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                                        →
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <div className="flex gap-2 mb-6">
                                        <div className="relative flex-1">
                                            <label className="absolute top-3 left-4 text-[10px] font-bold text-slate-400 tracking-wider pointer-events-none">
                                                ROOM ID
                                            </label>
                                            <input
                                                type="text"
                                                value={joinRoomId}
                                                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase().slice(0, 4))}
                                                maxLength={4}
                                                className="w-full bg-white border border-slate-200 text-lg font-bold pt-8 pb-3 px-4 rounded-xl focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all placeholder:text-slate-200 text-slate-800 uppercase"
                                                placeholder="ABCD"
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleJoinRoom(joinRoomId)}
                                            disabled={!name.trim() || joinRoomId.length < 4}
                                            className="px-6 bg-slate-900 text-white font-bold rounded-xl hover:bg-black active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md"
                                        >
                                            JOIN
                                        </button>
                                    </div>
                                    {rooms.length === 0 ? (
                                        <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
                                            <span className="text-slate-400 text-xs font-bold">NO ACTIVE ROOMS</span>
                                        </div>
                                    ) : (
                                        rooms.map(room => (
                                            <motion.button
                                                key={room.id}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                                onClick={() => handleJoinRoom(room.id)}
                                                className="w-full p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-left group"
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className="font-bold text-slate-900">
                                                        {(room as any).name && (room as any).name !== `Room ${room.id}` ? (
                                                            (room as any).name
                                                        ) : (
                                                            `ROOM ${room.id}`
                                                        )}
                                                    </div>
                                                    <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded">
                                                        #{room.id}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${room.phase === 'LOBBY' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                                        {room.phase}
                                                    </div>
                                                    <div className="w-px h-2 bg-slate-200" />
                                                    <div>{room.playerCount} PLAYERS</div>
                                                </div>
                                            </motion.button>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )
                        }
                    </AnimatePresence >
                </div >

                {/* Rankings Modal */}
                <AnimatePresence>
                    {showRankings && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowRankings(false)}
                                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                            />

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="fixed inset-0 flex items-center justify-center z-[51] pointer-events-none p-4"
                            >
                                <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto pointer-events-auto">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-slate-900">🏆 Top Players</h2>
                                        <button
                                            onClick={() => setShowRankings(false)}
                                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-600 font-bold"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {rankings.length === 0 ? (
                                        <div className="py-12 text-center text-slate-400">
                                            まだランキングデータがありません
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {rankings.map((player, idx) => (
                                                <div
                                                    key={player.id}
                                                    className="p-4 bg-slate-50 rounded-xl flex items-center gap-3"
                                                >
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                                                            idx === 1 ? 'bg-slate-300 text-slate-700' :
                                                                idx === 2 ? 'bg-orange-400 text-orange-900' :
                                                                    'bg-slate-200 text-slate-600'
                                                        }`}>
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-slate-900 truncate">{player.name}</div>
                                                        <div className="text-xs text-slate-500 font-mono">
                                                            {player.matches}戦 {player.wins}勝
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="font-bold text-2xl text-slate-900">{player.rate}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold">RATE</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                <div className="mt-24 text-slate-300 text-[10px] font-bold tracking-widest text-center">
                    RATE BABA
                    <br />
                    SATO TAKUMI
                </div>
                <div className="mt-4 flex justify-center">
                    <a
                        href="https://s-t.work"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gap-2 text-slate-400 text-[10px] font-bold tracking-widest hover:text-slate-100 transition-colors"
                    >
                        <img
                            src="/icon_716^2.png"
                            alt="S-T.WORK Icon"
                            className="w-10 h-10 rounded-full mb-2 mx-auto block"
                        />

                        S-T.WORK
                    </a>
                </div>
            </div >
        </main >
    );
}
