import { motion } from "framer-motion";

export interface RankingPlayer {
    id: string;
    name: string;
    rate: number;
    matches: number;
    wins: number;
}

interface RankingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    rankings: RankingPlayer[];
}

export function RankingsModal({ isOpen, onClose, rankings }: RankingsModalProps) {
    if (!isOpen) return null;

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
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
                            onClick={onClose}
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
    );
}
