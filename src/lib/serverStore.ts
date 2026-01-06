import { GameState, Player, Card, Suit } from '@/types/game';
import { v4 as uuidv4 } from 'uuid';

// Global variable to persist across hot reloads in dev (mostly)
declare global {
  var __GAME_STORE__: GameState | undefined;
}

const INITIAL_STATE: GameState = {
  id: 'default-game',
  phase: 'LOBBY',
  players: [],
  currentTurnPlayerId: null,
  deck: [],
  roundCount: 0,
};

export class GameStore {
  private get state(): GameState {
    if (!global.__GAME_STORE__) {
      global.__GAME_STORE__ = JSON.parse(JSON.stringify(INITIAL_STATE));
    }
    return global.__GAME_STORE__!;
  }

  private set state(newState: GameState) {
    global.__GAME_STORE__ = newState;
  }

  getState() {
    return this.state;
  }

  addPlayer(name: string): Player {
    const newPlayer: Player = {
      id: uuidv4(),
      name,
      hand: [],
      rank: null,
      previousRank: null,
      rate: 100,
      rateHistory: [100],
      isBot: false,
      finishedAt: null,
    };
    
    this.state = {
      ...this.state,
      players: [...this.state.players, newPlayer],
    };
    return newPlayer;
  }

  resetGame(hardReset: boolean = false) {
    if (hardReset) {
      this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
    } else {
      // Soft reset: Keep players and rates, reset hands and ranks for next round
      this.state = {
        ...this.state,
        phase: 'LOBBY', // Or go strictly to DEALING if we auto-start
        currentTurnPlayerId: null,
        deck: [],
        players: this.state.players.map(p => ({
          ...p,
          hand: [],
          previousRank: p.rank, // Store rank as previous
          rank: null,
          finishedAt: null,
        })),
        roundCount: this.state.roundCount + 1,
      };
    }
  }

  updateState(partial: Partial<GameState>) {
    this.state = { ...this.state, ...partial };
  }

  updatePlayer(playerId: string, partial: Partial<Player>) {
    this.state = {
      ...this.state,
      players: this.state.players.map(p => 
        p.id === playerId ? { ...p, ...partial } : p
      ),
    };
  }
}

export const gameStore = new GameStore();
