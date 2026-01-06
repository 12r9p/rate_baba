'use client';

import { Player } from "@/types/game";
import { motion } from "framer-motion";

const EASE_ANIMATION = { duration: 0.8, ease: [0.42, 0, 0.58, 1] as const };

interface FocusDrawOverlayProps {
    targetPlayer: Player;
    onDraw: (cardIndex: number) => void;
    onClose: () => void;
}

import { useEffect } from "react";

export function FocusDrawOverlay({ targetPlayer, onDraw, onClose }: FocusDrawOverlayProps) {
    useEffect(() => {
        console.log(`[DEBUG] FocusDrawOverlay MOUNTED for ${targetPlayer.name} (${targetPlayer.id})`);
        const ids = targetPlayer.hand.map(c => c.id).join(',');
        console.log(`[DEBUG] FocusDrawOverlay Card IDs: ${ids}`);

        return () => {
            console.log(`[DEBUG] FocusDrawOverlay UNMOUNTED for ${targetPlayer.name}`);
        };
    }, [targetPlayer.name, targetPlayer.id]); // Check mount/unmount primarily

    return (
        <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="absolute inset-0 z-0" onClick={onClose} />

            <div className="relative z-10 w-full h-full flex items-center justify-center">
                {targetPlayer.hand.map((card, idx) => {
                    const total = targetPlayer.hand.length;
                    const widthVw = 80;
                    const step = Math.min(10, widthVw / total);
                    const center = (total - 1) / 2;
                    const xPercent = (idx - center) * step;

                    return (
                        <motion.div
                            key={card.id}
                            layoutId={`card-${card.id}`}
                            className="absolute cursor-pointer will-change-transform"
                            initial={{ zIndex: 0 }}
                            animate={{ x: `${xPercent}vw`, rotate: 0, scale: 1, zIndex: 100 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{
                                ...EASE_ANIMATION,
                                delay: idx * 0.05 // Stagger for wave effect
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onDraw(idx);
                                onClose();
                            }}
                        >
                            <div className="w-32 h-48 bg-slate-800 rounded-xl border-4 border-slate-500 shadow-xl flex items-center justify-center hover:scale-105 transition-transform">
                                <span className="text-4xl text-white/20 select-none font-black">?</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <button
                className="absolute bottom-32 z-50 px-12 py-4 bg-slate-800 text-white rounded-full font-bold shadow-xl hover:scale-105 active:scale-95 transition-all"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            >
                CANCEL SELECTION
            </button>
        </motion.div>
    );
}
