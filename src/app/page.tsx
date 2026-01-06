'use client';

import { useGame } from "@/hooks/useGame";
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/Card";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { PlayerHUD } from "@/components/PlayerHUD";
import { PlayerDetailModal } from "@/components/PlayerDetailModal";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Player } from "@/types/game";

// --- ANIMATION CONFIG ---
const SPRING_SMOOTH = { type: "spring", stiffness: 45, damping: 14, mass: 1.2 } as const;

// --- COMPONENTS ---
function DealingAnimation({ onComplete }: { onComplete: () => void }) {
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

function DiscardPile({ totalDiscarded }: { totalDiscarded: number }) {
    const items = useRef<{ id: number, r: number, x: number, y: number }[]>([]);
    if (items.current.length < totalDiscarded) {
        for (let i = items.current.length; i < totalDiscarded; i++) {
            items.current.push({
                id: i,
                r: Math.random() * 360,
                x: (Math.random() - 0.5) * 60,
                y: (Math.random() - 0.5) * 60
            });
        }
    } else if (items.current.length > totalDiscarded) {
        items.current = [];
    }

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <AnimatePresence>
                {items.current.map((item) => (
                    <motion.div
                        key={item.id}
                        initial={{ scale: 2, opacity: 0, y: -200 }}
                        animate={{ scale: 1, opacity: 1, y: item.y, x: item.x, rotate: item.r }}
                        className="absolute w-24 h-32 bg-slate-700/80 border border-slate-500 rounded-lg shadow-sm"
                    />
                ))}
            </AnimatePresence>
            {totalDiscarded > 0 && (
                <div className="absolute z-10 text-slate-900/10 font-black text-6xl tracking-widest uppercase rotate-[-10deg]">
                    TRASH
                </div>
            )}
        </div>
    );
}

export default function Home() {
    const { gameState, myPlayer, myPlayerId, joinGame, drawCard } = useGame();
    const [focusTargetId, setFocusTargetId] = useState<string | null>(null);
    const [detailPlayer, setDetailPlayer] = useState<Player | null>(null);
    const [playedIntro, setPlayedIntro] = useState(false);

    // Derived state
    const totalCards = gameState?.players.reduce((acc, p) => acc + p.hand.length, 0) || 0;
    const totalDiscarded = 53 - totalCards;

    // AUTO-FOCUS
    useEffect(() => {
        if (gameState && gameState.currentTurnPlayerId === myPlayerId) {
            const myIdx = gameState.players.findIndex(p => p.id === myPlayerId);
            const rIdx = (myIdx + 1) % gameState.players.length;
            const neighbor = gameState.players[rIdx];

            // Slower auto-open
            const timer = setTimeout(() => {
                setFocusTargetId(neighbor.id);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [gameState?.currentTurnPlayerId, myPlayerId, gameState?.players]);


    // Initial Loading
    if (!gameState) return <div className="h-screen flex items-center justify-center text-slate-400">Loading...</div>;

    // LOBBY
    if (gameState.phase === 'LOBBY' && !myPlayer) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-100 p-8">
                <div className="glass-panel p-12 rounded-[32px] max-w-lg w-full text-center">
                    <h1 className="text-4xl font-black text-slate-800 mb-2">Rate Baba</h1>
                    <input
                        onKeyDown={e => e.key === 'Enter' && joinGame(e.currentTarget.value)}
                        className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-200 text-lg mb-4 outline-none"
                        placeholder="Your Name"
                    />
                    <button
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:shadow-xl transition-all"
                        onClick={e => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            joinGame(input.value);
                        }}
                    >
                        Join Game
                    </button>
                </div>
            </div>
        );
    }

    if (gameState.phase === 'LOBBY') {
        return (
            <div className="h-screen bg-slate-100 flex flex-col items-center justify-center gap-8">
                <div className="text-2xl font-bold text-slate-700">Waiting for players...</div>
                <div className="flex gap-4">
                    {gameState.players.map(p => (
                        <PlayerAvatar key={p.id} name={p.name} rate={p.rate} cardsCount={0} isCurrentTurn={false} />
                    ))}
                </div>
            </div>
        );
    }

    const isMyTurn = gameState.currentTurnPlayerId === myPlayerId;
    const myIndex = gameState.players.findIndex(p => p.id === myPlayerId);
    const others = [...gameState.players.slice(myIndex + 1), ...gameState.players.slice(0, myIndex)];
    const targetPlayer = focusTargetId ? gameState.players.find(p => p.id === focusTargetId) : null;

    return (
        <div className="h-screen w-full bg-[#f8fafc] relative overflow-hidden flex flex-col select-none touch-none">

            {!playedIntro && <DealingAnimation onComplete={() => setPlayedIntro(true)} />}

            {/* BACKGROUND */}
            <DiscardPile totalDiscarded={Math.max(0, totalDiscarded)} />

            {/* HUD */}
            {myPlayer && (
                <PlayerHUD
                    name={myPlayer.name}
                    rate={myPlayer.rate}
                    rank={myPlayer.rank}
                    onClick={() => setDetailPlayer(myPlayer)}
                />
            )}

            {/* RAIL */}
            <div className="absolute top-32 left-0 w-full h-px bg-slate-200 -z-0" />

            {/* OPPONENTS LAYOUT */}
            <div className="flex-1 flex justify-center items-start pt-16 gap-4 z-10 w-full px-2">
                {others.map((p, idx) => {
                    const isTurn = gameState.currentTurnPlayerId === p.id;
                    const isRightNeighbor = idx === 0;
                    const canDraw = isMyTurn && isRightNeighbor && p.hand.length > 0;

                    return (
                        <motion.div
                            key={p.id}
                            animate={{ scale: isTurn ? 1.05 : 1, y: isTurn ? 0 : 20 }}
                            className="relative flex flex-col items-center gap-2"
                        >
                            <div className="relative z-20 cursor-pointer" onClick={() => setDetailPlayer(p)}>
                                <PlayerAvatar
                                    name={p.name}
                                    rate={p.rate}
                                    rank={p.rank}
                                    cardsCount={p.hand.length}
                                    isCurrentTurn={isTurn}
                                />
                            </div>

                            {/* COMPACT ROW HAND (Visible below) */}
                            {p.hand.length > 0 && (
                                <div
                                    className={clsx(
                                        "relative h-20 w-32 transition-all",
                                        canDraw ? "cursor-pointer hover:scale-105" : "opacity-90",
                                        focusTargetId === p.id ? "opacity-0" : "opacity-100" // Hide when expanded
                                    )}
                                    // Manual trigger if needed
                                    onClick={() => canDraw && setFocusTargetId(p.id)}
                                >
                                    {p.hand.map((card, cIdx) => {
                                        // Neat row overlap
                                        const xOffset = (cIdx - (p.hand.length - 1) / 2) * 12;
                                        const angle = (cIdx - p.hand.length / 2) * 2;

                                        return (
                                            <motion.div
                                                key={card.id}
                                                layoutId={`card-${card.id}`} // SHARED LAYOUT ID
                                                className="absolute w-12 h-16 bg-slate-800 rounded border border-white/20 shadow-sm top-0 will-change-transform"
                                                style={{
                                                    left: '50%',
                                                    marginLeft: '-24px',
                                                    x: xOffset,
                                                    rotate: angle,
                                                    zIndex: cIdx
                                                }}
                                                transition={SPRING_SMOOTH}
                                            />
                                        );
                                    })}
                                </div>
                            )}

                            {isTurn && (
                                <motion.div
                                    layoutId="turn-marker"
                                    className="absolute -top-4 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                                />
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* MY HAND */}
            <div className="fixed bottom-0 left-0 w-full h-48 z-40 flex justify-center items-end pointer-events-none">
                <div className="relative w-full max-w-4xl h-full flex justify-center items-end px-4 pb-2">
                    <AnimatePresence mode="popLayout">
                        {myPlayer?.hand.map((c, idx) => {
                            const total = myPlayer.hand.length;
                            const center = (total - 1) / 2;
                            const dist = idx - center;
                            const spread = total > 8 ? 30 : total > 5 ? 45 : 60;

                            return (
                                <motion.div
                                    key={c.id}
                                    layout
                                    initial={{ y: 200 }}
                                    animate={{
                                        y: 70,
                                        x: dist * spread,
                                        rotate: dist * 2
                                    }}
                                    whileHover={{
                                        y: 0,
                                        rotate: 0,
                                        scale: 1.1,
                                        zIndex: 100
                                    }}
                                    exit={{ y: 200, opacity: 0 }}
                                    className="absolute bottom-0 origin-bottom pointer-events-auto cursor-pointer will-change-transform"
                                    style={{
                                        zIndex: idx,
                                        width: 140,
                                        left: '50%',
                                        marginLeft: -70
                                    }}
                                >
                                    <Card suit={c.suit} number={c.number} width={140} className="shadow-lg border border-slate-200" />
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* FOCUS DRAW OVERLAY - CONTINUOUS ANIMATION with MATCHING LAYOUT ID */}
            <AnimatePresence>
                {focusTargetId && targetPlayer && (
                    <motion.div
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="absolute inset-0 z-0" onClick={() => setFocusTargetId(null)} />

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
                                        layoutId={`card-${card.id}`} // MATCHES RESTING STATE
                                        className="absolute cursor-pointer"
                                        initial={{ zIndex: 0 }}
                                        animate={{ x: `${xPercent}vw`, rotate: 0, scale: 1, zIndex: 100 }}
                                        exit={{ scale: 0.5, opacity: 0 }}
                                        transition={{
                                            ...SPRING_SMOOTH,
                                            delay: idx * 0.04 // Slight Ripple
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            drawCard(targetPlayer.id, idx);
                                            setFocusTargetId(null);
                                        }}
                                    >
                                        <div className="w-32 h-48 bg-slate-800 rounded-xl border-4 border-slate-600 shadow-2xl flex items-center justify-center hover:scale-110 transition-transform">
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
                                setFocusTargetId(null);
                            }}
                        >
                            CANCEL SELECTION
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* DETAILS MODAL */}
            <AnimatePresence>
                {detailPlayer && (
                    <PlayerDetailModal
                        player={detailPlayer}
                        onClose={() => setDetailPlayer(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
