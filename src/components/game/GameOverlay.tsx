'use client';

import { AnimatePresence, motion } from "framer-motion";
import { PlayerHUD } from "@/components/PlayerHUD";
import { PlayerDetailModal } from "@/components/PlayerDetailModal";
import { HistoryModal } from "../HistoryModal";
import { Player, GameState } from "@/types/game";

interface GameOverlayProps {
    gameState: GameState;
    myPlayer: Player | null;
    isMyTurn: boolean;
    showHistory: boolean;
    setShowHistory: (show: boolean) => void;
    detailPlayer: Player | null;
    setDetailPlayer: (player: Player | null) => void;
    voteToSkip: () => void;
    resetGame: (hard: boolean) => void;
    stablePlayers: Player[]; // Passing stableSorted players for result
}

export function GameOverlay({
    gameState, myPlayer, isMyTurn,
    showHistory, setShowHistory,
    detailPlayer, setDetailPlayer,
    voteToSkip, resetGame, stablePlayers
}: GameOverlayProps) {

    return (
        <>
            {/* TOP RIGHT CONTROLS */}
            <div className="fixed top-4 right-4 z-50 flex gap-2">
                <button
                    onClick={() => setShowHistory(true)}
                    className="p-3 bg-white/80 backdrop-blur shadow-sm rounded-full hover:bg-white transition-all text-xl"
                    title="Score History"
                >
                    📜
                </button>
            </div>

            {/* VOTE TO SKIP (AFK Protection) */}
            {gameState?.phase === 'PLAYING' && !isMyTurn && (
                <div className="fixed bottom-46 right-8 z-40">
                    <button
                        onClick={voteToSkip}
                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
                        title="Vote to force the current player to draw randomly (anti-AFK)"
                    >
                        <span>⚠️ Force Draw</span>
                        <span className="bg-red-200 px-1.5 py-0.5 rounded text-[10px]">
                            {gameState.votes?.length || 0}/{Math.ceil((gameState.players.filter(p => !p.rank).length) / 2)}
                        </span>
                    </button>
                </div>
            )}

            {/* HUD */}
            {myPlayer && (
                <PlayerHUD
                    name={myPlayer.name}
                    rate={myPlayer.rate}
                    rank={myPlayer.rank}
                    onClick={() => setDetailPlayer(myPlayer)}
                    isMyTurn={isMyTurn}
                />
            )}

            {/* DETAILS MODAL */}
            <AnimatePresence>
                {detailPlayer && (
                    <PlayerDetailModal
                        player={detailPlayer}
                        onClose={() => setDetailPlayer(null)}
                    />
                )}
                {showHistory && (
                    <HistoryModal
                        players={stablePlayers}
                        history={gameState.history}
                        onClose={() => setShowHistory(false)}
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
                        <div className="flex gap-4 mt-12">
                            <button
                                onClick={() => {
                                    if (confirm("Return to Lobby? (This will reset the game for everyone)")) {
                                        resetGame(true);
                                    }
                                }}
                                className="px-8 py-3 bg-transparent border-2 border-red-500 text-red-400 rounded-full font-bold hover:bg-red-500/10 hover:text-red-300 transition-colors"
                            >
                                Return directly to Lobby
                            </button>
                            <button
                                onClick={() => resetGame(false)}
                                className="px-8 py-3 bg-white text-slate-900 rounded-full font-bold hover:scale-105 transition-transform"
                            >
                                Next Round
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
