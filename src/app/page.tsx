'use client';

import { useGame } from "@/hooks/useGame";
import { useState, useMemo, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PlayerHUD } from "@/components/PlayerHUD";
import { OpponentArea } from "@/components/OpponentArea";
import { clsx } from "clsx";
import { Lobby } from "@/components/Lobby";
import { MyHand } from "@/components/MyHand";
import { PlayerDetailModal } from "@/components/PlayerDetailModal";
import { DealingAnimation } from "@/components/DealingAnimation";
import { DiscardAnimation } from "@/components/DiscardAnimation";

// Ease-in-out curve
const EASE_ANIMATION = { duration: 0.8, ease: [0.42, 0, 0.58, 1] } as const;

export default function Home() {
    const { gameState, loading, error, myPlayer, myPlayerId, joinGame, startGame, drawCard, tease, resetGame } = useGame();
    const [focusTargetId, setFocusTargetId] = useState<string | null>(null);
    const [detailPlayer, setDetailPlayer] = useState<any | null>(null);
    const [playedIntro, setPlayedIntro] = useState(false);
    const processedTurnId = useRef<string | null>(null);

    // Helpers
    const isMyTurn = gameState?.currentTurnPlayerId === myPlayerId;
    const stablePlayers = useMemo(() => gameState?.players || [], [gameState?.players]);
    const others = useMemo(() => {
        if (!myPlayerId) return stablePlayers;
        const myIdx = stablePlayers.findIndex(p => p.id === myPlayerId);
        if (myIdx === -1) return stablePlayers;
        // Rotate so my player is at start (but filtered out)
        const rotated = [...stablePlayers.slice(myIdx + 1), ...stablePlayers.slice(0, myIdx)];
        return rotated;
    }, [stablePlayers, myPlayerId]);

    const targetPlayer = useMemo(() => stablePlayers.find(p => p.id === focusTargetId), [stablePlayers, focusTargetId]);
    const totalDiscarded = useMemo(() => 53 - stablePlayers.reduce((acc, p) => acc + p.hand.length, 0), [stablePlayers]);

    // Check if we are in a state where we can draw (My Turn & Target has cards)
    const activeTarget = useMemo(() => {
        if (!gameState?.targetPlayerId) return null;
        return stablePlayers.find(p => p.id === gameState.targetPlayerId);
    }, [gameState?.targetPlayerId, stablePlayers]);

    // Fallback? If logic works, activeTarget matches targetPlayerId.
    const isDrawingPhase = isMyTurn && activeTarget && activeTarget.hand.length > 0;

    // Logging
    useEffect(() => {
        if (gameState?.phase === 'PLAYING') {
            console.log(`[DEBUG] Game Turn Update: ${gameState.currentTurnPlayerId}`);
        }
    }, [gameState?.phase, gameState?.currentTurnPlayerId]);

    // Auto-focus logic
    useEffect(() => {
        if (gameState?.phase === 'PLAYING' && isMyTurn && !focusTargetId) {
            const turnId = `${gameState.roundCount}-${gameState.currentTurnPlayerId}`;
            if (processedTurnId.current === turnId) return;

            // Find target player
            const target = stablePlayers.find(p => p.id === gameState.targetPlayerId);
            if (target && target.hand.length > 0) {
                console.log("[DEBUG] Auto-Focusing Target:", target.name);
                setFocusTargetId(target.id);
                processedTurnId.current = turnId;
            }
        }
    }, [gameState?.phase, isMyTurn, stablePlayers, focusTargetId, gameState?.roundCount, gameState?.currentTurnPlayerId, gameState?.targetPlayerId]);


    // Auto-scroll logic for turn changes
    const opponentRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    useEffect(() => {
        if (gameState?.phase === 'PLAYING' && gameState.currentTurnPlayerId) {
            const el = opponentRefs.current.get(gameState.currentTurnPlayerId);
            if (el) {
                // Smooth scroll to center
                el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
    }, [gameState?.phase, gameState?.currentTurnPlayerId]);


    if (loading && !gameState) {
        return <div className="min-h-screen flex items-center justify-center text-slate-400 font-mono animate-pulse">CONNECTING...</div>;
    }

    if (!gameState || gameState.phase === 'LOBBY') {
        const isLobby = gameState?.phase === 'LOBBY';
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-8">
                {/* Show Lobby Logic */}
                <Lobby
                    gameState={gameState || { players: [], phase: 'LOBBY' } as any}
                    myPlayer={myPlayer}
                    joinGame={joinGame}
                    startGame={startGame}
                    resetGame={resetGame}
                    loading={loading}
                />
            </div>
        );
    }

    // --- GAME VIEW ---
    return (
        <main className="relative w-full h-screen overflow-hidden bg-slate-100 font-sans select-none touch-none">

            {!playedIntro && <DealingAnimation onComplete={() => setPlayedIntro(true)} />}

            {/* BACKGROUND                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <DiscardPile lastDiscard={gameState.lastDiscard} />
                </div>

            {/* SPOTLIGHT BACKDROP */}
            <div
                className={clsx(
                    "fixed inset-0 bg-black/60 z-30 transition-opacity duration-500",
                    isDrawingPhase ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
            />

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
            <div className="absolute top-5 left-0 w-full h-px bg-slate-200 -z-0" />

            {/* OPPONENTS LAYOUT - Scrollable container */}
            <div className="absolute top-4 left-0 w-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth px-8 py-20 hide-scrollbar items-start pointer-events-auto">
                <div className="flex gap-8 min-w-max mx-auto px-16">
                    {others.map((p, idx) => {
                        const isTurn = gameState.currentTurnPlayerId === p.id;
                        const isTarget = gameState.targetPlayerId === p.id;
                        const canDraw = Boolean(isMyTurn && isTarget && p.hand.length > 0);

                        // Dynamic spacing
                        const dynamicMinWidth = Math.max(100, 50 + p.hand.length * 30);

                        // If drawing, we render in Portal. Here we render a placeholder to maintain layout.
                        if (canDraw) {
                            return (
                                <div
                                    key={p.id}
                                    ref={(el: HTMLDivElement | null) => {
                                        if (el) opponentRefs.current.set(p.id, el);
                                        else opponentRefs.current.delete(p.id);
                                    }}
                                    className="snap-center flex justify-center shrink-0 transition-all duration-300"
                                    style={{ minWidth: dynamicMinWidth, height: 300 }}
                                />
                            );
                        }

                        // Normal Opponent Render in List
                        return (
                            <div
                                key={p.id}
                                ref={(el: HTMLDivElement | null) => {
                                    if (el) opponentRefs.current.set(p.id, el);
                                    else opponentRefs.current.delete(p.id);
                                }}
                                className="pointer-events-auto relative transition-all duration-300 snap-center flex justify-center z-20"
                                style={{ minWidth: dynamicMinWidth }}
                            >
                                <motion.div layoutId={`opponent-${p.id}`} className="w-full flex justify-center">
                                    <OpponentArea
                                        player={p}
                                        isTurn={isTurn}
                                        canDraw={false} // List view is never interactive for draw
                                        isFocused={focusTargetId === p.id}
                                        onSelect={() => setFocusTargetId(p.id)}
                                        onDetail={() => setDetailPlayer(p)}
                                        onDraw={(cardIdx) => { }} // No draw in list
                                    />
                                </motion.div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* TARGET PORTAL LAYER (Z-100) - Pops out the target player */}
            <AnimatePresence>
                {isDrawingPhase && others.map(p => {
                    const isTarget = gameState.targetPlayerId === p.id;
                    const canDraw = Boolean(isMyTurn && isTarget && p.hand.length > 0);
                    if (!canDraw) return null;

                    return (
                        <div key={p.id} className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[100] pointer-events-auto flex justify-center items-center">
                            {/* Spotlight Glow - Behind the player */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-200/20 blur-[100px] rounded-full -z-10 pointer-events-none"
                            />

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

            {/* MY HAND - Using new component */}
            {myPlayer && <MyHand cards={myPlayer.hand} onTease={tease} />}

            {/* DISCARD ANIMATION */}
            <DiscardAnimation lastDiscard={gameState?.lastDiscard || null} myPlayerId={myPlayerId || undefined} />


            {/* DETAILS MODAL */}
            <AnimatePresence>
                {detailPlayer && (
                    <PlayerDetailModal
                        player={detailPlayer}
                        onClose={() => setDetailPlayer(null)}
                    />
                )}
            </AnimatePresence>

            {/* FINISHED OVERLAY */}
            <AnimatePresence>
                {gameState.phase === 'FINISHED' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-white"
                    >
                        <h2 className="text-4xl font-black mb-8 text-yellow-400 drop-shadow-lg">GAME SET</h2>
                        <div className="flex flex-col gap-4 w-full max-w-md px-4">
                            {stablePlayers
                                .sort((a, b) => (a.rank || 99) - (b.rank || 99))
                                .map((p, i) => (
                                    <motion.div
                                        key={p.id}
                                        initial={{ x: -50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="bg-white/10 border border-white/20 p-4 rounded-xl flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl font-bold w-8 text-center">{p.rank}</span>
                                            <span className="font-bold">{p.name}</span>
                                        </div>
                                        <div className="font-mono text-yellow-300 font-bold">
                                            {p.rate}
                                            <span className="text-xs text-white/50 ml-2">
                                                ({p.rate - (p.rateHistory[p.rateHistory.length - 2] || 100) > 0 ? '+' : ''}
                                                {p.rate - (p.rateHistory[p.rateHistory.length - 2] || 100)})
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                        </div>
                        <button
                            onClick={() => resetGame(false)}
                            className="mt-12 px-8 py-3 bg-white text-slate-900 rounded-full font-bold hover:scale-105 transition-transform"
                        >
                            Next Round
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
