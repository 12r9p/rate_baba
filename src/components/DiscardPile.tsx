'use client';

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Card } from "./Card";

type DiscardedCard = {
    id: string;
    angle: number;
    x: number;
    y: number;
};

export function DiscardPile({ count }: { count: number }) {
    const [pile, setPile] = useState<DiscardedCard[]>([]);

    // Sync pile size with count (approximate visualization)
    useEffect(() => {
        // If count increases, add cards
        // If count decreases (reset), clear
        if (count < pile.length) {
            setPile([]);
            return;
        }

        if (count > pile.length) {
            const newCards: DiscardedCard[] = [];
            for (let i = pile.length; i < count; i++) {
                newCards.push({
                    id: `discard-${i}-${Math.random()}`,
                    angle: Math.random() * 360,
                    x: (Math.random() - 0.5) * 40,
                    y: (Math.random() - 0.5) * 40
                });
            }
            setPile(prev => [...prev, ...newCards]);
        }
    }, [count, pile.length]);

    return (
        <div className="relative w-32 h-32 flex items-center justify-center opacity-80 pointer-events-none">
            {/* Base */}
            <div className="absolute inset-0 border-2 border-white/10 rounded-full scale-150 animate-pulse" />

            {pile.map((c, i) => (
                <motion.div
                    key={c.id}
                    initial={{ scale: 2, opacity: 0, y: -200 }} // Fly in from top (or generic)
                    animate={{ scale: 1, opacity: 1, y: c.y, x: c.x, rotate: c.angle }}
                    className="absolute"
                    style={{ zIndex: i }}
                >
                    <Card
                        isFaceDown={false} // Show messes usually face up or down? Face up is more colorful.
                        suit="joker" // Mock
                        number={0}   // Mock, or maybe show back? 
                    // Actually, discarded pairs are crucial info in Baba Nuki? 
                    // Standard rule: Discarded pairs are usually shown? 
                    // Or just "Trash"? Let's stick to Face Down "Trash" look or Back.
                    // User said "Discard animation... messily pile up".
                    />
                    {/* Let's just use Face Down for generic pile, or Face Up if we knew what it was. 
                 Since we don't receive WHAT was discarded easily without diffing, let's use Face Down Backs
                 but maybe tinted dark to show "Trash".
             */}
                    <div className="w-24 h-32 bg-slate-800 rounded-lg border border-slate-600 shadow-sm" />
                </motion.div>
            ))}
        </div>
    );
}
