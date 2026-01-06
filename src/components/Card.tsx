'use client';

import { Suit } from "@/types/game";
import { clsx } from "clsx";
import { motion } from "framer-motion";

type CardProps = {
    id?: string;
    suit?: Suit;
    number?: number;
    isFaceDown?: boolean;
    onClick?: () => void;
    className?: string;
    selected?: boolean;
    hoverable?: boolean;
    width?: number; // Base width
    disabled?: boolean;
};

export function Card({
    id,
    suit,
    number,
    isFaceDown = false,
    onClick,
    className,
    selected,
    hoverable = true,
    width = 120,
    disabled = false,
    isHighlighted = false
}: CardProps & { isHighlighted?: boolean }) {
    const height = width * 1.5; // Slightly taller aspect ratio typical of modern UI cards

    const isRed = suit === 'heart' || suit === 'diamond';
    const suitIcon = {
        spade: '♠',
        heart: '♥',
        diamond: '♦',
        club: '♣',
        joker: '★'
    }[suit || 'spade'];

    const displayNum = number === 0 ? '' :
        number === 1 ? 'A' :
            number === 11 ? 'J' :
                number === 12 ? 'Q' :
                    number === 13 ? 'K' : number;

    return (
        <motion.div
            layoutId={id ? `card-${id}` : undefined}
            initial={false}
            animate={{
                rotateY: isFaceDown ? 180 : 0,
                y: selected ? -40 : 0,
                scale: selected ? 1.05 : 1,
                z: selected ? 50 : 0
            }}
            whileHover={hoverable && !disabled ? { y: -20, boxShadow: "0 20px 30px rgba(0,0,0,0.15)" } : {}}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={clsx(
                "relative preserve-3d cursor-pointer select-none rounded-[16px]", // 16px radius
                disabled && "cursor-not-allowed opacity-80",
                className
            )}
            style={{ width, height }}
            onClick={!disabled ? onClick : undefined}
        >
            {/* FRONT */}
            <div
                className={clsx(
                    "absolute inset-0 backface-hidden bg-white rounded-[16px] overflow-hidden flex flex-col justify-between p-4",
                    "shadow-xl border border-slate-100"
                )}
            >
                {/* Corner */}
                <div className="flex flex-col items-center self-start leading-none">
                    <span className={clsx("font-bold text-xl", isRed ? "text-rose-500" : "text-slate-700")}>
                        {displayNum}
                    </span>
                    <span className={clsx("text-lg", isRed ? "text-rose-500" : "text-slate-500")}>{suitIcon}</span>
                </div>

                {/* Center */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {number === 0 ? (
                        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">JOKER</div>
                    ) : (
                        <span className={clsx("text-5xl opacity-10", isRed ? "text-rose-500" : "text-slate-800")}>
                            {suitIcon}
                        </span>
                    )}
                </div>

                {/* Bottom Corner */}
                <div className="flex flex-col items-center self-end transform rotate-180 leading-none">
                    <span className={clsx("font-bold text-xl", isRed ? "text-rose-500" : "text-slate-700")}>
                        {displayNum}
                    </span>
                    <span className={clsx("text-lg", isRed ? "text-rose-500" : "text-slate-500")}>{suitIcon}</span>
                </div>
            </div>

            {/* BACK - Rich Design */}
            <div
                className={clsx(
                    "absolute inset-0 backface-hidden rotate-y-180 rounded-[16px] overflow-hidden",
                    "shadow-xl border-4 border-white" // White border for classic look
                )}
                style={{
                    backgroundColor: '#1e3a8a', // Deep Indigo
                    backgroundImage: `
                        radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 60%),
                        repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 10px),
                        repeating-linear-gradient(-45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 10px)
                    `
                }}
            >
                <div className="absolute inset-0 flex items-center justify-center">
                    {/* Center Emblem */}
                    <div className="w-16 h-24 border-2 border-white/30 rounded-lg flex items-center justify-center bg-white/10 backdrop-blur-sm">
                        <div className="text-white/80 font-serif font-bold tracking-widest text-lg"></div>
                    </div>
                </div>
            </div>

            {/* HIGHLIGHT OVERLAY - Applied on top of everything (z-index managed by stacking context if needed, but absolute inset-0 works) */}
            {isHighlighted && (
                <div
                    className="absolute inset-0 bg-yellow-400/40 rounded-[16px] z-50 pointer-events-none animate-pulse"
                    style={{ boxShadow: "0 0 20px rgba(250, 204, 21, 0.5)" }}
                />
            )}
        </motion.div>
    );
}
