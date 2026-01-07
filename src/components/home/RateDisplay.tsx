import { useEffect, useRef } from "react";
import { useSpring, useMotionValue, useTransform, motion } from "framer-motion";

interface RateDisplayProps {
    currentRate: number;
    previousRate: number; // For animation from -> to
    onClick: () => void;
}

export function RateDisplay({ currentRate, previousRate, onClick }: RateDisplayProps) {
    // Motion value for the numeric rate
    const rateMotion = useMotionValue(previousRate);

    // Create a spring animation to smoothly transition to currentRate
    const springRate = useSpring(rateMotion, {
        stiffness: 75,
        damping: 15,
        mass: 1
    });

    // Transform the spring value to a rounded integer string for display
    const displayRate = useTransform(springRate, (latest) => Math.round(latest).toString());

    useEffect(() => {
        // Trigger the animation when currentRate changes
        rateMotion.set(previousRate); // Ensure it starts from previous

        // Small delay to let React render/hydrate before animating?
        const timeout = setTimeout(() => {
            rateMotion.set(currentRate);
        }, 100);

        return () => clearTimeout(timeout);
    }, [currentRate, previousRate, rateMotion]);

    // Diff for showing +/- indicator
    const diff = currentRate - previousRate;

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center justify-center mb-8 cursor-pointer group"
        >
            <div className="text-[10px] font-bold text-slate-400 tracking-[0.2em] mb-1 group-hover:text-slate-600 transition-colors">
                YOUR RATE
            </div>
            <div className="relative flex items-baseline gap-2">
                <motion.div className="text-5xl font-black text-slate-900 tracking-tighter">
                    {displayRate}
                </motion.div>

                {/* Diff Indicator (Only shows if there is a diff and we are "animating" effectively, but static diff is fine) */}
                {diff !== 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className={`text-lg font-bold ${diff > 0 ? 'text-emerald-500' : 'text-rose-500'}`}
                    >
                        {diff > 0 ? '+' : ''}{diff}
                    </motion.div>
                )}
            </div>
            <div className="h-1 w-12 bg-slate-200 mt-4 rounded-full group-hover:bg-slate-300 transition-colors" />
        </motion.button>
    );
}
