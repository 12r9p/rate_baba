'use client';

import { useGame } from "@/hooks/useGame";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatBox } from "../ChatBox";
import { QRCodeModal } from "../QRCodeModal";
import { ConfirmDialog } from "../ConfirmDialog";

interface RoomLobbyProps {
    roomId: string;
}

export function RoomLobby({ roomId }: RoomLobbyProps) {
    const [hasName, setHasName] = useState(false);
    const [inputName, setInputName] = useState("");

    useEffect(() => {
        const stored = localStorage.getItem('babanuki_player_name');
        if (stored) {
            setHasName(true);
        }
    }, []);

    const { gameState, loading, myPlayer, myPlayerId, startGame, sendMessage, kickPlayer, addBot } = useGame(roomId, { enabled: hasName });
    const [showQRCode, setShowQRCode] = useState(false);

    // CPU Name State
    const [botName, setBotName] = useState("");

    // Confirm Dialog State
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
    } | null>(null);

    const handleAddBot = () => {
        addBot(botName);
        setBotName("");
    };




    useEffect(() => {
        if (gameState?.phase === 'PLAYING') {
            window.location.href = `/room/${roomId}/play`;
        }
    }, [gameState?.phase, roomId]);

    // Auto-redirect if kicked
    useEffect(() => {
        if (!loading && gameState && myPlayerId && !gameState.players.find(p => p.id === myPlayerId)) {
            setConfirmDialog({
                isOpen: true,
                title: "退出されました",
                message: "ルームから退出させられました。"
            });
        }
    }, [gameState?.players, myPlayerId, loading]);

    const handleSetName = () => {
        if (!inputName.trim()) return;
        localStorage.setItem('babanuki_player_name', inputName);
        setHasName(true);
    };

    if (!hasName) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm text-center"
                >
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Welcome!</h2>
                    <p className="text-slate-500 mb-6 text-sm">Please enter your name to join Room {roomId}</p>

                    <div className="relative mb-4 text-left">
                        <label className="text-[10px] font-bold text-slate-400 tracking-wider ml-4 mb-1 block">YOUR NAME</label>
                        <input
                            type="text"
                            value={inputName}
                            onChange={(e) => setInputName(e.target.value)}
                            maxLength={10}
                            className="w-full bg-slate-100 border-none text-lg font-bold py-3 px-4 rounded-xl focus:ring-4 focus:ring-slate-200 focus:bg-white transition-all text-slate-800"
                            placeholder="Enter name..."
                        />
                    </div>

                    <button
                        onClick={handleSetName}
                        disabled={!inputName.trim()}
                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all"
                    >
                        JOIN ROOM
                    </button>

                    <div className="mt-4">
                        <a href="/" className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">← Back to Home</a>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (loading || !gameState) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-mono animate-pulse">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                    <span className="text-slate-400 tracking-widest text-xs">CONNECTING TO LOBBY {roomId}...</span>
                </div>
            </div>
        );
    }

    const isOwner = gameState.ownerId === myPlayerId;
    // Base URL for sharing is current location (which should be /room/[roomId])
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    return (
        <div className="fixed inset-0 overflow-y-auto bg-slate-50 scroll-smooth">
            <div className="min-h-full w-full flex flex-col items-center justify-center p-8 relative">
                {/* Ambient BG */}
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-200/20 blur-[150px] rounded-full pointer-events-none" />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white/80 backdrop-blur-xl border border-white p-10 rounded-3xl shadow-xl w-full max-w-md text-center relative z-10 my-auto"
                >
                    <div className="absolute top-6 left-6 group">
                        <motion.button
                            whileHover={{ scale: 1.1, x: -3 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => window.location.href = "/"}
                            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors shadow-sm cursor-pointer"
                        >
                            ←
                        </motion.button>
                        <span className="absolute left-12 top-2 text-[10px] font-bold text-slate-300 pointer-events-none tracking-widest pl-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">HOME</span>
                    </div>

                    <div className="mb-2 text-4xl">🃏</div>

                    {/* Room ID Display */}
                    <div className="text-sm font-bold text-slate-400 tracking-widest mb-1">
                        ROOM ID: <span className="text-slate-800 font-mono text-base">{roomId}</span>
                    </div>

                    <p className="text-slate-500 mb-8 font-medium">Lobby - Waiting for players...</p>

                    <div className="space-y-3 mb-8">
                        {gameState.players.map(p => (
                            <motion.div
                                key={p.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl relative"
                            >
                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
                                <span className="font-bold text-slate-700 tracking-wide flex items-center gap-2">
                                    {p.name}
                                </span>

                                {p.id === myPlayerId && <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded ml-auto">YOU</span>}
                                {p.isBot && <span className="text-[10px] font-bold bg-indigo-100 text-indigo-500 px-2 py-1 rounded ml-2">BOT</span>}

                                {p.id !== myPlayerId && (
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => { kickPlayer(p.id); }}
                                        className="ml-auto w-6 h-6 rounded-full bg-red-50 text-red-300 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors absolute right-2"
                                        title="Kick Player"
                                    >
                                        ✕
                                    </motion.button>
                                )}
                            </motion.div>
                        ))}
                        {gameState.players.length === 0 && (
                            <div className="text-slate-400 italic pb-4">No players yet</div>
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={startGame}
                            disabled={gameState.players.length < 2}
                            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl"
                        >
                            START GAME
                        </button>

                        {/* CPU Add Section */}
                        {gameState.phase === 'LOBBY' && (
                            <div className="flex gap-2 bg-slate-100 p-2 rounded-xl">
                                <input
                                    className="flex-1 bg-white rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none border border-slate-200 focus:border-indigo-400 transition-colors"
                                    placeholder="CPU Name (Optional)"
                                    value={botName}
                                    onChange={(e) => setBotName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddBot()}
                                />
                                <button
                                    onClick={handleAddBot}
                                    className="bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-indigo-600 transition-colors shadow-sm whitespace-nowrap"
                                >
                                    + ADD CPU
                                </button>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowQRCode(true)}
                                className="flex-1 bg-white hover:bg-slate-50 text-slate-600 py-3 rounded-xl font-bold text-xs border border-slate-200 transition-colors shadow-sm"
                            >
                                📱 INVITE QR
                            </button>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(shareUrl);
                                    // Browser provides native clipboard feedback
                                }}
                                className="flex-1 bg-white hover:bg-slate-50 text-slate-600 py-3 rounded-xl font-bold text-xs border border-slate-200 transition-colors shadow-sm"
                            >
                                🔗 COPY LINK
                            </button>
                        </div>
                    </div>
                </motion.div>

                <ChatBox
                    messages={gameState.messages}
                    onSend={sendMessage}
                    myPlayerId={myPlayerId ?? undefined}
                />
            </div>

            <AnimatePresence>
                {showQRCode && (
                    <QRCodeModal
                        url={shareUrl}
                        onClose={() => setShowQRCode(false)}
                    />
                )}
            </AnimatePresence>

            {/* Confirm Dialog */}
            {confirmDialog && (
                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    confirmText="OK"
                    cancelText=""
                    onConfirm={() => {
                        window.location.href = "/";
                        setConfirmDialog(null);
                    }}
                    onCancel={() => setConfirmDialog(null)}
                />
            )}
        </div>
    );
}
