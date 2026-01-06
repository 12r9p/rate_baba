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
    disabled = false
}: CardProps) {
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

            {/* BACK */}
            <div
                className={clsx(
                    "absolute inset-0 backface-hidden rotate-y-180 rounded-[16px] overflow-hidden",
                    "bg-slate-800 shadow-xl border border-slate-700"
                )}
            >
                <div className="w-full h-full opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white/30 font-bold tracking-widest text-xs border border-white/20 px-2 py-1 rounded">R-B</div>
                </div>
            </div>
        </motion.div>
    );
}
