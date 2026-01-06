'use client';

import { motion } from "framer-motion";

type Props = {
    name: string;
    rate: number;
    rank?: number | null;
    onClick?: () => void;
};

export function PlayerHUD({ name, rate, rank, onClick }: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed bottom-64 left-8 z-30 flex flex-col gap-2 cursor-pointer group select-none"
            onClick={onClick}
        >
            <div className="glass-panel px-6 py-4 rounded-3xl flex items-center gap-4 bg-white/80 group-hover:scale-105 transition-transform backdrop-blur-xl border border-white/50 shadow-2xl">
                {/* Rank or Avatar Icon */}
                <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                    {rank ? `#${rank}` : name.substring(0, 2).toUpperCase()}
                </div>

                <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Current Rate</span>
                    <div className="text-3xl font-black text-slate-800 leading-none tabular-nums tracking-tight">
                        {rate.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Name Tag */}
            <div className="glass-panel px-4 py-1 rounded-full self-start bg-slate-900/10 backdrop-blur-md">
                <span className="text-xs font-bold text-slate-700">{name}</span>
            </div>
        </motion.div>
    );
}
