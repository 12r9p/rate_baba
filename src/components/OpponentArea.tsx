'use client';

import { Player } from "@/types/game";
import { PlayerAvatar } from "./PlayerAvatar";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { memo, useEffect, useState } from "react";
import { Card } from "./Card";

// Ease-in-out curve
export const EASE_ANIMATION = { duration: 0.8, ease: [0.42, 0, 0.58, 1] as const }; // cubic-bezier for ease-in-out

interface OpponentAreaProps {
    player: Player;
    isTurn: boolean;
    canDraw: boolean;
    isFocused: boolean;
    onSelect: () => void;
    onDetail: () => void;
    onDraw: (index: number) => void;
    showFaceUp?: boolean;
    timerProgress?: number;
}

export const OpponentArea = memo(function OpponentArea({
    player, isTurn, canDraw, isFocused, onSelect, onDetail, onDraw, showFaceUp = false, timerProgress
}: OpponentAreaProps) {
    // Add window width tracking for responsive spread
    const [windowWidth, setWindowWidth] = useState(1200);

    useEffect(() => {
        setWindowWidth(window.innerWidth);
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (isFocused || canDraw || isTurn) {
        console.log(`[DEBUG] OpponentArea(${player.name}) Render. isTurn:${isTurn} canDraw:${canDraw} isFocused:${isFocused}`);
    }
    return (
        <motion.div
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            animate={{
                scale: isTurn ? 1.05 : 1,
                y: isTurn ? (canDraw ? 0 : 0) : 20 // If canDraw (Center), no y offset needed
            }}
            className="flex flex-col items-center gap-6 relative"
        >
            <div className="font-bold text-sm text-slate-700 truncate max-w-[100px] text-center">{player.name}</div>
            <div
                className="relative z-20 cursor-pointer transition-all duration-500 rounded-full"
                onClick={onDetail}
            >
                <PlayerAvatar
                    name={player.name}
                    rate={player.rate}
                    rank={player.rank}
                    cardsCount={player.hand.length}
                    isCurrentTurn={isTurn}
                    timerProgress={timerProgress}
                />
            </div>

            {/* Resting Hand Row */}
            {player.hand.length > 0 && (
                <div
                    className={clsx(
                        "relative h-20 w-32 transition-all",
                        // Using 'canDraw' to control interactivity and distinct cursor
                        // Add strong drop-shadow glow to the CARDS area when active
                        canDraw ? "cursor-pointer drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" : "opacity-90"
                    )}
                    // Clicking the area selects/focuses the player (optional focus highlight)
                    onClick={() => canDraw && onSelect()}
                >
                    {player.hand.map((card, cIdx) => {
                        const total = player.hand.length;
                        const center = (total - 1) / 2;

                        // Interaction Logic
                        // When drawing (or focused), spread cards out
                        const isActive = canDraw || isFocused;

                        // Responsive Spread Calculation
                        // Uncapped width for God Mode to allow nice spacing
                        // Responsive Spread Calculation
                        // Uncapped width for God Mode to allow nice spacing
                        const availableWidth = showFaceUp ? 800 : (canDraw ? windowWidth - 100 : Math.min(600, windowWidth - 40));
                        // Allow wider spread for God Mode (35px) to reduce overlap
                        // Play Mode: 40px when active, 30px when compact (was 12px, too crowded)
                        // Center Mode (canDraw): 60px
                        const maxSpread = showFaceUp ? 35 : (isActive ? (canDraw ? 45 : 40) : 30); // Reduced canDraw spread from 60 to 45

                        const calculatedSpread = availableWidth / Math.max(1, total - 1);
                        const spread = Math.min(maxSpread, calculatedSpread);

                        const rot = canDraw ? 0 : (isActive ? (cIdx - center) * 1 : (cIdx - center) * 2);

                        const xOffset = (cIdx - center) * spread;
                        // Move down slightly when active to invite interaction
                        const yOffset = isActive ? (canDraw ? 10 : 40) : 0;

                        const isTeasing = card.isHighlighted;

                        return (
                            <motion.div
                                key={card.id}
                                initial={false}
                                className={clsx(
                                    "absolute top-0 will-change-transform flex items-center justify-center transition-colors duration-200",
                                    canDraw ? "cursor-pointer" : ""
                                )}
                                animate={{
                                    x: xOffset,
                                    y: isTeasing ? (canDraw ? -20 : 10) : yOffset,
                                    rotate: isTeasing ? 0 : rot,
                                    scale: canDraw ? 1.05 : 1, // Reduced scale from 1.3 to 1.05
                                    zIndex: cIdx
                                }}
                                whileHover={canDraw ? {
                                    zIndex: 100,
                                    scale: 1.1,
                                } : undefined}
                                style={{
                                    left: '50%',
                                    // Adjust center offset based on card width
                                    // FaceUp: 60px -> -30
                                    // FaceDown: 48px -> -24
                                    marginLeft: showFaceUp ? -30 : -24,
                                }}
                                transition={EASE_ANIMATION}
                                onClick={(e) => {
                                    if (canDraw) {
                                        e.stopPropagation();
                                        onDraw(cIdx);
                                    }
                                }}
                            >
                                <Card
                                    suit={card.suit}
                                    number={card.number}
                                    width={showFaceUp ? 60 : 48}
                                    isFaceDown={!showFaceUp}
                                    isHighlighted={isTeasing}
                                    hoverable={canDraw}
                                    className={clsx(
                                        "shadow-sm transition-all duration-200",
                                        // Hover effect for drawing
                                        canDraw && "hover:border-indigo-400 hover:shadow-indigo-500/50"
                                    )}
                                />
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {isTurn && (
                <motion.div
                    layoutId="turn-marker"
                    className="absolute -top-4 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                />
            )}
        </motion.div>
    );
});
