import { Card, Player, Suit } from '@/types/game';
import { v4 as uuidv4 } from 'uuid';

export function createDeck(): Card[] {
  const suits: Suit[] = ['spade', 'heart', 'diamond', 'club'];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (let i = 1; i <= 13; i++) {
      deck.push({
        id: uuidv4(),
        suit,
        number: i,
      });
    }
  }
  // Add Joker
  deck.push({
    id: uuidv4(),
    suit: 'joker',
    number: 0,
  });

  return shuffle(deck);
}

function shuffle(array: Card[]): Card[] {
  let currentIndex = array.length,  randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    const temp = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temp;
  }
  return array;
}

export function dealCards(players: Player[], deck: Card[]): { players: Player[], deck: Card[] } {
  let currentCardIndex = 0;
  const numPlayers = players.length;
  const newPlayers = players.map(p => ({ ...p, hand: [] as Card[] })); // Reset hands

  while (currentCardIndex < deck.length) {
    for (let i = 0; i < numPlayers; i++) {
      if (currentCardIndex >= deck.length) break;
      newPlayers[i].hand.push(deck[currentCardIndex]);
      currentCardIndex++;
    }
  }

  return { players: newPlayers, deck: [] };
}

export function discardPairs(hand: Card[]): { hand: Card[]; discarded: Card[] } {
  const newHand: Card[] = [];
  const discarded: Card[] = [];
  const checked = new Set<string>();

  for (let i = 0; i < hand.length; i++) {
    if (checked.has(hand[i].id)) continue;
    
    let pairIndex = -1;
    // Joker has no pair
    if (hand[i].suit !== 'joker') {
       pairIndex = hand.findIndex((c, idx) => 
         idx > i && c.number === hand[i].number && c.suit !== 'joker' && !checked.has(c.id)
       );
    }

    if (pairIndex !== -1) {
      // Found pair, discard both
      checked.add(hand[i].id);
      checked.add(hand[pairIndex].id);
      discarded.push(hand[i], hand[pairIndex]);
    } else {
      newHand.push(hand[i]);
    }
  }
  return { hand: newHand, discarded };
}
