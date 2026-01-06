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
            className="fixed bottom-40 left-8 z-30 flex flex-col gap-2 cursor-pointer group select-none"
            onClick={onClick}
        >
            <div className="glass-panel pl-2 pr-6 py-2 rounded-full flex items-center gap-3 bg-white/90 group-hover:scale-105 transition-transform backdrop-blur-xl border border-white/50 shadow-2xl">
                {/* Avatar/Rank Circle */}
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-md">
                    {rank ? `#${rank}` : name.substring(0, 1).toUpperCase()}
                </div>

                <div className="flex flex-col h-full justify-center">
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-slate-800">{name}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rating</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800 leading-none tabular-nums tracking-tight">
                        {rate.toLocaleString()}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
