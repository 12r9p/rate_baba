'use client';

import { clsx } from "clsx";
import { motion } from "framer-motion";

type Props = {
    name: string;
    rank?: number | null;
    rate?: number;
    isCurrentTurn: boolean;
    cardsCount: number;
    className?: string;
};

export function PlayerAvatar({ name, rank, rate, isCurrentTurn, cardsCount, className }: Props) {
    return (
        <motion.div
            initial={false}
            animate={{ scale: isCurrentTurn ? 1.05 : 1 }}
            className={clsx(
                "glass-panel rounded-2xl p-4 flex flex-col items-center gap-2 min-w-[100px] relative transition-colors duration-500",
                isCurrentTurn ? "bg-white/90 border-blue-400 ring-4 ring-blue-100" : "bg-white/60",
                className
            )}
        >
            {/* Rank Badge */}
            {rank && (
                <div className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold rounded-full shadow-lg text-sm">
                    {rank}
                </div>
            )}

            {/* Avatar Circle */}
            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg shadow-inner">
                {name.substring(0, 2).toUpperCase()}
            </div>

            <div className="text-center">
                <div className="font-bold text-slate-800 text-sm">{name}</div>
                <div className="text-xs text-slate-500 font-mono mt-1">
                    Rate: {rate}
                </div>
            </div>

            {/* Cards Count Pill */}
            <div className="mt-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600 shadow-sm border border-slate-200">
                {cardsCount} Cards
            </div>
        </motion.div>
    );
}
