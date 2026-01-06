'use client';

import { useGame } from "@/hooks/useGame";
import { useState } from "react";
import { DiscardAnimation } from "@/components/DiscardAnimation";
import { Player } from "@/types/game";

export default function AdminPage() {
    // Admin needs to connect to a specific room to control it.
    const [roomId, setRoomId] = useState("");
    const [connected, setConnected] = useState(false);

    // Use useGame with selected roomId
    // If not connected, pass undefined to avoid connection hook auto-starting?
    // Actually useGame hook connects if roomId is present.
    const shouldConnect = connected && roomId !== "";
    const { gameState, startGame, resetGame, refresh, adminDraw, loading: gameLoading } = useGame(shouldConnect ? roomId : undefined, { isSpectator: true });

    const [actionLoading, setActionLoading] = useState(false);

    const handleAction = (action: () => void) => {
        setActionLoading(true);
        action();
        setTimeout(() => setActionLoading(false), 500);
    };

    if (!connected) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-100">
                <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                    <h1 className="text-2xl font-bold mb-4">Admin Console</h1>
                    <input
                        className="w-full px-4 py-2 border rounded mb-4"
                        placeholder="Enter Room ID to Manage"
                        value={roomId}
                        onChange={e => setRoomId(e.target.value)}
                    />
                    <button
                        onClick={() => setConnected(true)}
                        className="w-full bg-slate-800 text-white py-2 rounded font-bold"
                        disabled={!roomId}
                    >
                        Connect
                    </button>
                </div>
            </div>
        );
    }

    if (gameLoading || !gameState) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-100">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <p>Connecting to {roomId}...</p>
                <button onClick={() => setConnected(false)} className="mt-4 text-blue-500 underline">Cancel</button>
            </div>
        );
    }

    return (
        <div className="h-screen overflow-y-auto bg-slate-50 text-slate-800 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 border-l-8 border-yellow-500 pl-4">Admin Console</h1>
                        <p className="text-slate-400 text-sm ml-6">Room: {roomId}</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="text-sm text-slate-500">
                            State: <span className="font-mono bg-slate-200 px-2 py-1 rounded text-slate-800">{gameState.phase}</span>
                        </div>
                        <button onClick={() => setConnected(false)} className="text-sm text-red-600 hover:underline">Disconnect</button>
                    </div>
                </header>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Controls */}
                    <div className="lg:col-span-1 space-y-6">
                        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                🕹 Game Controls
                            </h2>
                            <div className="space-y-3">
                                {gameState.phase === 'LOBBY' && (
                                    <button
                                        onClick={() => handleAction(() => startGame && startGame())}
                                        disabled={actionLoading || gameState.players.length < 2}
                                        className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 shadow-lg shadow-green-500/20"
                                    >
                                        START GAME
                                    </button>
                                )}

                                {gameState.phase === 'FINISHED' && (
                                    <button
                                        onClick={() => handleAction(() => resetGame && resetGame(false))}
                                        disabled={actionLoading}
                                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                                    >
                                        NEXT ROUND (Keep Rates)
                                    </button>
                                )}

                                {gameState.phase === 'PLAYING' && (
                                    <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                                        <div className="text-xs font-bold text-yellow-800 uppercase mb-2">Current Turn</div>
                                        <div className="text-lg font-medium text-yellow-900 mb-4">
                                            {gameState.players.find((p: Player) => p.id === gameState.currentTurnPlayerId)?.name || "Unknown"}
                                        </div>
                                        <button
                                            onClick={async () => {
                                                // Force Play Logic
                                                const currentPlayer = gameState.players.find((p: Player) => p.id === gameState.currentTurnPlayerId);
                                                if (!currentPlayer) return;

                                                const targetId = gameState.targetPlayerId;
                                                const targetPlayer = gameState.players.find((p: Player) => p.id === targetId);

                                                if (!targetPlayer || targetPlayer.hand.length === 0) {
                                                    console.error("No valid target found.");
                                                    return;
                                                }

                                                // Pick random card
                                                const randIdx = Math.floor(Math.random() * targetPlayer.hand.length);

                                                handleAction(() => {
                                                    if (adminDraw) adminDraw(currentPlayer.id, targetPlayer.id, randIdx);
                                                });
                                            }}
                                            className="w-full py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                                        >
                                            Force Random Move
                                        </button>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
                            <h2 className="text-lg font-bold mb-4 text-red-600 flex items-center gap-2">
                                ⚠️ Danger Zone
                            </h2>
                            <button
                                onClick={() => {
                                    // Removed confirm popup as requested.
                                    if (resetGame) resetGame(true);
                                }}
                                className="w-full py-2 border-2 border-red-600 text-red-600 rounded-lg font-bold hover:bg-red-50"
                            >
                                System Reset (No Confirm)
                            </button>
                        </section>
                    </div>

                    {/* Player List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 font-bold text-slate-500 text-sm uppercase">Player</th>
                                        <th className="p-4 font-bold text-slate-500 text-sm uppercase text-right">Rate</th>
                                        <th className="p-4 font-bold text-slate-500 text-sm uppercase text-center">Rank</th>
                                        <th className="p-4 font-bold text-slate-500 text-sm uppercase text-center">Hand</th>
                                        <th className="p-4 font-bold text-slate-500 text-sm uppercase text-right">History</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {gameState.players.map((p: Player) => (
                                        <tr key={p.id} className="hover:bg-slate-50">
                                            <td className="p-4 font-medium">{p.name}</td>
                                            <td className="p-4 font-mono font-bold text-right text-indigo-600">{p.rate}</td>
                                            <td className="p-4 text-center">
                                                {p.rank ? (
                                                    <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-bold text-xs">
                                                        #{p.rank}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="p-4 text-center">{p.hand?.length || 0}</td>
                                            <td className="p-4 text-right opacity-50 text-xs font-mono">
                                                {p.rateHistory?.join(' → ') || ''}
                                            </td>
                                        </tr>
                                    ))}
                                    {gameState.players.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                                                No players yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>


            </div>

            {/* Global Animations */}
            {gameState.lastDiscard && (
                <DiscardAnimation
                    lastDiscard={gameState.lastDiscard}
                    myPlayerId={undefined}
                />
            )}
        </div>
    );
}
