
import { Card as CardType } from "@/types/game";
import { Card } from "./Card";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";

type Props = {
    lastDiscard: { playerId: string; cards: CardType[] } | null;
    myPlayerId: string | undefined;
};

export function DiscardAnimation({ lastDiscard, myPlayerId }: Props) {
    const [visibleDiscards, setVisibleDiscards] = useState<{ cards: CardType[], id: string, isMe: boolean }[]>([]);
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

            // Determine context
            const isMe = lastDiscard.playerId === myPlayerId;

            const newDiscard = {
                cards: lastDiscard.cards,
                id: eventId,
                isMe
            };

            setVisibleDiscards(prev => [...prev, newDiscard]);

            // Cleanup after animation
            const timer = setTimeout(() => {
                setVisibleDiscards(prev => prev.filter(p => p.id !== eventId));
            }, 2000); // 2s duration

            return () => clearTimeout(timer);
        }
    }, [lastDiscard, myPlayerId]);

    return (
        <AnimatePresence>
            {visibleDiscards.map((discardGroup) => (
                <div key={discardGroup.id} className="fixed inset-0 pointer-events-none z-35">
                    {discardGroup.cards.map((c, i) => {
                        // Calculate Start Position
                        // Default (Others): All from Top Center (15vh)
                        let startY = "15vh";
                        if (discardGroup.isMe) {
                            // Me: One from Top (Opponent), One from Bottom (Hand)
                            // i=0 -> Top, i=1 -> Bottom
                            startY = i === 0 ? "15vh" : "85vh";
                        }

                        return (
                            <motion.div
                                key={`${discardGroup.id}-${c.id}`}
                                initial={{
                                    scale: 0.5,
                                    opacity: 0,
                                    top: startY,
                                    left: "50%",
                                    x: "-50%",
                                    y: "-50%",
                                    rotate: 0,
                                }}
                                animate={{
                                    top: "50%",
                                    left: "50%",
                                    scale: [0.5, 1.1, 0.5], // Grow to show, then shrink to pile size
                                    opacity: [0, 1, 1, 0], // Fade in, stay, fade out
                                    rotate: [0, 180 + Math.random() * 180],
                                    zIndex: [10, 10, 0] // Keep z-index stable until end
                                }}
                                transition={{
                                    duration: 1.4, // Adjusted for better visibility
                                    ease: "easeInOut", // Smooth curve
                                    delay: i * 0.05 // Tiny offset for natural layering
                                }}
                                className="absolute"
                            >
                                <Card
                                    isFaceDown={false}
                                    suit={c.suit}
                                    number={c.number}
                                    width={140}
                                    className="shadow-2xl border-white/50"
                                />
                            </motion.div>
                        );
                    })}
                </div>
            ))}
        </AnimatePresence>
    );
}
