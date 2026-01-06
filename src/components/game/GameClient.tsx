import { useGame } from "@/hooks/useGame";
import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion"; // Fixed import
import { clsx } from "clsx";
import { Lobby } from "@/components/Lobby";
import { MyHand } from "@/components/MyHand";
import { PlayerDetailModal } from "@/components/PlayerDetailModal";
import { DealingAnimation } from "@/components/DealingAnimation";
import { HistoryModal } from "../HistoryModal";
import { ChatBox } from "../ChatBox";
import { QRCodeModal } from "../QRCodeModal";

// Game Components
import { OpponentList } from "@/components/game/OpponentList";
import { ActiveDrawingStage } from "@/components/game/ActiveDrawingStage";
import { GameOverlay } from "@/components/game/GameOverlay";
import { GameEffects } from "@/components/game/GameEffects";

interface GameClientProps {
    roomId: string;
    isSpectator?: boolean;
}

export function GameClient({ roomId, isSpectator = false }: GameClientProps) {
    const { gameState, loading, myPlayer, myPlayerId, startGame, drawCard, tease, resetGame, voteToSkip, sendMessage, kickPlayer, shuffleHand } = useGame(roomId, { isSpectator });
    const [focusTargetId, setFocusTargetId] = useState<string | null>(null);
    const [detailPlayer, setDetailPlayer] = useState<any | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);
    const [playedIntro, setPlayedIntro] = useState(false);
    const processedTurnId = useRef<string | null>(null);

    // Helpers
    const isMyTurn = gameState?.currentTurnPlayerId === myPlayerId;
    const stablePlayers = useMemo(() => gameState?.players || [], [gameState?.players]);

    // Ordered list of opponents
    const others = useMemo(() => {
        if (!myPlayerId || isSpectator) return stablePlayers;
        const myIdx = stablePlayers.findIndex(p => p.id === myPlayerId);
        if (myIdx === -1) return stablePlayers;
        const rotated = [...stablePlayers.slice(myIdx + 1), ...stablePlayers.slice(0, myIdx)];
        return rotated;
    }, [stablePlayers, myPlayerId, isSpectator]);

    // Active Target Logic
    const activeTarget = useMemo(() => {
        if (!gameState?.targetPlayerId) return null;
        return stablePlayers.find(p => p.id === gameState.targetPlayerId);
    }, [gameState?.targetPlayerId, stablePlayers]);

    // Spectators can NEVER draw
    const isDrawingPhase = !isSpectator && gameState?.phase === 'PLAYING' && Boolean(isMyTurn && activeTarget && activeTarget.hand.length > 0);

    // Logging
    useEffect(() => {
        if (gameState?.phase === 'PLAYING') {
            console.log(`[DEBUG] Game Turn Update: ${gameState.currentTurnPlayerId}`);
        }
    }, [gameState?.phase, gameState?.currentTurnPlayerId]);

    // Handle Round Changes (Re-play Intro)
    const prevRoundCount = useRef<number>(gameState?.roundCount || 0);
    useEffect(() => {
        if (gameState?.roundCount && gameState.roundCount > prevRoundCount.current) {
            setPlayedIntro(false);
            prevRoundCount.current = gameState.roundCount;
        } else if (gameState?.roundCount) {
            prevRoundCount.current = gameState.roundCount;
        }
    }, [gameState?.roundCount]);

    // Auto-focus logic
    useEffect(() => {
        if (!isSpectator && gameState?.phase === 'PLAYING' && isMyTurn && !focusTargetId) {
            const turnId = `${gameState.roundCount}-${gameState.currentTurnPlayerId}`;
            if (processedTurnId.current === turnId) return;

            const target = stablePlayers.find(p => p.id === gameState.targetPlayerId);
            if (target && target.hand.length > 0) {
                setFocusTargetId(target.id);
                processedTurnId.current = turnId;
            }
        }
    }, [gameState?.phase, isMyTurn, stablePlayers, focusTargetId, gameState?.roundCount, gameState?.currentTurnPlayerId, isSpectator]);

    // If phase is LOBBY, we should strictly be in the Lobby Page (/room/[id]), not here (/room/[id]/play).
    // Redirect back to lobby if we are somehow here in LOBBY phase.
    useEffect(() => {
        if (!loading && gameState && gameState.phase === 'LOBBY') {
            window.location.href = `/room/${roomId}`;
        }
    }, [gameState?.phase, roomId, loading]);

    // Auto-redirect if kicked (player no longer in list and not spectator)
    useEffect(() => {
        if (!loading && gameState && myPlayerId && !gameState.players.find(p => p.id === myPlayerId) && !isSpectator) {
            alert("You have been kicked from the room.");
            window.location.href = "/";
        }
    }, [gameState?.players, myPlayerId, loading, isSpectator]);

    if (loading || !gameState || gameState.phase === 'LOBBY') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-mono animate-pulse">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                    <span className="text-slate-400 tracking-widest text-xs">CONNECTING TO GAME {roomId}...</span>
                </div>
            </div>
        );
    }

    return (
        <main className="relative w-full h-[100dvh] overflow-hidden bg-slate-50 font-sans select-none touch-none flex flex-col items-center">
            {/* Ambient Background Lights */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-200/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-200/20 blur-[120px] rounded-full pointer-events-none" />

            <GameEffects
                gameState={gameState}
                myPlayerId={myPlayerId}
                playedIntro={playedIntro}
                setPlayedIntro={setPlayedIntro}
                isDrawingPhase={isDrawingPhase}
            />

            {/* Header Buttons */}
            <div className="absolute top-4 left-4 z-30 flex gap-2">
                <button
                    onClick={() => {
                        // eslint-disable-next-line no-restricted-globals
                        if (confirm("Are you sure you want to leave the room?")) {
                            window.location.href = "/";
                        }
                    }}
                    className="h-10 px-4 rounded-full bg-white/50 backdrop-blur border border-slate-200 flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors font-bold text-xs shadow-sm"
                >
                    EXIT
                </button>
                <button
                    onClick={() => setShowQRCode(true)}
                    className="w-10 h-10 rounded-full bg-white/50 backdrop-blur border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-white transition-colors shadow-sm"
                >
                    📱
                </button>
            </div>

            <OpponentList
                others={others}
                currentTurnPlayerId={gameState.currentTurnPlayerId}
                targetPlayerId={gameState.targetPlayerId}
                isMyTurn={isMyTurn && !isSpectator}
                setFocusTargetId={setFocusTargetId}
                setDetailPlayer={setDetailPlayer}
            />

            <ActiveDrawingStage
                others={others}
                isDrawingPhase={isDrawingPhase}
                isMyTurn={isMyTurn && !isSpectator}
                targetPlayerId={gameState.targetPlayerId}
                drawCard={drawCard}
                setDetailPlayer={setDetailPlayer}
                setFocusTargetId={setFocusTargetId}
            />

            <GameOverlay
                gameState={gameState}
                myPlayer={myPlayer}
                isMyTurn={isMyTurn}
                showHistory={showHistory}
                setShowHistory={setShowHistory}
                detailPlayer={detailPlayer}
                setDetailPlayer={setDetailPlayer}
                voteToSkip={voteToSkip}
                shuffleHand={shuffleHand}
                resetGame={resetGame}
                stablePlayers={stablePlayers}
            />

            {/* MY HAND - Hidden if spectator */}
            {!isSpectator && myPlayer && <MyHand cards={myPlayer.hand} onTease={tease} />}
            {isSpectator && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-2 rounded-full backdrop-blur font-bold border border-white/20">
                    SPECTATOR MODE
                </div>
            )}

            {/* Chat Box */}
            <ChatBox
                messages={gameState.messages}
                onSend={sendMessage}
                myPlayerId={myPlayerId ?? undefined}
                className="z-[800]"
            />

            {/* Modals */}
            <AnimatePresence>
                {showQRCode && (
                    <QRCodeModal
                        url={typeof window !== 'undefined' ? window.location.href : ''}
                        onClose={() => setShowQRCode(false)}
                    />
                )}
            </AnimatePresence>
        </main>
    );
}
