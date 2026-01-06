
import { GameState, Player } from "@/types/game";
import { useState } from "react";
import { motion } from "framer-motion";

type Props = {
    gameState: GameState;
    myPlayer: Player | undefined;
    joinGame: (name: string) => void;
    startGame: () => void;
    resetGame: (hard: boolean) => void;
    loading: boolean;
};

export function Lobby({ gameState, myPlayer, joinGame, startGame, resetGame, loading }: Props) {
    const [name, setName] = useState("");

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) joinGame(name);
    };

    if (!gameState) return null;

    return (
        <div className="flex flex-col items-center gap-8 z-10 w-full max-w-md p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel w-full p-8 rounded-3xl flex flex-col items-center gap-6"
            >
                <div className="text-center">
                    <div className="text-4xl mb-2">🃏</div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Rate Baba</h1>
                    <p className="text-slate-500 font-medium">High Stakes Old Maid</p>
                </div>

                {!myPlayer ? (
                    <form onSubmit={handleJoin} className="w-full flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Player Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
                                placeholder="Enter your name"
                                maxLength={10}
                                disabled={loading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!name.trim() || loading}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? "Joining..." : "Join Game"}
                        </button>
                    </form>
                ) : (
                    <div className="w-full flex flex-col gap-4">
                        <div className="bg-green-50 text-green-800 px-4 py-3 rounded-xl text-center font-bold border border-green-100 flex items-center justify-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Ready as {myPlayer.name}
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-bold text-center text-slate-400 uppercase">Players ({gameState.players.length})</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {gameState.players.map(p => (
                                    <span key={p.id} className="px-3 py-1 bg-slate-100 rounded-full text-sm font-medium text-slate-600">
                                        {p.name}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {gameState.players.length >= 2 ? (
                            <button
                                onClick={() => startGame()}
                                disabled={loading}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                Start Game <span className="opacity-50">→</span>
                            </button>
                        ) : (
                            <div className="text-center text-sm text-slate-400 py-2 animate-pulse">
                                Waiting for more players...
                            </div>
                        )}

                        <button
                            onClick={() => resetGame(true)}
                            className="text-xs text-slate-400 hover:text-red-500 transition-colors mt-4"
                        >
                            Reset Room
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
