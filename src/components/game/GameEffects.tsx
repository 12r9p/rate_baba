'use client';

import { DealingAnimation } from "@/components/DealingAnimation";
import { DiscardAnimation } from "@/components/DiscardAnimation";
import { GameState } from "@/types/game";
import { clsx } from "clsx";

interface GameEffectsProps {
    gameState: GameState;
    myPlayerId: string | null;
    playedIntro: boolean;
    setPlayedIntro: (played: boolean) => void;
    isDrawingPhase: boolean;
}

export function GameEffects({ gameState, myPlayerId, playedIntro, setPlayedIntro, isDrawingPhase }: GameEffectsProps) {
    return (
        <>
            {!playedIntro && <DealingAnimation onComplete={() => setPlayedIntro(true)} />}

            {/* BACKGROUND RAIL */}
            <div className="absolute top-5 left-0 w-full h-px bg-slate-200 -z-0" />

            {/* SPOTLIGHT BACKDROP */}
            <div
                className={clsx(
                    "fixed inset-0 bg-black/60 z-30 transition-opacity duration-500",
                    isDrawingPhase ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
            />

            {/* DISCARD ANIMATION */}
            <DiscardAnimation lastDiscard={gameState?.lastDiscard || null} myPlayerId={myPlayerId || undefined} />
        </>
    );
}
