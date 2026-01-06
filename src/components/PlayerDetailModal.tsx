'use client';

import { motion } from "framer-motion";
import { Player } from "@/types/game";

type Props = {
    player: Player;
    onClose: () => void;
};

export function PlayerDetailModal({ player, onClose }: Props) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full relative overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Decorative Header */}
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-slate-900 to-slate-800" />

                <div className="relative z-10 flex flex-col items-center -mt-4">
                    <div className="w-20 h-20 rounded-full border-4 border-white bg-slate-200 shadow-lg flex items-center justify-center text-2xl font-bold text-slate-700 mb-4">
                        {player.name.substring(0, 2).toUpperCase()}
                    </div>

                    <h2 className="text-2xl font-black text-slate-800">{player.name}</h2>
                    <div className="text-sm text-slate-500 font-bold mb-6">PLAYER PROFILE</div>

                    <div className="w-full grid grid-cols-2 gap-4">
                        <div className="flex flex-col items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <span className="text-xs font-bold text-slate-400 uppercase">Rate</span>
                            <span className="text-2xl font-black text-indigo-600">{player.rate}</span>
                        </div>
                        <div className="flex flex-col items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <span className="text-xs font-bold text-slate-400 uppercase">Rank</span>
                            <span className="text-2xl font-black text-orange-500">{player.rank || '-'}</span>
                        </div>
                        <div className="flex flex-col items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <span className="text-xs font-bold text-slate-400 uppercase">Cards</span>
                            <span className="text-xl font-bold text-slate-700">{player.hand.length}</span>
                        </div>
                        <div className="flex flex-col items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <span className="text-xs font-bold text-slate-400 uppercase">History</span>
                            <span className="text-xl font-bold text-slate-700">--</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
