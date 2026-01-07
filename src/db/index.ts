import path from 'path';
import fs from 'fs';

let db: any;

try {
    const { Database } = require("bun:sqlite");
    
    const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'game.db');
    
    // Ensure directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
    
    db = new Database(dbPath, { create: true });
    
    // Initialize Tables
    db.exec(`
        CREATE TABLE IF NOT EXISTS players (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            rate INTEGER DEFAULT 1000,
            matches INTEGER DEFAULT 0,
            wins INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS game_results (
            id TEXT PRIMARY KEY,
            room_id TEXT NOT NULL,
            started_at DATETIME,
            ended_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            details TEXT -- JSON string of rankings/details
        );

        CREATE TABLE IF NOT EXISTS player_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id TEXT NOT NULL,
            game_id TEXT,
            rate_before INTEGER,
            rate_after INTEGER,
            rank INTEGER,
            recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(player_id) REFERENCES players(id)
        );
    `);
    console.log("Database initialized at", dbPath);

} catch (e) {
    console.warn("Could not load bun:sqlite. This is expected during build if not running in Bun.", e);
    // Mock DB for build time
    db = {
        prepare: () => ({ all: () => [], get: () => null, run: () => {} }),
        exec: () => {},
        transaction: (fn: any) => fn,
    };
}

export default db;
