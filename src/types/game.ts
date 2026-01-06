export type Suit = 'spade' | 'heart' | 'diamond' | 'club' | 'joker' | 'back';

export interface Card {
  id: string;
  suit: Suit;
  number: number;
  isHighlighted?: boolean;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  rank: number | null;
  previousRank: number | null;
  rate: number;
  rateHistory: number[];
  isBot: boolean;
  finishedAt: number | null;
}

export interface GameResult {
    round: number;
    date: string;
    standings: {
        name: string;
        rank: number;
        rate: number;
        diff: number;
    }[];
}

export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: number;
    isSystem: boolean;
}

export interface GameState {
  id: string;
  phase: 'LOBBY' | 'PLAYING' | 'FINISHED';

  ownerId: string;
  players: Player[];
  currentTurnPlayerId: string;
  deck: Card[];
  winners: Player[];
  roundCount: number;
  lastDiscard: {
    playerId: string;
    cards: Card[];
  } | null;
  targetPlayerId: string | null;
  votes: string[]; // List of IDs who voted to skip
  history: GameResult[]; // Past game results
  messages: ChatMessage[];
}
