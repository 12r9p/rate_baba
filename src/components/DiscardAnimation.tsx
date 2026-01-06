
import { Card as CardType } from "@/types/game";
import { Card } from "./Card";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";

type Props = {
    lastDiscard: { playerId: string; cards: CardType[] } | null;
    myPlayerId: string | undefined;
};

export function DiscardAnimation({ lastDiscard, myPlayerId }: Props) {
    const [visibleDiscards, setVisibleDiscards] = useState<{ cards: CardType[], id: string, startY: string, startX: string }[]>([]);
    const processedDiscardIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (lastDiscard && lastDiscard.cards.length > 0) {
            // Generate a deterministic unique ID for this specific discard event
            // Using IDs of the cards themselves ensures we don't re-trigger on same state
            const cardIds = lastDiscard.cards.map(c => c.id).sort().join('-');
            const eventId = `${lastDiscard.playerId}-${cardIds}`;

            if (processedDiscardIds.current.has(eventId)) {
                return;
            }

            // Process New Discard
            processedDiscardIds.current.add(eventId);

            // Determine Start Position
            const isMe = lastDiscard.playerId === myPlayerId;
            // Me: Start from bottom center (Hand). Opponent: Start from top center.
            const startY = isMe ? "80vh" : "15vh";
            const startX = "50vw";

            const newDiscard = {
                cards: lastDiscard.cards,
                id: eventId,
                startY,
                startX
            };

            setVisibleDiscards(prev => [...prev, newDiscard]);

            // Cleanup after animation
            const timer = setTimeout(() => {
                setVisibleDiscards(prev => prev.filter(p => p.id !== eventId));
                // Optional: Cleanup ID from Set to allow re-discard (though unlikely for same card instance IDs)
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [lastDiscard, myPlayerId]);

    return (
        <AnimatePresence>
            {visibleDiscards.map((discardGroup) => (
                <div key={discardGroup.id} className="fixed inset-0 pointer-events-none z-[60]">
                    {discardGroup.cards.map((c, i) => (
                        <motion.div
                            key={`${discardGroup.id}-${c.id}`}
                            initial={{
                                scale: 0.5,
                                opacity: 0,
                                top: discardGroup.startY,
                                left: discardGroup.startX,
                                x: "-50%",
                                y: "-50%"
                            }}
                            animate={{
                                scale: 0.2, // Shrink as it goes to pile
                                opacity: 0, // Fade out at end
                                top: "60px", // Approximate Top-Left Discard Pile center (Top 4 + Size/2)
                                left: "60px", // Approximate Top-Left Discard Pile center
                                rotate: 360 // Spin
                            }}
                            transition={{
                                duration: 1.2,
                                ease: "easeInOut",
                                delay: i * 0.1
                            }}
                            className="absolute"
                        >
                            <Card isFaceDown={false} suit={c.suit} number={c.number} width={140} className="shadow-2xl border-2 border-white/50" />
                        </motion.div>
                    ))}
                </div>
            ))}
        </AnimatePresence>
    );
}
