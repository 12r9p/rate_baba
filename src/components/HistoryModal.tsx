'use client';

import { motion } from "framer-motion";
import { Player, GameResult } from "@/types/game";
import { clsx } from "clsx";

interface HistoryModalProps {
    players: Player[];
    history: GameResult[];
    onClose: () => void;
}

export function HistoryModal({ players, history, onClose }: HistoryModalProps) {
    // 1. Collect all unique player names from both current players and history
    const allNames = Array.from(new Set([
        ...players.map(p => p.name),
        ...history.flatMap(h => h.standings.map(s => s.name))
    ])).sort();

    // 2. Identify Rounds
    const rounds = history.map(h => h.round);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <span>📜</span> GAME HISTORY
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 transition-colors">
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-0">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider border-b border-r border-slate-200 min-w-[120px]">
                                    Player
                                </th>
                                {rounds.map(r => (
                                    <th key={r} className="p-3 font-bold text-slate-500 text-xs text-center border-b border-slate-200 min-w-[60px]">
                                        Game {r}
                                    </th>
                                ))}
                                <th className="p-4 font-bold text-slate-800 text-xs uppercase tracking-wider text-right border-b border-l border-slate-200 min-w-[100px] bg-slate-100">
                                    Session Total
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {allNames.map(name => {
                                // Calculate Session Total from history
                                const sessionTotal = history.reduce((acc, h) => {
                                    const s = h.standings.find(s => s.name === name);
                                    return acc + (s ? s.diff : 0);
                                }, 0);

                                return (
                                    <tr key={name} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-bold text-slate-700 border-r border-slate-100 sticky left-0 bg-white">
                                            {name}
                                        </td>
                                        {history.map(h => {
                                            const standing = h.standings.find(s => s.name === name);
                                            const diff = standing ? standing.diff : null;

                                            return (
                                                <td key={h.round} className="p-3 text-center border-slate-100">
                                                    {diff !== null ? (
                                                        <span className={clsx(
                                                            "font-mono font-bold px-2 py-1 rounded text-sm",
                                                            diff > 0 ? "text-green-600 bg-green-50" :
                                                                diff < 0 ? "text-red-600 bg-red-50" : "text-slate-400"
                                                        )}>
                                                            {diff > 0 ? `+${diff}` : diff}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className="p-4 text-right border-l border-slate-100 bg-slate-50/50">
                                            <span className={clsx(
                                                "font-mono text-lg font-black",
                                                sessionTotal > 0 ? "text-indigo-600" :
                                                    sessionTotal < 0 ? "text-red-600" : "text-slate-400"
                                            )}>
                                                {sessionTotal > 0 ? `+${sessionTotal}` : sessionTotal}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {history.length === 0 && (
                        <div className="p-12 text-center text-slate-400 italic">
                            No games played yet.
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
