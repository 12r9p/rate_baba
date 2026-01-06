export type Suit = 'spade' | 'heart' | 'diamond' | 'club' | 'joker';

export type Card = {
  id: string;
  suit: Suit;
  number: number; // 0 for Joker, 1-13 for others
};

export type Player = {
  id: string;
  name: string;
  hand: Card[];
  rank: number | null; // 1st, 2nd, etc. 
  previousRank: number | null; // For calculating rate change
  rate: number;
  rateHistory: number[]; // To show graph or list of changes
  isBot: boolean;
  finishedAt: number | null; // Timestamp or order index when they finished
};

export type GamePhase = 'LOBBY' | 'DEALING' | 'PLAYING' | 'FINISHED';

export type GameState = {
  id: string;
  phase: GamePhase;
  players: Player[];
  currentTurnPlayerId: string | null;
  deck: Card[];
  roundCount: number; // How many games played
};
