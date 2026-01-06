'use client';

import { motion } from "framer-motion";

export function DealingAnimation({ onComplete }: { onComplete: () => void }) {
    return (
        <motion.div
            className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center overflow-hidden"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0, pointerEvents: "none" }}
            transition={{ delay: 2.5, duration: 1 }}
            onAnimationComplete={onComplete}
        >
            <div className="relative">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-32 h-48 bg-slate-800 border-2 border-white/20 rounded-xl shadow-2xl origin-center"
                        initial={{ x: 0, y: 0, scale: 0 }}
                        animate={{
                            scale: [0, 1, 1, 0],
                            x: [0, (Math.random() - 0.5) * 600, (Math.random() - 0.5) * 1200],
                            y: [0, (Math.random() - 0.5) * 600, (Math.random() - 0.5) * 1200],
                            rotate: [0, Math.random() * 720, Math.random() * 720]
                        }}
                        transition={{ duration: 2.5, ease: "anticipate" }}
                    />
                ))}
                <motion.div
                    className="text-4xl font-black text-white absolute -top-32 left-1/2 -translate-x-1/2 whitespace-nowrap tracking-widest"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    DEALING
                </motion.div>
            </div>
        </motion.div>
    );
}
