import { NextResponse } from 'next/server';
import { gameStore } from '@/lib/serverStore';
import { createDeck, dealCards, discardPairs } from '@/lib/gameLogic';

export async function POST() {
  const state = gameStore.getState();
  
  if (state.players.length < 2) {
    return NextResponse.json({ error: 'Need at least 2 players' }, { status: 400 });
  }

  // 1. Create and Shuffle Deck
  const deck = createDeck();
  
  // 2. Deal Cards
  let { players } = dealCards(state.players, deck); // deck is empty after deal
  
  // 3. Auto-discard pairs for all players
  players = players.map(p => ({
    ...p,
    hand: discardPairs(p.hand)
  }));

  // 4. Update phase and turn
  gameStore.updateState({
    phase: 'PLAYING',
    players: players,
    deck: [], // Cleared
    currentTurnPlayerId: players[0].id, // Start with first player
    // Note: In real Baba Nuki, usually starts with person who has Baba? Or random?
    // Let's just sequential from player 0 for simplicity.
  });

  return NextResponse.json(gameStore.getState());
}
