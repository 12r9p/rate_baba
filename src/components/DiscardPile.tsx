// DiscardPile.tsx
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Card } from "./Card";
import { Card as CardType } from "@/types/game";

type DiscardedCard = {
    id: string;
    suit: CardType['suit'];
    number: CardType['number'];
    angle: number;
    x: number;
    y: number;
};

type Props = {
    lastDiscard: { playerId: string; cards: CardType[] } | null;
};

export function DiscardPile({ lastDiscard }: Props) {
    const [pile, setPile] = useState<DiscardedCard[]>([]);

    useEffect(() => {
        if (!lastDiscard) return;

        // Add new cards to the pile
        const newCards: DiscardedCard[] = lastDiscard.cards.map((c, i) => ({
            id: `${c.id}-${Date.now()}`, // Unique ID for loop
            suit: c.suit,
            number: c.number,
            angle: Math.random() * 60 - 30, // Random rotation -30 to 30
            x: (Math.random() - 0.5) * 40,  // Random jitter
            y: (Math.random() - 0.5) * 40
        }));

        setPile(prev => {
            // Keep max 20 cards to prevent performance issues
            const updated = [...prev, ...newCards];
            if (updated.length > 20) {
                return updated.slice(updated.length - 20);
            }
            return updated;
        });
    }, [lastDiscard]);

    return (
        <div className="relative w-32 h-40 flex items-center justify-center">
            {/* Empty State placeholder (only if empty) */}
            {pile.length === 0 && (
                <div className="absolute inset-0 border-2 border-white/10 rounded-xl flex items-center justify-center opacity-50">
                    <span className="text-white/20 text-xs font-bold tracking-widest uppercase">Discard</span>
                </div>
            )}

            {pile.map((c, i) => (
                <motion.div
                    key={c.id}
                    initial={{ scale: 1.5, opacity: 0, y: -50 }}
                    animate={{ scale: 1, opacity: 1, y: c.y, x: c.x, rotate: c.angle }}
                    className="absolute"
                    style={{ zIndex: i }}
                >
                    <Card
                        suit={c.suit}
                        number={c.number}
                        width={90} // Slightly smaller than hand cards
                        isFaceDown={false}
                        className="shadow-md"
                        disabled
                    />
                </motion.div>
            ))}
        </div>
    );
}
