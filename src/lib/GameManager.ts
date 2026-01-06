
import { GameState, Player, Card } from '@/types/game';
import { calculateRateChange, applyRateChange } from './rating';
import { discardPairs } from './gameLogic';
import { v4 as uuidv4 } from 'uuid';
import { Server } from 'socket.io';
import db from '@/db';

export class GameManager {
    private state: GameState;
    roomId: string;
    io: Server;
    roomName: string;

    constructor(roomId: string, io: Server, roomName: string = "") {
        this.roomId = roomId;
        this.io = io;
        this.roomName = roomName;
        this.state = {
            id: roomId,
            phase: 'LOBBY',
            roomName,
            ownerId: '',
            players: [],
            currentTurnPlayerId: '',
            deck: [],
            winners: [],
            roundCount: 0,
            lastDiscard: null,
            targetPlayerId: null,
            votes: [],    // For AFK skipping
            history: [],   // For Score History
            messages: []
        };
    }

    // For Room List
    getSummary() {
        return {
            id: this.state.id,
            name: this.roomName,
            playerCount: this.state.players.length,
            phase: this.state.phase,
            round: this.state.roundCount
        };
    }

    postMessage(senderId: string, senderName: string, content: string, isSystem: boolean = false) {
        this.state.messages.push({
            id: uuidv4(),
            senderId,
            senderName,
            content,
            timestamp: Date.now(),
            isSystem
        });
        
        if (this.state.messages.length > 50) {
            this.state.messages.shift();
        }
    }

    getState(): GameState {
        return this.state;
    }

    // Spectator view logic: mask hands of others
    getMaskedState(): GameState {
        // Deep clone state to avoid mutating original
        const masked = JSON.parse(JSON.stringify(this.state)) as GameState;
        
        // Mask all hands (replace with empty objects or just keep length)
        // We'll keep the objects but remove suit/number for privacy
        // Ideally client just renders back if unknown.
        // But for safety, we should remove data.
        masked.players.forEach(p => {
             // We only need the count.
             // But the client code might expect 'Card' objects.
             // Let's replace suit/number with '?' or similar if we strictly want to hide.
             // BUT, useGame uses `p.hand.length`.
             // If we just want to hide content, we can set them to 'back'.
             // For now, let's trust the client not to "inspect element" CHEAT.
             // The user requested "All cards hidden, only count visible" for join-in-progress/spectator.
             // So we SHOULD scrub data.
             p.hand = p.hand.map(c => ({ 
                 id: c.id, 
                 suit: 'back' as any, // Special suit/number? Or just Keep ID
                 number: 0
             }));
        });
        
        // Also mask lastDiscard if it reveals too much? usually public info.
        return masked;
    }


    join(name: string, playerId?: string): Player {
        let pId = playerId || uuidv4();
        
        // 1. Try to load from DB
        const row = db.prepare('SELECT * FROM players WHERE id = ?').get(pId) as any;
        
        let rate = 1000;
        let rateHistory: number[] = [];

        if (row) {
            rate = row.rate;
            // Load history (last 10?)
            const historyRows = db.prepare('SELECT rate_after FROM player_history WHERE player_id = ? ORDER BY id DESC LIMIT 20').all(pId) as any[];
            rateHistory = historyRows.map(r => r.rate_after).reverse();
            // If name changed, update it?
            if (name && row.name !== name) {
                 db.prepare('UPDATE players SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(name, pId);
            }
        } else {
            // Create new player in DB
            try {
                db.prepare('INSERT INTO players (id, name, rate) VALUES (?, ?, ?)').run(pId, name, 1000);
            } catch (e) {
                console.error("Failed to insert player", e);
            }
        }
        
        // Also check if already in room memory (reconnect)
        const existing = this.state.players.find(p => p.id === pId);
        if (existing) return existing;

        const newPlayer: Player = {
            id: pId,
            name,
            hand: [],
            rank: null,
            previousRank: null,
            rate,
            rateHistory,
            isBot: false,
            finishedAt: null
        };

        this.state.players.push(newPlayer);
        
        // Assign owner if first player
        if (!this.state.ownerId || this.state.players.length === 1) {
            this.state.ownerId = newPlayer.id;
        }

        return newPlayer;
    }

    // ... 

    private calculateRatings() {
        const isFirstGame = this.state.roundCount === 0;
        const gameId = uuidv4(); // Unique ID for this specific round result

        // Transaction to ensure data integrity
        const updateStmt = db.prepare('UPDATE players SET rate = ?, matches = matches + 1, wins = wins + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        const historyStmt = db.prepare('INSERT INTO player_history (player_id, game_id, rate_before, rate_after, rank) VALUES (?, ?, ?, ?, ?)');

        for (let i = 0; i < this.state.players.length; i++) {
            const p = this.state.players[i];
            if (p.rank) {
                const oldRate = p.rate;
                const change = calculateRateChange(p.rate, p.rank, p.previousRank, isFirstGame);
                const newPlayer = applyRateChange(p, change);
                
                this.state.players[i] = newPlayer;

                // DB Update
                try {
                    const isWin = p.rank === 1 ? 1 : 0;
                    updateStmt.run(newPlayer.rate, isWin, newPlayer.id);
                    historyStmt.run(newPlayer.id, gameId, oldRate, newPlayer.rate, p.rank);
                } catch (e) {
                    console.error("DB Update Failed for player", p.name, e);
                }
            }
        }
        
        // Save Game Result Metadata
        try {
             db.prepare('INSERT INTO game_results (id, room_id, details) VALUES (?, ?, ?)').run(
                 gameId, 
                 this.roomId, 
                 JSON.stringify(this.state.players.map(p => ({ id: p.id, name: p.name, rank: p.rank, rate: p.rate })))
             );
        } catch(e) { console.error(e); }
    }

    leave(playerId: string) {
        // Don't remove immediately to allow reconnect?
        // Or remove if LOBBY.
        if (this.state.phase === 'LOBBY') {
             this.state.players = this.state.players.filter(p => p.id !== playerId);
             
             // Reassign owner if owner left
             if (this.state.ownerId === playerId) {
                 if (this.state.players.length > 0) {
                     this.state.ownerId = this.state.players[0].id;
                 } else {
                     this.state.ownerId = '';
                 }
             }
        }
    }

    kick(actorId: string, targetId: string) {
        // Only owner can kick -> Now everyone can kick
        // if (this.state.ownerId !== actorId) return;
        // Cannot kick self (use leave instead)
        if (actorId === targetId) return;
        // Game must be in LOBBY
        if (this.state.phase !== 'LOBBY') return;

        const targetPlayer = this.state.players.find(p => p.id === targetId);
        if (targetPlayer) {
            // Remove player
            this.state.players = this.state.players.filter(p => p.id !== targetId);
            
            this.postMessage('system', 'System', `${targetPlayer.name} was kicked by room owner.`, true);
        }
    }

    updateRoomName(name: string) {
        if (!name || name.length > 20) return;
        this.roomName = name;
        this.state.roomName = name;
    }

    start() {
        if (this.state.players.length < 2) return;
        
        // ... (shuffling etc)
        
        // Reset Votes
        this.state.votes = [];

        // 1. Create Deck
        const suits = ['spade', 'heart', 'diamond', 'club'] as const;
        const deck: Card[] = [];
        suits.forEach(suit => {
            for (let i = 1; i <= 13; i++) {
                deck.push({ suit, number: i, id: uuidv4() });
            }
        });
        deck.push({ suit: 'joker', number: 0, id: uuidv4() });

        // 2. Shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        // 3. Deal
        this.state.players.forEach(p => p.hand = []);
        let pIdx = 0;
        deck.forEach(card => {
            if (this.state.players[pIdx]) {
                this.state.players[pIdx].hand.push(card);
                pIdx = (pIdx + 1) % this.state.players.length;
            }
        });

        // 4. Discard Pairs
        this.state.players = this.state.players.map(p => {
             const { hand } = discardPairs(p.hand);
             return {
                ...p,
                hand,
                rank: null,
                finishedAt: null
            };
        });

        this.state.phase = 'PLAYING';
        this.state.currentTurnPlayerId = this.state.players[0].id;
        this.state.lastDiscard = null;
        this.updateTarget(this.state.currentTurnPlayerId);
        
        this.startTurnTimer();
    }

    voteToSkip(voterId: string) {
        if (this.state.phase !== 'PLAYING') return;
        
        // Add vote if not exists
        if (!this.state.votes?.includes(voterId)) {
            this.state.votes = [...(this.state.votes || []), voterId];
        }

        // Check Threshold: Majority of active players (ceil to allow 1/2 players to kick in 2p game)
        const activePlayers = this.state.players.filter(p => !p.rank);
        const threshold = Math.ceil(activePlayers.length / 2);

        if (this.state.votes.length >= threshold) {
            // Force Draw!
            this.forceRandomDraw();
            this.state.votes = []; // Reset votes
        }
    }

    forceRandomDraw() {
        if (!this.state.currentTurnPlayerId || !this.state.targetPlayerId) return;
        
        // Perform draw with ANY card index
        console.log("Force Random Draw Executed");
        // We can just call draw with random index logic which is inside draw() if index undefined
        this.draw(this.state.currentTurnPlayerId, this.state.targetPlayerId);
    }

    draw(playerId: string, targetPlayerId: string, cardIndex?: number) {
        this.stopTurnTimer(); // Stop timer on action

        if (this.state.phase !== 'PLAYING') return;
        if (this.state.currentTurnPlayerId !== playerId) return;

        // ... (draw logic)

        const currentPlayerIndex = this.state.players.findIndex(p => p.id === playerId);
        const targetPlayerIndex = this.state.players.findIndex(p => p.id === targetPlayerId);
        
        if (currentPlayerIndex === -1 || targetPlayerIndex === -1) return;

        const targetPlayer = this.state.players[targetPlayerIndex];
        if (targetPlayer.hand.length === 0) return;

        // Draw Logic
        // If cardIndex is invalid or missing, random
        let indexToDraw = cardIndex;
        if (indexToDraw === undefined || indexToDraw < 0 || indexToDraw >= targetPlayer.hand.length) {
            indexToDraw = Math.floor(Math.random() * targetPlayer.hand.length);
        }

        const card = targetPlayer.hand[indexToDraw];
        if (card.isHighlighted) delete card.isHighlighted;

        const newTargetHand = [...targetPlayer.hand];
        newTargetHand.splice(indexToDraw, 1);
        
        let newCurrentHand = [...this.state.players[currentPlayerIndex].hand, card];
        const { hand: processedHand, discarded } = discardPairs(newCurrentHand);

        this.state.players[targetPlayerIndex].hand = newTargetHand;
        this.state.players[currentPlayerIndex].hand = processedHand;

        if (discarded.length > 0) {
            this.state.lastDiscard = {
                playerId,
                cards: discarded.map(c => ({ ...c }))
            };
        } else {
            this.state.lastDiscard = null;
        }

        this.checkFinished();

        if (this.state.phase === 'PLAYING') {
            this.advanceTurn(currentPlayerIndex);
        }
        
        // Reset votes on successful turn
        this.state.votes = [];
    }

    tease(playerId: string, cardIndex: number) {
         const pIdx = this.state.players.findIndex(p => p.id === playerId);
         if (pIdx === -1) return;
         
         const player = this.state.players[pIdx];
         if (!player.hand[cardIndex]) return;

         const isHi = !!player.hand[cardIndex].isHighlighted;
         player.hand[cardIndex].isHighlighted = !isHi;
    }

    private checkFinished() {
         let finishedCount = this.state.players.filter(p => p.rank !== null).length;
         
         for (let i = 0; i < this.state.players.length; i++) {
             const p = this.state.players[i];
             if (p.rank === null && p.hand.length === 0) {
                 finishedCount++;
                 p.rank = finishedCount;
                 p.finishedAt = Date.now();
             }
         }

         const activePlayers = this.state.players.filter(p => p.rank === null);
         if (activePlayers.length <= 1) {
             this.state.phase = 'FINISHED';
             if (activePlayers.length === 1) {
                 finishedCount++;
                 activePlayers[0].rank = finishedCount;
                 activePlayers[0].finishedAt = Date.now();
             }
             this.calculateRatings();
             this.saveHistory(); // Save score history
         }
    }

    private saveHistory() {
        // Add current game result to history
        const result = {
            round: this.state.roundCount + 1,
            date: new Date().toISOString(),
            standings: this.state.players.map(p => ({
                name: p.name,
                rank: p.rank!,
                rate: p.rate,
                diff: p.rate - (p.rateHistory[p.rateHistory.length - 2] || 100)
            }))
        };
        this.state.history = [...(this.state.history || []), result];
    }

    private advanceTurn(currentIndex: number) {
        let nextIndex = (currentIndex + 1) % this.state.players.length;
        let loops = 0;
        while (this.state.players[nextIndex].hand.length === 0 && loops < this.state.players.length) {
            nextIndex = (nextIndex + 1) % this.state.players.length;
            loops++;
        }
        
        let nextPlayerId = '';
        if (loops < this.state.players.length) {
            nextPlayerId = this.state.players[nextIndex].id;
        } else {
             return; 
        }

        this.state.currentTurnPlayerId = nextPlayerId;
        this.updateTarget(nextPlayerId);
        
        this.startTurnTimer();
    }
    
    private updateTarget(currentTurnPlayerId: string) {
        const currentIdx = this.state.players.findIndex(p => p.id === currentTurnPlayerId);
        if (currentIdx === -1) return;

        let targetIndex = (currentIdx + 1) % this.state.players.length;
        let loops = 0;
        
        while (
            (this.state.players[targetIndex].hand.length === 0 || this.state.players[targetIndex].id === currentTurnPlayerId) 
            && loops < this.state.players.length
        ) {
            targetIndex = (targetIndex + 1) % this.state.players.length;
            loops++;
        }

        if (loops < this.state.players.length) {
            this.state.targetPlayerId = this.state.players[targetIndex].id;
        } else {
            this.state.targetPlayerId = null;
        }
    }

    reset(hardReset: boolean) {
        this.stopTurnTimer(); // Stop any active timer
        if (hardReset) {
             // Do NOT clear players, just reset their state
             // this.state.players = []; 
             this.state.phase = 'LOBBY';
             this.state.roundCount = 0;
             this.state.deck = [];
             this.state.currentTurnPlayerId = '';
             this.state.history = [];
             this.state.votes = [];

             // Reset Player State
             this.state.players.forEach(p => {
                 p.hand = [];
                 p.rank = null;
                 p.previousRank = null; // Clear previous rank on hard reset
                 p.finishedAt = null;
                 // Keep rate/rateHistory? Yes, usually persistent.
             });
        } else {
            this.state.roundCount++;
            
            this.state.players.forEach(p => {
                p.previousRank = p.rank;
                p.rank = null;
                p.hand = [];
                p.finishedAt = null;
            });
            
            // Auto-start next round immediately
            this.start();
        }
    }

    private turnTimer: NodeJS.Timeout | null = null;

    private startTurnTimer() {
        this.stopTurnTimer();
        if (this.state.phase !== 'PLAYING') return;

        console.log(`Starting turn timer for ${this.state.currentTurnPlayerId}`);
        this.turnTimer = setTimeout(() => {
            console.log("Turn Timer Expired! Forcing Draw...");
            this.forceRandomDraw();
            // Since this is async/background, we must broadcast the update manually
            this.io.to(this.roomId).emit('update', this.state);
        }, 30000); // 30 seconds
    }

    private stopTurnTimer() {
        if (this.turnTimer) {
            clearTimeout(this.turnTimer);
            this.turnTimer = null;
        }
    }
}
