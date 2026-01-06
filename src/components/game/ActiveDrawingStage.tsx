'use client';

import { AnimatePresence, motion } from "framer-motion";
import { OpponentArea } from "@/components/OpponentArea";
import { Player } from "@/types/game";

interface ActiveDrawingStageProps {
    others: Player[];
    isDrawingPhase: boolean;
    isMyTurn: boolean;
    targetPlayerId: string | null;
    drawCard: (targetId: string, cardIndex: number) => void;
    setDetailPlayer: (player: Player) => void;
    setFocusTargetId: (id: string | null) => void;
}

export function ActiveDrawingStage({
    others, isDrawingPhase, isMyTurn, targetPlayerId, drawCard, setDetailPlayer, setFocusTargetId
}: ActiveDrawingStageProps) {

    return (
        <AnimatePresence>
            {isDrawingPhase && others.map(p => {
                const isTarget = targetPlayerId === p.id;
                const canDraw = Boolean(isMyTurn && isTarget && p.hand.length > 0);
                if (!canDraw) return null;

                return (
                    <div key={p.id} className="fixed top-[15%] left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex justify-center items-center">
                        {/* Spotlight Glow - Behind the player */}


                        {/* The Player Component - Morphs from list position */}
                        <motion.div
                            layoutId={`opponent-${p.id}`}
                            className="relative"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        >
                            <OpponentArea
                                player={p}
                                isTurn={true}
                                canDraw={true}
                                isFocused={true}
                                onSelect={() => { }}
                                onDetail={() => setDetailPlayer(p)}
                                onDraw={(cardIdx) => {
                                    drawCard(p.id, cardIdx);
                                    setFocusTargetId(null);
                                }}
                            />
                        </motion.div>
                    </div>
                );
            })}
        </AnimatePresence>
    );
}
