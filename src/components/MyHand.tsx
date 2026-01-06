
import { Card as CardType, Player } from "@/types/game";
import { Card } from "./Card";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_ANIMATION } from "@/components/OpponentArea"; // Re-use constant if possible or redefine

// Duplicate contant to avoid circular or messy imports if it's not in a shared lib
const ANIMATION = {
    type: "spring",
    stiffness: 300,
    damping: 30
};

type Props = {
    cards: CardType[];
    onTease: (index: number) => void;
};

export function MyHand({ cards, onTease }: Props) {
    const isLargeHand = cards.length > 10;

    return (
        <div className="fixed bottom-0 left-0 w-full z-40 flex justify-center items-end pointer-events-none pb-12">
            {/* Scrollable Container for Large Hands */}
            {isLargeHand ? (
                <div className="w-full overflow-x-auto px-8 pb-4 flex items-end justify-start md:justify-center pointer-events-auto hide-scrollbar">
                    <div className="flex items-end -space-x-12 px-8">
                        <AnimatePresence mode="popLayout">
                            {cards.map((c, idx) => (
                                <motion.div
                                    key={c.id}
                                    // Removed layout prop for performance
                                    initial={{ y: 200, opacity: 0 }}
                                    animate={{
                                        y: c.isHighlighted ? -4 : 0,
                                        opacity: 1,
                                        scale: 1,
                                        zIndex: idx // Maintain stacking context
                                    }}
                                    exit={{ y: 200, opacity: 0, scale: 0.5 }}
                                    whileHover={{ y: -10, scale: 1.1 }} // Pop to top on hover
                                    onClick={() => onTease(idx)}
                                    className="relative cursor-pointer transition-all duration-200"
                                    style={{
                                        width: 120,
                                        zIndex: idx
                                    }}
                                >
                                    <div className="relative transition-transform duration-300">
                                        <Card
                                            suit={c.suit}
                                            number={c.number}
                                            width={120}
                                            className="shadow-lg border border-slate-200"
                                            isHighlighted={c.isHighlighted}
                                        />
                                        {c.isHighlighted && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute -top-3 -right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-sm"
                                            >
                                                TEASING
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            ) : (
                /* Fan Layout for Small Hands */
                <div className="relative w-full max-w-6xl h-64 flex justify-center items-end px-4 md:scale-110 origin-bottom">
                    <AnimatePresence mode="popLayout">
                        {cards.map((c, idx) => {
                            const total = cards.length;
                            const center = (total - 1) / 2;
                            const dist = idx - center;
                            const spread = total > 8 ? 30 : total > 5 ? 45 : 60;

                            return (
                                <motion.div
                                    key={c.id}
                                    // Removed layout prop for performance
                                    initial={{ y: 200, opacity: 0 }}
                                    animate={{
                                        // Base Y=70. Teasing Y=60 (Up 10px).
                                        y: c.isHighlighted ? 60 : 70,
                                        x: dist * spread,
                                        rotate: dist * 2,
                                        opacity: 1,
                                        zIndex: idx // Stack order
                                    }}
                                    whileHover={{
                                        y: 50, // Hover moves up more distinctively
                                        rotate: 0,
                                        scale: 1.1,
                                        // zIndex: 100, // REMOVED to maintain layers
                                        transition: { duration: 0.1 } // Snappy hover
                                    }}
                                    exit={{ y: 200, opacity: 0 }}
                                    onClick={() => onTease(idx)}
                                    className="absolute bottom-0 origin-bottom pointer-events-auto cursor-pointer will-change-transform"
                                    style={{
                                        width: 140,
                                        left: '50%',
                                        marginLeft: -70
                                    }}
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                >
                                    <div className="relative transition-transform duration-300">
                                        <Card
                                            suit={c.suit}
                                            number={c.number}
                                            width={120}
                                            className="shadow-lg border border-slate-200"
                                            isHighlighted={c.isHighlighted}
                                        />
                                        {c.isHighlighted && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute -top-3 -right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-sm z-50"
                                            >
                                                TEASING
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
