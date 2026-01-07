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
    timerProgress?: number; // 0-100, percentage of time remaining
};

export function PlayerAvatar({ name, rank, rate, isCurrentTurn, cardsCount, className, timerProgress }: Props) {
    // Safe name handling
    const safeName = name || "Unknown";

    // Calculate circle dasharray for timer (circumference of circle with r=30)
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const safeProgress = Number.isFinite(timerProgress) ? timerProgress! : 0;
    const dashOffset = circumference * (1 - safeProgress / 100);

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

            {/* Avatar Circle with Timer */}
            <div className="relative">
                {/* Timer Circle (appears when it's player's turn) */}
                {isCurrentTurn && timerProgress !== undefined && (
                    <svg className="absolute -inset-2 w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                        {/* Background circle */}
                        <circle
                            cx="32"
                            cy="32"
                            r={radius}
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="3"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="32"
                            cy="32"
                            r={radius}
                            fill="none"
                            stroke={timerProgress > 30 ? "#3b82f6" : "#ef4444"}
                            strokeWidth="3"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-linear"
                        />
                    </svg>
                )}

                {/* Avatar Circle */}
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg shadow-inner relative z-10">
                    {safeName.substring(0, 2).toUpperCase()}
                </div>
            </div>

            <div className="text-center">
                <div className="font-bold text-slate-800 text-sm truncate max-w-[80px]">{safeName}</div>
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
