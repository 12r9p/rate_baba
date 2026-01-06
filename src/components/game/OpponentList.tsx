'use client';

import { useRef, useEffect, memo } from "react";
import { motion } from "framer-motion";
import { OpponentArea } from "@/components/OpponentArea";
import { Player } from "@/types/game";
import { clsx } from "clsx";

interface OpponentListProps {
    others: Player[];
    currentTurnPlayerId: string | null;
    targetPlayerId: string | null;
    isMyTurn: boolean;
    setFocusTargetId: (id: string) => void;
    setDetailPlayer: (player: Player) => void;
    timerProgress: number;
}

export const OpponentList = memo(function OpponentList({
    others, currentTurnPlayerId, targetPlayerId, isMyTurn, setFocusTargetId, setDetailPlayer, timerProgress
}: OpponentListProps) {
    const opponentRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // Auto-scroll logic for turn changes
    useEffect(() => {
        if (currentTurnPlayerId) {
            const el = opponentRefs.current.get(currentTurnPlayerId);
            if (el) {
                // Smooth scroll to center
                el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
    }, [currentTurnPlayerId]);


    return (
        <div className="absolute top-4 left-0 w-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth px-8 py-20 hide-scrollbar items-start pointer-events-auto">
            <div className="flex gap-8 min-w-max mx-auto px-16">
                {others.map((p) => {
                    const isTurn = currentTurnPlayerId === p.id;
                    const isTarget = targetPlayerId === p.id;
                    const canDraw = Boolean(isMyTurn && isTarget && p.hand.length > 0);

                    // Dynamic spacing
                    const dynamicMinWidth = Math.max(100, 50 + p.hand.length * 30);

                    // If drawing, we render in Portal. Here we render a placeholder to maintain layout.
                    if (canDraw) {
                        return (
                            <div
                                key={p.id}
                                ref={(el: HTMLDivElement | null) => {
                                    if (el) opponentRefs.current.set(p.id, el);
                                    else opponentRefs.current.delete(p.id);
                                }}
                                className="snap-center flex justify-center shrink-0 transition-all duration-300"
                                style={{ minWidth: dynamicMinWidth, height: 300 }}
                            />
                        );
                    }

                    // Normal Opponent Render in List
                    return (
                        <div
                            key={p.id}
                            ref={(el: HTMLDivElement | null) => {
                                if (el) opponentRefs.current.set(p.id, el);
                                else opponentRefs.current.delete(p.id);
                            }}
                            className="pointer-events-auto relative transition-all duration-300 snap-center flex justify-center z-20"
                            style={{ minWidth: dynamicMinWidth }}
                        >
                            <motion.div layoutId={`opponent-${p.id}`} className="w-full flex justify-center">
                                <OpponentArea
                                    player={p}
                                    isTurn={isTurn}
                                    canDraw={false} // List view is never interactive for draw
                                    isFocused={false} // List view never focused in new decoupled mode? Or maybe controlled by parent if needed.
                                    onSelect={() => setFocusTargetId(p.id)}
                                    onDetail={() => setDetailPlayer(p)}
                                    onDraw={() => { }} // No draw in list
                                    timerProgress={isTurn ? timerProgress : undefined}
                                />
                            </motion.div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
