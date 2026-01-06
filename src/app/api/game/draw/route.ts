import { NextResponse } from 'next/server';
import { gameStore } from '@/lib/serverStore';
import { discardPairs } from '@/lib/gameLogic';
import { calculateRateChange, applyRateChange } from '@/lib/rating';

export async function POST(request: Request) {
  const { playerId, targetPlayerId, cardIndex } = await request.json();
  
  const state = gameStore.getState();
  
  // Basic Validations
  if (state.phase !== 'PLAYING') {
    return NextResponse.json({ error: 'Game not in playing phase' }, { status: 400 });
  }

  if (state.currentTurnPlayerId !== playerId) {
    return NextResponse.json({ error: 'Not your turn' }, { status: 400 });
  }

  const currentPlayerIndex = state.players.findIndex(p => p.id === playerId);
  const targetPlayerIndex = state.players.findIndex(p => p.id === targetPlayerId);
  
  if (currentPlayerIndex === -1 || targetPlayerIndex === -1) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }
  
  const currentPlayer = state.players[currentPlayerIndex];
  const targetPlayer = state.players[targetPlayerIndex];

  // Logic: Draw card
  // If cardIndex is provided, use it (randomized or selected by UI).
  // If not, pick random.
  
  if (targetPlayer.hand.length === 0) {
     return NextResponse.json({ error: 'Target has no cards' }, { status: 400 });
  }

  const indexToDraw = cardIndex !== undefined ? cardIndex : Math.floor(Math.random() * targetPlayer.hand.length);
  const card = targetPlayer.hand[indexToDraw];

  // Remove form target
  const newTargetHand = [...targetPlayer.hand];
  newTargetHand.splice(indexToDraw, 1);
  
  // Add to current
  let newCurrentHand = [...currentPlayer.hand, card];
  
  // Discard pairs for current player
  newCurrentHand = discardPairs(newCurrentHand);

  // Update players in list
  const newPlayers = [...state.players];
  newPlayers[targetPlayerIndex] = { ...targetPlayer, hand: newTargetHand };
  newPlayers[currentPlayerIndex] = { ...currentPlayer, hand: newCurrentHand };

  // Check for players finishing (hand empty)
  // We need to assign ranks if they just emptied their hand
  
  // Helper to handle finishing
  // "Finished" means hand is empty.
  // Note: A player might finish by being drawn FROM (target) or by drawing (current).
  
  // We need to detect who finished THIS TURN.
  // Already finished players are skipped in check? No, they are already ranked.
  
  let finishedCount = state.players.filter(p => p.rank !== null).length;
  
  // Check Target first (if they ran out)
  if (newPlayers[targetPlayerIndex].hand.length === 0 && newPlayers[targetPlayerIndex].rank === null) {
      finishedCount++;
      newPlayers[targetPlayerIndex].rank = finishedCount;
      newPlayers[targetPlayerIndex].finishedAt = Date.now();
  }
  
  // Check Current second
  if (newPlayers[currentPlayerIndex].hand.length === 0 && newPlayers[currentPlayerIndex].rank === null) {
      finishedCount++;
      newPlayers[currentPlayerIndex].rank = finishedCount;
      newPlayers[currentPlayerIndex].finishedAt = Date.now();
  }
  
  // Check Game Over (Only 1 player left with cards = The loser, OR everyone finished?)
  // In Baba Nuki, the last person remaining has rankings = TotalPlayers
  // So if (TotalPlayers - FinishedPlayers) == 1, the last one is the loser.
  
  const activePlayers = newPlayers.filter(p => p.rank === null);
  let nextPhase: 'PLAYING' | 'FINISHED' = state.phase as 'PLAYING'; // We know it is PLAYING here due to check above

  
  if (activePlayers.length === 1) {
    // Game Over
    nextPhase = 'FINISHED';
    const loserIndex = newPlayers.findIndex(p => p.rank === null);
    finishedCount++;
    newPlayers[loserIndex].rank = finishedCount; // Last rank
    
    // Calculate Ratings
    const isFirstGame = state.roundCount === 0; // 0-indexed internal, usually 1-indexed for users but logic handles isFirstGame bool.
    // Actually roundCount starts at 0, increments on reset. 
    // IF roundCount == 0, it's first game.
    
    // We should iterate all players and update rates
    for (let i = 0; i < newPlayers.length; i++) {
        const p = newPlayers[i];
        if (p.rank) {
            const change = calculateRateChange(p.rate, p.rank, p.previousRank, isFirstGame);
            newPlayers[i] = applyRateChange(p, change);
            // newPlayers[i].previousRank = p.rank; // Will be set on reset? No, better set it here or on reset? 
            // The logic: "2nd Game... Rate change mechanism by rank fluctuation".
            // So we need previousRank to persist until next game calculation.
            // On reset, we copy rank to previousRank.
        }
    }
  } else {
    // Determine Next Turn
    // Simple logic: Next player in list who has cards.
    // If current player emptied hand, they are skipped.
    let nextTurnIndex = (currentPlayerIndex + 1) % newPlayers.length;
    while (newPlayers[nextTurnIndex].hand.length === 0) {
        nextTurnIndex = (nextTurnIndex + 1) % newPlayers.length;
    }
    gameStore.updateState({ currentTurnPlayerId: newPlayers[nextTurnIndex].id });
  }

  gameStore.updateState({
    players: newPlayers,
    phase: nextPhase,
  });

  return NextResponse.json(gameStore.getState());
}
