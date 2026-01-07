import db from '@/db';
import { Player } from '@/types/game';

export interface PlayerData {
    id: string;
    name: string;
    rate: number;
    matches: number;
    wins: number;
}

export class PlayerRepository {
    static getPlayer(id: string): PlayerData | undefined {
        try {
            return db.prepare('SELECT * FROM players WHERE id = ?').get(id) as PlayerData;
        } catch (e) {
            console.error('Failed to get player:', e);
            return undefined;
        }
    }

    static createPlayer(id: string, name: string, initialRate: number = 1000): void {
        try {
            db.prepare('INSERT INTO players (id, name, rate) VALUES (?, ?, ?)').run(id, name, initialRate);
        } catch (e) {
            console.error('Failed to create player:', e);
        }
    }

    static updatePlayerName(id: string, name: string): void {
        try {
            db.prepare('UPDATE players SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(name, id);
        } catch (e) {
            console.error('Failed to update player name:', e);
        }
    }

    static updatePlayerRate(id: string, newRate: number, isWin: boolean): void {
        try {
            db.prepare('UPDATE players SET rate = ?, matches = matches + 1, wins = wins + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
              .run(newRate, isWin ? 1 : 0, id);
        } catch (e) {
            console.error('Failed to update player rate:', e);
        }
    }

    static getRecentRateHistory(playerId: string, limit: number = 20): number[] {
        try {
            const historyRows = db.prepare('SELECT rate_after FROM player_history WHERE player_id = ? ORDER BY id DESC LIMIT ?').all(playerId, limit) as any[];
            return historyRows.map(r => r.rate_after).reverse();
        } catch (e) {
            console.error('Failed to get rate history:', e);
            return [];
        }
    }

    static addGameHistory(playerId: string, gameId: string, rateBefore: number, rateAfter: number, rank: number): void {
        try {
            db.prepare('INSERT INTO player_history (player_id, game_id, rate_before, rate_after, rank) VALUES (?, ?, ?, ?, ?)')
              .run(playerId, gameId, rateBefore, rateAfter, rank);
        } catch (e) {
            console.error('Failed to add game history:', e);
        }
    }

    static saveGameResult(gameId: string, roomId: string, details: string): void {
        try {
             db.prepare('INSERT INTO game_results (id, room_id, details) VALUES (?, ?, ?)').run(gameId, roomId, details);
        } catch(e) { 
            console.error('Failed to save game result:', e); 
        }
    }
}
