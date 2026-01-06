'use client';

import { motion } from "framer-motion";

type Props = {
    name: string;
    rate: number;
    rank?: number | null;
    onClick?: () => void;
};

export function PlayerHUD({ name, rate, rank, onClick, isMyTurn }: Props & { isMyTurn?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed bottom-40 left-8 z-30 flex flex-col gap-2 cursor-pointer group select-none"
            onClick={onClick}
        >
            <div className="glass-panel pl-2 pr-6 py-2 rounded-full flex items-center gap-3 bg-white/90 group-hover:scale-105 transition-transform backdrop-blur-xl border border-white/50 shadow-2xl relative">

                {/* Avatar Wrapper for correct timer positioning */}
                <div className="relative w-10 h-10">
                    {/* Timer Circle */}
                    {isMyTurn && (
                        <div className="absolute -inset-[6px] pointer-events-none z-0">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <motion.circle
                                    cx="18" cy="18" r="17"
                                    fill="none"
                                    stroke="#3b82f6" // Blue-500
                                    strokeWidth="2"
                                    initial={{ pathLength: 1 }}
                                    animate={{ pathLength: 0 }}
                                    transition={{ duration: 30, ease: "linear" }}
                                    className="opacity-100"
                                />
                            </svg>
                        </div>
                    )}

                    {/* Avatar/Rank Circle */}
                    <div className="absolute inset-0 w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-md z-10">
                        {rank ? `#${rank}` : name.substring(0, 1).toUpperCase()}
                    </div>
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
