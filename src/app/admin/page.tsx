'use client';

import { useGame } from "@/hooks/useGame";
import { useState } from "react";

export default function AdminPage() {
    const { gameState, startGame, resetGame, refresh } = useGame();
    const [loading, setLoading] = useState(false);

    if (!gameState) return <div className="p-8">Loading Game State...</div>;

    const handleAction = async (action: () => Promise<any>) => {
        setLoading(true);
        await action();
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <h1 className="text-3xl font-bold text-slate-900 border-l-8 border-yellow-500 pl-4">Admin Console</h1>
                    <div className="flex gap-4 items-center">
                        <div className="text-sm text-slate-500">
                            State: <span className="font-mono bg-slate-200 px-2 py-1 rounded text-slate-800">{gameState.phase}</span>
                        </div>
                        <button onClick={() => refresh()} className="text-sm text-blue-600 hover:underline">Refresh</button>
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
                                        onClick={() => handleAction(startGame)}
                                        disabled={loading || gameState.players.length < 2}
                                        className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 shadow-lg shadow-green-500/20"
                                    >
                                        START GAME
                                    </button>
                                )}

                                {gameState.phase === 'FINISHED' && (
                                    <button
                                        onClick={() => handleAction(() => resetGame(false))}
                                        disabled={loading}
                                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                                    >
                                        NEXT ROUND (Keep Rates)
                                    </button>
                                )}

                                {gameState.phase === 'PLAYING' && (
                                    <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                                        <div className="text-xs font-bold text-yellow-800 uppercase mb-2">Current Turn</div>
                                        <div className="text-lg font-medium text-yellow-900 mb-4">
                                            {gameState.players.find(p => p.id === gameState.currentTurnPlayerId)?.name || "Unknown"}
                                        </div>
                                        <button
                                            onClick={async () => {
                                                // Force Play Logic
                                                const currentPlayer = gameState.players.find(p => p.id === gameState.currentTurnPlayerId);
                                                if (!currentPlayer) return;
                                                const opponents = gameState.players.filter(p => p.id !== currentPlayer.id && p.hand.length > 0);
                                                if (opponents.length === 0) return;
                                                const randomTarget = opponents[Math.floor(Math.random() * opponents.length)];

                                                await fetch('/api/game/draw', {
                                                    method: 'POST',
                                                    body: JSON.stringify({
                                                        playerId: currentPlayer.id,
                                                        targetPlayerId: randomTarget.id
                                                    }),
                                                });
                                                refresh();
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
                                    if (confirm("Reset EVERYTHING? Rates will be lost.")) {
                                        resetGame(true);
                                    }
                                }}
                                className="w-full py-2 border-2 border-red-600 text-red-600 rounded-lg font-bold hover:bg-red-50"
                            >
                                System Reset
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
                                    {gameState.players.map(p => (
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
                                            <td className="p-4 text-center">{p.hand.length}</td>
                                            <td className="p-4 text-right opacity-50 text-xs font-mono">
                                                {p.rateHistory.join(' → ')}
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
        </div>
    );
}
